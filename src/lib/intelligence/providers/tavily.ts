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
}

export interface TavilyNewsResponse {
  answer: string | null
  results: TavilySearchResult[]
}

export interface TavilyExtractResult {
  url: string
  rawContent: string
}

export async function searchTavilyNews(
  accountName: string
): Promise<TavilyNewsResponse> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TAVILY_TIMEOUT)

  try {
    const res = await fetch(`${TAVILY_BASE}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: getApiKey(),
        query: `${accountName} latest news`,
        search_depth: 'advanced',
        max_results: 10,
        include_answer: true,
        include_raw_content: false,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) {
      console.error('[tavily] news search failed:', res.status)
      return { answer: null, results: [] }
    }

    const data = await res.json()
    return {
      answer: data.answer || null,
      results: (data.results || []).map((r: Record<string, unknown>) => ({
        url: r.url as string,
        title: (r.title as string) || '',
        content: (r.content as string) || '',
        publishedDate: (r.published_date as string) || null,
        score: (r.score as number) || 0,
      })),
    }
  } catch (err) {
    clearTimeout(timeout)
    console.error('[tavily] news search error:', err)
    return { answer: null, results: [] }
  }
}

export async function extractTavilySite(
  url: string
): Promise<TavilyExtractResult | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TAVILY_TIMEOUT)

  try {
    const res = await fetch(`${TAVILY_BASE}/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: getApiKey(),
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
