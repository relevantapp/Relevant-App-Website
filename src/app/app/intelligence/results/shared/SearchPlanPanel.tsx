'use client'

import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Dot } from '../../ui/primitives'
import type { ResearchPlan } from '../../types'

interface SearchPlanPanelProps {
  plan?: ResearchPlan | null
}

function providerColor(provider: string): string {
  if (provider === 'exa') return 'var(--accent-amber)'
  if (provider === 'internal') return 'var(--accent-lime, var(--accent-teal))'
  return 'var(--accent-teal)'
}

function formatSourceRole(role: string | undefined): string | null {
  if (!role) return null
  return role.replace(/_/g, ' ')
}

function wordCount(query: string): number {
  return query.trim().split(/\s+/).filter(Boolean).length
}

export default function SearchPlanPanel({ plan }: SearchPlanPanelProps) {
  const [open, setOpen] = useState(false)

  if (!plan?.searches?.length) return null

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)]">
      <button
        type="button"
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 border-b border-[var(--border)] px-5 py-4 text-left transition-colors hover:bg-[var(--surface)]"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Dot color="var(--accent-teal)" size={7} />
          <span className="kicker">Search plan · {plan.searches.length}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2 text-xs text-[var(--text-soft)]">
          {open ? 'Hide' : 'Open'}
          {open ? (
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </span>
      </button>

      {open && (
        <>
          {plan.summary && (
            <p className="m-0 border-b border-[var(--border)] px-5 py-4 text-sm leading-relaxed text-[var(--text-muted)]">
              {plan.summary}
            </p>
          )}

          <div className="px-5 py-5">
            {plan.searches.slice(0, 8).map((task, index) => (
              <div
                key={`${task.provider}-${task.query}-${index}`}
                className={`grid gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 ${index === 0 ? '' : 'mt-3'} md:grid-cols-[96px_1fr_auto] md:items-start`}
              >
                <span className="mono text-[10px] uppercase tracking-[0.16em]" style={{ color: providerColor(task.provider) }}>
                  {task.provider}
                </span>
                <div className="min-w-0">
                  <p className="m-0 text-sm leading-relaxed text-[var(--text)]">
                    {task.query}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {formatSourceRole(task.sourceRole) && (
                      <span className="rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-[var(--text-soft)]">
                        {formatSourceRole(task.sourceRole)}
                      </span>
                    )}
                    <span className="rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-[var(--text-soft)]">
                      {wordCount(task.query)} words
                    </span>
                  </div>
                  {task.purpose && (
                    <p className="mt-3 text-sm leading-relaxed text-[var(--text-soft)]">
                      {task.purpose}
                    </p>
                  )}
                </div>
                <span className="mono tnum text-[10px] uppercase tracking-[0.16em] text-[var(--text-soft)]">
                  #{index + 1}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
