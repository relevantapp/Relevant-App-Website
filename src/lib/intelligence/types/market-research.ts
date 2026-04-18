/* ── Market Research — Research orchestrator ───────────────── */

import type {
  MarketResearchBrief,
  MarketPlayer,
  BriefBullet,
  BriefSource,
  BriefStatus,
  NormalizedEvidence,
} from '../types'
import { searchExaSnapshot, searchExaNews } from '../providers/exa'
import { searchTavilyNews } from '../providers/tavily'
import {
  normalizeExaSnapshot,
  normalizeExaResults,
  normalizeTavilyResults,
  deduplicateSources,
  resetSourceCounter,
} from '../normalize'

/* ── AI config ─────────────────────────────────────────────── */

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models'
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const SYNTHESIS_TIMEOUT = 45_000

type ModelCandidate = { provider: 'gemini' | 'openrouter'; model: string }

function getModelCandidates(): ModelCandidate[] {
  const candidates: ModelCandidate[] = []
  if (process.env.GEMINI_API_KEY) {
    candidates.push({ provider: 'gemini', model: 'gemini-2.0-flash' })
    candidates.push({ provider: 'gemini', model: 'gemini-1.5-flash' })
  }
  if (process.env.OPENROUTER_API_KEY) {
    candidates.push({ provider: 'openrouter', model: 'google/gemini-2.5-flash-lite' })
    candidates.push({ provider: 'openrouter', model: 'google/gemini-2.0-flash-001' })
  }
  return candidates
}

/* ── Synthesis types ───────────────────────────────────────── */

interface MarketSynthesisOutput {
  headline: string
  bottomLine: string
  confidence: 'high' | 'medium' | 'low'
  marketOverview: string
  players: MarketPlayer[]
  trendSignals: BriefBullet[]
  opportunities: BriefBullet[]
  threats: BriefBullet[]
  keyFindings: BriefBullet[]
  synthesisModel: string | null
}

/* ── Lookback + scope helpers ──────────────────────────────── */

function timeHorizonToDays(horizon?: string): number {
  switch (horizon) {
    case '30d': return 30
    case '90d': return 90
    case '6m': return 180
    case '1y': return 365
    default: return 90
  }
}

function scopeToRegion(scope: string): string {
  switch (scope) {
    case 'north_america': return 'North America'
    case 'europe': return 'Europe'
    case 'apac': return 'Asia Pacific'
    default: return ''
  }
}

/* ── System prompt ─────────────────────────────────────────── */

const SYSTEM_PROMPT = `You are a market research analyst. Produce a comprehensive market landscape assessment.

Rules:
- Every claim must reference a source by its ID (e.g. s1, s2)
- Separate facts (sourced) from inferences (your analysis)
- Categorize players as leader/challenger/niche/emerging based on evidence
- Reference real numbers when available — market size, growth rates, funding
- Separate current state from forward-looking predictions
- If evidence is thin, say so — never fabricate
- Return ONLY valid JSON, no markdown fences or commentary`

/* ── Prompt builder ────────────────────────────────────────── */

function buildUserPrompt(
  input: { marketOrTrend: string; scope: string; keyQuestions?: string; knownPlayers?: string[]; timeHorizon?: string },
  evidence: NormalizedEvidence[],
  playerSnapshots: Map<string, string>
): string {
  const parts: string[] = []
  const region = scopeToRegion(input.scope)

  parts.push(`## Research Request
- Market/Trend: ${input.marketOrTrend}
- Scope: ${input.scope}${region ? ` (${region})` : ''}
- Time horizon: ${input.timeHorizon ?? '90d'}`)

  if (input.keyQuestions) parts.push(`- Key questions: ${input.keyQuestions}`)
  if (input.knownPlayers?.length) parts.push(`- Known players: ${input.knownPlayers.join(', ')}`)

  for (const [name, snapshot] of Array.from(playerSnapshots)) {
    parts.push(`\n## Player Profile: ${name}\n${snapshot}`)
  }

  if (evidence.length) {
    const evidenceText = evidence
      .map((e) => `[${e.id}] (${e.domain}) ${e.title}: ${e.text}`)
      .join('\n\n')
    parts.push(`\n## Evidence\n${evidenceText}`)
  }

  parts.push(`\n## Instructions
Produce a JSON response matching this exact schema:
{
  "headline": "One sentence market landscape summary",
  "bottomLine": "2-3 sentence strategic takeaway",
  "confidence": "high|medium|low based on evidence quality",
  "marketOverview": "2-3 sentence market overview with key metrics",
  "players": [
    {
      "name": "Player Name",
      "category": "leader|challenger|niche|emerging",
      "description": "What they do in 1-2 sentences",
      "estimatedPosition": "Brief market position description"
    }
  ],
  "trendSignals": [{"text": "...", "sourceIds": ["s1"], "tag": "fact"}],
  "opportunities": [{"text": "...", "sourceIds": ["s1"], "tag": "inference"}],
  "threats": [{"text": "...", "sourceIds": ["s2"], "tag": "fact"}],
  "keyFindings": [{"text": "...", "sourceIds": ["s3"], "tag": "inference"}]
}

Include all known players plus any significant players found in evidence.
Return 3-5 bullets per section. Tag each as "fact" or "inference".
Every bullet must have at least one sourceId.`)

  return parts.join('\n')
}

