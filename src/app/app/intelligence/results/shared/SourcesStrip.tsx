'use client'

import { ChevronDown, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import type { BriefSource } from '@/lib/intelligence/contracts'

type SourceRoleTag = 'cited' | 'supporting' | 'counter' | 'internal' | 'excluded'
type SourceView = SourceRoleTag | 'all'
type ExtendedSource = BriefSource & { role?: SourceRoleTag; excerpt?: string }

interface SourcesStripProps {
  sources: BriefSource[]
}

interface LedgerGroup {
  key: SourceRoleTag
  title: string
  description: string
  accent: string
  sources: ExtendedSource[]
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

function sourceBadges(source: ExtendedSource): Array<{ label: string; tone: string }> {
  const badges: Array<{ label: string; tone: string }> = []

  if (source.sourceRole === 'primary') badges.push({ label: 'Primary', tone: 'var(--accent-amber)' })
  if (isFreshSource(source)) badges.push({ label: 'Fresh', tone: 'var(--accent-amber)' })

  return badges
}

function resolveRole(source: ExtendedSource): SourceRoleTag {
  if (source.role) return source.role
  if (source.sourceRole === 'counter_evidence') return 'counter'
  if (source.usedInAnswer) return 'cited'
  if (source.provider === 'internal' || source.sourceRole === 'internal_memory') return 'internal'
  return 'supporting'
}

function groupSources(sources: BriefSource[]): LedgerGroup[] {
  const extended = sources as ExtendedSource[]

  const buckets: Record<SourceRoleTag, ExtendedSource[]> = {
    cited: [],
    supporting: [],
    counter: [],
    internal: [],
    excluded: [],
  }

  for (const source of extended) {
    buckets[resolveRole(source)].push(source)
  }

  const groups: LedgerGroup[] = [
    {
      key: 'cited',
      title: 'Cited in answer',
      description: 'Sources directly cited in the published brief.',
      accent: 'var(--accent-teal)',
      sources: buckets.cited,
    },
    {
      key: 'supporting',
      title: 'Supporting',
      description: 'Evidence gathered and ranked for the run but not cited in the final answer.',
      accent: 'var(--accent-amber)',
      sources: buckets.supporting,
    },
    {
      key: 'counter',
      title: 'Counter-evidence',
      description: 'Signals that complicate or contradict the verdict.',
      accent: 'var(--accent-coral)',
      sources: buckets.counter,
    },
    {
      key: 'internal',
      title: 'Internal memory',
      description: 'Prior context from the internal corpus or saved intelligence memory.',
      accent: 'var(--accent-lime, var(--accent-teal))',
      sources: buckets.internal,
    },
    {
      key: 'excluded',
      title: 'Excluded',
      description: 'Sources intentionally excluded from synthesis (duplicates, low authority, out of scope).',
      accent: 'var(--text-soft)',
      sources: buckets.excluded,
    },
  ]

  return groups.filter((group) => group.sources.length > 0)
}

function SourceRow({ source, accent }: { source: ExtendedSource; accent: string }) {
  const [expanded, setExpanded] = useState(false)
  const visualUrl = source.imageUrl || source.faviconUrl || null
  const badges = sourceBadges(source)
  const excerpt = source.excerpt?.trim() || source.snippet?.trim() || null
  const hasLongExcerpt = (excerpt?.length ?? 0) > 220
  const displayedExcerpt = excerpt && hasLongExcerpt && !expanded
    ? `${excerpt.slice(0, 220).trim().replace(/[\s,.;:!?-]+$/, '')}…`
    : excerpt

  const roleLabel = resolveRole(source)

  return (
    <article id={`source-${source.id}`} className="intel-source-card rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 transition-colors hover:bg-[var(--bg-elevated)]/80">
      <div className="flex items-start gap-3">
        {visualUrl && (
          <div className="mt-0.5 h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg)]">
            <img
              src={visualUrl}
              alt=""
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: source.imageUrl ? 'cover' : 'contain' }}
            />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              {/* Title first */}
              <p className="text-sm font-medium leading-relaxed text-[var(--text)]">{source.title}</p>
              {/* Domain second, with date + role */}
              <p className="mono mt-1 text-[10px] uppercase tracking-[0.16em] text-[var(--text-soft)]">
                <span>{source.domain}</span>
                {source.publishedAt ? <span> · {formatDate(source.publishedAt)}</span> : null}
                <span> · {roleLabel}</span>
              </p>
            </div>

            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mono inline-flex shrink-0 items-center justify-center rounded-full border border-[var(--border)] px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-[var(--accent)] transition-colors hover:border-[var(--accent)]"
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
            <span
              className="rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em]"
              style={{
                color: accent,
                borderColor: `color-mix(in oklch, ${accent} 35%, var(--border))`,
                background: `color-mix(in oklch, ${accent} 10%, transparent)`,
              }}
            >
              {roleLabel}
            </span>
            {/* Internal ID last, de-emphasized */}
            <span className="mono ml-auto text-[10px] uppercase tracking-[0.16em] text-[var(--text-soft)]/80">
              [{source.id}]
            </span>
          </div>

          {displayedExcerpt && (
            <div className="mt-3">
              <p className="text-sm leading-relaxed text-[var(--text-muted)]">{displayedExcerpt}</p>
              {hasLongExcerpt && (
                <button
                  type="button"
                  onClick={() => setExpanded((value) => !value)}
                  className="mono mt-2 text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]"
                >
                  {expanded ? 'Show less' : 'Expand excerpt'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

interface GroupSectionProps {
  group: LedgerGroup
  collapsed: boolean
  onToggle: () => void
}

function GroupSection({ group, collapsed, onToggle }: GroupSectionProps) {
  const panelId = `sources-group-${group.key}`

  return (
    <section>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-transparent px-2 py-1.5 text-left transition-colors hover:border-[var(--border)]"
      >
        <div className="flex items-center gap-2">
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5 text-[var(--text-soft)]" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-[var(--text-soft)]" aria-hidden="true" />
          )}
          <span
            className="kicker"
            style={{ color: group.accent }}
          >
            {group.title}
          </span>
          <span className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-soft)]">
            {group.sources.length}
          </span>
        </div>
      </button>

      {!collapsed && (
        <div id={panelId} className="mt-2">
          <p className="px-2 text-sm leading-relaxed text-[var(--text-muted)]">{group.description}</p>
          <div className="mt-3 space-y-3">
            {group.sources.map((source) => (
              <SourceRow key={source.id} source={source} accent={group.accent} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export default function SourcesStrip({ sources }: SourcesStripProps) {
  const groups = useMemo(() => groupSources(sources), [sources])
  const [activeRole, setActiveRole] = useState<SourceView>('all')
  const [openGroups, setOpenGroups] = useState<Set<SourceRoleTag>>(() => new Set())

  if (!sources.length) return null

  const visibleGroups = activeRole === 'all'
    ? groups
    : groups.filter((group) => group.key === activeRole)
  const visibleKeys = visibleGroups.map((group) => group.key)
  const allVisibleOpen = visibleGroups.length > 0 && visibleGroups.every((group) => openGroups.has(group.key))

  const setRole = (role: SourceView) => {
    setActiveRole(role)
    if (role !== 'all') setOpenGroups(new Set([role]))
  }

  const toggleGroup = (key: SourceRoleTag) => {
    setOpenGroups((current) => {
      const next = new Set(current)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const setAllVisible = (open: boolean) => {
    setOpenGroups((current) => {
      const next = new Set(current)
      for (const key of visibleKeys) {
        if (open) {
          next.add(key)
        } else {
          next.delete(key)
        }
      }
      return next
    })
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)]">
      <div className="border-b border-[var(--border)] px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <span className="kicker">Evidence ledger · {sources.length}</span>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--text-muted)]">
              Sources start closed so the brief stays readable. Open the ledger when you want to inspect the proof behind the claims.
            </p>
          </div>

          <button
            type="button"
            className="mono inline-flex w-fit items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text)]"
            onClick={() => setAllVisible(!allVisibleOpen)}
          >
            {allVisibleOpen ? 'Collapse all' : 'Expand shown'}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Evidence filter">
          <FilterButton active={activeRole === 'all'} onClick={() => setRole('all')}>
            All evidence
          </FilterButton>
          {groups.map((group) => (
            <FilterButton
              key={group.key}
              active={activeRole === group.key}
              accent={group.accent}
              onClick={() => setRole(group.key)}
            >
              {group.title} · {group.sources.length}
            </FilterButton>
          ))}
        </div>
      </div>

      <div className="space-y-5 px-5 py-5">
        {visibleGroups.map((group) => (
          <GroupSection
            key={group.key}
            group={group}
            collapsed={!openGroups.has(group.key)}
            onToggle={() => toggleGroup(group.key)}
          />
        ))}
      </div>
    </div>
  )
}

function FilterButton({
  active,
  accent,
  onClick,
  children,
}: {
  active: boolean
  accent?: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className="mono rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] transition-colors"
      style={{
        color: active ? (accent ?? 'var(--text)') : 'var(--text-muted)',
        borderColor: active ? (accent ?? 'var(--accent)') : 'var(--border)',
        background: active
          ? `color-mix(in oklch, ${accent ?? 'var(--accent)'} 12%, transparent)`
          : 'var(--surface)',
      }}
    >
      {children}
    </button>
  )
}
