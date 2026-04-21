/* ── Tavily Provider — Real-time news + website extraction ──── */

const TAVILY_BASE = 'https://api.tavily.com'
const TAVILY_TIMEOUT = 10_000

function getApiKey(): string {
  const key = process.env.TAVILY_API_KEY
  if (!key) throw new Error('TAVILY_API_KEY not configured')
  return key
}

export interface TavilySearchResult {
  url: string
  title: string
  content: string
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
}

export async function searchTavilyNews(
  accountName: string
): Promise<TavilyNewsResponse> {
  return searchTavilyQuery(`${accountName} latest news`, {
    topic: 'news',
    timeRange: 'month',
    includeImages: true,
  })
}

export async function searchTavilyQuery(
  query: string,
  options: {
    topic?: 'general' | 'news' | 'finance'
    timeRange?: 'day' | 'week' | 'month' | 'year'
    maxResults?: number
    includeImages?: boolean
    includeDomains?: string[]
    excludeDomains?: string[]
    country?: string
  } = {}
): Promise<TavilyNewsResponse> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TAVILY_TIMEOUT)

  try {
    const res = await fetch(`${TAVILY_BASE}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getApiKey()}`,
      },
      body: JSON.stringify({
        query,
        search_depth: 'advanced',
        chunks_per_source: 3,
        max_results: options.maxResults ?? 10,
        topic: options.topic ?? 'general',
        ...(options.timeRange ? { time_range: options.timeRange } : {}),
        ...(options.includeDomains?.length ? { include_domains: options.includeDomains } : {}),
        ...(options.excludeDomains?.length ? { exclude_domains: options.excludeDomains } : {}),
        ...(options.country ? { country: options.country } : {}),
        include_answer: 'advanced',
        include_raw_content: false,
        include_images: options.includeImages ?? true,
        include_image_descriptions: true,
        include_favicon: true,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) {
      console.error('[tavily] news search failed:', res.status)
      return { answer: null, images: [], results: [] }
    }

    const data = await res.json()
    return {
      answer: data.answer || null,
      images: normalizeImages(data.images),
      results: (data.results || []).map((r: Record<string, unknown>) => ({
        url: r.url as string,
        title: (r.title as string) || '',
        content: (r.content as string) || '',
        publishedDate: (r.published_date as string) || null,
        score: (r.score as number) || 0,
        faviconUrl: (r.favicon as string) || null,
        images: normalizeImages(r.images),
      })),
    }
  } catch (err) {
    clearTimeout(timeout)
    console.error('[tavily] news search error:', err)
    return { answer: null, images: [], results: [] }
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

export async function extractTavilySite(
  url: string
): Promise<TavilyExtractResult | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TAVILY_TIMEOUT)

  try {
    const res = await fetch(`${TAVILY_BASE}/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getApiKey()}`,
      },
      body: JSON.stringify({
        urls: [url],
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) {
      console.error('[tavily] extract failed:', res.status)
      return null
    }

    const data = await res.json()
    const results = data.results || []
    if (!results.length) return null

    return {
      url: results[0].url,
      rawContent: (results[0].raw_content || '').slice(0, 5000),
    }
  } catch (err) {
    clearTimeout(timeout)
    console.error('[tavily] extract error:', err)
    return null
  }
}
