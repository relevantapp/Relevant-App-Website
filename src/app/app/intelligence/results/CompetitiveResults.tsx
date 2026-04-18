'use client'

import { useCallback } from 'react'
import { Target, TrendingUp, Lightbulb } from 'lucide-react'
import type { CompetitiveAnalysisBrief } from '../types'
import ResultsHero from './shared/ResultsHero'
import InsightSection from './shared/InsightSection'
import ScoreBar from './shared/ScoreBar'
import SourcesStrip from './shared/SourcesStrip'
import StatusBar from './shared/StatusBar'

interface CompetitiveResultsProps {
  brief: CompetitiveAnalysisBrief
  onNewSearch: () => void
}

export default function CompetitiveResults({ brief, onNewSearch }: CompetitiveResultsProps) {
  const scrollToSource = useCallback((id: string) => {
    const el = document.getElementById(`source-${id}`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    el.classList.add('intel-source-highlighted')
    setTimeout(() => el.classList.remove('intel-source-highlighted'), 2000)
  }, [])

  const handleCopy = useCallback(async () => {
    const lines: string[] = [`# ${brief.headline}`, '', `> ${brief.bottomLine}`, '']
    for (const comp of brief.competitors) {
      lines.push(`## ${comp.name}`, comp.description)
      if (comp.strengths.length) lines.push(`**Strengths:** ${comp.strengths.join(', ')}`)
      if (comp.weaknesses.length) lines.push(`**Weaknesses:** ${comp.weaknesses.join(', ')}`)
      lines.push('')
    }
    if (brief.comparisonMatrix.length) {
      lines.push('## Comparison Matrix')
      for (const row of brief.comparisonMatrix) {
        lines.push(`**${row.dimension}:** ${row.values.map((v) => `${v.company}: ${v.position} (${v.score}/5)`).join(' | ')}`)
      }
      lines.push('')
    }
    await navigator.clipboard.writeText(lines.join('\n'))
  }, [brief])

  return (
    <div className="mx-auto w-full max-w-4xl">
      <ResultsHero
        headline={brief.headline}
        bottomLine={brief.bottomLine}
        confidence={brief.confidence}
        researchType="competitive_analysis"
        onNewSearch={onNewSearch}
        onCopy={handleCopy}
      />

      {/* Competitor Cards */}
      {brief.competitors.length > 0 && (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brief.competitors.map((comp) => (
            <div key={comp.name} className="rounded-xl border border-[var(--surface-strong)] bg-[var(--surface)] p-4">
              <h4 className="text-sm font-semibold text-[var(--text)]">{comp.name}</h4>
              <p className="mt-1 text-xs text-[var(--text-muted)] line-clamp-2">{comp.description}</p>
              {comp.strengths.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {comp.strengths.map((s) => (
                    <span key={s} className="rounded-full bg-[var(--accent-teal)]/15 px-2 py-0.5 text-[10px] text-[var(--accent-teal)]">{s}</span>
                  ))}
                </div>
              )}
              {comp.weaknesses.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {comp.weaknesses.map((w) => (
                    <span key={w} className="rounded-full bg-[var(--accent-coral)]/15 px-2 py-0.5 text-[10px] text-[var(--accent-coral)]">{w}</span>
                  ))}
                </div>
              )}
              {comp.recentMoves.length > 0 && (
                <div className="mt-2 space-y-1">
                  {comp.recentMoves.map((move, i) => (
                    <p key={i} className="text-[11px] text-[var(--text-soft)]">• {move}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Comparison Matrix */}
      {brief.comparisonMatrix.length > 0 && (
        <div className="mt-5 overflow-x-auto rounded-xl border border-[var(--surface-strong)] bg-[var(--surface)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--surface-strong)]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)]">Dimension</th>
                {getUniqueCompanies(brief.comparisonMatrix).map((c) => (
                  <th key={c} className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)]">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {brief.comparisonMatrix.map((row) => (
                <tr key={row.dimension} className="border-b border-[var(--surface-strong)] last:border-0">
                  <td className="px-4 py-3 text-xs font-medium text-[var(--text)]">{row.dimension}</td>
                  {getUniqueCompanies(brief.comparisonMatrix).map((company) => {
                    const val = row.values.find((v) => v.company === company)
                    return (
                      <td key={company} className="px-4 py-3">
                        {val ? (
                          <div>
                            <ScoreBar score={val.score} />
                            <p className="mt-1 text-[11px] text-[var(--text-muted)]">{val.position}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-[var(--text-soft)]">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Insight sections */}
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <InsightSection
          title="Key Findings"
          icon={<Target className="h-4 w-4 text-[var(--accent-teal)]" />}
          bullets={brief.sections.keyFindings}
          borderColor="border-[var(--accent-teal)]/20"
          onSourceClick={scrollToSource}
        />
        <InsightSection
          title="Strategic Implications"
          icon={<TrendingUp className="h-4 w-4 text-[var(--accent-amber)]" />}
          bullets={brief.sections.strategicImplications}
          borderColor="border-[var(--accent-amber)]/20"
          onSourceClick={scrollToSource}
        />
      </div>

      {brief.sections.recommendations.length > 0 && (
        <div className="mt-4">
          <InsightSection
            title="Recommendations"
            icon={<Lightbulb className="h-4 w-4 text-[var(--accent)]" />}
            bullets={brief.sections.recommendations}
            borderColor="border-[var(--accent)]/20"
            onSourceClick={scrollToSource}
          />
        </div>
      )}

      <div className="mt-6">
        <SourcesStrip sources={brief.sources} />
      </div>
      <StatusBar status={brief.status} />
    </div>
  )
}

function getUniqueCompanies(matrix: CompetitiveAnalysisBrief['comparisonMatrix']): string[] {
  const seen = new Set<string>()
  for (const row of matrix) {
    for (const v of row.values) seen.add(v.company)
  }
  return Array.from(seen)
}
