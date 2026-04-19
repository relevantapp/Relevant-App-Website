/* ── Meeting Prep Prompts v1 ────────────────────────────────── */

import type { CompanySnapshot, AttendeeProfile, NormalizedEvidence } from '../contracts'

export const MEETING_PREP_SYSTEM_PROMPT = `You are a meeting intelligence analyst for a professional preparing for a business meeting.

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

export const MEETING_PREP_SCHEMA_DESC = `{
  "headline": "One sentence summary of what matters most",
  "bottomLine": "2-3 sentence meeting answer tailored to the goal",
  "whyItMatters": "1-2 sentences explaining why this research matters to the user personally, based on their stated goal. Address the user directly as 'you'.",
  "confidence": "high|medium|low based on evidence quality",
  "whatJustHappened": [{"text": "...", "sourceIds": ["s1"], "tag": "fact|inference"}],
  "talkingPoints": [{"text": "...", "sourceIds": ["s1"], "tag": "fact|inference"}],
  "landmines": [{"text": "...", "sourceIds": ["s2"], "tag": "fact|inference"}],
  "questionsToAsk": [{"text": "...", "sourceIds": ["s3"], "tag": "fact|inference"}],
  "competitorContext": [{"text": "...", "sourceIds": ["s4"], "tag": "fact|inference"}]
}`

export function buildMeetingPrepPrompt(input: {
  accountName: string
  meetingType: string
  goal: string
  notes?: string
  attendees?: string[]
  competitors?: string[]
  snapshot: CompanySnapshot | null
  evidence: NormalizedEvidence[]
  attendeeProfiles: AttendeeProfile[]
}): string {
  const parts: string[] = []

  parts.push(`## Meeting Context
- Account: ${input.accountName}
- Meeting type: ${input.meetingType}
- Goal: ${input.goal}`)

  if (input.notes) parts.push(`- Notes: ${input.notes}`)
  if (input.attendees?.length) parts.push(`- Attendees: ${input.attendees.join(', ')}`)
  if (input.competitors?.length) parts.push(`- Competitors: ${input.competitors.join(', ')}`)

  if (input.snapshot) {
    parts.push(`\n## Company Snapshot\n${JSON.stringify(input.snapshot, null, 2)}`)
  }

  if (input.evidence.length) {
    const evidenceText = input.evidence
      .map((e) => `[${e.id}] (${e.domain}) ${e.title}: ${e.text}`)
      .join('\n\n')
    parts.push(`\n## Recent Evidence\n${evidenceText}`)
  }

  if (input.attendeeProfiles.length) {
    const profileText = input.attendeeProfiles
      .map((p) => `- ${p.name}: ${p.title || 'Unknown title'} at ${p.company || 'Unknown company'}. ${p.background || ''}`)
      .join('\n')
    parts.push(`\n## Attendee Backgrounds\n${profileText}`)
  }

  parts.push(`\n## Instructions
Produce a JSON response matching this exact schema:
${MEETING_PREP_SCHEMA_DESC}

Return 3-5 bullets per section. Tag each as "fact" (directly sourced) or "inference" (your analysis based on evidence).
Every bullet must have at least one sourceId referencing the evidence IDs above.
If a section has no evidence, return an empty array — do not fill with generic advice.
${!input.competitors?.length ? 'competitorContext should be an empty array since no competitors were provided.' : ''}`)

  return parts.join('\n')
}
