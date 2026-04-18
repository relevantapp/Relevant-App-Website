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

interface MarketResearchResultsProps {
  brief: MarketResearchBrief
  onNewSearch: () => void
}

export default function MarketResearchResults({ brief, onNewSearch }: MarketResearchResultsProps) {
  const exportRef = useRef<HTMLDivElement>(null)

  const scrollToSource = useCallback((id: string) => {
    const el = document.getElementById(`source-${id}`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    el.classList.add('intel-source-highlighted')
    setTimeout(() => el.classList.remove('intel-source-highlighted'), 2000)
  }, [])

  // Sort players: leaders first
  const sortedPlayers = [...brief.players].sort((a, b) => {
    const order = { leader: 0, challenger: 1, niche: 2, emerging: 3 }
    return (order[a.category] ?? 4) - (order[b.category] ?? 4)
  })

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={onNewSearch}
          className="rounded-lg bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-strong)] hover:text-[var(--text)] sm:text-sm"
        >
          ← New Search
        </button>
        <CopyModePicker brief={brief} exportRef={exportRef} />
      </div>

      <div ref={exportRef}>
      <ResultsHero
        headline={brief.headline}
        bottomLine={brief.bottomLine}
        confidence={brief.confidence}
        researchType="market_research"
      />

      {brief.status.degraded && <DegradedBanner reasons={brief.status.reasons} />}

      {/* Market Overview */}
      {brief.marketOverview && (
        <div className="mt-5 rounded-xl border border-[var(--surface-strong)] bg-[var(--surface)] p-4 sm:p-5">
          <h3 className="mb-2 text-sm font-semibold text-[var(--text)]">Market Overview</h3>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">{brief.marketOverview}</p>
        </div>
      )}

      {/* Player Landscape */}
      {sortedPlayers.length > 0 && (
        <div className="mt-5">
          <h3 className="mb-3 text-sm font-semibold text-[var(--text)]">Player Landscape</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
        <div className="mt-5">
          <InsightSection
            title="Trend Signals"
            icon={<TrendingUp className="h-4 w-4 text-[var(--accent-teal)]" />}
            bullets={brief.sections.trendSignals}
            borderColor="border-[var(--accent-teal)]/20"
            onSourceClick={scrollToSource}
          />
        </div>
      )}

      {/* Opportunities vs Threats */}
      <div className="mt-5">
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
        <div className="mt-5">
          <InsightSection
            title="Key Findings"
            icon={<Target className="h-4 w-4 text-[var(--accent)]" />}
            bullets={brief.sections.keyFindings}
            borderColor="border-[var(--accent)]/20"
            onSourceClick={scrollToSource}
          />
        </div>
      )}

      </div>

      <div className="mt-6">
        <SourcesStrip sources={brief.sources} />
      </div>
      <StatusBar status={brief.status} />
    </div>
  )
}
