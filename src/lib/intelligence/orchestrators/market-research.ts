/* ── Market Research Orchestrator — staged pipeline ────────── */

import type {
  MarketResearchRequest,
  MarketResearchBrief,
  BriefSource,
  NormalizedEvidence,
  SearchTask,
} from '../contracts'
import { MarketResearchSynthesisSchema } from '../contracts'
import { runStep, generateBriefId, type PipelineContext } from '../pipeline'
import { synthesizeWithSchema } from '../models'
import { rankEvidence, extractQueryTerms } from '../ranker'
import { MARKET_RESEARCH_SYSTEM_PROMPT, MARKET_RESEARCH_SCHEMA_DESC, buildMarketResearchPrompt } from '../prompts/market-research.v1'
import { searchExaSnapshot } from '../providers/exa'
import { buildResearchSearchPlan, executeSearchPlan } from '../search-planner'
import {
  normalizeExaSnapshot,
  deduplicateSources,
  resetSourceCounter,
} from '../normalize'

export async function generateMarketResearchBrief(
  input: MarketResearchRequest,
  ctx?: PipelineContext
): Promise<MarketResearchBrief> {
  const totalStart = performance.now()
  resetSourceCounter()

  const degradedReasons: string[] = []

  /* ── Step 1: resolveEntity ───────────────────────────────── */
  const entityStep = await runStep('market_research', 'resolveEntity', async () => {
    const playerSnapshots = new Map<string, string>()

    if (input.knownPlayers?.length) {
      const results = await Promise.allSettled(
        input.knownPlayers.slice(0, 5).map((p) => searchExaSnapshot(p))
      )
      for (let i = 0; i < input.knownPlayers.length && i < 5; i++) {
        const r = results[i]
        if (r.status === 'fulfilled' && r.value) {
          playerSnapshots.set(input.knownPlayers[i], r.value.description || input.knownPlayers[i])
        }
      }
    }

    return { playerSnapshots }
  }, undefined, ctx)

  const playerSnapshots = entityStep.data?.playerSnapshots ?? new Map<string, string>()

  /* ── Step 2: planSearches ───────────────────────────────── */
  const scopeStr = input.scope === 'global' ? '' : ` ${input.region || input.scope}`
  const fallbackSearches: SearchTask[] = [
    {
      provider: 'exa',
      type: 'news',
      query: `${input.marketOrTrend}${scopeStr} market growth funding adoption`,
      purpose: 'Find recent market signals, growth evidence, and funding or adoption data.',
      lookbackDays: input.timeHorizon === '30d' ? 30 : input.timeHorizon === '90d' ? 90 : 365,
      category: 'news',
    },
    {
      provider: 'tavily',
      type: 'tavily_news',
      query: `${input.marketOrTrend}${scopeStr} market analysis forecast key players`,
      purpose: 'Find market analysis, forecasts, and named players.',
      topic: 'general',
      timeRange: input.timeHorizon === '30d' ? 'month' : 'year',
      includeImages: true,
    },
    {
      provider: 'tavily',
      type: 'tavily_news',
      query: `${input.marketOrTrend}${scopeStr} risks regulation barriers customer adoption`,
      purpose: 'Find risks, blockers, regulation, and adoption friction.',
      topic: 'general',
      timeRange: 'year',
      includeImages: false,
    },
  ]

  if (input.customerSegment || input.useCase) {
    fallbackSearches.push({
      provider: 'tavily',
      type: 'tavily_news',
      query: `${input.marketOrTrend} ${input.customerSegment ?? ''} ${input.useCase ?? ''} buying criteria pain points`,
      purpose: 'Ground findings in the requested customer segment and use case.',
      topic: 'general',
      timeRange: 'year',
      includeImages: true,
    })
  }

  for (const player of input.knownPlayers ?? []) {
    fallbackSearches.push({
      provider: 'exa',
      type: 'news',
      query: `${player} ${input.marketOrTrend} product launch funding customers`,
      purpose: 'Find recent moves by a known player.',
      lookbackDays: 180,
      category: 'news',
    })
  }

  if (input.keyQuestions) {
    fallbackSearches.push({
      provider: 'tavily',
      type: 'tavily_news',
      query: `${input.keyQuestions} ${input.marketOrTrend}${scopeStr}`,
      purpose: 'Answer the specific questions from the user.',
      topic: 'general',
      timeRange: 'year',
      includeImages: true,
    })
  }

  const planStep = await runStep('market_research', 'planSearches', async () => (
    buildResearchSearchPlan('market_research', input, fallbackSearches, ctx)
  ), undefined, ctx)

  const researchPlan = planStep.data

  /* ── Step 3: gatherEvidence ──────────────────────────────── */
  const evidenceStep = await runStep('market_research', 'gatherEvidence', async () => {
    const allSources: BriefSource[] = []
    const allEvidence: NormalizedEvidence[] = []

    const planned = researchPlan ? await executeSearchPlan(researchPlan) : { sources: [], evidence: [] }
    allSources.push(...planned.sources)
    allEvidence.push(...planned.evidence)

    // Add player snapshots as evidence
    for (const [name, desc] of Array.from(playerSnapshots)) {
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
  const rankStep = await runStep('market_research', 'rankEvidence', async () => {
    const queryTerms = extractQueryTerms(
      `${input.marketOrTrend} ${input.scope} ${input.keyQuestions ?? ''}`
    )
    return rankEvidence(allEvidence, { topN: 8, queryTerms })
  }, undefined, ctx)

  const rankedEvidence = rankStep.data ?? allEvidence

  /* ── Step 4: synthesize ──────────────────────────────────── */
  const synthesisStep = await runStep('market_research', 'synthesize', async () => {
    const userPrompt = buildMarketResearchPrompt({
      marketOrTrend: input.marketOrTrend,
      scope: input.scope,
      keyQuestions: input.keyQuestions,
      knownPlayers: input.knownPlayers,
      timeHorizon: input.timeHorizon,
      objective: input.objective,
      region: input.region,
      customerSegment: input.customerSegment,
      useCase: input.useCase,
      depth: input.depth,
      steering: input.steering,
      userContext: input.userContext,
      evidence: rankedEvidence,
      playerSnapshots,
    })
    return synthesizeWithSchema(
      MARKET_RESEARCH_SYSTEM_PROMPT, userPrompt,
      MarketResearchSynthesisSchema, MARKET_RESEARCH_SCHEMA_DESC, 'market_research',
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
    researchType: 'market_research',
    generatedAt: new Date().toISOString(),
    headline: synthesis?.data?.headline ?? 'Unable to generate market research',
    bottomLine: synthesis?.data?.bottomLine ?? 'AI synthesis failed. Raw evidence is still available.',
    whyItMatters: synthesis?.data?.whyItMatters ?? null,
    confidence: synthesis?.data?.confidence ?? 'low',
    marketOverview: synthesis?.data?.marketOverview ?? '',
    players: synthesis?.data?.players ?? [],
    sections: {
      trendSignals: synthesis?.data?.trendSignals ?? [],
      opportunities: synthesis?.data?.opportunities ?? [],
      threats: synthesis?.data?.threats ?? [],
      keyFindings: synthesis?.data?.keyFindings ?? [],
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
