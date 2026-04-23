import { describe, expect, it } from 'vitest'
import { buildExaSearchBody } from '../providers/exa'

describe('buildExaSearchBody', () => {
  it('omits published-date filters for people searches', () => {
    const body = buildExaSearchBody('Maya Chen Acme', {
      category: 'people',
      numResults: 3,
    })

    expect(body).toMatchObject({
      query: 'Maya Chen Acme',
      category: 'people',
      numResults: 3,
    })
    expect(body).not.toHaveProperty('startPublishedDate')
    expect(body).not.toHaveProperty('endPublishedDate')
  })

  it('keeps published-date filters for news searches', () => {
    const body = buildExaSearchBody('Acme recent news', {
      category: 'news',
      lookbackDays: 30,
    })

    expect(body).toHaveProperty('startPublishedDate')
    expect(body).toHaveProperty('endPublishedDate')
  })
})
