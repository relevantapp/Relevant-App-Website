/* ── Intelligence Contracts — Single source of truth for all schemas ── */

import { z } from 'zod'

/* ── Shared primitives ─────────────────────────────────────── */

export const ConfidenceSchema = z.enum(['high', 'medium', 'low'])
export type Confidence = z.infer<typeof ConfidenceSchema>

export const BriefBulletSchema = z.object({
  text: z.string(),
  sourceIds: z.array(z.string()),
  tag: z.enum(['fact', 'inference']),
})
export type BriefBullet = z.infer<typeof BriefBulletSchema>

export const BriefSourceSchema = z.object({
  id: z.string(),
  url: z.string(),
  title: z.string(),
  domain: z.string(),
  publishedAt: z.string().nullable(),
  provider: z.enum(['exa', 'tavily', 'internal']),
  snippet: z.string().nullable(),
  imageUrl: z.string().nullable().optional(),
  faviconUrl: z.string().nullable().optional(),
})
export type BriefSource = z.infer<typeof BriefSourceSchema>

export const BriefStatusSchema = z.object({
  degraded: z.boolean(),
  reasons: z.array(z.string()),
  exaSearchMs: z.number(),
  tavilySearchMs: z.number(),
  synthesisMs: z.number(),
  totalMs: z.number(),
  sourceCount: z.number(),
  cached: z.boolean(),
  synthesisModel: z.string().nullable(),
})
export type BriefStatus = z.infer<typeof BriefStatusSchema>

export const NormalizedEvidenceSchema = z.object({
  id: z.string(),
  text: z.string(),
  url: z.string(),
  title: z.string(),
  domain: z.string(),
  publishedAt: z.string().nullable(),
  provider: z.enum(['exa', 'tavily']),
  imageUrl: z.string().nullable().optional(),
})
export type NormalizedEvidence = z.infer<typeof NormalizedEvidenceSchema>

export type ResearchType = 'meeting_prep' | 'competitive_analysis' | 'business_case' | 'market_research'

export interface UserResearchContext {
  profileKind: string | null
  industry: string | null
  role: string | null
  company: string | null
  country: string | null
  contextNote: string | null
}

/* ── Shared brief base ─────────────────────────────────────── */

export interface BriefBase {
  id: string
  researchType: ResearchType
  generatedAt: string
  headline: string
  bottomLine: string
  whyItMatters: string | null
  confidence: Confidence
  sources: BriefSource[]
  status: BriefStatus
  researchPlan?: ResearchPlan | null
  contextUsed?: UserResearchContext | null
}

/* ── Company snapshot ──────────────────────────────────────── */

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

export const MEETING_PREP_TIMELINE_EVENT_TYPES = [
  'funding',
  'leadership',
  'product',
  'customer',
  'partnership',
  'competition',
  'risk',
  'market',
] as const
export const MeetingPrepTimelineEventTypeSchema = z.enum(MEETING_PREP_TIMELINE_EVENT_TYPES)
export type MeetingPrepTimelineEventType = z.infer<typeof MeetingPrepTimelineEventTypeSchema>

export const MEETING_PREP_TIMELINE_IMPACTS = ['positive', 'neutral', 'negative', 'mixed'] as const
export const MeetingPrepTimelineEventImpactSchema = z.enum(MEETING_PREP_TIMELINE_IMPACTS)
export type MeetingPrepTimelineEventImpact = z.infer<typeof MeetingPrepTimelineEventImpactSchema>

export const TimelineEventSchema = z.object({
  date: z.string().min(1),
  type: MeetingPrepTimelineEventTypeSchema,
  impact: MeetingPrepTimelineEventImpactSchema,
  text: z.string().min(1),
  sourceIds: z.array(z.string()).min(1),
})
export interface TimelineEvent {
  date: string
  type: MeetingPrepTimelineEventType
  impact: MeetingPrepTimelineEventImpact
  text: string
  sourceIds: string[]
}

