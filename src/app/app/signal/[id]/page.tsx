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
import { AskAIFab } from '@/components/app/AskAIChat'
import ShareButton from '@/components/app/ShareButton'

/* ── constants ───────────────────────────────────────────────── */

const TABS = ['What Happened', 'Why It Matters', 'What to Watch'] as const
type TabKey = typeof TABS[number]
const TAB_ICONS: Record<TabKey, React.ElementType> = {
  'What Happened': Eye,
  'Why It Matters': Zap,
  'What to Watch': Binoculars,
}

const TYPE_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  competitive: { bg: 'bg-[#8CABC8]/8', text: 'text-[#8CABC8]', bar: 'bg-[#8CABC8]' },
  opportunity: { bg: 'bg-[#7AB0A0]/8', text: 'text-[#7AB0A0]', bar: 'bg-[#7AB0A0]' },
  risk:        { bg: 'bg-[#C4A87A]/8', text: 'text-[#C4A87A]', bar: 'bg-[#C4A87A]' },
  strategic:   { bg: 'bg-[#A090C0]/8', text: 'text-[#A090C0]', bar: 'bg-[#A090C0]' },
  financial:   { bg: 'bg-[#C4A87A]/8', text: 'text-[#C4A87A]', bar: 'bg-[#C4A87A]' },
  operational: { bg: 'bg-[#7AB0A0]/8', text: 'text-[#7AB0A0]', bar: 'bg-[#7AB0A0]' },
  regulatory:  { bg: 'bg-[#C09474]/8', text: 'text-[#C09474]', bar: 'bg-[#C09474]' },
  career:      { bg: 'bg-[#78A88A]/8', text: 'text-[#78A88A]', bar: 'bg-[#78A88A]' },
  personal:    { bg: 'bg-[#B090BC]/8', text: 'text-[#B090BC]', bar: 'bg-[#B090BC]' },
}
const DEFAULT_TYPE_COLOR = { bg: 'bg-[var(--surface)]', text: 'text-[var(--text-muted)]', bar: 'bg-[var(--text-soft)]' }

