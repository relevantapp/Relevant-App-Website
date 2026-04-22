'use client'

import type { BriefSource } from '@/lib/intelligence/contracts'

interface SourcePopoverProps {
  id: string
  source?: BriefSource
  snippet?: string | null
}

function formatPublishedDate(publishedAt: string | null) {
  if (!publishedAt) return 'date unavailable'

  const date = new Date(publishedAt)
  if (Number.isNaN(date.getTime())) return 'date unavailable'

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function SourcePopover({ id, source, snippet }: SourcePopoverProps) {
  const displaySnippet = snippet?.trim() || source?.snippet?.trim() || 'snippet unavailable'

  if (!source) {
    return (
      <div
        id={id}
        role="tooltip"
        className="absolute left-0 top-[calc(100%+0.5rem)] z-20 w-72 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-sm text-[var(--text-muted)] shadow-[0_18px_50px_rgba(0,0,0,0.18)]"
      >
        <p className="font-medium text-[var(--text)]">source no longer available.</p>
      </div>
    )
  }

  return (
    <div
      id={id}
      role="tooltip"
      className="absolute left-0 top-[calc(100%+0.5rem)] z-20 w-80 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium leading-snug text-[var(--text)]">{source.title}</p>
          <p className="mt-1 text-xs text-[var(--text-soft)]">
            {source.domain} · {formatPublishedDate(source.publishedAt)}
          </p>
        </div>
      </div>

      <p className="mt-3 rounded-xl bg-[var(--surface)] px-3 py-2 text-sm leading-relaxed text-[var(--text-muted)]">
        {displaySnippet}
      </p>

      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex text-xs font-medium text-[var(--accent)] underline-offset-2 hover:underline"
      >
        Open source
      </a>
    </div>
  )
}
