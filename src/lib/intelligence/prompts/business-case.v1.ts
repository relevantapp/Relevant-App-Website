/* ── Business Case Prompts v1 ──────────────────────────────── */

import type { NormalizedEvidence, UserResearchContext } from '../contracts'
import { RELEVANT_RESEARCH_STANDARD, formatUserContext } from './common'

export const BUSINESS_CASE_SYSTEM_PROMPT = `You are a strategy analyst evaluating a business case. Produce a go/no-go assessment. Be balanced. If evidence is thin, say verdict is insufficient_data. Don't fabricate market sizing.

Rules:
${RELEVANT_RESEARCH_STANDARD}
- Every claim must reference a source by its ID (e.g. s1, s2)
- Separate facts (sourced) from inferences (your analysis)
- Be specific — reference real events, names, numbers
- If comparable companies had mixed or negative outcomes, report them honestly
- Score confidence based on evidence breadth and quality
- Return ONLY valid JSON, no markdown fences or commentary`

export const BUSINESS_CASE_SCHEMA_DESC = `{
  "headline": "One sentence assessment",
  "bottomLine": "2-3 sentence go/no-go recommendation",
  "whyItMatters": "1-2 sentences explaining why this assessment matters to the user's decision. Address the user directly as 'you'.",
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
  "marketEvidence": [{"text": "...", "sourceIds": ["s1"], "tag": "fact|inference"}],
  "supportingFactors": [{"text": "...", "sourceIds": ["s1"], "tag": "fact|inference", "severity": "high|med|low", "impact": "high|med|low"}],
  "riskFactors": [{"text": "...", "sourceIds": ["s2"], "tag": "fact|inference", "severity": "high|med|low", "impact": "high|med|low"}],
  "openQuestions": [{"text": "...", "sourceIds": [], "tag": "inference"}]
}`

export function buildBusinessCasePrompt(input: {
  initiativeName: string
  hypothesis: string
  targetMarket?: string
  successMetrics?: string[]
  keyQuestions?: string
  comparableCompanies?: string[]
  decisionType?: string
  decisionAudience?: string
  timeHorizon?: string
  investmentLevel?: string
  roiFrame?: string[]
  steering?: string
  userContext?: UserResearchContext | null
  evidence: NormalizedEvidence[]
  comparableSnapshots: Map<string, string>
}): string {
  const parts: string[] = []

  parts.push(`## Business Case Evaluation
- Initiative: ${input.initiativeName}
- Hypothesis: ${input.hypothesis}`)

  if (input.targetMarket) parts.push(`- Target market: ${input.targetMarket}`)
  if (input.successMetrics?.length) parts.push(`- Success metrics: ${input.successMetrics.join(', ')}`)
  if (input.keyQuestions) parts.push(`- Key questions: ${input.keyQuestions}`)
  if (input.decisionType) parts.push(`- Decision type: ${input.decisionType}`)
  if (input.decisionAudience) parts.push(`- Decision audience: ${input.decisionAudience}`)
  if (input.timeHorizon) parts.push(`- Time horizon: ${input.timeHorizon}`)
  if (input.investmentLevel) parts.push(`- Investment level: ${input.investmentLevel}`)
  if (input.roiFrame?.length) parts.push(`- ROI frame: ${input.roiFrame.join(', ')}`)
  if (input.steering) parts.push(`- User steering note: ${input.steering}`)

  parts.push(`\n## User Profile Context\n${formatUserContext(input.userContext)}`)

  for (const [name, snapshot] of Array.from(input.comparableSnapshots)) {
    parts.push(`\n## Comparable: ${name}\n${snapshot}`)
  }

  if (input.evidence.length) {
    const evidenceText = input.evidence
      .map((e) => `[${e.id}] (${e.domain}) ${e.title}: ${e.text}`)
      .join('\n\n')
    parts.push(`\n## Evidence\n${evidenceText}`)
  }

  parts.push(`\n## Instructions
Produce a JSON response matching this exact schema:
${BUSINESS_CASE_SCHEMA_DESC}

Return 3-5 bullets per section. Tag each as "fact" or "inference".
Every bullet must have at least one sourceId (except openQuestions which may have none).
For every supportingFactors and riskFactors item, include both severity and impact tags. Use only high, med, or low.
Include all comparables: ${(input.comparableCompanies ?? []).join(', ') || 'none specified'}.`)

  return parts.join('\n')
}
