'use client'

import type { BriefBullet } from '@/lib/intelligence/types'

interface BalanceViewProps {
  leftTitle: string
  rightTitle: string
  leftItems: BriefBullet[]
  rightItems: BriefBullet[]
  leftColor?: 'green' | 'amber'
  rightColor?: 'red' | 'amber'
  onSourceClick?: (id: string) => void
}

const COLOR_MAP = {
  green: { bg: 'bg-[var(--accent-teal)]/8', border: 'border-[var(--accent-teal)]/20', text: 'text-[var(--accent-teal)]' },
  amber: { bg: 'bg-[var(--accent-amber)]/8', border: 'border-[var(--accent-amber)]/20', text: 'text-[var(--accent-amber)]' },
  red: { bg: 'bg-[var(--accent-coral)]/8', border: 'border-[var(--accent-coral)]/20', text: 'text-[var(--accent-coral)]' },
}

export default function BalanceView({
  leftTitle,
  rightTitle,
  leftItems,
  rightItems,
  leftColor = 'green',
  rightColor = 'red',
  onSourceClick,
}: BalanceViewProps) {
  const lc = COLOR_MAP[leftColor]
  const rc = COLOR_MAP[rightColor]

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className={`rounded-xl border ${lc.border} ${lc.bg} p-4`}>
        <h4 className={`mb-3 text-sm font-semibold ${lc.text}`}>{leftTitle}</h4>
        <div className="space-y-2">
          {leftItems.map((b, i) => (
            <BulletItem key={i} bullet={b} onSourceClick={onSourceClick} />
          ))}
          {leftItems.length === 0 && (
            <p className="text-xs text-[var(--text-soft)]">No data available</p>
          )}
        </div>
      </div>
      <div className={`rounded-xl border ${rc.border} ${rc.bg} p-4`}>
        <h4 className={`mb-3 text-sm font-semibold ${rc.text}`}>{rightTitle}</h4>
        <div className="space-y-2">
          {rightItems.map((b, i) => (
            <BulletItem key={i} bullet={b} onSourceClick={onSourceClick} />
          ))}
          {rightItems.length === 0 && (
            <p className="text-xs text-[var(--text-soft)]">No data available</p>
          )}
        </div>
      </div>
    </div>
  )
}

function BulletItem({ bullet, onSourceClick }: { bullet: BriefBullet; onSourceClick?: (id: string) => void }) {
  return (
    <div className="rounded-lg bg-[var(--surface)] p-3">
      <p className="text-sm text-[var(--text)]">{bullet.text}</p>
      {bullet.sourceIds.length > 0 && (
        <div className="mt-1 flex gap-1">
          {bullet.sourceIds.map((id) => (
            <button
              key={id}
              onClick={() => onSourceClick?.(id)}
              className="rounded bg-[var(--surface-strong)] px-1 py-0.5 text-[10px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
            >
              {id}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
