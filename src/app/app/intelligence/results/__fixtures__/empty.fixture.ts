import type {
  BriefStatus,
  BusinessCaseBrief,
  CompetitiveAnalysisBrief,
  IntelligenceBrief,
  MarketResearchBrief,
  MeetingPrepBrief,
  ResearchType,
} from '@/lib/intelligence/contracts'

const emptyStatus: BriefStatus = {
  degraded: false,
  reasons: [],
  internalMs: 0,
  plannerMs: 0,
  exaMs: 0,
  tavilyMs: 0,
  verifierMs: 0,
  exaSearchMs: 0,
  tavilySearchMs: 0,
  synthesisMs: 0,
  totalMs: 0,
  sourceCount: 0,
  sourceCounts: {
    found: 0,
    ranked: 0,
    used: 0,
  },
  cached: false,
  synthesisModel: null,
}

export const emptyMeetingPrepFixture: MeetingPrepBrief = {
  id: 'fixture-meeting-prep-empty',
  researchType: 'meeting_prep',
  generatedAt: '2026-04-21T16:00:00.000Z',
  headline: 'We could not verify enough recent account context to make a confident call.',
  bottomLine: 'Treat this as an explicit unknown rather than a hidden guess.',
  whyItMatters: null,
  confidence: 'low',
  sources: [],
  status: emptyStatus,
  snapshot: null,
  attendeeProfiles: [],
  sections: {
    whatJustHappened: [],
    talkingPoints: [],
    landmines: [],
    questionsToAsk: [],
    competitorContext: [],
  },
}

export const emptyCompetitiveFixture: CompetitiveAnalysisBrief = {
  id: 'fixture-competitive-empty',
  researchType: 'competitive_analysis',
  generatedAt: '2026-04-21T16:00:00.000Z',
  headline: 'We did not find enough comparable evidence to make a defensible landscape call.',
  bottomLine: 'The right answer here is “unknown,” not fabricated differentiation.',
  whyItMatters: null,
  confidence: 'low',
  sources: [],
  status: emptyStatus,
  yourCompany: null,
  competitors: [],
  comparisonMatrix: [],
  sections: {
    keyFindings: [],
    strategicImplications: [],
    recommendations: [],
  },
}

export const emptyBusinessCaseFixture: BusinessCaseBrief = {
  id: 'fixture-business-case-empty',
  researchType: 'business_case',
  generatedAt: '2026-04-21T16:00:00.000Z',
  headline: 'There is not enough evidence yet to support a credible business-case verdict.',
  bottomLine: 'Do not force a go/no-go call when the supporting proof is missing.',
  whyItMatters: null,
  confidence: 'low',
  sources: [],
  status: emptyStatus,
  verdict: 'insufficient_data',
  verdictRationale: 'The evidence base is too thin to make a credible recommendation.',
  comparables: [],
  sections: {
    marketEvidence: [],
    supportingFactors: [],
    riskFactors: [],
    openQuestions: [],
  },
}

export const emptyMarketResearchFixture: MarketResearchBrief = {
  id: 'fixture-market-research-empty',
  researchType: 'market_research',
  generatedAt: '2026-04-21T16:00:00.000Z',
  headline: 'We could not validate enough market evidence to describe this category with confidence.',
  bottomLine: 'The safe answer is that the market view is still unknown.',
  whyItMatters: null,
  confidence: 'low',
  sources: [],
  status: emptyStatus,
  marketOverview: '',
  players: [],
  sections: {
    trendSignals: [],
    opportunities: [],
    threats: [],
    keyFindings: [],
  },
}

export const emptyFixtures = {
  meeting_prep: emptyMeetingPrepFixture,
  competitive_analysis: emptyCompetitiveFixture,
  business_case: emptyBusinessCaseFixture,
  market_research: emptyMarketResearchFixture,
} satisfies Record<ResearchType, IntelligenceBrief>
