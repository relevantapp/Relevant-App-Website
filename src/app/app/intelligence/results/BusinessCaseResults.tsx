'use client'

import { useCallback, useMemo, useRef } from 'react'
import { HelpCircle, TrendingUp } from 'lucide-react'
import type { BriefSource, BriefStatus, FactorCard, Priority, RichBullet } from '@/lib/intelligence/contracts'
import type { BusinessCaseBrief } from '../types'
import HistoryButton from '../HistoryButton'
import AnswerBlock from './shared/AnswerBlock'
import ClaimFeedback from './shared/ClaimFeedback'
import { ClaimFeedbackProvider } from './shared/ClaimFeedbackContext'
import ClaimSpotlight from './shared/ClaimSpotlight'
import { ClaimSpotlightProvider, EVIDENCE_ROOM_ANCHOR_ID } from './shared/ClaimSpotlightContext'
import CopyModePicker from './shared/CopyModePicker'
import CounterCaseCard from './shared/CounterCaseCard'
import InsightSection from './shared/InsightSection'
import MethodologyDrawer from './shared/MethodologyDrawer'
import NextMoveActions from './shared/NextMoveActions'
import PdfExportSheet from './shared/PdfExportSheet'
import PriorityStrip from './shared/PriorityStrip'
import ProofStrip, { type ProofDriver } from './shared/ProofStrip'
import ResultCommandBar from './shared/ResultCommandBar'
import SearchPlanPanel from './shared/SearchPlanPanel'
import ShareButton from './shared/ShareButton'
import SourcesStrip from './shared/SourcesStrip'
import StatusBar from './shared/StatusBar'
import VerdictBadge from './shared/VerdictBadge'
import VerdictHero, { type EvidenceMeter, type TrustState } from './shared/VerdictHero'
import AssumptionsRegister from './shared/viz/AssumptionsRegister'
import DriverTree from './shared/viz/DriverTree'
import ScenarioBands from './shared/viz/ScenarioBands'
import TornadoChart from './shared/viz/TornadoChart'
import Waterfall from './shared/viz/Waterfall'

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

const VERDICT_LABEL: Record<BusinessCaseBrief['verdict'], string> = {
  strong: 'Go',
  moderate: 'Conditional go',
  weak: 'No-go',
  insufficient_data: 'Insufficient data',
}

function resolveTrustState(status: BriefStatus, confidence: BusinessCaseBrief['confidence']): TrustState {
  const usedCount = status.sourceCounts?.used ?? status.sourceCount
  if (status.degraded) return 'degraded'
  if (confidence === 'low' || usedCount < 3) return 'low-evidence'
  return 'safe'
}

function buildEvidenceMeter(status: BriefStatus): EvidenceMeter {
  return status.sourceCounts ?? {
    found: status.sourceCount,
    ranked: status.sourceCount,
    used: status.sourceCount,
  }
}

function resolveProofPriority(index: number, bullet?: Pick<RichBullet, 'priority'>): Priority {
  if (bullet?.priority) return bullet.priority
  if (index < 2) return 'must'
  if (index < 4) return 'should'
  return 'fyi'
}

function findFreshestSource(sourceIds: string[], sourceMap: Map<string, BriefSource>): string | null {
  return sourceIds
    .map((sourceId) => sourceMap.get(sourceId)?.publishedAt ?? null)
    .filter((value): value is string => Boolean(value))
    .sort((left, right) => right.localeCompare(left))[0] ?? null
}

function buildProofDrivers(brief: BusinessCaseBrief): ProofDriver[] {
  const sourceMap = new Map(brief.sources.map((source) => [source.id, source]))
  const counterSourceIds = new Set(brief.trust?.conflicts.flatMap((conflict) => conflict.againstSourceIds) ?? [])
  const bullets = [...brief.sections.supportingFactors, ...brief.sections.riskFactors].slice(0, 4)

  return bullets.map((bullet, index) => ({
    id: `business-proof-${index + 1}`,
    title: bullet.text,
    detail: bullet.confidenceDriver ?? undefined,
    priority: resolveProofPriority(index, bullet),
    sourceIds: bullet.sourceIds,
    freshness: findFreshestSource(bullet.sourceIds, sourceMap),
    counter: bullet.sourceIds.some((sourceId) => counterSourceIds.has(sourceId)),
  }))
}

