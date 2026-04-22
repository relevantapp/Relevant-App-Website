import type {
  BusinessCaseRequest,
  CompetitiveAnalysisRequest,
  EntityRef,
  MarketResearchRequest,
  MeetingPrepRequest,
  ResearchDepth,
  ResearchIntentPacket,
  ResearchType,
  UserResearchContext,
} from '../contracts'

type AnyRequest =
  | MeetingPrepRequest
  | CompetitiveAnalysisRequest
  | BusinessCaseRequest
  | MarketResearchRequest

const DEFAULT_DEPTH: Record<ResearchType, ResearchDepth> = {
  meeting_prep: 'standard',
  competitive_analysis: 'standard',
  business_case: 'standard',
  market_research: 'deep',
}

function clean(input: string | undefined | null): string | null {
  const value = input?.trim()
  return value ? value : null
}

function entity(name: string | undefined | null, kind: EntityRef['kind'], url?: string | null): EntityRef | null {
  const cleaned = clean(name)
  if (!cleaned) return null
  return { name: cleaned, kind, url: clean(url) }
}

function timeHorizon(raw: string | undefined | null): ResearchIntentPacket['decision']['timeHorizon'] {
  const value = (raw ?? '').toLowerCase()
  if (value.includes('today') || value.includes('24') || value === '30d') return 'today'
  if (value.includes('week')) return 'week'
  if (value.includes('quarter') || value === '90d') return 'quarter'
  if (value.includes('year') || value === '12m') return 'year'
  return 'strategic'
}

function inferFunction(role: string | null): string | null {
  if (!role) return null
  const value = role.toLowerCase()
  if (value.includes('sales') || value.includes('revenue') || value.includes('gtm')) return 'go_to_market'
  if (value.includes('product')) return 'product'
  if (value.includes('founder') || value.includes('ceo')) return 'executive'
  if (value.includes('invest')) return 'investing'
  return null
}

function baseUser(userId: string, context?: UserResearchContext | null): ResearchIntentPacket['user'] {
  const role = clean(context?.role)
  return {
    id: userId,
    role,
    industry: clean(context?.industry),
    company: clean(context?.company),
    country: clean(context?.country),
    function: inferFunction(role),
  }
}

