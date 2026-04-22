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
import ShareButton from './shared/ShareButton'
import SearchPlanPanel from './shared/SearchPlanPanel'
import HistoryButton from '../HistoryButton'

interface BusinessCaseResultsProps {
  brief: BusinessCaseBrief
  onNewSearch: () => void
  savedBriefId?: string | null
}

const OUTCOME_COLOR: Record<string, string> = {
  success: 'var(--accent-teal)',
  mixed: 'var(--accent-amber)',
  failure: 'var(--accent-coral)',
}

export default function BusinessCaseResults({ brief, onNewSearch, savedBriefId }: BusinessCaseResultsProps) {
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
          <HistoryButton compact />
          <ShareButton briefId={savedBriefId ?? null} />
          <CopyModePicker brief={brief} exportRef={exportRef} />
        </div>
      </div>

      <div ref={exportRef}>
      <ResultsHero
        headline={brief.headline}
        bottomLine={brief.bottomLine}
        confidence={brief.confidence}
        researchType="business_case"
        whyItMatters={brief.whyItMatters}
        generatedAt={brief.generatedAt}
      />

      {brief.status.degraded && <DegradedBanner reasons={brief.status.reasons} />}

      <div style={{ marginTop: 24 }}>
        <VerdictBadge verdict={brief.verdict} rationale={brief.verdictRationale} />
      </div>

      <div style={{ marginTop: 24 }}>
        <BalanceView
          leftTitle="Supporting factors"
          rightTitle="Risk factors"
          leftItems={brief.sections.supportingFactors}
          rightItems={brief.sections.riskFactors}
          leftColor="green"
          rightColor="red"
          onSourceClick={scrollToSource}
        />
      </div>

      {/* Comparable Companies */}
      {brief.comparables.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ marginBottom: 12 }}>
            <span className="kicker">Comparable companies</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
            {brief.comparables.map((comp) => {
              const color = OUTCOME_COLOR[comp.outcome] ?? 'var(--text-muted)'
              return (
                <div key={comp.name} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{comp.name}</span>
                    <span className="mono" style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '1px 6px', borderRadius: 3, color, border: `1px solid ${color}` }}>
                      {comp.outcome}
                    </span>
                  </div>
                  <p style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-muted)', marginTop: 6 }}>{comp.relevance}</p>
                  <p style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--text-soft)', marginTop: 4, fontStyle: 'italic' }}>{comp.keyTakeaway}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Market Evidence + Open Questions */}
      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <InsightSection
          title="Market Evidence"
          icon={<TrendingUp className="h-4 w-4" style={{ color: 'var(--accent-teal)' }} />}
          bullets={brief.sections.marketEvidence}
          onSourceClick={scrollToSource}
        />
        <InsightSection
          title="Open Questions"
          icon={<HelpCircle className="h-4 w-4" style={{ color: 'var(--accent-violet)' }} />}
          bullets={brief.sections.openQuestions}
          onSourceClick={scrollToSource}
        />
      </div>

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
