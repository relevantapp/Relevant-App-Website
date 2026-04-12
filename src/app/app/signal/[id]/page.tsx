'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useProBrief } from '@/hooks/useProBrief'
import type { EventUpdate } from '@/hooks/useProBrief'
import type { ProBriefItem, ConsequenceStep } from '@/types/signals'
import {
  ArrowLeft, Clock, Layers, TrendingUp, ExternalLink, Radio,
  Eye, Zap, Binoculars, Link2, Play, MessageCircle, History,
} from 'lucide-react'
import { AskAIChat } from '@/components/app/AskAIChat'

/* ── constants ───────────────────────────────────────────────── */

const TABS = ['What Happened', 'Why It Matters', 'What to Watch'] as const
type TabKey = typeof TABS[number]
const TAB_ICONS: Record<TabKey, React.ElementType> = {
  'What Happened': Eye,
  'Why It Matters': Zap,
  'What to Watch': Binoculars,
}

const TYPE_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  competitive: { bg: 'bg-accent-coral/15', text: 'text-accent-coral', bar: 'bg-accent-coral' },
  opportunity: { bg: 'bg-accent-teal/15', text: 'text-accent-teal', bar: 'bg-accent-teal' },
  risk:        { bg: 'bg-accent-amber/15', text: 'text-accent-amber', bar: 'bg-accent-amber' },
  strategic:   { bg: 'bg-accent-violet/15', text: 'text-accent-violet', bar: 'bg-accent-violet' },
}
const DEFAULT_TYPE_COLOR = { bg: 'bg-[var(--surface)]', text: 'text-[var(--text-muted)]', bar: 'bg-[var(--text-soft)]' }

const TRAJECTORY_BADGE: Record<string, string> = {
  ESCALATING: 'bg-accent-coral text-white',
  EMERGING: 'bg-accent-teal text-white',
  DEVELOPING: 'bg-accent-amber text-[var(--bg)]',
  STABLE: 'bg-[var(--surface-strong)] text-[var(--text)]',
  FADING: 'bg-[var(--surface)] text-[var(--text-muted)]',
}

/* ── helpers ──────────────────────────────────────────────────── */

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d)
}

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  if (diff < 0) return 'Just now'
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatTimelineDate(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const hours = Math.floor(diffMs / 3_600_000)
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(d)
}

/* ── sub-components ───────────────────────────────────────────── */

function likelihoodStyle(lh: string): { text: string; bg: string } {
  if (lh === 'likely') return { text: 'text-accent-teal', bg: 'bg-accent-teal/10' }
  if (lh === 'possible') return { text: 'text-accent-amber', bg: 'bg-accent-amber/10' }
  return { text: 'text-accent-coral', bg: 'bg-accent-coral/10' }
}

