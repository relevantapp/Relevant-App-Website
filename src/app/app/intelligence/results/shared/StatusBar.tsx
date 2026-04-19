'use client'

import type { BriefStatus } from '@/lib/intelligence/contracts'

interface StatusBarProps {
  status: BriefStatus
}

function StatCell({ value, label, accent }: { value: string; label: string; accent?: string }) {
  return (
    <div style={{ padding: '12px 16px' }}>
      <div
        className="display tnum"
        style={{ fontSize: 22, fontWeight: 600, color: accent ?? 'var(--text)', lineHeight: 1.1 }}
      >
        {value}
      </div>
      <div className="kicker" style={{ marginTop: 4 }}>{label}</div>
    </div>
  )
}

function ProviderPill({ name, active }: { name: string; active: boolean }) {
  return (
    <span
      className="mono"
      style={{
        fontSize: 10,
        padding: '2px 8px',
        borderRadius: 2,
        border: '1px solid var(--border)',
        color: active ? 'var(--accent-teal)' : 'var(--text-soft)',
        background: active ? 'rgba(0,200,150,0.06)' : 'transparent',
      }}
    >
      {name} {active ? '✓' : '✗'}
    </span>
  )
}

export default function StatusBar({ status }: StatusBarProps) {
  const duration = (status.totalMs / 1000).toFixed(1)
  const modelName = status.synthesisModel?.split('/').pop() ?? '—'

  return (
    <div style={{ marginTop: 32 }}>
      <div className="kicker" style={{ marginBottom: 8 }}>RUN STATS</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          border: '1px solid var(--border)',
        }}
      >
        <StatCell value={String(status.sourceCount)} label="SOURCES" />
        <StatCell value={`${duration}s`} label="DURATION" />
        <StatCell value={modelName} label="MODEL" />
        <StatCell
          value={status.degraded ? 'DEGRADED' : 'CLEAN'}
          label="STATUS"
          accent={status.degraded ? 'var(--accent-coral)' : 'var(--accent-teal)'}
        />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <ProviderPill name="Exa" active={status.exaSearchMs > 0} />
        <ProviderPill name="Tavily" active={status.tavilySearchMs > 0} />
        {status.cached && (
          <span className="mono" style={{ fontSize: 10, color: 'var(--text-soft)' }}>cached</span>
        )}
      </div>
    </div>
  )
}
