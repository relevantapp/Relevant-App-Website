/* ── Meeting Prep Panels — editorial design ──────────────── */

'use client'

import { motion, useReducedMotion } from 'framer-motion'
import {
  AlertTriangle,
  Boxes,
  BriefcaseBusiness,
  ChevronDown,
  Handshake,
  HelpCircle,
  Landmark,
  MessageSquare,
  Newspaper,
  ShieldAlert,
  Swords,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useId, type ReactNode } from 'react'
import {
  MEETING_PREP_RADAR_CATEGORIES,
  type AttendeeProfile,
  type BriefBullet,
  type CompanySnapshot,
  type CompetitorMatrixRow,
  type MeetingPrepBrief,
  type MeetingPrepRadarCategory,
  type RadarMetric,
  type TimelineEvent,
} from '@/lib/intelligence/contracts'

/* ── Bento Section Card ──────────────────────────────────────── */

type SectionVariant = 'news' | 'talking' | 'landmines' | 'questions' | 'competitors'

const VARIANT_COLOR: Record<SectionVariant, string> = {
  news: 'var(--text-muted)',
  talking: 'var(--accent-teal)',
  landmines: 'var(--accent-coral)',
  questions: 'var(--accent-violet)',
  competitors: 'var(--accent-amber)',
}

const RADAR_CATEGORY_LABELS: Record<MeetingPrepRadarCategory, string> = {
  budget: 'Budget',
  tech: 'Tech',
  competitor: 'Competition',
  champion: 'Champion',
  setup: 'Setup',
}

function getToneBackground(color: string): string {
  return `color-mix(in oklch, ${color} 14%, transparent)`
}

function collectUniqueSourceIds(sourceGroups: Array<string[] | undefined>, max = 4): string[] {
  const unique = new Set<string>()

  for (const group of sourceGroups) {
    for (const sourceId of group ?? []) {
      if (!sourceId) continue
      unique.add(sourceId)
      if (unique.size >= max) return Array.from(unique)
    }
  }

  return Array.from(unique)
}

function SourceChipRow({ sourceIds, onSourceClick }: { sourceIds: string[]; onSourceClick: (id: string) => void }) {
  if (!sourceIds.length) return null

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5">
      {sourceIds.map((id) => (
        <button key={id} onClick={() => onSourceClick(id)} className="source-chip">
          [{id}]
        </button>
      ))}
    </div>
  )
}

function EmptyStateCard({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)] px-5 py-6">
      <p className="kicker">Insufficient data</p>
      <p className="mt-2 text-sm font-medium text-[var(--text)]">{title}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">{description}</p>
    </div>
  )
}

function StatusPill({ label, tone }: { label: string; tone: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em]"
      style={{
        color: tone,
        borderColor: tone,
        background: getToneBackground(tone),
      }}
    >
      {label}
    </span>
  )
}

