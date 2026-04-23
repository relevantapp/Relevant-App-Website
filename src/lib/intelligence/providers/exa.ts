/* ── Exa Provider — lane-aware search, snapshots, answers ── */

const EXA_BASE = 'https://api.exa.ai'
const EXA_TIMEOUT_AUTO = 10_000
const EXA_TIMEOUT_DEEP = 20_000

function getApiKey(): string {
  const apiKey = process.env.EXA_API_KEY
  if (!apiKey) throw new Error('EXA_API_KEY not configured')
  return apiKey
}

export interface ExaSnapshotResult {
  name: string
  description: string
  website?: string | null
  industry?: string
  headquarters?: string
  employeeCount?: string
  employeeRange?: string
  fundingStage?: string
  lastFundingRound?: string
  lastFundingAmount?: string
  lastFundingDate?: string
  ceo?: string
  ceoName?: string
  foundedYear?: number | string
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
  structured?: Record<string, unknown> | null
  subpages?: ExaSearchResult[]
}

export interface ExaQueryOptions {
  lookbackDays?: number
  numResults?: number
  category?: 'company' | 'research paper' | 'news' | 'pdf' | 'personal site' | 'financial report' | 'people'
  includeDomains?: string[]
  excludeDomains?: string[]
  includeText?: string[]
  excludeText?: string[]
  summaryQuery?: string
  highlightsQuery?: string
  userLocation?: string
  livecrawl?: 'never' | 'fallback' | 'preferred' | 'always'
  textMaxCharacters?: number
}

async function exaFetch<T>(path: string, body: Record<string, unknown>, timeoutMs: number): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${EXA_BASE}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': getApiKey(),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Exa ${path} ${res.status}: ${text.slice(0, 300)}`)
    }

    return await res.json() as T
  } finally {
    clearTimeout(timeout)
  }
}

function toDateOnly(date: Date): string {
  return date.toISOString().split('T')[0]
}

function mapResult(raw: Record<string, unknown>): ExaSearchResult {
  const extras = raw.extras as Record<string, unknown> | undefined
  const output = raw.output as Record<string, unknown> | undefined
  const content = raw.content as Record<string, unknown> | undefined
  return {
    url: typeof raw.url === 'string' ? raw.url : '',
    title: typeof raw.title === 'string' ? raw.title : '',
    publishedDate: typeof raw.publishedDate === 'string' ? raw.publishedDate : null,
    highlights: Array.isArray(raw.highlights) ? raw.highlights.filter((item): item is string => typeof item === 'string') : [],
    summary: typeof raw.summary === 'string' ? raw.summary : null,
    text: typeof raw.text === 'string'
      ? raw.text
      : typeof content?.text === 'string'
        ? content.text
        : null,
    imageUrl: typeof raw.image === 'string' ? raw.image : Array.isArray(extras?.imageLinks) ? extras?.imageLinks?.[0] as string : null,
    faviconUrl: typeof raw.favicon === 'string' ? raw.favicon : null,
    structured: output ?? content ?? null,
    subpages: Array.isArray(raw.subpages)
      ? raw.subpages.map((item) => mapResult(item as Record<string, unknown>))
      : undefined,
  }
}

export function buildExaSearchBody(query: string, options: ExaQueryOptions = {}): Record<string, unknown> {
  const lookbackDays = options.lookbackDays ?? 60
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - lookbackDays)
  const supportsPublishedDateFilter = options.category !== 'people'

  return {
    query,
    type: options.category === 'news' ? 'neural' : 'auto',
    numResults: options.numResults ?? 10,
    ...(supportsPublishedDateFilter ? {
      startPublishedDate: toDateOnly(startDate),
      endPublishedDate: toDateOnly(new Date()),
    } : {}),
    ...(options.category ? { category: options.category } : {}),
    ...(options.includeDomains?.length ? { includeDomains: options.includeDomains } : {}),
    ...(options.excludeDomains?.length ? { excludeDomains: options.excludeDomains } : {}),
    ...(options.includeText?.length ? { includeText: options.includeText } : {}),
    ...(options.excludeText?.length ? { excludeText: options.excludeText } : {}),
    ...(options.userLocation ? { userLocation: options.userLocation } : {}),
    contents: {
      ...(options.livecrawl ? { livecrawl: options.livecrawl } : {}),
      livecrawlTimeout: options.livecrawl === 'preferred' || options.livecrawl === 'always' ? EXA_TIMEOUT_AUTO : undefined,
      highlights: { query: options.highlightsQuery ?? query, maxCharacters: 900 },
      summary: { query: options.summaryQuery ?? `Extract decision-relevant evidence for: ${query}` },
      text: { maxCharacters: options.textMaxCharacters ?? 1200 },
      extras: { imageLinks: 2 },
    },
  }
}

