/* ── Intelligence Contracts — Single source of truth for all schemas ── */

import { z } from 'zod'

/* ── Shared primitives ─────────────────────────────────────── */

export const ConfidenceSchema = z.enum(['high', 'medium', 'low'])
export type Confidence = z.infer<typeof ConfidenceSchema>

export const CitedSpanSchema = z.object({
  text: z.string(),
  sourceIds: z.array(z.string()),
  sourceSnippet: z.string().nullable().optional(),
})
export type CitedSpan = z.infer<typeof CitedSpanSchema>

export const BriefBulletSchema = z.object({
  text: z.string(),
  sourceIds: z.array(z.string()),
  tag: z.enum(['fact', 'inference']),
})
export type BriefBullet = z.infer<typeof BriefBulletSchema>

export const AnswerBlockSchema = z.object({
  conclusion: CitedSpanSchema,
  whyItMatters: CitedSpanSchema,
  whatChanged: CitedSpanSchema.nullable(),
  confidence: z.object({
    level: ConfidenceSchema,
    driver: z.string(),
  }),
  recommendedNext: z.object({
    text: z.string(),
    action: z.string().optional(),
    copyable: z.string().optional(),
  }),
})
export type AnswerBlock = z.infer<typeof AnswerBlockSchema>

export const TrustLayerSchema = z.object({
  sourcedClaimCount: z.number().int().nonnegative(),
  freshness: z.object({
    oldestSourceAt: z.string().nullable(),
    newestSourceAt: z.string().nullable(),
  }),
  mostImportantSourceIds: z.array(z.string()),
  conflicts: z.array(z.object({
    claim: z.string(),
    againstSourceIds: z.array(z.string()),
    supportingSourceIds: z.array(z.string()),
  })),
  knownUnknowns: z.array(z.object({
    question: z.string(),
    queriesTried: z.array(z.string()),
  })),
})
export type TrustLayer = z.infer<typeof TrustLayerSchema>

export const MethodologySchema = z.object({
  providers: z.array(z.object({
    name: z.string(),
    queriesRun: z.array(z.string()),
    docsReturned: z.number().int().nonnegative(),
  })),
  freshnessRange: z.object({
    oldest: z.string().nullable(),
    newest: z.string().nullable(),
  }),
  confidenceDrivers: z.array(z.string()),
  excluded: z.array(z.object({
    sourceId: z.string(),
    reason: z.string(),
  })),
})
export type Methodology = z.infer<typeof MethodologySchema>

export const PrioritySchema = z.enum(['must', 'should', 'fyi'])
export type Priority = z.infer<typeof PrioritySchema>

export const RichBulletSchema = BriefBulletSchema.extend({
  priority: PrioritySchema.optional(),
  confidence: ConfidenceSchema.optional(),
  confidenceDriver: z.string().optional(),
  spans: z.array(CitedSpanSchema).optional(),
})
export type RichBullet = z.infer<typeof RichBulletSchema>

export const BriefSourceSchema = z.object({
  id: z.string(),
  url: z.string(),
  title: z.string(),
  domain: z.string(),
  publishedAt: z.string().nullable(),
  provider: z.enum(['exa', 'tavily', 'internal', 'perplexity', 'proxycurl', 'reddit', 'youtube']),
  snippet: z.string().nullable(),
  imageUrl: z.string().nullable().optional(),
  faviconUrl: z.string().nullable().optional(),
  sourceRole: z.string().optional(),
  usedInAnswer: z.boolean().optional(),
})
export type BriefSource = z.infer<typeof BriefSourceSchema>

export const BriefStatusSchema = z.object({
  degraded: z.boolean(),
  reasons: z.array(z.string()),
  internalMs: z.number(),
  plannerMs: z.number(),
  exaMs: z.number(),
  tavilyMs: z.number(),
  verifierMs: z.number(),
  exaSearchMs: z.number(),
  tavilySearchMs: z.number(),
  synthesisMs: z.number(),
  totalMs: z.number(),
  sourceCount: z.number(),
  sourceCounts: z.object({
    found: z.number().int().min(0),
    ranked: z.number().int().min(0),
    used: z.number().int().min(0),
  }).optional(),
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
  provider: z.enum(['exa', 'tavily', 'internal', 'perplexity', 'proxycurl', 'reddit', 'youtube']),
  imageUrl: z.string().nullable().optional(),
  sourceRole: z.string().optional(),
})
export type NormalizedEvidence = z.infer<typeof NormalizedEvidenceSchema>

