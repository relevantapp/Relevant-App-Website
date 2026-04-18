'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getValidAccessToken } from '@/lib/supabase'
import {
  Search,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronDown,
  Briefcase,
} from 'lucide-react'
import {
  EntityType,
  LensKey,
  DossierResponse,
  ENTITY_OPTIONS,
  LOOKBACK_OPTIONS,
  LENS_OPTIONS,
  SUGGESTED_QUERIES,
} from './types'
import DossierResults from './DossierResults'

const LOADING_STEPS = [
  'Searching for relevant signals...',
  'Analyzing coverage and context...',
  'Synthesizing your briefing...',
]

export default function ResearchPage() {
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
  const loadingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const inferEntityType = useCallback((text: string): EntityType | null => {
    const trimmed = text.trim()
    if (!trimmed || trimmed.length < 3) return null
    const words = trimmed.split(/\s+/)
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
      if (inferred && entityType !== inferred) setEntityType(inferred)
    },
    [entityType, inferEntityType]
  )

  const fetchDossier = useCallback(
    async (forceRefresh = false) => {
      if (!query.trim()) return
      setLoading(true)
      setError(null)
      setLoadingStep(0)

      const timer = setInterval(() => {
        setLoadingStep((prev) => Math.min(prev + 1, 2))
      }, 3000)
      loadingTimerRef.current = timer

      try {
        const token = await getValidAccessToken(180)
        if (!token) {
          setError('Please sign in to use Research.')
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

  const handleSuggestionClick = (label: string, type: EntityType) => {
    setQuery(label)
    setEntityType(type)
    // Trigger search after state updates
    setTimeout(() => {
      setQuery(label)
      setEntityType(type)
    }, 0)
  }

  const handleRelatedSearch = useCallback(
    (relatedQuery: string, relatedType: EntityType) => {
      setQuery(relatedQuery)
      setEntityType(relatedType)
      setDossier(null)
      setMeetingContext('')
      // Scroll to top, then fetch
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setTimeout(() => {
        fetchDossier(false)
      }, 100)
    },
    [fetchDossier]
  )

  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) clearInterval(loadingTimerRef.current)
    }
  }, [])

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--text-soft)]" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <Briefcase className="h-12 w-12 text-[var(--text-muted)]" />
        <h2 className="text-xl font-semibold text-[var(--text)]">Sign in to use Research</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Get AI-powered briefings on any company, person, or topic.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1200px] pb-16">
      {/* Search Form */}
      {!dossier && !loading && (
        <div className="flex min-h-[55vh] flex-col items-center justify-center gap-8">
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold text-[var(--text)] sm:text-4xl">
              Research
            </h1>
            <p className="mt-2 text-base text-[var(--text-muted)]">
              Get a deep briefing on any company, person, or topic — powered by your signals.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex w-full max-w-xl flex-col gap-4">
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

            {/* Suggested queries — only when input is empty */}
            {!query && (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="text-xs text-[var(--text-soft)]">Try:</span>
                {SUGGESTED_QUERIES.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => handleSuggestionClick(s.label, s.entityType)}
                    className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-muted)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}

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

            {/* Meeting context */}
            <div>
              <textarea
                value={meetingContext}
                onChange={(e) => setMeetingContext(e.target.value)}
                placeholder="Optional: describe your meeting or what you need to know"
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

      {/* Loading State */}
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

      {/* Error State */}
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

      {/* Results */}
      {dossier && !loading && !error && (
        <DossierResults
          dossier={dossier}
          lensKey={lensKey}
          onNewSearch={() => {
            setDossier(null)
            setQuery('')
            setMeetingContext('')
          }}
          onRefresh={() => fetchDossier(true)}
          onRelatedSearch={handleRelatedSearch}
        />
      )}
    </div>
  )
}