export const MEETING_PREP_RADAR_CATEGORIES = ['budget', 'tech', 'competitor', 'champion', 'setup'] as const
export const MeetingPrepRadarCategorySchema = z.enum(MEETING_PREP_RADAR_CATEGORIES)
export type MeetingPrepRadarCategory = z.infer<typeof MeetingPrepRadarCategorySchema>

export const RadarMetricSchema = z.object({
  category: MeetingPrepRadarCategorySchema,
  severity: z.number().int().min(0).max(5),
  details: z.string().min(1),
  sourceIds: z.array(z.string()).min(1),
})
export interface RadarMetric {
  category: MeetingPrepRadarCategory
  severity: number
  details: string
  sourceIds: string[]
}

export const CompetitorMatrixRowSchema = z.object({
  name: z.string().min(1),
  threatLevel: z.number().int().min(0).max(4),
  marketOverlap: z.number().int().min(0).max(4),
  advantage: z.string().min(1),
  tags: z.array(z.string()),
  sourceIds: z.array(z.string()).min(1),
})
export interface CompetitorMatrixRow {
  name: string
  threatLevel: number
  marketOverlap: number
  advantage: string
  tags: string[]
  sourceIds: string[]
}

/* ── Meeting Prep synthesis schema ─────────────────────────── */

export const MeetingPrepRiskLevelSchema = z.enum(['low', 'medium', 'high'])
export type MeetingPrepRiskLevel = z.infer<typeof MeetingPrepRiskLevelSchema>

export const MeetingPrepSentimentSchema = z.enum(['positive', 'neutral', 'negative'])
export type MeetingPrepSentiment = z.infer<typeof MeetingPrepSentimentSchema>

export const MeetingPrepSynthesisSchema = z.object({
  headline: z.string(),
  bottomLine: z.string(),
  whyItMatters: z.string().optional(),
  confidence: ConfidenceSchema,
  momentumScore: z.number().min(0).max(100).optional(),
  riskLevel: MeetingPrepRiskLevelSchema.optional(),
  sentiment: MeetingPrepSentimentSchema.optional(),
  timelineEvents: z.array(TimelineEventSchema).max(6).optional(),
  radarMetrics: z.array(RadarMetricSchema).max(5).optional(),
  competitorMatrix: z.array(CompetitorMatrixRowSchema).max(5).optional(),
  whatJustHappened: z.array(BriefBulletSchema),
  talkingPoints: z.array(BriefBulletSchema),
  landmines: z.array(BriefBulletSchema),
  questionsToAsk: z.array(BriefBulletSchema),
  competitorContext: z.array(BriefBulletSchema),
})
export type MeetingPrepSynthesis = z.infer<typeof MeetingPrepSynthesisSchema>

export interface MeetingPrepBrief extends BriefBase {
  researchType: 'meeting_prep'
  snapshot: CompanySnapshot | null
  attendeeProfiles: AttendeeProfile[]
  momentumScore?: number
  riskLevel?: MeetingPrepRiskLevel
  sentiment?: MeetingPrepSentiment
  timelineEvents?: TimelineEvent[]
  radarMetrics?: RadarMetric[]
  competitorMatrix?: CompetitorMatrixRow[]
  sections: {
    whatJustHappened: BriefBullet[]
    talkingPoints: BriefBullet[]
    landmines: BriefBullet[]
    questionsToAsk: BriefBullet[]
    competitorContext: BriefBullet[]
  }
}

/* ── Competitive Analysis synthesis schema ─────────────────── */

export const CompetitorProfileSchema = z.object({
  name: z.string(),
  description: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  recentMoves: z.array(z.string()),
})
export type CompetitorProfile = z.infer<typeof CompetitorProfileSchema>

export const ComparisonRowSchema = z.object({
  dimension: z.string(),
  values: z.array(z.object({
    company: z.string(),
    position: z.string(),
    score: z.number().min(1).max(5),
  })),
})
export type ComparisonRow = z.infer<typeof ComparisonRowSchema>

