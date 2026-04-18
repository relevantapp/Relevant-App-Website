export type EntityType = 'company' | 'person' | 'topic' | 'location'
export type LensKey = 'founder' | 'product' | 'gtm' | 'strategy' | 'investor'

export interface DossierSourceRef {
  articleId: string
  url: string
  title: string
  sourceName: string | null
  sourceDomain: string
  publishedAt: string
  sourceTier: 'hot' | 'archive'
}

export interface DossierResponse {
  entity: {
    query: string
    normalizedQuery: string
    entityType: EntityType
    lensKey: LensKey
    lookbackDays: number
  }
  synthesis: {
    headline: string
    dek: string
    bottomLine: string
    whyNow: string
    whyItMatters: string[]
    whatToWatch: string[]
    opportunityLabel: string | null
    riskLabel: string | null
    tensionLabel: string | null
    proofPoints: Array<{
      label: string
      detail: string
      sourceIds: string[]
    }>
    suggestedQuestions: string[]
  }
  timeline: Array<{
    id: string
    headline: string
    summary: string | null
    publishedAt: string
    sourceCount: number
    sourceDomains: string[]
    sourceTierMix: Array<'hot' | 'archive'>
    sources: DossierSourceRef[]
    matchScore: number
  }>
  proofSources: Record<string, DossierSourceRef>
  status: {
    degraded: boolean
    reasons: string[]
    coverageBand: 'none' | 'thin' | 'partial' | 'strong'
    historyState: 'not_started' | 'processing' | 'failed' | 'ready'
    cache: {
      hit: boolean
      ageMinutes: number | null
      expiresAt: string | null
    }
    coverage: {
      totalArticles: number
      hotArticles: number
      archiveArticles: number
      uniqueSources: number
      latestPublishedAt: string | null
      earliestPublishedAt: string | null
    }
    index: {
      lastIndexedAt: string | null
      completedFiles: number
      failedFiles: number
      processingFiles: number
      lastCompletedAt: string | null
      historyReady: boolean
    }
  }
  generatedAt: string
}

export const ENTITY_OPTIONS: Array<{ key: EntityType; label: string }> = [
  { key: 'company', label: 'Company' },
  { key: 'person', label: 'Person' },
  { key: 'topic', label: 'Topic' },
  { key: 'location', label: 'Location' },
]

export const LOOKBACK_OPTIONS: Array<{ days: number; label: string }> = [
  { days: 30, label: '30 days' },
  { days: 60, label: '60 days' },
  { days: 90, label: '90 days' },
]

export const LENS_OPTIONS: Array<{ key: LensKey; label: string; blurb: string }> = [
  { key: 'founder', label: 'Executive', blurb: 'Leadership priorities, decisions, what needs attention' },
  { key: 'product', label: 'Product', blurb: 'Roadmap impact, platform shifts, customer signals' },
  { key: 'gtm', label: 'Sales & Marketing', blurb: 'Competitive moves, positioning, pipeline impact' },
  { key: 'strategy', label: 'Strategy & Ops', blurb: 'Market structure, trends, long-range bets' },
  { key: 'investor', label: 'Board & Investors', blurb: 'Business quality, growth signals, risk factors' },
]

export type ResearchPurpose = 'meeting' | 'competitive' | 'diligence' | 'explore'

export const PURPOSE_OPTIONS: Array<{ key: ResearchPurpose; label: string; placeholder: string }> = [
  { key: 'meeting', label: '🤝 Meeting prep', placeholder: 'Who are you meeting? What do you need to know going in?' },
  { key: 'competitive', label: '⚔️ Competitive intel', placeholder: 'What are you competing on? What would change your strategy?' },
  { key: 'diligence', label: '🔍 Due diligence', placeholder: 'What deal or decision does this inform?' },
  { key: 'explore', label: '🧭 Explore', placeholder: 'What are you trying to understand or decide?' },
]

export const LENS_LABELS: Record<LensKey, {
  whyItMatters: string
  proofPoints: string
  whatToWatch: string
  questions: string
  bottomLine: string
}> = {
  founder: {
    bottomLine: 'The Executive Summary',
    whyItMatters: 'What This Means for Your Decisions',
    proofPoints: 'Evidence',
    whatToWatch: 'Monitor These',
    questions: 'Questions for the Room',
  },
  product: {
    bottomLine: 'Product Impact',
    whyItMatters: 'How This Affects Your Roadmap',
    proofPoints: 'Signals & Data',
    whatToWatch: 'Track These Shifts',
    questions: 'Questions for Your Team',
  },
  gtm: {
    bottomLine: 'Market Impact',
    whyItMatters: 'How This Changes Your Positioning',
    proofPoints: 'Competitive Evidence',
    whatToWatch: 'Moves to Watch',
    questions: 'Questions for Prospects',
  },
  strategy: {
    bottomLine: 'Strategic Read',
    whyItMatters: 'What This Means for the Market',
    proofPoints: 'Supporting Evidence',
    whatToWatch: 'Structural Shifts to Track',
    questions: 'Questions to Pressure-Test',
  },
  investor: {
    bottomLine: 'Investment Thesis Impact',
    whyItMatters: 'What This Means for the Portfolio',
    proofPoints: 'Data Points',
    whatToWatch: 'Risk & Signal Flags',
    questions: 'Questions for Management',
  },
}

export const COVERAGE_BADGE: Record<string, { label: string; color: string }> = {
  strong: { label: 'Strong Coverage', color: 'text-accent-teal bg-accent-teal/10 border-accent-teal/20' },
  partial: { label: 'Partial Coverage', color: 'text-accent-amber bg-accent-amber/10 border-accent-amber/20' },
  thin: { label: 'Thin Coverage', color: 'text-accent-amber bg-accent-amber/10 border-accent-amber/20' },
  none: { label: 'No Coverage', color: 'text-accent-coral bg-accent-coral/10 border-accent-coral/20' },
}

export const SUGGESTED_QUERIES: Array<{ label: string; entityType: EntityType }> = [
  { label: 'OpenAI', entityType: 'company' },
  { label: 'Stripe', entityType: 'company' },
  { label: 'Jensen Huang', entityType: 'person' },
  { label: 'AI regulation', entityType: 'topic' },
  { label: 'Climate tech', entityType: 'topic' },
  { label: 'Figma', entityType: 'company' },
]

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

export function safeUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : null
  } catch {
    return null
  }
}
