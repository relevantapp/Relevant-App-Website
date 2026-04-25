/* ── Meeting Prep Results — editorial layout ───────────────── */
'use client'

import { useCallback, useRef } from 'react'
import type { MeetingPrepBrief } from '@/lib/intelligence/contracts'
import { INTEL_RESULTS_V2 } from '@/lib/intelligence/feature-flags'
import {
  deriveMeetingPrepRequestIdentity,
  mapMeetingPrepTrustState,
} from '@/lib/intelligence/meeting-prep-identity'
import IntelligenceSources from './IntelligenceSources'
import AnswerBlock from './results/shared/AnswerBlock'
import { ClaimFeedbackProvider } from './results/shared/ClaimFeedbackContext'
import PdfExportSheet from './results/shared/PdfExportSheet'
import ExhibitShell from './results/shared/ExhibitShell'
import MethodologyDrawer from './results/shared/MethodologyDrawer'
import MeetingPrepTopSection from './results/MeetingPrepTopSection'
import ResultCommandBar from './results/shared/ResultCommandBar'
import StatusBar from './results/shared/StatusBar'
import CopyModePicker from './results/shared/CopyModePicker'
import ShareButton from './results/shared/ShareButton'
import SearchPlanPanel from './results/shared/SearchPlanPanel'
import HistoryButton from './HistoryButton'
import {
  buildCanonicalSourceIdMap,
  canonicalizeSourceIds,
  deriveSourceCounts,
  markSourcesUsedInAnswer,
} from '@/lib/intelligence/meeting-prep-display'
import {
  CompetitorMatrix,
  DeepDivePanels,
  MomentumGauge,
  PeopleCard,
  RiskRadar,
  SnapshotCard,
  VisualTimeline,
  getMeetingPrepGaugeSourceIds,
} from './results/MeetingPrepPanels'

interface IntelligenceResultsProps {
  brief: MeetingPrepBrief
  onNewSearch: () => void
  savedBriefId?: string | null
  requestPayload?: unknown
}

function collectUsedSourceIds(brief: MeetingPrepBrief, sourceIdMap: Map<string, string>): string[] {
  return Array.from(new Set([
    ...(brief.timelineEvents?.flatMap((event) => event.sourceIds) ?? []),
    ...(brief.radarMetrics?.flatMap((metric) => metric.sourceIds) ?? []),
    ...(brief.competitorMatrix?.flatMap((row) => row.sourceIds) ?? []),
    ...(brief.signalCards?.flatMap((card) => card.sources) ?? []),
    ...brief.sections.whatJustHappened.flatMap((bullet) => bullet.sourceIds),
    ...brief.sections.talkingPoints.flatMap((bullet) => bullet.sourceIds),
    ...brief.sections.landmines.flatMap((bullet) => bullet.sourceIds),
    ...brief.sections.questionsToAsk.flatMap((bullet) => bullet.sourceIds),
    ...brief.sections.competitorContext.flatMap((bullet) => bullet.sourceIds),
  ].flatMap((id) => canonicalizeSourceIds([id], sourceIdMap))))
}

