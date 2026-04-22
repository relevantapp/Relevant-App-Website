'use client'

import { useMemo, useState } from 'react'
import type { Assumption, BriefSource } from '@/lib/intelligence/contracts'
import ConfidenceBadge from '../ConfidenceBadge'
import ExhibitShell from '../ExhibitShell'
import SourcePopover from '../SourcePopover'

type SortDirection = 'asc' | 'desc'

const CONFIDENCE_RANK = {
  low: 0,
  med: 1,
  high: 2,
} as const

function toConfidenceBadgeLevel(level: Assumption['confidence']) {
  return level === 'med' ? 'medium' : level
}

function getEvidenceChips(evidence: Assumption['evidence'], sources: BriefSource[]) {
  const seen = new Set<string>()
  const chips: Array<{ source: BriefSource | undefined; sourceId: string; snippet?: string | null }> = []

  for (const span of evidence) {
    for (const sourceId of span.sourceIds) {
      if (seen.has(sourceId)) continue
      seen.add(sourceId)
      chips.push({
        sourceId,
        source: sources.find((source) => source.id === sourceId),
        snippet: span.sourceSnippet,
      })
    }
  }

  return chips
}

interface AssumptionsRegisterProps {
  data: Assumption[]
  headline: string
  subhead?: string
  asOf: string
  sources: BriefSource[]
}

export default function AssumptionsRegister({ data, headline, subhead, asOf, sources }: AssumptionsRegisterProps) {
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [openKey, setOpenKey] = useState<string | null>(null)

  const rows = useMemo(() => {
    return [...data].sort((left, right) => {
      const delta = CONFIDENCE_RANK[left.confidence] - CONFIDENCE_RANK[right.confidence]
      return sortDirection === 'asc' ? delta : -delta
    })
  }, [data, sortDirection])

  if (rows.length === 0) {
    return (
      <ExhibitShell headline={headline} subhead={subhead} asOf={asOf} sources={sources}>
        <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)] px-5 py-5 text-sm text-[var(--text-muted)]">
          No assumptions surfaced yet.
        </div>
      </ExhibitShell>
    )
  }

  return (
    <ExhibitShell headline={headline} subhead={subhead} asOf={asOf} sources={sources}>
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-left">
          <thead>
            <tr>
              {['Assumption', 'Why it matters', 'Evidence'].map((header) => (
                <th key={header} className="border-b border-[var(--border)] px-4 py-3 text-[11px] uppercase tracking-[0.16em] text-[var(--text-soft)]">
                  {header}
                </th>
              ))}
              <th className="border-b border-[var(--border)] px-4 py-3 text-[11px] uppercase tracking-[0.16em] text-[var(--text-soft)]">
                <button
                  type="button"
                  className="focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-elevated)]"
                  onClick={() => setSortDirection((current) => (current === 'desc' ? 'asc' : 'desc'))}
                >
                  Confidence
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.text}>
                <td className="border-b border-[var(--border)] px-4 py-4 text-sm font-medium text-[var(--text)]">{row.text}</td>
                <td className="border-b border-[var(--border)] px-4 py-4 text-sm leading-relaxed text-[var(--text-muted)]">{row.mustBeTrueBecause}</td>
                <td className="border-b border-[var(--border)] px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    {getEvidenceChips(row.evidence, sources).map((chip, index) => {
                      const key = `${row.text}-${chip.sourceId}-${index}`
                      const isOpen = openKey === key
                      const popoverId = `assumption-evidence-${index}`

                      return (
                        <span
                          key={key}
                          className="relative"
                          onMouseEnter={() => setOpenKey(key)}
                          onMouseLeave={() => setOpenKey((current) => (current === key ? null : current))}
                        >
                          <button
                            type="button"
                            className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-[11px] text-[var(--text-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-elevated)]"
                            aria-describedby={isOpen ? popoverId : undefined}
                            onClick={() => setOpenKey((current) => (current === key ? null : key))}
                          >
                            {chip.source?.domain ?? chip.sourceId}
                          </button>
                          {isOpen ? <SourcePopover id={popoverId} source={chip.source} snippet={chip.snippet} /> : null}
                        </span>
                      )
                    })}
                  </div>
                </td>
                <td className="border-b border-[var(--border)] px-4 py-4">
                  <ConfidenceBadge level={toConfidenceBadgeLevel(row.confidence)} driver={row.mustBeTrueBecause} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ExhibitShell>
  )
}
