/* ── DegradedBanner — unified partial-success notice ────── */
'use client'

import { AlertTriangle } from 'lucide-react'

interface DegradedBannerProps {
  reasons: string[]
}

export default function DegradedBanner({ reasons }: DegradedBannerProps) {
  if (reasons.length === 0) return null

  return (
    <div className="mt-4 rounded-lg border border-[var(--accent-amber)]/20 bg-[var(--accent-amber)]/[0.06] px-4 py-3">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-amber)]" />
        <div>
          <p className="text-sm font-medium text-[var(--accent-amber)]">
            Partial results
          </p>
          <ul className="mt-1 space-y-0.5">
            {reasons.map((reason) => (
              <li key={reason} className="text-xs text-[var(--text-muted)]">
                {reason}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
