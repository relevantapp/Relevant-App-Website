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

function SummaryRow({
  label,
  value,
  detail,
}: {
  label: string
  value: string | number
  detail: string
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-t border-[var(--border)] py-3 first:border-t-0 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--text)]">{label}</p>
        <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{detail}</p>
      </div>
      <p className="font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text)]">
        {value}
      </p>
    </div>
  )
}

function MetricTile({
  label,
  value,
  caption,
}: {
  label: string
  value: string | number
  caption: string
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="font-display text-3xl font-semibold leading-none tracking-[-0.06em] text-[var(--text)]">
        {value}
      </p>
      <p className="mt-2 text-sm font-semibold text-[var(--text)]">{label}</p>
      <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{caption}</p>
    </div>
  )
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
  const noiseFiltered =
    sourceDocumentCount > 0
      ? Math.max(0, Math.min(99, 100 - Math.round((storyCount / sourceDocumentCount) * 100)))
      : 0

  return (
    <FeedBottomSheet
      open={open}
      onClose={onClose}
      title="Your Relevance Summary"
      description="What Relevant checked, filtered, and showed for you."
      maxWidthClassName="max-w-[460px]"
    >
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-soft)]">
          <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
          Live
          <span className="ml-auto font-normal normal-case tracking-normal">updated from your feed</span>
        </div>

        <div className="grid grid-cols-3 gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1">
          {['7D', '30D', 'All'].map((range) => (
            <button
              key={range}
              type="button"
              className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                range === '7D'
                  ? 'bg-[var(--text)] text-[var(--bg)]'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        <section className="space-y-3">
          <div className="relative overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--text)] p-5 text-[var(--bg)] shadow-[0_18px_46px_rgba(0,0,0,0.18)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_12%,rgba(59,130,246,0.28),transparent_34%)]" aria-hidden="true" />
            <p className="relative font-mono text-[10px] font-semibold uppercase tracking-[0.22em] opacity-70">
              Time saved
            </p>
            <div className="mt-3 flex items-end gap-2">
              <span className="relative font-display text-[4rem] font-semibold leading-none tracking-[-0.06em]">
                {formatHours(timeSavedHours)}
              </span>
              {typeof timeSavedHours === 'number' && timeSavedHours > 0 ? (
                <span className="relative pb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] opacity-70">
                  hrs
                </span>
              ) : null}
            </div>
            <p className="relative mt-3 text-sm leading-6 opacity-70">
              {storyCount} stories from {sourceDocumentCount} source documents across {rangeLabel}.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MetricTile label="Noise filtered" value={`${noiseFiltered}%`} caption="Only the strongest stories reached you." />
            <MetricTile label="Sources" value={sourceDocumentCount} caption="Source documents checked for relevance." />
            <MetricTile label="Publishers" value={publisherCount} caption="Distinct outlets represented." />
            <MetricTile label="Coverage" value={formatDecimal(averageSourcesPerStory)} caption="Sources per story on average." />
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
            <SummaryRow label="Checked" value={sourceDocumentCount} detail="Documents read and compressed." />
            <SummaryRow label="Shown" value={storyCount} detail="Stories that made it through." />
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-soft)]">
              Week rhythm
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
              {activeDaysCount} active days. {strongestBucket ? `${strongestBucket.label} led the week.` : 'No dominant story type yet.'}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex min-h-[132px] items-end gap-2 sm:gap-3">
              {activity.map((point, index) => {
                const height = point.count === 0 ? 0 : Math.max(10, (point.count / maxActivity) * 92)
                const isLast = index === activity.length - 1

                return (
                  <div key={`${point.label}-${index}`} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                    <span className={`text-[10px] font-semibold ${isLast ? 'text-[var(--text)]' : 'text-[var(--text-soft)]'}`}>
                      {point.count}
                    </span>
                    <div className="flex h-24 w-full items-end">
                      <div
                        className="w-full rounded-t-lg"
                        style={{
                          height,
                          backgroundColor: isLast ? 'var(--accent)' : 'var(--surface-strong)',
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
        </section>

        <section className="space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-soft)]">
              Story mix
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
              What kind of movement dominated the stories that reached the feed.
            </p>
          </div>

          <div className="space-y-3">
              {breakdown.map((item) => (
              <div key={item.label}>
                  <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-[var(--text)]">{item.label}</span>
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-soft)]">
                      {item.count}
                    </span>
                  </div>
                <div className="mt-2 h-1.5 rounded-full bg-[var(--surface)]">
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
        </section>

        <p className="border-t border-[var(--border)] pt-4 text-xs leading-5 text-[var(--text-soft)]">
          Time saved uses a 4.5-minute reading baseline per source document, matching the estimate used in mobile.
        </p>
      </div>
    </FeedBottomSheet>
  )
}