export default function IntelligenceResults({ brief, onNewSearch, savedBriefId, requestPayload }: IntelligenceResultsProps) {
  const exportRef = useRef<HTMLDivElement>(null)
  const pdfRef = useRef<HTMLDivElement>(null)

  const scrollToSource = useCallback((id: string) => {
    const el = document.getElementById(`source-${id}`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    el.classList.add('intel-source-highlighted')
    setTimeout(() => el.classList.remove('intel-source-highlighted'), 2000)
  }, [])

  const sourceIdMap = buildCanonicalSourceIdMap(brief.sources)
  const usedSourceIds = collectUsedSourceIds(brief, sourceIdMap)
  const displaySources = markSourcesUsedInAnswer(brief.sources, usedSourceIds)
  const displayStatus = brief.status.sourceCounts
    ? brief.status
    : {
        ...brief.status,
        sourceCounts: deriveSourceCounts({
          sources: displaySources,
          rankedSourceIds: canonicalizeSourceIds(brief.sources.map((source) => source.id), sourceIdMap),
          usedSourceIds,
        }),
      }
  const displayBrief = (displaySources !== brief.sources || displayStatus !== brief.status)
    ? {
        ...brief,
        sources: displaySources,
        status: displayStatus,
      }
    : brief
  const { sections } = displayBrief
  const gaugeSourceIds = getMeetingPrepGaugeSourceIds(displayBrief)
  const hasOverviewColumn = Boolean(displayBrief.snapshot) || displayBrief.attendeeProfiles.length > 0
  const trustState = mapMeetingPrepTrustState({
    status: displayBrief.status,
    confidence: displayBrief.confidence,
  })
  const isBlocked = trustState.kind === 'blocked'
  const requestIdentity = deriveMeetingPrepRequestIdentity(displayBrief, requestPayload)
  const scrollToEvidence = useCallback(() => {
    const el = document.getElementById('intel-evidence-room')
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <ClaimFeedbackProvider briefId={savedBriefId ?? null} researchType="meeting_prep">
      <div className="mx-auto w-full max-w-[88rem]">
      <ResultCommandBar
        workflowLabel="Meeting prep"
        subject={requestIdentity.companyName}
        onNewSearch={onNewSearch}
        onViewEvidence={scrollToEvidence}
      >
          <HistoryButton compact />
          <ShareButton briefId={savedBriefId ?? null} />
          <CopyModePicker brief={displayBrief} exportRef={exportRef} pdfRef={pdfRef} />
          <MethodologyDrawer
            methodology={displayBrief.methodology}
            trust={displayBrief.trust}
            status={displayBrief.status}
            sources={displayBrief.sources}
            inputSummary={displayBrief.researchPlan?.summary}
          />
      </ResultCommandBar>

      {/* Exportable area */}
      <div ref={exportRef}>
        <div style={{ marginBottom: 24 }}>
          <MeetingPrepTopSection
            brief={displayBrief}
            requestPayload={requestPayload}
            trustState={trustState}
            onNewSearch={onNewSearch}
            onViewEvidence={scrollToEvidence}
          />
        </div>

        {!isBlocked && (
          <>
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,380px)] xl:items-start">
              <div className="space-y-6">
                {INTEL_RESULTS_V2 && (
                  <AnswerBlock
                    answer={displayBrief.answer}
                    fallback={{
                      headline: displayBrief.headline,
                      bottomLine: displayBrief.bottomLine,
                      confidence: displayBrief.confidence,
                      whyItMatters: displayBrief.whyItMatters,
                    }}
                    sources={displayBrief.sources}
                  />
                )}
              </div>

              <MomentumGauge
                score={displayBrief.momentumScore}
                riskLevel={displayBrief.riskLevel}
                sentiment={displayBrief.sentiment}
                sourceIds={gaugeSourceIds}
                onSourceClick={scrollToSource}
              />
            </div>

            <div className={`mt-6 grid gap-4 ${hasOverviewColumn ? 'xl:grid-cols-[minmax(320px,0.92fr)_minmax(0,1.08fr)]' : ''}`}>
              {hasOverviewColumn && (
                <div className="space-y-4">
                  {displayBrief.snapshot && <SnapshotCard snapshot={displayBrief.snapshot} />}
                  {(displayBrief.attendeeProfiles.length > 0 || displayBrief.stakeholders?.length) && (
                    <PeopleCard
                      profiles={displayBrief.attendeeProfiles}
                      stakeholders={displayBrief.stakeholders}
                      sources={displayBrief.sources}
                      generatedAt={displayBrief.generatedAt}
                    />
                  )}
                </div>
              )}

              {INTEL_RESULTS_V2 ? (
                <ExhibitShell
                  headline={`${displayBrief.headline} - recent timeline`}
                  subhead="Use the timeline to see what actually changed before the meeting."
                  asOf={displayBrief.generatedAt}
                  sources={displayBrief.sources}
                >
                  <VisualTimeline events={displayBrief.timelineEvents} onSourceClick={scrollToSource} />
                </ExhibitShell>
              ) : (
                <VisualTimeline events={displayBrief.timelineEvents} onSourceClick={scrollToSource} />
              )}
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              {INTEL_RESULTS_V2 ? (
                <ExhibitShell
                  headline={`${displayBrief.headline} - risk radar`}
                  subhead="The fixed five-axis rubric keeps the risk read comparable across briefs."
                  asOf={displayBrief.generatedAt}
                  sources={displayBrief.sources}
                >
                  <RiskRadar metrics={displayBrief.radarMetrics} onSourceClick={scrollToSource} />
                </ExhibitShell>
              ) : (
                <RiskRadar metrics={displayBrief.radarMetrics} onSourceClick={scrollToSource} />
              )}
              {INTEL_RESULTS_V2 ? (
                <ExhibitShell
                  headline={`${displayBrief.headline} - competitor context`}
                  subhead="This matrix is the quick read on who overlaps, who threatens, and what edge still holds."
                  asOf={displayBrief.generatedAt}
                  sources={displayBrief.sources}
                >
                  <CompetitorMatrix rows={displayBrief.competitorMatrix} onSourceClick={scrollToSource} />
                </ExhibitShell>
              ) : (
                <CompetitorMatrix rows={displayBrief.competitorMatrix} onSourceClick={scrollToSource} />
              )}
            </div>

            <div className="mt-4">
              <DeepDivePanels
                sections={sections}
                signalCards={displayBrief.signalCards}
                generatedAt={displayBrief.generatedAt}
                sources={displayBrief.sources}
                onSourceClick={scrollToSource}
              />
            </div>
          </>
        )}
      </div>

      {/* Sources */}
      <div id="intel-evidence-room" style={{ marginTop: 32 }}>
        <SearchPlanPanel plan={displayBrief.researchPlan} />
      </div>
      <div style={{ marginTop: 32 }}>
        <IntelligenceSources sources={displayBrief.sources} />
      </div>

      <StatusBar status={displayBrief.status} />
      <PdfExportSheet ref={pdfRef} title={isBlocked ? `${requestIdentity.companyName} - brief blocked` : displayBrief.headline}>
        {isBlocked ? (
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-5 py-5">
            <p className="kicker text-[var(--accent-coral)]">Brief blocked</p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text)]">
              The generated draft drifted away from the requested company or offer. Review the evidence room and rerun the brief before using it in a live meeting.
            </p>
          </section>
        ) : (
          <>
            <AnswerBlock
              answer={displayBrief.answer}
              fallback={{
                headline: displayBrief.headline,
                bottomLine: displayBrief.bottomLine,
                confidence: displayBrief.confidence,
                whyItMatters: displayBrief.whyItMatters,
              }}
              sources={displayBrief.sources}
            />
            <ExhibitShell
              headline={`${displayBrief.headline} - recent timeline`}
              subhead="Use the timeline to see what actually changed before the meeting."
              asOf={displayBrief.generatedAt}
              sources={displayBrief.sources}
            >
              <VisualTimeline events={displayBrief.timelineEvents} onSourceClick={() => undefined} />
            </ExhibitShell>
            <ExhibitShell
              headline={`${displayBrief.headline} - risk radar`}
              subhead="The fixed five-axis rubric keeps the risk read comparable across briefs."
              asOf={displayBrief.generatedAt}
              sources={displayBrief.sources}
            >
              <RiskRadar metrics={displayBrief.radarMetrics} onSourceClick={() => undefined} />
            </ExhibitShell>
          </>
        )}
      </PdfExportSheet>
      </div>
    </ClaimFeedbackProvider>
  )
}
