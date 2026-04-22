'use client'

interface TargetBand {
  label: string
  from: number
  to: number
}

interface BulletChartProps {
  value: number
  targetBands: TargetBand[]
  label: string
}

function clampValue(value: number) {
  return Math.max(0, Math.min(100, value))
}

function isActiveBand(value: number, band: TargetBand, isLastBand: boolean) {
  if (isLastBand) return value >= band.from && value <= band.to
  return value >= band.from && value < band.to
}

export default function BulletChart({ value, targetBands, label }: BulletChartProps) {
  const clampedValue = clampValue(value)
  const activeBand = targetBands.find((band, index) => isActiveBand(clampedValue, band, index === targetBands.length - 1))

  return (
    <div className="w-full">
      <svg
        viewBox="0 0 340 68"
        className="w-full"
        role="img"
        aria-label={`${label}: ${clampedValue} in ${activeBand?.label ?? 'unknown'} band`}
      >
        {targetBands.map((band) => (
          <rect
            key={band.label}
            x={band.from * 3}
            y="22"
            width={Math.max(0, band.to - band.from) * 3}
            height="18"
            rx="6"
            fill={`color-mix(in oklch, var(--surface-strong) 68%, ${band.label === activeBand?.label ? 'var(--accent-teal)' : 'var(--surface)'})`}
            data-active={band.label === activeBand?.label}
          />
        ))}

        <line
          x1={clampedValue * 3}
          x2={clampedValue * 3}
          y1="14"
          y2="48"
          stroke="var(--text)"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <text x={clampedValue * 3} y="12" textAnchor="middle" className="mono" style={{ fontSize: 11, fill: 'var(--text)' }}>
          {clampedValue}
        </text>
      </svg>

      <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-[var(--text-muted)]">
        {targetBands.map((band, index) => {
          const active = isActiveBand(clampedValue, band, index === targetBands.length - 1)
          return (
            <div
              key={band.label}
              data-active={active}
              className={`rounded-xl border px-2 py-2 text-center ${active ? 'border-[var(--accent-teal)] text-[var(--text)]' : 'border-[var(--border)]'}`}
            >
              <div className="font-medium uppercase tracking-[0.12em]">{band.label}</div>
              <div className="mt-1">{band.from}-{band.to}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
