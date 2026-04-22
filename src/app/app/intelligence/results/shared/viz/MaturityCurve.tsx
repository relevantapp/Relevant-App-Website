'use client'

import type { BriefSource, MaturityPosition, MaturityStage } from '@/lib/intelligence/contracts'
import CitedText from '../CitedText'
import ExhibitShell from '../ExhibitShell'

const VIEWBOX_WIDTH = 420
const VIEWBOX_HEIGHT = 220
const CURVE_BASELINE = 140
const LABEL_Y = 188

export const MATURITY_STAGE_X: Record<MaturityStage, number> = {
  'innovation-trigger': 0.1,
  peak: 0.3,
  trough: 0.45,
  slope: 0.7,
  plateau: 0.9,
}

const STAGE_LABELS: Array<{ stage: MaturityStage; label: string }> = [
  { stage: 'innovation-trigger', label: 'Innovation trigger' },
  { stage: 'peak', label: 'Peak' },
  { stage: 'trough', label: 'Trough' },
  { stage: 'slope', label: 'Slope' },
  { stage: 'plateau', label: 'Plateau' },
]

export function getMaturityDotX(stage: MaturityStage) {
  return 30 + MATURITY_STAGE_X[stage] * 360
}

function getMaturityDotY(stage: MaturityStage) {
  const position = MATURITY_STAGE_X[stage]

  if (position <= 0.3) {
    const riseProgress = position / 0.3
    return CURVE_BASELINE - riseProgress * 72
  }

  if (position <= 0.45) {
    const fallProgress = (position - 0.3) / 0.15
    return 68 + fallProgress * 82
  }

  if (position <= 0.7) {
    const slopeProgress = (position - 0.45) / 0.25
    return 150 - slopeProgress * 56
  }

  const plateauProgress = (position - 0.7) / 0.2
  return 94 - plateauProgress * 8
}

interface MaturityCurveProps {
  data: MaturityPosition
  headline: string
  subhead?: string
  asOf: string
  sources: BriefSource[]
}

export default function MaturityCurve({ data, headline, subhead, asOf, sources }: MaturityCurveProps) {
  const dotX = getMaturityDotX(data.stage)
  const dotY = getMaturityDotY(data.stage)

  return (
    <ExhibitShell headline={headline} subhead={subhead} asOf={asOf} sources={sources}>
      <div className="space-y-4">
        <svg
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          className="w-full"
          role="img"
          aria-label={`${headline}: the category is currently at the ${data.stage} stage`}
        >
          <path
            d="M 30 140 C 70 140, 100 110, 138 68 S 200 80, 210 150 S 280 96, 354 88 S 380 86, 390 86"
            fill="none"
            stroke="var(--border-strong)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle data-testid="maturity-dot" cx={dotX} cy={dotY} r="9" fill="var(--accent-teal)" />

          {STAGE_LABELS.map((label) => (
            <text
              key={label.stage}
              x={getMaturityDotX(label.stage)}
              y={LABEL_Y}
              textAnchor="middle"
              className="mono"
              style={{
                fontSize: 10,
                fill: label.stage === data.stage ? 'var(--text)' : 'var(--text-soft)',
                fontWeight: label.stage === data.stage ? 700 : 500,
              }}
            >
              {label.label}
            </text>
          ))}
        </svg>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 text-sm leading-relaxed text-[var(--text-muted)]">
          <CitedText spans={[data.rationale]} sources={sources} />
        </div>
      </div>
    </ExhibitShell>
  )
}
