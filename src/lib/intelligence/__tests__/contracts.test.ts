/* ── Schema Validation Tests ────────────────────────────────── */

import { describe, it, expect } from 'vitest'
import {
  ConfidenceSchema,
  BriefBulletSchema,
  BriefSourceSchema,
  BriefStatusSchema,
  NormalizedEvidenceSchema,
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
