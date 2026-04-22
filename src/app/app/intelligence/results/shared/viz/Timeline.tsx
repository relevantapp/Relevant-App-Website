'use client'

import { useState } from 'react'
import type { BriefSource, CompetitorProfile, TimelineEvent } from '@/lib/intelligence/contracts'
import ExhibitShell from '../ExhibitShell'

type TimelineMode = 'merged' | 'split'
type TimelineEventWithCompany = TimelineEvent & { company: string }

const IMPACT_COLOR: Record<TimelineEvent['impact'], string> = {
  positive: 'var(--accent-teal)',
  neutral: 'var(--text-soft)',
  negative: 'var(--accent-coral)',
  mixed: 'var(--accent-amber)',
}

const SHAPE_ORDER = ['circle', 'diamond', 'square', 'triangle'] as const
const ALL_EVENT_TYPES: TimelineEvent['type'][] = ['funding', 'leadership', 'product', 'customer', 'partnership', 'competition', 'risk', 'market']

function formatTimelineDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function getCompanyShape(company: string, companies: string[]) {
  const index = companies.indexOf(company)
  return SHAPE_ORDER[index % SHAPE_ORDER.length]
}

function getTimelineEvents(competitors: CompetitorProfile[]): TimelineEventWithCompany[] {
  return competitors.flatMap((competitor) =>
    (competitor.recentMovesTyped ?? []).map((event) => ({
      ...event,
      company: competitor.name,
    })),
  )
}

function getTimelineX(date: string, oldestMs: number, newestMs: number) {
  if (oldestMs === newestMs) return 40

  const currentMs = new Date(date).getTime()
  const normalized = (currentMs - oldestMs) / (newestMs - oldestMs)

  return 40 + normalized * 320
}

function getEventSourceChips(sourceIds: string[], sources: BriefSource[]) {
  return sourceIds.map((sourceId) => sources.find((source) => source.id === sourceId)).filter(Boolean) as BriefSource[]
}

interface TimelineProps {
  competitors: CompetitorProfile[]
  headline: string
  subhead?: string
  asOf: string
  sources: BriefSource[]
}

