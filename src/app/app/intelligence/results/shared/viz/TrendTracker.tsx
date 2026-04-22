'use client'

import type { BriefSource, TrackedSignal } from '@/lib/intelligence/contracts'
import ExhibitShell from '../ExhibitShell'

const VIEWBOX_WIDTH = 420
const VIEWBOX_HEIGHT = 220
const CHART_LEFT = 46
const CHART_RIGHT = 390
const CHART_TOP = 20
const CHART_BOTTOM = 176
const CHART_WIDTH = CHART_RIGHT - CHART_LEFT
const CHART_HEIGHT = CHART_BOTTOM - CHART_TOP

function formatPointValue(value: number, unit?: string) {
  return unit ? `${value}${unit}` : `${value}`
}

export function getTrendLayout(points: TrackedSignal['points']) {
  const values = points.map((point) => point.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const paddedMin = minValue === maxValue ? minValue - 1 : minValue
  const paddedMax = minValue === maxValue ? maxValue + 1 : maxValue
  const range = paddedMax - paddedMin || 1

  const scaledPoints = points.map((point, index) => {
    const x =
      points.length === 1
        ? CHART_LEFT + CHART_WIDTH / 2
        : CHART_LEFT + (index / (points.length - 1)) * CHART_WIDTH
    const y = CHART_BOTTOM - ((point.value - paddedMin) / range) * CHART_HEIGHT

    return {
      ...point,
      x,
      y,
    }
  })

  return {
    minValue: paddedMin,
    maxValue: paddedMax,
    midValue: paddedMin + range / 2,
    path: scaledPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' '),
    scaledPoints,
  }
}

interface TrendTrackerProps {
  data?: TrackedSignal[]
  asOf: string
  sources: BriefSource[]
}

export default function TrendTracker({ data, asOf, sources }: TrendTrackerProps) {
  const validSignals = (data ?? []).filter((signal) => signal.points.length >= 2)

  if (validSignals.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      {validSignals.map((signal) => {
        const layout = getTrendLayout(signal.points)
        const firstPoint = signal.points[0]
        const lastPoint = signal.points[signal.points.length - 1]

        return (
          <ExhibitShell
            key={`${signal.metric}-${signal.headline}`}
            headline={signal.headline}
            subhead={`${signal.metric} tracked over time${signal.unit ? ` (${signal.unit})` : ''}.`}
            asOf={asOf}
            sources={sources}
          >
            <svg
              viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
              className="w-full"
              role="img"
              data-testid="trend-chart"
              aria-label={`${signal.headline}: ${signal.metric} moved from ${formatPointValue(firstPoint.value, signal.unit)} at ${firstPoint.t} to ${formatPointValue(lastPoint.value, signal.unit)} at ${lastPoint.t}`}
            >
              <line x1={CHART_LEFT} y1={CHART_BOTTOM} x2={CHART_RIGHT} y2={CHART_BOTTOM} stroke="var(--border)" strokeWidth="1.5" />
              <line x1={CHART_LEFT} y1={CHART_TOP} x2={CHART_LEFT} y2={CHART_BOTTOM} stroke="var(--border)" strokeWidth="1.5" />
              <line x1={CHART_LEFT} y1={(CHART_TOP + CHART_BOTTOM) / 2} x2={CHART_RIGHT} y2={(CHART_TOP + CHART_BOTTOM) / 2} stroke="var(--border)" strokeDasharray="5 5" />

              {[layout.maxValue, layout.midValue, layout.minValue].map((value, index) => (
                <text
                  key={`${signal.metric}-y-${index}`}
                  x={CHART_LEFT - 10}
                  y={index === 0 ? CHART_TOP + 4 : index === 1 ? (CHART_TOP + CHART_BOTTOM) / 2 + 4 : CHART_BOTTOM + 4}
                  textAnchor="end"
                  className="mono"
                  style={{ fontSize: 10, fill: 'var(--text-soft)' }}
                >
                  {formatPointValue(Math.round(value * 10) / 10, signal.unit)}
                </text>
              ))}

              <path d={layout.path} fill="none" stroke="var(--accent-teal)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

              {layout.scaledPoints.map((point) => (
                <g key={`${signal.metric}-${point.t}`}>
                  <circle cx={point.x} cy={point.y} r="5" fill="var(--accent-teal)" />
                  <text x={point.x} y={CHART_BOTTOM + 24} textAnchor="middle" className="mono" style={{ fontSize: 10, fill: 'var(--text-soft)' }}>
                    {point.t}
                  </text>
                </g>
              ))}
            </svg>
          </ExhibitShell>
        )
      })}
    </div>
  )
}
