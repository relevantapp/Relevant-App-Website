'use client'

import { useCallback } from 'react'
import { TrendingUp, ShieldAlert, Lightbulb, Target } from 'lucide-react'
import type { MarketResearchBrief } from '../types'
import ResultsHero from './shared/ResultsHero'
import PlayerCard from './shared/PlayerCard'
import BalanceView from './shared/BalanceView'
import InsightSection from './shared/InsightSection'
import SourcesStrip from './shared/SourcesStrip'
import StatusBar from './shared/StatusBar'

interface MarketResearchResultsProps {
  brief: MarketResearchBrief
  onNewSearch: () => void
}

const TREND_ICON: Record<string, string> = {
  up: '↑',
  down: '↓',
  stable: '→',
}

export default function MarketResearchResults({ brief, onNewSearch }: MarketResearchResultsProps) {
  const scrollToSource = useCallback((id: string) => {
    const el = document.getElementById(`source-${id}`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    el.classList.add('intel-source-highlighted')
    setTimeout(() => el.classList.remove('intel-source-highlighted'), 2000)
  }, [])

  const handleCopy = useCallback(async () => {
    const lines: string[] = [
      `# ${brief.headline}`, '', `> ${brief.bottomLine}`, '',
      '## Market Overview', brief.marketOverview, '',
    ]
    if (brief.players.length) {
      lines.push('## Key Players')
      for (const p of brief.players) {
        lines.push(`- **${p.name}** (${p.category}): ${p.description}`)
      }
      lines.push('')
    }
    const sectionMap = [
      ['Trend Signals', brief.sections.trendSignals],
      ['Opportunities', brief.sections.opportunities],
      ['Threats', brief.sections.threats],
      ['Key Findings', brief.sections.keyFindings],
    ] as const
    for (const [title, bullets] of sectionMap) {
      if (bullets.length === 0) continue
      lines.push(`## ${title}`)
      for (const b of bullets) lines.push(`- ${b.text} [${b.sourceIds.join(', ')}]`)
      lines.push('')
    }
    await navigator.clipboard.writeText(lines.join('\n'))
  }, [brief])

  // Sort players: leaders first
  const sortedPlayers = [...brief.players].sort((a, b) => {
    const order = { leader: 0, challenger: 1, niche: 2, emerging: 3 }
    return (order[a.category] ?? 4) - (order[b.category] ?? 4)
  })

  return (
    <div className="mx-auto w-full max-w-4xl">
      <ResultsHero
        headline={brief.headline}
        bottomLine={brief.bottomLine}
        confidence={brief.confidence}
        researchType="market_research"
        onNewSearch={onNewSearch}
        onCopy={handleCopy}
      />

      {/* Market Overview */}
      {brief.marketOverview && (
        <div className="mt-5 rounded-xl border border-[var(--surface-strong)] bg-[var(--surface)] p-5">
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

      <div className="mt-6">
        <SourcesStrip sources={brief.sources} />
      </div>
      <StatusBar status={brief.status} />
    </div>
  )
}
