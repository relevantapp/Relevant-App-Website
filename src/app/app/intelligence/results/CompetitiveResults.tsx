'use client'

import { useCallback, useRef } from 'react'
import { Target, TrendingUp, Lightbulb } from 'lucide-react'
import type { CompetitiveAnalysisBrief } from '../types'
import { INTEL_RESULTS_V2 } from '@/lib/intelligence/feature-flags'
import AnswerBlock from './shared/AnswerBlock'
import ResultsHero from './shared/ResultsHero'
import InsightSection from './shared/InsightSection'
import ScoreBar from './shared/ScoreBar'
import SourcesStrip from './shared/SourcesStrip'
import StatusBar from './shared/StatusBar'
import CopyModePicker from './shared/CopyModePicker'
import DegradedBanner from './shared/DegradedBanner'
import ShareButton from './shared/ShareButton'
import SearchPlanPanel from './shared/SearchPlanPanel'
import ExhibitShell from './shared/ExhibitShell'
import MethodologyDrawer from './shared/MethodologyDrawer'
import CapabilityMatrix from './shared/viz/CapabilityMatrix'
import CompositeQuadrant from './shared/viz/CompositeQuadrant'
import Timeline from './shared/viz/Timeline'
import WhitespacePanel from './shared/viz/WhitespacePanel'
import HistoryButton from '../HistoryButton'

interface CompetitiveResultsProps {
  brief: CompetitiveAnalysisBrief
  onNewSearch: () => void
  savedBriefId?: string | null
}

export default function CompetitiveResults({ brief, onNewSearch, savedBriefId }: CompetitiveResultsProps) {
  const exportRef = useRef<HTMLDivElement>(null)
  const hasTypedRecentMoves = brief.competitors.some((competitor) => (competitor.recentMovesTyped?.length ?? 0) > 0)

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
          <HistoryButton compact />
          <ShareButton briefId={savedBriefId ?? null} />
          <CopyModePicker brief={brief} exportRef={exportRef} />
        </div>
      </div>

      <div ref={exportRef}>
      {INTEL_RESULTS_V2 && (
        <div style={{ marginBottom: 16 }}>
          <MethodologyDrawer
            methodology={brief.methodology}
            trust={brief.trust}
            status={brief.status}
            sources={brief.sources}
            inputSummary={brief.researchPlan?.summary}
          />
        </div>
      )}

      {INTEL_RESULTS_V2 && (
        <div style={{ marginBottom: 24 }}>
          <AnswerBlock
            answer={brief.answer}
            fallback={{
              headline: brief.headline,
              bottomLine: brief.bottomLine,
              confidence: brief.confidence,
              whyItMatters: brief.whyItMatters,
            }}
            sources={brief.sources}
          />
        </div>
      )}

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
              {comp.recentMoves.length > 0 && (!INTEL_RESULTS_V2 || !hasTypedRecentMoves) && (
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

      {INTEL_RESULTS_V2 && brief.competitors.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <Timeline
            competitors={brief.competitors}
            headline="Competitor moves are clustering around workflow packaging"
            subhead="Recent moves become more useful when they are dated, typed, and viewable across the whole set."
            asOf={brief.generatedAt}
            sources={brief.sources}
          />
        </div>
      )}

      {/* Comparison Matrix */}
      {brief.comparisonMatrix.length > 0 && (
        <div style={{ marginTop: 24 }}>
          {(() => {
            const companies = getMatrixCompanies(brief.comparisonMatrix, brief.yourCompany)

            return INTEL_RESULTS_V2 ? (
              <CapabilityMatrix
                data={brief.comparisonMatrix}
                headline={`${brief.headline} - capability comparison`}
                subhead="The comparison matrix is still the fastest way to see where each platform actually wins."
                asOf={brief.generatedAt}
                sources={brief.sources}
                yourCompany={brief.yourCompany}
              />
            ) : (
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--border)' }}>
                  <span className="kicker">Comparison matrix</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <th className="kicker" style={{ textAlign: 'left', padding: '10px 18px', fontSize: 10 }}>Dimension</th>
                        {companies.map((company) => {
                          const isYourCompany = company === brief.yourCompany
                          return (
                            <th
                              key={company}
                              className="kicker"
                              style={{
                                textAlign: 'left',
                                padding: '10px 18px',
                                fontSize: 10,
                                background: isYourCompany ? 'color-mix(in oklch, var(--accent-teal) 10%, var(--surface))' : undefined,
                              }}
                            >
                              <span>{company}</span>
                              {isYourCompany && (
                                <span
                                  style={{
                                    marginLeft: 8,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    borderRadius: 999,
                                    padding: '2px 7px',
                                    fontSize: 9,
                                    letterSpacing: '0.12em',
                                    textTransform: 'uppercase',
                                    color: 'var(--accent-teal)',
                                    background: 'color-mix(in oklch, var(--accent-teal) 16%, transparent)',
                                  }}
                                >
                                  you
                                </span>
                              )}
                            </th>
                          )
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {brief.comparisonMatrix.map((row) => (
                        <tr key={row.dimension} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '10px 18px', fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{row.dimension}</td>
                          {companies.map((company) => {
                            const val = row.values.find((v) => v.company === company)
                            const isYourCompany = company === brief.yourCompany
                            return (
                              <td
                                key={company}
                                style={{
                                  padding: '10px 18px',
                                  background: isYourCompany ? 'color-mix(in oklch, var(--accent-teal) 8%, var(--surface))' : undefined,
                                }}
                              >
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
            )
          })()}
        </div>
      )}

      {INTEL_RESULTS_V2 && brief.compositeQuadrant && (
        <div style={{ marginTop: 24 }}>
          <CompositeQuadrant
            data={brief.compositeQuadrant}
            headline="The field still splits between breadth and decision velocity"
            subhead="This quadrant only renders when both axes are defensible enough to explain."
            asOf={brief.generatedAt}
            sources={brief.sources}
          />
        </div>
      )}

      {INTEL_RESULTS_V2 && (
        <div style={{ marginTop: 24 }}>
          <WhitespacePanel
            data={brief.whitespace ?? []}
            headline="Relevant still has open pockets to win"
            subhead="The goal is not to find a gap everywhere. It is to show where the market actually leaves room."
            asOf={brief.generatedAt}
            sources={brief.sources}
          />
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
        <SearchPlanPanel plan={brief.researchPlan} />
      </div>
      <div style={{ marginTop: 32 }}>
        <SourcesStrip sources={brief.sources} />
      </div>
      <StatusBar status={brief.status} />
    </div>
  )
}

function getMatrixCompanies(matrix: CompetitiveAnalysisBrief['comparisonMatrix'], yourCompany?: string | null): string[] {
  const seen = new Set<string>()
  for (const row of matrix) {
    for (const v of row.values) seen.add(v.company)
  }
  const companies = Array.from(seen)

  if (!yourCompany || !companies.includes(yourCompany)) {
    return companies
  }

  return [yourCompany, ...companies.filter((company) => company !== yourCompany)]
}