export async function searchExaSnapshot(accountName: string): Promise<ExaSnapshotResult | null> {
  try {
    const data = await exaFetch<{ results?: Record<string, unknown>[] }>('/search', {
      query: accountName,
      type: 'auto',
      category: 'company',
      numResults: 5,
      contents: {
        text: { maxCharacters: 4000 },
        subpages: 3,
        subpageTarget: ['about', 'pricing', 'customers', 'team'],
        livecrawl: 'preferred',
        livecrawlTimeout: EXA_TIMEOUT_AUTO,
        outputSchema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            hqCity: { type: 'string' },
            hqCountry: { type: 'string' },
            foundedYear: { type: 'number' },
            employeeRange: { type: 'string' },
            ceoName: { type: 'string' },
            lastFundingRound: { type: 'string' },
            lastFundingAmount: { type: 'string' },
            lastFundingDate: { type: 'string' },
            description: { type: 'string' },
            industry: { type: 'string' },
          },
        },
      },
    }, EXA_TIMEOUT_DEEP)

    const top = data.results?.[0]
    if (!top) return null

    const mapped = mapResult(top)
    const structured = (mapped.structured ?? {}) as Record<string, unknown>
    const hqCity = typeof structured.hqCity === 'string' ? structured.hqCity : ''
    const hqCountry = typeof structured.hqCountry === 'string' ? structured.hqCountry : ''

    return {
      name: typeof structured.name === 'string' ? structured.name : accountName,
      description: typeof structured.description === 'string'
        ? structured.description
        : mapped.summary || mapped.highlights.join(' ') || mapped.text || '',
      website: mapped.url || null,
      sourceUrl: mapped.url || null,
      imageUrl: mapped.imageUrl ?? null,
      faviconUrl: mapped.faviconUrl ?? null,
      industry: typeof structured.industry === 'string' ? structured.industry : undefined,
      headquarters: [hqCity, hqCountry].filter(Boolean).join(', ') || undefined,
      employeeRange: typeof structured.employeeRange === 'string' ? structured.employeeRange : undefined,
      employeeCount: typeof structured.employeeRange === 'string' ? structured.employeeRange : undefined,
      ceoName: typeof structured.ceoName === 'string' ? structured.ceoName : undefined,
      ceo: typeof structured.ceoName === 'string' ? structured.ceoName : undefined,
      foundedYear: typeof structured.foundedYear === 'number' || typeof structured.foundedYear === 'string'
        ? structured.foundedYear
        : undefined,
      lastFundingRound: typeof structured.lastFundingRound === 'string' ? structured.lastFundingRound : undefined,
      lastFundingAmount: typeof structured.lastFundingAmount === 'string' ? structured.lastFundingAmount : undefined,
      lastFundingDate: typeof structured.lastFundingDate === 'string' ? structured.lastFundingDate : undefined,
      raw: top,
    }
  } catch (err) {
    console.error('[exa] snapshot search failed:', err)
    return null
  }
}

export async function searchExaNews(accountName: string, lookbackDays = 30): Promise<ExaSearchResult[]> {
  return searchExaQuery(`${accountName} recent news announcements`, {
    lookbackDays,
    numResults: 10,
    category: 'news',
    livecrawl: 'preferred',
    summaryQuery: `What happened recently at ${accountName}?`,
    highlightsQuery: `${accountName} recent news announcements`,
  })
}

export async function searchExaQuery(query: string, options: ExaQueryOptions = {}): Promise<ExaSearchResult[]> {
  try {
    const data = await exaFetch<{ results?: Record<string, unknown>[] }>(
      '/search',
      buildExaSearchBody(query, options),
      options.livecrawl === 'preferred' || options.livecrawl === 'always' ? EXA_TIMEOUT_DEEP : EXA_TIMEOUT_AUTO,
    )
    return (data.results ?? []).map(mapResult).filter((result) => result.url)
  } catch (err) {
    console.error('[exa] search failed:', err)
    return []
  }
}

export async function searchExaPerson(name: string, company: string): Promise<ExaSearchResult[]> {
  return searchExaQuery(`${name} ${company}`, {
    numResults: 3,
    category: 'people',
    textMaxCharacters: 800,
    highlightsQuery: `${name} ${company} role background`,
  })
}

export async function searchExaCompetitor(competitor: string, accountName: string): Promise<ExaSearchResult[]> {
  return searchExaQuery(`${competitor} vs ${accountName}`, {
    numResults: 5,
    lookbackDays: 180,
    summaryQuery: `Compare ${competitor} against ${accountName}.`,
  })
}

export async function exaFindSimilar(url: string, options: {
  numResults?: number
  excludeDomains?: string[]
} = {}): Promise<ExaSearchResult[]> {
  try {
    const data = await exaFetch<{ results?: Record<string, unknown>[] }>('/findSimilar', {
      url,
      numResults: options.numResults ?? 10,
      ...(options.excludeDomains?.length ? { excludeDomains: options.excludeDomains } : {}),
      contents: {
        summary: { query: 'What company or product is this result about?' },
        highlights: { numSentences: 3 },
      },
    }, EXA_TIMEOUT_AUTO)
    return (data.results ?? []).map(mapResult).filter((result) => result.url)
  } catch (err) {
    console.error('[exa] findSimilar failed:', err)
    return []
  }
}

export async function exaAnswer(question: string, options: {
  includeText?: boolean
} = {}): Promise<{ answer: string; citations: ExaSearchResult[] } | null> {
  try {
    const data = await exaFetch<Record<string, unknown>>('/answer', {
      query: question,
      text: options.includeText ?? true,
    }, EXA_TIMEOUT_AUTO)
    return {
      answer: typeof data.answer === 'string' ? data.answer : '',
      citations: Array.isArray(data.citations)
        ? data.citations.map((item) => mapResult(item as Record<string, unknown>))
        : [],
    }
  } catch (err) {
    console.error('[exa] answer failed:', err)
    return null
  }
}

export async function exaResearch(request: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  try {
    return await exaFetch<Record<string, unknown>>('/research', request, 120_000)
  } catch (err) {
    console.error('[exa] research failed:', err)
    return null
  }
}