function BulletList({
  bullets,
  variant,
  onSourceClick,
}: {
  bullets: BriefBullet[]
  variant: SectionVariant
  onSourceClick: (id: string) => void
}) {
  const color = VARIANT_COLOR[variant]

  if (bullets.length === 0) {
    return <p className="text-sm text-[var(--text-muted)]">No sourced notes for this section yet.</p>
  }

  return (
    <div className="space-y-3">
      {bullets.slice(0, 5).map((bullet, index) => (
        <div key={`${bullet.text}-${index}`} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <div className="flex gap-3">
            <span className="mono pt-0.5 text-[10px] text-[var(--text-soft)]">{String(index + 1).padStart(2, '0')}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-relaxed text-[var(--text)]">{bullet.text}</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span
                  className={bullet.tag === 'fact' ? 'ev-tag ev-tag--fact' : 'ev-tag ev-tag--infer'}
                  style={bullet.tag === 'fact' ? undefined : { color }}
                >
                  {bullet.tag === 'fact' ? 'FACT' : 'INFER'}
                </span>
                {bullet.sourceIds.map((id) => (
                  <button key={id} onClick={() => onSourceClick(id)} className="source-chip">
                    [{id}]
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function BentoSection({
  title,
  icon,
  bullets,
  variant,
  onSourceClick,
}: {
  title: string
  icon: ReactNode
  bullets: BriefBullet[]
  variant: SectionVariant
  onSourceClick: (id: string) => void
}) {
  const color = VARIANT_COLOR[variant]

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)]">
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
        <span style={{ color }}>{icon}</span>
        <span className="kicker">{title}</span>
      </div>
      <div className="px-4 py-4">
        <BulletList bullets={bullets} variant={variant} onSourceClick={onSourceClick} />
      </div>
    </div>
  )
}

/* ── Snapshot Card ───────────────────────────────────────────── */

export function SnapshotCard({ snapshot }: { snapshot: CompanySnapshot }) {
  const facts = [
    snapshot.industry && ['Industry', snapshot.industry],
    snapshot.headquarters && ['HQ', snapshot.headquarters],
    snapshot.employeeCount && ['Size', snapshot.employeeCount],
    snapshot.fundingStage && ['Funding', snapshot.fundingStage],
    snapshot.lastFundingAmount && ['Last Round', snapshot.lastFundingAmount],
    snapshot.ceo && ['CEO', snapshot.ceo],
  ].filter(Boolean) as Array<[string, string]>

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)]">
      <div className="border-b border-[var(--border)] px-4 py-3">
        <span className="kicker">Company snapshot</span>
        <p className="mt-1 text-sm font-medium text-[var(--text)]">{snapshot.name}</p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{snapshot.description}</p>
      </div>
      <div className="grid-bordered grid grid-cols-1 sm:grid-cols-2" style={{ borderRadius: 0, border: 'none' }}>
        {facts.map(([label, value]) => (
          <div key={label} className="px-4 py-3">
            <span className="kicker" style={{ fontSize: 9, color: 'var(--text-soft)' }}>{label}</span>
            <p className="mono mt-1 text-sm text-[var(--text)]">{value}</p>
          </div>
        ))}
      </div>
      {snapshot.recentMilestone && (
        <div className="border-t border-[var(--border)] px-4 py-3" style={{ borderLeft: '2px solid var(--accent-amber)' }}>
          <span className="kicker" style={{ color: 'var(--accent-amber)' }}>Recent milestone</span>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text)]">{snapshot.recentMilestone}</p>
        </div>
      )}
    </div>
  )
}

/* ── People Card ─────────────────────────────────────────────── */