export type ResearchType = 'meeting_prep' | 'competitive_analysis' | 'business_case' | 'market_research'
export const ResearchTypeSchema = z.enum(['meeting_prep', 'competitive_analysis', 'business_case', 'market_research'])

export interface UserResearchContext {
  profileKind: string | null
  industry: string | null
  role: string | null
  company: string | null
  country: string | null
  contextNote: string | null
}

export const UserResearchContextSchema = z.object({
  profileKind: z.string().nullable(),
  industry: z.string().nullable(),
  role: z.string().nullable(),
  company: z.string().nullable(),
  country: z.string().nullable(),
  contextNote: z.string().nullable(),
})

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
  answer?: AnswerBlock
  trust?: TrustLayer
  methodology?: Methodology
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

export const CompanySnapshotSchema = z.object({
  name: z.string(),
  description: z.string(),
  website: z.string().nullable(),
  industry: z.string().nullable(),
  headquarters: z.string().nullable(),
  employeeCount: z.string().nullable(),
  fundingStage: z.string().nullable(),
  lastFundingAmount: z.string().nullable(),
  ceo: z.string().nullable(),
  keyPeople: z.array(z.object({ name: z.string(), title: z.string() })).nullable(),
  recentMilestone: z.string().nullable(),
  sourceUrl: z.string().nullable(),
})

export interface MeetingPrepSnapshot {
  name: string
  summary: string
  website: string | null
  whatTheyDo: string | null
  industry: string | null
  headquarters: string | null
  employeeRange: string | null
  funding: string | null
  ceo: string | null
  recentMilestone: string | null
  knownUnknowns: string[]
  sourceUrl: string | null
}

export const MeetingPrepSnapshotSchema = z.object({
  name: z.string(),
  summary: z.string(),
  website: z.string().nullable(),
  whatTheyDo: z.string().nullable(),
  industry: z.string().nullable(),
  headquarters: z.string().nullable(),
  employeeRange: z.string().nullable(),
  funding: z.string().nullable(),
  ceo: z.string().nullable(),
  recentMilestone: z.string().nullable(),
  knownUnknowns: z.array(z.string()),
  sourceUrl: z.string().nullable(),
})

export interface AttendeeProfile {
  name: string
  title: string | null
  company: string | null
  background: string | null
  linkedinUrl: string | null
  sourceUrl: string | null
}

export const AttendeeProfileSchema = z.object({
  name: z.string(),
  title: z.string().nullable(),
  company: z.string().nullable(),
  background: z.string().nullable(),
  linkedinUrl: z.string().nullable(),
  sourceUrl: z.string().nullable(),
})

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
  snapshot: MeetingPrepSnapshot | null
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

export const FactorSeveritySchema = z.enum(['high', 'med', 'low'])
export type FactorSeverity = z.infer<typeof FactorSeveritySchema>

export const FactorImpactSchema = z.enum(['high', 'med', 'low'])
export type FactorImpact = z.infer<typeof FactorImpactSchema>

export const FactorCardSchema = BriefBulletSchema.extend({
  severity: FactorSeveritySchema.optional(),
  impact: FactorImpactSchema.optional(),
})
export type FactorCard = z.infer<typeof FactorCardSchema>

