'use client'

interface ScoreBarProps {
  score: number  // 1-5
  label?: string
}

const SCORE_COLORS = [
  '', // 0 unused
  'bg-[var(--accent-coral)]',     // 1
  'bg-[var(--accent-coral)]/70',  // 2
  'bg-[var(--accent-amber)]',     // 3
  'bg-[var(--accent-teal)]/70',   // 4
  'bg-[var(--accent-teal)]',      // 5
]

export default function ScoreBar({ score, label }: ScoreBarProps) {
  const clamped = Math.max(1, Math.min(5, Math.round(score)))

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-2 w-4 rounded-sm ${
              i <= clamped ? SCORE_COLORS[clamped] : 'bg-[var(--surface-strong)]'
            }`}
          />
        ))}
      </div>
      {label && <span className="text-xs text-[var(--text-muted)]">{label}</span>}
    </div>
  )
}