export function PeopleCard({ profiles }: { profiles: AttendeeProfile[] }) {
  if (!profiles.length) return null

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)]">
      <div className="border-b border-[var(--border)] px-4 py-3">
        <span className="kicker">Key people</span>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {profiles.map((person) => (
          <div
            key={person.name}
            className="flex items-start gap-3 px-4 py-3"
          >
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)]">
              <span className="mono text-[10px] font-semibold text-[var(--accent)]">{person.name.charAt(0)}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[var(--text)]">{person.name}</span>
                {person.linkedinUrl && (
                  <a href={person.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[var(--accent)]">↗</a>
                )}
              </div>
              {(person.title || person.company) && (
                <div className="mono mt-1 text-[11px] text-[var(--text-muted)]">
                  {[person.title, person.company].filter(Boolean).join(' · ')}
                </div>
              )}
              {person.background && (
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-soft)]">{person.background}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Momentum Gauge ─────────────────────────────────────────── */

function getMomentumTone(score: number): string {
  if (score >= 67) return 'var(--accent-teal)'
  if (score <= 33) return 'var(--accent-coral)'
  return 'var(--accent-amber)'
}

export function MomentumGauge({
  score,
  riskLevel,
  sentiment,
  sourceIds,
  onSourceClick,
}: {
  score?: number
  riskLevel?: MeetingPrepBrief['riskLevel']
  sentiment?: MeetingPrepBrief['sentiment']
  sourceIds: string[]
  onSourceClick: (id: string) => void
}) {
  const shouldReduceMotion = Boolean(useReducedMotion())

  if (typeof score !== 'number') {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
        <p className="kicker">Momentum</p>
        <p className="mt-2 text-sm font-medium text-[var(--text)]">No trustworthy momentum score yet</p>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
          The structured evidence is too thin to summarize account temperature safely.
        </p>
      </div>
    )
  }

  const tone = getMomentumTone(score)
  const normalizedScore = Math.max(0, Math.min(100, score)) / 100

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="kicker">Momentum</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
            Fast read on account temperature before you drop into the supporting evidence.
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {riskLevel && <StatusPill label={`Risk ${riskLevel}`} tone="var(--accent-coral)" />}
          {sentiment && <StatusPill label={`Sentiment ${sentiment}`} tone="var(--accent-teal)" />}
        </div>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-[minmax(0,220px)_1fr] md:items-center">
        <div className="mx-auto w-full max-w-[220px]">
          <svg viewBox="0 0 120 80" className="w-full" aria-label={`Momentum score ${score} out of 100`}>
            <path
              d="M 16 64 A 44 44 0 0 1 104 64"
              fill="none"
              stroke="var(--surface-strong)"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <motion.path
              d="M 16 64 A 44 44 0 0 1 104 64"
              fill="none"
              stroke={tone}
              strokeWidth="10"
              strokeLinecap="round"
              initial={{ pathLength: shouldReduceMotion ? normalizedScore : 0 }}
              animate={{ pathLength: normalizedScore }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.8, ease: 'easeOut' }}
            />
            <text x="60" y="52" textAnchor="middle" className="mono" style={{ fontSize: 24, fill: 'var(--text)' }}>
              {score}
            </text>
            <text x="60" y="66" textAnchor="middle" className="kicker" style={{ fill: 'var(--text-soft)' }}>
              account heat
            </text>
          </svg>
        </div>

        <div>
          <div className="grid grid-cols-3 gap-2">
            {[
              ['Cold', '0-33'],
              ['Watch', '34-66'],
              ['Hot', '67-100'],
            ].map(([label, range]) => (
              <div key={label} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-center">
                <p className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-soft)]">{label}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{range}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
            <p className="kicker">Signal support</p>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
              Use the sources below to validate why the brief considers this account warm, neutral, or at risk.
            </p>
            <SourceChipRow sourceIds={sourceIds} onSourceClick={onSourceClick} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Visual Timeline ───────────────────────────────────────── */

function getTimelineIcon(type: TimelineEvent['type']) {
  switch (type) {
    case 'funding':
      return Landmark
    case 'leadership':
      return Users
    case 'product':
      return Boxes
    case 'customer':
      return BriefcaseBusiness
    case 'partnership':
      return Handshake
    case 'competition':
      return Swords
    case 'risk':
      return ShieldAlert
    case 'market':
      return TrendingUp
    default:
      return Newspaper
  }
}

function getTimelineTone(impact: TimelineEvent['impact']): string {
  switch (impact) {
    case 'positive':
      return 'var(--accent-teal)'
    case 'negative':
      return 'var(--accent-coral)'
    case 'mixed':
      return 'var(--accent-amber)'
    default:
      return 'var(--accent)'
  }
}

export function VisualTimeline({
  events,
  onSourceClick,
}: {
  events?: TimelineEvent[]
  onSourceClick: (id: string) => void
}) {
  if (!events?.length) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
        <p className="kicker">Timeline</p>
        <div className="mt-4">
          <EmptyStateCard
            title="No timeline built yet"
            description="There was not enough date-specific evidence to lay out a reliable narrative of recent moves."
          />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="kicker">Timeline</p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
            Read the recent story arc before you decide which thread to lead with.
          </p>
        </div>
      </div>

      <div className="mt-5 hidden md:block">
        <div className="relative">
          <div className="absolute left-0 right-0 top-[4.35rem] h-px bg-[var(--border)]" />
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: `repeat(${events.length}, minmax(0, 1fr))` }}
          >
            {events.map((event, index) => {
              const Icon = getTimelineIcon(event.type)
              const tone = getTimelineTone(event.impact)

              return (
                <div key={`${event.date}-${index}`} className="group relative min-w-0 px-2">
                  <div className="min-h-[4rem] text-center">
                    <p className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-soft)]">{event.date}</p>
                    <div className="mt-2 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)]">
                      <Icon className="h-4 w-4" style={{ color: tone }} />
                    </div>
                  </div>

                  <div className="relative mt-4 flex justify-center">
                    <button
                      type="button"
                      className="relative z-10 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[var(--bg-elevated)]"
                      style={{ background: tone }}
                      aria-label={`View detail for ${event.text}`}
                    >
                      <span className="sr-only">Open event detail</span>
                    </button>
                  </div>

                  <div className="mt-5 min-h-[3.5rem] text-center">
                    <p
                      className="mx-auto max-w-[11rem] text-sm leading-5 text-[var(--text)]"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {event.text}
                    </p>
                  </div>

                  <div className="pointer-events-none absolute left-1/2 top-0 z-20 hidden w-64 -translate-x-1/2 -translate-y-[calc(100%+0.5rem)] rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3 shadow-[var(--shadow)] group-hover:block group-focus-within:block">
                    <p className="mono text-[10px] uppercase tracking-[0.16em]" style={{ color: tone }}>{event.type}</p>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--text)]">{event.text}</p>
                    <SourceChipRow sourceIds={event.sourceIds} onSourceClick={onSourceClick} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3 md:hidden">
        {events.map((event, index) => {
          const Icon = getTimelineIcon(event.type)
          const tone = getTimelineTone(event.impact)

          return (
            <div key={`${event.date}-${index}`} className="relative rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-elevated)]">
                  <Icon className="h-4 w-4" style={{ color: tone }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-soft)]">{event.date}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--text)]">{event.text}</p>
                  <SourceChipRow sourceIds={event.sourceIds} onSourceClick={onSourceClick} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Competitor Matrix ─────────────────────────────────────── */

function HarveyBall({ value, tone }: { value: number; tone: string }) {
  const clipId = useId()
  const clamped = Math.max(0, Math.min(4, value))
  const width = 4 + clamped * 4

  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" width={width} height="20" />
        </clipPath>
      </defs>
      <circle cx="10" cy="10" r="8" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="8" fill={tone} clipPath={`url(#${clipId})`} />
      <circle cx="10" cy="10" r="8" fill="transparent" stroke="var(--border-strong)" strokeWidth="1.5" />
    </svg>
  )
}

export function CompetitorMatrix({
  rows,
  onSourceClick,
}: {
  rows?: CompetitorMatrixRow[]
  onSourceClick: (id: string) => void
}) {
  if (!rows?.length) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
        <p className="kicker">Competitor matrix</p>
        <div className="mt-4">
          <EmptyStateCard
            title="No competitor matrix yet"
            description="The brief did not have enough competitive evidence to compare threat and overlap honestly."
          />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
      <p className="kicker">Competitor matrix</p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
        Compare who matters, how directly they overlap, and what edge they hold in the account.
      </p>

      <div className="mt-5 hidden md:grid md:grid-cols-[minmax(0,1.3fr)_0.8fr_0.8fr_minmax(0,1fr)] md:gap-3">
        <span className="kicker">Competitor</span>
        <span className="kicker">Threat</span>
        <span className="kicker">Overlap</span>
        <span className="kicker">Advantage</span>
      </div>

      <div className="mt-3 space-y-3">
        {rows.map((row) => (
          <div key={row.name} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1.3fr)_0.8fr_0.8fr_minmax(0,1fr)] md:items-center">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]">
                    <span className="mono text-[11px] font-semibold text-[var(--accent)]">{row.name.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--text)]">{row.name}</p>
                    {row.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {row.tags.map((tag) => (
                          <span key={tag} className="rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[var(--text-soft)]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <HarveyBall value={row.threatLevel} tone="var(--accent-coral)" />
                <span className="mono text-[11px] uppercase tracking-[0.14em]">{row.threatLevel}/4</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <HarveyBall value={row.marketOverlap} tone="var(--accent-amber)" />
                <span className="mono text-[11px] uppercase tracking-[0.14em]">{row.marketOverlap}/4</span>
              </div>

              <div>
                <span className="inline-flex rounded-full border border-[var(--border)] px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-[var(--accent-teal)]" style={{ background: getToneBackground('var(--accent-teal)') }}>
                  Advantage
                </span>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text)]">{row.advantage}</p>
              </div>
            </div>
            <SourceChipRow sourceIds={row.sourceIds} onSourceClick={onSourceClick} />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Risk Radar ────────────────────────────────────────────── */

function polarToCartesian(cx: number, cy: number, radius: number, angle: number) {
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  }
}

function getRadarPolygonPoints(metrics: RadarMetric[]): string {
  const cx = 110
  const cy = 110
  const maxRadius = 72

  const points = MEETING_PREP_RADAR_CATEGORIES.map((category, index) => {
    const metric = metrics.find((item) => item.category === category)
    const severity = metric ? Math.max(0, Math.min(5, metric.severity)) : 0
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / MEETING_PREP_RADAR_CATEGORIES.length
    const point = polarToCartesian(cx, cy, (severity / 5) * maxRadius, angle)

    return Number.isFinite(point.x) && Number.isFinite(point.y) ? `${point.x},${point.y}` : `${cx},${cy}`
  })

  return points.join(' ')
}

export function RiskRadar({
  metrics,
  onSourceClick,
}: {
  metrics?: RadarMetric[]
  onSourceClick: (id: string) => void
}) {
  const shouldReduceMotion = Boolean(useReducedMotion())

  if (!metrics?.length || metrics.length !== MEETING_PREP_RADAR_CATEGORIES.length) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
        <p className="kicker">Risk radar</p>
        <div className="mt-4">
          <EmptyStateCard
            title="Radar not shown"
            description="The brief needs all five evidence-backed axes before it can draw a reliable risk shape."
          />
        </div>
      </div>
    )
  }

  const polygonPoints = getRadarPolygonPoints(metrics)
  const cx = 110
  const cy = 110
  const maxRadius = 72

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
      <p className="kicker">Risk radar</p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
        Five fixed axes keep the risk picture comparable across briefs and prevent decorative chart noise.
      </p>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,240px)_1fr] xl:items-center">
        <div className="mx-auto w-full max-w-[240px]">
          <svg viewBox="0 0 220 220" className="w-full" aria-label="Meeting risk radar">
            {[1, 2, 3, 4, 5].map((level) => {
              const radius = (level / 5) * maxRadius
              const ringPoints = MEETING_PREP_RADAR_CATEGORIES.map((_, index) => {
                const angle = -Math.PI / 2 + (index * Math.PI * 2) / MEETING_PREP_RADAR_CATEGORIES.length
                const point = polarToCartesian(cx, cy, radius, angle)
                return `${point.x},${point.y}`
              }).join(' ')

              return (
                <polygon
                  key={level}
                  points={ringPoints}
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="1"
                />
              )
            })}

            {MEETING_PREP_RADAR_CATEGORIES.map((category, index) => {
              const angle = -Math.PI / 2 + (index * Math.PI * 2) / MEETING_PREP_RADAR_CATEGORIES.length
              const point = polarToCartesian(cx, cy, maxRadius + 18, angle)
              const axisEnd = polarToCartesian(cx, cy, maxRadius, angle)

              return (
                <g key={category}>
                  <line x1={cx} y1={cy} x2={axisEnd.x} y2={axisEnd.y} stroke="var(--border)" strokeWidth="1" />
                  <text
                    x={point.x}
                    y={point.y}
                    textAnchor="middle"
                    className="mono"
                    style={{ fontSize: 10, fill: 'var(--text-soft)' }}
                  >
                    {RADAR_CATEGORY_LABELS[category]}
                  </text>
                </g>
              )
            })}

            <motion.polygon
              points={polygonPoints}
              fill="color-mix(in oklch, var(--accent-coral) 24%, transparent)"
              stroke="var(--accent-coral)"
              strokeWidth="2"
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.92, transformOrigin: '110px 110px' }}
              animate={{ opacity: 1, scale: 1, transformOrigin: '110px 110px' }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.45, ease: 'easeOut' }}
            />

            {MEETING_PREP_RADAR_CATEGORIES.map((category, index) => {
              const metric = metrics.find((item) => item.category === category)
              if (!metric) return null

              const angle = -Math.PI / 2 + (index * Math.PI * 2) / MEETING_PREP_RADAR_CATEGORIES.length
              const point = polarToCartesian(cx, cy, (Math.max(0, Math.min(5, metric.severity)) / 5) * maxRadius, angle)

              return (
                <circle key={metric.category} cx={point.x} cy={point.y} r="3.5" fill="var(--accent-coral)" />
              )
            })}
          </svg>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {MEETING_PREP_RADAR_CATEGORIES.map((category) => {
            const metric = metrics.find((item) => item.category === category)
            if (!metric) return null

            return (
              <div key={category} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="kicker">{RADAR_CATEGORY_LABELS[category]}</p>
                  <span className="mono text-[11px] uppercase tracking-[0.14em] text-[var(--accent-coral)]">{metric.severity}/5</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text)]">{metric.details}</p>
                <SourceChipRow sourceIds={metric.sourceIds} onSourceClick={onSourceClick} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── Deep Dive Panels ──────────────────────────────────────── */

export function DeepDivePanels({
  sections,
  onSourceClick,
}: {
  sections: MeetingPrepBrief['sections']
  onSourceClick: (id: string) => void
}) {
  const configs: Array<{ title: string; icon: ReactNode; variant: SectionVariant; bullets: BriefBullet[] }> = [
    {
      title: 'What just happened',
      icon: <Newspaper className="h-4 w-4" />,
      variant: 'news',
      bullets: sections.whatJustHappened,
    },
    {
      title: 'Talking points',
      icon: <MessageSquare className="h-4 w-4" />,
      variant: 'talking',
      bullets: sections.talkingPoints,
    },
    {
      title: 'Landmines',
      icon: <AlertTriangle className="h-4 w-4" />,
      variant: 'landmines',
      bullets: sections.landmines,
    },
    {
      title: 'Questions to ask',
      icon: <HelpCircle className="h-4 w-4" />,
      variant: 'questions',
      bullets: sections.questionsToAsk,
    },
    {
      title: 'Competitor context',
      icon: <Swords className="h-4 w-4" />,
      variant: 'competitors',
      bullets: sections.competitorContext,
    },
  ]

  return (
    <div className="space-y-3">
      {configs.map((section, index) => {
        const color = VARIANT_COLOR[section.variant]

        return (
          <details
            key={section.title}
            open={index === 0}
            className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)]"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-2">
                <span style={{ color }}>{section.icon}</span>
                <div>
                  <p className="kicker">Deep dive</p>
                  <p className="mt-1 text-sm font-medium text-[var(--text)]">{section.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-soft)]">{section.bullets.length} notes</span>
                <ChevronDown className="h-4 w-4 text-[var(--text-soft)] transition-transform group-open:rotate-180" />
              </div>
            </summary>
            <div className="border-t border-[var(--border)] px-4 py-4">
              <BulletList bullets={section.bullets} variant={section.variant} onSourceClick={onSourceClick} />
            </div>
          </details>
        )
      })}
    </div>
  )
}

/* ── Dashboard source helper ───────────────────────────────── */

export function getMeetingPrepGaugeSourceIds(brief: MeetingPrepBrief): string[] {
  return collectUniqueSourceIds([
    brief.timelineEvents?.flatMap((event) => event.sourceIds),
    brief.radarMetrics?.flatMap((metric) => metric.sourceIds),
    brief.sections.whatJustHappened.flatMap((bullet) => bullet.sourceIds),
  ])
}
