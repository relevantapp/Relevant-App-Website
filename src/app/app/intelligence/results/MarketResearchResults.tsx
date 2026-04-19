'use client'

import { useCallback, useRef } from 'react'
import { TrendingUp, Target } from 'lucide-react'
import type { MarketResearchBrief } from '../types'
import ResultsHero from './shared/ResultsHero'
import PlayerCard from './shared/PlayerCard'
import BalanceView from './shared/BalanceView'
import InsightSection from './shared/InsightSection'
import SourcesStrip from './shared/SourcesStrip'
import StatusBar from './shared/StatusBar'
import CopyModePicker from './shared/CopyModePicker'
import DegradedBanner from './shared/DegradedBanner'
import ShareButton from './shared/ShareButton'

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
          <ShareButton briefId={savedBriefId ?? null} />
          <CopyModePicker brief={brief} exportRef={exportRef} />
        </div>
      </div>

      <div ref={exportRef}>
      <ResultsHero
        headline={brief.headline}
        bottomLine={brief.bottomLine}
        confidence={brief.confidence}
        researchType="market_research"
        whyItMatters={brief.whyItMatters}
        generatedAt={brief.generatedAt}
      />

      {brief.status.degraded && <DegradedBanner reasons={brief.status.reasons} />}

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
        <SourcesStrip sources={brief.sources} />
      </div>
      <StatusBar status={brief.status} />
    </div>
  )
}
