/* ── Schema Validation Tests ────────────────────────────────── */

import { describe, it, expect } from 'vitest'
import {
  AnswerBlockSchema,
  BriefBaseSchema,
  ConfidenceSchema,
  BriefBulletSchema,
  BriefSourceSchema,
  BriefStatusSchema,
  BusinessCaseBriefSchema,
  CitedSpanSchema,
  CompetitiveAnalysisBriefSchema,
  IntelligenceBriefSchema,
  MarketResearchBriefSchema,
  NormalizedEvidenceSchema,
  MeetingPrepBriefSchema,
  TimelineEventSchema,
  RadarMetricSchema,
  RichBulletSchema,
  CompetitorMatrixRowSchema,
  MeetingPrepSynthesisSchema,
} from '../contracts'
import { businessCaseFixture } from '@/app/app/intelligence/results/__fixtures__/business-case.fixture'
import { competitiveFixture } from '@/app/app/intelligence/results/__fixtures__/competitive.fixture'
import { marketResearchFixture } from '@/app/app/intelligence/results/__fixtures__/market-research.fixture'
import { meetingPrepFixture } from '@/app/app/intelligence/results/__fixtures__/meeting-prep.fixture'

describe('ConfidenceSchema', () => {
  it('accepts valid values', () => {
    expect(ConfidenceSchema.parse('high')).toBe('high')
    expect(ConfidenceSchema.parse('medium')).toBe('medium')
    expect(ConfidenceSchema.parse('low')).toBe('low')
  })

  it('rejects invalid values', () => {
    expect(() => ConfidenceSchema.parse('invalid')).toThrow()
    expect(() => ConfidenceSchema.parse('')).toThrow()
    expect(() => ConfidenceSchema.parse(42)).toThrow()
  })
})

describe('CitedSpanSchema', () => {
  it('accepts a cited span with a source snippet', () => {
    const span = {
      text: 'Decision quality is the wedge.',
      sourceIds: ['s1'],
      sourceSnippet: 'Decision quality is the wedge.',
    }

    expect(CitedSpanSchema.parse(span)).toEqual(span)
  })

  it('accepts a cited span without a source snippet', () => {
    const span = {
      text: 'Monitoring breadth still matters.',
      sourceIds: ['s2'],
    }

    expect(CitedSpanSchema.parse(span)).toEqual(span)
  })
})

describe('BriefBulletSchema', () => {
  it('accepts valid bullet', () => {
    const bullet = { text: 'Company raised $10M', sourceIds: ['s1', 's2'], tag: 'fact' }
    expect(BriefBulletSchema.parse(bullet)).toEqual(bullet)
  })

  it('accepts inference tag', () => {
    const bullet = { text: 'Likely expanding', sourceIds: [], tag: 'inference' }
    expect(BriefBulletSchema.parse(bullet)).toEqual(bullet)
  })

  it('rejects missing text', () => {
    expect(() => BriefBulletSchema.parse({ sourceIds: [], tag: 'fact' })).toThrow()
  })

  it('rejects invalid tag', () => {
    expect(() =>
      BriefBulletSchema.parse({ text: 'x', sourceIds: [], tag: 'opinion' }),
    ).toThrow()
  })
})

describe('AnswerBlockSchema', () => {
  it('requires all fields except nullable whatChanged', () => {
    const answer = {
      conclusion: { text: 'Go now.', sourceIds: ['s1'] },
      whyItMatters: { text: 'It shortens the cycle.', sourceIds: ['s2'] },
      whatChanged: null,
      confidence: {
        level: 'high',
        driver: 'Two fresh sources.',
      },
      recommendedNext: {
        text: 'Lead with proof.',
      },
    } as const

    expect(AnswerBlockSchema.parse(answer)).toEqual(answer)
    expect(() => AnswerBlockSchema.parse({
      conclusion: { text: 'Go now.', sourceIds: ['s1'] },
      whyItMatters: { text: 'It shortens the cycle.', sourceIds: ['s2'] },
      confidence: {
        level: 'high',
        driver: 'Two fresh sources.',
      },
      recommendedNext: {
        text: 'Lead with proof.',
      },
    })).toThrow()
  })
})

describe('RichBulletSchema', () => {
  it('remains backward-compatible with existing BriefBullet data', () => {
    const legacyBullet = {
      text: 'Raised a new round.',
      sourceIds: ['s1'],
      tag: 'fact',
    } as const

    expect(RichBulletSchema.parse(legacyBullet)).toEqual(legacyBullet)
  })
})

