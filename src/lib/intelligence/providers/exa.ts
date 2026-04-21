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
  imageUrl?: string | null
  faviconUrl?: string | null
  raw: unknown
}

export interface ExaSearchResult {
  url: string
  title: string
  publishedDate: string | null
  highlights: string[]
  summary: string | null
  text: string | null
  imageUrl?: string | null
  faviconUrl?: string | null
}

export interface ExaQueryOptions {
  lookbackDays?: number
  numResults?: number
  category?: 'company' | 'research paper' | 'news' | 'pdf' | 'personal site' | 'financial report' | 'people'
  includeDomains?: string[]
  excludeDomains?: string[]
  summaryQuery?: string
  highlightsQuery?: string
  userLocation?: string
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
      imageUrl: typeof top.image === 'string' ? top.image : null,
      faviconUrl: typeof top.favicon === 'string' ? top.favicon : null,
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
  return searchExaQuery(`${accountName} recent news announcements`, {
    lookbackDays,
    numResults: 10,
    category: 'news',
    summaryQuery: `What happened recently at ${accountName}?`,
    highlightsQuery: `${accountName} recent news announcements`,
  })
}

export async function searchExaQuery(
  query: string,
  options: ExaQueryOptions = {}
): Promise<ExaSearchResult[]> {
  const exa = getClient()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), EXA_TIMEOUT_AUTO)

  const lookbackDays = options.lookbackDays ?? 60
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - lookbackDays)

  try {
    const result = await exa.search(query, {
      type: 'auto',
      numResults: options.numResults ?? 10,
      startPublishedDate: startDate.toISOString().split('T')[0],
      ...(options.category ? { category: options.category } : {}),
      ...(options.includeDomains?.length ? { includeDomains: options.includeDomains } : {}),
      ...(options.excludeDomains?.length ? { excludeDomains: options.excludeDomains } : {}),
      ...(options.userLocation ? { userLocation: options.userLocation } : {}),
      contents: {
        highlights: { query: options.highlightsQuery ?? query, maxCharacters: 900 },
        summary: { query: options.summaryQuery ?? `What is the decision-relevant evidence in this source for: ${query}` },
        extras: { imageLinks: 2 },
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
      imageUrl: typeof r.image === 'string' ? r.image : r.extras?.imageLinks?.[0] ?? null,
      faviconUrl: typeof r.favicon === 'string' ? r.favicon : null,
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
      imageUrl: typeof r.image === 'string' ? r.image : null,
      faviconUrl: typeof r.favicon === 'string' ? r.favicon : null,
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
      imageUrl: typeof r.image === 'string' ? r.image : null,
      faviconUrl: typeof r.favicon === 'string' ? r.favicon : null,
    }))
  } catch (err) {
    clearTimeout(timeout)
    console.error('[exa] competitor search failed:', err)
    return []
  }
}
