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

export default function IntelligenceResults({ brief, onNewSearch, savedBriefId }: IntelligenceResultsProps) {
  const exportRef = useRef<HTMLDivElement>(null)

  const scrollToSource = useCallback((id: string) => {
    const el = document.getElementById(`source-${id}`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    el.classList.add('intel-source-highlighted')
    setTimeout(() => el.classList.remove('intel-source-highlighted'), 2000)
  }, [])

  const { sections } = brief
  const gaugeSourceIds = getMeetingPrepGaugeSourceIds(brief)
  const hasOverviewColumn = Boolean(brief.snapshot) || brief.attendeeProfiles.length > 0

  return (
    <div className="mx-auto w-full max-w-4xl">
      {/* Toolbar */}
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

      {/* Exportable area */}
      <div ref={exportRef}>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_340px] xl:items-start">
          <ResultsHero
            headline={brief.headline}
            bottomLine={brief.bottomLine}
            confidence={brief.confidence}
            researchType="meeting_prep"
            whyItMatters={brief.whyItMatters}
            generatedAt={brief.generatedAt}
          />

          <MomentumGauge
            score={brief.momentumScore}
            riskLevel={brief.riskLevel}
            sentiment={brief.sentiment}
            sourceIds={gaugeSourceIds}
            onSourceClick={scrollToSource}
          />
        </div>

        {brief.status.degraded && <DegradedBanner reasons={brief.status.reasons} />}

        <div className={`mt-6 grid gap-4 ${hasOverviewColumn ? 'xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]' : ''}`}>
          {hasOverviewColumn && (
            <div className="space-y-4">
              {brief.snapshot && <SnapshotCard snapshot={brief.snapshot} />}
              {brief.attendeeProfiles.length > 0 && <PeopleCard profiles={brief.attendeeProfiles} />}
            </div>
          )}

          <VisualTimeline events={brief.timelineEvents} onSourceClick={scrollToSource} />
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <RiskRadar metrics={brief.radarMetrics} onSourceClick={scrollToSource} />
          <CompetitorMatrix rows={brief.competitorMatrix} onSourceClick={scrollToSource} />
        </div>

        <div className="mt-4">
          <DeepDivePanels sections={sections} onSourceClick={scrollToSource} />
        </div>
      </div>

      {/* Sources */}
      <div style={{ marginTop: 32 }}>
        <SearchPlanPanel plan={brief.researchPlan} />
      </div>
      <div style={{ marginTop: 32 }}>
        <IntelligenceSources sources={brief.sources} />
      </div>

      <StatusBar status={brief.status} />
    </div>
  )
}