describe('BriefSourceSchema', () => {
  it('accepts valid source', () => {
    const source = {
      id: 'src1',
      url: 'https://reuters.com/article',
      title: 'Breaking News',
      domain: 'reuters.com',
      publishedAt: '2025-01-01T00:00:00Z',
      provider: 'exa',
      snippet: 'Some snippet text',
    }
    expect(BriefSourceSchema.parse(source)).toEqual(source)
  })

  it('accepts null publishedAt and snippet', () => {
    const source = {
      id: 'src2',
      url: 'https://example.com',
      title: 'Test',
      domain: 'example.com',
      publishedAt: null,
      provider: 'tavily',
      snippet: null,
    }
    expect(BriefSourceSchema.parse(source)).toEqual(source)
  })

  it('accepts internal provider', () => {
    const source = {
      id: 'src3',
      url: 'https://internal.com',
      title: 'Internal',
      domain: 'internal.com',
      publishedAt: null,
      provider: 'internal',
      snippet: null,
    }
    expect(BriefSourceSchema.parse(source)).toEqual(source)
  })
})

describe('BriefStatusSchema', () => {
  it('accepts valid status', () => {
    const status = {
      degraded: false,
      reasons: [],
      internalMs: 0,
      plannerMs: 200,
      exaMs: 1200,
      tavilyMs: 800,
      verifierMs: 0,
      exaSearchMs: 1200,
      tavilySearchMs: 800,
      synthesisMs: 3000,
      totalMs: 5000,
      sourceCount: 12,
      cached: false,
      synthesisModel: 'claude-sonnet-4-20250514',
    }
    expect(BriefStatusSchema.parse(status)).toEqual(status)
  })

  it('accepts degraded status with reasons', () => {
    const status = {
      degraded: true,
      reasons: ['Exa search failed', 'Low source count'],
      internalMs: 0,
      plannerMs: 100,
      exaMs: 0,
      tavilyMs: 800,
      verifierMs: 0,
      exaSearchMs: 0,
      tavilySearchMs: 800,
      synthesisMs: 3000,
      totalMs: 3800,
      sourceCount: 3,
      cached: false,
      synthesisModel: null,
    }
    expect(BriefStatusSchema.parse(status)).toEqual(status)
  })
})

describe('NormalizedEvidenceSchema', () => {
  it('accepts valid evidence', () => {
    const evidence = {
      id: 'ev1',
      text: 'Some evidence text',
      url: 'https://reuters.com/article',
      title: 'Article Title',
      domain: 'reuters.com',
      publishedAt: '2025-01-01T00:00:00Z',
      provider: 'exa',
    }
    expect(NormalizedEvidenceSchema.parse(evidence)).toEqual(evidence)
  })

  it('rejects unknown provider', () => {
    expect(() =>
      NormalizedEvidenceSchema.parse({
        id: 'ev2',
        text: 'text',
        url: 'https://example.com',
        title: 'title',
        domain: 'example.com',
        publishedAt: null,
        provider: 'google',
      }),
    ).toThrow()
  })
})

describe('TimelineEventSchema', () => {
  it('accepts valid timeline event with sourceIds', () => {
    const event = {
      date: '2026-03-14',
      type: 'product',
      impact: 'positive',
      text: 'Launched an AI workflow for enterprise buyers.',
      sourceIds: ['s1'],
    }

    expect(TimelineEventSchema.parse(event)).toEqual(event)
  })

  it('rejects missing sourceIds', () => {
    expect(() => TimelineEventSchema.parse({
      date: '2026-03-14',
      type: 'product',
      impact: 'positive',
      text: 'Launched an AI workflow for enterprise buyers.',
      sourceIds: [],
    })).toThrow()
  })

  it('rejects invalid event type', () => {
    expect(() => TimelineEventSchema.parse({
      date: '2026-03-14',
      type: 'misc',
      impact: 'positive',
      text: 'Something happened.',
      sourceIds: ['s1'],
    })).toThrow()
  })
})

describe('RadarMetricSchema', () => {
  it('accepts valid radar metric', () => {
    const metric = {
      category: 'budget',
      severity: 4,
      details: 'Procurement scrutiny increased after the last planning cycle.',
      sourceIds: ['s2'],
    }

    expect(RadarMetricSchema.parse(metric)).toEqual(metric)
  })

  it('rejects invalid category', () => {
    expect(() => RadarMetricSchema.parse({
      category: 'security',
      severity: 4,
      details: 'Security review may slow timelines.',
      sourceIds: ['s2'],
    })).toThrow()
  })

  it('rejects severity outside bounds', () => {
    expect(() => RadarMetricSchema.parse({
      category: 'budget',
      severity: 6,
      details: 'Budget risk is extreme.',
      sourceIds: ['s2'],
    })).toThrow()
  })
})