export const BusinessCaseSynthesisSchema = z.object({
  headline: z.string(),
  bottomLine: z.string(),
  whyItMatters: z.string().optional(),
  confidence: ConfidenceSchema,
  verdict: z.enum(['strong', 'moderate', 'weak', 'insufficient_data']),
  verdictRationale: z.string(),
  comparables: z.array(ComparableCompanySchema),
  marketEvidence: z.array(BriefBulletSchema),
  supportingFactors: z.array(FactorCardSchema),
  riskFactors: z.array(FactorCardSchema),
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
    supportingFactors: FactorCard[]
    riskFactors: FactorCard[]
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
  provider: 'exa' | 'tavily' | 'internal'
  purpose?: string
  lookbackDays?: number
  category?: 'company' | 'research paper' | 'news' | 'pdf' | 'personal site' | 'financial report' | 'people'
  topic?: 'general' | 'news' | 'finance'
  timeRange?: 'day' | 'week' | 'month' | 'year'
  includeImages?: boolean
  includeDomains?: string[]
  excludeDomains?: string[]
  sourceRole?: SourceRole
  meta?: Record<string, string>
}

export const SearchTaskSchema = z.object({
  type: z.enum(['snapshot', 'news', 'person', 'competitor', 'tavily_news', 'tavily_extract']),
  query: z.string(),
  provider: z.enum(['exa', 'tavily', 'internal']),
  purpose: z.string().optional(),
  lookbackDays: z.number().int().optional(),
  category: z.enum(['company', 'research paper', 'news', 'pdf', 'personal site', 'financial report', 'people']).optional(),
  topic: z.enum(['general', 'news', 'finance']).optional(),
  timeRange: z.enum(['day', 'week', 'month', 'year']).optional(),
  includeImages: z.boolean().optional(),
  includeDomains: z.array(z.string()).optional(),
  excludeDomains: z.array(z.string()).optional(),
  sourceRole: z.enum([
    'internal_memory',
    'primary',
    'fresh_news',
    'financial',
    'people',
    'customer_voice',
    'market_data',
    'counter_evidence',
    'gap_fill',
  ]).optional(),
  meta: z.record(z.string()).optional(),
})

export interface ResearchPlan {
  summary?: string
  intent?: string[]
  searches: SearchTask[]
  v2?: ResearchPlanV2 | null
}

export const ResearchPlanSchema = z.object({
  summary: z.string().optional(),
  intent: z.array(z.string()).optional(),
  searches: z.array(SearchTaskSchema),
  v2: z.unknown().nullable().optional(),
})

export const BriefBaseSchema = z.object({
  id: z.string(),
  researchType: ResearchTypeSchema,
  generatedAt: z.string(),
  headline: z.string(),
  bottomLine: z.string(),
  whyItMatters: z.string().nullable(),
  confidence: ConfidenceSchema,
  sources: z.array(BriefSourceSchema),
  status: BriefStatusSchema,
  researchPlan: ResearchPlanSchema.nullable().optional(),
  contextUsed: UserResearchContextSchema.nullable().optional(),
  answer: AnswerBlockSchema.optional(),
  trust: TrustLayerSchema.optional(),
  methodology: MethodologySchema.optional(),
})

export const MeetingPrepBriefSchema = BriefBaseSchema.extend({
  researchType: z.literal('meeting_prep'),
  snapshot: MeetingPrepSnapshotSchema.nullable(),
  attendeeProfiles: z.array(AttendeeProfileSchema),
  momentumScore: z.number().min(0).max(100).optional(),
  riskLevel: MeetingPrepRiskLevelSchema.optional(),
  sentiment: MeetingPrepSentimentSchema.optional(),
  timelineEvents: z.array(TimelineEventSchema).optional(),
  radarMetrics: z.array(RadarMetricSchema).optional(),
  competitorMatrix: z.array(CompetitorMatrixRowSchema).optional(),
  sections: z.object({
    whatJustHappened: z.array(BriefBulletSchema),
    talkingPoints: z.array(BriefBulletSchema),
    landmines: z.array(BriefBulletSchema),
    questionsToAsk: z.array(BriefBulletSchema),
    competitorContext: z.array(BriefBulletSchema),
  }),
})

export const CompetitiveAnalysisBriefSchema = BriefBaseSchema.extend({
  researchType: z.literal('competitive_analysis'),
  yourCompany: z.string().nullable(),
  competitors: z.array(CompetitorProfileSchema),
  comparisonMatrix: z.array(ComparisonRowSchema),
  sections: z.object({
    keyFindings: z.array(BriefBulletSchema),
    strategicImplications: z.array(BriefBulletSchema),
    recommendations: z.array(BriefBulletSchema),
  }),
})

export const BusinessCaseBriefSchema = BriefBaseSchema.extend({
  researchType: z.literal('business_case'),
  verdict: z.enum(['strong', 'moderate', 'weak', 'insufficient_data']),
  verdictRationale: z.string(),
  comparables: z.array(ComparableCompanySchema),
  sections: z.object({
    marketEvidence: z.array(BriefBulletSchema),
    supportingFactors: z.array(FactorCardSchema),
    riskFactors: z.array(FactorCardSchema),
    openQuestions: z.array(BriefBulletSchema),
  }),
})

export const MarketResearchBriefSchema = BriefBaseSchema.extend({
  researchType: z.literal('market_research'),
  marketOverview: z.string(),
  players: z.array(MarketPlayerSchema),
  sections: z.object({
    trendSignals: z.array(BriefBulletSchema),
    opportunities: z.array(BriefBulletSchema),
    threats: z.array(BriefBulletSchema),
    keyFindings: z.array(BriefBulletSchema),
  }),
})

export const IntelligenceBriefSchema = z.discriminatedUnion('researchType', [
  MeetingPrepBriefSchema,
  CompetitiveAnalysisBriefSchema,
  BusinessCaseBriefSchema,
  MarketResearchBriefSchema,
])

/* ── Intelligence V2 contracts ────────────────────────────── */

export type ResearchDepth = 'fast' | 'standard' | 'deep'

export type IntelligenceProvider =
  | 'internal'
  | 'exa'
  | 'tavily'
  | 'perplexity'
  | 'proxycurl'
  | 'reddit'
  | 'youtube'

export type SourceRole =
  | 'internal_memory'
  | 'primary'
  | 'fresh_news'
  | 'financial'
  | 'people'
  | 'customer_voice'
  | 'market_data'
  | 'counter_evidence'
  | 'gap_fill'

export interface EntityRef {
  name: string
  kind: 'company' | 'person' | 'market' | 'topic' | 'unknown'
  url?: string | null
}

export interface ResearchIntentPacket {
  runId: string
  researchType: ResearchType
  user: {
    id: string
    role: string | null
    industry: string | null
    company: string | null
    country: string | null
    seniority?: string | null
    function?: string | null
  }
  decision: {
    statedGoal: string
    impliedDecision: string
    timeHorizon: 'today' | 'week' | 'quarter' | 'year' | 'strategic'
    audience: string[]
    desiredOutput: string[]
  }
  entities: {
    primary: EntityRef[]
    competitors: EntityRef[]
    people: EntityRef[]
    marketTerms: string[]
  }
  constraints: {
    steering: string | null
    mustInclude: string[]
    mustAvoid: string[]
    geography: string[]
  }
  qualityTargets: {
    minPrimarySources: number
    minIndependentSources: number
    minCounterEvidence: number
    freshnessRequired: boolean
    internalMemoryRequired: boolean
  }
  depth: ResearchDepth
}

export interface UserLens {
  roleFrame: string
  likelyConcerns: string[]
  companyContext: string | null
  industryFrame: string | null
  pastMentions: Array<{
    topic: string
    entity: string
    count: number
    lastSeenAt: string
    lastTakeaway: string
  }>
  recentRelevantSignals: Array<{
    signalId: string
    title: string
    deltaSummary: string | null
    sourceCount: number
    updatedAt: string
  }>
}

export interface PriorMemorySummary {
  hasPriorCoverage: boolean
  totalMentions: number
  lastMentionedAt: string | null
  lastKnownTakeaway: string | null
  changedSinceThen: string[]
  recurringThemes: string[]
  staleAssumptions: string[]
}

export interface ResearchPlanV2 {
  planId: string
  intentSummary: string
  lanes: ResearchLane[]
  expectedSourceMix: {
    internal: number
    primary: number
    freshWeb: number
    semanticWeb: number
    counterEvidence: number
  }
  stopRules: {
    enoughEvidenceScore: number
    maxExternalSearches: number
    maxProviderMs: number
  }
}

export interface ResearchLane {
  id: string
  purpose: string
  providerPreference: IntelligenceProvider[]
  sourceRole: SourceRole
  questions: string[]
  queryTemplates: string[]
  freshnessDays?: number
  required: boolean
  budget: {
    maxQueries: number
    maxResults: number
    maxContentChars: number
  }
}

export interface EvidenceItem {
  id: string
  sourceId: string
  provider: IntelligenceProvider
  laneId: string
  sourceRole: SourceRole
  title: string
  url: string | null
  domain: string | null
  publishedAt: string | null
  capturedAt: string
  excerpt: string
  facts: string[]
  entities: string[]
  topicKeys: string[]
  quality: {
    authority: number
    freshness: number
    relevance: number
    independence: number
    primarySource: boolean
  }
  clusterId?: string
  payload?: Record<string, unknown>
}

export interface EvidencePack {
  run: {
    runId: string
    researchType: ResearchType
    generatedAt: string
  }
  intent: ResearchIntentPacket
  userLens: UserLens
  priorMemory: PriorMemorySummary
  planSummary: {
    lanesRun: string[]
    lanesSkipped: string[]
    knownGaps: string[]
  }
  sourceLedger: Array<{
    sourceId: string
    role: SourceRole
    title: string
    domain: string | null
    url: string | null
    provider: IntelligenceProvider
    qualityLabel: 'primary' | 'strong' | 'useful' | 'weak'
  }>
  evidence: EvidenceItem[]
  clusters: Array<{
    clusterId: string
    label: string
    whatChanged: string
    evidenceIds: string[]
  }>
  contradictions: Array<{
    issue: string
    evidenceIds: string[]
  }>
  unknowns: Array<{
    question: string
    reasonMissing: string
  }>
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
