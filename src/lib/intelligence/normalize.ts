/* ── Normalize — Merge Exa + Tavily results into unified evidence ── */

import type { BriefSource, NormalizedEvidence } from './types'
import type { ExaSearchResult, ExaSnapshotResult } from './providers/exa'
import type { TavilySearchResult } from './providers/tavily'

let sourceCounter = 0

function nextId(): string {
  sourceCounter++
  return `s${sourceCounter}`
}

export function resetSourceCounter(): void {
  sourceCounter = 0
}

function domainFrom(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function normalizeExaSnapshot(
  result: ExaSnapshotResult | null
): { source: BriefSource | null; evidence: NormalizedEvidence | null } {
  if (!result || !result.sourceUrl) return { source: null, evidence: null }

  const id = nextId()
  return {
    source: {
      id,
      url: result.sourceUrl,
      title: result.name,
      domain: domainFrom(result.sourceUrl),
      publishedAt: null,
      provider: 'exa',
      snippet: result.description.slice(0, 300),
    },
    evidence: {
      id,
      text: result.description,
      url: result.sourceUrl,
      title: result.name,
      domain: domainFrom(result.sourceUrl),
      publishedAt: null,
      provider: 'exa',
    },
  }
}

export function normalizeExaResults(
  results: ExaSearchResult[]
): { sources: BriefSource[]; evidence: NormalizedEvidence[] } {
  const sources: BriefSource[] = []
  const evidence: NormalizedEvidence[] = []

  for (const r of results) {
    if (!r.url) continue
    const id = nextId()
    const text = r.summary || r.highlights.join(' ') || r.text || ''
    if (!text.trim()) continue

    sources.push({
      id,
      url: r.url,
      title: r.title,
      domain: domainFrom(r.url),
      publishedAt: r.publishedDate,
      provider: 'exa',
      snippet: text.slice(0, 300),
    })

    evidence.push({
      id,
      text,
      url: r.url,
      title: r.title,
      domain: domainFrom(r.url),
      publishedAt: r.publishedDate,
      provider: 'exa',
    })
  }

  return { sources, evidence }
}

export function normalizeTavilyResults(
  results: TavilySearchResult[]
): { sources: BriefSource[]; evidence: NormalizedEvidence[] } {
  const sources: BriefSource[] = []
  const evidence: NormalizedEvidence[] = []

  for (const r of results) {
    if (!r.url) continue
    const id = nextId()
    if (!r.content.trim()) continue

    sources.push({
      id,
      url: r.url,
      title: r.title,
      domain: domainFrom(r.url),
      publishedAt: r.publishedDate,
      provider: 'tavily',
      snippet: r.content.slice(0, 300),
    })

    evidence.push({
      id,
      text: r.content,
      url: r.url,
      title: r.title,
      domain: domainFrom(r.url),
      publishedAt: r.publishedDate,
      provider: 'tavily',
    })
  }

  return { sources, evidence }
}

export function deduplicateSources(sources: BriefSource[]): BriefSource[] {
  const seen = new Map<string, BriefSource>()
  for (const s of sources) {
    const key = s.url.replace(/\/$/, '').toLowerCase()
    if (!seen.has(key)) {
      seen.set(key, s)
    }
  }
  return Array.from(seen.values())
}

export function buildEvidenceText(evidence: NormalizedEvidence[]): string {
  return evidence
    .map((e) => `[${e.id}] (${e.domain}) ${e.title}: ${e.text}`)
    .join('\n\n')
}
