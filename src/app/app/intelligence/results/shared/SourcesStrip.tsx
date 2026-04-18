'use client'

import type { BriefSource } from '@/lib/intelligence/types'

interface SourcesStripProps {
  sources: BriefSource[]
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

export default function SourcesStrip({ sources }: SourcesStripProps) {
  if (!sources.length) return null

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-[var(--text)]">
        Sources ({sources.length})
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollSnapType: 'x mandatory' }}>
        {sources.map((source) => (
          <a
            key={source.id}
            id={`source-${source.id}`}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-40 flex-none flex-col gap-1.5 rounded-xl border border-[var(--surface-strong)] bg-[var(--surface)] p-3.5 transition-all hover:border-[var(--accent)]/40 intel-source-card"
            style={{ scrollSnapAlign: 'start' }}
          >
            <span className="text-[10px] font-bold text-[var(--text-soft)]">{source.id}</span>
            <span className="text-xs font-medium text-[var(--text)] line-clamp-2">{source.title}</span>
            <span className="text-[10px] text-[var(--text-muted)]">{source.domain}</span>
            {source.publishedAt && (
              <span className="text-[10px] text-[var(--text-soft)]">{formatDate(source.publishedAt)}</span>
            )}
          </a>
        ))}
      </div>
    </div>
  )
}
