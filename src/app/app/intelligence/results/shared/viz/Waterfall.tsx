'use client'

import { useState } from 'react'
import type { BriefSource, WaterfallStep } from '@/lib/intelligence/contracts'
import CitedText from '../CitedText'
import ExhibitShell from '../ExhibitShell'

interface WaterfallBar {
  label: string
  kind: WaterfallStep['kind']
  delta: number
  start: number
  end: number
  assumption: WaterfallStep['assumption']
}

export function calculateWaterfallBars(steps: WaterfallStep[]): WaterfallBar[] {
  let runningTotal = 0

  return steps.map((step, index) => {
    if (index === 0 || step.kind === 'baseline') {
      runningTotal = step.delta
      return {
        label: step.label,
        kind: step.kind,
        delta: step.delta,
        start: 0,
        end: step.delta,
        assumption: step.assumption,
      }
    }

    if (step.kind === 'total' || step.kind === 'subtotal') {
      return {
        label: step.label,
        kind: step.kind,
        delta: runningTotal,
        start: 0,
        end: runningTotal,
        assumption: step.assumption,
      }
    }

    const start = runningTotal
    runningTotal += step.delta

    return {
      label: step.label,
      kind: step.kind,
      delta: step.delta,
      start,
      end: runningTotal,
      assumption: step.assumption,
    }
  })
}

function getWaterfallFill(step: WaterfallBar) {
  if (step.kind === 'baseline' || step.kind === 'subtotal' || step.kind === 'total') {
    return 'var(--text-soft)'
  }

  return step.delta >= 0 ? 'var(--accent-teal)' : 'var(--accent-coral)'
}

function formatWaterfallValue(value: number) {
  return value > 0 ? `+${value}` : `${value}`
}

interface WaterfallProps {
  data: WaterfallStep[]
  headline: string
  subhead?: string
  asOf: string
  sources: BriefSource[]
}

export default function Waterfall({ data, headline, subhead, asOf, sources }: WaterfallProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const bars = calculateWaterfallBars(data)
  const maxValue = Math.max(...bars.map((bar) => Math.max(bar.start, bar.end)), 0)
  const chartHeight = 220
  const baseY = 190
  const activeBar = bars[activeIndex] ?? bars[0]

  return (
    <ExhibitShell headline={headline} subhead={subhead} asOf={asOf} sources={sources}>
      <div className="space-y-4">
        <svg viewBox={`0 0 ${Math.max(420, bars.length * 86)} ${chartHeight}`} className="w-full" role="img" aria-label={`${headline}: ${bars.length} steps from baseline to target`}>
          <line x1="24" y1={baseY} x2={Math.max(380, bars.length * 86 - 20)} y2={baseY} stroke="var(--border)" strokeWidth="2" />
          {bars.map((bar, index) => {
            const x = 36 + index * 86
            const topValue = Math.max(bar.start, bar.end)
            const bottomValue = Math.min(bar.start, bar.end)
            const y = baseY - (topValue / (maxValue || 1)) * 150
            const height = Math.max(12, ((topValue - bottomValue) / (maxValue || 1)) * 150)
            const fill = getWaterfallFill(bar)

            return (
              <g
                key={`${bar.label}-${index}`}
                data-testid="waterfall-bar"
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                onClick={() => setActiveIndex(index)}
              >
                <text x={x + 24} y="20" textAnchor="middle" className="mono" style={{ fontSize: 10, fill: 'var(--text-soft)' }}>
                  {bar.label}
                </text>
                <rect
                  data-testid={`waterfall-rect-${index}`}
                  x={x}
                  y={y}
                  width="48"
                  height={height}
                  rx="6"
                  fill={fill}
                />
                <text x={x + 24} y={y + Math.min(height / 2 + 4, height - 6)} textAnchor="middle" className="mono" style={{ fontSize: 10, fill: 'white' }}>
                  {bar.kind === 'baseline' || bar.kind === 'total' || bar.kind === 'subtotal' ? bar.end : formatWaterfallValue(bar.delta)}
                </text>
              </g>
            )
          })}
        </svg>

        {activeBar ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
            <p className="text-sm font-semibold text-[var(--text)]">{activeBar.label}</p>
            <div className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
              <CitedText spans={[activeBar.assumption]} sources={sources} />
            </div>
          </div>
        ) : null}
      </div>
    </ExhibitShell>
  )
}
