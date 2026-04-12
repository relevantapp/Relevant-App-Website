'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getValidAccessToken } from '@/lib/supabase'
import {
  Search,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Eye,
  Loader2,
  ChevronDown,
  Briefcase,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react'

/* ── Types ─────────────────────────────────────────────────────── */

type EntityType = 'company' | 'person' | 'topic' | 'location'
type LensKey = 'founder' | 'product' | 'gtm' | 'strategy' | 'investor'

interface DossierSourceRef {
  articleId: string
  url: string
  title: string
  sourceName: string | null
  sourceDomain: string
  publishedAt: string
  sourceTier: 'hot' | 'archive'
}

interface DossierResponse {
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

/* ── Constants ─────────────────────────────────────────────────── */

const ENTITY_OPTIONS: Array<{ key: EntityType; label: string }> = [
  { key: 'company', label: 'Company' },
  { key: 'person', label: 'Person' },
  { key: 'topic', label: 'Topic' },
  { key: 'location', label: 'Location' },
]

const LOOKBACK_OPTIONS: Array<{ days: number; label: string }> = [
  { days: 30, label: '30 days' },
  { days: 60, label: '60 days' },
  { days: 90, label: '90 days' },
]

const LENS_OPTIONS: Array<{ key: LensKey; label: string; blurb: string }> = [
  { key: 'founder', label: 'Executive', blurb: 'Leadership priorities, decisions, what needs attention' },
  { key: 'product', label: 'Product', blurb: 'Roadmap impact, platform shifts, customer signals' },
  { key: 'gtm', label: 'Sales & Marketing', blurb: 'Competitive moves, positioning, pipeline impact' },
  { key: 'strategy', label: 'Strategy & Ops', blurb: 'Market structure, trends, long-range bets' },
  { key: 'investor', label: 'Board & Investors', blurb: 'Business quality, growth signals, risk factors' },
]

const COVERAGE_BADGE: Record<string, { label: string; color: string }> = {
  strong: { label: 'Strong Coverage', color: 'text-accent-teal bg-accent-teal/10 border-accent-teal/20' },
  partial: { label: 'Partial Coverage', color: 'text-accent-amber bg-accent-amber/10 border-accent-amber/20' },
  thin: { label: 'Thin Coverage', color: 'text-accent-amber bg-accent-amber/10 border-accent-amber/20' },
  none: { label: 'No Coverage', color: 'text-accent-coral bg-accent-coral/10 border-accent-coral/20' },
}

/* ── Helpers ────────────────────────────────────────────────────── */

function formatDate(iso: string): string {
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

function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

function safeUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : null
  } catch {
    return null
  }
}

/* ── Component ─────────────────────────────────────────────────── */

export default function MeetingPrepPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  const [query, setQuery] = useState('')
  const [entityType, setEntityType] = useState<EntityType>('company')
  const [lensKey, setLensKey] = useState<LensKey>('founder')
  const [lookbackDays, setLookbackDays] = useState(90)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dossier, setDossier] = useState<DossierResponse | null>(null)
  const [lensOpen, setLensOpen] = useState(false)
  const [meetingContext, setMeetingContext] = useState('')
  const [loadingStep, setLoadingStep] = useState(0)
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)
  const loadingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  /** Auto-detect entity type from query text. */
  const inferEntityType = useCallback((text: string): EntityType | null => {
    const trimmed = text.trim()
    if (!trimmed || trimmed.length < 3) return null
    const words = trimmed.split(/\s+/)
    // 2-3 title-case words with no common company suffixes → likely a person
    if (
      words.length >= 2 &&
      words.length <= 4 &&
      words.every((w) => /^[A-Z]/.test(w)) &&
      !/(inc|corp|llc|ltd|co|group|labs|ai)$/i.test(words[words.length - 1])
    ) {
      return 'person'
    }
    return null
  }, [])

  const handleQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setQuery(value)
      const inferred = inferEntityType(value)
      if (inferred && entityType !== inferred) {
        setEntityType(inferred)
      }
    },
    [entityType, inferEntityType]
  )

  const fetchDossier = useCallback(
    async (forceRefresh = false) => {
      if (!query.trim()) return

      setLoading(true)
      setError(null)
      setFeedback(null)
      setCopied(false)
      setLoadingStep(0)

      // Stepped loading progression
      const timer = setInterval(() => {
        setLoadingStep((prev) => Math.min(prev + 1, 2))
      }, 3000)
      loadingTimerRef.current = timer

      try {
        const token = await getValidAccessToken(180)
        if (!token) {
          setError('Please sign in to use Meeting Prep.')
          setLoading(false)
          return
        }

        const res = await fetch('/api/dossier', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: query.trim(),
            entityType,
            lensKey,
            lookbackDays,
            forceRefresh,
            meetingContext: meetingContext.trim() || undefined,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Failed to build briefing')
          setLoading(false)
          return
        }

        setDossier(data.dossier ?? data)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          setError('Request timed out. Try a shorter time range.')
        } else {
          setError('Connection error. Please check your network and try again.')
        }
      } finally {
        if (loadingTimerRef.current) clearInterval(loadingTimerRef.current)
        loadingTimerRef.current = null
        setLoading(false)
      }
    },
    [query, entityType, lensKey, lookbackDays, meetingContext]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchDossier(false)
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) clearInterval(loadingTimerRef.current)
    }
  }, [])

  const copyToClipboard = useCallback(() => {
    if (!dossier) return
    const s = dossier.synthesis
    const lines: string[] = [
      `# ${s.headline}`,
      '',
      s.dek,
      '',
      `## Bottom Line`,
      s.bottomLine,
      '',
    ]
    if (s.whyNow) {
      lines.push(`## Why Now`, s.whyNow, '')
    }
    if (s.whyItMatters.length > 0) {
      lines.push(`## Why It Matters`)
      s.whyItMatters.forEach((item) => lines.push(`- ${item}`))
      lines.push('')
    }
    if (s.proofPoints.length > 0) {
      lines.push(`## Proof Points`)
      s.proofPoints.forEach((pp, i) => lines.push(`${i + 1}. **${pp.label}** — ${pp.detail}`))
      lines.push('')
    }
    if (s.whatToWatch.length > 0) {
      lines.push(`## What to Watch`)
      s.whatToWatch.forEach((item) => lines.push(`- ${item}`))
      lines.push('')
    }
    if (s.suggestedQuestions.length > 0) {
      lines.push(`## Questions to Ask`)
      s.suggestedQuestions.forEach((q) => lines.push(`- "${q}"`))
      lines.push('')
    }
    lines.push(`---`, `Generated ${new Date(dossier.generatedAt).toLocaleString()} · ${dossier.entity.lensKey} lens · ${dossier.entity.lookbackDays}-day lookback`)
    navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [dossier])

  const LOADING_STEPS = [
    'Searching for relevant signals...',
    'Analyzing coverage and context...',
    'Synthesizing your briefing...',
  ]

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <Briefcase className="h-12 w-12 text-[var(--text-muted)]" />
        <h2 className="text-xl font-semibold text-[var(--text)]">Sign in to use Meeting Prep</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Get AI-powered briefings on any company, person, or topic before your next meeting.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1200px] pb-16">
      {/* ── Search Section ────────────────────────────────────── */}
      {!dossier && !loading && (
        <div className="flex min-h-[55vh] flex-col items-center justify-center gap-8">
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold text-[var(--text)] sm:text-4xl">
              Meeting Prep
            </h1>
            <p className="mt-2 text-base text-[var(--text-muted)]">
              Get a briefing on any company, person, or topic — in seconds.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-5">
            {/* Entity type pills */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {ENTITY_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setEntityType(opt.key)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    entityType === opt.key
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-strong)] hover:text-[var(--text)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Lookback period pills */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="mr-2 text-xs uppercase tracking-[0.14em] text-[var(--text-soft)]">
                Lookback
              </span>
              {LOOKBACK_OPTIONS.map((opt) => (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => setLookbackDays(opt.days)}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                    lookbackDays === opt.days
                      ? 'bg-[var(--surface-strong)] text-[var(--text)]'
                      : 'text-[var(--text-soft)] hover:bg-[var(--surface)] hover:text-[var(--text-muted)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Search input */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                value={query}
                onChange={handleQueryChange}
                aria-label={`Search for a ${entityType} to research`}
                placeholder={
                  entityType === 'company'
                    ? 'e.g. Stripe, OpenAI, Figma...'
                    : entityType === 'person'
                      ? 'e.g. Sam Altman, Jensen Huang...'
                      : entityType === 'topic'
                        ? 'e.g. AI regulation, climate tech...'
                        : 'e.g. Silicon Valley, London...'
                }
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-3.5 pl-12 pr-4 text-base text-[var(--text)] placeholder:text-[var(--text-soft)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>

            {/* Lens selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLensOpen(!lensOpen)}
                className="flex w-full items-start justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)]"
              >
                <span className="min-w-0 text-left">
                  <span className="block text-xs uppercase tracking-[0.14em] text-[var(--text-soft)] sm:inline sm:text-sm sm:normal-case sm:tracking-normal">
                    Lens
                  </span>{' '}
                  <span className="mt-1 block font-medium text-[var(--accent)] sm:ml-1 sm:mt-0 sm:inline">
                    {LENS_OPTIONS.find((l) => l.key === lensKey)?.label}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-[var(--text-soft)] sm:ml-2 sm:mt-0 sm:inline sm:text-sm">
                    — {LENS_OPTIONS.find((l) => l.key === lensKey)?.blurb}
                  </span>
                </span>
                <ChevronDown
                  className={`mt-1 h-4 w-4 flex-shrink-0 text-[var(--text-muted)] transition-transform ${lensOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {lensOpen && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-lg">
                  {LENS_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => {
                        setLensKey(opt.key)
                        setLensOpen(false)
                      }}
                      className={`flex w-full flex-col gap-0.5 px-4 py-3 text-left text-sm transition-colors first:rounded-t-xl last:rounded-b-xl sm:flex-row sm:items-center sm:gap-3 ${
                        lensKey === opt.key
                          ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                          : 'text-[var(--text)] hover:bg-[var(--surface)]'
                      }`}
                    >
                      <span className="font-medium">{opt.label}</span>
                      <span className="text-xs text-[var(--text-soft)] sm:text-sm">— {opt.blurb}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Meeting context (optional) */}
            <div>
              <textarea
                value={meetingContext}
                onChange={(e) => setMeetingContext(e.target.value)}
                placeholder="Optional: describe your meeting or what you need to know (e.g. &quot;Board meeting next week, need to understand competitive landscape and recent product moves&quot;)"
                rows={2}
                maxLength={1000}
                className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-soft)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
              {meetingContext.length > 0 && (
                <p className="mt-1 text-right text-xs text-[var(--text-soft)]">
                  {meetingContext.length}/1000
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!query.trim()}
              className="w-full rounded-xl bg-[var(--accent)] px-6 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Prepare Briefing
            </button>
          </form>
        </div>
      )}

      {/* ── Loading State ─────────────────────────────────────── */}
      {loading && (
        <div className="flex min-h-[55vh] flex-col items-center justify-center gap-6">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-2 border-[var(--border)]" />
            <Loader2 className="absolute inset-0 h-12 w-12 animate-spin text-[var(--accent)]" />
          </div>
          <div className="flex flex-col items-center gap-3">
            {LOADING_STEPS.map((step, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 text-sm transition-opacity duration-500 ${
                  i <= loadingStep ? 'opacity-100' : 'opacity-30'
                }`}
              >
                {i < loadingStep ? (
                  <CheckCircle2 className="h-4 w-4 text-accent-teal" />
                ) : i === loadingStep ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-[var(--border)]" />
                )}
                <span className={i <= loadingStep ? 'text-[var(--text)]' : 'text-[var(--text-soft)]'}>
                  {step}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-[var(--text-soft)]">
            This may take 15–30 seconds for new entities
          </p>
        </div>
      )}

      {/* ── Error State ───────────────────────────────────────── */}
      {error && !loading && (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
          <AlertCircle className="h-10 w-10 text-accent-coral" />
          <p className="text-base text-accent-coral">{error}</p>
          <button
            onClick={() => {
              setError(null)
              setDossier(null)
            }}
            className="rounded-lg bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface-strong)]"
          >
            Try again
          </button>
        </div>
      )}

      {/* ── Results ───────────────────────────────────────────── */}
      {dossier && !loading && !error && (
        <>
          {/* Back / new search header */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={() => {
                setDossier(null)
                setQuery('')
                setMeetingContext('')
                setFeedback(null)
              }}
              className="rounded-lg bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-strong)] hover:text-[var(--text)]"
            >
              ← New Search
            </button>
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-[var(--text-soft)]">
              {dossier.status.cache.hit && dossier.status.cache.ageMinutes != null && (
                <span>Cached {Math.round(dossier.status.cache.ageMinutes)}m ago</span>
              )}
              {/* Feedback buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                    feedback === 'up'
                      ? 'bg-accent-teal/10 text-accent-teal'
                      : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-strong)] hover:text-[var(--text)]'
                  }`}
                  title="Helpful"
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setFeedback(feedback === 'down' ? null : 'down')}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                    feedback === 'down'
                      ? 'bg-accent-coral/10 text-accent-coral'
                      : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-strong)] hover:text-[var(--text)]'
                  }`}
                  title="Not helpful"
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                </button>
              </div>
              {/* Copy button */}
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1 rounded-lg bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-strong)] hover:text-[var(--text)]"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-accent-teal" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={() => fetchDossier(true)}
                className="flex items-center gap-1 rounded-lg bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-strong)] hover:text-[var(--text)]"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </button>
            </div>
          </div>

          {/* No coverage state */}
          {dossier.status.coverageBand === 'none' ? (
            <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
              <AlertCircle className="h-10 w-10 text-[var(--text-soft)]" />
              <h2 className="text-lg font-semibold text-[var(--text)]">No coverage found</h2>
              <p className="max-w-md text-sm text-[var(--text-muted)]">
                We couldn&apos;t find enough recent information about &ldquo;{dossier.entity.query}&rdquo;
                in the last {dossier.entity.lookbackDays} days. Try a different query or adjust the entity type.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
              {/* ── LEFT COLUMN (3/5) ──────────────────────────── */}
              <div className="space-y-6 lg:col-span-3">
                {/* Headline */}
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-[var(--text-soft)]">
                    <span className="rounded bg-[var(--surface)] px-2 py-0.5 capitalize">
                      {dossier.entity.entityType}
                    </span>
                    <span className="rounded bg-[var(--surface)] px-2 py-0.5 capitalize">
                      {dossier.entity.lensKey} lens
                    </span>
                    <span>{dossier.entity.lookbackDays}-day lookback</span>
                  </div>
                  <h2 className="font-display text-2xl font-bold leading-tight text-[var(--text)] sm:text-3xl">
                    {dossier.synthesis.headline}
                  </h2>
                  {dossier.synthesis.dek && (
                    <p className="mt-2 text-base leading-relaxed text-[var(--text-muted)]">
                      {dossier.synthesis.dek}
                    </p>
                  )}
                </div>

                {/* Labels row */}
                {(dossier.synthesis.opportunityLabel ||
                  dossier.synthesis.riskLabel ||
                  dossier.synthesis.tensionLabel) && (
                  <div className="flex flex-wrap gap-2">
                    {dossier.synthesis.opportunityLabel && (
                      <span className="rounded-full border border-accent-teal/20 bg-accent-teal/10 px-3 py-1 text-xs font-medium text-accent-teal">
                        ↑ {dossier.synthesis.opportunityLabel}
                      </span>
                    )}
                    {dossier.synthesis.riskLabel && (
                      <span className="rounded-full border border-accent-coral/20 bg-accent-coral/10 px-3 py-1 text-xs font-medium text-accent-coral">
                        ⚠ {dossier.synthesis.riskLabel}
                      </span>
                    )}
                    {dossier.synthesis.tensionLabel && (
                      <span className="rounded-full border border-accent-amber/20 bg-accent-amber/10 px-3 py-1 text-xs font-medium text-accent-amber">
                        ⟷ {dossier.synthesis.tensionLabel}
                      </span>
                    )}
                  </div>
                )}

                {/* Bottom Line */}
                <div className="rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/5 p-5">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--accent)]">
                    <CheckCircle2 className="h-4 w-4" />
                    Bottom Line
                  </h3>
                  <p className="text-sm leading-relaxed text-[var(--text)]">
                    {dossier.synthesis.bottomLine}
                  </p>
                </div>

                {/* Why Now */}
                {dossier.synthesis.whyNow && (
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                      <Clock className="h-4 w-4 text-[var(--accent-amber)]" />
                      Why Now
                    </h3>
                    <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                      {dossier.synthesis.whyNow}
                    </p>
                  </div>
                )}

                {/* Why It Matters */}
                {dossier.synthesis.whyItMatters.length > 0 && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                      <TrendingUp className="h-4 w-4 text-[var(--accent-teal)]" />
                      Why It Matters
                    </h3>
                    <ul className="space-y-2">
                      {dossier.synthesis.whyItMatters.map((item, i) => (
                        <li
                          key={i}
                          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm leading-relaxed text-[var(--text-muted)]"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Proof Points */}
                {dossier.synthesis.proofPoints.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-[var(--text)]">
                      Proof Points
                    </h3>
                    <div className="space-y-3">
                      {dossier.synthesis.proofPoints.map((pp, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
                        >
                          <div className="mb-1 flex items-baseline gap-2">
                            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/10 text-xs font-bold text-[var(--accent)]">
                              {i + 1}
                            </span>
                            <span className="text-sm font-medium text-[var(--text)]">
                              {pp.label}
                            </span>
                          </div>
                          <p className="ml-7 text-sm leading-relaxed text-[var(--text-muted)]">
                            {pp.detail}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* What to Watch */}
                {dossier.synthesis.whatToWatch.length > 0 && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                      <Eye className="h-4 w-4 text-[var(--accent-violet)]" />
                      What to Watch
                    </h3>
                    <ul className="space-y-2">
                      {dossier.synthesis.whatToWatch.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm leading-relaxed text-[var(--text-muted)]"
                        >
                          <span className="mt-0.5 text-[var(--accent-violet)]">→</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggested Questions */}
                {dossier.synthesis.suggestedQuestions.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-[var(--text)]">
                      Questions to Ask
                    </h3>
                    <div className="space-y-2">
                      {dossier.synthesis.suggestedQuestions.map((q, i) => (
                        <div
                          key={i}
                          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm italic text-[var(--text-muted)]"
                        >
                          &ldquo;{q}&rdquo;
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ── RIGHT COLUMN (2/5) ─────────────────────────── */}
              <div className="space-y-6 lg:col-span-2">
                {/* Coverage Badge */}
                {(() => {
                  const badge = COVERAGE_BADGE[dossier.status.coverageBand] ?? COVERAGE_BADGE.none
                  return (
                    <div
                      className={`flex flex-col items-start gap-1.5 rounded-xl border px-4 py-3 text-sm font-medium sm:flex-row sm:items-center sm:gap-2 ${badge.color}`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {badge.label}
                      <span className="text-xs font-normal opacity-70 sm:ml-auto">
                        {dossier.status.coverage.totalArticles} articles ·{' '}
                        {dossier.status.coverage.uniqueSources} sources
                      </span>
                    </div>
                  )
                })()}

                {/* Timeline */}
                {dossier.timeline.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-[var(--text)]">Timeline</h3>
                    <div className="space-y-3">
                      {dossier.timeline.map((event) => (
                        <div
                          key={event.id}
                          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
                        >
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs text-[var(--text-soft)]">
                              {formatDate(event.publishedAt)}
                            </span>
                            <span className="text-xs text-[var(--text-soft)]">
                              {event.sourceCount} source{event.sourceCount !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <p className="text-sm font-medium leading-snug text-[var(--text)]">
                            {event.headline}
                          </p>
                          {event.summary && (
                            <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
                              {event.summary}
                            </p>
                          )}
                          {event.sourceDomains.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {event.sourceDomains.slice(0, 3).map((domain) => (
                                <span
                                  key={domain}
                                  className="rounded bg-[var(--bg)] px-1.5 py-0.5 text-[10px] text-[var(--text-soft)]"
                                >
                                  {domain}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sources */}
                {Object.keys(dossier.proofSources).length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-[var(--text)]">Sources</h3>
                    <div className="space-y-2">
                      {Object.values(dossier.proofSources)
                        .filter((source) => safeUrl(source.url))
                        .sort(
                          (a, b) =>
                            new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
                        )
                        .slice(0, 15)
                        .map((source) => (
                          <a
                            key={source.articleId}
                            href={safeUrl(source.url)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-start gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 transition-colors hover:border-[var(--accent)]/30"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm text-[var(--text)] group-hover:text-[var(--accent)]">
                                {source.title}
                              </p>
                              <p className="mt-0.5 text-xs text-[var(--text-soft)]">
                                {domainFromUrl(source.url)} · {formatDate(source.publishedAt)}
                              </p>
                            </div>
                            <ExternalLink className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[var(--text-soft)] group-hover:text-[var(--accent)]" />
                          </a>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
