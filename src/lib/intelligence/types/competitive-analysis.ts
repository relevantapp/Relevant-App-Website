/* ── Competitive Analysis — Research orchestrator ──────────── */

import type {
  CompetitiveAnalysisBrief,
  CompetitorProfile,
  ComparisonRow,
  BriefBullet,
  BriefSource,
  BriefStatus,
  NormalizedEvidence,
} from '../types'
import { searchExaSnapshot, searchExaNews, searchExaCompetitor } from '../providers/exa'
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

interface CompetitiveSynthesisOutput {
  headline: string
  bottomLine: string
  confidence: 'high' | 'medium' | 'low'
  competitors: CompetitorProfile[]
  comparisonMatrix: ComparisonRow[]
  keyFindings: BriefBullet[]
  strategicImplications: BriefBullet[]
  recommendations: BriefBullet[]
  synthesisModel: string | null
}

/* ── System prompt ─────────────────────────────────────────── */

const SYSTEM_PROMPT = `You are a competitive intelligence analyst producing structured competitive analysis.

Rules:
- Every claim must reference a source by its ID (e.g. s1, s2)
- Separate facts (sourced) from inferences (your analysis)
- Be specific — reference real events, names, numbers, and product features
- Strengths and weaknesses should be concrete and evidence-based
- Score positions in the comparison matrix from 1 (weakest) to 5 (strongest)
- If evidence is thin for a competitor, say so — never fabricate
- Return ONLY valid JSON, no markdown fences or commentary`

/* ── Prompt builder ────────────────────────────────────────── */

