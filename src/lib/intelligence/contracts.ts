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
})
export type NormalizedEvidence = z.infer<typeof NormalizedEvidenceSchema>

export type ResearchType = 'meeting_prep' | 'competitive_analysis' | 'business_case' | 'market_research'

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

/* ── Meeting Prep synthesis schema ─────────────────────────── */

export const MeetingPrepSynthesisSchema = z.object({
  headline: z.string(),
  bottomLine: z.string(),
  whyItMatters: z.string().optional(),
  confidence: ConfidenceSchema,
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
  meta?: Record<string, string>
}

export interface ResearchPlan {
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
}

export interface CompetitiveAnalysisRequest {
  competitors: string[]
  yourCompany?: string
  focusArea: string
  specificQuestions?: string
}

export interface BusinessCaseRequest {
  initiativeName: string
  hypothesis: string
  targetMarket?: string
  successMetrics?: string[]
  keyQuestions?: string
  comparableCompanies?: string[]
}

export interface MarketResearchRequest {
  marketOrTrend: string
  scope: string
  keyQuestions?: string
  knownPlayers?: string[]
  timeHorizon: string
}
