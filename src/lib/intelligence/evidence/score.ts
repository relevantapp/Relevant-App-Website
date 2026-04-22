import type { EvidenceItem, NormalizedEvidence, SourceRole } from '../contracts'
import { canonicalizeUrl, contentFingerprint } from './canonicalize'

const HIGH_AUTHORITY_DOMAINS = new Set([
  'reuters.com', 'bloomberg.com', 'wsj.com', 'ft.com', 'nytimes.com',
  'techcrunch.com', 'theverge.com', 'wired.com', 'arstechnica.com',
  'forbes.com', 'fortune.com', 'businessinsider.com', 'cnbc.com',
  'hbr.org', 'mckinsey.com', 'bain.com', 'bcg.com',
  'sec.gov', 'crunchbase.com', 'pitchbook.com',
  'linkedin.com', 'github.com',
])

const MEDIUM_AUTHORITY_DOMAINS = new Set([
  'medium.com', 'substack.com', 'wikipedia.org',
  'prnewswire.com', 'businesswire.com', 'globenewswire.com',
])

export function authorityScore(domain: string | null): number {
  if (!domain) return 0.2
  const clean = domain.replace(/^www\./, '').toLowerCase()
  if (HIGH_AUTHORITY_DOMAINS.has(clean)) return 1.0
  if (MEDIUM_AUTHORITY_DOMAINS.has(clean)) return 0.7
  if (clean.endsWith('.gov') || clean.endsWith('.edu')) return 0.9
  return 0.4
}

export function freshnessScore(publishedAt: string | null): number {
  if (!publishedAt) return 0.3
  const published = Date.parse(publishedAt)
  if (Number.isNaN(published)) return 0.3
  const ageDays = (Date.now() - published) / 86_400_000
  if (ageDays <= 7) return 1.0
  if (ageDays <= 30) return 0.8
  if (ageDays <= 90) return 0.55
  if (ageDays <= 365) return 0.35
  return 0.2
}

export function relevanceScore(text: string, title: string, queryTerms: string[]): number {
  if (!queryTerms.length) return 0.5
  const combined = `${title} ${text}`.toLowerCase()
  const matches = queryTerms.filter((term) => combined.includes(term.toLowerCase())).length
  return matches / queryTerms.length
}

export function sourceRolePriority(role?: string): number {
  const priorities: Record<string, number> = {
    primary: 10,
    internal_memory: 9,
    fresh_news: 8,
    financial: 8,
    market_data: 7,
    counter_evidence: 7,
    people: 6,
    customer_voice: 5,
    gap_fill: 3,
  }
  return priorities[role ?? ''] ?? 4
}

export function scoreEvidenceItem(item: EvidenceItem, queryTerms: string[] = []): number {
  const computedRelevance = relevanceScore(item.excerpt, item.title, queryTerms)
  const relevance = queryTerms.length > 0
    ? (item.quality.relevance > 0
      ? (item.quality.relevance + computedRelevance) / 2
      : computedRelevance)
    : item.quality.relevance || computedRelevance
  return (
    item.quality.authority * 0.25 +
    item.quality.freshness * 0.2 +
    relevance * 0.35 +
    item.quality.independence * 0.1 +
    (item.quality.primarySource ? 0.1 : 0)
  )
}

export function normalizedEvidenceToEvidenceItem(item: NormalizedEvidence): EvidenceItem {
  const sourceRole = (item.sourceRole as SourceRole | undefined) ?? 'fresh_news'
  return {
    id: item.id,
    sourceId: item.id,
    provider: item.provider,
    laneId: sourceRole,
    sourceRole,
    title: item.title,
    url: item.url,
    domain: item.domain,
    publishedAt: item.publishedAt,
    capturedAt: new Date().toISOString(),
    excerpt: item.text,
    facts: [],
    entities: [],
    topicKeys: [],
    quality: {
      authority: authorityScore(item.domain),
      freshness: freshnessScore(item.publishedAt),
      relevance: 0.5,
      independence: 0.6,
      primarySource: sourceRole === 'primary',
    },
  }
}

export function rankEvidenceItems(items: EvidenceItem[], options: {
  topN: number
  queryTerms: string[]
}): EvidenceItem[] {
  const byIdentity = new Map<string, EvidenceItem>()
  for (const item of items) {
    const canonical = canonicalizeUrl(item.url)
    const key = canonical ?? contentFingerprint(item.excerpt)
    const existing = byIdentity.get(key)
    if (!existing || scoreEvidenceItem(item, options.queryTerms) > scoreEvidenceItem(existing, options.queryTerms)) {
      byIdentity.set(key, item)
    }
  }

  return Array.from(byIdentity.values())
    .sort((a, b) => {
      const roleDelta = sourceRolePriority(b.sourceRole) - sourceRolePriority(a.sourceRole)
      if (roleDelta !== 0) return roleDelta
      return scoreEvidenceItem(b, options.queryTerms) - scoreEvidenceItem(a, options.queryTerms)
    })
    .slice(0, options.topN)
}

export function rankNormalizedEvidence(items: NormalizedEvidence[], options: {
  topN: number
  queryTerms: string[]
}): NormalizedEvidence[] {
  const normalized = items.map(normalizedEvidenceToEvidenceItem)
  const byId = new Map(items.map((item) => [item.id, item]))
  return rankEvidenceItems(normalized, options)
    .map((item) => byId.get(item.id))
    .filter((item): item is NormalizedEvidence => Boolean(item))
}
