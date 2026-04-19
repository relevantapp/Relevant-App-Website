'use client'

import { useCallback, useRef } from 'react'
import { Target, TrendingUp, Lightbulb } from 'lucide-react'
import type { CompetitiveAnalysisBrief } from '../types'
import ResultsHero from './shared/ResultsHero'
import InsightSection from './shared/InsightSection'
import ScoreBar from './shared/ScoreBar'
import SourcesStrip from './shared/SourcesStrip'
import StatusBar from './shared/StatusBar'
import CopyModePicker from './shared/CopyModePicker'
import DegradedBanner from './shared/DegradedBanner'
import ShareButton from './shared/ShareButton'

interface CompetitiveResultsProps {
  brief: CompetitiveAnalysisBrief
  onNewSearch: () => void
  savedBriefId?: string | null
}

export default function CompetitiveResults({ brief, onNewSearch, savedBriefId }: CompetitiveResultsProps) {
  const exportRef = useRef<HTMLDivElement>(null)

  const scrollToSource = useCallback((id: string) => {
    const el = document.getElementById(`source-${id}`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    el.classList.add('intel-source-highlighted')
    setTimeout(() => el.classList.remove('intel-source-highlighted'), 2000)
  }, [])

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <button
          onClick={onNewSearch}
          style={{ padding: '6px 14px', fontSize: 12, color: 'var(--text-muted)', background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }}
        >
          ← New search
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShareButton briefId={savedBriefId ?? null} />
          <CopyModePicker brief={brief} exportRef={exportRef} />
        </div>
      </div>

      <div ref={exportRef}>
      <ResultsHero
        headline={brief.headline}
        bottomLine={brief.bottomLine}
        confidence={brief.confidence}
        researchType="competitive_analysis"
        whyItMatters={brief.whyItMatters}
        generatedAt={brief.generatedAt}
      />

      {brief.status.degraded && <DegradedBanner reasons={brief.status.reasons} />}

      {/* Competitor Cards */}
      {brief.competitors.length > 0 && (
        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {brief.competitors.map((comp) => (
            <div key={comp.name} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                  <span className="mono" style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)' }}>{comp.name.charAt(0)}</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{comp.name}</span>
              </div>
              <p style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-muted)' }}>{comp.description}</p>
              {comp.strengths.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {comp.strengths.map((s) => (
                    <span key={s} className="ev-tag ev-tag--fact">{s}</span>
                  ))}
                </div>
              )}
              {comp.weaknesses.length > 0 && (
                <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {comp.weaknesses.map((w) => (
                    <span key={w} className="mono" style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, color: 'var(--accent-coral)', background: 'color-mix(in oklch, var(--accent-coral) 12%, transparent)', border: '1px solid color-mix(in oklch, var(--accent-coral) 20%, transparent)', letterSpacing: '0.08em' }}>{w}</span>
                  ))}
                </div>
              )}
              {comp.recentMoves.length > 0 && (
                <div style={{ marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                  {comp.recentMoves.map((move, i) => (
                    <p key={i} style={{ fontSize: 11, lineHeight: 1.45, color: 'var(--text-soft)', marginTop: i > 0 ? 4 : 0 }}>• {move}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Comparison Matrix */}
      {brief.comparisonMatrix.length > 0 && (
        <div style={{ marginTop: 24, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--border)' }}>
            <span className="kicker">Comparison matrix</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="kicker" style={{ textAlign: 'left', padding: '10px 18px', fontSize: 10 }}>Dimension</th>
                  {getUniqueCompanies(brief.comparisonMatrix).map((c) => (
                    <th key={c} className="kicker" style={{ textAlign: 'left', padding: '10px 18px', fontSize: 10 }}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {brief.comparisonMatrix.map((row) => (
                  <tr key={row.dimension} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 18px', fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{row.dimension}</td>
                    {getUniqueCompanies(brief.comparisonMatrix).map((company) => {
                      const val = row.values.find((v) => v.company === company)
                      return (
                        <td key={company} style={{ padding: '10px 18px' }}>
                          {val ? (
                            <div>
                              <ScoreBar score={val.score} />
                              <p style={{ marginTop: 4, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{val.position}</p>
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--text-soft)' }}>—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Insight sections */}
      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <InsightSection
          title="Key Findings"
          icon={<Target className="h-4 w-4" style={{ color: 'var(--accent-teal)' }} />}
          bullets={brief.sections.keyFindings}
          onSourceClick={scrollToSource}
        />
        <InsightSection
          title="Strategic Implications"
          icon={<TrendingUp className="h-4 w-4" style={{ color: 'var(--accent-amber)' }} />}
          bullets={brief.sections.strategicImplications}
          onSourceClick={scrollToSource}
        />
      </div>

      {brief.sections.recommendations.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <InsightSection
            title="Recommendations"
            icon={<Lightbulb className="h-4 w-4" style={{ color: 'var(--accent)' }} />}
            bullets={brief.sections.recommendations}
            onSourceClick={scrollToSource}
          />
        </div>
      )}

      </div>

      <div style={{ marginTop: 32 }}>
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
