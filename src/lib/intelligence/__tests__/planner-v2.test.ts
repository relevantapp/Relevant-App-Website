import { describe, expect, it } from 'vitest'
import type {
  BusinessCaseRequest,
  CompetitiveAnalysisRequest,
  MarketResearchRequest,
  MeetingPrepRequest,
  ResearchType,
} from '../contracts'
import { buildResearchIntentPacket } from '../context/intent-packet'
import { adaptPlanForDisplay } from '../orchestrators/v2-bridge'
import { buildFallbackPlanV2, requiredLaneRolesForType } from '../planner/fallbacks'

const userId = 'user-123'

function requestFor(type: ResearchType): MeetingPrepRequest | CompetitiveAnalysisRequest | BusinessCaseRequest | MarketResearchRequest {
  if (type === 'meeting_prep') {
    return {
      accountName: 'Acme',
      meetingType: 'sales',
      goal: 'Prepare for enterprise discovery',
      attendees: ['Jane Doe'],
      userContext: null,
    }
  }

  if (type === 'competitive_analysis') {
    return {
      competitors: ['Acme', 'Beta'],
      yourCompany: 'Relevant',
      focusArea: 'overall',
      userContext: null,
    }
  }

  if (type === 'business_case') {
    return {
      initiativeName: 'Signal scoring',
      hypothesis: 'Improves prioritization',
      userContext: null,
    }
  }

  return {
    marketOrTrend: 'Agentic workflows',
    scope: 'global',
    timeHorizon: '90d',
    knownPlayers: ['Relevant', 'Acme'],
    userContext: null,
  }
}

describe('buildResearchIntentPacket', () => {
  it('defaults market research to deep depth', () => {
    const intent = buildResearchIntentPacket({
      userId,
      researchType: 'market_research',
      request: requestFor('market_research') as MarketResearchRequest,
    })

    expect(intent.depth).toBe('deep')
  })

  it('honors an explicit depth override', () => {
    const intent = buildResearchIntentPacket({
      userId,
      researchType: 'meeting_prep',
      request: requestFor('meeting_prep') as MeetingPrepRequest,
      depth: 'fast',
    })

    expect(intent.depth).toBe('fast')
  })
})

describe('buildFallbackPlanV2', () => {
  const researchTypes: ResearchType[] = [
    'meeting_prep',
    'competitive_analysis',
    'business_case',
    'market_research',
  ]

  for (const researchType of researchTypes) {
    it(`includes the required lanes for ${researchType}`, () => {
      const intent = buildResearchIntentPacket({
        userId,
        researchType,
        request: requestFor(researchType) as never,
      })
      const plan = buildFallbackPlanV2(intent)
      const requiredRoles = new Set(
        plan.lanes.filter((lane) => lane.required).map((lane) => lane.sourceRole),
      )

      expect(plan.lanes[0].sourceRole).toBe('internal_memory')
      for (const role of requiredLaneRolesForType(researchType)) {
        expect(requiredRoles.has(role)).toBe(true)
      }
    })
  }
})

describe('adaptPlanForDisplay', () => {
  it('preserves internal lanes in the existing search-plan contract', () => {
    const intent = buildResearchIntentPacket({
      userId,
      researchType: 'meeting_prep',
      request: requestFor('meeting_prep') as MeetingPrepRequest,
    })
    const plan = buildFallbackPlanV2(intent)
    const displayPlan = adaptPlanForDisplay(plan)

    expect(displayPlan.v2?.planId).toBe(plan.planId)
    expect(displayPlan.searches[0]?.provider).toBe('internal')
    expect(displayPlan.searches[0]?.sourceRole).toBe('internal_memory')
  })
})