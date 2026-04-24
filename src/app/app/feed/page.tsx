'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { useProBrief } from '@/hooks/useProBrief'
import { supabase } from '@/lib/supabase'
import type { ProBriefItem } from '@/types/signals'
import SignalCard from '@/components/app/SignalCard'
import FeedStatsSheet from '@/components/app/FeedStatsSheet'
import FeedTuneSheet from '@/components/app/FeedTuneSheet'
import FeedSkeleton from '@/components/app/FeedSkeleton'
import { AlertTriangle, ArrowUpRight, Compass, Inbox, Lightbulb, Loader2, Radio, RefreshCw, Shield, SlidersHorizontal, Swords, TrendingUp } from 'lucide-react'
/* ── filter config ───────────────────────────────────────────── */

type FilterKey = 'all' | 'escalating' | 'developing' | 'opportunity' | 'risk' | 'competitive'

const FILTERS: Array<{ key: FilterKey; label: string; icon: typeof Inbox }> = [
  { key: 'all', label: 'All', icon: SlidersHorizontal },
  { key: 'escalating', label: 'Escalating', icon: TrendingUp },
  { key: 'developing', label: 'Developing', icon: Radio },
  { key: 'opportunity', label: 'Opportunity', icon: Lightbulb },
  { key: 'risk', label: 'Risk', icon: Shield },
  { key: 'competitive', label: 'Competitive', icon: Swords },
]

const SUMMARY_FILTER_KEYS: Exclude<FilterKey, 'all'>[] = [
  'escalating',
  'developing',
  'opportunity',
  'risk',
  'competitive',
]

const FILTER_ACCENT: Record<FilterKey, string> = {
  all: 'var(--accent)',
  escalating: 'var(--accent-coral)',
  developing: 'var(--accent)',
  opportunity: 'var(--accent-teal)',
  risk: 'var(--accent-amber)',
  competitive: 'var(--accent-violet)',
}

type FeedPreferences = {
  sensitivity: number
  instructions: string
}

const SENSITIVITY_OPTIONS = [
  { id: 'more' as const, label: 'More', value: 2.1, description: 'Cast a wider net' },
  { id: 'balanced' as const, label: 'Balanced', value: 2.6, description: 'A healthy mix of range and relevance' },
  { id: 'essential' as const, label: 'Essential', value: 3.2, description: 'Just the strongest updates' },
]

const WRITING_STYLE_PRESETS = [
  {
    id: 'executive' as const,
    label: 'Executive',
    value:
      'Write like a short executive memo. Lead with impact, be direct, and keep it scannable. Preserve the material facts, numbers, timelines, and tradeoffs from the story.',
    description: 'Crisp and direct',
  },
  {
    id: 'analyst' as const,
    label: 'Analyst',
    value:
      'Write like a research analyst. Include specific data points, percentages, comparisons, and cause-and-effect when the evidence supports them. Be precise but accessible.',
    description: 'Data-rich with context',
  },
  {
    id: 'plain' as const,
    label: 'Plain talk',
    value:
      'Write in plain, everyday language. No jargon or buzzwords. Translate complex points clearly, but keep the material facts, numbers, tradeoffs, and stakes intact.',
    description: 'Simple wording, full substance',
  },
  {
    id: 'action' as const,
    label: 'Action-first',
    value:
      'Lead every update with what to do about it, but keep the key background needed to understand the action. Be specific about deadlines, decisions, and next steps.',
    description: 'What to do next',
  },
]

