/* ── Business Case Orchestrator — staged pipeline ─────────── */

import type {
  BusinessCaseRequest,
  BusinessCaseBrief,
  BriefSource,
  NormalizedEvidence,
  SearchTask,
} from '../contracts'
import { BusinessCaseSynthesisSchema } from '../contracts'
import { runStep, generateBriefId, type PipelineContext } from '../pipeline'
import { synthesizeWithSchema } from '../models'
import { rankEvidence, extractQueryTerms } from '../ranker'
import { BUSINESS_CASE_SYSTEM_PROMPT, BUSINESS_CASE_SCHEMA_DESC, buildBusinessCasePrompt } from '../prompts/business-case.v1'
import { searchExaSnapshot } from '../providers/exa'
import { buildResearchSearchPlan, executeSearchPlan } from '../search-planner'
import {
  normalizeExaSnapshot,
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

  /* ── Step 2: planSearches ───────────────────────────────── */
  const fallbackSearches: SearchTask[] = [
    {
      provider: 'exa',
      type: 'news',
      query: `${input.initiativeName} ${input.hypothesis} recent evidence customer demand`,
      purpose: 'Find recent proof for or against the business case hypothesis.',
      lookbackDays: 90,
      category: 'news',
    },
    {
      provider: 'tavily',
      type: 'tavily_news',
      query: `${input.initiativeName} ${input.targetMarket ?? ''} market size growth adoption`,
      purpose: 'Find market sizing, adoption, and demand evidence.',
      topic: 'general',
      timeRange: 'year',
      includeImages: true,
    },
    {
      provider: 'tavily',
      type: 'tavily_news',
      query: `${input.initiativeName} risks failures unit economics objections`,
      purpose: 'Find disconfirming evidence and reasons the initiative could fail.',
      topic: 'general',
      timeRange: 'year',
      includeImages: false,
    },
  ]

  for (const comparable of input.comparableCompanies ?? []) {
    fallbackSearches.push({
      provider: 'exa',
      type: 'news',
      query: `${comparable} ${input.initiativeName} comparable outcome revenue adoption`,
      purpose: 'Find comparable company outcomes and lessons.',
      lookbackDays: 365,
    })
  }

  if (input.keyQuestions) {
    fallbackSearches.push({
      provider: 'tavily',
      type: 'tavily_news',
      query: `${input.keyQuestions} ${input.targetMarket ?? input.initiativeName}`,
      purpose: 'Answer the specific decision questions from the user.',
      topic: 'general',
      timeRange: 'year',
      includeImages: true,
    })
  }

  const planStep = await runStep('business_case', 'planSearches', async () => (
    buildResearchSearchPlan('business_case', input, fallbackSearches, ctx)
  ), undefined, ctx)

  const researchPlan = planStep.data

  /* ── Step 3: gatherEvidence ──────────────────────────────── */
  const evidenceStep = await runStep('business_case', 'gatherEvidence', async () => {
    const allSources: BriefSource[] = []
    const allEvidence: NormalizedEvidence[] = []

    const planned = researchPlan ? await executeSearchPlan(researchPlan) : { sources: [], evidence: [] }
    allSources.push(...planned.sources)
    allEvidence.push(...planned.evidence)

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
      decisionType: input.decisionType,
      decisionAudience: input.decisionAudience,
      timeHorizon: input.timeHorizon,
      investmentLevel: input.investmentLevel,
      roiFrame: input.roiFrame,
      steering: input.steering,
      userContext: input.userContext,
      evidence: rankedEvidence,
      comparableSnapshots,
    })
    return synthesizeWithSchema(
      BUSINESS_CASE_SYSTEM_PROMPT, userPrompt,
      BusinessCaseSynthesisSchema, BUSINESS_CASE_SCHEMA_DESC, 'business_case',
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
    researchType: 'business_case',
    generatedAt: new Date().toISOString(),
    headline: synthesis?.data?.headline ?? 'Unable to generate business case analysis',
    bottomLine: synthesis?.data?.bottomLine ?? 'AI synthesis failed. Raw evidence is still available.',
    whyItMatters: synthesis?.data?.whyItMatters ?? null,
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
