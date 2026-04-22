'use client'

import { useState } from 'react'
import type { BriefSource } from '@/lib/intelligence/contracts'

interface SourcesStripProps {
  sources: BriefSource[]
}

interface LedgerGroup {
  key: 'used' | 'supporting' | 'internal'
  title: string
  description: string
  sources: BriefSource[]
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return ''
  }
}

function isFreshSource(source: BriefSource): boolean {
  if (source.sourceRole === 'fresh_news') return true
  if (!source.publishedAt) return false

  const published = new Date(source.publishedAt).getTime()
  if (Number.isNaN(published)) return false

  const ageMs = Date.now() - published
  return ageMs >= 0 && ageMs <= 1000 * 60 * 60 * 24 * 45
}

function sourceBadges(source: BriefSource): Array<{ label: string; tone: string }> {
  const badges: Array<{ label: string; tone: string }> = []

  if (source.usedInAnswer) badges.push({ label: 'Used', tone: 'var(--accent-teal)' })
  if (source.provider === 'internal' || source.sourceRole === 'internal_memory') {
    badges.push({ label: 'Internal', tone: 'var(--accent-lime, var(--accent-teal))' })
  }
  if (source.sourceRole === 'primary') badges.push({ label: 'Primary', tone: 'var(--accent-amber)' })
  if (isFreshSource(source)) badges.push({ label: 'Fresh', tone: 'var(--accent-amber)' })
  if (source.sourceRole === 'counter_evidence') badges.push({ label: 'Counterpoint', tone: 'var(--accent-coral)' })

  return badges
}

function groupSources(sources: BriefSource[]): LedgerGroup[] {
  const used = sources.filter((source) => source.usedInAnswer)
  const internal = sources.filter((source) => !source.usedInAnswer && (source.provider === 'internal' || source.sourceRole === 'internal_memory'))
  const supporting = sources.filter((source) => !source.usedInAnswer && !internal.includes(source))

  const groups: LedgerGroup[] = [
    {
      key: 'used',
      title: 'Used in answer',
      description: 'These sources were cited directly in the brief output.',
      sources: used,
    },
    {
      key: 'supporting',
      title: 'Supporting but unused',
      description: 'Relevant evidence gathered for the run, but not cited in the final answer.',
      sources: supporting,
    },
    {
      key: 'internal',
      title: 'Internal memory',
      description: 'Relevant context from prior memory or internal corpus retrieval.',
      sources: internal,
    },
  ]

  return groups.filter((group) => group.sources.length > 0)
}

function SourceRow({ source }: { source: BriefSource }) {
  const [expanded, setExpanded] = useState(false)
  const hasSnippet = !!source.snippet
  const visualUrl = source.imageUrl || source.faviconUrl || null
  const badges = sourceBadges(source)
  const hasLongSnippet = (source.snippet?.length ?? 0) > 220
  const snippet = hasLongSnippet && !expanded
    ? `${source.snippet?.slice(0, 220).trim().replace(/[\s,.;:!?-]+$/, '')}…`
    : source.snippet

  return (
    <article id={`source-${source.id}`} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 transition-colors hover:bg-[var(--bg-elevated)]/80">
      <div className="flex items-start gap-3">
        {visualUrl && (
          <div
            className="mt-0.5 h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg)]"
          >
            <img
              src={visualUrl}
              alt=""
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: source.imageUrl ? 'cover' : 'contain' }}
            />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium leading-relaxed text-[var(--text)]">{source.title}</p>
              <p className="mono mt-1 text-[10px] uppercase tracking-[0.16em] text-[var(--text-soft)]">
                {source.domain}
                {source.publishedAt ? ` · ${formatDate(source.publishedAt)}` : ''}
                {` · ${source.provider}`}
              </p>
            </div>

            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mono shrink-0 rounded-full border border-[var(--border)] px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-[var(--accent)] transition-colors hover:border-[var(--accent)]"
            >
              Open ↗
            </a>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {badges.map((badge) => (
              <span
                key={`${source.id}-${badge.label}`}
                className="rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em]"
                style={{
                  color: badge.tone,
                  borderColor: `color-mix(in oklch, ${badge.tone} 35%, var(--border))`,
                  background: `color-mix(in oklch, ${badge.tone} 12%, transparent)`,
                }}
              >
                {badge.label}
              </span>
            ))}
            <span className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-soft)]">[{source.id}]</span>
          </div>

          {hasSnippet && snippet && (
            <div className="mt-3">
              <p className="text-sm leading-relaxed text-[var(--text-muted)]">{snippet}</p>
              {hasLongSnippet && (
                <button
                  type="button"
                  onClick={() => setExpanded((value) => !value)}
                  className="mono mt-2 text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]"
                >
                  {expanded ? 'Show less' : 'Expand snippet'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

export default function SourcesStrip({ sources }: SourcesStripProps) {
  if (!sources.length) return null
  const groups = groupSources(sources)

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)]">
      <div className="border-b border-[var(--border)] px-5 py-4">
        <span className="kicker">Evidence ledger · {sources.length}</span>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--text-muted)]">
          Used sources were cited in the answer. Supporting sources were gathered for ranking but not cited. Internal memory reflects Relevant&apos;s own prior context or internal retrieval.
        </p>
      </div>

      <div className="space-y-6 px-5 py-5">
        {groups.map((group) => (
          <section key={group.key}>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <div>
                <p className="kicker">{group.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">{group.description}</p>
              </div>
              <span className="mono shrink-0 text-[10px] uppercase tracking-[0.16em] text-[var(--text-soft)]">
                {group.sources.length} source{group.sources.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="space-y-3">
              {group.sources.map((source) => (
                <SourceRow key={source.id} source={source} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