const DEFAULT_PREFERENCES: FeedPreferences = {
  sensitivity: 2.6,
  instructions: WRITING_STYLE_PRESETS[0].value,
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function getFirstName(name?: string | null, email?: string | null): string | null {
  const trimmedName = name?.trim()
  if (trimmedName) return trimmedName.split(/\s+/)[0] || null

  const localPart = email?.split('@')[0]?.replace(/[._-]+/g, ' ').trim()
  if (!localPart) return null

  const firstWord = localPart.split(/\s+/)[0]
  if (!firstWord) return null
  return firstWord[0]?.toUpperCase() + firstWord.slice(1)
}

function sensitivityIdFromValue(value: number): (typeof SENSITIVITY_OPTIONS)[number]['id'] {
  if (value <= 2.2) return 'more'
  if (value >= 3.0) return 'essential'
  return 'balanced'
}

function detectWritingStyleId(instructions: string): (typeof WRITING_STYLE_PRESETS)[number]['id'] {
  const normalized = instructions.trim()
  if (!normalized) return 'executive'
  const match = WRITING_STYLE_PRESETS.find((preset) => preset.value.trim() === normalized)
  return match?.id ?? 'executive'
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function getPublisherKey(source: ProBriefItem['sources'][number]): string | null {
  try {
    const hostname = new URL(source.url).hostname.replace(/^www\./, '').trim().toLowerCase()
    if (hostname) return hostname
  } catch {}

  const fallback = source.label.trim().toLowerCase()
  return fallback || null
}

function hasConsequenceLabel(signal: ProBriefItem, label: 'opportunity' | 'risk' | 'competitive'): boolean {
  const target = label.toLowerCase()
  if (!Array.isArray(signal.consequence_steps) || signal.consequence_steps.length === 0) {
    return false
  }

  return signal.consequence_steps.some((step) => {
    if (normalizeText(step.type) === target) return true
    if (Array.isArray(step.consequence_types)) {
      return step.consequence_types.some((t) => normalizeText(t) === target)
    }
    return false
  })
}

function applyFilter(items: ProBriefItem[], filter: FilterKey): ProBriefItem[] {
  if (filter === 'all') return items
  if (filter === 'escalating') return items.filter((s) => s.trajectory?.toUpperCase() === 'ESCALATING')
  if (filter === 'developing') {
    return items.filter((s) => s.isDeveloping || s.trajectory?.toUpperCase() === 'DEVELOPING')
  }
  if (filter === 'opportunity' || filter === 'risk' || filter === 'competitive') {
    return items.filter((s) => hasConsequenceLabel(s, filter))
  }
  return items
}

/* ── date helpers ─────────────────────────────────────────────── */

function toDateKey(dateStr: string | null | undefined): string {
  if (!dateStr) return 'unknown'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return 'unknown'
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dateKeyFromDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatDateHeader(key: string): string {
  if (key === 'unknown') return 'Earlier'
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.getTime() === today.getTime()) return 'Today'
  if (date.getTime() === yesterday.getTime()) return 'Yesterday'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date)
}

function groupByDate(items: ProBriefItem[]): { key: string; label: string; items: ProBriefItem[] }[] {
  const map = new Map<string, ProBriefItem[]>()
  for (const item of items) {
    const key = toDateKey(item.signalDate)
    const arr = map.get(key) || []
    arr.push(item)
    map.set(key, arr)
  }
  return Array.from(map.entries()).map(([key, items]) => ({
    key,
    label: formatDateHeader(key),
    items,
  }))
}

/* ── page ─────────────────────────────────────────────────────── */

export default function FeedPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { fetchProBrief, fetchOlderSignals, subscribeToBriefUpdates, isLoading, error } = useProBrief()

  const [signals, setSignals] = useState<ProBriefItem[]>([])
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')
  const [preferences, setPreferences] = useState<FeedPreferences>(DEFAULT_PREFERENCES)
  const [savedPreferences, setSavedPreferences] = useState<FeedPreferences>(DEFAULT_PREFERENCES)
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [initialLoaded, setInitialLoaded] = useState(false)
  const [utilityLoaded, setUtilityLoaded] = useState(false)
  const [savingPreferences, setSavingPreferences] = useState(false)
  const [showTuneSheet, setShowTuneSheet] = useState(false)
  const [showStatsPanel, setShowStatsPanel] = useState(false)
  const [newItemIds, setNewItemIds] = useState<Set<string>>(() => new Set())
  const [generating, setGenerating] = useState(false)
  const [cachedAgeMinutes, setCachedAgeMinutes] = useState<number | null>(null)
  const mountedRef = useRef(true)

  // Initial fetch
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const result = await fetchProBrief()
      if (cancelled) return
      setSignals(result.items)
      setHasMore(result.hasMore)
      setNextCursor(result.nextCursor)
      setGenerating(result.generating)
      // Mark items delivered in the last 30 min as "new"
      const thirtyMinAgo = Date.now() - 30 * 60_000
      const ids = new Set<string>()
      for (const item of result.items) {
        if (item.deliveredAt && new Date(item.deliveredAt).getTime() > thirtyMinAgo) {
          ids.add(item.id)
        }
      }
      setNewItemIds(ids)
      setInitialLoaded(true)
    })()
    return () => { cancelled = true }
  }, [fetchProBrief])

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return
    const unsub = subscribeToBriefUpdates(user.id, async () => {
      const result = await fetchProBrief()
      if (!mountedRef.current) return
      setSignals(result.items)
      setHasMore(result.hasMore)
      setNextCursor(result.nextCursor)
    })
    return () => { unsub(); mountedRef.current = false }
  }, [user?.id, subscribeToBriefUpdates, fetchProBrief])

  useEffect(() => {
    let cancelled = false

    if (!user?.id) {
      setUtilityLoaded(true)
      return () => { cancelled = true }
    }

    void (async () => {
      const settingsResult = await supabase
        .from('user_settings')
        .select('influence_min_score, influence_instructions')
        .eq('user_id', user.id)
        .maybeSingle()

      if (cancelled) return

      const minScore = settingsResult.data?.influence_min_score
      const instructions = settingsResult.data?.influence_instructions
      const nextPreferences: FeedPreferences = {
        sensitivity:
          typeof minScore === 'number' && Number.isFinite(minScore)
            ? Math.max(2.0, Math.min(3.5, minScore))
            : DEFAULT_PREFERENCES.sensitivity,
        instructions:
          typeof instructions === 'string' && instructions.trim().length > 0
            ? instructions.trim()
            : DEFAULT_PREFERENCES.instructions,
      }

      setPreferences(nextPreferences)
      setSavedPreferences(nextPreferences)
      setUtilityLoaded(true)
    })()

    return () => { cancelled = true }
  }, [user?.id])

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return
    setLoadingMore(true)
    const result = await fetchOlderSignals(nextCursor)
    setSignals((prev) => [...prev, ...result.items])
    setHasMore(result.hasMore)
    setNextCursor(result.nextCursor)
    setLoadingMore(false)
  }, [nextCursor, loadingMore, fetchOlderSignals])

  const filteredSignals = useMemo(() => applyFilter(signals, activeFilter), [signals, activeFilter])
  const groups = useMemo(() => groupByDate(filteredSignals), [filteredSignals])
  const filterCounts = useMemo(
    () =>
      FILTERS.reduce((acc, filter) => {
        acc[filter.key] = filter.key === 'all' ? signals.length : applyFilter(signals, filter.key).length
        return acc
      }, {} as Record<FilterKey, number>),
    [signals],
  )
  const greeting = getGreeting()
  const firstName = getFirstName(user?.name, user?.email)
  const {
    summaryStoryCount,
    summaryMatchedArticles,
    summaryTimeSavedHours,
    activeDaysCount,
    uniquePublisherCount,
    averageSourcesPerStory,
    rangeLabel,
    activityPoints,
    summaryBreakdown,
  } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const rangeStartDate = new Date(today)
    rangeStartDate.setDate(rangeStartDate.getDate() - 6)
    const rangeStartMs = rangeStartDate.getTime()
    const labelFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
    const weekdayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' })

    const recentSignals = signals.filter((signal) => {
      if (!signal.signalDate) return false
      const timestamp = new Date(`${signal.signalDate}T00:00:00`).getTime()
      return Number.isFinite(timestamp) && timestamp >= rangeStartMs
    })

    const dayKeys = new Set<string>()
    const publisherKeys = new Set<string>()
    const dayCounts = new Map<string, number>()

    const sourceDocumentCount = recentSignals.reduce((total, signal) => {
      const sourceCount =
        typeof signal.sourceCount === 'number' && Number.isFinite(signal.sourceCount)
          ? Math.max(1, signal.sourceCount)
          : 1

      const key = toDateKey(signal.signalDate)
      if (key !== 'unknown') {
        dayKeys.add(key)
        dayCounts.set(key, (dayCounts.get(key) ?? 0) + 1)
      }

      signal.sources.forEach((source) => {
        const publisherKey = getPublisherKey(source)
        if (publisherKey) publisherKeys.add(publisherKey)
      })

      return total + sourceCount
    }, 0)

    const activity = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(rangeStartDate)
      day.setDate(rangeStartDate.getDate() + index)
      const key = dateKeyFromDate(day)
      return {
        label: weekdayFormatter.format(day),
        count: dayCounts.get(key) ?? 0,
      }
    })

    const breakdown = SUMMARY_FILTER_KEYS.map((key) => ({
      key,
      label: FILTERS.find((filter) => filter.key === key)?.label ?? key,
      count: applyFilter(recentSignals, key).length,
      accent: FILTER_ACCENT[key],
    })).sort((a, b) => b.count - a.count)

    return {
      summaryStoryCount: recentSignals.length,
      summaryMatchedArticles: sourceDocumentCount,
      summaryTimeSavedHours:
        sourceDocumentCount > 0 ? Math.max(1, Math.round((sourceDocumentCount * 4.5) / 60)) : null,
      activeDaysCount: dayKeys.size,
      uniquePublisherCount: publisherKeys.size,
      averageSourcesPerStory: recentSignals.length > 0 ? sourceDocumentCount / recentSignals.length : null,
      rangeLabel: `${labelFormatter.format(rangeStartDate)} - ${labelFormatter.format(today)}`,
      activityPoints: activity,
      summaryBreakdown: breakdown,
    }
  }, [signals])

  const hasPreferenceChanges =
    Math.abs(preferences.sensitivity - savedPreferences.sensitivity) > 0.0001 ||
    preferences.instructions.trim() !== savedPreferences.instructions.trim()
  const activeSensitivity =
    SENSITIVITY_OPTIONS.find((option) => option.id === sensitivityIdFromValue(preferences.sensitivity)) ?? SENSITIVITY_OPTIONS[1]
  const activeStyle =
    WRITING_STYLE_PRESETS.find((preset) => preset.id === detectWritingStyleId(preferences.instructions)) ?? WRITING_STYLE_PRESETS[0]

  const savePreferences = async () => {
    if (!user?.id || savingPreferences || !hasPreferenceChanges) return

    setSavingPreferences(true)
    const nextPreferences = {
      sensitivity: preferences.sensitivity,
      instructions: preferences.instructions.trim() || DEFAULT_PREFERENCES.instructions,
    }

    const { error } = await supabase
      .from('user_settings')
      .upsert(
        {
          user_id: user.id,
          influence_min_score: nextPreferences.sensitivity,
          influence_instructions: nextPreferences.instructions,
        },
        { onConflict: 'user_id' },
      )

    if (!error) {
      setPreferences(nextPreferences)
      setSavedPreferences(nextPreferences)
      setShowTuneSheet(false)
    } else {
      console.error('[feed] Failed to save preferences:', error.message)
    }

    setSavingPreferences(false)
  }

  if (!initialLoaded || isLoading) {
    return (
      <div className="py-6">
        <h1 className="mb-6 font-display text-2xl font-bold text-[var(--text)] lg:text-3xl">Your feed</h1>
        <FeedSkeleton />
      </div>
    )
  }

  if (signals.length === 0) {
    const isError = !!error
    return (
      <div className="py-6">
        <h1 className="mb-6 font-display text-2xl font-bold text-[var(--text)] lg:text-3xl">Your feed</h1>
        <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-6 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface)]">
            {isError ? (
              <AlertTriangle size={28} className="text-[var(--accent-amber)]" />
            ) : (
              <Inbox size={28} className="text-[var(--text-muted)]" />
            )}
          </div>
          <h2 className="mb-2 font-display text-lg font-semibold text-[var(--text)]">
            {isError ? 'Could not load your brief' : 'Quiet week in your tracked topics'}
          </h2>
          <p className="mb-4 max-w-sm text-sm text-[var(--text-muted)]">
            {isError
              ? 'Something went wrong. Try refreshing.'
              : "We\u2019re learning your interests. Add a few topics to get started."}
          </p>
          {isError ? (
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
            >
              Retry
            </button>
          ) : (
            <button
              onClick={() => router.push('/app/profile')}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
            >
              Add interests
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="py-4 sm:py-6 lg:py-8">
      <section className="mb-6 lg:mb-8">
        <div className="mb-4">
          <p className="text-sm font-medium text-[var(--text-muted)]">{greeting}{firstName ? ',' : ''}</p>
          {firstName ? (
            <h1 className="font-display text-3xl font-semibold leading-none tracking-[-0.05em] text-[var(--text)]">
              {firstName}
            </h1>
          ) : null}
        </div>
        <div className="grid max-w-[680px] grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setShowStatsPanel(true)}
            aria-haspopup="dialog"
            className="group relative min-h-[154px] overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--text)] p-4 text-left text-[var(--bg)] shadow-[0_18px_46px_rgba(0,0,0,0.18)] transition-transform hover:-translate-y-0.5"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.28),transparent_34%)]" aria-hidden="true" />
            <div className="relative flex h-full flex-col justify-between">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] opacity-70">Time saved · 7D</p>
              <div>
                <span className="font-display text-5xl font-semibold leading-none tracking-[-0.07em]">{summaryTimeSavedHours ?? '—'}</span>
                {summaryTimeSavedHours ? (
                  <span className="ml-1 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] opacity-70">hrs</span>
                ) : null}
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs opacity-70">Back in your week.</p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)]">
                  See details <ArrowUpRight size={13} />
                </span>
              </div>
            </div>
          </button>

          <div className="grid min-h-[154px] gap-3">
            <button
              type="button"
              onClick={() => setShowStatsPanel(true)}
              aria-haspopup="dialog"
              className="group rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-left shadow-[0_1px_0_rgba(255,255,255,0.03)_inset] transition-transform hover:-translate-y-0.5 hover:border-[var(--border-strong)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-soft)]">Stories · 7D</p>
                  <p className="mt-1 font-display text-3xl font-semibold leading-none tracking-[-0.06em] text-[var(--text)]">{summaryStoryCount}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{summaryMatchedArticles} sources</p>
                </div>
                <ArrowUpRight size={14} className="text-[var(--text-soft)] group-hover:text-[var(--text)]" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => setShowTuneSheet(true)}
              aria-haspopup="dialog"
              className="group flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-left shadow-[0_1px_0_rgba(255,255,255,0.03)_inset] transition-transform hover:-translate-y-0.5 hover:border-[var(--border-strong)]"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--text)] text-[var(--bg)]">
                <SlidersHorizontal size={15} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-soft)]">Adjust</span>
                <span className="block text-sm font-semibold text-[var(--text)]">Tune feed</span>
                <span className="block truncate text-xs text-[var(--text-muted)]">{activeSensitivity.label} · {activeStyle.label}</span>
              </span>
              <ArrowUpRight size={14} className="text-[var(--text-soft)] group-hover:text-[var(--text)]" />
            </button>
          </div>
        </div>
      </section>

      <FeedStatsSheet
        open={showStatsPanel}
        onClose={() => setShowStatsPanel(false)}
        timeSavedHours={summaryTimeSavedHours}
        storyCount={summaryStoryCount}
        sourceDocumentCount={summaryMatchedArticles}
        publisherCount={uniquePublisherCount}
        activeDaysCount={activeDaysCount}
        averageSourcesPerStory={averageSourcesPerStory}
        rangeLabel={rangeLabel}
        activity={activityPoints}
        breakdown={summaryBreakdown}
      />

      <FeedTuneSheet
        open={showTuneSheet}
        onClose={() => setShowTuneSheet(false)}
        disabled={savingPreferences || !utilityLoaded}
        saving={savingPreferences}
        hasChanges={hasPreferenceChanges}
        onSave={() => void savePreferences()}
        summaryTitle={`${activeSensitivity.label} feed · ${activeStyle.label}`}
        summaryText={`${activeSensitivity.description}. ${activeStyle.description}.`}
        sensitivityOptions={SENSITIVITY_OPTIONS.map((option) => ({
          id: option.id,
          label: option.label,
          description: option.description,
          active: option.id === activeSensitivity.id,
          onSelect: () => setPreferences((current) => ({ ...current, sensitivity: option.value })),
        }))}
        styleOptions={WRITING_STYLE_PRESETS.map((preset) => ({
          id: preset.id,
          label: preset.label,
          description: preset.description,
          active: preset.id === activeStyle.id,
          onSelect: () => setPreferences((current) => ({ ...current, instructions: preset.value })),
        }))}
      />

      {/* ── Stale brief banner ── */}
      {cachedAgeMinutes != null && cachedAgeMinutes > 60 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-[var(--accent-amber)]/30 bg-[var(--accent-amber)]/8 px-4 py-2.5 text-xs text-[var(--accent-amber)]">
          <AlertTriangle size={14} className="shrink-0" />
          <span>
            Your brief is {cachedAgeMinutes > 1440
              ? `${Math.floor(cachedAgeMinutes / 1440)}d`
              : cachedAgeMinutes > 60
                ? `${Math.floor(cachedAgeMinutes / 60)}h`
                : `${Math.round(cachedAgeMinutes)}m`} old. A fresh one is being prepared.
          </span>
        </div>
      )}

      {/* ── Generating shimmer ── */}
      {generating && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs text-[var(--text-muted)]">
          <Loader2 size={12} className="animate-spin" />
          <span>Building your brief…</span>
        </div>
      )}

      {/* Filter pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = activeFilter === f.key
          const accent = FILTER_ACCENT[f.key]
          const Icon = f.icon
          return (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all"
              style={active ? {
                borderColor: accent,
                background: `color-mix(in srgb, ${accent} 12%, transparent)`,
                color: accent,
              } : {
                borderColor: 'var(--border)',
                background: 'var(--bg-elevated)',
                color: 'var(--text-muted)',
              }}
            >
              <Icon size={12} />
              {f.label}
              {f.key !== 'all' && (
                <span
                  className="ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                  style={active ? {
                    background: `color-mix(in srgb, ${accent} 20%, transparent)`,
                    color: accent,
                  } : {
                    background: 'var(--surface)',
                    color: 'var(--text-soft)',
                  }}
                >
                  {filterCounts[f.key]}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="min-w-0">
        {groups.map((group) => (
          <section key={group.key} className="mb-6">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-soft)]">
              {group.label}
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {group.items.map((signal, i) => (
                <SignalCard
                  key={signal.id}
                  signal={signal}
                  index={i}
                  isNew={newItemIds.has(signal.id)}
                  onClick={() => router.push(`/app/signal/${signal.id}`)}
                />
              ))}
            </div>
          </section>
        ))}

        {hasMore && (
          <div className="mt-4 flex justify-center">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={loadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-5 py-2.5 text-sm font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--text)] disabled:opacity-50"
            >
              {loadingMore ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Loading…
                </>
              ) : (
                'Load more stories'
              )}
            </motion.button>
          </div>
        )}
      </div>
    </div>
  )
}
