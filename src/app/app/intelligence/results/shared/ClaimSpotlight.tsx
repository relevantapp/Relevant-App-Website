'use client'

import { Pin, PinOff, X } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import type { BriefSource } from '@/lib/intelligence/contracts'
import { useClaimSpotlight } from './ClaimSpotlightContext'

/**
 * Optional additive fields that downstream agents may attach to sources.
 * We type them inline to avoid touching the shared contract file.
 */
type SourceRoleTag = 'cited' | 'supporting' | 'counter' | 'internal' | 'excluded'
type ExtendedSource = BriefSource & { role?: SourceRoleTag; excerpt?: string }

interface ClaimSpotlightProps {
  sources: BriefSource[]
  /** Override the anchor id if the evidence room is mounted with a non-default id. */
  evidenceAnchorId?: string
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return 'date unknown'
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return 'date unknown'
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function resolveRole(source: ExtendedSource): SourceRoleTag {
  if (source.role) return source.role
  if (source.usedInAnswer) return 'cited'
  if (source.provider === 'internal' || source.sourceRole === 'internal_memory') return 'internal'
  if (source.sourceRole === 'counter_evidence') return 'counter'
  return 'supporting'
}

function roleToneFor(role: SourceRoleTag): { label: string; color: string } {
  switch (role) {
    case 'cited':
      return { label: 'Cited', color: 'var(--accent-teal)' }
    case 'supporting':
      return { label: 'Supporting', color: 'var(--accent-amber)' }
    case 'counter':
      return { label: 'Counter', color: 'var(--accent-coral)' }
    case 'internal':
      return { label: 'Internal', color: 'var(--accent-lime, var(--accent-teal))' }
    case 'excluded':
      return { label: 'Excluded', color: 'var(--text-soft)' }
  }
}

function trapTabKey(container: HTMLElement, event: KeyboardEvent) {
  if (event.key !== 'Tab') return

  const focusable = Array.from(
    container.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'),
  ).filter((element) => !element.hasAttribute('disabled'))

  if (focusable.length === 0) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

export default function ClaimSpotlight({ sources, evidenceAnchorId }: ClaimSpotlightProps) {
  const spotlight = useClaimSpotlight()
  const panelRef = useRef<HTMLDivElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)

  const anchorId = evidenceAnchorId ?? spotlight.evidenceAnchorId

  const sourceMap = useMemo(
    () => new Map(sources.map((source) => [source.id, source as ExtendedSource])),
    [sources],
  )

  const resolvedSources = useMemo(() => {
    if (!spotlight.active) return [] as ExtendedSource[]
    return spotlight.active.sourceIds
      .map((id) => sourceMap.get(id))
      .filter((value): value is ExtendedSource => Boolean(value))
  }, [spotlight.active, sourceMap])

  useEffect(() => {
    if (!spotlight.isOpen || !spotlight.pinned) return
    closeButtonRef.current?.focus()
  }, [spotlight.isOpen, spotlight.pinned])

  useEffect(() => {
    if (!spotlight.isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        spotlight.close(true)
        return
      }

      if (spotlight.pinned && panelRef.current) {
        trapTabKey(panelRef.current, event)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [spotlight])

  if (!spotlight.isOpen || !spotlight.active) return null

  const missingIds = spotlight.active.sourceIds.filter((id) => !sourceMap.has(id))
  const hintSnippet = spotlight.active.hint?.snippet?.trim() || null

  return (
    <>
      {spotlight.pinned && (
        <button
          type="button"
          aria-label="Close claim spotlight"
          onClick={() => spotlight.close(true)}
          className="fixed inset-0 z-30 hidden bg-black/20 md:block"
        />
      )}

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal={spotlight.pinned ? 'true' : 'false'}
        aria-label="Claim spotlight"
        className="pointer-events-auto fixed bottom-0 left-0 right-0 z-40 max-h-[80vh] overflow-y-auto border-t border-[var(--border)] bg-[var(--bg-elevated)] px-4 pb-5 pt-4 shadow-[0_-18px_60px_rgba(0,0,0,0.32)] sm:px-5 md:bottom-auto md:left-auto md:right-0 md:top-24 md:max-h-[calc(100vh-6rem)] md:w-[360px] md:rounded-l-2xl md:border-b md:border-l md:border-t md:px-5 md:pb-5 md:pt-5 md:shadow-[-24px_0_60px_rgba(0,0,0,0.28)]"
        onMouseLeave={() => {
          if (!spotlight.pinned) spotlight.close()
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="kicker">Claim spotlight</p>
            <p className="mt-1 text-xs text-[var(--text-soft)]">
              {resolvedSources.length} source{resolvedSources.length === 1 ? '' : 's'} back this claim
              {missingIds.length > 0 ? ` · ${missingIds.length} unavailable` : ''}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => (spotlight.pinned ? spotlight.unpin() : spotlight.pin())}
              aria-pressed={spotlight.pinned}
              aria-label={spotlight.pinned ? 'Unpin claim spotlight' : 'Pin claim spotlight open'}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              {spotlight.pinned ? <PinOff className="h-3.5 w-3.5" aria-hidden="true" /> : <Pin className="h-3.5 w-3.5" aria-hidden="true" />}
            </button>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => spotlight.close(true)}
              aria-label="Close claim spotlight"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {spotlight.active.hint?.claimLabel && (
          <p className="mt-3 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)]/70 px-3 py-2 text-xs leading-relaxed text-[var(--text-muted)]">
            “{spotlight.active.hint.claimLabel}”
          </p>
        )}

        <div className="mt-4 space-y-3">
          {resolvedSources.length === 0 && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm text-[var(--text-muted)]">
              Source records are not attached to this brief. Open the evidence room for the full ledger.
            </div>
          )}

          {resolvedSources.map((source) => {
            const role = resolveRole(source)
            const tone = roleToneFor(role)
            const excerpt = source.excerpt?.trim() || hintSnippet || source.snippet?.trim() || null

            return (
              <article
                key={source.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3"
              >
                <p className="text-sm font-medium leading-snug text-[var(--text)]">{source.title}</p>
                <p className="mono mt-1 text-[10px] uppercase tracking-[0.16em] text-[var(--text-soft)]">
                  {source.domain || '—'} · {formatDate(source.publishedAt)}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.16em]"
                    style={{
                      color: tone.color,
                      borderColor: `color-mix(in oklch, ${tone.color} 40%, var(--border))`,
                      background: `color-mix(in oklch, ${tone.color} 12%, transparent)`,
                    }}
                  >
                    {tone.label}
                  </span>
                  <span className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-soft)]">[{source.id}]</span>
                </div>

                {excerpt && (
                  <p className="mt-2 rounded-xl bg-[var(--bg-elevated)] px-2.5 py-2 text-xs leading-relaxed text-[var(--text-muted)]">
                    {excerpt}
                  </p>
                )}

                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mono mt-2 inline-flex text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]"
                >
                  Open source ↗
                </a>
              </article>
            )
          })}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-[var(--border)] pt-3">
          <a
            href={`#${anchorId}`}
            onClick={() => spotlight.close(true)}
            className="mono text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]"
          >
            Open evidence room →
          </a>
          <span className="text-[10px] text-[var(--text-soft)]">Enter pins · Esc closes</span>
        </div>
      </aside>
    </>
  )
}
