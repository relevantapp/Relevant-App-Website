'use client'

import { useEffect, useState } from 'react'
import type { BriefSource, ComparisonRow } from '@/lib/intelligence/contracts'
import ExhibitShell from '../ExhibitShell'

interface CapabilityMatrixProps {
  data: ComparisonRow[]
  headline: string
  subhead?: string
  asOf: string
  sources: BriefSource[]
  briefId?: string | null
  yourCompany?: string | null
}

const DEFAULT_WEIGHT = 3
const STORAGE_KEY_PREFIX = 'intel-capability-matrix-weights'

function getMatrixCompanies(matrix: ComparisonRow[], yourCompany?: string | null): string[] {
  const seen = new Set<string>()

  for (const row of matrix) {
    for (const value of row.values) seen.add(value.company)
  }

  const companies = Array.from(seen)

  if (!yourCompany || !companies.includes(yourCompany)) return companies

  return [yourCompany, ...companies.filter((company) => company !== yourCompany)]
}

function getWeightedTotals(matrix: ComparisonRow[], companies: string[], weights: Record<string, number>) {
  return Object.fromEntries(
    companies.map((company) => {
      const total = matrix.reduce((sum, row) => {
        const value = row.values.find((entry) => entry.company === company)
        if (!value) return sum

        return sum + value.score * ((weights[row.dimension] ?? DEFAULT_WEIGHT) / DEFAULT_WEIGHT)
      }, 0)

      return [company, total]
    }),
  )
}

function formatTotal(total: number) {
  return Number.isInteger(total) ? `${total}` : total.toFixed(1)
}

function scoreColor(score: number) {
  if (score <= 2) return 'var(--accent-coral)'
  if (score <= 3) return 'var(--accent-amber)'

  return 'var(--accent-teal)'
}

