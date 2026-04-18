/* ── Market Research Prompts v1 ─────────────────────────────── */

import type { NormalizedEvidence } from '../contracts'

export const MARKET_RESEARCH_SYSTEM_PROMPT = `You are a market research analyst producing structured intelligence about markets, trends, and competitive landscapes.

Rules:
- Every claim must reference a source by its ID (e.g. s1, s2)
- Separate facts (sourced) from inferences (your analysis)
- Be specific — reference real companies, real numbers, real trends
- Categorize players accurately: leader (dominant), challenger (growing fast), niche (specialized), emerging (new/small)
- If data is thin, say so — do not invent market sizing or growth rates
- Return ONLY valid JSON, no markdown fences or commentary`

export const MARKET_RESEARCH_SCHEMA_DESC = `{
  "headline": "One sentence market summary",
  "bottomLine": "2-3 sentence strategic takeaway",
  "confidence": "high|medium|low based on evidence quality",
  "marketOverview": "2-3 paragraph market overview with key metrics inline",
  "players": [
    {
      "name": "Company Name",
      "category": "leader|challenger|niche|emerging",
      "description": "What they do and their position",
      "estimatedPosition": "Brief market position description"
    }
  ],
  "trendSignals": [{"text": "...", "sourceIds": ["s1"], "tag": "fact|inference"}],
  "opportunities": [{"text": "...", "sourceIds": ["s1"], "tag": "fact|inference"}],
  "threats": [{"text": "...", "sourceIds": ["s2"], "tag": "fact|inference"}],
  "keyFindings": [{"text": "...", "sourceIds": ["s3"], "tag": "fact|inference"}]
}`

export function buildMarketResearchPrompt(input: {
  marketOrTrend: string
  scope: string
  keyQuestions?: string
  knownPlayers?: string[]
  timeHorizon: string
  evidence: NormalizedEvidence[]
  playerSnapshots: Map<string, string>
}): string {
  const parts: string[] = []

  parts.push(`## Market Research Request
- Market/Trend: ${input.marketOrTrend}
- Scope: ${input.scope}
- Time horizon: ${input.timeHorizon}`)

  if (input.keyQuestions) parts.push(`- Key questions: ${input.keyQuestions}`)
  if (input.knownPlayers?.length) parts.push(`- Known players: ${input.knownPlayers.join(', ')}`)

  for (const [name, snapshot] of Array.from(input.playerSnapshots)) {
    parts.push(`\n## Player: ${name}\n${snapshot}`)
  }

  if (input.evidence.length) {
    const evidenceText = input.evidence
      .map((e) => `[${e.id}] (${e.domain}) ${e.title}: ${e.text}`)
      .join('\n\n')
    parts.push(`\n## Evidence\n${evidenceText}`)
  }

  parts.push(`\n## Instructions
Produce a JSON response matching this exact schema:
${MARKET_RESEARCH_SCHEMA_DESC}

Return 3-5 bullets per section. Tag each as "fact" or "inference".
Every bullet must have at least one sourceId.
Include all known players: ${(input.knownPlayers ?? []).join(', ') || 'discover relevant players'}.
Focus on ${input.scope === 'global' ? 'global perspective' : input.scope + ' market specifically'}.`)

  return parts.join('\n')
}
