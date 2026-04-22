'use client'

import type { Priority, RichBullet } from '@/lib/intelligence/contracts'
import { INTEL_RESULTS_V2 } from '@/lib/intelligence/feature-flags'
import ClaimFeedback from './ClaimFeedback'
import PriorityStrip from './PriorityStrip'

interface InsightSectionProps {
  title: string
  icon: React.ReactNode
  bullets: RichBullet[]
  borderColor?: string
  onSourceClick?: (id: string) => void
}

function priorityForIndex(index: number): Priority {
  if (index < 2) return 'must'
  if (index < 4) return 'should'
  return 'fyi'
}

function resolvePriority(bullet: RichBullet, index: number): Priority {
  return bullet.priority ?? priorityForIndex(index)
}

export default function InsightSection({ title, icon, bullets, onSourceClick }: InsightSectionProps) {
  if (bullets.length === 0) return null

  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>{icon}</span>
        <span className="kicker">{title}</span>
      </div>
      <div style={{ padding: '14px 18px 16px' }}>
        {bullets.map((bullet, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 12,
              padding: '10px 0',
              borderBottom: i < bullets.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <span className="mono tnum" style={{ fontSize: 10, color: 'var(--text-soft)', paddingTop: 3, minWidth: 16 }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            {INTEL_RESULTS_V2 && <PriorityStrip priority={resolvePriority(bullet, i)} />}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.5 }}>{bullet.text}</p>
              <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
                <span className={bullet.tag === 'fact' ? 'ev-tag ev-tag--fact' : 'ev-tag ev-tag--infer'}>
                  {bullet.tag === 'fact' ? 'FACT' : 'INFER'}
                </span>
                {bullet.sourceIds.map((id) => (
                  <button
                    key={id}
                    onClick={() => onSourceClick?.(id)}
                    className="source-chip"
                  >
                    [{id}]
                  </button>
                ))}
              </div>
              <ClaimFeedback
                claimKey={`insight:${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}:${i}`}
                claimText={bullet.text}
                sourceIds={bullet.sourceIds}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
