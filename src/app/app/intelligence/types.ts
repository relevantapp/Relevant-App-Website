/* ── Intelligence Frontend Types + Constants ───────────────── */
/* V2 re-exports preserved for backward compat */

import type { MeetingType } from '@/lib/intelligence/types'

export type {
  IntelligenceBrief,
  MeetingType,
  BriefBullet,
  BriefSource,
  BriefStatus,
  CompanySnapshot,
  AttendeeProfile,
  IntelligenceBriefV3,
  MeetingPrepBrief,
  CompetitiveAnalysisBrief,
  BusinessCaseBrief,
  MarketResearchBrief,
  CompetitorProfile,
  ComparisonRow,
  ComparableCompany,
  MarketPlayer,
} from '@/lib/intelligence/types'

export const MEETING_TYPE_OPTIONS: Array<{ value: MeetingType; label: string; icon: string }> = [
  { value: 'sales', label: 'Sales Call', icon: '💰' },
  { value: 'client', label: 'Client Meeting', icon: '🤝' },
  { value: 'partner', label: 'Partnership', icon: '🔗' },
  { value: 'investor', label: 'Investor Meeting', icon: '📈' },
  { value: 'board', label: 'Board Meeting', icon: '🏛️' },
  { value: 'hiring', label: 'Recruiting', icon: '👤' },
  { value: 'general', label: 'General', icon: '📋' },
]

export const GOAL_PLACEHOLDERS: Record<MeetingType, string> = {
  sales: 'e.g., Close the deal, Get to next meeting, Understand their needs',
  client: 'e.g., Quarterly business review, Upsell new feature, Resolve issue',
  partner: 'e.g., Explore integration, Negotiate terms, Align on roadmap',
  investor: 'e.g., Raise Series A, Share traction update, Get follow-on',
  board: 'e.g., Present quarterly results, Get approval for new initiative',
  hiring: 'e.g., Evaluate for VP Engineering, Sell the role, Assess culture fit',
  general: 'e.g., Exploratory conversation, Build relationship, Learn about them',
}

export const MEETING_TYPE_DETAILS: Record<MeetingType, string> = {
  sales: 'Focuses on objections, leverage points, and deal signals',
  client: 'Focuses on relationship health, renewal risks, and growth opportunities',
  partner: 'Focuses on strategic fit, mutual value, and integration points',
  investor: 'Focuses on traction metrics, market position, and growth story',
  board: 'Focuses on performance data, strategic decisions, and risk factors',
  hiring: 'Focuses on candidate background, culture signals, and role fit',
  general: 'Balanced analysis across all dimensions',
}

export const LOADING_STEPS = [
  'Researching {account}...',
  'Analyzing {count} sources...',
  'Building your briefing...',
]

/* ── Intelligence V3 Types ─────────────────────────────────── */

export type ResearchType = 'meeting_prep' | 'business_case' | 'competitive_analysis' | 'market_research'

export type MeetingTypeV3 = 'customer' | 'partner' | 'reseller' | 'investor' | 'board' | 'internal' | 'other'

export type CompetitiveFocusArea = 'product' | 'pricing' | 'gtm' | 'technology' | 'talent' | 'overall'

export type MarketScope = 'global' | 'north_america' | 'europe' | 'apac' | 'specific_region'

export type TimeHorizon = '30d' | '90d' | '6m' | '1y'

export interface AttendeeInput {
  name: string
  linkedinUrl?: string
}

export interface MeetingPrepInput {
  researchType: 'meeting_prep'
  accountName: string
  meetingType: MeetingTypeV3
  goal: string
  website?: string
  attendees?: AttendeeInput[]
  context?: string
  competitors?: string[]
}

export interface BusinessCaseInput {
  researchType: 'business_case'
  initiativeName: string
  hypothesis: string
  targetMarket?: string
  successMetrics?: string[]
  keyQuestions?: string
  comparableCompanies?: string[]
}

export interface CompetitiveAnalysisInput {
  researchType: 'competitive_analysis'
  competitors: string[]
  yourCompany?: string
  focusArea: CompetitiveFocusArea
  specificQuestions?: string
}

export interface MarketResearchInput {
  researchType: 'market_research'
  marketOrTrend: string
  scope: MarketScope
  keyQuestions?: string
  knownPlayers?: string[]
  timeHorizon?: TimeHorizon
}

export type IntelligenceInput = MeetingPrepInput | BusinessCaseInput | CompetitiveAnalysisInput | MarketResearchInput