const TYPE_ICON_NAMES: Record<string, string> = {
  competitive: 'crosshair',
  opportunity: 'eye',
  risk:        'alert-triangle',
  strategic:   'check-circle',
  financial:   'dollar-sign',
  operational: 'settings',
  regulatory:  'shield',
  career:      'briefcase',
  personal:    'heart',
}

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
  const [expandedBranches, setExpandedBranches] = useState<Record<number, boolean>>({})
  if (steps.length === 0) return null

  const toggleBranch = (idx: number) => setExpandedBranches(prev => ({ ...prev, [idx]: !prev[idx] }))

  const iconFor = (name: string) => {
    const icons: Record<string, () => React.JSX.Element> = {
      crosshair: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="1"/></svg>,
      eye: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
      'alert-triangle': () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
      'check-circle': () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
      'dollar-sign': () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
      settings: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
      shield: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
      briefcase: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
      heart: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
      zap: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    }
    const Icon = icons[name] || icons.zap
    return <Icon />
  }

  return (
    <section className="mt-8">
      <h3 className="mb-4 font-display text-lg font-bold text-[var(--text)]">Why this matters to you</h3>

      {/* Mobile: horizontal snap-scroll | Desktop: 2-col grid */}
      <div className="scrollbar-hide flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 -mx-6 px-6 md:mx-0 md:px-0 md:grid md:grid-cols-2 md:overflow-visible md:pb-0">
        {steps.map((step, i) => {
          const typeKey = step.type?.toLowerCase() || ''
          const color = TYPE_COLORS[typeKey] || DEFAULT_TYPE_COLOR
          const typeLabel = step.consequence_types?.[0] ?? step.type ?? 'impact'
          const iconName = TYPE_ICON_NAMES[typeKey] || 'zap'
          const hasBranches = step.branches && step.branches.length > 0
          const branchOpen = expandedBranches[i]

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.25 }}
              className="snap-start shrink-0 w-[280px] rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 md:w-auto md:shrink"
            >
              <div>
                {/* Type + weight row */}
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={color.text}>{iconFor(iconName)}</span>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--text-soft)]">
                      {typeLabel}
                    </span>
                  </div>
                  {step.weight > 0 && (
                    <span className="font-mono text-[10px] text-[var(--text-soft)]">{Math.round(step.weight * 100)}%</span>
                  )}
                </div>

                {/* Dimension title */}
                <h4 className="mb-1 text-[14px] font-bold leading-snug text-[var(--text)]">
                  {step.dimension}
                </h4>

                {/* Description */}
                <p className="text-[12px] leading-relaxed text-[var(--text-muted)] line-clamp-3">
                  {step.articleChain || step.chain}
                </p>

                {/* Scenarios (animated toggle) */}
                {hasBranches && (
                  <div className="mt-2.5">
                    <button
                      onClick={() => toggleBranch(i)}
                      className="flex items-center gap-1 text-[11px] font-medium text-[var(--text-muted)]"
                    >
                      <svg
                        width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        className={`transition-transform ${branchOpen ? 'rotate-90' : ''}`}
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                      {step.branches!.length} scenario{step.branches!.length !== 1 ? 's' : ''}
                    </button>
                    <AnimatePresence>
                      {branchOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 flex flex-col gap-1.5">
                            {step.branches!.map((b, bi) => (
                              <div key={bi} className="rounded-lg bg-[var(--surface)] px-3 py-2">
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${likelihoodStyle(b.likelihood).text}`}>
                                  {b.likelihood.replace(/_/g, ' ')}
                                </span>
                                <p className="mt-0.5 text-[11px] font-medium leading-snug text-[var(--text)]">{b.scenario}</p>
                                <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--text-muted)]">{b.detail}</p>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
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
      <div className="mb-6 flex items-center justify-between">
        <div className="h-5 w-20 animate-pulse rounded bg-[var(--surface)]" />
        <div className="h-9 w-24 animate-pulse rounded-lg bg-[var(--surface)]" />
      </div>

      <div className="mb-6 h-72 w-full animate-pulse rounded-xl bg-[var(--surface)]" />

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="min-w-0 flex-1">
          <div className="mb-4 h-12 w-11/12 animate-pulse rounded bg-[var(--surface)] lg:h-16" />
          <div className="mb-6 flex gap-3">
            <div className="h-6 w-24 animate-pulse rounded-full bg-[var(--surface)]" />
            <div className="h-6 w-20 animate-pulse rounded-full bg-[var(--surface)]" />
            <div className="h-6 w-28 animate-pulse rounded-full bg-[var(--surface)]" />
          </div>
          <div className="mb-4 grid grid-cols-3 gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-[var(--bg-elevated)]" />
            ))}
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
            <div className="mb-5 rounded-xl bg-[var(--text)] p-4">
              <div className="mb-3 h-3 w-24 animate-pulse rounded bg-[var(--bg)]/25" />
              <div className="h-4 w-full animate-pulse rounded bg-[var(--bg)]/20" />
              <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-[var(--bg)]/20" />
            </div>
            <div className="space-y-3">
              <div className="h-4 w-full animate-pulse rounded bg-[var(--surface)]" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-[var(--surface)]" />
              <div className="h-4 w-4/6 animate-pulse rounded bg-[var(--surface)]" />
            </div>
          </div>
        </div>

        <aside className="w-full shrink-0 space-y-4 lg:w-[340px]">
          <div className="h-48 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]" />
          <div className="h-36 animate-pulse rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]" />
        </aside>
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

  const signalId = typeof params?.id === 'string' ? params.id : ''

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
          <div className="mb-5 overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--text)] p-4 text-[var(--bg)] shadow-[0_18px_46px_rgba(0,0,0,0.16)]">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] opacity-65">
              Bottom line
            </p>
            <p className="mt-2 text-sm font-medium leading-6 opacity-90">
              {signal.synthesis}
            </p>
          </div>
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
              <div className="relative">
                <div className="absolute bottom-4 left-[6px] top-1 w-px bg-[var(--border-strong)]" aria-hidden="true" />
                {visibleTimeline.map((update, i) => (
                  <div key={update.id} className="relative grid grid-cols-[14px_minmax(0,1fr)] gap-3 pb-5 last:pb-0">
                    <div className="relative pt-1.5">
                      <span
                        className={`relative z-10 block h-3 w-3 rounded-full border-2 border-[var(--bg-elevated)] ${
                          i === 0 ? 'bg-accent-blue shadow-[0_0_0_4px_rgba(47,107,255,0.14)]' : 'bg-[var(--surface-strong)]'
                        }`}
                      />
                    </div>
                    <div className={`rounded-xl border p-3 ${
                      i === 0
                        ? 'border-[var(--border-strong)] bg-[var(--text)] text-[var(--bg)]'
                        : 'border-[var(--border)] bg-[var(--bg-elevated)]'
                    }`}>
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className={`text-xs font-medium ${i === 0 ? 'opacity-65' : 'text-[var(--text-soft)]'}`}>
                          {formatTimelineDate(update.created_at)}
                        </span>
                        {update.sourceCount > 0 && (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] ${i === 0 ? 'bg-[var(--bg)]/10 opacity-75' : 'bg-[var(--surface)] text-[var(--text-muted)]'}`}>
                            {update.sourceCount} source{update.sourceCount === 1 ? '' : 's'}
                          </span>
                        )}
                      </div>
                      {update.headline && (
                        <p className={`mb-1 text-sm font-semibold ${i === 0 ? '' : 'text-[var(--text)]'}`}>{update.headline}</p>
                      )}
                      {update.delta_summary && (
                        <p className={`text-sm leading-relaxed ${i === 0 ? 'opacity-75' : 'text-[var(--text-muted)]'}`}>{update.delta_summary}</p>
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
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text)]"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <ShareButton signal={signal} variant="full" />
      </div>

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
            className="mb-4 max-w-4xl font-display text-3xl font-semibold leading-[1.02] tracking-[-0.055em] text-[var(--text)] sm:text-4xl lg:text-5xl"
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
          <div className="mb-4 flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1">
            {TABS.map((tab) => {
              const Icon = TAB_ICONS[tab]
              const active = activeTab === tab
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors sm:text-sm ${
                    active
                      ? 'bg-[var(--text)] text-[var(--bg)] shadow-[0_8px_24px_rgba(0,0,0,0.18)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                >
                  <Icon size={14} />
                  <span className="text-[11px] sm:text-sm">{tab}</span>
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
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]"
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

      {/* Floating Ask AI FAB */}
      <AskAIFab signalId={signal.id} headline={signal.headline} />
    </div>
  )
}
