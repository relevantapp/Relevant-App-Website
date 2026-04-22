'use client'

import { useState } from 'react'
import type { BriefSource, DriverTree as DriverTreeData } from '@/lib/intelligence/contracts'
import CitedText from '../CitedText'
import ExhibitShell from '../ExhibitShell'

const DRIVER_BRANCH_ORDER = ['demand', 'economics', 'strategic-fit', 'execution-risk'] as const

const DRIVER_BRANCH_META = {
  demand: 'Demand',
  economics: 'Unit economics',
  'strategic-fit': 'Strategic fit',
  'execution-risk': 'Execution risk',
} as const

const CONFIDENCE_LABEL = {
  high: 'High confidence',
  med: 'Medium confidence',
  low: 'Low confidence',
} as const

function getConfidenceColor(level: 'high' | 'med' | 'low') {
  if (level === 'high') return 'var(--accent-teal)'
  if (level === 'med') return 'var(--accent-amber)'
  return 'var(--text-soft)'
}

interface DriverTreeProps {
  data: DriverTreeData
  headline: string
  subhead?: string
  asOf: string
  sources: BriefSource[]
}

export default function DriverTree({ data, headline, subhead, asOf, sources }: DriverTreeProps) {
  const [openBranch, setOpenBranch] = useState<string | null>(null)
  const branchMap = new Map(data.branches.map((branch) => [branch.name, branch]))

  return (
    <ExhibitShell headline={headline} subhead={subhead} asOf={asOf} sources={sources}>
      <div className="grid gap-4 md:grid-cols-2">
        {DRIVER_BRANCH_ORDER.map((branchName) => {
          const branch = branchMap.get(branchName)
          const isOpen = openBranch === branchName

          if (!branch) {
            return (
              <article key={branchName} className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)] px-5 py-5">
                <p data-testid="driver-branch-title" className="text-sm font-semibold text-[var(--text)]">
                  {DRIVER_BRANCH_META[branchName]}
                </p>
                <p className="mt-3 text-sm text-[var(--text-muted)]">Not assessed.</p>
              </article>
            )
          }

          const confidenceColor = getConfidenceColor(branch.confidence)

          return (
            <article key={branch.name} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-5">
              <button
                type="button"
                className="w-full text-left focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-elevated)]"
                aria-expanded={isOpen}
                onClick={() => setOpenBranch((current) => (current === branchName ? null : branchName))}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setOpenBranch((current) => (current === branchName ? null : branchName))
                  }
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p data-testid="driver-branch-title" className="text-sm font-semibold text-[var(--text)]">
                      {DRIVER_BRANCH_META[branch.name]}
                    </p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                      <div
                        className="h-full rounded-full bg-[var(--accent)]"
                        style={{ width: `${(branch.score / 5) * 100}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-[var(--text-soft)]">{branch.score.toFixed(1)} / 5</p>
                  </div>
                  <span
                    className="inline-flex rounded-full border px-3 py-1 text-[11px] font-medium"
                    style={{
                      color: confidenceColor,
                      borderColor: confidenceColor,
                      background: `color-mix(in oklch, ${confidenceColor} 12%, transparent)`,
                    }}
                  >
                    {CONFIDENCE_LABEL[branch.confidence]}
                  </span>
                </div>
              </button>

              {isOpen ? (
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--text-muted)]">
                  {branch.children.map((child) => (
                    <li key={child.label}>
                      <span className="font-medium text-[var(--text)]">{child.label}: </span>
                      <CitedText spans={[child.evidence]} sources={sources} />
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          )
        })}
      </div>
    </ExhibitShell>
  )
}