function buildSourceNumberMap(drivers: ProofDriver[]): Map<string, number> {
  const orderedSourceIds: string[] = []

  for (const driver of drivers) {
    for (const sourceId of driver.sourceIds) {
      if (!orderedSourceIds.includes(sourceId)) orderedSourceIds.push(sourceId)
    }
  }

  return new Map(orderedSourceIds.map((sourceId, index) => [sourceId, index + 1]))
}

function priorityForFactor(index: number): Priority {
  if (index < 2) return 'must'
  if (index < 4) return 'should'
  return 'fyi'
}

function resolveFactorPriority(item: FactorCard, index: number): Priority {
  return item.priority ?? priorityForFactor(index)
}

export default function BusinessCaseResults({ brief, onNewSearch, savedBriefId }: BusinessCaseResultsProps) {
  const exportRef = useRef<HTMLDivElement>(null)
  const pdfRef = useRef<HTMLDivElement>(null)
  const proofDrivers = useMemo(() => buildProofDrivers(brief), [brief])
  const proofSourceNumberMap = useMemo(() => buildSourceNumberMap(proofDrivers), [proofDrivers])
  const trustState = resolveTrustState(brief.status, brief.confidence)
  const evidenceMeter = buildEvidenceMeter(brief.status)

  const scrollToSource = useCallback((id: string) => {
    const el = document.getElementById(`source-${id}`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    el.classList.add('intel-source-highlighted')
    window.setTimeout(() => el.classList.remove('intel-source-highlighted'), 2000)
  }, [])
  const scrollToEvidence = useCallback(() => {
    const el = document.getElementById(EVIDENCE_ROOM_ANCHOR_ID)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <ClaimFeedbackProvider briefId={savedBriefId ?? null} researchType="business_case">
      <ClaimSpotlightProvider evidenceAnchorId={EVIDENCE_ROOM_ANCHOR_ID}>
        <div className="mx-auto w-full max-w-6xl">
          <ResultCommandBar
            workflowLabel="Business case"
            subject={VERDICT_LABEL[brief.verdict]}
            onNewSearch={onNewSearch}
            onViewEvidence={scrollToEvidence}
          >
            <HistoryButton compact />
            <ShareButton briefId={savedBriefId ?? null} />
            <CopyModePicker brief={brief} exportRef={exportRef} pdfRef={pdfRef} />
            <MethodologyDrawer
              methodology={brief.methodology}
              trust={brief.trust}
              status={brief.status}
              sources={brief.sources}
              inputSummary={brief.researchPlan?.summary}
            />
          </ResultCommandBar>

          <div ref={exportRef} className="space-y-6">
            <VerdictHero
              verdict={brief.headline}
              subline={brief.bottomLine}
              confidence={brief.answer?.confidence.level ?? brief.confidence}
              trustState={trustState}
              generatedAt={brief.generatedAt}
              workflowLabel="Business case"
              evidenceMeter={evidenceMeter}
              subject={VERDICT_LABEL[brief.verdict]}
            />

            {brief.answer?.recommendedNext && (
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <p className="kicker text-[var(--accent-amber)]">Recommended next move</p>
                    {brief.answer.recommendedNext.action && (
                      <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-[var(--text-soft)]">
                        {brief.answer.recommendedNext.action}
                      </p>
                    )}
                    <p className="mt-3 text-sm leading-relaxed text-[var(--text)]">
                      {brief.answer.recommendedNext.text}
                    </p>
                  </div>

                  <NextMoveActions
                    text={brief.answer.recommendedNext.copyable ?? brief.answer.recommendedNext.text}
                    headline={brief.headline}
                    actionLabel="Use this"
                  />
                </div>
              </section>
            )}

            <ProofStrip
              drivers={proofDrivers}
              sourceNumberMap={proofSourceNumberMap}
              onCitationClick={scrollToSource}
              label="Proof"
            />

            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-5">
              <p className="kicker">Decision</p>
              <div className="mt-4">
                <VerdictBadge verdict={brief.verdict} rationale={brief.verdictRationale} />
              </div>
            </section>

            {brief.driverTree ? (
              <DriverTree
                data={brief.driverTree}
                headline="The driver tree explains why this is or is not a go."
                subhead="Show the causal branches before scenario math so the decision reads like a memo, not a dashboard."
                asOf={brief.generatedAt}
                sources={brief.sources}
              />
            ) : brief.scenarios ? (
              <ScenarioBands
                data={brief.scenarios}
                headline="The base case sits inside a realistic range."
                subhead="When the driver tree is absent, the scenario band becomes the fastest way to explain the decision range."
                asOf={brief.generatedAt}
                sources={brief.sources}
              />
            ) : null}

            {brief.scenarios && (
              <ScenarioBands
                data={brief.scenarios}
                headline="Scenario bands make the range visible before the team over-trusts a single number."
                subhead="The right read is the spread between upside and downside, not just the base-case dot."
                asOf={brief.generatedAt}
                sources={brief.sources}
              />
            )}

            {brief.tornado && (
              <TornadoChart
                data={brief.tornado}
                headline="A small set of assumptions still moves the outcome most."
                subhead="This view shows which assumptions matter enough to justify debate before investment."
                asOf={brief.generatedAt}
                sources={brief.sources}
              />
            )}

            {brief.waterfall && (
              <Waterfall
                data={brief.waterfall}
                headline="The business case builds through a handful of concrete deltas."
                subhead="The waterfall keeps the memo grounded in the few drivers that actually move the result."
                asOf={brief.generatedAt}
                sources={brief.sources}
              />
            )}

            {brief.assumptions && (
              <AssumptionsRegister
                data={brief.assumptions}
                headline="The assumptions register should be impossible to miss."
                subhead="If these assumptions fail, the case weakens fast, so they belong before the comparables and appendices."
                asOf={brief.generatedAt}
                sources={brief.sources}
              />
            )}

            <CounterCaseCard sources={brief.sources} trust={brief.trust} />

            {brief.answer && (
              <AnswerBlock
                answer={brief.answer}
                fallback={{
                  headline: brief.headline,
                  bottomLine: brief.bottomLine,
                  confidence: brief.confidence,
                  whyItMatters: brief.whyItMatters,
                }}
                sources={brief.sources}
                sticky={false}
              />
            )}

            <FactorCardsPanel
              leftTitle="Supporting factors"
              rightTitle="Risk factors"
              leftItems={brief.sections.supportingFactors}
              rightItems={brief.sections.riskFactors}
              onSourceClick={scrollToSource}
            />

            {brief.comparables.length > 0 && (
              <section className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-elevated)] px-5 py-5 sm:px-6">
                <div className="border-b border-[var(--border)] pb-4">
                  <p className="kicker">Comparable companies</p>
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--text-muted)]">
                    Comparables come after assumptions because they support the decision, not decide it on their own.
                  </p>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {brief.comparables.map((comparable) => {
                    const color = OUTCOME_COLOR[comparable.outcome] ?? 'var(--text-muted)'

                    return (
                      <article key={comparable.name} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-[var(--text)]">{comparable.name}</p>
                          <span
                            className="mono rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em]"
                            style={{
                              color,
                              borderColor: color,
                              background: `color-mix(in oklch, ${color} 10%, transparent)`,
                            }}
                          >
                            {comparable.outcome}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">{comparable.relevance}</p>
                        <p className="mt-3 text-sm leading-relaxed text-[var(--text-soft)]">{comparable.keyTakeaway}</p>
                        <ClaimFeedback
                          className="mt-4"
                          claimKey={`comparable:${comparable.name}`}
                          claimText={`${comparable.relevance} ${comparable.keyTakeaway}`.trim()}
                        />
                      </article>
                    )
                  })}
                </div>
              </section>
            )}

            <div className="grid gap-4 xl:grid-cols-2">
              <InsightSection
                title="Market evidence"
                icon={<TrendingUp className="h-4 w-4" style={{ color: 'var(--accent-teal)' }} />}
                bullets={brief.sections.marketEvidence}
                onSourceClick={scrollToSource}
              />
              <InsightSection
                title="Open questions"
                icon={<HelpCircle className="h-4 w-4" style={{ color: 'var(--accent-violet)' }} />}
                bullets={brief.sections.openQuestions}
                onSourceClick={scrollToSource}
              />
            </div>
          </div>

          <div id={EVIDENCE_ROOM_ANCHOR_ID} className="mt-8 space-y-6">
            <SearchPlanPanel plan={brief.researchPlan} />
            <SourcesStrip sources={brief.sources} />
            <StatusBar status={brief.status} />
          </div>

          <PdfExportSheet ref={pdfRef} title={brief.headline}>
            <VerdictHero
              verdict={brief.headline}
              subline={brief.bottomLine}
              confidence={brief.answer?.confidence.level ?? brief.confidence}
              trustState={trustState}
              generatedAt={brief.generatedAt}
              workflowLabel="Business case"
              evidenceMeter={evidenceMeter}
              subject={VERDICT_LABEL[brief.verdict]}
            />
            {brief.answer ? (
              <AnswerBlock
                answer={brief.answer}
                fallback={{
                  headline: brief.headline,
                  bottomLine: brief.bottomLine,
                  confidence: brief.confidence,
                  whyItMatters: brief.whyItMatters,
                }}
                sources={brief.sources}
                sticky={false}
              />
            ) : null}
            {brief.driverTree ? (
              <DriverTree
                data={brief.driverTree}
                headline="The driver tree explains why this is or is not a go."
                subhead="Show the causal branches before scenario math so the decision reads like a memo, not a dashboard."
                asOf={brief.generatedAt}
                sources={brief.sources}
              />
            ) : brief.scenarios ? (
              <ScenarioBands
                data={brief.scenarios}
                headline="The base case sits inside a realistic range."
                subhead="When the driver tree is absent, the scenario band becomes the fastest way to explain the decision range."
                asOf={brief.generatedAt}
                sources={brief.sources}
              />
            ) : null}
          </PdfExportSheet>

          <ClaimSpotlight sources={brief.sources} evidenceAnchorId={EVIDENCE_ROOM_ANCHOR_ID} />
        </div>
      </ClaimSpotlightProvider>
    </ClaimFeedbackProvider>
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
    <div className="grid gap-4 xl:grid-cols-2">
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
    <section className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--bg-elevated)]">
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-4 sm:px-6">
        <div className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
        <span className="kicker" style={{ color: accent }}>{title}</span>
      </div>

      <div className="grid gap-3 px-5 py-5 sm:px-6">
        {items.length === 0 ? (
          <p className="text-sm text-[var(--text-soft)]">No data.</p>
        ) : (
          items.map((item, index) => (
            <article key={`${item.text}-${index}`} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
              <div className="flex gap-3">
                <PriorityStrip priority={resolveFactorPriority(item, index)} />
                <div className="flex-1">
                  <p className="text-sm leading-relaxed text-[var(--text)]">{item.text}</p>

                  {(item.severity || item.impact) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.severity && <FactorChip label={`S: ${item.severity}`} tone={item.severity} />}
                      {item.impact && <FactorChip label={`I: ${item.impact}`} tone={item.impact} />}
                    </div>
                  )}

                  {item.sourceIds.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.sourceIds.map((id) => (
                        <button key={id} onClick={() => onSourceClick?.(id)} className="source-chip">
                          [{id}]
                        </button>
                      ))}
                    </div>
                  )}

                  <ClaimFeedback
                    className="mt-4"
                    claimKey={`factor:${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}:${index}`}
                    claimText={item.text}
                    sourceIds={item.sourceIds}
                  />
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  )
}

function FactorChip({ label, tone }: { label: string; tone: 'high' | 'med' | 'low' }) {
  const color = tone === 'high' ? 'var(--accent-coral)' : tone === 'med' ? 'var(--accent-amber)' : 'var(--text-soft)'

  return (
    <span
      className="mono inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.1em]"
      style={{
        color,
        borderColor: color,
        background: `color-mix(in oklch, ${color} 12%, transparent)`,
      }}
    >
      {label}
    </span>
  )
}
