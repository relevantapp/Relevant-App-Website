'use client'

import type { BriefSource } from '@/lib/intelligence/types'
import { ExternalLink } from 'lucide-react'

interface IntelligenceSourcesProps {
  sources: BriefSource[]
  highlightId?: string | null
}

function domainIcon(domain: string): string {
  if (domain.includes('linkedin')) return '🔗'
  if (domain.includes('crunchbase')) return '📊'
  if (domain.includes('twitter') || domain.includes('x.com')) return '🐦'
  if (domain.includes('github')) return '💻'
  return '🌐'
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

export default function IntelligenceSources({ sources, highlightId }: IntelligenceSourcesProps) {
  if (!sources.length) return null

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-[var(--text)]">
        Sources ({sources.length})
      </h3>
      <div className="space-y-1.5">
        {sources.map((source) => (
          <a
            key={source.id}
            id={`source-${source.id}`}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-[var(--surface-strong)] ${
              highlightId === source.id
                ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                : 'border-[var(--surface-strong)] bg-[var(--surface)]'
            }`}
          >
            <span className="mt-0.5 shrink-0 text-xs">{domainIcon(source.domain)}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate font-medium text-[var(--text)]">
                  {source.title}
                </span>
                <ExternalLink className="h-3 w-3 shrink-0 text-[var(--text-soft)]" />
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <span>{source.domain}</span>
                {source.publishedAt && (
                  <>
                    <span>·</span>
                    <span>{formatDate(source.publishedAt)}</span>
                  </>
                )}
                <span className={`rounded px-1 py-0.5 text-[10px] ${
                  source.provider === 'exa'
                    ? 'bg-[var(--accent-teal)]/15 text-[var(--accent-teal)]'
                    : 'bg-[var(--accent-amber)]/15 text-[var(--accent-amber)]'
                }`}>
                  {source.provider}
                </span>
              </div>
              {source.snippet && (
                <p className="mt-1 line-clamp-2 text-xs text-[var(--text-soft)]">
                  {source.snippet}
                </p>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
