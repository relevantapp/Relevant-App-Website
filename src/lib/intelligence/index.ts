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
} from './contracts'
