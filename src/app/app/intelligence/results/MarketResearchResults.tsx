'use client'

import { useCallback, useRef } from 'react'
import { TrendingUp, Target } from 'lucide-react'
import type { MarketResearchBrief } from '../types'
import { INTEL_RESULTS_V2 } from '@/lib/intelligence/feature-flags'
import AnswerBlock from './shared/AnswerBlock'
import ResultsHero from './shared/ResultsHero'
import PlayerCard from './shared/PlayerCard'
import BalanceView from './shared/BalanceView'
import InsightSection from './shared/InsightSection'
import SourcesStrip from './shared/SourcesStrip'
import StatusBar from './shared/StatusBar'
import CopyModePicker from './shared/CopyModePicker'
import DegradedBanner from './shared/DegradedBanner'
import ShareButton from './shared/ShareButton'
import SearchPlanPanel from './shared/SearchPlanPanel'
import ExhibitShell from './shared/ExhibitShell'
import MethodologyDrawer from './shared/MethodologyDrawer'
import LogoMarketMap from './shared/viz/LogoMarketMap'
import MaturityCurve from './shared/viz/MaturityCurve'
import Quadrant from './shared/viz/Quadrant'
import QuoteWall from './shared/viz/QuoteWall'
import TrendTracker from './shared/viz/TrendTracker'
import HistoryButton from '../HistoryButton'

interface MarketResearchResultsProps {
  brief: MarketResearchBrief
  onNewSearch: () => void
  savedBriefId?: string | null
}

export default function MarketResearchResults({ brief, onNewSearch, savedBriefId }: MarketResearchResultsProps) {
  const exportRef = useRef<HTMLDivElement>(null)

  const scrollToSource = useCallback((id: string) => {
    const el = document.getElementById(`source-${id}`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    el.classList.add('intel-source-highlighted')
    setTimeout(() => el.classList.remove('intel-source-highlighted'), 2000)
  }, [])

  const sortedPlayers = [...brief.players].sort((a, b) => {
    const order = { leader: 0, challenger: 1, niche: 2, emerging: 3 }
    return (order[a.category] ?? 4) - (order[b.category] ?? 4)
  })

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
        researchType="market_research"
        whyItMatters={brief.whyItMatters}
        generatedAt={brief.generatedAt}
      />

      {brief.status.degraded && <DegradedBanner reasons={brief.status.reasons} />}

      {INTEL_RESULTS_V2 && brief.marketMap ? (
        <div style={{ marginTop: 24 }}>
          <LogoMarketMap
            data={brief.marketMap}
            headline="The market is fragmenting into a few distinct product shapes, and the wedge is the answer-first layer."
            subhead="This map shows where the category clusters today before you decide which segment to attack."
            asOf={brief.generatedAt}
            sources={brief.sources}
          />
        </div>
      ) : null}

      {INTEL_RESULTS_V2 && brief.trackedSignals?.length ? (
        <div style={{ marginTop: 24 }}>
          <TrendTracker data={brief.trackedSignals} asOf={brief.generatedAt} sources={brief.sources} />
        </div>
      ) : null}

      {INTEL_RESULTS_V2 && brief.maturity ? (
        <div style={{ marginTop: 24 }}>
          <MaturityCurve
            data={brief.maturity}
            headline="The category has moved past early hype and is entering practical evaluation."
            subhead="That matters because buyers now reward products that prove one repeatable workflow instead of sounding generically intelligent."
            asOf={brief.generatedAt}
            sources={brief.sources}
          />
        </div>
      ) : null}

      {/* Market Overview */}
      {brief.marketOverview && (
        <div style={{ marginTop: 24, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--border)' }}>
            <span className="kicker">Market overview</span>
          </div>
          <div style={{ padding: '14px 18px' }}>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.55 }}>{brief.marketOverview}</p>
          </div>
        </div>
      )}

      {/* Player Landscape */}
      {sortedPlayers.length > 0 && (
        <div style={{ marginTop: 24 }}>
          {INTEL_RESULTS_V2 ? (
            <ExhibitShell
              headline="Scale and momentum still separate incumbents from the answer-first wedge."
              subhead="Use this positioning view to see who already owns the broad market and where newer workflow products can still move fast."
              asOf={brief.generatedAt}
              sources={brief.sources}
            >
              <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
                <Quadrant players={sortedPlayers} label="Scale and momentum map" />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
                  {sortedPlayers.map((p) => (
                    <PlayerCard
                      key={p.name}
                      name={p.name}
                      category={p.category}
                      description={p.description}
                      estimatedPosition={p.estimatedPosition}
                    />
                  ))}
                </div>
              </div>
            </ExhibitShell>
          ) : (
            <>
              <div style={{ marginBottom: 12 }}>
                <span className="kicker">Player landscape</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                {sortedPlayers.map((p) => (
                  <PlayerCard
                    key={p.name}
                    name={p.name}
                    category={p.category}
                    description={p.description}
                    estimatedPosition={p.estimatedPosition}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Trend Signals */}
      {brief.sections.trendSignals.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <InsightSection
            title="Trend signals"
            icon={<TrendingUp className="h-4 w-4" style={{ color: 'var(--accent-teal)' }} />}
            bullets={brief.sections.trendSignals}
            onSourceClick={scrollToSource}
          />
        </div>
      )}

      {/* Opportunities vs Threats */}
      <div style={{ marginTop: 24 }}>
        <BalanceView
          leftTitle="Opportunities"
          rightTitle="Threats"
          leftItems={brief.sections.opportunities}
          rightItems={brief.sections.threats}
          leftColor="green"
          rightColor="red"
          onSourceClick={scrollToSource}
        />
      </div>

      {INTEL_RESULTS_V2 && brief.quotes?.length ? (
        <div style={{ marginTop: 24 }}>
          <QuoteWall
            data={brief.quotes}
            headline="The market is telling us that proof and workflow clarity matter more than generic AI posture."
            subhead="These quotes add texture to the category signal and show where buyers are still skeptical."
            asOf={brief.generatedAt}
            sources={brief.sources}
          />
        </div>
      ) : null}

      {/* Key Findings */}
      {brief.sections.keyFindings.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <InsightSection
            title="Key findings"
            icon={<Target className="h-4 w-4" style={{ color: 'var(--accent)' }} />}
            bullets={brief.sections.keyFindings}
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
