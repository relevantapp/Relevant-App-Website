/* ── Meeting Prep Prompts v1 ────────────────────────────────── */

import {
  MEETING_PREP_RADAR_CATEGORIES,
  MEETING_PREP_TIMELINE_EVENT_TYPES,
  MEETING_PREP_TIMELINE_IMPACTS,
  type AttendeeProfile,
  type MeetingPrepSnapshot,
  type NormalizedEvidence,
  type UserResearchContext,
} from '../contracts'
import { RELEVANT_RESEARCH_STANDARD, formatUserContext } from './common'

function formatSnapshotForPrompt(snapshot: MeetingPrepSnapshot): string {
  const lines = [
    `- Name: ${snapshot.name}`,
    `- Summary: ${snapshot.summary}`,
    snapshot.whatTheyDo ? `- What they do: ${snapshot.whatTheyDo}` : null,
    snapshot.industry ? `- Industry: ${snapshot.industry}` : null,
    snapshot.headquarters ? `- Headquarters: ${snapshot.headquarters}` : null,
    snapshot.employeeRange ? `- Employee range: ${snapshot.employeeRange}` : null,
    snapshot.funding ? `- Funding: ${snapshot.funding}` : null,
    snapshot.ceo ? `- CEO: ${snapshot.ceo}` : null,
    snapshot.website ? `- Website: ${snapshot.website}` : null,
    snapshot.recentMilestone ? `- Recent milestone: ${snapshot.recentMilestone}` : null,
    snapshot.knownUnknowns.length ? `- Known unknowns: ${snapshot.knownUnknowns.join('; ')}` : null,
  ].filter(Boolean)

  return lines.join('\n')
}

export const MEETING_PREP_SYSTEM_PROMPT = `You are a meeting intelligence analyst for a professional preparing for a business meeting.

Your job is to analyze evidence about a company/person and produce a concise, actionable briefing.

Rules:
${RELEVANT_RESEARCH_STANDARD}
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
  "answer": {
    "conclusion": {"text": "Declarative answer to the meeting question", "sourceIds": ["s1"], "sourceSnippet": "optional short proof snippet"},
    "whyItMatters": {"text": "Why this matters to the user in this meeting", "sourceIds": ["s2"], "sourceSnippet": "optional short proof snippet"},
    "whatChanged": {"text": "What just changed recently and why it alters the meeting", "sourceIds": ["s3"], "sourceSnippet": "optional short proof snippet"} or null,
    "confidence": {"level": "high|medium|low", "driver": "Short reason the confidence is what it is"},
    "recommendedNext": {"text": "The next move the user should make", "action": "optional short CTA label", "copyable": "optional copy-ready wording"}
  },
  "momentumScore": "integer 0-100 measuring account momentum; omit only if evidence is truly insufficient",
  "riskLevel": "low|medium|high",
  "sentiment": "positive|neutral|negative",
  "timelineEvents": [{
    "date": "Specific date or precise date label",
    "type": "${MEETING_PREP_TIMELINE_EVENT_TYPES.join('|')}",
    "impact": "${MEETING_PREP_TIMELINE_IMPACTS.join('|')}",
    "text": "Single-sentence event summary",
    "sourceIds": ["s1"]
  }],
  "radarMetrics": [{
    "category": "${MEETING_PREP_RADAR_CATEGORIES.join('|')}",
    "severity": "integer 0-5",
    "details": "Why this axis matters for the meeting",
    "sourceIds": ["s1"]
  }],
  "signalCards": [{
    "date": "Specific ISO date or precise date label tied to the signal",
    "headline": "Declarative statement of what moved",
    "whyItMatters": "One-sentence reason this changes the meeting",
    "suggestedOpener": "Optional opener the user can say out loud",
    "sources": ["s1"]
  }],
  "competitorMatrix": [{
    "name": "Competitor name",
    "threatLevel": "integer 0-4",
    "marketOverlap": "integer 0-4",
    "advantage": "Short summary of their edge",
    "tags": ["tag1", "tag2"],
    "sourceIds": ["s2"]
  }],
  "whatJustHappened": [{"text": "...", "sourceIds": ["s1"], "tag": "fact|inference", "priority": "must|should|fyi"}],
  "talkingPoints": [{"text": "...", "sourceIds": ["s1"], "tag": "fact|inference", "priority": "must|should|fyi"}],
  "landmines": [{"text": "...", "sourceIds": ["s2"], "tag": "fact|inference", "priority": "must|should|fyi"}],
  "questionsToAsk": [{"text": "...", "sourceIds": ["s3"], "tag": "fact|inference", "priority": "must|should|fyi"}],
  "competitorContext": [{"text": "...", "sourceIds": ["s4"], "tag": "fact|inference", "priority": "must|should|fyi"}]
}`

export function buildMeetingPrepPrompt(input: {
  accountName: string
  meetingType: string
  goal: string
  notes?: string
  attendees?: string[]
  competitors?: string[]
  relationshipStage?: string
  whatYoureSelling?: string
  desiredNextStep?: string
  painPoints?: string[]
  steering?: string
  userContext?: UserResearchContext | null
  snapshot: MeetingPrepSnapshot | null
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
  if (input.relationshipStage) parts.push(`- Relationship stage: ${input.relationshipStage}`)
  if (input.whatYoureSelling) parts.push(`- What the user is selling: ${input.whatYoureSelling}`)
  if (input.desiredNextStep) parts.push(`- Desired next step: ${input.desiredNextStep}`)
  if (input.painPoints?.length) parts.push(`- Pain points to explore: ${input.painPoints.join(', ')}`)
  if (input.steering) parts.push(`- User steering note: ${input.steering}`)

  parts.push(`\n## User Profile Context\n${formatUserContext(input.userContext)}`)

  if (input.snapshot) {
    parts.push(`\n## Company Snapshot\n${formatSnapshotForPrompt(input.snapshot)}`)
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
Populate answer with a five-part block the UI can render directly. Use declarative sentences, not labels. Example conclusion tone: "Acme just created a fresh opening for this meeting because the team is pushing a new rollout motion."
answer.conclusion, answer.whyItMatters, and answer.whatChanged must cite evidence IDs. If there is no defensible recent change, set answer.whatChanged to null.
answer.recommendedNext should tell the user what to do next in plain language, and copyable should be ready to paste into notes or a prep doc when helpful.
Every bullet in every section must include priority. Use "must" for meeting-critical items, "should" for important support, and "fyi" for background context.
Every bullet must have at least one sourceId referencing the evidence IDs above.
Return 4-6 timelineEvents when there is evidence. Each event must be concrete, recent when possible, and include sourceIds.
Return exactly 5 radarMetrics aligned to these categories in this spirit: ${MEETING_PREP_RADAR_CATEGORIES.join(', ')}. If the evidence cannot support a trustworthy five-axis view, return an empty array.
Return 3-5 signalCards when there is real evidence of fresh movement. Each card must include a concrete date, a declarative headline, a one-sentence whyItMatters, at least one source, and an optional suggestedOpener. If the evidence is thin, return an empty array.
Return 3-5 competitorMatrix rows when there is real competitive evidence. If evidence is thin, return an empty array.
Every timeline event, radar metric, competitor row, and signal card must include evidence IDs.
Use empty arrays instead of filler whenever evidence is insufficient.
If a section has no evidence, return an empty array — do not fill with generic advice.
${!input.competitors?.length ? 'competitorContext and competitorMatrix should both be empty arrays since no competitors were provided.' : ''}`)

  return parts.join('\n')
}
