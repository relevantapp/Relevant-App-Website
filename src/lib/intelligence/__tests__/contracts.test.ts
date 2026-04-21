/* ── Schema Validation Tests ────────────────────────────────── */

import { describe, it, expect } from 'vitest'
import {
  ConfidenceSchema,
  BriefBulletSchema,
  BriefSourceSchema,
  BriefStatusSchema,
  NormalizedEvidenceSchema,
  TimelineEventSchema,
  RadarMetricSchema,
  CompetitorMatrixRowSchema,
  MeetingPrepSynthesisSchema,
} from '../contracts'

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