/* ── Parsers ───────────────────────────────────────────────── */

function parseBullets(raw: unknown): BriefBullet[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((b): b is Record<string, unknown> => typeof b === 'object' && b !== null)
    .map((b) => ({
      text: typeof b.text === 'string' ? b.text : '',
      sourceIds: Array.isArray(b.sourceIds)
        ? b.sourceIds.filter((s): s is string => typeof s === 'string')
        : [],
      tag: b.tag === 'fact' ? ('fact' as const) : ('inference' as const),
    }))
    .filter((b) => b.text.length > 0)
}

function parsePlayers(raw: unknown): MarketPlayer[] {
  if (!Array.isArray(raw)) return []
  const validCategories = ['leader', 'challenger', 'niche', 'emerging'] as const
  return raw
    .filter((p): p is Record<string, unknown> => typeof p === 'object' && p !== null)
    .map((p) => ({
      name: typeof p.name === 'string' ? p.name : '',
      category: (validCategories as readonly string[]).includes(p.category as string)
        ? (p.category as MarketPlayer['category'])
        : 'niche' as const,
      description: typeof p.description === 'string' ? p.description : '',
      estimatedPosition: typeof p.estimatedPosition === 'string' ? p.estimatedPosition : '',
    }))
    .filter((p) => p.name.length > 0)
}

/* ── Synthesis (private) ───────────────────────────────────── */

async function synthesize(
  input: { marketOrTrend: string; scope: string; keyQuestions?: string; knownPlayers?: string[]; timeHorizon?: string },
  evidence: NormalizedEvidence[],
  playerSnapshots: Map<string, string>
): Promise<MarketSynthesisOutput> {
  const candidates = getModelCandidates()
  if (candidates.length === 0) {
    throw new Error('No AI provider configured (set GEMINI_API_KEY or OPENROUTER_API_KEY)')
  }

  const userPrompt = buildUserPrompt(input, evidence, playerSnapshots)

  for (const { provider, model } of candidates) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), SYNTHESIS_TIMEOUT)
    try {
      let content: string | undefined

      if (provider === 'gemini') {
        const res = await fetch(`${GEMINI_URL}/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\n${userPrompt}` }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 4000, responseMimeType: 'application/json' },
          }),
          signal: controller.signal,
        })
        clearTimeout(timeout)
        if (!res.ok) {
          console.error(`[market-research] Gemini error: ${res.status}`, await res.text())
          continue
        }
        const data = await res.json()
        content = data.candidates?.[0]?.content?.parts?.[0]?.text
      } else {
        const res = await fetch(OPENROUTER_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://www.getrelevantapp.com',
            'X-Title': 'Relevant Intelligence',
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.3,
            max_tokens: 4000,
            response_format: { type: 'json_object' },
          }),
          signal: controller.signal,
        })
        clearTimeout(timeout)
        if (!res.ok) {
          console.error(`[market-research] OpenRouter error: ${res.status}`, await res.text())
          continue
        }
        const data = await res.json()
        content = data.choices?.[0]?.message?.content
      }

      if (!content) {
        console.error('[market-research] Empty response from', provider, model)
        continue
      }

      let cleaned = content.trim()
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
      }

      const parsed = JSON.parse(cleaned)

      return {
        headline: typeof parsed.headline === 'string' ? parsed.headline : 'Market research analysis',
        bottomLine: typeof parsed.bottomLine === 'string' ? parsed.bottomLine : '',
        confidence: ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'medium',
        marketOverview: typeof parsed.marketOverview === 'string' ? parsed.marketOverview : '',
        players: parsePlayers(parsed.players),
        trendSignals: parseBullets(parsed.trendSignals),
        opportunities: parseBullets(parsed.opportunities),
        threats: parseBullets(parsed.threats),
        keyFindings: parseBullets(parsed.keyFindings),
        synthesisModel: `${provider}/${model}`,
      }
    } catch (err) {
      clearTimeout(timeout)
      const isAbort = typeof err === 'object' && err !== null && 'name' in err && (err as Error).name === 'AbortError'
      console.error(`[market-research] ${isAbort ? 'timeout' : 'failed'}:`, err, provider, model)
      continue
    }
  }

  return {
    headline: 'Unable to generate market analysis',
    bottomLine: 'AI synthesis failed. Raw evidence is still available.',
    confidence: 'low',
    marketOverview: 'Unable to generate full analysis',
    players: [],
    trendSignals: [],
    opportunities: [],
    threats: [],
    keyFindings: [],
    synthesisModel: null,
  }
}

/* ── Main orchestrator ─────────────────────────────────────── */

