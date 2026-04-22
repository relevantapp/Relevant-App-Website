'use client'

import { useState } from 'react'
import type { BriefSource, CompositeQuadrant as CompositeQuadrantData, CitedSpan } from '@/lib/intelligence/contracts'
import CitedText from '../CitedText'
import ExhibitShell from '../ExhibitShell'

const VIEWBOX_WIDTH = 400
const VIEWBOX_HEIGHT = 400
const PLOT_LEFT = 72
const PLOT_RIGHT = 344
const PLOT_TOP = 40
const PLOT_BOTTOM = 320
const PLOT_WIDTH = PLOT_RIGHT - PLOT_LEFT
const PLOT_HEIGHT = PLOT_BOTTOM - PLOT_TOP

type ActivePanel =
  | { kind: 'point'; entity: string; rationale: CitedSpan }
  | { kind: 'axis'; entity: string; rationale: CitedSpan }
  | null

export function getCompositeQuadrantPoint(x: number, y: number) {
  return {
    x: PLOT_LEFT + x * PLOT_WIDTH,
    y: PLOT_BOTTOM - y * PLOT_HEIGHT,
  }
}

function getPointLabelPosition(x: number, y: number) {
  const anchor: 'end' | 'start' = x > PLOT_LEFT + PLOT_WIDTH * 0.72 ? 'end' : 'start'
  const offsetX = anchor === 'end' ? -10 : 10

  return {
    x: Math.min(PLOT_RIGHT - 6, Math.max(PLOT_LEFT + 6, x + offsetX)),
    y: Math.min(PLOT_BOTTOM - 8, Math.max(PLOT_TOP + 14, y - 10)),
    anchor,
  }
}

interface CompositeQuadrantProps {
  data: CompositeQuadrantData
  headline: string
  subhead?: string
  asOf: string
  sources: BriefSource[]
}

export default function CompositeQuadrant({ data, headline, subhead, asOf, sources }: CompositeQuadrantProps) {
  const [activePanel, setActivePanel] = useState<ActivePanel>(
    data.rendered && data.points[0]
      ? { kind: 'point', entity: data.points[0].entity, rationale: data.points[0].rationale }
      : null,
  )

  if (!data.rendered) {
    return (
      <ExhibitShell headline={headline} subhead={subhead} asOf={asOf} sources={sources}>
        <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)] px-5 py-5 text-sm leading-relaxed text-[var(--text-muted)]">
          {data.reason}
        </div>
      </ExhibitShell>
    )
  }

  return (
    <ExhibitShell headline={headline} subhead={subhead} asOf={asOf} sources={sources}>
      <div className="relative">
        <svg
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          className="w-full"
          role="img"
          aria-label={`${headline}: ${data.points.map((point) => `${point.entity} at ${Math.round(point.x * 100)}, ${Math.round(point.y * 100)}`).join(', ')}`}
        >
          <rect x={PLOT_LEFT} y={PLOT_TOP} width={PLOT_WIDTH} height={PLOT_HEIGHT} rx="24" fill="var(--surface)" />
          <line x1={PLOT_LEFT} y1={PLOT_BOTTOM} x2={PLOT_RIGHT} y2={PLOT_BOTTOM} stroke="var(--border)" strokeWidth="1.5" />
          <line x1={PLOT_LEFT} y1={PLOT_TOP} x2={PLOT_LEFT} y2={PLOT_BOTTOM} stroke="var(--border)" strokeWidth="1.5" />
          <line x1={PLOT_LEFT + PLOT_WIDTH / 2} y1={PLOT_TOP} x2={PLOT_LEFT + PLOT_WIDTH / 2} y2={PLOT_BOTTOM} stroke="var(--border)" strokeDasharray="6 6" />
          <line x1={PLOT_LEFT} y1={PLOT_TOP + PLOT_HEIGHT / 2} x2={PLOT_RIGHT} y2={PLOT_TOP + PLOT_HEIGHT / 2} stroke="var(--border)" strokeDasharray="6 6" />

          {data.points.map((point) => {
            const quadrantPoint = getCompositeQuadrantPoint(point.x, point.y)
            const labelPosition = getPointLabelPosition(quadrantPoint.x, quadrantPoint.y)

            return (
              <g
                key={point.entity}
                data-testid={`composite-point-${point.entity.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                tabIndex={0}
                role="button"
                aria-label={point.entity}
                onMouseEnter={() => setActivePanel({ kind: 'point', entity: point.entity, rationale: point.rationale })}
                onFocus={() => setActivePanel({ kind: 'point', entity: point.entity, rationale: point.rationale })}
                onClick={() => setActivePanel({ kind: 'point', entity: point.entity, rationale: point.rationale })}
              >
                <circle cx={quadrantPoint.x} cy={quadrantPoint.y} r="8" fill="var(--accent-teal)" />
                <circle cx={quadrantPoint.x} cy={quadrantPoint.y} r="12" fill="transparent" stroke="transparent" />
                <text
                  x={labelPosition.x}
                  y={labelPosition.y}
                  textAnchor={labelPosition.anchor}
                  className="mono"
                  style={{ fontSize: 10, fill: 'var(--text)' }}
                >
                  {point.entity}
                </text>
              </g>
            )
          })}
        </svg>

        <button
          type="button"
          className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-[var(--text-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-elevated)]"
          onClick={() => setActivePanel({ kind: 'axis', entity: data.xAxis.name, rationale: data.xAxis.rationale })}
        >
          {data.xAxis.name}
        </button>
        <button
          type="button"
          className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-[var(--text-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-elevated)]"
          onClick={() => setActivePanel({ kind: 'axis', entity: data.yAxis.name, rationale: data.yAxis.rationale })}
        >
          {data.yAxis.name}
        </button>

        {activePanel ? (
          <div
            role="tooltip"
            className="absolute right-0 top-0 z-10 w-72 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)]"
          >
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--text-soft)]">
              {activePanel.kind === 'axis' ? 'Axis rationale' : 'Point rationale'}
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--text)]">{activePanel.entity}</p>
            <div className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
              <CitedText spans={[activePanel.rationale]} sources={sources} />
            </div>
          </div>
        ) : null}
      </div>
    </ExhibitShell>
  )
}
