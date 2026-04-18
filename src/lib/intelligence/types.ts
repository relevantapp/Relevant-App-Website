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
  }
}

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
