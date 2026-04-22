/* ── Competitive Analysis Prompts v1 ───────────────────────── */

import type { NormalizedEvidence, UserResearchContext } from '../contracts'
import { RELEVANT_RESEARCH_STANDARD, formatUserContext } from './common'

export const COMPETITIVE_SYSTEM_PROMPT = `You are a competitive intelligence analyst producing structured competitive analysis.

Rules:
${RELEVANT_RESEARCH_STANDARD}
- Every claim must reference a source by its ID (e.g. s1, s2)
- Separate facts (sourced) from inferences (your analysis)
- Be specific — reference real events, names, numbers, and product features
- Strengths and weaknesses should be concrete and evidence-based
- Score positions in the comparison matrix from 1 (weakest) to 5 (strongest)
- If evidence is thin for a competitor, say so — never fabricate
- Return ONLY valid JSON, no markdown fences or commentary`

export const COMPETITIVE_SCHEMA_DESC = `{
  "headline": "One sentence competitive landscape summary",
  "bottomLine": "2-3 sentence strategic takeaway",
  "whyItMatters": "1-2 sentences explaining why this competitive landscape matters to the user personally. Address the user directly as 'you'.",
  "confidence": "high|medium|low based on evidence quality",
  "answer": {
    "conclusion": {"text": "Declarative summary of who wins where", "sourceIds": ["s1"], "sourceSnippet": "optional short proof snippet"},
    "whyItMatters": {"text": "Why that competitive reality matters to the user", "sourceIds": ["s2"], "sourceSnippet": "optional short proof snippet"},
    "whatChanged": {"text": "What changed recently in the market or rival set", "sourceIds": ["s3"], "sourceSnippet": "optional short proof snippet"} or null,
    "confidence": {"level": "high|medium|low", "driver": "Short reason the confidence is what it is"},
    "recommendedNext": {"text": "The next competitive move to make", "action": "optional short CTA label", "copyable": "optional copy-ready wording"}
  },
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
      "values": [
        {"company": "Your Company", "position": "Brief position", "score": 4},
        {"company": "Competitor A", "position": "Brief position", "score": 3}
      ]
    }
  ],
  "compositeQuadrant": {
    "rendered": true,
    "xAxis": {
      "name": "Axis label",
      "description": "What the axis means",
      "rationale": {"text": "Why this axis is defensible", "sourceIds": ["s1"], "sourceSnippet": "optional short proof snippet"}
    },
    "yAxis": {
      "name": "Axis label",
      "description": "What the axis means",
      "rationale": {"text": "Why this axis is defensible", "sourceIds": ["s2"], "sourceSnippet": "optional short proof snippet"}
    },
    "points": [
      {
        "entity": "Company name",
        "x": 0.42,
        "y": 0.84,
        "rationale": {"text": "Why this company belongs here", "sourceIds": ["s3"], "sourceSnippet": "optional short proof snippet"}
      }
    ]
  } or {"rendered": false, "reason": "Why a quadrant would be misleading here"},
  "keyFindings": [{"text": "...", "sourceIds": ["s1"], "tag": "fact|inference", "priority": "must|should|fyi"}],
  "strategicImplications": [{"text": "...", "sourceIds": ["s1"], "tag": "fact|inference", "priority": "must|should|fyi"}],
  "recommendations": [{"text": "...", "sourceIds": ["s2"], "tag": "fact|inference", "priority": "must|should|fyi"}]
}`

export function buildCompetitivePrompt(input: {
  competitors: string[]
  yourCompany?: string
  focusArea: string
  specificQuestions?: string
  marketSegment?: string
  geography?: string
  customerType?: string
  useCasePreset?: string
  steering?: string
  userContext?: UserResearchContext | null
  evidence: NormalizedEvidence[]
  competitorSnapshots: Map<string, string>
  yourSnapshot: string | null
}): string {
  const parts: string[] = []

  parts.push(`## Analysis Request
- Competitors: ${input.competitors.join(', ')}
- Focus area: ${input.focusArea}`)

  if (input.yourCompany) parts.push(`- Your company: ${input.yourCompany}`)
  if (input.specificQuestions) parts.push(`- Specific questions: ${input.specificQuestions}`)
  if (input.marketSegment) parts.push(`- Market segment: ${input.marketSegment}`)
  if (input.geography) parts.push(`- Geography: ${input.geography}`)
  if (input.customerType) parts.push(`- Customer type: ${input.customerType}`)
  if (input.useCasePreset) parts.push(`- Use case: ${input.useCasePreset}`)
  if (input.steering) parts.push(`- User steering note: ${input.steering}`)

  parts.push(`\n## User Profile Context\n${formatUserContext(input.userContext)}`)

  if (input.yourSnapshot) {
    parts.push(`\n## Your Company Profile\n${input.yourSnapshot}`)
  }

  for (const [name, snapshot] of Array.from(input.competitorSnapshots)) {
    parts.push(`\n## Competitor Profile: ${name}\n${snapshot}`)
  }

  if (input.evidence.length) {
    const evidenceText = input.evidence
      .map((e) => `[${e.id}] (${e.domain}) ${e.title}: ${e.text}`)
      .join('\n\n')
    parts.push(`\n## Evidence\n${evidenceText}`)
  }

  parts.push(`\n## Instructions
Produce a JSON response matching this exact schema:
${COMPETITIVE_SCHEMA_DESC}

Include 3-6 comparison dimensions relevant to "${input.focusArea}".
Populate answer with a five-part block the UI can render directly. Use declarative sentences, not labels. Example conclusion tone: "Relevant wins on direct answers, while AlphaSense still wins on enterprise breadth."
answer.conclusion, answer.whyItMatters, and answer.whatChanged must cite evidence IDs. If no recent shift is defensible, set answer.whatChanged to null.
answer.recommendedNext should be a concrete next move for the user, not a generic suggestion.
Return 3-5 bullets per section. Tag each as "fact" or "inference".
Every bullet in every section must include priority. Use "must" for strategy-critical points, "should" for important support, and "fyi" for background context.
Every bullet must have at least one sourceId.
Include all competitors: ${input.competitors.join(', ')}${input.yourCompany ? ` and ${input.yourCompany}` : ''} in the comparison matrix.
Only return compositeQuadrant.rendered=true when the two axes are genuinely distinct and defensible from the evidence. If the axes would collapse into a vague score soup, return {"rendered": false, "reason": "..."} instead.
When rendered=true, include one point per company using normalized x/y values between 0 and 1, and give both axes and every point a cited rationale.
${input.yourCompany ? `Every comparisonMatrix row must include exactly one values entry for ${input.yourCompany}. Do not omit it from any row.` : ''}`.trim())

  return parts.join('\n')
}
