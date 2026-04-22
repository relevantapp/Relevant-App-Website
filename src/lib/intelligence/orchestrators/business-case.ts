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
import {
  buildV2PlanBridge,
  collectV2EvidenceBridge,
  persistV2EvidencePack,
} from './v2-bridge'

export async function generateBusinessCaseBrief(
  input: BusinessCaseRequest,
  ctx?: PipelineContext
): Promise<BusinessCaseBrief> {
  const totalStart = performance.now()
  resetSourceCounter()

  const degradedReasons: string[] = []

  /* ── Step 1: resolveEntity ───────────────────────────────── */
  const entityStep = await runStep('business_case', 'resolveEntity', async () => {
    const comparableSnapshots = new Map<string, { description: string; sourceUrl: string | null }>()

    if (input.comparableCompanies?.length) {
      const results = await Promise.allSettled(
        input.comparableCompanies.slice(0, 3).map((c) => searchExaSnapshot(c))
      )
      for (let i = 0; i < input.comparableCompanies.length && i < 3; i++) {
        const r = results[i]
        if (r.status === 'fulfilled' && r.value) {
          comparableSnapshots.set(input.comparableCompanies[i], {
            description: r.value.description || input.comparableCompanies[i],
            sourceUrl: r.value.sourceUrl,
          })
        }
      }
    }

    return { comparableSnapshots }
  }, undefined, ctx)

  const comparableSnapshots = entityStep.data?.comparableSnapshots ?? new Map<string, { description: string; sourceUrl: string | null }>()
  const comparableSnapshotDescriptions = new Map(
    Array.from(comparableSnapshots.entries()).map(([name, snapshot]) => [name, snapshot.description]),
  )

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

  const planStep = await runStep('business_case', 'planSearches', async () => {
    const v2Bridge = await buildV2PlanBridge({
      researchType: 'business_case',
      request: input,
      ctx,
    })

    if (v2Bridge) {
      return {
        researchPlan: v2Bridge.researchPlan,
        v2Bridge,
      }
    }

    return {
      researchPlan: await buildResearchSearchPlan('business_case', input, fallbackSearches, ctx),
      v2Bridge: null,
    }
  }, undefined, ctx)

  const researchPlan = planStep.data?.researchPlan ?? null
  const v2Bridge = planStep.data?.v2Bridge ?? null

  /* ── Step 3: gatherEvidence ──────────────────────────────── */
  const evidenceStep = await runStep('business_case', 'gatherEvidence', async () => {
    const allSources: BriefSource[] = []
    const allEvidence: NormalizedEvidence[] = []
    let v2Evidence: Awaited<ReturnType<typeof collectV2EvidenceBridge>> | null = null
    const providerMs = { exaMs: 0, tavilyMs: 0 }

    if (v2Bridge) {
      v2Evidence = await collectV2EvidenceBridge({ bridge: v2Bridge, ctx })
      providerMs.exaMs += v2Evidence.retrieval.timings.exaMs
      providerMs.tavilyMs += v2Evidence.retrieval.timings.tavilyMs
      allSources.push(...v2Evidence.sources)
      allEvidence.push(...v2Evidence.evidence)
    } else {
      const planned = researchPlan ? await executeSearchPlan(researchPlan) : { sources: [], evidence: [] }
      allSources.push(...planned.sources)
      allEvidence.push(...planned.evidence)
    }

    // Add comparable snapshots as evidence
    for (const [name, snapshot] of Array.from(comparableSnapshots)) {
      const { source, evidence } = normalizeExaSnapshot({
        name, description: snapshot.description, sourceUrl: snapshot.sourceUrl,
        industry: undefined, headquarters: undefined, employeeCount: undefined,
        fundingStage: undefined, lastFundingAmount: undefined, ceo: undefined, recentMilestone: undefined,
        raw: null,
      })
      if (source) allSources.push({ ...source, sourceRole: 'primary' })
      if (evidence) allEvidence.push({ ...evidence, sourceRole: 'primary' })
    }

    return { sources: allSources, evidence: allEvidence, v2Evidence, providerMs }
  }, undefined, ctx)

  const allSources = evidenceStep.data?.sources ?? []
  const allEvidence = evidenceStep.data?.evidence ?? []
  const v2Evidence = evidenceStep.data?.v2Evidence ?? null
  const providerMs = evidenceStep.data?.providerMs ?? { exaMs: 0, tavilyMs: 0 }

  /* ── Step 3: rankEvidence ────────────────────────────────── */
  const queryTerms = extractQueryTerms(`${input.initiativeName} ${input.hypothesis} ${input.targetMarket ?? ''}`)
  const rankStep = await runStep('business_case', 'rankEvidence', async () => {
    return rankEvidence(allEvidence, { topN: 24, queryTerms })
  }, undefined, ctx)

  const rankedEvidence = rankStep.data ?? allEvidence

  if (v2Bridge && v2Evidence) {
    persistV2EvidencePack({
      bridge: v2Bridge,
      retrieval: v2Evidence.retrieval,
      priorMemory: v2Evidence.priorMemory,
      evidence: allEvidence,
      queryTerms,
      ctx,
    })
  }

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
      comparableSnapshots: comparableSnapshotDescriptions,
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
  const internalMs = v2Evidence?.retrieval.timings.internalMs ?? 0
  const exaMs = entityStep.timings.durationMs + providerMs.exaMs
  const tavilyMs = providerMs.tavilyMs

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
      internalMs,
      plannerMs: planStep.timings.durationMs,
      exaMs,
      tavilyMs,
      verifierMs: 0,
      exaSearchMs: exaMs,
      tavilySearchMs: tavilyMs,
      synthesisMs: synthesisStep.timings.durationMs,
      totalMs,
      sourceCount: dedupedSources.length,
      cached: false,
      synthesisModel: synthesis?.model ?? null,
    },
  }
}
