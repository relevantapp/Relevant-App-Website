'use client'

import { Dot } from '../../ui/primitives'
import type { ResearchPlan } from '../../types'

interface SearchPlanPanelProps {
  plan?: ResearchPlan | null
}

function wordCount(query: string): number {
  return query.trim().split(/\s+/).filter(Boolean).length
}

export default function SearchPlanPanel({ plan }: SearchPlanPanelProps) {
  if (!plan?.searches?.length) return null

  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Dot color="var(--accent-teal)" size={7} />
        <span className="kicker">Search plan · {plan.searches.length}</span>
      </div>
      {plan.summary && (
        <p style={{ margin: 0, padding: '12px 18px', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5 }}>
          {plan.summary}
        </p>
      )}
      <div>
        {plan.searches.slice(0, 8).map((task, index) => (
          <div
            key={`${task.provider}-${task.query}-${index}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '72px 1fr auto',
              gap: 10,
              alignItems: 'start',
              padding: '10px 18px',
              borderBottom: index === Math.min(plan.searches.length, 8) - 1 ? 'none' : '1px solid var(--border)',
            }}
          >
            <span className="mono" style={{ fontSize: 10, color: task.provider === 'exa' ? 'var(--accent-amber)' : 'var(--accent-teal)', textTransform: 'uppercase' }}>
              {task.provider}
            </span>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, color: 'var(--text)', fontSize: 12.5, lineHeight: 1.45 }}>
                {task.query}
              </p>
              {task.purpose && (
                <p style={{ margin: '3px 0 0', color: 'var(--text-soft)', fontSize: 11.5, lineHeight: 1.4 }}>
                  {task.purpose}
                </p>
              )}
            </div>
            <span className="mono tnum" style={{ fontSize: 10, color: 'var(--text-soft)' }}>
              {wordCount(task.query)}w
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
