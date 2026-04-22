/* ── Meeting Prep Results — editorial layout ───────────────── */
'use client'

import { useCallback, useRef } from 'react'
import type { MeetingPrepBrief } from '@/lib/intelligence/contracts'
import IntelligenceSources from './IntelligenceSources'
import ResultsHero from './results/shared/ResultsHero'
import StatusBar from './results/shared/StatusBar'
import CopyModePicker from './results/shared/CopyModePicker'
import DegradedBanner from './results/shared/DegradedBanner'
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
}

function collectUsedSourceIds(brief: MeetingPrepBrief, sourceIdMap: Map<string, string>): string[] {
  return Array.from(new Set([
    ...(brief.timelineEvents?.flatMap((event) => event.sourceIds) ?? []),
    ...(brief.radarMetrics?.flatMap((metric) => metric.sourceIds) ?? []),
    ...(brief.competitorMatrix?.flatMap((row) => row.sourceIds) ?? []),
    ...brief.sections.whatJustHappened.flatMap((bullet) => bullet.sourceIds),
    ...brief.sections.talkingPoints.flatMap((bullet) => bullet.sourceIds),
    ...brief.sections.landmines.flatMap((bullet) => bullet.sourceIds),
    ...brief.sections.questionsToAsk.flatMap((bullet) => bullet.sourceIds),
    ...brief.sections.competitorContext.flatMap((bullet) => bullet.sourceIds),
  ].flatMap((id) => canonicalizeSourceIds([id], sourceIdMap))))
}

export default function IntelligenceResults({ brief, onNewSearch, savedBriefId }: IntelligenceResultsProps) {
  const exportRef = useRef<HTMLDivElement>(null)

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

  return (
    <div className="mx-auto w-full max-w-[88rem]">
      {/* Toolbar */}
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
          <CopyModePicker brief={displayBrief} exportRef={exportRef} />
        </div>
      </div>

      {/* Exportable area */}
      <div ref={exportRef}>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,380px)] xl:items-start">
          <ResultsHero
            headline={displayBrief.headline}
            bottomLine={displayBrief.bottomLine}
            confidence={displayBrief.confidence}
            researchType="meeting_prep"
            whyItMatters={displayBrief.whyItMatters}
            generatedAt={displayBrief.generatedAt}
          />

          <MomentumGauge
            score={displayBrief.momentumScore}
            riskLevel={displayBrief.riskLevel}
            sentiment={displayBrief.sentiment}
            sourceIds={gaugeSourceIds}
            onSourceClick={scrollToSource}
          />
        </div>

        {displayBrief.status.degraded && <DegradedBanner reasons={displayBrief.status.reasons} />}

        <div className={`mt-6 grid gap-4 ${hasOverviewColumn ? 'xl:grid-cols-[minmax(320px,0.92fr)_minmax(0,1.08fr)]' : ''}`}>
          {hasOverviewColumn && (
            <div className="space-y-4">
              {displayBrief.snapshot && <SnapshotCard snapshot={displayBrief.snapshot} />}
              {displayBrief.attendeeProfiles.length > 0 && <PeopleCard profiles={displayBrief.attendeeProfiles} />}
            </div>
          )}

          <VisualTimeline events={displayBrief.timelineEvents} onSourceClick={scrollToSource} />
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <RiskRadar metrics={displayBrief.radarMetrics} onSourceClick={scrollToSource} />
          <CompetitorMatrix rows={displayBrief.competitorMatrix} onSourceClick={scrollToSource} />
        </div>

        <div className="mt-4">
          <DeepDivePanels sections={sections} onSourceClick={scrollToSource} />
        </div>
      </div>

      {/* Sources */}
      <div style={{ marginTop: 32 }}>
        <SearchPlanPanel plan={displayBrief.researchPlan} />
      </div>
      <div style={{ marginTop: 32 }}>
        <IntelligenceSources sources={displayBrief.sources} />
      </div>

      <StatusBar status={displayBrief.status} />
    </div>
  )
}
