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
import {
  buildCanonicalSourceIdMap,
  buildMethodology,
  buildTrustLayer,
  collectAnswerSourceIds,
  markSourcesUsedInAnswer,
  normalizeAnswerBlock,
} from '../meeting-prep-display'
import {
  buildV2PlanBridge,
  collectV2EvidenceBridge,
  persistV2EvidencePack,
} from './v2-bridge'

export async function generateMarketResearchBrief(
  input: MarketResearchRequest,
  ctx?: PipelineContext
): Promise<MarketResearchBrief> {
  const totalStart = performance.now()
  resetSourceCounter()

  const degradedReasons: string[] = []

  /* ── Step 1: resolveEntity ───────────────────────────────── */
  const entityStep = await runStep('market_research', 'resolveEntity', async () => {
    const playerSnapshots = new Map<string, { description: string; sourceUrl: string | null }>()

    if (input.knownPlayers?.length) {
      const results = await Promise.allSettled(
        input.knownPlayers.slice(0, 5).map((p) => searchExaSnapshot(p))
      )
      for (let i = 0; i < input.knownPlayers.length && i < 5; i++) {
        const r = results[i]
        if (r.status === 'fulfilled' && r.value) {
          playerSnapshots.set(input.knownPlayers[i], {
            description: r.value.description || input.knownPlayers[i],
            sourceUrl: r.value.sourceUrl,
          })
        }
      }
    }

    return { playerSnapshots }
  }, undefined, ctx)

  const playerSnapshots = entityStep.data?.playerSnapshots ?? new Map<string, { description: string; sourceUrl: string | null }>()
  const playerSnapshotDescriptions = new Map(
    Array.from(playerSnapshots.entries()).map(([name, snapshot]) => [name, snapshot.description]),
  )

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

  const planStep = await runStep('market_research', 'planSearches', async () => {
    const v2Bridge = await buildV2PlanBridge({
      researchType: 'market_research',
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
      researchPlan: await buildResearchSearchPlan('market_research', input, fallbackSearches, ctx),
      v2Bridge: null,
    }
  }, undefined, ctx)

  const researchPlan = planStep.data?.researchPlan ?? null
  const v2Bridge = planStep.data?.v2Bridge ?? null

  /* ── Step 3: gatherEvidence ──────────────────────────────── */
  const evidenceStep = await runStep('market_research', 'gatherEvidence', async () => {
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

    // Add player snapshots as evidence
    for (const [name, snapshot] of Array.from(playerSnapshots)) {
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
  const queryTerms = extractQueryTerms(
    `${input.marketOrTrend} ${input.scope} ${input.keyQuestions ?? ''}`
  )
  const rankStep = await runStep('market_research', 'rankEvidence', async () => {
    return rankEvidence(allEvidence, { topN: 24, queryTerms })
  }, undefined, ctx)

  const rankedEvidence = rankStep.data ?? allEvidence

  const evidencePack = v2Bridge && v2Evidence
    ? persistV2EvidencePack({
      bridge: v2Bridge,
      retrieval: v2Evidence.retrieval,
      priorMemory: v2Evidence.priorMemory,
      evidence: allEvidence,
      queryTerms,
      ctx,
    })
    : null

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
      playerSnapshots: playerSnapshotDescriptions,
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
  const canonicalSourceIdMap = buildCanonicalSourceIdMap(allSources)
  const normalizedAnswer = normalizeAnswerBlock(synthesis?.data?.answer, canonicalSourceIdMap)
  const dedupedSources = markSourcesUsedInAnswer(
    deduplicateSources(allSources),
    collectAnswerSourceIds(normalizedAnswer),
  )
  const trust = buildTrustLayer({
    sources: dedupedSources,
    sourceIdMap: canonicalSourceIdMap,
    claimSourceGroups: [
      ...(synthesis?.data?.trendSignals.map((bullet) => bullet.sourceIds) ?? []),
      ...(synthesis?.data?.opportunities.map((bullet) => bullet.sourceIds) ?? []),
      ...(synthesis?.data?.threats.map((bullet) => bullet.sourceIds) ?? []),
      ...(synthesis?.data?.keyFindings.map((bullet) => bullet.sourceIds) ?? []),
      ...(normalizedAnswer ? [
        normalizedAnswer.conclusion.sourceIds,
        normalizedAnswer.whyItMatters.sourceIds,
        normalizedAnswer.whatChanged?.sourceIds,
      ] : []),
    ],
    pack: evidencePack,
    plan: v2Bridge?.planV2,
  })
  const methodology = buildMethodology({
    sources: dedupedSources,
    sourceIdMap: canonicalSourceIdMap,
    trust,
    researchPlan,
    allEvidence,
    rankedEvidence,
    retrieval: v2Evidence?.retrieval,
  })
  if (dedupedSources.length < 4) degradedReasons.push('Low source count')
  const totalMs = Math.round(performance.now() - totalStart)
  const internalMs = v2Evidence?.retrieval.timings.internalMs ?? 0
  const exaMs = entityStep.timings.durationMs + providerMs.exaMs
  const tavilyMs = providerMs.tavilyMs

  return {
    id: generateBriefId(),
    researchType: 'market_research',
    generatedAt: new Date().toISOString(),
    headline: synthesis?.data?.headline ?? 'Unable to generate market research',
    bottomLine: synthesis?.data?.bottomLine ?? 'AI synthesis failed. Raw evidence is still available.',
    whyItMatters: synthesis?.data?.whyItMatters ?? null,
    confidence: synthesis?.data?.confidence ?? 'low',
    answer: normalizedAnswer,
    marketOverview: synthesis?.data?.marketOverview ?? '',
    players: synthesis?.data?.players ?? [],
    sections: {
      trendSignals: synthesis?.data?.trendSignals ?? [],
      opportunities: synthesis?.data?.opportunities ?? [],
      threats: synthesis?.data?.threats ?? [],
      keyFindings: synthesis?.data?.keyFindings ?? [],
    },
    sources: dedupedSources,
    trust,
    methodology,
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
