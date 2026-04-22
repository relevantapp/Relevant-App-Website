/* ── Tavily Provider — lane-aware search, extract, map, crawl ──── */

import { intelligenceFlags } from '../feature-flags'

const TAVILY_BASE = 'https://api.tavily.com'
const TAVILY_TIMEOUT = 10_000
const TAVILY_DEEP_TIMEOUT = 45_000

function getApiKey(): string {
  const key = process.env.TAVILY_API_KEY
  if (!key) throw new Error('TAVILY_API_KEY not configured')
  return key
}

export interface TavilySearchResult {
  url: string
  title: string
  content: string
  rawContent?: string | null
  publishedDate: string | null
  score: number
  faviconUrl?: string | null
  images?: Array<{ url: string; description?: string | null }>
}

export interface TavilyNewsResponse {
  answer: string | null
  images: Array<{ url: string; description?: string | null }>
  results: TavilySearchResult[]
}

export interface TavilyExtractResult {
  url: string
  rawContent: string
  images?: Array<{ url: string; description?: string | null }>
}

export interface TavilySearchOptions {
  topic?: 'general' | 'news' | 'finance'
  timeRange?: 'day' | 'week' | 'month' | 'year'
  startDate?: string
  endDate?: string
  maxResults?: number
  includeImages?: boolean
  includeDomains?: string[]
  excludeDomains?: string[]
  country?: string
  searchDepth?: 'fast' | 'basic' | 'advanced'
  chunksPerSource?: number
  includeRawContent?: false | true | 'markdown'
  includeAnswer?: false | true | 'basic' | 'advanced'
}

