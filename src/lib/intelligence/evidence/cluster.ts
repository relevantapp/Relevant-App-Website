import type { EvidenceItem, EvidencePack } from '../contracts'

function normalizeWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 3),
  )
}

function jaccard(a: Set<string>, b: Set<string>): number {
  const intersection = Array.from(a).filter((item) => b.has(item)).length
  const union = new Set([...Array.from(a), ...Array.from(b)]).size
  return union === 0 ? 0 : intersection / union
}

function dayBucket(date: string | null): string {
  const parsed = date ? new Date(date) : new Date()
  if (Number.isNaN(parsed.getTime())) return 'unknown'
  const bucketStart = new Date(parsed)
  bucketStart.setUTCDate(bucketStart.getUTCDate() - (bucketStart.getUTCDate() % 3))
  return bucketStart.toISOString().slice(0, 10)
}

export function clusterEvidence(items: EvidenceItem[]): EvidencePack['clusters'] {
  const clusters: EvidencePack['clusters'] = []

  for (const item of items) {
    const itemWords = normalizeWords(`${item.title} ${item.excerpt}`)
    const bucket = dayBucket(item.publishedAt)
    const existing = clusters.find((cluster) => {
      const firstItem = items.find((candidate) => candidate.id === cluster.evidenceIds[0])
      if (!firstItem || dayBucket(firstItem.publishedAt) !== bucket) return false
      return jaccard(itemWords, normalizeWords(`${firstItem.title} ${firstItem.excerpt}`)) >= 0.28
    })

    if (existing) {
      existing.evidenceIds.push(item.id)
      continue
    }

    clusters.push({
      clusterId: `cluster_${clusters.length + 1}`,
      label: item.title.slice(0, 120),
      whatChanged: item.facts[0] ?? item.excerpt.slice(0, 180),
      evidenceIds: [item.id],
    })
  }

  return clusters
}

export function detectContradictions(items: EvidenceItem[]): EvidencePack['contradictions'] {
  const contradictions: EvidencePack['contradictions'] = []
  const headcountFacts = items.filter((item) => /\b(headcount|employees|employee count)\b/i.test(item.excerpt))
  const numbers = headcountFacts
    .map((item) => ({ item, match: item.excerpt.match(/\b\d{2,6}(?:,\d{3})?\b/)?.[0] }))
    .filter((entry): entry is { item: EvidenceItem; match: string } => Boolean(entry.match))

  if (numbers.length >= 2 && new Set(numbers.map((entry) => entry.match.replace(',', ''))).size > 1) {
    contradictions.push({
      issue: 'Sources disagree on headcount or employee count.',
      evidenceIds: numbers.map((entry) => entry.item.id),
    })
  }

  return contradictions
}
