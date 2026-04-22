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
import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import { MEETING_PREP_RADAR_CATEGORIES } from '@/lib/intelligence/contracts'
import type {
  AttendeeProfile,
  BriefBullet,
  Priority,
  CompanySnapshot,
  CompetitorMatrixRow,
  MeetingPrepBrief,
  MeetingPrepSnapshot,
  MeetingPrepRadarCategory,
  RadarMetric,
  TimelineEvent,
} from '@/lib/intelligence/contracts'
import { INTEL_RESULTS_V2 } from '@/lib/intelligence/feature-flags'
import { buildMeetingPrepSnapshot } from '@/lib/intelligence/meeting-prep-display'
import PriorityStrip from './shared/PriorityStrip'
import UnknownField from './shared/UnknownField'
import BulletChart from './shared/viz/BulletChart'
import Radar from './shared/viz/Radar'

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
          {`[${id}]`}
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
            {INTEL_RESULTS_V2 && <PriorityStrip priority={priorityForIndex(index)} />}
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
                    {`[${id}]`}
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

function priorityForIndex(index: number): Priority {
  if (index < 2) return 'must'
  if (index < 4) return 'should'
  return 'fyi'
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

function SnapshotFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--bg-elevated)] px-4 py-4">
      <p className="kicker text-[9px] text-[var(--text-soft)]">{label}</p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--text)]">{value}</p>
    </div>
  )
}

function isMeetingPrepSnapshot(snapshot: MeetingPrepSnapshot | CompanySnapshot): snapshot is MeetingPrepSnapshot {
  return 'summary' in snapshot && Array.isArray(snapshot.knownUnknowns)
}

