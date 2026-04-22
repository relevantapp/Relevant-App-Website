import type { ResearchIntentPacket, ResearchLane, ResearchPlanV2, ResearchType, SourceRole } from '../contracts'

const ROLE_PROVIDER: Record<SourceRole, ResearchLane['providerPreference']> = {
  internal_memory: ['internal'],
  primary: ['exa', 'tavily'],
  fresh_news: ['tavily', 'exa'],
  financial: ['exa', 'tavily'],
  people: ['proxycurl', 'exa'],
  customer_voice: ['reddit', 'tavily'],
  market_data: ['exa', 'tavily'],
  counter_evidence: ['tavily', 'exa'],
  gap_fill: ['tavily', 'exa'],
}

function lane(args: {
  sourceRole: SourceRole
  purpose: string
  questions: string[]
  queryTemplates: string[]
  required?: boolean
  freshnessDays?: number
  maxQueries?: number
  maxResults?: number
}): ResearchLane {
  return {
    id: args.sourceRole,
    sourceRole: args.sourceRole,
    purpose: args.purpose,
    providerPreference: ROLE_PROVIDER[args.sourceRole],
    questions: args.questions,
    queryTemplates: args.queryTemplates,
    freshnessDays: args.freshnessDays,
    required: args.required ?? true,
    budget: {
      maxQueries: args.maxQueries ?? 2,
      maxResults: args.maxResults ?? 6,
      maxContentChars: 20_000,
    },
  }
}

function names(intent: ResearchIntentPacket): string {
  return [
    ...intent.entities.primary.map((item) => item.name),
    ...intent.entities.competitors.map((item) => item.name),
  ].join(' ') || intent.decision.statedGoal
}

function commonLanes(intent: ResearchIntentPacket): ResearchLane[] {
  const entityNames = names(intent)
  return [
    lane({
      sourceRole: 'internal_memory',
      purpose: 'Start with Relevant memory: prior briefs, living stories, and entity dossiers.',
      questions: ['What has Relevant already seen about this entity or topic?', 'What changed since the prior mention?'],
      queryTemplates: [`${entityNames} prior coverage signals brief`],
      maxQueries: 1,
      maxResults: 8,
    }),
    lane({
      sourceRole: 'fresh_news',
      purpose: 'Find recent external changes that affect the decision.',
      questions: ['What happened recently?', 'Which fresh events change the decision?'],
      queryTemplates: [`${entityNames} latest news funding launch partnership risk`],
      freshnessDays: intent.depth === 'fast' ? 14 : 90,
      maxResults: intent.depth === 'fast' ? 4 : 8,
    }),
  ]
}

