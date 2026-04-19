/* ── Meeting Prep Results — editorial layout ───────────────── */
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
import ShareButton from './results/shared/ShareButton'
import { BentoSection, SnapshotCard, PeopleCard } from './results/MeetingPrepPanels'

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
        <ResultsHero
          headline={brief.headline}
          bottomLine={brief.bottomLine}
          confidence={brief.confidence}
          researchType="meeting_prep"
          whyItMatters={brief.whyItMatters}
          generatedAt={brief.generatedAt}
        />

        {brief.status.degraded && <DegradedBanner reasons={brief.status.reasons} />}

        {/* Sidebar + Grid layout */}
        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {brief.snapshot && <SnapshotCard snapshot={brief.snapshot} />}
          {brief.attendeeProfiles.length > 0 && <PeopleCard profiles={brief.attendeeProfiles} />}

          <BentoSection
            title="What just happened"
            icon={<Newspaper className="h-4 w-4" />}
            bullets={sections.whatJustHappened}
            variant="news"
            onSourceClick={scrollToSource}
          />
          <BentoSection
            title="Talking points"
            icon={<MessageSquare className="h-4 w-4" />}
            bullets={sections.talkingPoints}
            variant="talking"
            onSourceClick={scrollToSource}
          />
          <BentoSection
            title="Landmines"
            icon={<AlertTriangle className="h-4 w-4" />}
            bullets={sections.landmines}
            variant="landmines"
            onSourceClick={scrollToSource}
          />
          <BentoSection
            title="Questions to ask"
            icon={<HelpCircle className="h-4 w-4" />}
            bullets={sections.questionsToAsk}
            variant="questions"
            onSourceClick={scrollToSource}
          />
        </div>

        {sections.competitorContext.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <BentoSection
              title="Competitor context"
              icon={<Swords className="h-4 w-4" />}
              bullets={sections.competitorContext}
              variant="competitors"
              onSourceClick={scrollToSource}
            />
          </div>
        )}
      </div>

      {/* Sources */}
      <div style={{ marginTop: 32 }}>
        <IntelligenceSources sources={brief.sources} />
      </div>

      <StatusBar status={brief.status} />
    </div>
  )
}
