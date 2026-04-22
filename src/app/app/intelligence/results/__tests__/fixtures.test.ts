import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  BusinessCaseBriefSchema,
  CompetitiveAnalysisBriefSchema,
  IntelligenceBriefSchema,
  MarketResearchBriefSchema,
  MeetingPrepBriefSchema,
} from '@/lib/intelligence/contracts'
import { businessCaseFixture } from '../__fixtures__/business-case.fixture'
import { competitiveFixture } from '../__fixtures__/competitive.fixture'
import { degradedFixtures } from '../__fixtures__/degraded.fixture'
import { emptyFixtures } from '../__fixtures__/empty.fixture'
import { marketResearchFixture } from '../__fixtures__/market-research.fixture'
import { meetingPrepFixture } from '../__fixtures__/meeting-prep.fixture'

const ORIGINAL_ENV = { ...process.env }

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  vi.resetModules()
})

describe('intelligence fixtures', () => {
  const parseCases = [
    ['meeting prep full', MeetingPrepBriefSchema, meetingPrepFixture],
    ['competitive full', CompetitiveAnalysisBriefSchema, competitiveFixture],
    ['business case full', BusinessCaseBriefSchema, businessCaseFixture],
    ['market research full', MarketResearchBriefSchema, marketResearchFixture],
    ['meeting prep empty', MeetingPrepBriefSchema, emptyFixtures.meeting_prep],
    ['competitive empty', CompetitiveAnalysisBriefSchema, emptyFixtures.competitive_analysis],
    ['business case empty', BusinessCaseBriefSchema, emptyFixtures.business_case],
    ['market research empty', MarketResearchBriefSchema, emptyFixtures.market_research],
    ['meeting prep degraded', MeetingPrepBriefSchema, degradedFixtures.meeting_prep],
    ['competitive degraded', CompetitiveAnalysisBriefSchema, degradedFixtures.competitive_analysis],
    ['business case degraded', BusinessCaseBriefSchema, degradedFixtures.business_case],
    ['market research degraded', MarketResearchBriefSchema, degradedFixtures.market_research],
  ] as const

  it.each(parseCases)('parses %s through its schema and the union schema', (_name, schema, fixture) => {
    const parsed = schema.parse(fixture)

    expect(IntelligenceBriefSchema.parse(parsed)).toMatchObject({
      id: fixture.id,
      researchType: fixture.researchType,
    })
  })
})

describe('INTEL_RESULTS_V2', () => {
  it('defaults on in development', async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: 'development',
      NEXT_PUBLIC_INTEL_RESULTS_V2: undefined,
    }

    const { INTEL_RESULTS_V2 } = await import('@/lib/intelligence/feature-flags')
    expect(INTEL_RESULTS_V2).toBe(true)
  })

  it('defaults off in production when the public flag is unset', async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: 'production',
      NEXT_PUBLIC_INTEL_RESULTS_V2: undefined,
    }

    const { INTEL_RESULTS_V2 } = await import('@/lib/intelligence/feature-flags')
    expect(INTEL_RESULTS_V2).toBe(false)
  })

  it('can be enabled in production with NEXT_PUBLIC_INTEL_RESULTS_V2=true', async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: 'production',
      NEXT_PUBLIC_INTEL_RESULTS_V2: 'true',
    }

    const { INTEL_RESULTS_V2 } = await import('@/lib/intelligence/feature-flags')
    expect(INTEL_RESULTS_V2).toBe(true)
  })
})
