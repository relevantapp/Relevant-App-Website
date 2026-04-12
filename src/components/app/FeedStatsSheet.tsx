'use client'

import FeedBottomSheet from '@/components/app/FeedBottomSheet'

export type FeedStatsActivityPoint = {
  label: string
  count: number
}

export type FeedStatsBreakdownItem = {
  label: string
  count: number
  accent: string
}

type FeedStatsSheetProps = {
  open: boolean
  onClose: () => void
  timeSavedHours: number | null
  storyCount: number
  sourceDocumentCount: number
  publisherCount: number
  activeDaysCount: number
  averageSourcesPerStory: number | null
  rangeLabel: string
  activity: FeedStatsActivityPoint[]
  breakdown: FeedStatsBreakdownItem[]
}

function formatHours(value: number | null): string {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return '—'
  }
  return String(value)
}

function formatDecimal(value: number | null): string {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return '—'
  }
  return value >= 10 ? value.toFixed(1).replace(/\.0$/, '') : value.toFixed(1)
}

export default function FeedStatsSheet({
  open,
  onClose,
  timeSavedHours,
  storyCount,
  sourceDocumentCount,
  publisherCount,
  activeDaysCount,
  averageSourcesPerStory,
  rangeLabel,
  activity,
  breakdown,
}: FeedStatsSheetProps) {
  const maxActivity = Math.max(1, ...activity.map((point) => point.count))
  const maxBreakdown = Math.max(1, ...breakdown.map((item) => item.count))
  const strongestBucket = breakdown.find((item) => item.count > 0) ?? null

  return (
    <FeedBottomSheet
      open={open}
      onClose={onClose}
      title="Feed summary"
      description="A seven-day readout of what the feed reduced, grouped, and surfaced for you."
    >
      <div className="space-y-4">
        <section className="rounded-[28px] border border-[var(--border-strong)] bg-[var(--bg)] px-5 py-5 sm:px-6 sm:py-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-soft)]">
            Time saved · 7D
          </p>

          <div className="mt-4 flex items-end gap-2">
            <span className="font-display text-[3.4rem] font-semibold leading-none tracking-[-0.06em] text-[var(--text)] sm:text-[4.5rem]">
              {formatHours(timeSavedHours)}
            </span>
            {typeof timeSavedHours === 'number' && timeSavedHours > 0 ? (
              <span className="pb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-soft)]">
                hrs
              </span>
            ) : null}
          </div>

          <p className="mt-3 text-base font-medium text-[var(--text)]">
            Back in your week.
          </p>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
            {storyCount} stories distilled from {sourceDocumentCount} source documents across {rangeLabel}.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1 text-[11px] font-medium text-[var(--text-muted)]">
              {publisherCount} publishers in view
            </span>
            <span className="rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1 text-[11px] font-medium text-[var(--text-muted)]">
              {activeDaysCount} active days
            </span>
            {strongestBucket ? (
              <span className="rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1 text-[11px] font-medium text-[var(--text-muted)]">
                {strongestBucket.label} led the week
              </span>
            ) : null}
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[22px] border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-soft)]">
              Stories
            </p>
            <p className="mt-3 font-display text-3xl font-semibold tracking-[-0.05em] text-[var(--text)]">
              {storyCount}
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
              The stories that made the feed.
            </p>
          </div>

          <div className="rounded-[22px] border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-soft)]">
              Source docs
            </p>
            <p className="mt-3 font-display text-3xl font-semibold tracking-[-0.05em] text-[var(--text)]">
              {sourceDocumentCount}
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
              Individual documents compressed into those stories.
            </p>
          </div>

          <div className="rounded-[22px] border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-soft)]">
              Publishers
            </p>
            <p className="mt-3 font-display text-3xl font-semibold tracking-[-0.05em] text-[var(--text)]">
              {publisherCount}
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
              Distinct outlets represented this week.
            </p>
          </div>

          <div className="rounded-[22px] border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-soft)]">
              Avg. coverage
            </p>
            <p className="mt-3 font-display text-3xl font-semibold tracking-[-0.05em] text-[var(--text)]">
              {formatDecimal(averageSourcesPerStory)}
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
              Source documents per story on average.
            </p>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-elevated)] p-4 sm:p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-soft)]">
                  Week rhythm
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                  How many stories landed on each day in the current seven-day window.
                </p>
              </div>
            </div>

            <div className="mt-5 flex min-h-[190px] items-end gap-2 sm:gap-3">
              {activity.map((point, index) => {
                const height = point.count === 0 ? 0 : Math.max(12, (point.count / maxActivity) * 126)
                const isLast = index === activity.length - 1

                return (
                  <div key={`${point.label}-${index}`} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                    <span className={`text-[10px] font-semibold ${isLast ? 'text-[var(--text)]' : 'text-[var(--text-soft)]'}`}>
                      {point.count}
                    </span>
                    <div className="flex h-36 w-full items-end">
                      <div
                        className="w-full rounded-t-[12px]"
                        style={{
                          height,
                          backgroundColor: isLast ? 'var(--accent)' : 'color-mix(in srgb, var(--accent-teal) 78%, var(--surface-strong))',
                        }}
                      />
                    </div>
                    <span className={`font-mono text-[10px] uppercase tracking-[0.18em] ${isLast ? 'text-[var(--text)]' : 'text-[var(--text-soft)]'}`}>
                      {point.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-elevated)] p-4 sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-soft)]">
              Story mix
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
              What kind of movement dominated the stories that reached the feed.
            </p>

            <div className="mt-5 space-y-3">
              {breakdown.map((item) => (
                <div key={item.label} className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-[var(--text)]">{item.label}</span>
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-soft)]">
                      {item.count}
                    </span>
                  </div>
                    <div className="mt-2 h-1.5 rounded-full bg-[var(--bg-elevated)]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: item.count === 0 ? '0%' : `${Math.max(8, (item.count / maxBreakdown) * 100)}%`,
                        backgroundColor: item.accent,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <p className="text-xs leading-5 text-[var(--text-soft)]">
          Time saved uses a 4.5-minute reading baseline per source document, matching the estimate used in mobile.
        </p>
      </div>
    </FeedBottomSheet>
  )
}