export default function Timeline({ competitors, headline, subhead, asOf, sources }: TimelineProps) {
  const [mode, setMode] = useState<TimelineMode>('merged')
  const [activeTypes, setActiveTypes] = useState<Set<TimelineEvent['type']>>(
    () => new Set<TimelineEvent['type']>(ALL_EVENT_TYPES),
  )
  const [activeEventId, setActiveEventId] = useState<string | null>(null)

  const timelineEvents = getTimelineEvents(competitors)
  const companies = competitors.map((competitor) => competitor.name)

  if (timelineEvents.length === 0) {
    return (
      <ExhibitShell headline={headline} subhead={subhead} asOf={asOf} sources={sources}>
        <div className="grid gap-4 md:grid-cols-3">
          {competitors.map((competitor) => (
            <div key={competitor.name} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
              <p className="text-sm font-semibold text-[var(--text)]">{competitor.name}</p>
              <div className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--text-muted)]">
                {competitor.recentMoves.map((move) => (
                  <p key={move}>• {move}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ExhibitShell>
    )
  }

  const filteredEvents = timelineEvents.filter((event) => activeTypes.has(event.type))
  const oldestMs = Math.min(...filteredEvents.map((event) => new Date(event.date).getTime()))
  const newestMs = Math.max(...filteredEvents.map((event) => new Date(event.date).getTime()))
  const activeEvent = filteredEvents.find((event) => `${event.company}-${event.date}-${event.text}` === activeEventId) ?? filteredEvents[0] ?? null

  return (
    <ExhibitShell headline={headline} subhead={subhead} asOf={asOf} sources={sources}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {ALL_EVENT_TYPES.map((type) => {
              const active = activeTypes.has(type)

              return (
                <button
                  key={type}
                  type="button"
                  className={`rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-elevated)] ${
                    active ? 'border-[var(--accent)] text-[var(--text)]' : 'border-[var(--border)] text-[var(--text-soft)]'
                  }`}
                  onClick={() => {
                    setActiveTypes((current) => {
                      const next = new Set(current)
                      if (next.has(type)) {
                        next.delete(type)
                      } else {
                        next.add(type)
                      }
                      return next
                    })
                  }}
                >
                  {type}
                </button>
              )
            })}
          </div>
          <div className="flex gap-2">
            {(['merged', 'split'] as TimelineMode[]).map((currentMode) => (
              <button
                key={currentMode}
                type="button"
                className={`rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-elevated)] ${
                  mode === currentMode ? 'border-[var(--accent)] text-[var(--text)]' : 'border-[var(--border)] text-[var(--text-soft)]'
                }`}
                onClick={() => setMode(currentMode)}
              >
                {currentMode === 'merged' ? 'Merged' : 'Per competitor'}
              </button>
            ))}
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)] px-5 py-5 text-sm text-[var(--text-muted)]">
            No competitor moves match the current filters.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4"
              data-testid={mode === 'merged' ? 'timeline-layout-merged' : 'timeline-layout-split'}
            >
              {mode === 'merged' ? (
                <div>
                  <div className="mb-3 flex flex-wrap gap-3 text-xs text-[var(--text-soft)]">
                    {companies.map((company) => (
                      <span key={company} className="inline-flex items-center gap-2">
                        <span className="inline-flex h-2.5 w-2.5 rounded-full border border-[var(--border-strong)] bg-[var(--bg-elevated)]" />
                        {company}
                      </span>
                    ))}
                  </div>
                  <svg viewBox="0 0 400 220" className="w-full" role="img" aria-label={`${headline}: ${filteredEvents.length} recent moves plotted over time`}>
                    <line x1="40" y1="140" x2="360" y2="140" stroke="var(--border)" strokeWidth="1.5" />
                    {filteredEvents.map((event) => {
                      const x = getTimelineX(event.date, oldestMs, newestMs)
                      const eventId = `${event.company}-${event.date}-${event.text}`
                      const shape = getCompanyShape(event.company, companies)

                      return (
                        <g
                          key={eventId}
                          data-testid="timeline-event"
                          tabIndex={0}
                          role="button"
                          aria-label={`${event.company} ${event.type} ${formatTimelineDate(event.date)}`}
                          onMouseEnter={() => setActiveEventId(eventId)}
                          onFocus={() => setActiveEventId(eventId)}
                          onClick={() => setActiveEventId(eventId)}
                        >
                          {shape === 'circle' ? <circle cx={x} cy="140" r="7" fill={IMPACT_COLOR[event.impact]} /> : null}
                          {shape === 'square' ? <rect x={x - 7} y={133} width="14" height="14" rx="3" fill={IMPACT_COLOR[event.impact]} /> : null}
                          {shape === 'diamond' ? <polygon points={`${x},130 ${x + 8},140 ${x},150 ${x - 8},140`} fill={IMPACT_COLOR[event.impact]} /> : null}
                          {shape === 'triangle' ? <polygon points={`${x},129 ${x + 8},146 ${x - 8},146`} fill={IMPACT_COLOR[event.impact]} /> : null}
                        </g>
                      )
                    })}
                    <text x="40" y="170" className="mono" style={{ fontSize: 10, fill: 'var(--text-soft)' }}>
                      {formatTimelineDate(new Date(oldestMs).toISOString())}
                    </text>
                    <text x="360" y="170" textAnchor="end" className="mono" style={{ fontSize: 10, fill: 'var(--text-soft)' }}>
                      {formatTimelineDate(new Date(newestMs).toISOString())}
                    </text>
                  </svg>
                </div>
              ) : (
                <div className="space-y-4">
                  {competitors.map((competitor, index) => {
                    const competitorEvents = filteredEvents.filter((event) => event.company === competitor.name)
                    if (competitorEvents.length === 0) return null

                    return (
                      <div key={competitor.name} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-[var(--text)]">{competitor.name}</p>
                          <span className="text-xs text-[var(--text-soft)]">{competitorEvents.length} move{competitorEvents.length === 1 ? '' : 's'}</span>
                        </div>
                        <svg viewBox={`0 0 400 ${80 + index * 0}`} className="w-full" role="img" aria-label={`${competitor.name} recent moves`}>
                          <line x1="40" y1="40" x2="360" y2="40" stroke="var(--border)" strokeWidth="1.5" />
                          {competitorEvents.map((event) => {
                            const x = getTimelineX(event.date, oldestMs, newestMs)
                            const eventId = `${event.company}-${event.date}-${event.text}`

                            return (
                              <g
                                key={eventId}
                                data-testid="timeline-event"
                                tabIndex={0}
                                role="button"
                                aria-label={`${event.company} ${event.type} ${formatTimelineDate(event.date)}`}
                                onMouseEnter={() => setActiveEventId(eventId)}
                                onFocus={() => setActiveEventId(eventId)}
                                onClick={() => setActiveEventId(eventId)}
                              >
                                <circle cx={x} cy="40" r="7" fill={IMPACT_COLOR[event.impact]} />
                              </g>
                            )
                          })}
                        </svg>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {activeEvent ? (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--text-soft)]">
                  {activeEvent.company} • {activeEvent.type}
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--text)]">{formatTimelineDate(activeEvent.date)}</p>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">{activeEvent.text}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {getEventSourceChips(activeEvent.sourceIds, sources).map((source) => (
                    <span key={source.id} className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[11px] text-[var(--text-soft)]">
                      {source.domain}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </ExhibitShell>
  )
}
