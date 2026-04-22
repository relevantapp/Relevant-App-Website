'use client'

import { useId, useState } from 'react'
import type { StakeholderRow } from '@/lib/intelligence/contracts'

type DiscScores = NonNullable<StakeholderRow['disc']>
type DiscAxis = keyof DiscScores

const AXIS_META: Record<
  DiscAxis,
  {
    shortLabel: string
    label: string
    color: string
    background: string
    doBullets: [string, string, string]
    dontBullets: [string, string, string]
  }
> = {
  c: {
    shortLabel: 'C',
    label: 'Conscientious',
    color: '#4f7cff',
    background: 'rgba(79, 124, 255, 0.18)',
    doBullets: ['Lead with evidence.', 'Clarify rollout details.', 'Show the decision logic.'],
    dontBullets: ['Do not wing the details.', 'Do not skip risk questions.', 'Do not pressure for a fast yes.'],
  },
  d: {
    shortLabel: 'D',
    label: 'Dominant',
    color: '#e05d4d',
    background: 'rgba(224, 93, 77, 0.2)',
    doBullets: ['Start with the outcome.', 'Offer a clear point of view.', 'Keep next steps concrete.'],
    dontBullets: ['Do not bury the point.', 'Do not drift into theory.', 'Do not over-explain basics.'],
  },
  i: {
    shortLabel: 'I',
    label: 'Influence',
    color: '#d99115',
    background: 'rgba(217, 145, 21, 0.18)',
    doBullets: ['Make the narrative easy to repeat.', 'Keep the tone energetic.', 'Connect the win to team momentum.'],
    dontBullets: ['Do not make it feel dry.', 'Do not flood them with caveats first.', 'Do not ignore social proof.'],
  },
  s: {
    shortLabel: 'S',
    label: 'Steady',
    color: '#2c9b7d',
    background: 'rgba(44, 155, 125, 0.18)',
    doBullets: ['Keep the tone calm.', 'Show the rollout path.', 'Reassure them on change management.'],
    dontBullets: ['Do not rush the conversation.', 'Do not surprise them with volatility.', 'Do not skip support details.'],
  },
}

const AXIS_ORDER = Object.keys(AXIS_META) as DiscAxis[]

export function getDominantDiscAxis(disc: DiscScores): DiscAxis {
  return [...AXIS_ORDER].sort((left, right) => {
    const scoreDelta = disc[right] - disc[left]
    if (scoreDelta !== 0) return scoreDelta

    return left.localeCompare(right)
  })[0]
}

function formatAriaLabel(disc: DiscScores) {
  const dominantAxis = getDominantDiscAxis(disc)

  return `Comms style: Dominant Influence Steady Conscientious. Dominant axis: ${AXIS_META[dominantAxis].shortLabel}`
}

interface DiscChipProps {
  disc: DiscScores
  personName: string
  commsStyleTag?: string
}

export default function DiscChip({ disc, personName, commsStyleTag }: DiscChipProps) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const dominantAxis = getDominantDiscAxis(disc)
  const dominantMeta = AXIS_META[dominantAxis]
  const ariaLabel = formatAriaLabel(disc)

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--bg-elevated)] text-[var(--text)] shadow-sm transition hover:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-elevated)]"
        aria-label={`${personName}: ${ariaLabel}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            setOpen((current) => !current)
          }

          if (event.key === 'Escape') {
            setOpen(false)
          }
        }}
      >
        <span role="img" aria-label={ariaLabel} className="inline-flex">
          <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
            <rect x="0.75" y="0.75" width="14.5" height="14.5" rx="3" fill="var(--surface)" stroke="var(--border-strong)" />
            <rect x="1.75" y="1.75" width="5.5" height="5.5" rx="1.4" fill={dominantAxis === 'd' ? AXIS_META.d.color : AXIS_META.d.background} />
            <rect x="8.75" y="1.75" width="5.5" height="5.5" rx="1.4" fill={dominantAxis === 'i' ? AXIS_META.i.color : AXIS_META.i.background} />
            <rect x="1.75" y="8.75" width="5.5" height="5.5" rx="1.4" fill={dominantAxis === 's' ? AXIS_META.s.color : AXIS_META.s.background} />
            <rect x="8.75" y="8.75" width="5.5" height="5.5" rx="1.4" fill={dominantAxis === 'c' ? AXIS_META.c.color : AXIS_META.c.background} />
          </svg>
        </span>
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute left-0 top-[calc(100%+0.5rem)] z-20 w-72 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)]"
          role="dialog"
          aria-label={`${personName} communication style`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--text-soft)]">Comms style</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text)]">
                {dominantMeta.label}
                {commsStyleTag ? ` • ${commsStyleTag}` : ''}
              </p>
            </div>
            <span
              className="inline-flex rounded-full border px-2 py-1 text-[11px] font-medium"
              style={{
                color: dominantMeta.color,
                borderColor: dominantMeta.color,
                background: dominantMeta.background,
              }}
            >
              {dominantMeta.shortLabel}
            </span>
          </div>

          <div className="mt-4 space-y-2">
            {AXIS_ORDER.map((axis) => (
              <div key={axis} className="grid grid-cols-[auto_1fr_auto] items-center gap-2 text-xs text-[var(--text-muted)]">
                <span className="font-medium text-[var(--text)]">{AXIS_META[axis].shortLabel}</span>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--surface)]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${disc[axis]}%`,
                      background: AXIS_META[axis].color,
                    }}
                  />
                </div>
                <span>{disc[axis]}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--text-soft)]">Do</p>
              <ul className="mt-2 space-y-2 text-sm leading-relaxed text-[var(--text-muted)]">
                {dominantMeta.doBullets.map((bullet) => (
                  <li key={bullet}>• {bullet}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--text-soft)]">Do not</p>
              <ul className="mt-2 space-y-2 text-sm leading-relaxed text-[var(--text-muted)]">
                {dominantMeta.dontBullets.map((bullet) => (
                  <li key={bullet}>• {bullet}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </span>
  )
}