export function buildResearchIntentPacket(args: {
  runId?: string
  userId: string
  researchType: ResearchType
  request: AnyRequest
  userContext?: UserResearchContext | null
  depth?: ResearchDepth
}): ResearchIntentPacket {
  const runId = args.runId ?? crypto.randomUUID()
  const user = baseUser(args.userId, args.userContext ?? args.request.userContext)
  const depth = args.depth ?? DEFAULT_DEPTH[args.researchType]

  if (args.researchType === 'meeting_prep') {
    const request = args.request as MeetingPrepRequest
    return {
      runId,
      researchType: args.researchType,
      user,
      decision: {
        statedGoal: request.goal,
        impliedDecision: request.desiredNextStep || `Prepare for a ${request.meetingType} meeting with ${request.accountName}.`,
        timeHorizon: timeHorizon(String(request.lookbackDays ?? '30d')),
        audience: [request.accountName, ...(request.attendees ?? [])],
        desiredOutput: ['what changed', 'talking points', 'risks', 'questions to ask'],
      },
      entities: {
        primary: [entity(request.accountName, 'company', request.website)].filter(Boolean) as EntityRef[],
        competitors: (request.competitors ?? []).map((name) => entity(name, 'company')).filter(Boolean) as EntityRef[],
        people: (request.attendees ?? []).map((name) => entity(name, 'person')).filter(Boolean) as EntityRef[],
        marketTerms: [request.whatYoureSelling, ...(request.painPoints ?? [])].map((item) => item?.trim()).filter(Boolean) as string[],
      },
      constraints: {
        steering: clean(request.steering),
        mustInclude: [request.whatYoureSelling, request.relationshipStage].map((item) => item?.trim()).filter(Boolean) as string[],
        mustAvoid: [],
        geography: user.country ? [user.country] : [],
      },
      qualityTargets: {
        minPrimarySources: 1,
        minIndependentSources: 4,
        minCounterEvidence: 1,
        freshnessRequired: true,
        internalMemoryRequired: true,
      },
      depth,
    }
  }

  if (args.researchType === 'competitive_analysis') {
    const request = args.request as CompetitiveAnalysisRequest
    return {
      runId,
      researchType: args.researchType,
      user,
      decision: {
        statedGoal: request.specificQuestions || `Understand competitors in ${request.focusArea}.`,
        impliedDecision: `Decide where the opening is against ${request.competitors.join(', ')}.`,
        timeHorizon: 'quarter',
        audience: [request.yourCompany, request.customerType].filter(Boolean) as string[],
        desiredOutput: ['recent moves', 'overhyped claims', 'openings', 'next actions'],
      },
      entities: {
        primary: request.yourCompany ? [entity(request.yourCompany, 'company')!].filter(Boolean) : [],
        competitors: request.competitors.map((name) => entity(name, 'company')).filter(Boolean) as EntityRef[],
        people: [],
        marketTerms: [request.focusArea, request.marketSegment, request.customerType, request.useCasePreset].map((item) => item?.trim()).filter(Boolean) as string[],
      },
      constraints: {
        steering: clean(request.steering),
        mustInclude: [request.focusArea].filter(Boolean),
        mustAvoid: [],
        geography: request.geography ? [request.geography] : [],
      },
      qualityTargets: {
        minPrimarySources: 2,
        minIndependentSources: 5,
        minCounterEvidence: 1,
        freshnessRequired: true,
        internalMemoryRequired: true,
      },
      depth,
    }
  }

  if (args.researchType === 'business_case') {
    const request = args.request as BusinessCaseRequest
    return {
      runId,
      researchType: args.researchType,
      user,
      decision: {
        statedGoal: request.hypothesis,
        impliedDecision: `Assess whether to pursue ${request.initiativeName}.`,
        timeHorizon: timeHorizon(request.timeHorizon),
        audience: [request.decisionAudience].filter(Boolean) as string[],
        desiredOutput: ['verdict', 'supporting proof', 'counter evidence', 'fragile assumptions'],
      },
      entities: {
        primary: [entity(request.initiativeName, 'topic')].filter(Boolean) as EntityRef[],
        competitors: (request.comparableCompanies ?? []).map((name) => entity(name, 'company')).filter(Boolean) as EntityRef[],
        people: [],
        marketTerms: [request.targetMarket, ...(request.successMetrics ?? []), request.keyQuestions].map((item) => item?.trim()).filter(Boolean) as string[],
      },
      constraints: {
        steering: clean(request.steering),
        mustInclude: request.successMetrics ?? [],
        mustAvoid: [],
        geography: [],
      },
      qualityTargets: {
        minPrimarySources: 2,
        minIndependentSources: 6,
        minCounterEvidence: 2,
        freshnessRequired: false,
        internalMemoryRequired: true,
      },
      depth,
    }
  }

  const request = args.request as MarketResearchRequest
  return {
    runId,
    researchType: args.researchType,
    user,
    decision: {
      statedGoal: request.objective || request.keyQuestions || `Understand ${request.marketOrTrend}.`,
      impliedDecision: `Decide what is real, changing, and actionable in ${request.marketOrTrend}.`,
      timeHorizon: timeHorizon(request.timeHorizon),
      audience: [request.customerSegment].filter(Boolean) as string[],
      desiredOutput: ['what is real now', 'who matters', 'uncertainties', 'what to watch'],
    },
    entities: {
      primary: [entity(request.marketOrTrend, 'market')].filter(Boolean) as EntityRef[],
      competitors: (request.knownPlayers ?? []).map((name) => entity(name, 'company')).filter(Boolean) as EntityRef[],
      people: [],
      marketTerms: [request.scope, request.keyQuestions, request.useCase, request.customerSegment].map((item) => item?.trim()).filter(Boolean) as string[],
    },
    constraints: {
      steering: clean(request.steering),
      mustInclude: request.knownPlayers ?? [],
      mustAvoid: [],
      geography: request.region ? [request.region] : [],
    },
    qualityTargets: {
      minPrimarySources: 2,
      minIndependentSources: 6,
      minCounterEvidence: 1,
      freshnessRequired: true,
      internalMemoryRequired: true,
    },
    depth,
  }
}
