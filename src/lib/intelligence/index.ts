/* ── Intelligence — Unified exports ────────────────────────── */

export { generateMeetingPrepBrief } from './orchestrators/meeting-prep'
export { generateCompetitiveAnalysisBrief } from './orchestrators/competitive-analysis'
export { generateBusinessCaseBrief } from './orchestrators/business-case'
export { generateMarketResearchBrief } from './orchestrators/market-research'

export type {
  IntelligenceBrief,
  MeetingPrepBrief,
  CompetitiveAnalysisBrief,
  BusinessCaseBrief,
  MarketResearchBrief,
  BriefBullet,
  BriefSource,
  BriefStatus,
  CompanySnapshot,
  AttendeeProfile,
  CompetitorProfile,
  ComparisonRow,
  ComparableCompany,
  MarketPlayer,
  NormalizedEvidence,
  ResearchType,
  MeetingType,
  MeetingPrepRequest,
  CompetitiveAnalysisRequest,
  BusinessCaseRequest,
  MarketResearchRequest,
  ResearchDepth,
  ResearchIntentPacket,
  UserLens,
  PriorMemorySummary,
  ResearchPlanV2,
  ResearchLane,
  SourceRole,
  EvidenceItem,
  EvidencePack,
} from './contracts'

export { buildResearchIntentPacket } from './context/intent-packet'
export { buildUserLens } from './context/user-lens'
export { planLanes } from './planner/plan'
export { buildFallbackPlanV2 } from './planner/fallbacks'
export { runRetrieval, scoreCoverage } from './retrieval/controller'
export { buildEvidencePack } from './evidence/pack'
export { checkBriefCitations } from './verifier/citation-check'