function buildUserPrompt(
  input: { competitors: string[]; yourCompany?: string; focusArea: string; specificQuestions?: string },
  evidence: NormalizedEvidence[],
  competitorSnapshots: Map<string, string>,
  yourSnapshot: string | null
): string {
  const parts: string[] = []

  parts.push(`## Analysis Request
- Competitors: ${input.competitors.join(', ')}
- Focus area: ${input.focusArea}`)

  if (input.yourCompany) parts.push(`- Your company: ${input.yourCompany}`)
  if (input.specificQuestions) parts.push(`- Specific questions: ${input.specificQuestions}`)

  if (yourSnapshot) {
    parts.push(`\n## Your Company Profile\n${yourSnapshot}`)
  }

  for (const [name, snapshot] of Array.from(competitorSnapshots)) {
    parts.push(`\n## Competitor Profile: ${name}\n${snapshot}`)
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
  "headline": "One sentence competitive landscape summary",
  "bottomLine": "2-3 sentence strategic takeaway",
  "confidence": "high|medium|low based on evidence quality",
  "competitors": [
    {
      "name": "Competitor Name",
      "description": "What they do in 1-2 sentences",
      "strengths": ["Specific strength with evidence"],
      "weaknesses": ["Specific weakness with evidence"],
      "recentMoves": ["Recent move or announcement"]
    }
  ],
  "comparisonMatrix": [
    {
      "dimension": "Product Depth",
      "values": [{"company": "CompanyA", "position": "Brief position", "score": 4}]
    }
  ],
  "keyFindings": [{"text": "...", "sourceIds": ["s1"], "tag": "fact"}],
  "strategicImplications": [{"text": "...", "sourceIds": ["s1"], "tag": "inference"}],
  "recommendations": [{"text": "...", "sourceIds": ["s2"], "tag": "inference"}]
}

Include 3-6 comparison dimensions relevant to "${input.focusArea}".
Return 3-5 bullets per section. Tag each as "fact" or "inference".
Every bullet must have at least one sourceId.
Include all competitors: ${input.competitors.join(', ')}${input.yourCompany ? ` and ${input.yourCompany}` : ''} in the comparison matrix.`)

  return parts.join('\n')
}

/* ── Bullet parser ─────────────────────────────────────────── */

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

function parseCompetitors(raw: unknown): CompetitorProfile[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((c): c is Record<string, unknown> => typeof c === 'object' && c !== null)
    .map((c) => ({
      name: typeof c.name === 'string' ? c.name : '',
      description: typeof c.description === 'string' ? c.description : '',
      strengths: Array.isArray(c.strengths) ? c.strengths.filter((s): s is string => typeof s === 'string') : [],
      weaknesses: Array.isArray(c.weaknesses) ? c.weaknesses.filter((s): s is string => typeof s === 'string') : [],
      recentMoves: Array.isArray(c.recentMoves) ? c.recentMoves.filter((s): s is string => typeof s === 'string') : [],
    }))
    .filter((c) => c.name.length > 0)
}

function parseMatrix(raw: unknown): ComparisonRow[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
    .map((r) => ({
      dimension: typeof r.dimension === 'string' ? r.dimension : '',
      values: Array.isArray(r.values)
        ? r.values
            .filter((v): v is Record<string, unknown> => typeof v === 'object' && v !== null)
            .map((v) => ({
              company: typeof v.company === 'string' ? v.company : '',
              position: typeof v.position === 'string' ? v.position : '',
              score: typeof v.score === 'number' ? Math.min(5, Math.max(1, Math.round(v.score))) : 3,
            }))
        : [],
    }))
    .filter((r) => r.dimension.length > 0)
}

/* ── Synthesis (private) ───────────────────────────────────── */

async function synthesize(
  input: { competitors: string[]; yourCompany?: string; focusArea: string; specificQuestions?: string },
  evidence: NormalizedEvidence[],
  competitorSnapshots: Map<string, string>,
  yourSnapshot: string | null
): Promise<CompetitiveSynthesisOutput> {
  const candidates = getModelCandidates()
  if (candidates.length === 0) {
    throw new Error('No AI provider configured (set GEMINI_API_KEY or OPENROUTER_API_KEY)')
  }

  const userPrompt = buildUserPrompt(input, evidence, competitorSnapshots, yourSnapshot)

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
          console.error(`[competitive] Gemini error: ${res.status}`, await res.text())
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
          console.error(`[competitive] OpenRouter error: ${res.status}`, await res.text())
          continue
        }
        const data = await res.json()
        content = data.choices?.[0]?.message?.content
      }

      if (!content) {
        console.error('[competitive] Empty response from', provider, model)
        continue
      }

      let cleaned = content.trim()
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
      }

      const parsed = JSON.parse(cleaned)

      return {
        headline: typeof parsed.headline === 'string' ? parsed.headline : 'Competitive analysis',
        bottomLine: typeof parsed.bottomLine === 'string' ? parsed.bottomLine : '',
        confidence: ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'medium',
        competitors: parseCompetitors(parsed.competitors),
        comparisonMatrix: parseMatrix(parsed.comparisonMatrix),
        keyFindings: parseBullets(parsed.keyFindings),
        strategicImplications: parseBullets(parsed.strategicImplications),
        recommendations: parseBullets(parsed.recommendations),
        synthesisModel: `${provider}/${model}`,
      }
    } catch (err) {
      clearTimeout(timeout)
      const isAbort = typeof err === 'object' && err !== null && 'name' in err && (err as Error).name === 'AbortError'
      console.error(`[competitive] ${isAbort ? 'timeout' : 'failed'}:`, err, provider, model)
      continue
    }
  }

  return {
    headline: 'Unable to generate competitive analysis',
    bottomLine: 'AI synthesis failed. Raw evidence is still available.',
    confidence: 'low',
    competitors: [],
    comparisonMatrix: [],
    keyFindings: [],
    strategicImplications: [],
    recommendations: [],
    synthesisModel: null,
  }
}

/* ── Main orchestrator ─────────────────────────────────────── */

export async function generateCompetitiveAnalysisBrief(input: {
  competitors: string[]
  yourCompany?: string
  focusArea: string
  specificQuestions?: string
}): Promise<CompetitiveAnalysisBrief> {
  const totalStart = performance.now()
  resetSourceCounter()

  const limitedCompetitors = input.competitors.slice(0, 3)
  const allSources: BriefSource[] = []
  const allEvidence: NormalizedEvidence[] = []
  const competitorSnapshots = new Map<string, string>()

  /* ── Parallel searches ───────────────────────────────────── */
  const exaStart = performance.now()

  type SearchJob =
    | { type: 'snapshot'; name: string }
    | { type: 'news'; name: string }
    | { type: 'your_snapshot' }
    | { type: 'crossComparison' }
    | { type: 'focusArea'; competitor: string }

  const jobs: SearchJob[] = []

  for (const c of limitedCompetitors) {
    jobs.push({ type: 'snapshot', name: c })
    jobs.push({ type: 'news', name: c })
  }
  if (input.yourCompany) {
    jobs.push({ type: 'your_snapshot' })
  }
  jobs.push({ type: 'crossComparison' })
  if (input.focusArea !== 'overall') {
    for (const c of limitedCompetitors) {
      jobs.push({ type: 'focusArea', competitor: c })
    }
  }

  const settled = await Promise.allSettled(
    jobs.map((job) => {
      switch (job.type) {
        case 'snapshot':
          return searchExaSnapshot(job.name)
        case 'news':
          return searchExaNews(job.name, 30)
        case 'your_snapshot':
          return searchExaSnapshot(input.yourCompany!)
        case 'crossComparison':
          return searchTavilyNews(limitedCompetitors.join(' vs '))
        case 'focusArea':
          return searchTavilyNews(`${job.competitor} ${input.focusArea}`)
      }
    })
  )

  const exaSearchMs = Math.round(performance.now() - exaStart)

  /* ── Process results ─────────────────────────────────────── */
  let tavilySearchMs = 0
  let yourSnapshot: string | null = null
  let jobIdx = 0

  for (const c of limitedCompetitors) {
    // snapshot
    const snapResult = settled[jobIdx++]
    if (snapResult.status === 'fulfilled' && snapResult.value) {
      const snap = snapResult.value as Awaited<ReturnType<typeof searchExaSnapshot>>
      if (snap) {
        const { source, evidence } = normalizeExaSnapshot(snap)
        if (source) allSources.push(source)
        if (evidence) allEvidence.push(evidence)
        competitorSnapshots.set(c, snap.description || c)
      }
    }

    // news
    const newsResult = settled[jobIdx++]
    if (newsResult.status === 'fulfilled' && newsResult.value) {
      const news = newsResult.value as Awaited<ReturnType<typeof searchExaNews>>
      const { sources, evidence } = normalizeExaResults(news)
      allSources.push(...sources)
      allEvidence.push(...evidence)
    }
  }

  // your snapshot
  if (input.yourCompany) {
    const yourResult = settled[jobIdx++]
    if (yourResult.status === 'fulfilled' && yourResult.value) {
      const snap = yourResult.value as Awaited<ReturnType<typeof searchExaSnapshot>>
      if (snap) {
        const { source, evidence } = normalizeExaSnapshot(snap)
        if (source) allSources.push(source)
        if (evidence) allEvidence.push(evidence)
        yourSnapshot = snap.description || input.yourCompany
      }
    }
  }

  // cross-comparison (Tavily)
  const tavilyStart = performance.now()
  const crossResult = settled[jobIdx++]
  if (crossResult.status === 'fulfilled' && crossResult.value) {
    const tavily = crossResult.value as Awaited<ReturnType<typeof searchTavilyNews>>
    const { sources, evidence } = normalizeTavilyResults(tavily.results)
    allSources.push(...sources)
    allEvidence.push(...evidence)
  }

  // focus-area searches
  if (input.focusArea !== 'overall') {
    for (let i = 0; i < limitedCompetitors.length; i++) {
      const focusResult = settled[jobIdx++]
      if (focusResult.status === 'fulfilled' && focusResult.value) {
        const tavily = focusResult.value as Awaited<ReturnType<typeof searchTavilyNews>>
        const { sources, evidence } = normalizeTavilyResults(tavily.results)
        allSources.push(...sources)
        allEvidence.push(...evidence)
      }
    }
  }
  tavilySearchMs = Math.round(performance.now() - tavilyStart)

  const dedupedSources = deduplicateSources(allSources)

  /* ── Synthesis ───────────────────────────────────────────── */
  const synthesisStart = performance.now()
  const synthesis = await synthesize(input, allEvidence, competitorSnapshots, yourSnapshot)
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
    researchType: 'competitive_analysis',
    generatedAt: new Date().toISOString(),
    headline: synthesis.headline,
    bottomLine: synthesis.bottomLine,
    confidence: synthesis.confidence,
    yourCompany: input.yourCompany ?? null,
    competitors: synthesis.competitors,
    comparisonMatrix: synthesis.comparisonMatrix,
    sections: {
      keyFindings: synthesis.keyFindings,
      strategicImplications: synthesis.strategicImplications,
      recommendations: synthesis.recommendations,
    },
    sources: dedupedSources,
    status,
  }
}
