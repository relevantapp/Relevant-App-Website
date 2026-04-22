'use client'

import type { Priority, RichBullet } from '@/lib/intelligence/contracts'
import { INTEL_RESULTS_V2 } from '@/lib/intelligence/feature-flags'
import ClaimFeedback from './ClaimFeedback'
import PriorityStrip from './PriorityStrip'

interface BalanceViewProps {
  leftTitle: string
  rightTitle: string
  leftItems: RichBullet[]
  rightItems: RichBullet[]
  leftColor?: 'green' | 'amber'
  rightColor?: 'red' | 'amber'
  onSourceClick?: (id: string) => void
}

const COLOR_MAP = {
  green: 'var(--accent-teal)',
  amber: 'var(--accent-amber)',
  red: 'var(--accent-coral)',
}

function priorityForIndex(index: number): Priority {
  if (index < 2) return 'must'
  if (index < 4) return 'should'
  return 'fyi'
}

function resolvePriority(bullet: RichBullet, index: number): Priority {
  return bullet.priority ?? priorityForIndex(index)
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
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <Column title={leftTitle} items={leftItems} color={lc} onSourceClick={onSourceClick} />
      <Column title={rightTitle} items={rightItems} color={rc} onSourceClick={onSourceClick} />
    </div>
  )
}

function Column({ title, items, color, onSourceClick }: { title: string; items: RichBullet[]; color: string; onSourceClick?: (id: string) => void }) {
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 4, height: 4, borderRadius: '50%', background: color }} />
        <span className="kicker" style={{ color }}>{title}</span>
      </div>
      <div style={{ padding: '8px 16px 12px' }}>
        {items.map((b, i) => (
          <div key={i} style={{ padding: '8px 0', borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ display: 'flex', gap: 10 }}>
              {INTEL_RESULTS_V2 && <PriorityStrip priority={resolvePriority(b, i)} />}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text)' }}>{b.text}</p>
                {b.sourceIds.length > 0 && (
                  <div style={{ marginTop: 4, display: 'flex', gap: 3 }}>
                    {b.sourceIds.map((id) => (
                      <button key={id} onClick={() => onSourceClick?.(id)} className="source-chip">[{id}]</button>
                    ))}
                  </div>
                )}
                <ClaimFeedback
                  claimKey={`balance:${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}:${i}`}
                  claimText={b.text}
                  sourceIds={b.sourceIds}
                />
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p style={{ fontSize: 12, color: 'var(--text-soft)', padding: '8px 0' }}>No data</p>
        )}
      </div>
    </div>
  )
}
