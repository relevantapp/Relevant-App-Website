'use client'

import type { BriefSource, ScenarioBands as ScenarioBandsData } from '@/lib/intelligence/contracts'
import ExhibitShell from '../ExhibitShell'

const CHART_LEFT = 24
const CHART_RIGHT = 376
const CHART_WIDTH = CHART_RIGHT - CHART_LEFT

export function getScenarioDotOffset(downside: number, base: number, upside: number) {
  const minimum = Math.min(downside, upside)
  const maximum = Math.max(downside, upside)

  if (maximum === minimum) return 0.5

  return Math.max(0, Math.min(1, (base - minimum) / (maximum - minimum)))
}

function formatScenarioValue(value: number, unit?: string) {
  return `${value}${unit ?? ''}`
}

interface ScenarioBandsProps {
  data: ScenarioBandsData
  headline: string
  subhead?: string
  asOf: string
  sources: BriefSource[]
}

export default function ScenarioBands({ data, headline, subhead, asOf, sources }: ScenarioBandsProps) {
  const inverted = data.downside.value > data.upside.value
  if (inverted) {
    console.warn('ScenarioBands: downside value is greater than upside value. Rendering with normalized bounds.')
  }

  const dotOffset = getScenarioDotOffset(data.downside.value, data.base.value, data.upside.value)
  const dotX = CHART_LEFT + dotOffset * CHART_WIDTH

  return (
    <ExhibitShell headline={headline} subhead={subhead} asOf={asOf} sources={sources}>
      <div>
        <p className="text-sm font-semibold text-[var(--text)]">{data.metric}</p>
        <svg viewBox="0 0 400 110" className="mt-4 w-full" role="img" aria-label={`${data.metric}: downside ${data.downside.value}, base ${data.base.value}, upside ${data.upside.value}`}>
          <line x1={CHART_LEFT} y1="56" x2={CHART_RIGHT} y2="56" stroke="var(--border)" strokeWidth="2" />
          <rect x={CHART_LEFT} y="44" width={CHART_WIDTH} height="24" rx="12" fill="color-mix(in oklch, var(--accent-teal) 10%, var(--surface))" />
          <circle cx={dotX} cy="56" r="7" fill="var(--accent)" />

          <text x={CHART_LEFT} y="30" className="mono" style={{ fontSize: 11, fill: 'var(--text-soft)' }}>
            {formatScenarioValue(data.downside.value, data.unit)}
          </text>
          <text x={dotX} y="30" textAnchor="middle" className="mono" style={{ fontSize: 11, fill: 'var(--text)' }}>
            {formatScenarioValue(data.base.value, data.unit)}
          </text>
          <text x={CHART_RIGHT} y="30" textAnchor="end" className="mono" style={{ fontSize: 11, fill: 'var(--text-soft)' }}>
            {formatScenarioValue(data.upside.value, data.unit)}
          </text>
        </svg>

        <p className="mt-3 text-sm text-[var(--text-muted)]">
          Base drivers: {data.base.drivers.join(', ')}
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--text-soft)]">Upside triggers</p>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--text-muted)]">
              {data.upside.triggers.map((trigger) => (
                <li key={trigger}>• {trigger}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--text-soft)]">Downside triggers</p>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--text-muted)]">
              {data.downside.triggers.map((trigger) => (
                <li key={trigger}>• {trigger}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </ExhibitShell>
  )
}
