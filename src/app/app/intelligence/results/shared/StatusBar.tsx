'use client'

import type { BriefStatus } from '@/lib/intelligence/types'

interface StatusBarProps {
  status: BriefStatus
}

export default function StatusBar({ status }: StatusBarProps) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[var(--text-soft)]">
      <span>⏱ {(status.totalMs / 1000).toFixed(1)}s</span>
      <span>·</span>
      <span>{status.sourceCount} sources</span>
      <span>·</span>
      <span className={status.exaSearchMs > 0 ? 'text-[var(--accent-teal)]' : 'text-[var(--accent-coral)]'}>
        Exa {status.exaSearchMs > 0 ? '✓' : '✗'}
      </span>
      <span className={status.tavilySearchMs > 0 ? 'text-[var(--accent-teal)]' : 'text-[var(--accent-coral)]'}>
        Tavily {status.tavilySearchMs > 0 ? '✓' : '✗'}
      </span>
      <span className={!status.degraded ? 'text-[var(--accent-teal)]' : 'text-[var(--accent-coral)]'}>
        AI {!status.degraded ? '✓' : '✗'}
      </span>
      {status.synthesisModel && (
        <span className="rounded bg-[var(--surface-strong)] px-1.5 py-0.5 text-[10px]">
          {status.synthesisModel}
        </span>
      )}
    </div>
  )
}