export const CompetitiveSynthesisSchema = z.object({
  headline: z.string(),
  bottomLine: z.string(),
  whyItMatters: z.string().optional(),
  confidence: ConfidenceSchema,
  competitors: z.array(CompetitorProfileSchema),
  comparisonMatrix: z.array(ComparisonRowSchema),
  keyFindings: z.array(BriefBulletSchema),
  strategicImplications: z.array(BriefBulletSchema),
  recommendations: z.array(BriefBulletSchema),
})
export type CompetitiveSynthesis = z.infer<typeof CompetitiveSynthesisSchema>

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

/* ── Business Case synthesis schema ────────────────────────── */

export const ComparableCompanySchema = z.object({
  name: z.string(),
  outcome: z.enum(['success', 'mixed', 'failure']),
  relevance: z.string(),
  keyTakeaway: z.string(),
})
export type ComparableCompany = z.infer<typeof ComparableCompanySchema>

export const BusinessCaseSynthesisSchema = z.object({
  headline: z.string(),
  bottomLine: z.string(),
  whyItMatters: z.string().optional(),
  confidence: ConfidenceSchema,
  verdict: z.enum(['strong', 'moderate', 'weak', 'insufficient_data']),
  verdictRationale: z.string(),
  comparables: z.array(ComparableCompanySchema),
  marketEvidence: z.array(BriefBulletSchema),
  supportingFactors: z.array(BriefBulletSchema),
  riskFactors: z.array(BriefBulletSchema),
  openQuestions: z.array(BriefBulletSchema),
})
export type BusinessCaseSynthesis = z.infer<typeof BusinessCaseSynthesisSchema>

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

/* ── Market Research synthesis schema ──────────────────────── */

export const MarketPlayerSchema = z.object({
  name: z.string(),
  category: z.enum(['leader', 'challenger', 'niche', 'emerging']),
  description: z.string(),
  estimatedPosition: z.string(),
})
export type MarketPlayer = z.infer<typeof MarketPlayerSchema>

export const MarketResearchSynthesisSchema = z.object({
  headline: z.string(),
  bottomLine: z.string(),
  whyItMatters: z.string().optional(),
  confidence: ConfidenceSchema,
  marketOverview: z.string(),
  players: z.array(MarketPlayerSchema),
  trendSignals: z.array(BriefBulletSchema),
  opportunities: z.array(BriefBulletSchema),
  threats: z.array(BriefBulletSchema),
  keyFindings: z.array(BriefBulletSchema),
})
export type MarketResearchSynthesis = z.infer<typeof MarketResearchSynthesisSchema>

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

/* ── Union type ────────────────────────────────────────────── */

export type IntelligenceBrief =
  | MeetingPrepBrief
  | CompetitiveAnalysisBrief
  | BusinessCaseBrief
  | MarketResearchBrief

/* ── Search task ───────────────────────────────────────────── */

export interface SearchTask {
  type: 'snapshot' | 'news' | 'person' | 'competitor' | 'tavily_news' | 'tavily_extract'
  query: string
  provider: 'exa' | 'tavily'
  purpose?: string
  lookbackDays?: number
  category?: 'company' | 'research paper' | 'news' | 'pdf' | 'personal site' | 'financial report' | 'people'
  topic?: 'general' | 'news' | 'finance'
  timeRange?: 'day' | 'week' | 'month' | 'year'
  includeImages?: boolean
  includeDomains?: string[]
  excludeDomains?: string[]
  meta?: Record<string, string>
}

export interface ResearchPlan {
  summary?: string
  intent?: string[]
  searches: SearchTask[]
}

/* ── Request types (input from frontend) ───────────────────── */

export type MeetingType =
  | 'client' | 'sales' | 'partner' | 'investor' | 'board' | 'hiring' | 'general'

export interface MeetingPrepRequest {
  accountName: string
  website?: string
  attendees?: string[]
  meetingType: MeetingType
  goal: string
  notes?: string
  competitors?: string[]
  lookbackDays?: number
  relationshipStage?: string
  whatYoureSelling?: string
  desiredNextStep?: string
  painPoints?: string[]
  steering?: string
  userContext?: UserResearchContext | null
}

export interface CompetitiveAnalysisRequest {
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
}

export interface BusinessCaseRequest {
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
}

export interface MarketResearchRequest {
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
}
