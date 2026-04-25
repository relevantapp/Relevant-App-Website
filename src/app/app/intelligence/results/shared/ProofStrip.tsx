'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, Clock } from 'lucide-react'
import type { Priority } from '@/lib/intelligence/contracts'
import { useReducedMotionSafe } from './motion'

export interface ProofDriver {
  id: string
  title: string
  detail?: string | null
  priority: Priority
  sourceIds: string[]
  /** ISO string for the freshest source backing this driver. */
  freshness?: string | null
  /** True if this driver has a counter-evidence marker. */
  counter?: boolean
}

interface ProofStripProps {
  drivers: ProofDriver[]
  /** Optional lookup from source ID to display number (matches CitedText). */
  sourceNumberMap?: Map<string, number>
  /** Optional callback when a citation chip is clicked. */
  onCitationClick?: (sourceId: string) => void
  /** Optional label rendered as a kicker above the grid. */
  label?: string
}

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  must: { label: 'Must', color: 'var(--accent-coral)' },
  should: { label: 'Should', color: 'var(--accent-amber)' },
  fyi: { label: 'FYI', color: 'var(--text-soft)' },
}

function freshnessLabel(iso?: string | null): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  const diffMs = Date.now() - date.getTime()
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24))
  if (days < 1) return 'today'
  if (days < 7) return `${days}d`
  if (days < 60) return `${Math.round(days / 7)}w`
  return `${Math.round(days / 30)}mo`
}

export default function ProofStrip({ drivers, sourceNumberMap, onCitationClick, label = 'Proof' }: ProofStripProps) {
  const variants = useReducedMotionSafe()

  if (!drivers.length) return null

  return (
    <motion.section
      className="proof-strip"
      aria-label="Proof drivers"
      initial="hidden"
      animate="visible"
      variants={variants.proofStagger}
    >
      <header className="proof-strip-header">
        <span className="kicker">{label}</span>
        <span className="proof-strip-count mono">{drivers.length} drivers</span>
      </header>

      <div className="proof-strip-grid">
        {drivers.map((driver) => {
          const priority = PRIORITY_CONFIG[driver.priority]
          const fresh = freshnessLabel(driver.freshness)

          return (
            <motion.article
              key={driver.id}
              className="proof-strip-card"
              variants={variants.proofItem}
              style={{ borderLeftColor: priority.color }}
            >
              <div className="proof-strip-card-top">
                <span
                  className="proof-strip-priority"
                  style={{ color: priority.color, borderColor: priority.color }}
                >
                  {priority.label}
                </span>

                {driver.counter && (
                  <span className="proof-strip-counter" title="Counter-evidence exists for this driver">
                    <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                    Counter
                  </span>
                )}

                {fresh && (
                  <span className="proof-strip-fresh" title={driver.freshness ?? undefined}>
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {fresh}
                  </span>
                )}
              </div>

              <h3 className="proof-strip-title">{driver.title}</h3>
              {driver.detail && <p className="proof-strip-detail">{driver.detail}</p>}

              {driver.sourceIds.length > 0 && (
                <div className="proof-strip-chips" aria-label="Sources backing this driver">
                  {driver.sourceIds.map((sourceId) => {
                    const number = sourceNumberMap?.get(sourceId)
                    return (
                      <button
                        key={sourceId}
                        type="button"
                        className="proof-strip-chip"
                        onClick={() => onCitationClick?.(sourceId)}
                        aria-label={number ? `Open source ${number}` : `Open source ${sourceId}`}
                      >
                        {number ?? '·'}
                      </button>
                    )
                  })}
                </div>
              )}
            </motion.article>
          )
        })}
      </div>

      <style jsx>{`
        .proof-strip {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .proof-strip-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
        }
        .proof-strip-count {
          font-size: 11px;
          color: var(--text-soft);
          letter-spacing: 0.04em;
        }
        .proof-strip-grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        }
        .proof-strip-card {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 8px;
          border: 1px solid var(--border);
          border-left: 3px solid var(--text-soft);
          border-radius: 18px;
          padding: 14px 16px;
          background: var(--surface);
        }
        .proof-strip-card-top {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }
        .proof-strip-priority {
          display: inline-flex;
          align-items: center;
          border: 1px solid;
          border-radius: 9999px;
          padding: 2px 8px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .proof-strip-counter,
        .proof-strip-fresh {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          color: var(--text-soft);
          letter-spacing: 0.04em;
        }
        .proof-strip-counter {
          color: var(--accent-coral);
        }
        .proof-strip-title {
          font-size: 14px;
          line-height: 1.45;
          font-weight: 500;
          color: var(--text);
          margin: 0;
        }
        .proof-strip-detail {
          font-size: 13px;
          line-height: 1.5;
          color: var(--text-muted);
          margin: 0;
        }
        .proof-strip-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-top: 2px;
        }
        .proof-strip-chip {
          display: inline-flex;
          min-width: 22px;
          height: 22px;
          padding: 0 6px;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border);
          border-radius: 9999px;
          background: var(--bg-elevated);
          color: var(--accent);
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: border-color 140ms ease, color 140ms ease;
        }
        .proof-strip-chip:hover,
        .proof-strip-chip:focus-visible {
          border-color: var(--accent);
          color: var(--text);
          outline: none;
        }
        .proof-strip-chip:focus-visible {
          box-shadow: 0 0 0 2px var(--accent);
        }
      `}</style>
    </motion.section>
  )
}
