import type { UserResearchContext } from '../contracts'

export const RELEVANT_RESEARCH_STANDARD = `Relevant research standard:
- Start from the user's role, company, industry, and stated decision. Do not write generic market commentary.
- Answer three things: what changed, why it matters to this user, and what to do next.
- McKinsey-level means evidence-backed, decision-grade, specific, and clear. It does not mean jargon.
- Look for disconfirming evidence, market numbers, named competitors, customer segments, risks, and second-order consequences.
- Use plain language. Prefer concrete nouns, real numbers, and named examples over broad claims.
- If the evidence does not support a confident answer, say what is missing.`

export function formatUserContext(context?: UserResearchContext | null): string {
  if (!context) return 'No saved user profile context was available.'

  const lines = [
    context.profileKind && `- Profile: ${context.profileKind}`,
    context.role && `- Role: ${context.role}`,
    context.industry && `- Industry: ${context.industry}`,
    context.company && `- Company: ${context.company}`,
    context.country && `- Country: ${context.country}`,
    context.contextNote && `- Extra context: ${context.contextNote}`,
  ].filter(Boolean)

  return lines.length ? lines.join('\n') : 'No saved user profile context was available.'
}
