'use client'

import { useCallback, useMemo, useRef } from 'react'
import { Lightbulb, Target, TrendingUp } from 'lucide-react'
import type { BriefSource, BriefStatus, Priority, RichBullet, TrustLayer } from '@/lib/intelligence/contracts'
import type { CompetitiveAnalysisBrief } from '../types'
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
import ProofStrip, { type ProofDriver } from './shared/ProofStrip'
import ResultCommandBar from './shared/ResultCommandBar'
import SearchPlanPanel from './shared/SearchPlanPanel'
import ShareButton from './shared/ShareButton'
import SourcesStrip from './shared/SourcesStrip'
import StatusBar from './shared/StatusBar'
import VerdictHero, { type EvidenceMeter, type TrustState } from './shared/VerdictHero'
import CapabilityMatrix from './shared/viz/CapabilityMatrix'
import CompositeQuadrant from './shared/viz/CompositeQuadrant'
import Timeline from './shared/viz/Timeline'
import WhitespacePanel from './shared/viz/WhitespacePanel'

interface CompetitiveResultsProps {
  brief: CompetitiveAnalysisBrief
  onNewSearch: () => void
  savedBriefId?: string | null
}

function resolveTrustState(status: BriefStatus, confidence: CompetitiveAnalysisBrief['confidence']): TrustState {
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

function resolvePriority(index: number, bullet?: Pick<RichBullet, 'priority'>): Priority {
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

function buildProofDrivers(brief: CompetitiveAnalysisBrief): ProofDriver[] {
  const sourceMap = new Map(brief.sources.map((source) => [source.id, source]))
  const counterSourceIds = new Set(brief.trust?.conflicts.flatMap((conflict) => conflict.againstSourceIds) ?? [])
  const bullets = [...brief.sections.keyFindings, ...brief.sections.strategicImplications].slice(0, 4)

  return bullets.map((bullet, index) => ({
    id: `competitive-proof-${index + 1}`,
    title: bullet.text,
    detail: bullet.confidenceDriver ?? undefined,
    priority: resolvePriority(index, bullet),
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

function getCompetitorCardText(brief: CompetitiveAnalysisBrief, competitor: CompetitiveAnalysisBrief['competitors'][number]): string {
  return [
    competitor.description,
    ...competitor.strengths,
    ...competitor.weaknesses,
    ...competitor.recentMoves,
    ...brief.sections.recommendations
      .filter((item) => item.text.toLowerCase().includes(competitor.name.toLowerCase()))
      .map((item) => item.text),
  ]
    .filter(Boolean)
    .join(' ')
}

export default function CompetitiveResults({ brief, onNewSearch, savedBriefId }: CompetitiveResultsProps) {
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
    <ClaimFeedbackProvider briefId={savedBriefId ?? null} researchType="competitive_analysis">
      <ClaimSpotlightProvider evidenceAnchorId={EVIDENCE_ROOM_ANCHOR_ID}>
        <div className="mx-auto w-full max-w-6xl">
          <ResultCommandBar
            workflowLabel="Competitive analysis"
            subject={brief.yourCompany ?? 'Competitive brief'}
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
              workflowLabel="Competitive analysis"
              evidenceMeter={evidenceMeter}
              subject={brief.yourCompany ?? 'Competitive brief'}
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
                    subject={brief.yourCompany}
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

            <CapabilityMatrix
              data={brief.comparisonMatrix}
              headline="Relevant wins when the buyer values decision quality over monitoring breadth."
              subhead="The comparison matrix should answer where you win before anyone reads individual competitor profiles."
              asOf={brief.generatedAt}
              sources={brief.sources}
              briefId={brief.id}
              yourCompany={brief.yourCompany}
            />

            {brief.competitors.length > 0 && (
              <Timeline
                competitors={brief.competitors}
                headline="Competitor moves are clustering around packaging and research depth."
                subhead="Read movement after the matrix so the recent launches explain why the current position looks the way it does."
                asOf={brief.generatedAt}
                sources={brief.sources}
              />
            )}

            {brief.compositeQuadrant && (
              <CompositeQuadrant
                data={brief.compositeQuadrant}
                headline="The field still splits between breadth and decision velocity."
                subhead="This quadrant only belongs on the page when the axes are defensible enough to explain."
                asOf={brief.generatedAt}
                sources={brief.sources}
              />
            )}

            <WhitespacePanel
              data={brief.whitespace ?? []}
              headline="The remaining whitespace is workflow-specific, not universal."
              subhead="The useful gaps are where incumbents still create too much synthesis work for the buyer."
              asOf={brief.generatedAt}
              sources={brief.sources}
            />

            <CounterCaseCard sources={brief.sources} trust={brief.trust as TrustLayer | undefined} />

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

            <div className="grid gap-4 xl:grid-cols-2">
              <InsightSection
                title="Key findings"
                icon={<Target className="h-4 w-4" style={{ color: 'var(--accent-teal)' }} />}
                bullets={brief.sections.keyFindings}
                onSourceClick={scrollToSource}
              />
              <InsightSection
                title="Strategic implications"
                icon={<TrendingUp className="h-4 w-4" style={{ color: 'var(--accent-amber)' }} />}
                bullets={brief.sections.strategicImplications}
                onSourceClick={scrollToSource}
              />
            </div>

            {brief.sections.recommendations.length > 0 && (
              <InsightSection
                title="Recommended posture"
                icon={<Lightbulb className="h-4 w-4" style={{ color: 'var(--accent)' }} />}
                bullets={brief.sections.recommendations}
                onSourceClick={scrollToSource}
              />
            )}

            {brief.competitors.length > 0 && (
              <section className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-elevated)] px-5 py-5 sm:px-6">
                <div className="border-b border-[var(--border)] pb-4">
                  <p className="kicker">Competitor rows</p>
                  <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--text-muted)]">
                    Profiles sit below the matrix so they support the position instead of competing with it.
                  </p>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {brief.competitors.map((competitor) => (
                    <article key={competitor.name} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-[var(--text)]">{competitor.name}</p>
                          <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{competitor.description}</p>
                        </div>
                      </div>

                      {competitor.strengths.length > 0 && (
                        <div className="mt-4">
                          <p className="kicker text-[var(--accent-teal)]">Strengths</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {competitor.strengths.map((strength) => (
                              <span key={strength} className="ev-tag ev-tag--fact">{strength}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {competitor.weaknesses.length > 0 && (
                        <div className="mt-4">
                          <p className="kicker text-[var(--accent-coral)]">Weaknesses</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {competitor.weaknesses.map((weakness) => (
                              <span
                                key={weakness}
                                className="mono rounded-full border border-[color-mix(in_oklch,var(--accent-coral)_24%,var(--border))] bg-[color-mix(in_oklch,var(--accent-coral)_10%,transparent)] px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-[var(--accent-coral)]"
                              >
                                {weakness}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {competitor.recentMoves.length > 0 && (
                        <div className="mt-4 border-t border-[var(--border)] pt-4">
                          <p className="kicker">Recent moves</p>
                          <ul className="mt-2 space-y-2 text-sm leading-relaxed text-[var(--text-muted)]">
                            {competitor.recentMoves.map((move) => (
                              <li key={move}>• {move}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <ClaimFeedback
                        className="mt-4"
                        claimKey={`competitor-card:${competitor.name}`}
                        claimText={getCompetitorCardText(brief, competitor)}
                      />
                    </article>
                  ))}
                </div>
              </section>
            )}
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
              workflowLabel="Competitive analysis"
              evidenceMeter={evidenceMeter}
              subject={brief.yourCompany ?? 'Competitive brief'}
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
            <CapabilityMatrix
              data={brief.comparisonMatrix}
              headline="Relevant wins when the buyer values decision quality over monitoring breadth."
              subhead="The comparison matrix should answer where you win before anyone reads individual competitor profiles."
              asOf={brief.generatedAt}
              sources={brief.sources}
              briefId={brief.id}
              yourCompany={brief.yourCompany}
            />
          </PdfExportSheet>

          <ClaimSpotlight sources={brief.sources} evidenceAnchorId={EVIDENCE_ROOM_ANCHOR_ID} />
        </div>
      </ClaimSpotlightProvider>
    </ClaimFeedbackProvider>
  )
}
