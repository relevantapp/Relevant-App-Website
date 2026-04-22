'use client'

import type { BriefBullet, BriefSource, SignalCard } from '@/lib/intelligence/contracts'
import ClaimFeedback from '../ClaimFeedback'
import ExhibitShell from '../ExhibitShell'

interface SignalCardGridProps {
  cards?: SignalCard[]
  fallbackBullets?: BriefBullet[]
  asOf: string
  sources: BriefSource[]
  onSourceClick?: (id: string) => void
  flagEnabled?: boolean
}

export function getSignalCardTone(date: string, now = new Date()) {
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return 'stale'
  const diffDays = Math.floor((now.getTime() - parsed.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 7) return 'fresh'
  if (diffDays < 30) return 'recent'
  return 'stale'
}

function getToneColor(tone: 'fresh' | 'recent' | 'stale') {
  if (tone === 'fresh') return 'var(--accent-teal)'
  if (tone === 'recent') return 'var(--accent-amber)'
  return 'var(--text-soft)'
}

function formatDate(date: string) {
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function SignalCardGrid({
  cards,
  fallbackBullets,
  asOf,
  sources,
  onSourceClick,
  flagEnabled = true,
}: SignalCardGridProps) {
  if (!flagEnabled || !cards?.length) {
    if (!fallbackBullets?.length) return null

    return (
      <div data-testid="signal-card-fallback" className="space-y-3">
        {fallbackBullets.map((bullet, index) => (
          <div key={`${bullet.text}-${index}`} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
            <p className="text-sm leading-relaxed text-[var(--text)]">{bullet.text}</p>
          </div>
        ))}
      </div>
    )
  }

  return (
    <ExhibitShell headline="Here&apos;s what just moved" asOf={asOf} sources={sources}>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const tone = getSignalCardTone(card.date)
          const toneColor = getToneColor(tone)

          return (
            <article key={`${card.date}-${card.headline}`} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <span
                  data-tone={tone}
                  className="mono inline-flex rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em]"
                  style={{
                    color: toneColor,
                    borderColor: toneColor,
                    background: `color-mix(in oklch, ${toneColor} 12%, transparent)`,
                  }}
                >
                  {formatDate(card.date)}
                </span>
                {card.suggestedOpener && (
                  <button
                    type="button"
                    className="rounded-full border border-[var(--border)] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text)]"
                    onClick={() => navigator.clipboard.writeText(card.suggestedOpener as string)}
                  >
                    Copy opener
                  </button>
                )}
              </div>

              <p className="mt-3 text-sm font-semibold leading-relaxed text-[var(--text)]">{card.headline}</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{card.whyItMatters}</p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {card.sources.map((id) => (
                  <button key={id} onClick={() => onSourceClick?.(id)} className="source-chip">
                    [{id}]
                  </button>
                ))}
              </div>
              <ClaimFeedback
                claimKey={`signal-card:${card.date}:${card.headline}`}
                claimText={`${card.headline} ${card.whyItMatters}`.trim()}
                sourceIds={card.sources}
              />
            </article>
          )
        })}
      </div>
    </ExhibitShell>
  )
}
