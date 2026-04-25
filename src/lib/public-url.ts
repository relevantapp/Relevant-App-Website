const DEFAULT_PUBLIC_BASE_URL = 'https://www.getrelevantapp.com'

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

export function getPublicBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (configured) return trimTrailingSlash(configured)

  return DEFAULT_PUBLIC_BASE_URL
}

export function buildIntelligenceShareUrl(slug: string): string {
  return `${getPublicBaseUrl()}/intelligence/share/${encodeURIComponent(slug)}`
}
