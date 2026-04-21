/* ── Competitive Analysis Orchestrator — staged pipeline ──── */

import type {
  CompetitiveAnalysisRequest,
  CompetitiveAnalysisBrief,
  BriefSource,
  NormalizedEvidence,
  SearchTask,
} from '../contracts'
import { CompetitiveSynthesisSchema } from '../contracts'
import { runStep, generateBriefId, type PipelineContext } from '../pipeline'
import { synthesizeWithSchema } from '../models'
import { rankEvidence, extractQueryTerms } from '../ranker'
import { COMPETITIVE_SYSTEM_PROMPT, COMPETITIVE_SCHEMA_DESC, buildCompetitivePrompt } from '../prompts/competitive.v1'
import { searchExaSnapshot } from '../providers/exa'
import { buildResearchSearchPlan, executeSearchPlan } from '../search-planner'
import {
  normalizeExaSnapshot,
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

  /* ── Step 2: planSearches ───────────────────────────────── */
  const fallbackSearches: SearchTask[] = [
    ...limitedCompetitors.map((competitor) => ({
      provider: 'exa' as const,
      type: 'news' as const,
      query: `${competitor} ${input.focusArea} recent product pricing customer moves`,
      purpose: `Find recent evidence for ${competitor} in ${input.focusArea}.`,
      lookbackDays: 90,
      category: 'news' as const,
    })),
    {
      provider: 'tavily',
      type: 'tavily_news',
      query: `${limitedCompetitors.join(' vs ')} ${input.focusArea} comparison customer segment`,
      purpose: 'Find cross-source competitive comparisons and market perception.',
      topic: 'general',
      timeRange: 'month',
      includeImages: true,
    },
    {
      provider: 'tavily',
      type: 'tavily_news',
      query: `${limitedCompetitors.join(' ')} risks weaknesses pricing complaints`,
      purpose: 'Find counter-evidence, objections, and weaknesses.',
      topic: 'general',
      timeRange: 'month',
      includeImages: false,
    },
  ]

  if (input.yourCompany) {
    fallbackSearches.push({
      provider: 'exa',
      type: 'news',
      query: `${input.yourCompany} ${limitedCompetitors.join(' ')} competitive positioning ${input.focusArea}`,
      purpose: 'Compare the user company against named competitors.',
      lookbackDays: 120,
    })
  }

  if (input.marketSegment || input.customerType || input.geography) {
    fallbackSearches.push({
      provider: 'tavily',
      type: 'tavily_news',
      query: `${limitedCompetitors.join(' ')} ${input.marketSegment ?? ''} ${input.customerType ?? ''} ${input.geography ?? ''} buying criteria`,
      purpose: 'Ground the analysis in the requested segment, buyer, and geography.',
      topic: 'general',
      timeRange: 'month',
      includeImages: true,
    })
  }

  const planStep = await runStep('competitive_analysis', 'planSearches', async () => (
    buildResearchSearchPlan('competitive_analysis', input, fallbackSearches, ctx)
  ), undefined, ctx)

  const researchPlan = planStep.data

  /* ── Step 3: gatherEvidence ──────────────────────────────── */
  const evidenceStep = await runStep('competitive_analysis', 'gatherEvidence', async () => {
    const allSources: BriefSource[] = []
    const allEvidence: NormalizedEvidence[] = []

    const planned = researchPlan ? await executeSearchPlan(researchPlan) : { sources: [], evidence: [] }
    allSources.push(...planned.sources)
    allEvidence.push(...planned.evidence)

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
      marketSegment: input.marketSegment,
      geography: input.geography,
      customerType: input.customerType,
      useCasePreset: input.useCasePreset,
      steering: input.steering,
      userContext: input.userContext,
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
  if (dedupedSources.length < 4) degradedReasons.push('Low source count')
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
    researchPlan,
    contextUsed: input.userContext ?? null,
    status: {
      degraded: degradedReasons.length > 0,
      reasons: degradedReasons,
      exaSearchMs: entityStep.timings.durationMs,
      tavilySearchMs: planStep.timings.durationMs + evidenceStep.timings.durationMs,
      synthesisMs: synthesisStep.timings.durationMs,
      totalMs,
      sourceCount: dedupedSources.length,
      cached: false,
      synthesisModel: synthesis?.model ?? null,
    },
  }
}
