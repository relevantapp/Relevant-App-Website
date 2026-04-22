import type { EvidenceItem, PriorMemorySummary } from '../contracts'

export function buildDeltaSummary(args: {
  priorMemory: PriorMemorySummary
  evidence: EvidenceItem[]
}): PriorMemorySummary {
  if (!args.priorMemory.hasPriorCoverage || !args.priorMemory.lastMentionedAt) {
    return args.priorMemory
  }

  const lastSeen = Date.parse(args.priorMemory.lastMentionedAt)
  const newerItems = args.evidence.filter((item) => {
    const published = item.publishedAt ? Date.parse(item.publishedAt) : Date.parse(item.capturedAt)
    return !Number.isNaN(published) && published > lastSeen
  })

  return {
    ...args.priorMemory,
    changedSinceThen: newerItems
      .map((item) => item.facts[0] || item.excerpt)
      .filter(Boolean)
      .slice(0, 5),
  }
}
