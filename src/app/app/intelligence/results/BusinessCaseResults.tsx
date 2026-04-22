'use client'

import { useCallback, useRef } from 'react'
import { TrendingUp, HelpCircle } from 'lucide-react'
import type { BusinessCaseBrief } from '../types'
import type { FactorCard, Priority } from '@/lib/intelligence/contracts'
import { INTEL_RESULTS_V2 } from '@/lib/intelligence/feature-flags'
import AnswerBlock from './shared/AnswerBlock'
import ResultsHero from './shared/ResultsHero'
import VerdictBadge from './shared/VerdictBadge'
import BalanceView from './shared/BalanceView'
import InsightSection from './shared/InsightSection'
import PriorityStrip from './shared/PriorityStrip'
import SourcesStrip from './shared/SourcesStrip'
import StatusBar from './shared/StatusBar'
import CopyModePicker from './shared/CopyModePicker'
import DegradedBanner from './shared/DegradedBanner'
import ShareButton from './shared/ShareButton'
import SearchPlanPanel from './shared/SearchPlanPanel'
import ExhibitShell from './shared/ExhibitShell'
import MethodologyDrawer from './shared/MethodologyDrawer'
import AssumptionsRegister from './shared/viz/AssumptionsRegister'
import DriverTree from './shared/viz/DriverTree'
import ScenarioBands from './shared/viz/ScenarioBands'
import TornadoChart from './shared/viz/TornadoChart'
import Waterfall from './shared/viz/Waterfall'
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

function priorityForIndex(index: number): Priority {
  if (index < 2) return 'must'
  if (index < 4) return 'should'
  return 'fyi'
}

function resolvePriority(item: FactorCard, index: number): Priority {
  return item.priority ?? priorityForIndex(index)
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
        researchType="business_case"
        whyItMatters={brief.whyItMatters}
        generatedAt={brief.generatedAt}
      />

      {brief.status.degraded && <DegradedBanner reasons={brief.status.reasons} />}

      <div style={{ marginTop: 24 }}>
        {INTEL_RESULTS_V2 ? (
          <ExhibitShell
            headline={`${brief.headline} - verdict`}
            subhead="This verdict should read like a decision memo, not a decorative label."
            asOf={brief.generatedAt}
            sources={brief.sources}
          >
            <VerdictBadge verdict={brief.verdict} rationale={brief.verdictRationale} />
          </ExhibitShell>
        ) : (
          <VerdictBadge verdict={brief.verdict} rationale={brief.verdictRationale} />
        )}
      </div>

      {INTEL_RESULTS_V2 && brief.driverTree && (
        <div style={{ marginTop: 24 }}>
          <DriverTree
            data={brief.driverTree}
            headline="The business case rests on four decision branches"
            subhead="Demand alone is not enough. The economics, fit, and execution branches need to hold too."
            asOf={brief.generatedAt}
            sources={brief.sources}
          />
        </div>
      )}

      {INTEL_RESULTS_V2 && brief.scenarios && (
        <div style={{ marginTop: 24 }}>
          <ScenarioBands
            data={brief.scenarios}
            headline="The base case sits inside a realistic range"
            subhead="The point is not a single magic number. It is the band between what could go right and what could still fail."
            asOf={brief.generatedAt}
            sources={brief.sources}
          />
        </div>
      )}

      {INTEL_RESULTS_V2 && brief.tornado && (
        <div style={{ marginTop: 24 }}>
          <TornadoChart
            data={brief.tornado}
            headline="The business case is most sensitive to a few assumptions"
            subhead="This view shows which assumptions move the outcome most if they swing up or down."
            asOf={brief.generatedAt}
            sources={brief.sources}
          />
        </div>
      )}

      {INTEL_RESULTS_V2 && brief.waterfall && (
        <div style={{ marginTop: 24 }}>
          <Waterfall
            data={brief.waterfall}
            headline="A few drivers build the case from baseline to target"
            subhead="This keeps the business case grounded in the handful of drivers that actually move the number."
            asOf={brief.generatedAt}
            sources={brief.sources}
          />
        </div>
      )}

      {INTEL_RESULTS_V2 && brief.assumptions && (
        <div style={{ marginTop: 24 }}>
          <AssumptionsRegister
            data={brief.assumptions}
            headline="A small set of assumptions still decides the outcome"
            subhead="This makes the hidden assumptions explicit so the decision does not pretend to be more certain than it is."
            asOf={brief.generatedAt}
            sources={brief.sources}
          />
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        {INTEL_RESULTS_V2 ? (
          <FactorCardsPanel
            leftTitle="Supporting factors"
            rightTitle="Risk factors"
            leftItems={brief.sections.supportingFactors}
            rightItems={brief.sections.riskFactors}
            onSourceClick={scrollToSource}
          />
        ) : (
          <BalanceView
            leftTitle="Supporting factors"
            rightTitle="Risk factors"
            leftItems={brief.sections.supportingFactors}
            rightItems={brief.sections.riskFactors}
            leftColor="green"
            rightColor="red"
            onSourceClick={scrollToSource}
          />
        )}
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

function FactorCardsPanel({
  leftTitle,
  rightTitle,
  leftItems,
  rightItems,
  onSourceClick,
}: {
  leftTitle: string
  rightTitle: string
  leftItems: FactorCard[]
  rightItems: FactorCard[]
  onSourceClick?: (id: string) => void
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <FactorColumn title={leftTitle} items={leftItems} accent="var(--accent-teal)" onSourceClick={onSourceClick} />
      <FactorColumn title={rightTitle} items={rightItems} accent="var(--accent-coral)" onSourceClick={onSourceClick} />
    </div>
  )
}

function FactorColumn({
  title,
  items,
  accent,
  onSourceClick,
}: {
  title: string
  items: FactorCard[]
  accent: string
  onSourceClick?: (id: string) => void
}) {
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 4, height: 4, borderRadius: '50%', background: accent }} />
        <span className="kicker" style={{ color: accent }}>{title}</span>
      </div>
      <div style={{ padding: 12, display: 'grid', gap: 10 }}>
        {items.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--text-soft)', padding: '8px 4px' }}>No data</p>
        ) : (
          items.map((item, index) => (
            <div
              key={`${item.text}-${index}`}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 12,
                background: 'var(--surface)',
                padding: '12px 14px',
              }}
            >
              <div style={{ display: 'flex', gap: 10 }}>
                <PriorityStrip priority={resolvePriority(item, index)} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--text)' }}>{item.text}</p>

                  {(item.severity || item.impact) && (
                    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {item.severity && <FactorChip label={`S: ${item.severity}`} tone={item.severity} />}
                      {item.impact && <FactorChip label={`I: ${item.impact}`} tone={item.impact} />}
                    </div>
                  )}

                  {item.sourceIds.length > 0 && (
                    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {item.sourceIds.map((id) => (
                        <button key={id} onClick={() => onSourceClick?.(id)} className="source-chip">
                          [{id}]
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function FactorChip({ label, tone }: { label: string; tone: 'high' | 'med' | 'low' }) {
  const color =
    tone === 'high'
      ? 'var(--accent-coral)'
      : tone === 'med'
        ? 'var(--accent-amber)'
        : 'var(--text-soft)'

  return (
    <span
      className="mono"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 999,
        border: `1px solid ${color}`,
        padding: '2px 8px',
        fontSize: 10,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color,
        background: `color-mix(in oklch, ${color} 12%, transparent)`,
      }}
    >
      {label}
    </span>
  )
}
