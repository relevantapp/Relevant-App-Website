/* ── Exa Provider — Company snapshots, news, people, competitors ── */

import Exa from 'exa-js'

const EXA_TIMEOUT_AUTO = 10_000
const EXA_TIMEOUT_DEEP = 20_000

function getClient(): Exa {
  const apiKey = process.env.EXA_API_KEY
  if (!apiKey) throw new Error('EXA_API_KEY not configured')
  return new Exa(apiKey)
}

export interface ExaSnapshotResult {
  name: string
  description: string
  industry?: string
  headquarters?: string
  employeeCount?: string
  fundingStage?: string
  lastFundingAmount?: string
  ceo?: string
  recentMilestone?: string
  sourceUrl: string | null
  raw: unknown
}

export interface ExaSearchResult {
  url: string
  title: string
  publishedDate: string | null
  highlights: string[]
  summary: string | null
  text: string | null
}

export async function searchExaSnapshot(
  accountName: string
): Promise<ExaSnapshotResult | null> {
  const exa = getClient()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), EXA_TIMEOUT_DEEP)

  try {
    const result = await exa.search(accountName, {
      type: 'auto',
      numResults: 5,
      contents: {
        highlights: { numSentences: 5 },
        summary: { query: `What does ${accountName} do? Key facts about the company.` },
      },
    })

    clearTimeout(timeout)

    if (!result.results.length) return null

    const top = result.results[0]
    return {
      name: accountName,
      description: top.summary || top.highlights?.join(' ') || '',
      sourceUrl: top.url || null,
      raw: top,
    }
  } catch (err) {
    clearTimeout(timeout)
    console.error('[exa] snapshot search failed:', err)
    return null
  }
}

export async function searchExaNews(
  accountName: string,
  lookbackDays = 30
): Promise<ExaSearchResult[]> {
  const exa = getClient()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), EXA_TIMEOUT_AUTO)

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - lookbackDays)

  try {
    const result = await exa.search(`${accountName} recent news announcements`, {
      type: 'auto',
      numResults: 10,
      startPublishedDate: startDate.toISOString().split('T')[0],
      contents: {
        highlights: { numSentences: 3 },
        summary: { query: `What happened recently at ${accountName}?` },
      },
    })

    clearTimeout(timeout)

    return result.results.map((r) => ({
      url: r.url,
      title: r.title || '',
      publishedDate: r.publishedDate || null,
      highlights: r.highlights || [],
      summary: r.summary || null,
      text: null,
    }))
  } catch (err) {
    clearTimeout(timeout)
    console.error('[exa] news search failed:', err)
    return []
  }
}

export async function searchExaPerson(
  name: string,
  company: string
): Promise<ExaSearchResult[]> {
  const exa = getClient()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), EXA_TIMEOUT_AUTO)

  try {
    const result = await exa.search(`${name} ${company}`, {
      type: 'auto',
      numResults: 3,
      contents: {
        highlights: { numSentences: 3 },
      },
    })

    clearTimeout(timeout)

    return result.results.map((r) => ({
      url: r.url,
      title: r.title || '',
      publishedDate: r.publishedDate || null,
      highlights: r.highlights || [],
      summary: null,
      text: null,
    }))
  } catch (err) {
    clearTimeout(timeout)
    console.error('[exa] person search failed:', err)
    return []
  }
}

export async function searchExaCompetitor(
  competitor: string,
  accountName: string
): Promise<ExaSearchResult[]> {
  const exa = getClient()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), EXA_TIMEOUT_AUTO)

  try {
    const result = await exa.search(`${competitor} vs ${accountName}`, {
      type: 'auto',
      numResults: 5,
      contents: {
        highlights: { numSentences: 3 },
      },
    })

    clearTimeout(timeout)

    return result.results.map((r) => ({
      url: r.url,
      title: r.title || '',
      publishedDate: r.publishedDate || null,
      highlights: r.highlights || [],
      summary: null,
      text: null,
    }))
  } catch (err) {
    clearTimeout(timeout)
    console.error('[exa] competitor search failed:', err)
    return []
  }
}
