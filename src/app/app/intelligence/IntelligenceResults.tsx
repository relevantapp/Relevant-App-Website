/* ── Meeting Prep Results — Visual-first redesign ──────────── */
'use client'

import { useCallback, useRef } from 'react'
import {
  AlertTriangle,
  MessageSquare,
  HelpCircle,
  Swords,
  Newspaper,
} from 'lucide-react'
import type { MeetingPrepBrief } from '@/lib/intelligence/contracts'
import IntelligenceSources from './IntelligenceSources'
import ResultsHero from './results/shared/ResultsHero'
import StatusBar from './results/shared/StatusBar'
import CopyModePicker from './results/shared/CopyModePicker'
import DegradedBanner from './results/shared/DegradedBanner'
import { BentoSection, SnapshotCard, PeopleCard } from './results/MeetingPrepPanels'

interface IntelligenceResultsProps {
  brief: MeetingPrepBrief
  onNewSearch: () => void
}

export default function IntelligenceResults({ brief, onNewSearch }: IntelligenceResultsProps) {
  const exportRef = useRef<HTMLDivElement>(null)

  const scrollToSource = useCallback((id: string) => {
    const el = document.getElementById(`source-${id}`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    el.classList.add('intel-source-highlighted')
    setTimeout(() => el.classList.remove('intel-source-highlighted'), 2000)
  }, [])

  const { sections } = brief

  return (
    <div className="mx-auto w-full max-w-4xl">
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={onNewSearch}
          className="rounded-lg bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-strong)] hover:text-[var(--text)] sm:text-sm"
        >
          ← New Search
        </button>
        <CopyModePicker brief={brief} exportRef={exportRef} />
      </div>

      {/* Exportable area */}
      <div ref={exportRef}>
        <ResultsHero
          headline={brief.headline}
          bottomLine={brief.bottomLine}
          confidence={brief.confidence}
          researchType="meeting_prep"
        />

      {brief.status.degraded && <DegradedBanner reasons={brief.status.reasons} />}
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          {brief.snapshot && <SnapshotCard snapshot={brief.snapshot} />}
          {brief.attendeeProfiles.length > 0 && <PeopleCard profiles={brief.attendeeProfiles} />}

          <BentoSection
            title="What Just Happened"
            icon={<Newspaper className="h-4 w-4 text-[var(--accent-teal)]" />}
            bullets={sections.whatJustHappened}
            variant="news"
            onSourceClick={scrollToSource}
          />
          <BentoSection
            title="Talking Points"
            icon={<MessageSquare className="h-4 w-4 text-[var(--accent-teal)]" />}
            bullets={sections.talkingPoints}
            variant="talking"
            onSourceClick={scrollToSource}
          />
          <BentoSection
            title="Landmines"
            icon={<AlertTriangle className="h-4 w-4 text-[var(--accent-coral)]" />}
            bullets={sections.landmines}
            variant="landmines"
            onSourceClick={scrollToSource}
          />
          <BentoSection
            title="Questions to Ask"
            icon={<HelpCircle className="h-4 w-4 text-[var(--accent-violet)]" />}
            bullets={sections.questionsToAsk}
            variant="questions"
            onSourceClick={scrollToSource}
          />
        </div>

        {sections.competitorContext.length > 0 && (
          <div className="mt-4">
            <BentoSection
              title="Competitor Context"
              icon={<Swords className="h-4 w-4 text-[var(--accent-amber)]" />}
              bullets={sections.competitorContext}
              variant="competitors"
              onSourceClick={scrollToSource}
            />
          </div>
        )}
      </div>

      {/* Sources */}
      <div className="mt-6">
        <IntelligenceSources sources={brief.sources} />
      </div>

      {/* Status bar */}
      <StatusBar status={brief.status} />
    </div>
  )
}
