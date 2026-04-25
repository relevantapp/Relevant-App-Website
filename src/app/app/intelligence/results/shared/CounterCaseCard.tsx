'use client'

import { AlertTriangle } from 'lucide-react'
import { useMemo } from 'react'
import type { BriefSource, TrustLayer } from '@/lib/intelligence/contracts'
import { useClaimSpotlight } from './ClaimSpotlightContext'

/**
 * Additive inline types — the shared contract file is owned elsewhere; we narrow locally.
 */
type ExtendedSource = BriefSource & {
  role?: 'cited' | 'supporting' | 'counter' | 'internal' | 'excluded'
  excerpt?: string
}

export interface CounterEvidenceItem {
  title: string
  detail: string
  sourceIds: string[]
}

interface CounterCaseCardProps {
  /** Explicit counter-evidence carried on the brief. If absent, the card derives items from sources + known unknowns. */
  counterEvidence?: CounterEvidenceItem[]
  sources?: BriefSource[]
  trust?: TrustLayer
  /** Optional id so the component can be anchor-linked. */
  id?: string
}

function deriveFromSources(sources: BriefSource[]): CounterEvidenceItem[] {
  const counterSources = (sources as ExtendedSource[]).filter(
    (source) => source.role === 'counter' || source.sourceRole === 'counter_evidence',
  )

  return counterSources.slice(0, 4).map((source) => ({
    title: source.title,
    detail:
      source.excerpt?.trim() ||
      source.snippet?.trim() ||
      `Evidence from ${source.domain || source.provider} that complicates the current verdict.`,
    sourceIds: [source.id],
  }))
}

function formatUnknown(question: string): CounterEvidenceItem {
  return {
    title: 'Unresolved gap',
    detail: question,
    sourceIds: [],
  }
}

export default function CounterCaseCard({ counterEvidence, sources, trust, id }: CounterCaseCardProps) {
  const spotlight = useClaimSpotlight()

  const items = useMemo<CounterEvidenceItem[]>(() => {
    if (counterEvidence?.length) return counterEvidence
    if (sources?.length) {
      const derived = deriveFromSources(sources)
      if (derived.length) return derived
    }
    return []
  }, [counterEvidence, sources])

  const unknowns = trust?.knownUnknowns ?? []
  const fallbackUnknowns = items.length === 0 ? unknowns.slice(0, 3).map((entry) => formatUnknown(entry.question)) : []

  const hasRealCounterCase = items.length > 0
  const renderedItems = hasRealCounterCase ? items : fallbackUnknowns

  return (
    <section
      id={id}
      aria-label="The case against this"
      className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
      style={{
        boxShadow: 'inset 4px 0 0 color-mix(in oklch, var(--accent-coral) 70%, transparent)',
      }}
    >
      <div className="flex items-start gap-3 border-b border-[var(--border)] px-5 py-4">
        <span
          className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          style={{
            color: 'var(--accent-coral)',
            background: 'color-mix(in oklch, var(--accent-coral) 14%, transparent)',
            border: '1px solid color-mix(in oklch, var(--accent-coral) 36%, var(--border))',
          }}
        >
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="kicker">Counter-case</p>
          <h3 className="mt-1 text-base font-medium text-[var(--text)]">The case against this.</h3>
          <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">
            {hasRealCounterCase
              ? 'Contradicting signals, caveats, and opposing evidence we surfaced during the run.'
              : 'No credible counter-evidence surfaced. These unresolved questions could still flip the verdict.'}
          </p>
        </div>
      </div>

      <div className="space-y-3 px-5 py-4">
        {renderedItems.length === 0 && (
          <p className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-4 text-sm leading-relaxed text-[var(--text-muted)]">
            No credible counter-evidence surfaced, and no open questions were logged for this run. Treat this as a
            soft positive — absence of a counter-case is not proof of one.
          </p>
        )}

        {renderedItems.map((item, index) => {
          const spanSourceIds = item.sourceIds ?? []
          const interactive = spanSourceIds.length > 0

          const handleActivate = () => {
            if (!interactive) return
            spotlight.openForClaim(`counter-case-${index}`, spanSourceIds, {
              snippet: item.detail,
              claimLabel: item.title,
            })
          }

          return (
            <article
              key={`${item.title}-${index}`}
              className={`rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 ${
                interactive ? 'cursor-pointer transition-colors hover:border-[var(--accent)]' : ''
              }`}
              {...(interactive
                ? {
                    role: 'button',
                    tabIndex: 0,
                    onMouseEnter: handleActivate,
                    onFocus: handleActivate,
                    onKeyDown: (event: React.KeyboardEvent) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        handleActivate()
                        spotlight.pin()
                      }
                    },
                  }
                : {})}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium leading-snug text-[var(--text)]">{item.title}</p>
                {spanSourceIds.length > 0 && (
                  <span className="mono shrink-0 text-[10px] uppercase tracking-[0.16em] text-[var(--text-soft)]">
                    {spanSourceIds.length} src
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{item.detail}</p>
            </article>
          )
        })}

        {!hasRealCounterCase && unknowns.length > 0 && (
          <p className="mono pt-1 text-[10px] uppercase tracking-[0.16em] text-[var(--text-soft)]">
            Known unknowns ({unknowns.length}) tracked in methodology.
          </p>
        )}
      </div>
    </section>
  )
}
