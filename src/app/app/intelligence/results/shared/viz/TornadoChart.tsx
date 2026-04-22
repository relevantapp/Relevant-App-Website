'use client'

import type { BriefSource, TornadoEntry } from '@/lib/intelligence/contracts'
import ExhibitShell from '../ExhibitShell'

const CENTER_X = 220
const HALF_WIDTH = 120

export function getSortedTornadoEntries(entries: TornadoEntry[]) {
  return [...entries].sort(
    (left, right) => Math.abs(right.highImpact - right.lowImpact) - Math.abs(left.highImpact - left.lowImpact),
  )
}

export function getTornadoBarWidths(entries: TornadoEntry[]) {
  const maxMagnitude = entries.reduce((max, entry) => {
    return Math.max(max, Math.abs(entry.lowImpact), Math.abs(entry.highImpact))
  }, 0)

  return entries.map((entry) => ({
    assumption: entry.assumption,
    lowWidth: maxMagnitude === 0 ? 0 : (Math.abs(entry.lowImpact) / maxMagnitude) * HALF_WIDTH,
    highWidth: maxMagnitude === 0 ? 0 : (Math.abs(entry.highImpact) / maxMagnitude) * HALF_WIDTH,
  }))
}

interface TornadoChartProps {
  data: TornadoEntry[]
  headline: string
  subhead?: string
  asOf: string
  sources: BriefSource[]
}

export default function TornadoChart({ data, headline, subhead, asOf, sources }: TornadoChartProps) {
  if (data.length === 0) {
    return (
      <ExhibitShell headline={headline} subhead={subhead} asOf={asOf} sources={sources}>
        <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)] px-5 py-5 text-sm text-[var(--text-muted)]">
          No sensitivity data.
        </div>
      </ExhibitShell>
    )
  }

  const entries = getSortedTornadoEntries(data)
  const widths = getTornadoBarWidths(entries)
  const viewHeight = 70 + entries.length * 56

  return (
    <ExhibitShell headline={headline} subhead={subhead} asOf={asOf} sources={sources}>
      <svg viewBox={`0 0 440 ${viewHeight}`} className="w-full" role="img" aria-label={`${headline}: ${entries.length} sensitivity assumptions ranked by impact range`}>
        <line x1={CENTER_X} y1="18" x2={CENTER_X} y2={viewHeight - 20} stroke="var(--border-strong)" strokeWidth="2" />

        {entries.map((entry, index) => {
          const y = 42 + index * 56
          const width = widths[index]

          return (
            <g key={entry.assumption} data-testid="tornado-row">
              <text x="0" y={y} className="mono" style={{ fontSize: 11, fill: 'var(--text)' }}>
                {entry.assumption}
              </text>
              <rect
                data-testid={`tornado-low-${index}`}
                x={CENTER_X - width.lowWidth}
                y={y - 14}
                width={width.lowWidth}
                height="16"
                rx="4"
                fill="var(--accent-coral)"
              />
              <rect
                data-testid={`tornado-high-${index}`}
                x={CENTER_X}
                y={y - 14}
                width={width.highWidth}
                height="16"
                rx="4"
                fill="var(--accent-teal)"
              />
              <text x={CENTER_X - width.lowWidth - 8} y={y - 2} textAnchor="end" className="mono" style={{ fontSize: 10, fill: 'var(--text-soft)' }}>
                {entry.lowImpact}
              </text>
              <text x={CENTER_X + width.highWidth + 8} y={y - 2} className="mono" style={{ fontSize: 10, fill: 'var(--text-soft)' }}>
                +{entry.highImpact}
              </text>
            </g>
          )
        })}
      </svg>
    </ExhibitShell>
  )
}
