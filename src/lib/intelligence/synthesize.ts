/* ── Synthesize — Build LLM prompt, call AI, parse brief ────── */

import type {
  IntelligenceRequest,
  CompanySnapshot,
  AttendeeProfile,
  NormalizedEvidence,
  BriefBullet,
} from './types'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const SYNTHESIS_MODEL = 'anthropic/claude-sonnet-4'
const SYNTHESIS_TIMEOUT = 30_000

interface SynthesisInput {
  request: IntelligenceRequest
  snapshot: CompanySnapshot | null
  evidence: NormalizedEvidence[]
  attendeeProfiles: AttendeeProfile[]
}

interface SynthesisOutput {
  headline: string
  bottomLine: string
  confidence: 'high' | 'medium' | 'low'
  whatJustHappened: BriefBullet[]
  talkingPoints: BriefBullet[]
  landmines: BriefBullet[]
  questionsToAsk: BriefBullet[]
  competitorContext: BriefBullet[]
}

const SYSTEM_PROMPT = `You are a meeting intelligence analyst for a professional preparing for a business meeting.

Your job is to analyze evidence about a company/person and produce a concise, actionable briefing.

Rules:
- Every claim must reference a source by its ID (e.g. s1, s2)
- Separate facts (sourced) from inferences (your analysis)
- Be specific — reference real events, real names, real numbers
- Talking points should reference specific recent events the user can mention
- Landmines should be things that could go wrong or topics to avoid
- Questions should be smart and specific, not generic
- If evidence is thin, say so — never fabricate
- Write for someone who has 10 minutes to prepare
- Return ONLY valid JSON, no markdown fences or commentary`

function buildUserPrompt(input: SynthesisInput): string {
  const { request, snapshot, evidence, attendeeProfiles } = input

  const parts: string[] = []

  parts.push(`## Meeting Context
- Account: ${request.accountName}
- Meeting type: ${request.meetingType}
- Goal: ${request.goal}`)

  if (request.notes) parts.push(`- Notes: ${request.notes}`)
  if (request.attendees?.length) parts.push(`- Attendees: ${request.attendees.join(', ')}`)
  if (request.competitors?.length) parts.push(`- Competitors: ${request.competitors.join(', ')}`)

  if (snapshot) {
    parts.push(`\n## Company Snapshot\n${JSON.stringify(snapshot, null, 2)}`)
  }

  if (evidence.length) {
    const evidenceText = evidence
      .map((e) => `[${e.id}] (${e.domain}) ${e.title}: ${e.text}`)
      .join('\n\n')
    parts.push(`\n## Recent Evidence\n${evidenceText}`)
  }

  if (attendeeProfiles.length) {
    const profileText = attendeeProfiles
      .map((p) => `- ${p.name}: ${p.title || 'Unknown title'} at ${p.company || 'Unknown company'}. ${p.background || ''}`)
      .join('\n')
    parts.push(`\n## Attendee Backgrounds\n${profileText}`)
  }

  parts.push(`\n## Instructions
Produce a JSON response matching this exact schema:
{
  "headline": "One sentence summary of what matters most",
  "bottomLine": "2-3 sentence meeting answer tailored to the goal",
  "confidence": "high|medium|low based on evidence quality",
  "whatJustHappened": [{"text": "...", "sourceIds": ["s1"], "tag": "fact"}],
  "talkingPoints": [{"text": "...", "sourceIds": ["s1"], "tag": "inference"}],
  "landmines": [{"text": "...", "sourceIds": ["s2"], "tag": "fact"}],
  "questionsToAsk": [{"text": "...", "sourceIds": ["s3"], "tag": "inference"}],
  "competitorContext": [{"text": "...", "sourceIds": ["s4"], "tag": "fact"}]
}

Return 3-5 bullets per section. Tag each as "fact" (directly sourced) or "inference" (your analysis based on evidence).
Every bullet must have at least one sourceId referencing the evidence IDs above.
If a section has no evidence, return an empty array — do not fill with generic advice.
${!request.competitors?.length ? 'competitorContext should be an empty array since no competitors were provided.' : ''}`)

  return parts.join('\n')
}

function parseBullets(raw: unknown): BriefBullet[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((b): b is Record<string, unknown> => typeof b === 'object' && b !== null)
    .map((b) => ({
      text: typeof b.text === 'string' ? b.text : '',
      sourceIds: Array.isArray(b.sourceIds) ? b.sourceIds.filter((s): s is string => typeof s === 'string') : [],
      tag: b.tag === 'fact' ? 'fact' as const : 'inference' as const,
    }))
    .filter((b) => b.text.length > 0)
}

export async function synthesizeBrief(
  input: SynthesisInput
): Promise<SynthesisOutput> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), SYNTHESIS_TIMEOUT)

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://www.getrelevantapp.com',
        'X-Title': 'Relevant Intelligence',
      },
      body: JSON.stringify({
        model: SYNTHESIS_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt(input) },
        ],
        temperature: 0.3,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) {
      const errText = await res.text()
      console.error('[synthesize] OpenRouter error:', res.status, errText)
      throw new Error(`Synthesis failed (${res.status})`)
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) throw new Error('Empty synthesis response')

    const parsed = JSON.parse(content)

    return {
      headline: typeof parsed.headline === 'string' ? parsed.headline : 'Meeting intelligence brief',
      bottomLine: typeof parsed.bottomLine === 'string' ? parsed.bottomLine : '',
      confidence: ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'medium',
      whatJustHappened: parseBullets(parsed.whatJustHappened),
      talkingPoints: parseBullets(parsed.talkingPoints),
      landmines: parseBullets(parsed.landmines),
      questionsToAsk: parseBullets(parsed.questionsToAsk),
      competitorContext: parseBullets(parsed.competitorContext),
    }
  } catch (err) {
    clearTimeout(timeout)
    console.error('[synthesize] failed:', err)

    // Return degraded result instead of crashing
    return {
      headline: 'Unable to generate full analysis',
      bottomLine: 'The AI synthesis step failed. The raw evidence is still available below.',
      confidence: 'low',
      whatJustHappened: [],
      talkingPoints: [],
      landmines: [],
      questionsToAsk: [],
      competitorContext: [],
    }
  }
}
