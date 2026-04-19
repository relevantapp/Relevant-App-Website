'use client'

interface ScoreBarProps {
  score: number  // 1-5
  label?: string
}

function scoreColor(s: number): string {
  if (s <= 2) return 'var(--accent-coral)'
  if (s <= 3) return 'var(--accent-amber)'
  return 'var(--accent-teal)'
}

export default function ScoreBar({ score, label }: ScoreBarProps) {
  const clamped = Math.max(1, Math.min(5, Math.round(score)))
  const pct = (clamped / 5) * 100
  const color = scoreColor(clamped)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 60, height: 3, borderRadius: 1, background: 'var(--surface)' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 1, background: color }} />
      </div>
      <span className="mono tnum" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
        {clamped}/5{label ? ` · ${label}` : ''}
      </span>
    </div>
  )
}
