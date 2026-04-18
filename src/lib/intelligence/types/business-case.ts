/* ── Business Case — Research orchestrator ─────────────────── */

import type {
  BusinessCaseBrief,
  ComparableCompany,
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

interface BusinessCaseSynthesisOutput {
  headline: string
  bottomLine: string
  confidence: 'high' | 'medium' | 'low'
  verdict: 'strong' | 'moderate' | 'weak' | 'insufficient_data'
  verdictRationale: string
  comparables: ComparableCompany[]
  marketEvidence: BriefBullet[]
  supportingFactors: BriefBullet[]
  riskFactors: BriefBullet[]
  openQuestions: BriefBullet[]
  synthesisModel: string | null
}

/* ── System prompt ─────────────────────────────────────────── */

const SYSTEM_PROMPT = `You are a strategy analyst evaluating a business case. Produce a go/no-go assessment. Be balanced. If evidence is thin, say verdict is insufficient_data. Don't fabricate market sizing.

Rules:
- Every claim must reference a source by its ID (e.g. s1, s2)
- Separate facts (sourced) from inferences (your analysis)
- Be specific — reference real events, names, numbers
- If comparable companies had mixed or negative outcomes, report them honestly
- Score confidence based on evidence breadth and quality
- Return ONLY valid JSON, no markdown fences or commentary`

/* ── Prompt builder ────────────────────────────────────────── */

function buildUserPrompt(
  input: {
    initiativeName: string
    hypothesis: string
    targetMarket?: string
    successMetrics?: string[]
    keyQuestions?: string
    comparableCompanies?: string[]
  },
  evidence: NormalizedEvidence[],
  comparableSnapshots: Map<string, string>
): string {
  const parts: string[] = []

  parts.push(`## Business Case Evaluation
- Initiative: ${input.initiativeName}
- Hypothesis: ${input.hypothesis}`)

  if (input.targetMarket) parts.push(`- Target market: ${input.targetMarket}`)
  if (input.successMetrics?.length) parts.push(`- Success metrics: ${input.successMetrics.join(', ')}`)
  if (input.keyQuestions) parts.push(`- Key questions: ${input.keyQuestions}`)

  for (const [name, snapshot] of Array.from(comparableSnapshots)) {
    parts.push(`\n## Comparable: ${name}\n${snapshot}`)
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
  "headline": "One sentence assessment",
  "bottomLine": "2-3 sentence go/no-go recommendation",
  "confidence": "high|medium|low based on evidence quality",
  "verdict": "strong|moderate|weak|insufficient_data",
  "verdictRationale": "2-3 sentences explaining the verdict",
  "comparables": [
    {
      "name": "Company Name",
      "outcome": "success|mixed|failure",
      "relevance": "Why this comparable matters",
      "keyTakeaway": "Main lesson from their experience"
    }
  ],
  "marketEvidence": [{"text": "...", "sourceIds": ["s1"], "tag": "fact"}],
  "supportingFactors": [{"text": "...", "sourceIds": ["s1"], "tag": "fact"}],
  "riskFactors": [{"text": "...", "sourceIds": ["s2"], "tag": "inference"}],
  "openQuestions": [{"text": "...", "sourceIds": [], "tag": "inference"}]
}

Return 3-5 bullets per section. Tag each as "fact" or "inference".
Every bullet must have at least one sourceId (except openQuestions which may have none).
Include all comparables: ${(input.comparableCompanies ?? []).join(', ') || 'none specified'}.`)

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

function parseComparables(raw: unknown): ComparableCompany[] {
  if (!Array.isArray(raw)) return []
  const validOutcomes = ['success', 'mixed', 'failure'] as const
  return raw
    .filter((c): c is Record<string, unknown> => typeof c === 'object' && c !== null)
    .map((c) => ({
      name: typeof c.name === 'string' ? c.name : '',
      outcome: (validOutcomes.includes(c.outcome as typeof validOutcomes[number])
        ? c.outcome
        : 'mixed') as ComparableCompany['outcome'],
      relevance: typeof c.relevance === 'string' ? c.relevance : '',
      keyTakeaway: typeof c.keyTakeaway === 'string' ? c.keyTakeaway : '',
    }))
    .filter((c) => c.name.length > 0)
}

/* ── Synthesis (private) ───────────────────────────────────── */

async function synthesize(
  input: {
    initiativeName: string
    hypothesis: string
    targetMarket?: string
    successMetrics?: string[]
    keyQuestions?: string
    comparableCompanies?: string[]
  },
  evidence: NormalizedEvidence[],
  comparableSnapshots: Map<string, string>
): Promise<BusinessCaseSynthesisOutput> {
  const candidates = getModelCandidates()
  if (candidates.length === 0) {
    throw new Error('No AI provider configured (set GEMINI_API_KEY or OPENROUTER_API_KEY)')
  }

  const userPrompt = buildUserPrompt(input, evidence, comparableSnapshots)

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
          console.error(`[business-case] Gemini error: ${res.status}`, await res.text())
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
          console.error(`[business-case] OpenRouter error: ${res.status}`, await res.text())
          continue
        }
        const data = await res.json()
        content = data.choices?.[0]?.message?.content
      }

      if (!content) {
        console.error('[business-case] Empty response from', provider, model)
        continue
      }

      let cleaned = content.trim()
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
      }

      const parsed = JSON.parse(cleaned)
      const validVerdicts = ['strong', 'moderate', 'weak', 'insufficient_data'] as const

      return {
        headline: typeof parsed.headline === 'string' ? parsed.headline : 'Business case assessment',
        bottomLine: typeof parsed.bottomLine === 'string' ? parsed.bottomLine : '',
        confidence: (['high', 'medium', 'low'] as const).includes(parsed.confidence) ? parsed.confidence : 'medium',
        verdict: validVerdicts.includes(parsed.verdict) ? parsed.verdict : 'insufficient_data',
        verdictRationale: typeof parsed.verdictRationale === 'string' ? parsed.verdictRationale : '',
        comparables: parseComparables(parsed.comparables),
        marketEvidence: parseBullets(parsed.marketEvidence),
        supportingFactors: parseBullets(parsed.supportingFactors),
        riskFactors: parseBullets(parsed.riskFactors),
        openQuestions: parseBullets(parsed.openQuestions),
        synthesisModel: `${provider}/${model}`,
      }
    } catch (err) {
      clearTimeout(timeout)
      const isAbort = typeof err === 'object' && err !== null && 'name' in err && (err as Error).name === 'AbortError'
      console.error(`[business-case] ${isAbort ? 'timeout' : 'failed'}:`, err, provider, model)
      continue
    }
  }

  return {
    headline: 'Unable to generate business case assessment',
    bottomLine: 'AI synthesis failed. Raw evidence is still available.',
    confidence: 'low',
    verdict: 'insufficient_data',
    verdictRationale: 'All AI models failed during synthesis.',
    comparables: [],
    marketEvidence: [],
    supportingFactors: [],
    riskFactors: [],
    openQuestions: [],
    synthesisModel: null,
  }
}

/* ── Main orchestrator ─────────────────────────────────────── */

export async function generateBusinessCaseBrief(input: {
  initiativeName: string
  hypothesis: string
  targetMarket?: string
  successMetrics?: string[]
  keyQuestions?: string
  comparableCompanies?: string[]
}): Promise<BusinessCaseBrief> {
  const totalStart = performance.now()
  resetSourceCounter()

  const limitedComparables = (input.comparableCompanies ?? []).slice(0, 3)
  const allSources: BriefSource[] = []
  const allEvidence: NormalizedEvidence[] = []
  const comparableSnapshots = new Map<string, string>()

  /* ── Parallel searches ───────────────────────────────────── */
  const searchStart = performance.now()

  type SearchJob =
    | { type: 'market'; query: string }
    | { type: 'hypothesis'; query: string }
    | { type: 'comparable'; name: string }
    | { type: 'risks'; query: string }
    | { type: 'marketSignals'; query: string }

  const jobs: SearchJob[] = [
    { type: 'market', query: `${input.targetMarket ?? input.initiativeName} market size trends` },
    { type: 'hypothesis', query: `${input.hypothesis} evidence` },
    { type: 'risks', query: `${input.initiativeName} risks challenges failures` },
  ]

  for (const name of limitedComparables) {
    jobs.push({ type: 'comparable', name })
  }

  if (input.targetMarket) {
    jobs.push({ type: 'marketSignals', query: `${input.targetMarket} growth opportunity` })
  }

  const settled = await Promise.allSettled(
    jobs.map((job) => {
      switch (job.type) {
        case 'market':
          return searchTavilyNews(job.query)
        case 'hypothesis':
          return searchTavilyNews(job.query)
        case 'comparable':
          return searchExaSnapshot(job.name)
        case 'risks':
          return searchExaNews(job.query, 90)
        case 'marketSignals':
          return searchExaNews(job.query, 60)
      }
    })
  )

  const searchMs = Math.round(performance.now() - searchStart)

  /* ── Process results ─────────────────────────────────────── */
  let tavilySearchMs = 0
  let exaSearchMs = 0
  let jobIdx = 0

  // Market research (Tavily)
  const tavilyStart = performance.now()
  const marketResult = settled[jobIdx++]
  if (marketResult.status === 'fulfilled' && marketResult.value) {
    const tavily = marketResult.value as Awaited<ReturnType<typeof searchTavilyNews>>
    const { sources, evidence } = normalizeTavilyResults(tavily.results)
    allSources.push(...sources)
    allEvidence.push(...evidence)
  }

  // Hypothesis validation (Tavily)
  const hypothesisResult = settled[jobIdx++]
  if (hypothesisResult.status === 'fulfilled' && hypothesisResult.value) {
    const tavily = hypothesisResult.value as Awaited<ReturnType<typeof searchTavilyNews>>
    const { sources, evidence } = normalizeTavilyResults(tavily.results)
    allSources.push(...sources)
    allEvidence.push(...evidence)
  }
  tavilySearchMs = Math.round(performance.now() - tavilyStart)

  // Risks (Exa)
  const exaStart = performance.now()
  const risksResult = settled[jobIdx++]
  if (risksResult.status === 'fulfilled' && risksResult.value) {
    const exa = risksResult.value as Awaited<ReturnType<typeof searchExaNews>>
    const { sources, evidence } = normalizeExaResults(exa)
    allSources.push(...sources)
    allEvidence.push(...evidence)
  }

  // Comparable company snapshots (Exa)
  for (const name of limitedComparables) {
    const snapResult = settled[jobIdx++]
    if (snapResult.status === 'fulfilled' && snapResult.value) {
      const snap = snapResult.value as Awaited<ReturnType<typeof searchExaSnapshot>>
      if (snap) {
        const { source, evidence } = normalizeExaSnapshot(snap)
        if (source) allSources.push(source)
        if (evidence) allEvidence.push(evidence)
        comparableSnapshots.set(name, snap.description || name)
      }
    }
  }

  // Market signals (Exa, conditional)
  if (input.targetMarket) {
    const signalsResult = settled[jobIdx++]
    if (signalsResult.status === 'fulfilled' && signalsResult.value) {
      const exa = signalsResult.value as Awaited<ReturnType<typeof searchExaNews>>
      const { sources, evidence } = normalizeExaResults(exa)
      allSources.push(...sources)
      allEvidence.push(...evidence)
    }
  }
  exaSearchMs = Math.round(performance.now() - exaStart)

  const dedupedSources = deduplicateSources(allSources)

  /* ── Synthesis ───────────────────────────────────────────── */
  const synthesisStart = performance.now()
  const synthesis = await synthesize(input, allEvidence, comparableSnapshots)
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
    researchType: 'business_case',
    generatedAt: new Date().toISOString(),
    headline: synthesis.headline,
    bottomLine: synthesis.bottomLine,
    confidence: synthesis.confidence,
    verdict: synthesis.verdict,
    verdictRationale: synthesis.verdictRationale,
    comparables: synthesis.comparables,
    sections: {
      marketEvidence: synthesis.marketEvidence,
      supportingFactors: synthesis.supportingFactors,
      riskFactors: synthesis.riskFactors,
      openQuestions: synthesis.openQuestions,
    },
    sources: dedupedSources,
    status,
  }
}
