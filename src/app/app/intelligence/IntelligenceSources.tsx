/* PHASE 4: HORIZONTAL SCROLLING CARD STRIP */
'use client'

import type { BriefSource } from '@/lib/intelligence/contracts'

interface IntelligenceSourcesProps {
  sources: BriefSource[]
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}

export default function IntelligenceSources({ sources }: IntelligenceSourcesProps) {
  if (!sources.length) return null

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-[var(--text)]">
        📚 Sources ({sources.length})
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
            <span
              className={`mt-auto w-fit rounded px-1.5 py-0.5 text-[10px] font-medium ${
                source.provider === 'exa'
                  ? 'bg-[var(--accent-teal)]/15 text-[var(--accent-teal)]'
                  : source.provider === 'tavily'
                    ? 'bg-[var(--accent-amber)]/15 text-[var(--accent-amber)]'
                    : 'bg-[var(--surface-strong)] text-[var(--text-muted)]'
              }`}
            >
              {source.provider}
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}
