'use client'

import type { BriefSource, StakeholderRow } from '@/lib/intelligence/contracts'
import CitedText from '../CitedText'
import ExhibitShell from '../ExhibitShell'
import UnknownField from '../UnknownField'
import DiscChip from './DiscChip'

function hasProfileEvidence(row: StakeholderRow): boolean {
  return Boolean(
    row.likelyAgenda?.sourceIds.length
    || row.pressure?.sourceIds.length
    || row.leverage?.sourceIds.length,
  )
}

interface StakeholderMatrixProps {
  rows: StakeholderRow[]
  sources: BriefSource[]
  asOf: string
}

export default function StakeholderMatrix({ rows, sources, asOf }: StakeholderMatrixProps) {
  return (
    <ExhibitShell headline="Who is actually in the room" asOf={asOf} sources={sources}>
      <div className="overflow-x-auto">
        <table className="min-w-[980px] border-separate border-spacing-0 text-left">
          <thead className="sticky top-0 z-10 bg-[var(--bg-elevated)]">
            <tr>
              {['Name', 'Title', 'Likely agenda', 'Pressure', 'Leverage', 'Unknowns'].map((header) => (
                <th key={header} className="min-w-[160px] border-b border-[var(--border)] px-4 py-3 text-[11px] uppercase tracking-[0.16em] text-[var(--text-soft)]">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name}>
                <td className="min-w-[190px] border-b border-[var(--border)] px-4 py-4 text-sm font-medium text-[var(--text)]">
                  <div className="flex min-w-0 items-start gap-2">
                    <span className="break-words leading-relaxed">{row.name}</span>
                    {row.disc && hasProfileEvidence(row) ? <DiscChip disc={row.disc} personName={row.name} commsStyleTag={row.commsStyleTag} /> : null}
                  </div>
                </td>
                <td className="min-w-[170px] break-words border-b border-[var(--border)] px-4 py-4 text-sm text-[var(--text-muted)]">
                  {row.title ?? (
                    <span data-testid="stakeholder-unknown">
                      <UnknownField label="Title" queriesTried={[]} />
                    </span>
                  )}
                </td>
                <td className="min-w-[220px] break-words border-b border-[var(--border)] px-4 py-4 text-sm text-[var(--text-muted)]">
                  {row.likelyAgenda ? (
                    <CitedText spans={[row.likelyAgenda]} sources={sources} />
                  ) : (
                    <span data-testid="stakeholder-unknown">
                      <UnknownField label="Likely agenda" queriesTried={[]} />
                    </span>
                  )}
                </td>
                <td className="min-w-[220px] break-words border-b border-[var(--border)] px-4 py-4 text-sm text-[var(--text-muted)]">
                  {row.pressure ? (
                    <CitedText spans={[row.pressure]} sources={sources} />
                  ) : (
                    <span data-testid="stakeholder-unknown">
                      <UnknownField label="Pressure" queriesTried={[]} />
                    </span>
                  )}
                </td>
                <td className="min-w-[220px] break-words border-b border-[var(--border)] px-4 py-4 text-sm text-[var(--text-muted)]">
                  {row.leverage ? (
                    <CitedText spans={[row.leverage]} sources={sources} />
                  ) : (
                    <span data-testid="stakeholder-unknown">
                      <UnknownField label="Leverage" queriesTried={[]} />
                    </span>
                  )}
                </td>
                <td className="min-w-[220px] border-b border-[var(--border)] px-4 py-4">
                  {row.unknowns.length > 0 ? (
                    <ul className="space-y-2 text-sm leading-relaxed text-[var(--text-muted)]">
                      {row.unknowns.map((unknown) => (
                        <li key={unknown} className="break-words">• {unknown}</li>
                      ))}
                    </ul>
                  ) : (
                    <span data-testid="stakeholder-unknown">
                      <UnknownField label="Unknowns" queriesTried={[]} />
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ExhibitShell>
  )
}
