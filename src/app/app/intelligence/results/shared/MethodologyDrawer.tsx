'use client'

import { RefreshCcw, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { BriefSource, BriefStatus, Methodology, TrustLayer } from '@/lib/intelligence/contracts'

interface MethodologyDrawerProps {
  methodology?: Methodology
  trust?: TrustLayer
  status: BriefStatus
  sources?: BriefSource[]
  inputSummary?: string | null
}

interface ProviderSummary {
  name: string
  queriesRun: string[]
  docsReturned: number
}

function buildFallbackProviders(status: BriefStatus): ProviderSummary[] {
  const estimatedDocs = status.sourceCounts?.found ?? status.sourceCount
  const providers: ProviderSummary[] = []

  if ((status.internalMs ?? 0) > 0) {
    providers.push({
      name: 'Internal',
      queriesRun: ['Prior internal notes and saved intelligence context'],
      docsReturned: estimatedDocs,
    })
  }

  if ((status.exaMs ?? status.exaSearchMs ?? 0) > 0) {
    providers.push({
      name: 'Exa',
      queriesRun: ['External search plan ran through Exa'],
      docsReturned: estimatedDocs,
    })
  }

  if ((status.tavilyMs ?? status.tavilySearchMs ?? 0) > 0) {
    providers.push({
      name: 'Tavily',
      queriesRun: ['External search plan ran through Tavily'],
      docsReturned: estimatedDocs,
    })
  }

  return providers
}

function buildFallbackConfidenceDrivers(status: BriefStatus, trust?: TrustLayer) {
  const drivers = []

  if (trust?.sourcedClaimCount) drivers.push(`${trust.sourcedClaimCount} sourced claims surfaced in the current brief.`)
  if (status.sourceCount > 0) drivers.push(`${status.sourceCount} sources were used in the answer.`)
  drivers.push(status.degraded ? 'The run is degraded, so treat the result as directional.' : 'The run completed without a degraded flag.')

  return drivers
}

function trapTabKey(container: HTMLDivElement, event: KeyboardEvent) {
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

export default function MethodologyDrawer({
  methodology,
  trust,
  status,
  sources,
  inputSummary,
}: MethodologyDrawerProps) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const providers = useMemo(
    () => methodology?.providers ?? buildFallbackProviders(status),
    [methodology?.providers, status],
  )
  const confidenceDrivers = useMemo(
    () => methodology?.confidenceDrivers.length ? methodology.confidenceDrivers : buildFallbackConfidenceDrivers(status, trust),
    [methodology?.confidenceDrivers, status, trust],
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    closeButtonRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open || !panelRef.current) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        return
      }

      trapTabKey(panelRef.current!, event)
    }

    const container = panelRef.current
    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [open])

  const drawer = open && mounted && typeof document !== 'undefined'
    ? createPortal(
      <div className="fixed inset-0 z-[80]">
        <button
          type="button"
          className="absolute inset-0 bg-black/30"
          aria-label="Close methodology drawer"
          onClick={() => setOpen(false)}
        />

        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Methodology"
          className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-[var(--border)] bg-[var(--bg-elevated)] px-5 py-5 shadow-[-24px_0_60px_rgba(0,0,0,0.22)] sm:px-6"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="kicker">Methodology</p>
              <h3 className="mt-2 text-xl font-medium text-[var(--text)]">Sources, settings, and checks</h3>
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] transition-colors hover:text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-elevated)]"
              aria-label="Close methodology"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-6 space-y-5">
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <h4 className="text-sm font-medium text-[var(--text)]">Inputs</h4>
              {inputSummary ? (
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{inputSummary}</p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm text-[var(--text-muted)]">
                  <li>Run status: {status.degraded ? 'degraded' : 'clean'}</li>
                  <li>Sourced claims: {trust?.sourcedClaimCount ?? 0}</li>
                  <li>Known unknowns: {trust?.knownUnknowns.length ?? 0}</li>
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <h4 className="text-sm font-medium text-[var(--text)]">Sources queried</h4>
              <div className="mt-3 space-y-3">
                {providers.map((provider) => (
                  <div key={provider.name} className="rounded-2xl bg-[var(--bg-elevated)] px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-[var(--text)]">{provider.name}</p>
                      <span className="text-xs text-[var(--text-soft)]">{provider.docsReturned} docs</span>
                    </div>
                    <ul className="mt-2 space-y-1 text-sm text-[var(--text-muted)]">
                      {provider.queriesRun.map((query) => (
                        <li key={query}>{query}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <h4 className="text-sm font-medium text-[var(--text)]">What we found vs. excluded</h4>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-[var(--bg-elevated)] px-3 py-3">
                  <p className="kicker">Excluded</p>
                  <ul className="mt-2 space-y-2 text-sm text-[var(--text-muted)]">
                    {(methodology?.excluded.length ? methodology.excluded : []).map((item) => (
                      <li key={`${item.sourceId}-${item.reason}`}>{item.sourceId}: {item.reason}</li>
                    ))}
                    {!methodology?.excluded.length && (
                      <li>No explicit exclusions recorded.</li>
                    )}
                  </ul>
                </div>

                <div className="rounded-2xl bg-[var(--bg-elevated)] px-3 py-3">
                  <p className="kicker">Known unknowns</p>
                  <ul className="mt-2 space-y-2 text-sm text-[var(--text-muted)]">
                    {(trust?.knownUnknowns.length ? trust.knownUnknowns : []).map((item) => (
                      <li key={item.question}>{item.question}</li>
                    ))}
                    {!trust?.knownUnknowns.length && (
                      <li>No unresolved gaps recorded.</li>
                    )}
                  </ul>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <h4 className="text-sm font-medium text-[var(--text)]">Confidence drivers</h4>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--text-muted)]">
                {confidenceDrivers.map((driver) => (
                  <li key={driver}>{driver}</li>
                ))}
              </ul>
            </section>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
            <span className="text-xs text-[var(--text-soft)]">
              {sources?.length ? `${sources.length} sources attached to this brief.` : 'Source list is available in the brief footer.'}
            </span>

            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('intel:refresh'))}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-elevated)]"
            >
              <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>,
      document.body,
    )
    : null

  return (
    <>
      <div className="flex justify-end">
        <button
          type="button"
          className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-elevated)]"
          aria-label="Methodology"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          Sources & settings
        </button>
      </div>
      {drawer}
    </>
  )
}