export function SnapshotCard({ snapshot }: { snapshot: MeetingPrepSnapshot | CompanySnapshot }) {
  const displaySnapshot = isMeetingPrepSnapshot(snapshot)
    ? snapshot
    : buildMeetingPrepSnapshot(snapshot, snapshot.website)

  if (!displaySnapshot) return null

  const facts = [
    displaySnapshot.whatTheyDo && ['What they do', displaySnapshot.whatTheyDo],
    displaySnapshot.industry && ['Industry', displaySnapshot.industry],
    displaySnapshot.headquarters && ['HQ', displaySnapshot.headquarters],
    displaySnapshot.employeeRange && ['Size', displaySnapshot.employeeRange],
    displaySnapshot.funding && ['Funding', displaySnapshot.funding],
    displaySnapshot.ceo && ['CEO', displaySnapshot.ceo],
    displaySnapshot.website && ['Website', displaySnapshot.website.replace(/^https?:\/\//, '').replace(/\/$/, '')],
  ].filter(Boolean) as Array<[string, string]>

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)]">
      <div className="border-b border-[var(--border)] px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="kicker">Company snapshot</span>
            <p className="mt-1 text-base font-semibold text-[var(--text)]">{displaySnapshot.name}</p>
          </div>
          {displaySnapshot.website && (
            <a
              href={displaySnapshot.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mono shrink-0 rounded-full border border-[var(--border)] px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-[var(--accent)] transition-colors hover:border-[var(--accent)]"
            >
              Site ↗
            </a>
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
          <p className="text-sm leading-relaxed text-[var(--text)]">{displaySnapshot.summary}</p>
        </div>
      </div>

      {facts.length > 0 && (
        <div className="grid gap-px bg-[var(--border)] sm:grid-cols-2 xl:grid-cols-3">
          {facts.map(([label, value]) => (
            <SnapshotFact key={label} label={label} value={value} />
          ))}
        </div>
      )}

      {(displaySnapshot.recentMilestone || displaySnapshot.knownUnknowns.length > 0) && (
        <div className="space-y-px bg-[var(--border)]">
          {displaySnapshot.recentMilestone && (
            <div className="bg-[var(--bg-elevated)] px-5 py-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 h-8 w-1 shrink-0 rounded-full bg-[var(--accent-amber)]" />
                <div>
                  <p className="kicker text-[var(--accent-amber)]">Recent milestone</p>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text)]">{displaySnapshot.recentMilestone}</p>
                </div>
              </div>
            </div>
          )}

          {displaySnapshot.knownUnknowns.length > 0 && (
            <div className="bg-[var(--bg-elevated)] px-5 py-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 h-8 w-1 shrink-0 rounded-full bg-[var(--accent-violet)]" />
                <div>
                  <p className="kicker text-[var(--accent-violet)]">Known unknowns</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {displaySnapshot.knownUnknowns.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-[var(--accent-violet)]/35 bg-[color-mix(in_oklch,var(--accent-violet)_12%,transparent)] px-3 py-1.5 text-xs text-[var(--text-muted)]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
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
              {!person.title && !person.company && INTEL_RESULTS_V2 && (
                <div className="mt-2">
                  <UnknownField label="Role" />
                </div>
              )}
              {person.background ? (
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-soft)]">{person.background}</p>
              ) : INTEL_RESULTS_V2 ? (
                <div className="mt-2">
                  <UnknownField label="Background" />
                </div>
              ) : null}
              {!person.linkedinUrl && INTEL_RESULTS_V2 && (
                <div className="mt-2">
                  <UnknownField label="LinkedIn" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Momentum Summary ───────────────────────────────────────── */

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

      <div className="mt-5 grid gap-5 md:grid-cols-[minmax(0,280px)_1fr] md:items-center">
        <div className="mx-auto w-full max-w-[320px]">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.4, ease: 'easeOut' }}
          >
            <BulletChart
              value={score}
              targetBands={[
                { label: 'weak', from: 0, to: 40 },
                { label: 'watch', from: 40, to: 70 },
                { label: 'warm', from: 70, to: 100 },
              ]}
              label="Account state"
            />
          </motion.div>
        </div>

        <div>
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
            <p className="kicker">Signal support</p>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)]">
              Use the sources below to validate why the brief considers this account warm, watchful, or weak.
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
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-max gap-4 pr-2">
            {events.map((event, index) => {
              const Icon = getTimelineIcon(event.type)
              const tone = getTimelineTone(event.impact)

              return (
                <article
                  key={`${event.date}-${index}`}
                  className="flex w-[280px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
                >
                  <div className="border-b border-[var(--border)] px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-soft)]">{event.date}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-elevated)]">
                            <Icon className="h-4 w-4" style={{ color: tone }} />
                          </span>
                          <span
                            className="rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em]"
                            style={{
                              color: tone,
                              borderColor: `color-mix(in oklch, ${tone} 35%, var(--border))`,
                              background: getToneBackground(tone),
                            }}
                          >
                            {event.type}
                          </span>
                        </div>
                      </div>
                      <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: tone }} />
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col px-4 py-4">
                    <p className="text-sm leading-relaxed text-[var(--text)]">{event.text}</p>
                    <div className="mt-auto pt-4">
                      <SourceChipRow sourceIds={event.sourceIds} onSourceClick={onSourceClick} />
                    </div>
                  </div>
                </article>
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

      <div className="mt-5 hidden lg:grid lg:grid-cols-[minmax(0,1.25fr)_140px_140px_minmax(0,1fr)] lg:gap-3">
        <span className="kicker">Competitor</span>
        <span className="kicker">Threat</span>
        <span className="kicker">Overlap</span>
        <span className="kicker">Advantage</span>
      </div>

      <div className="mt-3 space-y-3">
        {rows.map((row) => (
          <div key={row.name} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_140px_140px_minmax(0,1fr)] lg:items-stretch">
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

              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-3">
                <p className="kicker">Threat</p>
                <div className="mt-3 flex items-center gap-2 text-sm text-[var(--text-muted)]">
                  <HarveyBall value={row.threatLevel} tone="var(--accent-coral)" />
                  <span className="mono text-[11px] uppercase tracking-[0.14em]">{row.threatLevel}/4</span>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-3">
                <p className="kicker">Overlap</p>
                <div className="mt-3 flex items-center gap-2 text-sm text-[var(--text-muted)]">
                  <HarveyBall value={row.marketOverlap} tone="var(--accent-amber)" />
                  <span className="mono text-[11px] uppercase tracking-[0.14em]">{row.marketOverlap}/4</span>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-3">
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

export function RiskRadar({
  metrics,
  onSourceClick,
}: {
  metrics?: RadarMetric[]
  onSourceClick: (id: string) => void
}) {
  const shouldReduceMotion = Boolean(useReducedMotion())
  const [activeIndex, setActiveIndex] = useState(0)
  const orderedMetrics = MEETING_PREP_RADAR_CATEGORIES.map((category) => metrics?.find((item) => item.category === category))
  const activeCategory = MEETING_PREP_RADAR_CATEGORIES[activeIndex] ?? MEETING_PREP_RADAR_CATEGORIES[0]
  const activeMetric = orderedMetrics[activeIndex]

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
      <p className="kicker">Risk radar</p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
        Five fixed axes keep the risk picture comparable across briefs, even when one or more dimensions remain unknown.
      </p>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,240px)_1fr] xl:items-center">
        <div className="mx-auto w-full max-w-[240px]">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.45, ease: 'easeOut' }}
          >
            <Radar
              categories={MEETING_PREP_RADAR_CATEGORIES.map((category) => RADAR_CATEGORY_LABELS[category])}
              values={orderedMetrics.map((metric) => metric?.severity)}
              max={5}
              label="Meeting risk radar"
              activeIndex={activeIndex}
              onActiveIndexChange={setActiveIndex}
            />
          </motion.div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {MEETING_PREP_RADAR_CATEGORIES.map((category, index) => {
              const metric = orderedMetrics[index]
              const active = index === activeIndex

              return (
                <button
                  key={category}
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onFocus={() => setActiveIndex(index)}
                  onClick={() => setActiveIndex(index)}
                  className={`rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                    active
                      ? 'border-[var(--accent-coral)] bg-[var(--surface)] text-[var(--text)]'
                      : 'border-[var(--border)] text-[var(--text-muted)]'
                  }`}
                >
                  {RADAR_CATEGORY_LABELS[category]}
                  <span className="ml-2 font-medium text-[var(--text-soft)]">{metric ? `${metric.severity}/5` : 'unknown'}</span>
                </button>
              )
            })}
          </div>

          <div className="flex min-h-[188px] h-full flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="kicker">{RADAR_CATEGORY_LABELS[activeCategory]}</p>
              {activeMetric ? (
                <span className="mono text-[11px] uppercase tracking-[0.14em] text-[var(--accent-coral)]">{activeMetric.severity}/5</span>
              ) : (
                <span className="mono text-[11px] uppercase tracking-[0.14em] text-[var(--text-soft)]">unknown</span>
              )}
            </div>

            {activeMetric ? (
              <>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--surface-strong)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent-coral)]"
                    style={{ width: `${Math.max(0, Math.min(5, activeMetric.severity)) * 20}%` }}
                  />
                </div>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--text)]">{activeMetric.details}</p>
                <div className="pt-3">
                  <SourceChipRow sourceIds={activeMetric.sourceIds} onSourceClick={onSourceClick} />
                </div>
              </>
            ) : (
              <div className="mt-4">
                <UnknownField label={RADAR_CATEGORY_LABELS[activeCategory]} queriesTried={[]} />
              </div>
            )}
          </div>
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