export function buildFallbackPlanV2(intent: ResearchIntentPacket): ResearchPlanV2 {
  const entityNames = names(intent)
  const lanes = commonLanes(intent)

  if (intent.researchType === 'meeting_prep') {
    lanes.push(
      lane({
        sourceRole: 'primary',
        purpose: 'Confirm first-party company facts and positioning.',
        questions: ['What does the account say it does?', 'Which customer, product, pricing, or security pages matter?'],
        queryTemplates: [`${entityNames} official website pricing customers security about`],
      }),
      lane({
        sourceRole: 'people',
        purpose: 'Understand attendees and likely concerns.',
        questions: ['Who are the attendees?', 'What roles and responsibilities shape the meeting?'],
        queryTemplates: intent.entities.people.map((person) => `${person.name} ${entityNames} role background`),
        required: intent.entities.people.length > 0,
      }),
      lane({
        sourceRole: 'counter_evidence',
        purpose: 'Find objections, risks, and reasons the obvious pitch may fail.',
        questions: ['What risks could come up?', 'What evidence weakens the desired narrative?'],
        queryTemplates: [`${entityNames} risks layoffs lawsuit complaints budget objections`],
      }),
    )
  } else if (intent.researchType === 'competitive_analysis') {
    lanes.push(
      lane({
        sourceRole: 'primary',
        purpose: 'Read competitor-owned positioning and product proof.',
        questions: ['What are competitors claiming directly?', 'Where are product or pricing changes visible?'],
        queryTemplates: intent.entities.competitors.map((competitor) => `${competitor.name} official product pricing customers`),
      }),
      lane({
        sourceRole: 'counter_evidence',
        purpose: 'Test the obvious competitive narrative.',
        questions: ['What is overhyped?', 'Where are customers or analysts skeptical?'],
        queryTemplates: [`${entityNames} weaknesses complaints churn pricing risk`],
      }),
      lane({
        sourceRole: 'customer_voice',
        purpose: 'Capture buyer or user language where available.',
        questions: ['What do users complain about?', 'Which alternatives do they compare?'],
        queryTemplates: [`${entityNames} reviews reddit complaints alternatives`],
        required: false,
      }),
    )
  } else if (intent.researchType === 'business_case') {
    lanes.push(
      lane({
        sourceRole: 'financial',
        purpose: 'Ground the case in quantitative or primary business evidence.',
        questions: ['What data supports the case?', 'What financial or market proof matters?'],
        queryTemplates: [`${entityNames} market size adoption revenue filings report`],
      }),
      lane({
        sourceRole: 'market_data',
        purpose: 'Find independent market evidence.',
        questions: ['Is demand growing?', 'Which adoption signals are credible?'],
        queryTemplates: [`${entityNames} market forecast adoption survey benchmark`],
      }),
      lane({
        sourceRole: 'counter_evidence',
        purpose: 'Find reasons not to proceed.',
        questions: ['What could break the case?', 'Which assumptions are fragile?'],
        queryTemplates: [`${entityNames} failure risk unit economics objections`],
      }),
    )
  } else {
    lanes.push(
      lane({
        sourceRole: 'market_data',
        purpose: 'Find credible market and adoption evidence.',
        questions: ['What is real now?', 'Which trends have proof?'],
        queryTemplates: [`${entityNames} market analysis adoption forecast regulation funding`],
      }),
      lane({
        sourceRole: 'primary',
        purpose: 'Ground named players in first-party evidence.',
        questions: ['Who matters?', 'What are known players doing directly?'],
        queryTemplates: intent.entities.competitors.map((player) => `${player.name} official product customers announcement`),
      }),
      lane({
        sourceRole: 'counter_evidence',
        purpose: 'Find failures, blockers, and uncertainty.',
        questions: ['What is uncertain?', 'Which signals contradict the growth story?'],
        queryTemplates: [`${entityNames} risks failures regulation adoption barriers`],
      }),
    )
  }

  return {
    planId: crypto.randomUUID(),
    intentSummary: `${intent.researchType}: ${intent.decision.impliedDecision}`,
    lanes,
    expectedSourceMix: {
      internal: 4,
      primary: lanes.some((item) => item.sourceRole === 'primary') ? 4 : 1,
      freshWeb: 6,
      semanticWeb: 6,
      counterEvidence: intent.qualityTargets.minCounterEvidence,
    },
    stopRules: {
      enoughEvidenceScore: intent.depth === 'fast' ? 0.65 : intent.depth === 'deep' ? 0.85 : 0.75,
      maxExternalSearches: intent.depth === 'fast' ? 2 : intent.depth === 'deep' ? 16 : 8,
      maxProviderMs: intent.depth === 'fast' ? 15_000 : intent.depth === 'deep' ? 180_000 : 45_000,
    },
  }
}

export function requiredLaneRolesForType(researchType: ResearchType): SourceRole[] {
  if (researchType === 'meeting_prep') return ['internal_memory', 'fresh_news', 'primary', 'people', 'counter_evidence']
  if (researchType === 'competitive_analysis') return ['internal_memory', 'fresh_news', 'primary', 'counter_evidence']
  if (researchType === 'business_case') return ['internal_memory', 'fresh_news', 'financial', 'market_data', 'counter_evidence']
  return ['internal_memory', 'fresh_news', 'market_data', 'primary', 'counter_evidence']
}
