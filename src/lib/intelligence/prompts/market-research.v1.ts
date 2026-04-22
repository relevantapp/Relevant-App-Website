/* ── Market Research Prompts v1 ─────────────────────────────── */

import type { NormalizedEvidence, UserResearchContext } from '../contracts'
import { RELEVANT_RESEARCH_STANDARD, formatUserContext } from './common'

export const MARKET_RESEARCH_SYSTEM_PROMPT = `You are a market research analyst producing structured intelligence about markets, trends, and competitive landscapes.

Rules:
${RELEVANT_RESEARCH_STANDARD}
- Every claim must reference a source by its ID (e.g. s1, s2)
- Separate facts (sourced) from inferences (your analysis)
- Be specific — reference real companies, real numbers, real trends
- Categorize players accurately: leader (dominant), challenger (growing fast), niche (specialized), emerging (new/small)
- If data is thin, say so — do not invent market sizing or growth rates
- Return ONLY valid JSON, no markdown fences or commentary`

export const MARKET_RESEARCH_SCHEMA_DESC = `{
  "headline": "One sentence market summary",
  "bottomLine": "2-3 sentence strategic takeaway",
  "whyItMatters": "1-2 sentences explaining why this market research matters to the user personally. Address the user directly as 'you'.",
  "confidence": "high|medium|low based on evidence quality",
  "answer": {
    "conclusion": {"text": "Declarative summary of the market state", "sourceIds": ["s1"], "sourceSnippet": "optional short proof snippet"},
    "whyItMatters": {"text": "Why that market state matters to the user", "sourceIds": ["s2"], "sourceSnippet": "optional short proof snippet"},
    "whatChanged": {"text": "What changed recently in the market or category", "sourceIds": ["s3"], "sourceSnippet": "optional short proof snippet"} or null,
    "confidence": {"level": "high|medium|low", "driver": "Short reason the confidence is what it is"},
    "recommendedNext": {"text": "The next move the user should make", "action": "optional short CTA label", "copyable": "optional copy-ready wording"}
  },
  "marketOverview": "2-3 paragraph market overview with key metrics inline",
  "marketMap": {
    "segments": [
      {
        "name": "Segment name",
        "rationale": "Why this segment matters",
        "players": [
          {
            "name": "Player name",
            "logoUrl": "optional logo URL or null",
            "domain": "optional domain or null"
          }
        ]
      }
    ]
  },
  "trackedSignals": [
    {
      "metric": "Signal name",
      "headline": "Declarative statement of what the trend is doing",
      "unit": "optional unit suffix",
      "points": [{"t": "Q1", "value": 12}, {"t": "Q2", "value": 18}]
    }
  ],
  "maturity": {
    "stage": "innovation-trigger|peak|trough|slope|plateau",
    "rationale": {"text": "Why the market sits at this stage", "sourceIds": ["s4"], "sourceSnippet": "optional short proof snippet"}
  },
  "quotes": [
    {
      "quote": "Short verbatim quote",
      "attribution": {"name": "Source name", "role": "optional role", "source": "Where it came from", "date": "2026-04-09"},
      "theme": "Theme label"
    }
  ],
  "watchList": [
    {
      "signal": "What to monitor next",
      "whyItMatters": "Why this matters for the market call",
      "nextCheckBy": "ISO date",
      "sources": ["s5"]
    }
  ],
  "players": [
    {
      "name": "Company Name",
      "category": "leader|challenger|niche|emerging",
      "description": "What they do and their position",
      "estimatedPosition": "Brief market position description",
      "scale": 0.72,
      "momentum": 0.64,
      "scaleRationale": "Why this player deserves that scale score",
      "momentumRationale": "Why this player deserves that momentum score"
    }
  ],
  "trendSignals": [{"text": "...", "sourceIds": ["s1"], "tag": "fact|inference", "priority": "must|should|fyi"}],
  "opportunities": [{"text": "...", "sourceIds": ["s1"], "tag": "fact|inference", "priority": "must|should|fyi"}],
  "threats": [{"text": "...", "sourceIds": ["s2"], "tag": "fact|inference", "priority": "must|should|fyi"}],
  "keyFindings": [{"text": "...", "sourceIds": ["s3"], "tag": "fact|inference", "priority": "must|should|fyi"}]
}`

