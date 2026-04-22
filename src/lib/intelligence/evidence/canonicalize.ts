import { createHash } from 'crypto'

const TRACKING_PARAMS = new Set(['fbclid', 'gclid', 'msclkid', 'ref'])

export function canonicalizeUrl(rawUrl: string | null): string | null {
  if (!rawUrl) return null
  try {
    const url = new URL(rawUrl)
    url.hash = ''
    url.hostname = url.hostname
      .toLowerCase()
      .replace(/^www\./, '')
      .replace(/^m\./, '')
      .replace(/^amp\./, '')

    for (const key of Array.from(url.searchParams.keys())) {
      if (key.startsWith('utm_') || TRACKING_PARAMS.has(key)) {
        url.searchParams.delete(key)
      }
    }

    const serialized = url.toString()
    return serialized.endsWith('/') ? serialized.slice(0, -1) : serialized
  } catch {
    return rawUrl.trim().toLowerCase() || null
  }
}

export function contentFingerprint(text: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 2000)
  return createHash('sha256').update(normalized).digest('hex')
}
