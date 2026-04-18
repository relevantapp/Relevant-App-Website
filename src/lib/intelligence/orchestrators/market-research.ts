/* ── Market Research Orchestrator — staged pipeline ────────── */

import type {
  MarketResearchRequest,
  MarketResearchBrief,
  BriefSource,
  NormalizedEvidence,
} from '../contracts'
import { MarketResearchSynthesisSchema } from '../contracts'
import { runStep, generateBriefId, type PipelineContext } from '../pipeline'
import { synthesizeWithSchema } from '../models'
import { rankEvidence, extractQueryTerms } from '../ranker'
import { MARKET_RESEARCH_SYSTEM_PROMPT, MARKET_RESEARCH_SCHEMA_DESC, buildMarketResearchPrompt } from '../prompts/market-research.v1'
import { searchExaSnapshot, searchExaNews } from '../providers/exa'
import { searchTavilyNews } from '../providers/tavily'
import {
  normalizeExaSnapshot,
  normalizeExaResults,
  normalizeTavilyResults,
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

  /* ── Step 2: gatherEvidence ──────────────────────────────── */
  const evidenceStep = await runStep('market_research', 'gatherEvidence', async () => {
    const allSources: BriefSource[] = []
    const allEvidence: NormalizedEvidence[] = []

    const scopeStr = input.scope === 'global' ? '' : ` ${input.scope}`
    const searchJobs: Array<Promise<unknown>> = [
      searchExaNews(`${input.marketOrTrend}${scopeStr}`, 90),
      searchTavilyNews(`${input.marketOrTrend} market analysis${scopeStr}`),
      searchTavilyNews(`${input.marketOrTrend} trends forecast${scopeStr}`),
    ]

    if (input.knownPlayers?.length) {
      for (const p of input.knownPlayers.slice(0, 5)) {
        searchJobs.push(searchExaNews(p, 30))
      }
    }

    const results = await Promise.allSettled(searchJobs)
    let idx = 0

    // Market news (Exa)
    const mktResult = results[idx++]
    if (mktResult.status === 'fulfilled' && mktResult.value) {
      const { sources, evidence } = normalizeExaResults(mktResult.value as Awaited<ReturnType<typeof searchExaNews>>)
      allSources.push(...sources)
      allEvidence.push(...evidence)
    } else {
      degradedReasons.push('Exa market search failed')
    }

    // Market analysis (Tavily)
    const analysisResult = results[idx++]
    if (analysisResult.status === 'fulfilled' && analysisResult.value) {
      const tavily = analysisResult.value as Awaited<ReturnType<typeof searchTavilyNews>>
      const { sources, evidence } = normalizeTavilyResults(tavily.results)
      allSources.push(...sources)
      allEvidence.push(...evidence)
    }

    // Trends (Tavily)
    const trendsResult = results[idx++]
    if (trendsResult.status === 'fulfilled' && trendsResult.value) {
      const tavily = trendsResult.value as Awaited<ReturnType<typeof searchTavilyNews>>
      const { sources, evidence } = normalizeTavilyResults(tavily.results)
      allSources.push(...sources)
      allEvidence.push(...evidence)
    }

    // Player news
    if (input.knownPlayers?.length) {
      for (let i = 0; i < Math.min(5, input.knownPlayers.length); i++) {
        const r = results[idx++]
        if (r.status === 'fulfilled' && r.value) {
          const { sources, evidence } = normalizeExaResults(r.value as Awaited<ReturnType<typeof searchExaNews>>)
          allSources.push(...sources)
          allEvidence.push(...evidence)
        }
      }
    }

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
      evidence: rankedEvidence,
      playerSnapshots,
    })
    return synthesizeWithSchema(
      MARKET_RESEARCH_SYSTEM_PROMPT, userPrompt,
      MarketResearchSynthesisSchema, MARKET_RESEARCH_SCHEMA_DESC, 'market_research'
    )
  }, undefined, ctx)

  const synthesis = synthesisStep.data
  if (!synthesis?.data) degradedReasons.push('AI synthesis failed')

  /* ── Step 5: assembleBrief ───────────────────────────────── */
  const dedupedSources = deduplicateSources(allSources)
  const totalMs = Math.round(performance.now() - totalStart)

  return {
    id: generateBriefId(),
    researchType: 'market_research',
    generatedAt: new Date().toISOString(),
    headline: synthesis?.data?.headline ?? 'Unable to generate market research',
    bottomLine: synthesis?.data?.bottomLine ?? 'AI synthesis failed. Raw evidence is still available.',
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