export function buildMarketResearchPrompt(input: {
  marketOrTrend: string
  scope: string
  keyQuestions?: string
  knownPlayers?: string[]
  timeHorizon: string
  objective?: string
  region?: string
  customerSegment?: string
  useCase?: string
  depth?: string
  steering?: string
  userContext?: UserResearchContext | null
  evidence: NormalizedEvidence[]
  playerSnapshots: Map<string, string>
  priorBriefBaseline?: string | null
}): string {
  const parts: string[] = []

  parts.push(`## Market Research Request
- Market/Trend: ${input.marketOrTrend}
- Scope: ${input.scope}
- Time horizon: ${input.timeHorizon}`)

  if (input.keyQuestions) parts.push(`- Key questions: ${input.keyQuestions}`)
  if (input.knownPlayers?.length) parts.push(`- Known players: ${input.knownPlayers.join(', ')}`)
  if (input.objective) parts.push(`- Objective: ${input.objective}`)
  if (input.region) parts.push(`- Region: ${input.region}`)
  if (input.customerSegment) parts.push(`- Customer segment: ${input.customerSegment}`)
  if (input.useCase) parts.push(`- Use case: ${input.useCase}`)
  if (input.depth) parts.push(`- Requested depth: ${input.depth}`)
  if (input.steering) parts.push(`- User steering note: ${input.steering}`)

  parts.push(`\n## User Profile Context\n${formatUserContext(input.userContext)}`)

  for (const [name, snapshot] of Array.from(input.playerSnapshots)) {
    parts.push(`\n## Player: ${name}\n${snapshot}`)
  }

  if (input.evidence.length) {
    const evidenceText = input.evidence
      .map((e) => `[${e.id}] (${e.domain}) ${e.title}: ${e.text}`)
      .join('\n\n')
    parts.push(`\n## Evidence\n${evidenceText}`)
  }

  if (input.priorBriefBaseline) {
    parts.push(`\n## Prior Brief Baseline\n${input.priorBriefBaseline}`)
  }

  parts.push(`\n## Instructions
Produce a JSON response matching this exact schema:
${MARKET_RESEARCH_SCHEMA_DESC}

Populate answer with a five-part block the UI can render directly. Use declarative sentences, not labels. Example conclusion tone: "The market is fragmenting, and the answer-first wedge is gaining practical credibility."
answer.conclusion and answer.whyItMatters must cite evidence IDs.
If a Prior Brief Baseline section is present, answer.whatChanged must capture the single most important real delta versus that baseline and cite current evidence IDs. Do not use the prior baseline text itself as a citation.
If no Prior Brief Baseline section is present, answer.whatChanged must be null.
answer.recommendedNext should tell the user what to watch or do next in plain language.
Return 3-5 bullets per section. Tag each as "fact" or "inference".
Every bullet in every section must include priority. Use "must" for category-defining points, "should" for important support, and "fyi" for background context.
Every bullet must have at least one sourceId.
Include all known players: ${(input.knownPlayers ?? []).join(', ') || 'discover relevant players'}.
When you list players, score scale and momentum from 0 to 1 and include a one-line rationale for each score whenever the evidence supports it.
Return marketMap, trackedSignals, maturity, quotes, and watchList when the evidence supports them. Use empty arrays instead of filler, and skip trackedSignals entries that do not have at least two usable points.
Every maturity rationale and every watchList item must cite evidence IDs.
Focus on ${input.scope === 'global' ? 'global perspective' : input.scope + ' market specifically'}.`)

  return parts.join('\n')
}
