/* ── Evidence Ranker — Score, rank, and trim evidence ─────── */

import type { NormalizedEvidence } from './contracts'

interface RankedEvidence extends NormalizedEvidence {
  score: number
}

interface RankOptions {
  topN: number
  queryTerms: string[]
  recencyWeight?: number
  authorityWeight?: number
  matchWeight?: number
}

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

function domainAuthority(domain: string): number {
  const clean = domain.replace(/^www\./, '')
  if (HIGH_AUTHORITY_DOMAINS.has(clean)) return 1.0
  if (MEDIUM_AUTHORITY_DOMAINS.has(clean)) return 0.7
  if (clean.endsWith('.gov') || clean.endsWith('.edu')) return 0.9
  return 0.4
}

function recencyScore(publishedAt: string | null): number {
  if (!publishedAt) return 0.3
  const ageMs = Date.now() - new Date(publishedAt).getTime()
  const ageDays = ageMs / (1000 * 60 * 60 * 24)
  if (ageDays <= 7) return 1.0
  if (ageDays <= 30) return 0.8
  if (ageDays <= 90) return 0.5
  return 0.2
}

function queryMatchScore(text: string, title: string, queryTerms: string[]): number {
  if (queryTerms.length === 0) return 0.5
  const combined = `${title} ${text}`.toLowerCase()
  let matches = 0
  for (const term of queryTerms) {
    if (combined.includes(term.toLowerCase())) matches++
  }
  return matches / queryTerms.length
}

export function rankEvidence(
  evidence: NormalizedEvidence[],
  options: RankOptions
): NormalizedEvidence[] {
  const {
    topN,
    queryTerms,
    recencyWeight = 0.3,
    authorityWeight = 0.3,
    matchWeight = 0.4,
  } = options

  const scored: RankedEvidence[] = evidence.map((e) => {
    const recency = recencyScore(e.publishedAt)
    const authority = domainAuthority(e.domain)
    const match = queryMatchScore(e.text, e.title, queryTerms)
    const score = recency * recencyWeight + authority * authorityWeight + match * matchWeight
    return { ...e, score }
  })

  // Deduplicate by domain — keep highest scored per domain
  const byDomain = new Map<string, RankedEvidence>()
  for (const item of scored) {
    const existing = byDomain.get(item.domain)
    if (!existing || item.score > existing.score) {
      byDomain.set(item.domain, item)
    }
  }

  const deduped = Array.from(byDomain.values())
  deduped.sort((a, b) => b.score - a.score)
  return deduped.slice(0, topN)
}

export function extractQueryTerms(text: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'shall', 'this', 'that', 'these',
    'those', 'it', 'its', 'what', 'which', 'who', 'whom', 'how', 'vs',
  ])
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w))
    .slice(0, 20)
}
