'use client'

import type { BriefSource, WatchItem } from '@/lib/intelligence/contracts'
import AsOfChip from '../AsOfChip'
import ClaimFeedback from '../ClaimFeedback'
import ExhibitShell from '../ExhibitShell'

function getWatchSources(sourceIds: string[], sources: BriefSource[]) {
  return sourceIds
    .map((sourceId) => sources.find((source) => source.id === sourceId))
    .filter(Boolean) as BriefSource[]
}

interface WatchListProps {
  data: WatchItem[]
  headline: string
  subhead?: string
  asOf: string
  sources: BriefSource[]
  now?: Date
}

export default function WatchList({ data, headline, subhead, asOf, sources, now }: WatchListProps) {
  if (data.length === 0) {
    return (
      <ExhibitShell headline={headline} subhead={subhead} asOf={asOf} sources={sources}>
        <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)] px-5 py-5 text-sm text-[var(--text-muted)]">
          No watch signals surfaced yet.
        </div>
      </ExhibitShell>
    )
  }

  return (
    <ExhibitShell headline={headline} subhead={subhead} asOf={asOf} sources={sources}>
      <div className="grid gap-4">
        {data.map((item) => (
          <article
            key={`${item.signal}-${item.nextCheckBy}`}
            className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5"
            data-testid="watch-item"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h4 className="text-base font-semibold text-[var(--text)]">{item.signal}</h4>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{item.whyItMatters}</p>
              </div>
              <AsOfChip at={item.nextCheckBy} now={now} prefix="next check" />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {getWatchSources(item.sources, sources).map((source) => (
                <a
                  key={`${item.signal}-${source.id}`}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 text-[11px] text-[var(--text-soft)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text)]"
                >
                  {source.domain}
                </a>
              ))}
            </div>
            <ClaimFeedback
              className="mt-3"
              claimKey={`watch:${item.signal}:${item.nextCheckBy}`}
              claimText={`${item.signal} ${item.whyItMatters}`.trim()}
              sourceIds={item.sources}
            />
          </article>
        ))}
      </div>
    </ExhibitShell>
  )
}