describe('CompetitorMatrixRowSchema', () => {
  it('accepts valid competitor matrix row', () => {
    const row = {
      name: 'Acme AI',
      threatLevel: 3,
      marketOverlap: 2,
      advantage: 'Faster procurement path with existing accounts.',
      tags: ['incumbent', 'pricing'],
      sourceIds: ['s3'],
    }

    expect(CompetitorMatrixRowSchema.parse(row)).toEqual(row)
  })

  it('rejects out-of-bounds market overlap', () => {
    expect(() => CompetitorMatrixRowSchema.parse({
      name: 'Acme AI',
      threatLevel: 3,
      marketOverlap: 5,
      advantage: 'Faster procurement path with existing accounts.',
      tags: ['incumbent'],
      sourceIds: ['s3'],
    })).toThrow()
  })

  it('rejects missing sourceIds', () => {
    expect(() => CompetitorMatrixRowSchema.parse({
      name: 'Acme AI',
      threatLevel: 3,
      marketOverlap: 2,
      advantage: 'Faster procurement path with existing accounts.',
      tags: ['incumbent'],
      sourceIds: [],
    })).toThrow()
  })
})

describe('MeetingPrepSynthesisSchema', () => {
  const validSynthesis = {
    headline: 'Momentum is real, but the buying process still needs shaping.',
    bottomLine: 'Lead with recent expansion, then pressure-test timing and champion depth.',
    whyItMatters: 'You can use recent proof points to move the next step forward.',
    confidence: 'high',
    momentumScore: 72,
    riskLevel: 'medium',
    sentiment: 'positive',
    timelineEvents: [
      {
        date: '2026-03-14',
        type: 'product',
        impact: 'positive',
        text: 'Launched an AI workflow for enterprise buyers.',
        sourceIds: ['s1'],
      },
    ],
    radarMetrics: [
      {
        category: 'budget',
        severity: 3,
        details: 'Budget exists but scrutiny increased this quarter.',
        sourceIds: ['s2'],
      },
    ],
    competitorMatrix: [
      {
        name: 'Acme AI',
        threatLevel: 3,
        marketOverlap: 2,
        advantage: 'Already deployed in the adjacent team.',
        tags: ['incumbent'],
        sourceIds: ['s3'],
      },
    ],
    whatJustHappened: [{ text: 'Raised a new round.', sourceIds: ['s1'], tag: 'fact' }],
    talkingPoints: [{ text: 'Tie the launch to revenue impact.', sourceIds: ['s2'], tag: 'inference' }],
    landmines: [{ text: 'Do not overpromise deployment speed.', sourceIds: ['s2'], tag: 'inference' }],
    questionsToAsk: [{ text: 'Who owns rollout approval?', sourceIds: ['s3'], tag: 'fact' }],
    competitorContext: [{ text: 'Acme AI is already in the conversation.', sourceIds: ['s3'], tag: 'fact' }],
  } as const

  it('accepts valid structured dashboard data', () => {
    expect(MeetingPrepSynthesisSchema.parse(validSynthesis)).toEqual(validSynthesis)
  })

  it('rejects momentum score outside bounds', () => {
    expect(() => MeetingPrepSynthesisSchema.parse({
      ...validSynthesis,
      momentumScore: 101,
    })).toThrow()
  })

  it('rejects invalid radar metric category in synthesis payload', () => {
    expect(() => MeetingPrepSynthesisSchema.parse({
      ...validSynthesis,
      radarMetrics: [{
        category: 'security',
        severity: 2,
        details: 'Security review may slow the deal.',
        sourceIds: ['s2'],
      }],
    })).toThrow()
  })
})

describe('BriefBaseSchema', () => {
  it('accepts a fully populated brief base object with answer, trust, and methodology', () => {
    const base = {
      id: meetingPrepFixture.id,
      researchType: meetingPrepFixture.researchType,
      generatedAt: meetingPrepFixture.generatedAt,
      headline: meetingPrepFixture.headline,
      bottomLine: meetingPrepFixture.bottomLine,
      whyItMatters: meetingPrepFixture.whyItMatters,
      confidence: meetingPrepFixture.confidence,
      sources: meetingPrepFixture.sources,
      status: meetingPrepFixture.status,
      researchPlan: meetingPrepFixture.researchPlan,
      contextUsed: meetingPrepFixture.contextUsed,
      answer: meetingPrepFixture.answer,
      trust: meetingPrepFixture.trust,
      methodology: meetingPrepFixture.methodology,
    }

    expect(BriefBaseSchema.parse(base)).toEqual(base)
  })
})

describe('full brief schemas', () => {
  const roundTripCases = [
    ['meeting prep', MeetingPrepBriefSchema, meetingPrepFixture],
    ['competitive', CompetitiveAnalysisBriefSchema, competitiveFixture],
    ['business case', BusinessCaseBriefSchema, businessCaseFixture],
    ['market research', MarketResearchBriefSchema, marketResearchFixture],
  ] as const

  it.each(roundTripCases)('round-trips %s fixtures with the new universal fields', (_name, schema, fixture) => {
    const parsed = schema.parse(fixture)
    const roundTrip = schema.parse(JSON.parse(JSON.stringify(parsed)))

    expect(roundTrip).toEqual(parsed)
    expect(IntelligenceBriefSchema.parse(roundTrip)).toMatchObject({
      id: fixture.id,
      researchType: fixture.researchType,
    })
  })
})
