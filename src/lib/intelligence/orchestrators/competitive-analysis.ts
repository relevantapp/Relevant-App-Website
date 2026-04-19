/* ── Competitive Analysis Orchestrator — staged pipeline ──── */

import type {
  CompetitiveAnalysisRequest,
  CompetitiveAnalysisBrief,
  BriefSource,
  NormalizedEvidence,
} from '../contracts'
import { CompetitiveSynthesisSchema } from '../contracts'
import { runStep, generateBriefId, type PipelineContext } from '../pipeline'
import { synthesizeWithSchema } from '../models'
import { rankEvidence, extractQueryTerms } from '../ranker'
import { COMPETITIVE_SYSTEM_PROMPT, COMPETITIVE_SCHEMA_DESC, buildCompetitivePrompt } from '../prompts/competitive.v1'
import { searchExaSnapshot, searchExaNews } from '../providers/exa'
import { searchTavilyNews } from '../providers/tavily'
import {
  normalizeExaSnapshot,
  normalizeExaResults,
  normalizeTavilyResults,
  deduplicateSources,
  resetSourceCounter,
} from '../normalize'

export async function generateCompetitiveAnalysisBrief(
  input: CompetitiveAnalysisRequest,
  ctx?: PipelineContext
): Promise<CompetitiveAnalysisBrief> {
  const totalStart = performance.now()
  resetSourceCounter()

  const limitedCompetitors = input.competitors.slice(0, 3)
  const degradedReasons: string[] = []

  /* ── Step 1: resolveEntity ───────────────────────────────── */
  const entityStep = await runStep('competitive_analysis', 'resolveEntity', async () => {
    const snapshots = new Map<string, string>()
    let yourSnapshot: string | null = null

    const jobs = [
      ...limitedCompetitors.map((c) => ({ type: 'competitor' as const, name: c })),
      ...(input.yourCompany ? [{ type: 'your' as const, name: input.yourCompany }] : []),
    ]

    const results = await Promise.allSettled(
      jobs.map((j) => searchExaSnapshot(j.name))
    )

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i]
      const result = results[i]
      if (result.status === 'fulfilled' && result.value) {
        if (job.type === 'your') {
          yourSnapshot = result.value.description || job.name
        } else {
          snapshots.set(job.name, result.value.description || job.name)
        }
      }
    }

    return { snapshots, yourSnapshot }
  }, undefined, ctx)

  const competitorSnapshots = entityStep.data?.snapshots ?? new Map<string, string>()
  const yourSnapshot = entityStep.data?.yourSnapshot ?? null

  /* ── Step 2: gatherEvidence ──────────────────────────────── */
  const evidenceStep = await runStep('competitive_analysis', 'gatherEvidence', async () => {
    const allSources: BriefSource[] = []
    const allEvidence: NormalizedEvidence[] = []

    const searchJobs: Array<Promise<unknown>> = [
      ...limitedCompetitors.map((c) => searchExaNews(c, 30)),
      searchTavilyNews(limitedCompetitors.join(' vs ')),
    ]

    if (input.focusArea !== 'overall') {
      for (const c of limitedCompetitors) {
        searchJobs.push(searchTavilyNews(`${c} ${input.focusArea}`))
      }
    }

    const results = await Promise.allSettled(searchJobs)
    let idx = 0

    // Exa news per competitor
    for (let i = 0; i < limitedCompetitors.length; i++) {
      const r = results[idx++]
      if (r.status === 'fulfilled' && r.value) {
        const { sources, evidence } = normalizeExaResults(r.value as Awaited<ReturnType<typeof searchExaNews>>)
        allSources.push(...sources)
        allEvidence.push(...evidence)
      }
    }

    // Cross-comparison (Tavily)
    const crossResult = results[idx++]
    if (crossResult.status === 'fulfilled' && crossResult.value) {
      const tavily = crossResult.value as Awaited<ReturnType<typeof searchTavilyNews>>
      const { sources, evidence } = normalizeTavilyResults(tavily.results)
      allSources.push(...sources)
      allEvidence.push(...evidence)
    }

    // Focus-area searches
    if (input.focusArea !== 'overall') {
      for (let i = 0; i < limitedCompetitors.length; i++) {
        const r = results[idx++]
        if (r.status === 'fulfilled' && r.value) {
          const tavily = r.value as Awaited<ReturnType<typeof searchTavilyNews>>
          const { sources, evidence } = normalizeTavilyResults(tavily.results)
          allSources.push(...sources)
          allEvidence.push(...evidence)
        }
      }
    }

    // Also add snapshot sources
    for (const [name] of Array.from(competitorSnapshots)) {
      const snap = entityStep.data?.snapshots.get(name)
      if (snap) {
        const { source, evidence } = normalizeExaSnapshot({
          name, description: snap, sourceUrl: null,
          industry: undefined, headquarters: undefined, employeeCount: undefined,
          fundingStage: undefined, lastFundingAmount: undefined, ceo: undefined, recentMilestone: undefined,
          raw: null,
        })
        if (source) allSources.push(source)
        if (evidence) allEvidence.push(evidence)
      }
    }

    return { sources: allSources, evidence: allEvidence }
  }, undefined, ctx)

  const allSources = evidenceStep.data?.sources ?? []
  const allEvidence = evidenceStep.data?.evidence ?? []

  /* ── Step 3: rankEvidence ────────────────────────────────── */
  const rankStep = await runStep('competitive_analysis', 'rankEvidence', async () => {
    const queryTerms = extractQueryTerms(
      `${limitedCompetitors.join(' ')} ${input.focusArea} ${input.yourCompany ?? ''}`
    )
    return rankEvidence(allEvidence, { topN: 8, queryTerms })
  }, undefined, ctx)

  const rankedEvidence = rankStep.data ?? allEvidence

  /* ── Step 4: synthesize ──────────────────────────────────── */
  const synthesisStep = await runStep('competitive_analysis', 'synthesize', async () => {
    const userPrompt = buildCompetitivePrompt({
      competitors: limitedCompetitors,
      yourCompany: input.yourCompany,
      focusArea: input.focusArea,
      specificQuestions: input.specificQuestions,
      evidence: rankedEvidence,
      competitorSnapshots,
      yourSnapshot,
    })
    return synthesizeWithSchema(
      COMPETITIVE_SYSTEM_PROMPT, userPrompt,
      CompetitiveSynthesisSchema, COMPETITIVE_SCHEMA_DESC, 'competitive_analysis',
      ctx?.preferredModel
    )
  }, undefined, ctx)

  const synthesis = synthesisStep.data
  if (!synthesis?.data) degradedReasons.push('AI synthesis failed')

  /* ── Step 5: assembleBrief ───────────────────────────────── */
  const dedupedSources = deduplicateSources(allSources)
  const totalMs = Math.round(performance.now() - totalStart)

  return {
    id: generateBriefId(),
    researchType: 'competitive_analysis',
    generatedAt: new Date().toISOString(),
    headline: synthesis?.data?.headline ?? 'Unable to generate competitive analysis',
    bottomLine: synthesis?.data?.bottomLine ?? 'AI synthesis failed. Raw evidence is still available.',
    whyItMatters: synthesis?.data?.whyItMatters ?? null,
    confidence: synthesis?.data?.confidence ?? 'low',
    yourCompany: input.yourCompany ?? null,
    competitors: synthesis?.data?.competitors ?? [],
    comparisonMatrix: synthesis?.data?.comparisonMatrix ?? [],
    sections: {
      keyFindings: synthesis?.data?.keyFindings ?? [],
      strategicImplications: synthesis?.data?.strategicImplications ?? [],
      recommendations: synthesis?.data?.recommendations ?? [],
    },
    sources: dedupedSources,
    status: {
      degraded: degradedReasons.length > 0,
      reasons: degradedReasons,
      exaSearchMs: entityStep.timings.durationMs,
      tavilySearchMs: evidenceStep.timings.durationMs,
      synthesisMs: synthesisStep.timings.durationMs,
      totalMs,
      sourceCount: dedupedSources.length,
      cached: false,
      synthesisModel: synthesis?.model ?? null,
    },
  }
}
