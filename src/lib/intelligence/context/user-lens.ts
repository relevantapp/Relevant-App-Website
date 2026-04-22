import type { ResearchIntentPacket, UserLens, UserResearchContext } from '../contracts'

function concernsForRole(role: string | null): string[] {
  const normalized = role?.toLowerCase() ?? ''
  if (normalized.includes('sales') || normalized.includes('revenue')) {
    return ['account timing', 'budget pressure', 'champion strength', 'competitive displacement']
  }
  if (normalized.includes('product')) {
    return ['customer pull', 'roadmap impact', 'differentiation', 'adoption blockers']
  }
  if (normalized.includes('founder') || normalized.includes('ceo')) {
    return ['strategic urgency', 'market timing', 'capital efficiency', 'execution risk']
  }
  if (normalized.includes('invest')) {
    return ['market quality', 'traction durability', 'competitive pressure', 'downside risk']
  }
  return ['what changed', 'why it matters', 'risk', 'next action']
}

export function buildUserLens(args: {
  intent: ResearchIntentPacket
  userContext?: UserResearchContext | null
  pastMentions?: UserLens['pastMentions']
  recentRelevantSignals?: UserLens['recentRelevantSignals']
}): UserLens {
  const role = args.intent.user.role ?? args.userContext?.role ?? null
  const industry = args.intent.user.industry ?? args.userContext?.industry ?? null
  const company = args.intent.user.company ?? args.userContext?.company ?? null

  return {
    roleFrame: role
      ? `User is operating from a ${role} lens. Prioritize decision impact and concrete next actions.`
      : 'User role is unknown. Keep the answer role-aware by using the request context.',
    likelyConcerns: concernsForRole(role),
    companyContext: company ? `User company: ${company}` : null,
    industryFrame: industry ? `Industry context: ${industry}` : null,
    pastMentions: (args.pastMentions ?? []).slice(0, 8),
    recentRelevantSignals: (args.recentRelevantSignals ?? []).slice(0, 8),
  }
}
