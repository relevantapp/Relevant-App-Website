/* ── Business Case Orchestrator — staged pipeline ─────────── */

import type {
  BusinessCaseRequest,
  BusinessCaseBrief,
  BriefSource,
  NormalizedEvidence,
} from '../contracts'
import { BusinessCaseSynthesisSchema } from '../contracts'
import { runStep, generateBriefId, type PipelineContext } from '../pipeline'
import { synthesizeWithSchema } from '../models'
import { rankEvidence, extractQueryTerms } from '../ranker'
import { BUSINESS_CASE_SYSTEM_PROMPT, BUSINESS_CASE_SCHEMA_DESC, buildBusinessCasePrompt } from '../prompts/business-case.v1'
import { searchExaSnapshot, searchExaNews } from '../providers/exa'
import { searchTavilyNews } from '../providers/tavily'
import {
  normalizeExaSnapshot,
  normalizeExaResults,
  normalizeTavilyResults,
  deduplicateSources,
  resetSourceCounter,
} from '../normalize'

export async function generateBusinessCaseBrief(
  input: BusinessCaseRequest,
  ctx?: PipelineContext
): Promise<BusinessCaseBrief> {
  const totalStart = performance.now()
  resetSourceCounter()

  const degradedReasons: string[] = []

  /* ── Step 1: resolveEntity ───────────────────────────────── */
  const entityStep = await runStep('business_case', 'resolveEntity', async () => {
    const comparableSnapshots = new Map<string, string>()

    if (input.comparableCompanies?.length) {
      const results = await Promise.allSettled(
        input.comparableCompanies.slice(0, 3).map((c) => searchExaSnapshot(c))
      )
      for (let i = 0; i < input.comparableCompanies.length && i < 3; i++) {
        const r = results[i]
        if (r.status === 'fulfilled' && r.value) {
          comparableSnapshots.set(input.comparableCompanies[i], r.value.description || input.comparableCompanies[i])
        }
      }
    }

    return { comparableSnapshots }
  }, undefined, ctx)

  const comparableSnapshots = entityStep.data?.comparableSnapshots ?? new Map<string, string>()

  /* ── Step 2: gatherEvidence ──────────────────────────────── */
  const evidenceStep = await runStep('business_case', 'gatherEvidence', async () => {
    const allSources: BriefSource[] = []
    const allEvidence: NormalizedEvidence[] = []

    const searchJobs: Array<Promise<unknown>> = [
      searchExaNews(input.initiativeName, 30),
      searchTavilyNews(`${input.initiativeName} ${input.hypothesis}`),
    ]

    if (input.targetMarket) {
      searchJobs.push(searchTavilyNews(`${input.targetMarket} market size growth`))
    }

    if (input.comparableCompanies?.length) {
      for (const c of input.comparableCompanies.slice(0, 3)) {
        searchJobs.push(searchExaNews(c, 30))
      }
    }

    const results = await Promise.allSettled(searchJobs)
    let idx = 0

    // Initiative news
    const initResult = results[idx++]
    if (initResult.status === 'fulfilled' && initResult.value) {
      const { sources, evidence } = normalizeExaResults(initResult.value as Awaited<ReturnType<typeof searchExaNews>>)
      allSources.push(...sources)
      allEvidence.push(...evidence)
    }

    // Hypothesis search
    const hypResult = results[idx++]
    if (hypResult.status === 'fulfilled' && hypResult.value) {
      const tavily = hypResult.value as Awaited<ReturnType<typeof searchTavilyNews>>
      const { sources, evidence } = normalizeTavilyResults(tavily.results)
      allSources.push(...sources)
      allEvidence.push(...evidence)
    }

    // Market search
    if (input.targetMarket) {
      const mktResult = results[idx++]
      if (mktResult.status === 'fulfilled' && mktResult.value) {
        const tavily = mktResult.value as Awaited<ReturnType<typeof searchTavilyNews>>
        const { sources, evidence } = normalizeTavilyResults(tavily.results)
        allSources.push(...sources)
        allEvidence.push(...evidence)
      }
    }

    // Comparable company news
    if (input.comparableCompanies?.length) {
      for (let i = 0; i < Math.min(3, input.comparableCompanies.length); i++) {
        const r = results[idx++]
        if (r.status === 'fulfilled' && r.value) {
          const { sources, evidence } = normalizeExaResults(r.value as Awaited<ReturnType<typeof searchExaNews>>)
          allSources.push(...sources)
          allEvidence.push(...evidence)
        }
      }
    }

    // Add comparable snapshots as evidence
    for (const [name, desc] of Array.from(comparableSnapshots)) {
      const { source, evidence } = normalizeExaSnapshot({
        name, description: desc, sourceUrl: null,
        industry: undefined, headquarters: undefined, employeeCount: undefined,
        fundingStage: undefined, lastFundingAmount: undefined, ceo: undefined, recentMilestone: undefined,
        raw: null,
      })
      if (source) allSources.push(source)
      if (evidence) allEvidence.push(evidence)
    }

    return { sources: allSources, evidence: allEvidence }
  }, undefined, ctx)

  const allSources = evidenceStep.data?.sources ?? []
  const allEvidence = evidenceStep.data?.evidence ?? []

  /* ── Step 3: rankEvidence ────────────────────────────────── */
  const rankStep = await runStep('business_case', 'rankEvidence', async () => {
    const queryTerms = extractQueryTerms(`${input.initiativeName} ${input.hypothesis} ${input.targetMarket ?? ''}`)
    return rankEvidence(allEvidence, { topN: 8, queryTerms })
  }, undefined, ctx)

  const rankedEvidence = rankStep.data ?? allEvidence

  /* ── Step 4: synthesize ──────────────────────────────────── */
  const synthesisStep = await runStep('business_case', 'synthesize', async () => {
    const userPrompt = buildBusinessCasePrompt({
      initiativeName: input.initiativeName,
      hypothesis: input.hypothesis,
      targetMarket: input.targetMarket,
      successMetrics: input.successMetrics,
      keyQuestions: input.keyQuestions,
      comparableCompanies: input.comparableCompanies,
      evidence: rankedEvidence,
      comparableSnapshots,
    })
    return synthesizeWithSchema(
      BUSINESS_CASE_SYSTEM_PROMPT, userPrompt,
      BusinessCaseSynthesisSchema, BUSINESS_CASE_SCHEMA_DESC, 'business_case'
    )
  }, undefined, ctx)

  const synthesis = synthesisStep.data
  if (!synthesis?.data) degradedReasons.push('AI synthesis failed')

  /* ── Step 5: assembleBrief ───────────────────────────────── */
  const dedupedSources = deduplicateSources(allSources)
  const totalMs = Math.round(performance.now() - totalStart)

  return {
    id: generateBriefId(),
    researchType: 'business_case',
    generatedAt: new Date().toISOString(),
    headline: synthesis?.data?.headline ?? 'Unable to generate business case analysis',
    bottomLine: synthesis?.data?.bottomLine ?? 'AI synthesis failed. Raw evidence is still available.',
    confidence: synthesis?.data?.confidence ?? 'low',
    verdict: synthesis?.data?.verdict ?? 'insufficient_data',
    verdictRationale: synthesis?.data?.verdictRationale ?? 'Analysis could not be completed.',
    comparables: synthesis?.data?.comparables ?? [],
    sections: {
      marketEvidence: synthesis?.data?.marketEvidence ?? [],
      supportingFactors: synthesis?.data?.supportingFactors ?? [],
      riskFactors: synthesis?.data?.riskFactors ?? [],
      openQuestions: synthesis?.data?.openQuestions ?? [],
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
