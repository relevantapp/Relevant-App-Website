/* ── Intelligence V2 — Shared Types ─────────────────────────── */

export type MeetingType =
  | 'client'
  | 'sales'
  | 'partner'
  | 'investor'
  | 'board'
  | 'hiring'
  | 'general'

export interface IntelligenceRequest {
  accountName: string
  website?: string
  attendees?: string[]
  meetingType: MeetingType
  goal: string
  notes?: string
  competitors?: string[]
  lookbackDays?: number
}

export interface CompanySnapshot {
  name: string
  description: string
  website: string | null
  industry: string | null
  headquarters: string | null
  employeeCount: string | null
  fundingStage: string | null
  lastFundingAmount: string | null
  ceo: string | null
  keyPeople: Array<{ name: string; title: string }> | null
  recentMilestone: string | null
  sourceUrl: string | null
}

export interface AttendeeProfile {
  name: string
  title: string | null
  company: string | null
  background: string | null
  linkedinUrl: string | null
  sourceUrl: string | null
}

export interface BriefBullet {
  text: string
  sourceIds: string[]
  tag: 'fact' | 'inference'
}

export interface BriefSource {
  id: string
  url: string
  title: string
  domain: string
  publishedAt: string | null
  provider: 'exa' | 'tavily' | 'internal'
  snippet: string | null
}

export interface IntelligenceBrief {
  id: string
  mode: 'prep'
  generatedAt: string
  request: IntelligenceRequest

  snapshot: CompanySnapshot | null
  attendeeProfiles: AttendeeProfile[]

  summary: {
    headline: string
    bottomLine: string
    confidence: 'high' | 'medium' | 'low'
  }

  sections: {
    whatJustHappened: BriefBullet[]
    talkingPoints: BriefBullet[]
    landmines: BriefBullet[]
    questionsToAsk: BriefBullet[]
    competitorContext: BriefBullet[]
  }

  sources: BriefSource[]

  status: {
    degraded: boolean
    reasons: string[]
    exaSearchMs: number
    tavilySearchMs: number
    synthesisMs: number
    totalMs: number
    sourceCount: number
    cached: boolean
    synthesisModel: string | null
  }
}

/* ── Intelligence V3 — New Brief Shapes ────────────────────── */

export type ResearchType = 'meeting_prep' | 'competitive_analysis' | 'business_case' | 'market_research'

/** Shared base for all V3 brief types */
interface BriefBase {
  id: string
  researchType: ResearchType
  generatedAt: string
  headline: string
  bottomLine: string
  confidence: 'high' | 'medium' | 'low'
  sources: BriefSource[]
  status: BriefStatus
}

export interface BriefStatus {
  degraded: boolean
  reasons: string[]
  exaSearchMs: number
  tavilySearchMs: number
  synthesisMs: number
  totalMs: number
  sourceCount: number
  cached: boolean
  synthesisModel: string | null
}

/** Meeting Prep Brief (V3 shape wrapping V2 data) */
export interface MeetingPrepBrief extends BriefBase {
  researchType: 'meeting_prep'
  snapshot: CompanySnapshot | null
  attendeeProfiles: AttendeeProfile[]
  sections: {
    whatJustHappened: BriefBullet[]
    talkingPoints: BriefBullet[]
    landmines: BriefBullet[]
    questionsToAsk: BriefBullet[]
    competitorContext: BriefBullet[]
  }
}

/** Competitive Analysis Brief */
export interface CompetitorProfile {
  name: string
  description: string
  strengths: string[]
  weaknesses: string[]
  recentMoves: string[]
}

export interface ComparisonRow {
  dimension: string
  values: Array<{ company: string; position: string; score: number }>
}

export interface CompetitiveAnalysisBrief extends BriefBase {
  researchType: 'competitive_analysis'
  yourCompany: string | null
  competitors: CompetitorProfile[]
  comparisonMatrix: ComparisonRow[]
  sections: {
    keyFindings: BriefBullet[]
    strategicImplications: BriefBullet[]
    recommendations: BriefBullet[]
  }
}

/** Business Case Brief */
export interface ComparableCompany {
  name: string
  outcome: 'success' | 'mixed' | 'failure'
  relevance: string
  keyTakeaway: string
}

export interface BusinessCaseBrief extends BriefBase {
  researchType: 'business_case'
  verdict: 'strong' | 'moderate' | 'weak' | 'insufficient_data'
  verdictRationale: string
  comparables: ComparableCompany[]
  sections: {
    marketEvidence: BriefBullet[]
    supportingFactors: BriefBullet[]
    riskFactors: BriefBullet[]
    openQuestions: BriefBullet[]
  }
}

/** Market Research Brief */
export interface MarketPlayer {
  name: string
  category: 'leader' | 'challenger' | 'niche' | 'emerging'
  description: string
  estimatedPosition: string
}

export interface MarketResearchBrief extends BriefBase {
  researchType: 'market_research'
  marketOverview: string
  players: MarketPlayer[]
  sections: {
    trendSignals: BriefBullet[]
    opportunities: BriefBullet[]
    threats: BriefBullet[]
    keyFindings: BriefBullet[]
  }
}

export type IntelligenceBriefV3 =
  | MeetingPrepBrief
  | CompetitiveAnalysisBrief
  | BusinessCaseBrief
  | MarketResearchBrief

/* ── Internal types for provider results ────────────────────── */

export interface NormalizedEvidence {
  id: string
  text: string
  url: string
  title: string
  domain: string
  publishedAt: string | null
  provider: 'exa' | 'tavily'
}

export interface ResearchPlan {
  searches: SearchTask[]
}

export interface SearchTask {
  type: 'snapshot' | 'news' | 'person' | 'competitor' | 'tavily_news' | 'tavily_extract'
  query: string
  provider: 'exa' | 'tavily'
  meta?: Record<string, string>
}
