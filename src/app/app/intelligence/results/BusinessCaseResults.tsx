'use client'

import { useCallback, useRef } from 'react'
import { TrendingUp, HelpCircle } from 'lucide-react'
import type { BusinessCaseBrief } from '../types'
import ResultsHero from './shared/ResultsHero'
import VerdictBadge from './shared/VerdictBadge'
import BalanceView from './shared/BalanceView'
import InsightSection from './shared/InsightSection'
import SourcesStrip from './shared/SourcesStrip'
import StatusBar from './shared/StatusBar'
import CopyModePicker from './shared/CopyModePicker'
import DegradedBanner from './shared/DegradedBanner'

interface BusinessCaseResultsProps {
  brief: BusinessCaseBrief
  onNewSearch: () => void
}

const OUTCOME_STYLE = {
  success: { bg: 'bg-[var(--accent-teal)]/15', text: 'text-[var(--accent-teal)]', label: 'Success' },
  mixed: { bg: 'bg-[var(--accent-amber)]/15', text: 'text-[var(--accent-amber)]', label: 'Mixed' },
  failure: { bg: 'bg-[var(--accent-coral)]/15', text: 'text-[var(--accent-coral)]', label: 'Failed' },
}

export default function BusinessCaseResults({ brief, onNewSearch }: BusinessCaseResultsProps) {
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
        researchType="business_case"
      />

      {brief.status.degraded && <DegradedBanner reasons={brief.status.reasons} />}

      {/* Verdict */}
      <div className="mt-5">
        <VerdictBadge verdict={brief.verdict} rationale={brief.verdictRationale} />
      </div>

      {/* Evidence Balance */}
      <div className="mt-5">
        <BalanceView
          leftTitle="Supporting Factors"
          rightTitle="Risk Factors"
          leftItems={brief.sections.supportingFactors}
          rightItems={brief.sections.riskFactors}
          leftColor="green"
          rightColor="red"
          onSourceClick={scrollToSource}
        />
      </div>

      {/* Comparable Companies */}
      {brief.comparables.length > 0 && (
        <div className="mt-5">
          <h3 className="mb-3 text-sm font-semibold text-[var(--text)]">Comparable Companies</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {brief.comparables.map((comp) => {
              const style = OUTCOME_STYLE[comp.outcome]
              return (
                <div key={comp.name} className="rounded-xl border border-[var(--surface-strong)] bg-[var(--surface)] p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-[var(--text)]">{comp.name}</h4>
                    <span className={`shrink-0 rounded-full ${style.bg} ${style.text} px-2 py-0.5 text-[10px] font-medium`}>
                      {style.label}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-[var(--text-muted)]">{comp.relevance}</p>
                  <p className="mt-1 text-xs text-[var(--text-soft)] italic">{comp.keyTakeaway}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Market Evidence + Open Questions */}
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <InsightSection
          title="Market Evidence"
          icon={<TrendingUp className="h-4 w-4 text-[var(--accent-teal)]" />}
          bullets={brief.sections.marketEvidence}
          borderColor="border-[var(--accent-teal)]/20"
          onSourceClick={scrollToSource}
        />
        <InsightSection
          title="Open Questions"
          icon={<HelpCircle className="h-4 w-4 text-[var(--accent-violet)]" />}
          bullets={brief.sections.openQuestions}
          borderColor="border-[var(--accent-violet)]/20"
          onSourceClick={scrollToSource}
        />
      </div>

      </div>

      <div className="mt-6">
        <SourcesStrip sources={brief.sources} />
      </div>
      <StatusBar status={brief.status} />
    </div>
  )
}