export async function generateMarketResearchBrief(input: {
  marketOrTrend: string
  scope: string
  keyQuestions?: string
  knownPlayers?: string[]
  timeHorizon?: string
}): Promise<MarketResearchBrief> {
  const totalStart = performance.now()
  resetSourceCounter()

  const lookbackDays = timeHorizonToDays(input.timeHorizon)
  const region = scopeToRegion(input.scope)
  const marketQuery = region ? `${input.marketOrTrend} ${region}` : input.marketOrTrend
  const limitedPlayers = (input.knownPlayers ?? []).slice(0, 5)

  const allSources: BriefSource[] = []
  const allEvidence: NormalizedEvidence[] = []
  const playerSnapshots = new Map<string, string>()

  /* ── Parallel searches ───────────────────────────────────── */
  const exaStart = performance.now()

  type SearchJob =
    | { type: 'overview' }
    | { type: 'trends' }
    | { type: 'playerSnapshot'; name: string }
    | { type: 'dynamics' }

  const jobs: SearchJob[] = [
    { type: 'overview' },
    { type: 'trends' },
    { type: 'dynamics' },
  ]
  for (const player of limitedPlayers) {
    jobs.push({ type: 'playerSnapshot', name: player })
  }

  const settled = await Promise.allSettled(
    jobs.map((job) => {
      switch (job.type) {
        case 'overview':
          return searchExaNews(`${marketQuery} market overview`, lookbackDays)
        case 'trends':
          return searchTavilyNews(`${marketQuery} trends growth`)
        case 'dynamics':
          return searchTavilyNews(`${marketQuery} challenges opportunities threats`)
        case 'playerSnapshot':
          return searchExaSnapshot(job.name)
      }
    })
  )

  const exaSearchMs = Math.round(performance.now() - exaStart)

  /* ── Process results ─────────────────────────────────────── */
  const tavilyStart = performance.now()

  // Overview (Exa news)
  const overviewResult = settled[0]
  if (overviewResult.status === 'fulfilled' && overviewResult.value) {
    const news = overviewResult.value as Awaited<ReturnType<typeof searchExaNews>>
    const { sources, evidence } = normalizeExaResults(news)
    allSources.push(...sources)
    allEvidence.push(...evidence)
  }

  // Trends (Tavily)
  const trendsResult = settled[1]
  if (trendsResult.status === 'fulfilled' && trendsResult.value) {
    const tavily = trendsResult.value as Awaited<ReturnType<typeof searchTavilyNews>>
    const { sources, evidence } = normalizeTavilyResults(tavily.results)
    allSources.push(...sources)
    allEvidence.push(...evidence)
  }

  // Dynamics (Tavily)
  const dynamicsResult = settled[2]
  if (dynamicsResult.status === 'fulfilled' && dynamicsResult.value) {
    const tavily = dynamicsResult.value as Awaited<ReturnType<typeof searchTavilyNews>>
    const { sources, evidence } = normalizeTavilyResults(tavily.results)
    allSources.push(...sources)
    allEvidence.push(...evidence)
  }

  // Player snapshots (Exa)
  for (let i = 0; i < limitedPlayers.length; i++) {
    const snapResult = settled[3 + i]
    if (snapResult.status === 'fulfilled' && snapResult.value) {
      const snap = snapResult.value as Awaited<ReturnType<typeof searchExaSnapshot>>
      if (snap) {
        const { source, evidence } = normalizeExaSnapshot(snap)
        if (source) allSources.push(source)
        if (evidence) allEvidence.push(evidence)
        playerSnapshots.set(limitedPlayers[i], snap.description || limitedPlayers[i])
      }
    }
  }

  const tavilySearchMs = Math.round(performance.now() - tavilyStart)
  const dedupedSources = deduplicateSources(allSources)

  /* ── Synthesis ───────────────────────────────────────────── */
  const synthesisStart = performance.now()
  const synthesis = await synthesize(input, allEvidence, playerSnapshots)
  const synthesisMs = Math.round(performance.now() - synthesisStart)
  const totalMs = Math.round(performance.now() - totalStart)

  const status: BriefStatus = {
    degraded: synthesis.synthesisModel === null,
    reasons: synthesis.synthesisModel === null ? ['All AI models failed during synthesis'] : [],
    exaSearchMs,
    tavilySearchMs,
    synthesisMs,
    totalMs,
    sourceCount: dedupedSources.length,
    cached: false,
    synthesisModel: synthesis.synthesisModel,
  }

  return {
    id: `ib_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    researchType: 'market_research',
    generatedAt: new Date().toISOString(),
    headline: synthesis.headline,
    bottomLine: synthesis.bottomLine,
    confidence: synthesis.confidence,
    marketOverview: synthesis.marketOverview,
    players: synthesis.players,
    sections: {
      trendSignals: synthesis.trendSignals,
      opportunities: synthesis.opportunities,
      threats: synthesis.threats,
      keyFindings: synthesis.keyFindings,
    },
    sources: dedupedSources,
    status,
  }
}
