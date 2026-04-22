import { createHash } from 'crypto'

function normalizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeValue).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined && item !== null && item !== '')
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, normalizeValue(item)]),
    )
  }
  if (typeof value === 'string') return value.trim().replace(/\s+/g, ' ').toLowerCase()
  return value
}

export function stableIntelligenceFingerprint(input: unknown): string {
  const normalized = JSON.stringify(normalizeValue(input))
  return createHash('sha256').update(normalized).digest('hex')
}
