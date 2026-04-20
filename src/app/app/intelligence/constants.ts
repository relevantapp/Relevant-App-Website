/* ── Intelligence V3 — Constants ────────────────────────────── */

import type { ResearchType, MeetingTypeV3, CompetitiveFocusArea, MarketScope, TimeHorizon } from './types'

/* ── Research Type Cards ───────────────────────────────────── */

export interface ResearchTypeCard {
  type: ResearchType
  icon: string
  title: string
  description: string
  example: string
  meta: string
}

export const RESEARCH_TYPES: ResearchTypeCard[] = [
  {
    type: 'meeting_prep',
    icon: 'ClipboardList',
    title: 'Meeting Prep',
    description: 'Prepare for a sales, client, or partner conversation',
    example: 'Anthropic · partnership intro',
    meta: '~1m 45s · 8-12 sources',
  },
  {
    type: 'business_case',
    icon: 'BarChart3',
    title: 'Business Case',
    description: 'Build proof points for an initiative or proposal',
    example: 'Launch weekend delivery · East Coast',
    meta: '~2m 30s · 14-20 sources',
  },
  {
    type: 'competitive_analysis',
    icon: 'Swords',
    title: 'Competitive Intel',
    description: "Analyze a competitor's latest moves and positioning",
    example: 'Cursor vs Copilot · positioning',
    meta: '~2m 10s · 12-18 sources',
  },
  {
    type: 'market_research',
    icon: 'Search',
    title: 'Market Research',
    description: 'Explore a market trend, space, or opportunity',
    example: 'Agent payments · infra category',
    meta: '~2m 15s · 15-22 sources',
  },
]

/* ── Meeting Prep ──────────────────────────────────────────── */

export const MEETING_TYPE_OPTIONS_V3: Array<{ value: MeetingTypeV3; label: string }> = [
  { value: 'customer', label: 'Customer' },
  { value: 'partner', label: 'Partner' },
  { value: 'reseller', label: 'Reseller' },
  { value: 'investor', label: 'Investor' },
  { value: 'board', label: 'Board' },
  { value: 'internal', label: 'Internal' },
  { value: 'other', label: 'Other' },
]

export const GOAL_PLACEHOLDERS_V3: Record<MeetingTypeV3, string> = {
  customer: 'Close the deal on our enterprise plan',
  partner: 'Explore a co-sell partnership for Q3',
  reseller: 'Negotiate reseller terms and territory',
  investor: 'Pitch our Series A story',
  board: 'Present Q1 results and H2 strategy',
  internal: 'Align on next quarter priorities',
  other: 'What do you want to accomplish?',
}

/* ── Competitive Analysis ──────────────────────────────────── */

export const FOCUS_AREA_OPTIONS: Array<{ value: CompetitiveFocusArea; label: string }> = [
  { value: 'product', label: 'Product' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'gtm', label: 'Go-to-Market' },
  { value: 'technology', label: 'Technology' },
  { value: 'talent', label: 'Talent' },
  { value: 'overall', label: 'Overall' },
]

/* ── Market Research ───────────────────────────────────────── */

export const SCOPE_OPTIONS: Array<{ value: MarketScope; label: string }> = [
  { value: 'global', label: 'Global' },
  { value: 'north_america', label: 'North America' },
  { value: 'europe', label: 'Europe' },
  { value: 'apac', label: 'APAC' },
  { value: 'specific_region', label: 'Specific Region' },
]

export const TIME_HORIZON_OPTIONS: Array<{ value: TimeHorizon; label: string }> = [
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '6m', label: 'Last 6 months' },
  { value: '1y', label: 'Last year' },
]