function ConsequenceChain({ steps }: { steps: ConsequenceStep[] }) {
  if (steps.length === 0) return null
  return (
    <section className="mt-8">
      <h3 className="mb-4 font-display text-lg font-bold text-[var(--text)]">Impact Analysis</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {steps.map((step, i) => {
          const typeKey = step.type?.toLowerCase() || ''
          const color = TYPE_COLORS[typeKey] || DEFAULT_TYPE_COLOR
          const typeLabel = step.consequence_types?.[0] ?? step.type ?? 'impact'
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.25 }}
              className={`rounded-2xl border border-[var(--border)] ${color.bg} p-5`}
            >
              {/* Header: type badge */}
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${color.bg} ${color.text}`}>
                  {typeLabel}
                </span>
                {step.confidence && (
                  <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                    {step.confidence === 'grounded' ? 'Grounded' : 'Partially grounded'}
                  </span>
                )}
              </div>

              {/* Dimension headline */}
              <h4 className="mb-2 font-display text-base font-bold text-[var(--text)]">
                {step.dimension}
              </h4>

              {/* Chain description */}
              <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                {step.articleChain || step.chain}
              </p>

              {/* Weight bar */}
              {step.weight > 0 && (
                <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-[var(--surface)]">
                  <div
                    className={`h-full rounded-full ${color.bar}`}
                    style={{ width: `${Math.min(step.weight * 100, 100)}%` }}
                  />
                </div>
              )}

              {/* Key assumption */}
              {step.keyAssumption && (
                <div className="mt-3 rounded-lg bg-[var(--surface)] p-3">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--text-soft)]">Assumes</p>
                  <p className="text-xs leading-relaxed text-[var(--text-muted)]">{step.keyAssumption}</p>
                </div>
              )}

              {/* Branches */}
              {step.branches && step.branches.length > 0 && (
                <div className="mt-4 flex flex-col gap-2 border-t border-[var(--border)] pt-3">
                  {step.branches.map((b, bi) => {
                    const lh = likelihoodStyle(b.likelihood)
                    return (
                      <div key={bi} className="rounded-lg bg-[var(--surface)] p-3">
                        <div className="mb-1 flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${lh.text} ${lh.bg}`}>
                            {b.likelihood.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="mb-1 text-sm font-semibold text-[var(--text)]">{b.scenario}</p>
                        <p className="text-xs leading-relaxed text-[var(--text-muted)]">{b.detail}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}

function SourcesList({ sources, sourceExtracts }: {
  sources: { url: string; label: string }[]
  sourceExtracts?: ProBriefItem['sourceExtracts']
}) {
  const hasExtracts = sourceExtracts && sourceExtracts.length > 0
  if (sources.length === 0 && !hasExtracts) return null

  return (
    <section className="mt-8">
      <h3 className="mb-3 font-display text-lg font-bold text-[var(--text)]">Sources</h3>
      {hasExtracts ? (
        <div className="flex flex-col gap-3">
          {sourceExtracts.map((extract, i) => (
            <a
              key={i}
              href={extract.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 transition-colors hover:border-accent-blue/30"
            >
              {/* Decorative quote mark */}
              <span className="absolute left-4 top-1 select-none font-display text-5xl font-extrabold leading-none text-accent-blue/10">
                &ldquo;
              </span>

              {/* Quote text */}
              <p className="pt-7 text-sm leading-relaxed text-[var(--text)]">
                {extract.quote}
              </p>

              {/* Attribution */}
              <div className="mt-3 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-blue" />
                <span className="text-xs font-medium text-[var(--text-muted)]">
                  {extract.source_name}
                </span>
                <ExternalLink
                  size={10}
                  className="ml-auto opacity-0 transition-opacity group-hover:opacity-60"
                />
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sources.map((s, i) => (
            <a
              key={i}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-3 text-sm text-[var(--text-muted)] transition-colors hover:border-accent-blue/40 hover:text-accent-blue"
            >
              <Link2 size={14} className="shrink-0" />
              <span className="line-clamp-1">{s.label}</span>
              <ExternalLink
                size={12}
                className="ml-auto shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
              />
            </a>
          ))}
        </div>
      )}
    </section>
  )
}

function getEmbedUrl(m: NonNullable<ProBriefItem['mediaLinks']>[number]): string | null {
  if (m.embed_url) return m.embed_url
  try {
    const u = new URL(m.url)
    if (m.type === 'youtube_video' || m.type === 'youtube_short') {
      const vid = u.searchParams.get('v')
      if (vid) return `https://www.youtube.com/embed/${vid}`
      if (u.hostname === 'youtu.be') return `https://www.youtube.com/embed${u.pathname}`
      if (u.pathname.startsWith('/shorts/')) return `https://www.youtube.com/embed/${u.pathname.replace('/shorts/', '')}`
    }
    if (m.type === 'spotify_episode') {
      return `https://open.spotify.com/embed${u.pathname}`
    }
  } catch { /* ignore */ }
  return null
}

function MediaSection({ mediaLinks }: { mediaLinks: NonNullable<ProBriefItem['mediaLinks']> }) {
  if (mediaLinks.length === 0) return null
  return (
    <section className="mt-8">
      <h3 className="mb-3 font-display text-lg font-bold text-[var(--text)]">Media</h3>
      <div className="flex flex-col gap-4">
        {mediaLinks.map((m, i) => {
          const embedUrl = getEmbedUrl(m)
          if (embedUrl) {
            const isSpotify = m.type === 'spotify_episode'
            return (
              <div key={i} className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]">
                <div
                  className="relative w-full"
                  style={{ paddingBottom: isSpotify ? undefined : '56.25%', height: isSpotify ? 152 : undefined }}
                >
                  <iframe
                    src={embedUrl}
                    title={m.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className={isSpotify ? 'h-full w-full' : 'absolute inset-0 h-full w-full'}
                    style={{ border: 'none' }}
                  />
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-[var(--text)]">{m.title}</p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">{m.channel_or_show}</p>
                </div>
              </div>
            )
          }
          return (
            <a
              key={i}
              href={m.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-3 transition-colors hover:border-accent-blue/40"
            >
              {m.thumbnail && (
                <img src={m.thumbnail} alt="" className="h-16 w-24 shrink-0 rounded-md object-cover" />
              )}
              <div className="min-w-0">
                <p className="mb-1 line-clamp-2 text-sm font-medium text-[var(--text)]">{m.title}</p>
                <p className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                  <Play size={10} />
                  {m.channel_or_show}
                </p>
              </div>
            </a>
          )
        })}
      </div>
    </section>
  )
}

/* ── skeleton ─────────────────────────────────────────────────── */

function DetailSkeleton() {
  return (
    <div className="py-6">
      <div className="mb-6 h-5 w-20 animate-pulse rounded bg-[var(--surface)]" />
      <div className="mb-4 h-8 w-3/4 animate-pulse rounded bg-[var(--surface)]" />
      <div className="mb-2 h-4 w-1/2 animate-pulse rounded bg-[var(--surface)]" />
      <div className="mb-6 h-40 w-full animate-pulse rounded-xl bg-[var(--surface)]" />
      <div className="space-y-3">
        <div className="h-4 w-full animate-pulse rounded bg-[var(--surface)]" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-[var(--surface)]" />
        <div className="h-4 w-4/6 animate-pulse rounded bg-[var(--surface)]" />
      </div>
    </div>
  )
}

/* ── page ─────────────────────────────────────────────────────── */

export default function SignalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { fetchBriefItemById, fetchEventTimeline } = useProBrief()

  const [signal, setSignal] = useState<ProBriefItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('What Happened')
  const [timeline, setTimeline] = useState<EventUpdate[]>([])
  const [timelineLoading, setTimelineLoading] = useState(false)

  const signalId = typeof params.id === 'string' ? params.id : ''

  useEffect(() => {
    if (!signalId) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const item = await fetchBriefItemById(signalId)
      if (!cancelled) {
        setSignal(item)
        setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [signalId, fetchBriefItemById])

  // Fetch timeline for developing / escalating stories
  useEffect(() => {
    if (!signalId || !signal) return
    const trajectory = signal.trajectory?.toUpperCase() ?? ''
    const isThreadStory = signal.isDeveloping || trajectory === 'DEVELOPING' || trajectory === 'ESCALATING'
    if (!isThreadStory) return
    let cancelled = false
    ;(async () => {
      setTimelineLoading(true)
      const updates = await fetchEventTimeline(signalId)
      if (!cancelled) {
        setTimeline(updates)
        setTimelineLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [signalId, signal, fetchEventTimeline])

  if (loading) return <DetailSkeleton />

  if (!signal) {
    return (
      <div className="py-16 text-center">
        <h2 className="mb-2 font-display text-xl font-bold text-[var(--text)]">Signal not found</h2>
        <p className="mb-6 text-sm text-[var(--text-muted)]">It may have been removed or you don&apos;t have access.</p>
        <button
          onClick={() => router.push('/app/feed')}
          className="rounded-lg bg-accent-blue px-4 py-2 text-sm font-medium text-white"
        >
          Back to Feed
        </button>
      </div>
    )
  }

  const trajectoryLabel = signal.trajectory?.toUpperCase()
  const trajectoryClass = trajectoryLabel ? TRAJECTORY_BADGE[trajectoryLabel] : null
  const shouldShowTimeline = signal.isDeveloping || trajectoryLabel === 'DEVELOPING' || trajectoryLabel === 'ESCALATING'
  const visibleTimeline = timeline.length > 0
    ? timeline
    : (signal.deltaSummary || (signal.updateCount ?? 0) > 0)
      ? [{
          id: `${signal.id}-latest`,
          created_at: signal.updatedAt || signal.deliveredAt || signal.signalDate || new Date().toISOString(),
          headline: signal.headline,
          delta_summary: signal.deltaSummary || 'This story is still moving. New updates are being folded into the thread.',
          sourceCount: signal.sourceCount ?? 0,
        }]
      : []

  const tabContent: Record<TabKey, React.ReactNode> = {
    'What Happened': (
      <div>
        {signal.synthesis && (
          <p className="mb-4 rounded-lg bg-[var(--surface)] p-4 text-sm leading-relaxed text-[var(--text)]">
            {signal.synthesis}
          </p>
        )}
        <ul className="flex flex-col gap-2">
          {signal.what_happened.map((point, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed text-[var(--text-muted)]">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-blue" />
              {point}
            </li>
          ))}
        </ul>

        {/* Timeline — for developing / escalating stories */}
        {(shouldShowTimeline || timelineLoading || visibleTimeline.length > 0) && (
          <div className="mt-6 border-t border-[var(--border)] pt-5">
            <div className="mb-4 flex items-center gap-2">
              <History size={14} className="text-accent-blue" />
              <h3 className="text-sm font-semibold text-[var(--text)]">Timeline</h3>
              <span className="text-xs text-[var(--text-soft)]">How the story has moved so far</span>
            </div>

            {timelineLoading ? (
              <div className="flex items-center gap-2 py-4 text-sm text-[var(--text-muted)]">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-accent-blue" />
                Loading timeline…
              </div>
            ) : visibleTimeline.length === 0 ? (
              <p className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-sm text-[var(--text-muted)]">
                No timeline entries yet. This thread will show updates here as they land.
              </p>
            ) : (
              <div className="relative ml-1.5 border-l-2 border-[var(--border)] pl-5">
                {visibleTimeline.map((update, i) => (
                  <div key={update.id} className="relative pb-5 last:pb-0">
                    {/* Dot on rail */}
                    <div
                      className={`absolute -left-[23px] top-1 h-2.5 w-2.5 rounded-full border-2 border-[var(--bg-elevated)] ${
                        i === 0 ? 'bg-accent-blue' : 'bg-[var(--surface-strong)]'
                      }`}
                    />
                    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className="text-xs font-medium text-[var(--text-soft)]">
                          {formatTimelineDate(update.created_at)}
                        </span>
                        {update.sourceCount > 0 && (
                          <span className="rounded-full bg-[var(--surface)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                            {update.sourceCount} source{update.sourceCount === 1 ? '' : 's'}
                          </span>
                        )}
                      </div>
                      {update.headline && (
                        <p className="mb-1 text-sm font-medium text-[var(--text)]">{update.headline}</p>
                      )}
                      {update.delta_summary && (
                        <p className="text-sm leading-relaxed text-[var(--text-muted)]">{update.delta_summary}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    ),
    'Why It Matters': (
      <ul className="flex flex-col gap-2">
        {signal.why_it_matters.map((point, i) => (
          <li key={i} className="flex gap-3 text-sm leading-relaxed text-[var(--text-muted)]">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-teal" />
            {point}
          </li>
        ))}
      </ul>
    ),
    'What to Watch': (
      <ul className="flex flex-col gap-2">
        {(signal.what_to_watch ?? []).length > 0 ? (
          signal.what_to_watch!.map((point, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed text-[var(--text-muted)]">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-amber" />
              {point}
            </li>
          ))
        ) : (
          <p className="text-sm text-[var(--text-soft)]">No watch items yet.</p>
        )}
      </ul>
    ),
  }

  return (
    <div className="py-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {/* Hero image — full width */}
      {signal.imageUrl && (
        <div className="relative mb-6 h-56 w-full overflow-hidden rounded-xl sm:h-72 lg:h-80">
          <img src={signal.imageUrl} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-transparent to-transparent" />
        </div>
      )}

      {/* 2-column layout on desktop */}
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Main content column */}
        <div className="min-w-0 flex-1">
          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 font-display text-2xl font-bold leading-tight text-[var(--text)] sm:text-3xl lg:text-4xl"
          >
            {signal.headline}
          </motion.h1>

          {/* Meta bar */}
          <div className="mb-6 flex flex-wrap items-center gap-3 text-xs text-[var(--text-soft)]">
            {signal.signalDate && (
              <span className="inline-flex items-center gap-1">
                <Clock size={12} />
                {formatDate(signal.signalDate)}
              </span>
            )}
            {signal.publishedAt && (
              <span className="text-[var(--text-soft)]">· {timeAgo(signal.publishedAt)}</span>
            )}
            {signal.sourceCount != null && signal.sourceCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface)] px-2 py-0.5 text-[var(--text-muted)]">
                <Layers size={11} />
                {signal.sourceCount} sources
              </span>
            )}
            {trajectoryClass && trajectoryLabel && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${trajectoryClass}`}>
                <TrendingUp size={10} />
                {trajectoryLabel.charAt(0) + trajectoryLabel.slice(1).toLowerCase()}
              </span>
            )}
            {signal.isDeveloping && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent-blue/15 px-2 py-0.5 font-medium text-accent-blue">
                <Radio size={10} className="animate-pulse" />
                Developing
              </span>
            )}
          </div>

          {/* Tabs */}
          <div className="mb-4 flex gap-1 rounded-lg bg-[var(--surface)] p-1">
            {TABS.map((tab) => {
              const Icon = TAB_ICONS[tab]
              const active = activeTab === tab
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors sm:text-sm ${
                    active
                      ? 'bg-[var(--bg-elevated)] text-[var(--text)] shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{tab}</span>
                </button>
              )
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5"
            >
              {tabContent[activeTab]}
            </motion.div>
          </AnimatePresence>

          {/* Consequence chain */}
          {signal.consequence_steps && signal.consequence_steps.length > 0 && (
            <ConsequenceChain steps={signal.consequence_steps} />
          )}
        </div>

        {/* Desktop sidebar */}
        <aside className="flex w-full shrink-0 flex-col gap-5 lg:w-[340px]">
          {/* Sources */}
          <div className="lg:sticky lg:top-20">
            <SourcesList sources={signal.sources} sourceExtracts={signal.sourceExtracts} />

            {/* Media */}
            {signal.mediaLinks && signal.mediaLinks.length > 0 && (
              <MediaSection mediaLinks={signal.mediaLinks} />
            )}

            {/* Ask AI */}
            <AskAIChat signalId={signal.id} headline={signal.headline} />

            {/* Why showing */}
            {signal.why_showing && (
              <section className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
                <div className="mb-2 flex items-center gap-2">
                  <MessageCircle size={14} className="text-accent-blue" />
                  <h3 className="text-sm font-semibold text-[var(--text)]">Why am I seeing this?</h3>
                </div>
                <p className="text-sm leading-relaxed text-[var(--text-muted)]">{signal.why_showing}</p>
              </section>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