function companyKey(company: string) {
  return company.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

function getDefaultWeights(data: ComparisonRow[]) {
  return Object.fromEntries(data.map((row) => [row.dimension, DEFAULT_WEIGHT]))
}

function clampWeight(value: unknown) {
  const numeric = typeof value === 'number' ? value : Number(value)

  if (!Number.isFinite(numeric)) return DEFAULT_WEIGHT

  return Math.max(0, Math.min(5, Math.round(numeric)))
}

function sanitizeStoredWeights(data: ComparisonRow[], stored: unknown) {
  const defaults = getDefaultWeights(data)
  if (!stored || typeof stored !== 'object') return defaults

  const storedWeights = stored as Record<string, unknown>

  return Object.fromEntries(
    data.map((row) => [row.dimension, clampWeight(storedWeights[row.dimension] ?? DEFAULT_WEIGHT)]),
  )
}

export function getCapabilityMatrixStorageKey(briefId: string) {
  return `${STORAGE_KEY_PREFIX}:${briefId}`
}

function loadPersistedWeights(data: ComparisonRow[], briefId?: string | null) {
  if (!briefId || typeof window === 'undefined') return getDefaultWeights(data)

  try {
    const raw = window.localStorage.getItem(getCapabilityMatrixStorageKey(briefId))
    return sanitizeStoredWeights(data, raw ? JSON.parse(raw) : null)
  } catch {
    return getDefaultWeights(data)
  }
}

export default function CapabilityMatrix({ data, headline, subhead, asOf, sources, briefId, yourCompany }: CapabilityMatrixProps) {
  const companies = getMatrixCompanies(data, yourCompany)
  const dimensionSignature = data.map((row) => row.dimension).join('|')
  const [weights, setWeights] = useState<Record<string, number>>(() => loadPersistedWeights(data, briefId))

  useEffect(() => {
    setWeights(loadPersistedWeights(data, briefId))
  }, [briefId, data, dimensionSignature])

  useEffect(() => {
    if (!briefId || typeof window === 'undefined') return

    try {
      window.localStorage.setItem(getCapabilityMatrixStorageKey(briefId), JSON.stringify(weights))
    } catch {
      // localStorage can fail in private mode or restricted environments
    }
  }, [briefId, weights])

  const totals = getWeightedTotals(data, companies, weights)

  return (
    <ExhibitShell headline={headline} subhead={subhead} asOf={asOf} sources={sources}>
      <div className="overflow-x-auto">
        <table className="min-w-[760px] border-separate border-spacing-0 text-left">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-20 min-w-[190px] border-b border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-[11px] uppercase tracking-[0.16em] text-[var(--text-soft)]">
                Dimension
              </th>
              <th className="sticky top-0 z-10 min-w-[180px] border-b border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-[11px] uppercase tracking-[0.16em] text-[var(--text-soft)]">
                Weight
              </th>
              {companies.map((company) => {
                const isYourCompany = company === yourCompany
                return (
                  <th
                    key={company}
                    data-testid={`capability-company-${companyKey(company)}`}
                    className="sticky top-0 z-10 min-w-[200px] border-b border-[var(--border)] px-4 py-3 text-[11px] uppercase tracking-[0.16em] text-[var(--text-soft)]"
                    style={{
                      background: isYourCompany ? 'color-mix(in oklch, var(--accent-teal) 12%, var(--bg-elevated))' : 'var(--bg-elevated)',
                    }}
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="break-words leading-tight">{company}</span>
                      {isYourCompany ? (
                        <span className="inline-flex shrink-0 rounded-full bg-[color-mix(in_oklch,var(--accent-teal)_16%,transparent)] px-2 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-[var(--accent-teal)]">
                          you
                        </span>
                      ) : null}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.dimension}>
                <td className="sticky left-0 z-10 min-w-[190px] border-b border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-4 text-sm font-medium text-[var(--text)]">
                  {row.dimension}
                </td>
                <td className="border-b border-[var(--border)] px-4 py-4">
                  <label className="sr-only" htmlFor={`capability-weight-${row.dimension}`}>
                    Weight for {row.dimension}
                  </label>
                  <div className="flex min-w-[160px] items-center gap-3">
                    <input
                      id={`capability-weight-${row.dimension}`}
                      type="range"
                      min={0}
                      max={5}
                      step={1}
                      value={weights[row.dimension] ?? DEFAULT_WEIGHT}
                      aria-label={`Weight for ${row.dimension}`}
                      className="w-full accent-[var(--accent)]"
                      onChange={(event) => {
                        const nextWeight = Number(event.currentTarget.value)
                        setWeights((current) => ({
                          ...current,
                          [row.dimension]: nextWeight,
                        }))
                      }}
                    />
                    <span className="mono min-w-[2ch] text-xs text-[var(--text-soft)]">{weights[row.dimension] ?? DEFAULT_WEIGHT}</span>
                  </div>
                </td>
                {companies.map((company) => {
                  const value = row.values.find((entry) => entry.company === company)
                  const isYourCompany = company === yourCompany

                  return (
                    <td
                      key={company}
                      className="border-b border-[var(--border)] px-4 py-4"
                      style={{
                        background: isYourCompany ? 'color-mix(in oklch, var(--accent-teal) 8%, var(--surface))' : undefined,
                      }}
                    >
                      {value ? (
                        <div className="min-w-[180px] max-w-[260px] space-y-2" title={`${value.score}/5`}>
                          <div className="h-2 overflow-hidden rounded-full bg-[var(--surface)]">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${(value.score / 5) * 100}%`,
                                background: scoreColor(value.score),
                              }}
                            />
                          </div>
                          <p className="break-words text-sm leading-relaxed text-[var(--text-muted)]">{value.position}</p>
                        </div>
                      ) : (
                        <span className="text-sm text-[var(--text-soft)]">No score recorded</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th className="sticky bottom-0 left-0 z-20 min-w-[190px] border-t border-[var(--border-strong)] bg-[var(--bg-elevated)] px-4 py-3 text-[11px] uppercase tracking-[0.16em] text-[var(--text-soft)]">
                Weighted total
              </th>
              <th className="sticky bottom-0 z-10 min-w-[180px] border-t border-[var(--border-strong)] bg-[var(--bg-elevated)] px-4 py-3 text-[11px] uppercase tracking-[0.16em] text-[var(--text-soft)]">
                live
              </th>
              {companies.map((company) => {
                const isYourCompany = company === yourCompany
                return (
                  <td
                    key={company}
                    data-testid={`capability-total-${companyKey(company)}`}
                    className="sticky bottom-0 z-10 border-t border-[var(--border-strong)] px-4 py-3 text-sm font-semibold text-[var(--text)]"
                    style={{
                      background: isYourCompany ? 'color-mix(in oklch, var(--accent-teal) 14%, var(--bg-elevated))' : 'var(--bg-elevated)',
                    }}
                  >
                    {formatTotal(totals[company] ?? 0)}
                  </td>
                )
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </ExhibitShell>
  )
}
