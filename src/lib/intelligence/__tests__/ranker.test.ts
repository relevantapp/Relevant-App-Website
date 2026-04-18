/* ── Ranker Unit Tests ──────────────────────────────────────── */

import { describe, it, expect } from 'vitest'
import { rankEvidence, extractQueryTerms } from '../ranker'
import type { NormalizedEvidence } from '../contracts'

function makeEvidence(overrides: Partial<NormalizedEvidence> & { id: string }): NormalizedEvidence {
  return {
    text: 'Sample evidence text',
    url: `https://example.com/${overrides.id}`,
    title: 'Sample Title',
    domain: 'example.com',
    publishedAt: new Date().toISOString(),
    provider: 'exa',
    ...overrides,
  }
}

describe('rankEvidence', () => {
  it('returns at most topN results', () => {
    const evidence = Array.from({ length: 10 }, (_, i) =>
      makeEvidence({ id: `e${i}`, domain: `domain${i}.com` }),
    )
    const result = rankEvidence(evidence, { topN: 3, queryTerms: [] })
    expect(result).toHaveLength(3)
  })

  it('deduplicates by domain — keeps highest scored', () => {
    const old = new Date(Date.now() - 120 * 86400000).toISOString()
    const evidence = [
      makeEvidence({ id: 'a', domain: 'reuters.com', publishedAt: old }),
      makeEvidence({ id: 'b', domain: 'reuters.com', publishedAt: new Date().toISOString() }),
    ]
    const result = rankEvidence(evidence, { topN: 5, queryTerms: [] })
    expect(result).toHaveLength(1)
    // Recent one should win
    expect(result[0].id).toBe('b')
  })

  it('ranks high-authority domains higher', () => {
    const evidence = [
      makeEvidence({ id: 'low', domain: 'random-blog.xyz', publishedAt: null }),
      makeEvidence({ id: 'high', domain: 'reuters.com', publishedAt: null }),
    ]
    const result = rankEvidence(evidence, { topN: 5, queryTerms: [] })
    expect(result[0].id).toBe('high')
  })

  it('boosts items matching query terms', () => {
    const evidence = [
      makeEvidence({ id: 'miss', domain: 'a.com', title: 'Unrelated article', text: 'Nothing relevant' }),
      makeEvidence({ id: 'hit', domain: 'b.com', title: 'OpenAI launches GPT', text: 'AI models for enterprise' }),
    ]
    const result = rankEvidence(evidence, {
      topN: 5,
      queryTerms: ['openai', 'gpt', 'enterprise'],
    })
    expect(result[0].id).toBe('hit')
  })

  it('boosts recent articles over old ones', () => {
    const recent = new Date().toISOString()
    const old = new Date(Date.now() - 365 * 86400000).toISOString()
    const evidence = [
      makeEvidence({ id: 'old', domain: 'a.com', publishedAt: old }),
      makeEvidence({ id: 'new', domain: 'b.com', publishedAt: recent }),
    ]
    const result = rankEvidence(evidence, { topN: 5, queryTerms: [] })
    expect(result[0].id).toBe('new')
  })

  it('returns empty array for empty input', () => {
    const result = rankEvidence([], { topN: 5, queryTerms: [] })
    expect(result).toHaveLength(0)
  })

  it('handles null publishedAt gracefully', () => {
    const evidence = [
      makeEvidence({ id: 'nodate', domain: 'a.com', publishedAt: null }),
    ]
    const result = rankEvidence(evidence, { topN: 5, queryTerms: [] })
    expect(result).toHaveLength(1)
  })
})

describe('extractQueryTerms', () => {
  it('removes stop words', () => {
    const terms = extractQueryTerms('what is the best AI tool for business')
    expect(terms).not.toContain('what')
    expect(terms).not.toContain('the')
    expect(terms).not.toContain('for')
    expect(terms).toContain('best')
    expect(terms).toContain('tool')
  })

  it('removes short words (<=2 chars)', () => {
    const terms = extractQueryTerms('AI is a big thing')
    expect(terms).not.toContain('ai')
    expect(terms).toContain('big')
    expect(terms).toContain('thing')
  })

  it('lowercases everything', () => {
    const terms = extractQueryTerms('OpenAI GPT Enterprise')
    expect(terms).toContain('openai')
    expect(terms).toContain('gpt')
    expect(terms).toContain('enterprise')
  })

  it('limits to 20 terms', () => {
    const longText = Array.from({ length: 50 }, (_, i) => `term${i}`).join(' ')
    const terms = extractQueryTerms(longText)
    expect(terms.length).toBeLessThanOrEqual(20)
  })

  it('returns empty array for empty string', () => {
    expect(extractQueryTerms('')).toEqual([])
  })
})
