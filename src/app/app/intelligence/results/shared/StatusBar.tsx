'use client'

import type { BriefStatus } from '@/lib/intelligence/contracts'

interface StatusBarProps {
  status: BriefStatus
}

function StatCell({ value, label, accent }: { value: string; label: string; accent?: string }) {
  return (
    <div className="bg-[var(--bg-elevated)] px-4 py-4">
      <div
        className="display tnum"
        style={{ fontSize: 22, fontWeight: 600, color: accent ?? 'var(--text)', lineHeight: 1.1 }}
      >
        {value}
      </div>
      <div className="kicker mt-1">{label}</div>
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
  const sourceCounts = status.sourceCounts ?? {
    found: status.sourceCount,
    ranked: status.sourceCount,
    used: status.sourceCount,
  }

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="border-b border-[var(--border)] px-5 py-4">
        <p className="kicker">Run stats</p>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--text-muted)]">
          Found is the unique source set gathered for the run. Ranked is the subset passed into synthesis. Used is the subset cited in the answer.
        </p>
      </div>

      <div className="grid gap-px bg-[var(--border)] sm:grid-cols-2 xl:grid-cols-6">
        <StatCell value={String(sourceCounts.found)} label="FOUND" />
        <StatCell value={String(sourceCounts.ranked)} label="RANKED" />
        <StatCell value={String(sourceCounts.used)} label="USED" />
        <StatCell value={`${duration}s`} label="DURATION" />
        <StatCell value={modelName} label="MODEL" />
        <StatCell
          value={status.degraded ? 'DEGRADED' : 'CLEAN'}
          label="STATUS"
          accent={status.degraded ? 'var(--accent-coral)' : 'var(--accent-teal)'}
        />
      </div>

      <div className="flex flex-wrap gap-2 px-5 py-4">
        <ProviderPill name="Internal" active={(status.internalMs ?? 0) > 0} />
        <ProviderPill name="Exa" active={(status.exaMs ?? status.exaSearchMs) > 0} />
        <ProviderPill name="Tavily" active={(status.tavilyMs ?? status.tavilySearchMs) > 0} />
        {status.cached && (
          <span className="mono" style={{ fontSize: 10, color: 'var(--text-soft)' }}>cached</span>
        )}
      </div>
    </div>
  )
}