async function tavilyFetch<T>(path: string, body: Record<string, unknown>, timeoutMs = TAVILY_TIMEOUT): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${TAVILY_BASE}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getApiKey()}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Tavily ${path} ${res.status}: ${text.slice(0, 300)}`)
    }

    return await res.json() as T
  } finally {
    clearTimeout(timeout)
  }
}

function normalizeImages(value: unknown): Array<{ url: string; description?: string | null }> {
  if (!Array.isArray(value)) return []
  const images: Array<{ url: string; description?: string | null }> = []
  for (const item of value) {
    if (typeof item === 'string') {
      images.push({ url: item, description: null })
      continue
    }
    if (!item || typeof item !== 'object') continue
    const record = item as Record<string, unknown>
    const url = typeof record.url === 'string' ? record.url : ''
    if (!url) continue
    images.push({
      url,
      description: typeof record.description === 'string' ? record.description : null,
    })
  }
  return images
}

function tavilyDepth(depth: TavilySearchOptions['searchDepth']): 'basic' | 'advanced' {
  return depth === 'advanced' ? 'advanced' : 'basic'
}

export function buildTavilySearchBody(query: string, options: TavilySearchOptions = {}): Record<string, unknown> {
  return {
    query,
    search_depth: tavilyDepth(options.searchDepth ?? 'advanced'),
    chunks_per_source: Math.min(Math.max(options.chunksPerSource ?? 3, 1), 5),
    max_results: options.maxResults ?? 10,
    topic: options.topic ?? 'general',
    ...(options.timeRange ? { time_range: options.timeRange } : {}),
    ...(options.startDate ? { start_date: options.startDate } : {}),
    ...(options.endDate ? { end_date: options.endDate } : {}),
    ...(options.includeDomains?.length ? { include_domains: options.includeDomains } : {}),
    ...(options.excludeDomains?.length ? { exclude_domains: options.excludeDomains } : {}),
    ...(options.country ? { country: options.country } : {}),
    include_answer: options.includeAnswer ?? 'advanced',
    include_raw_content: options.includeRawContent ?? false,
    include_images: options.includeImages ?? true,
    include_image_descriptions: true,
    include_favicon: true,
  }
}

export async function searchTavilyNews(accountName: string): Promise<TavilyNewsResponse> {
  return searchTavilyQuery(`${accountName} latest news`, {
    topic: 'news',
    timeRange: 'month',
    includeImages: true,
  })
}

export async function searchTavilyQuery(query: string, options: TavilySearchOptions = {}): Promise<TavilyNewsResponse> {
  try {
    const data = await tavilyFetch<Record<string, unknown>>(
      '/search',
      buildTavilySearchBody(query, options),
      options.searchDepth === 'advanced' ? TAVILY_DEEP_TIMEOUT : TAVILY_TIMEOUT,
    )

    return {
      answer: typeof data.answer === 'string' ? data.answer : null,
      images: normalizeImages(data.images),
      results: Array.isArray(data.results)
        ? data.results.map((r: Record<string, unknown>) => ({
          url: r.url as string,
          title: (r.title as string) || '',
          content: (r.content as string) || '',
          rawContent: typeof r.raw_content === 'string' ? r.raw_content.slice(0, 20_000) : null,
          publishedDate: (r.published_date as string) || null,
          score: (r.score as number) || 0,
          faviconUrl: (r.favicon as string) || null,
          images: normalizeImages(r.images),
        }))
        : [],
    }
  } catch (err) {
    console.error('[tavily] search error:', err)
    return { answer: null, images: [], results: [] }
  }
}

export async function tavilyExtract(urls: string[], options: {
  extractDepth?: 'basic' | 'advanced'
  format?: 'markdown' | 'text'
  includeImages?: boolean
} = {}): Promise<TavilyExtractResult[]> {
  if (!urls.length) return []

  try {
    const data = await tavilyFetch<Record<string, unknown>>('/extract', {
      urls: urls.slice(0, 20),
      extract_depth: options.extractDepth ?? 'advanced',
      format: options.format ?? 'markdown',
      include_images: options.includeImages ?? false,
    }, TAVILY_DEEP_TIMEOUT)

    return Array.isArray(data.results)
      ? data.results.map((result: Record<string, unknown>) => ({
        url: result.url as string,
        rawContent: String(result.raw_content ?? '').slice(0, 20_000),
        images: normalizeImages(result.images),
      }))
      : []
  } catch (err) {
    console.error('[tavily] extract error:', err)
    return []
  }
}

export async function extractTavilySite(url: string): Promise<TavilyExtractResult | null> {
  const [result] = await tavilyExtract([url], { extractDepth: 'advanced', format: 'markdown' })
  return result ?? null
}

export async function tavilyMap(url: string, options: {
  instructions?: string
} = {}): Promise<string[]> {
  try {
    const data = await tavilyFetch<Record<string, unknown>>('/map', {
      url,
      ...(options.instructions ? { instructions: options.instructions } : {}),
    })
    return Array.isArray(data.results) ? data.results.filter((item): item is string => typeof item === 'string') : []
  } catch (err) {
    console.error('[tavily] map error:', err)
    return []
  }
}

export async function tavilyCrawl(url: string, options: {
  instructions?: string
  maxDepth?: number
  maxBreadth?: number
  extractDepth?: 'basic' | 'advanced'
} = {}): Promise<TavilyExtractResult[]> {
  if (!intelligenceFlags.tavilyCrawl()) return []

  try {
    const data = await tavilyFetch<Record<string, unknown>>('/crawl', {
      url,
      instructions: options.instructions,
      max_depth: options.maxDepth ?? 2,
      max_breadth: options.maxBreadth ?? 8,
      extract_depth: options.extractDepth ?? 'advanced',
      include_favicon: true,
    }, TAVILY_DEEP_TIMEOUT)

    const results = Array.isArray(data.results) ? data.results : []
    return results.map((result: Record<string, unknown>) => ({
      url: result.url as string,
      rawContent: String(result.raw_content ?? result.content ?? '').slice(0, 20_000),
      images: normalizeImages(result.images),
    }))
  } catch (err) {
    console.error('[tavily] crawl error:', err)
    return []
  }
}

export async function tavilyResearch(request: Record<string, unknown>): Promise<Record<string, unknown> | null> {
  try {
    return await tavilyFetch<Record<string, unknown>>('/research', request, 120_000)
  } catch (err) {
    console.error('[tavily] research error:', err)
    return null
  }
}
