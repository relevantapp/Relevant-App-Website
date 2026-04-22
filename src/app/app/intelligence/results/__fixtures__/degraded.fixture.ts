import type {
  BriefStatus,
  BusinessCaseBrief,
  CompetitiveAnalysisBrief,
  IntelligenceBrief,
  MarketResearchBrief,
  MeetingPrepBrief,
  ResearchType,
} from '@/lib/intelligence/contracts'
import { businessCaseFixture } from './business-case.fixture'
import { competitiveFixture } from './competitive.fixture'
import { marketResearchFixture } from './market-research.fixture'
import { meetingPrepFixture } from './meeting-prep.fixture'

const degradedStatus: BriefStatus = {
  degraded: true,
  reasons: ['Only one external provider responded', 'Evidence pack was thinner than the ideal threshold'],
  internalMs: 60,
  plannerMs: 80,
  exaMs: 410,
  tavilyMs: 0,
  verifierMs: 0,
  exaSearchMs: 410,
  tavilySearchMs: 0,
  synthesisMs: 1240,
  totalMs: 1790,
  sourceCount: 2,
  sourceCounts: {
    found: 4,
    ranked: 2,
    used: 2,
  },
  cached: false,
  synthesisModel: 'openai/gpt-5.4-mini',
}

export const degradedMeetingPrepFixture: MeetingPrepBrief = {
  ...meetingPrepFixture,
  id: 'fixture-meeting-prep-degraded',
  headline: 'The account looks warm, but this brief is degraded and should be treated as directional.',
  bottomLine: 'We only recovered two useful signals, so use this for orientation rather than precision.',
  confidence: 'medium',
  sources: meetingPrepFixture.sources.slice(0, 2),
  status: degradedStatus,
  timelineEvents: meetingPrepFixture.timelineEvents?.slice(0, 2),
  radarMetrics: meetingPrepFixture.radarMetrics?.slice(0, 3),
  competitorMatrix: meetingPrepFixture.competitorMatrix?.slice(0, 1),
  sections: {
    whatJustHappened: meetingPrepFixture.sections.whatJustHappened.slice(0, 1),
    talkingPoints: meetingPrepFixture.sections.talkingPoints.slice(0, 1),
    landmines: meetingPrepFixture.sections.landmines.slice(0, 1),
    questionsToAsk: meetingPrepFixture.sections.questionsToAsk.slice(0, 1),
    competitorContext: [],
  },
}

export const degradedCompetitiveFixture: CompetitiveAnalysisBrief = {
  ...competitiveFixture,
  id: 'fixture-competitive-degraded',
  headline: 'Relevant still looks differentiated on answer quality, but this comparison is thinner than usual.',
  bottomLine: 'Treat this as a sketch of the field, not a fully-defensible scorecard.',
  confidence: 'medium',
  sources: competitiveFixture.sources.slice(0, 2),
  status: degradedStatus,
  competitors: competitiveFixture.competitors.slice(0, 2),
  comparisonMatrix: competitiveFixture.comparisonMatrix.slice(0, 2),
  sections: {
    keyFindings: competitiveFixture.sections.keyFindings.slice(0, 1),
    strategicImplications: competitiveFixture.sections.strategicImplications.slice(0, 1),
    recommendations: [],
  },
}

export const degradedBusinessCaseFixture: BusinessCaseBrief = {
  ...businessCaseFixture,
  id: 'fixture-business-case-degraded',
  headline: 'There may be a case to invest, but the proof is too thin for a high-confidence call.',
  bottomLine: 'This is directional only until the evidence base is stronger.',
  confidence: 'low',
  verdict: 'moderate' as const,
  sources: businessCaseFixture.sources.slice(0, 2),
  status: degradedStatus,
  comparables: businessCaseFixture.comparables.slice(0, 1),
  sections: {
    marketEvidence: businessCaseFixture.sections.marketEvidence.slice(0, 1),
    supportingFactors: businessCaseFixture.sections.supportingFactors.slice(0, 1),
    riskFactors: businessCaseFixture.sections.riskFactors.slice(0, 1),
    openQuestions: businessCaseFixture.sections.openQuestions.slice(0, 1),
  },
}

export const degradedMarketResearchFixture: MarketResearchBrief = {
  ...marketResearchFixture,
  id: 'fixture-market-research-degraded',
  headline: 'The market still appears favorable for answer-first tools, but this read is sparse.',
  bottomLine: 'Use this as a rough orientation, not a full market map.',
  confidence: 'low',
  sources: marketResearchFixture.sources.slice(0, 2),
  status: degradedStatus,
  players: marketResearchFixture.players.slice(0, 2),
  sections: {
    trendSignals: marketResearchFixture.sections.trendSignals.slice(0, 1),
    opportunities: marketResearchFixture.sections.opportunities.slice(0, 1),
    threats: marketResearchFixture.sections.threats.slice(0, 1),
    keyFindings: marketResearchFixture.sections.keyFindings.slice(0, 1),
  },
}

export const degradedFixtures = {
  meeting_prep: degradedMeetingPrepFixture,
  competitive_analysis: degradedCompetitiveFixture,
  business_case: degradedBusinessCaseFixture,
  market_research: degradedMarketResearchFixture,
} satisfies Record<ResearchType, IntelligenceBrief>
