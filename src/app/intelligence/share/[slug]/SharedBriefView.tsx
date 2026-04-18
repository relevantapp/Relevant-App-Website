/* ── Shared Brief View (read-only) ──────────────────────── */
'use client'

import ResultsHero from '@/app/app/intelligence/results/shared/ResultsHero'
import StatusBar from '@/app/app/intelligence/results/shared/StatusBar'
import InsightSection from '@/app/app/intelligence/results/shared/InsightSection'
import SourcesStrip from '@/app/app/intelligence/results/shared/SourcesStrip'
import type { BriefStatus, BriefSource, BriefBullet } from '@/lib/intelligence/contracts'

interface SharedBriefViewProps {
  synthesis: Record<string, unknown>
  sources: Record<string, unknown>[]
  researchType: string
  confidence: string | null
  createdAt: string
}

export default function SharedBriefView({
  synthesis,
  sources,
  researchType,
  confidence,
  createdAt,
}: SharedBriefViewProps) {
  const headline = (synthesis.headline as string) ?? 'Intelligence Brief'
  const bottomLine = (synthesis.bottomLine as string) ?? ''
  const status = synthesis.status as BriefStatus | undefined
  const sections = synthesis.sections as Record<string, BriefBullet[]> | undefined

  return (
    <div>
      <ResultsHero
        headline={headline}
        bottomLine={bottomLine}
        confidence={(confidence as 'high' | 'medium' | 'low') ?? 'medium'}
        researchType={researchType}
      />

      {sections && (
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          {Object.entries(sections).map(([key, bullets]) => {
            if (!Array.isArray(bullets) || bullets.length === 0) return null
            const title = key
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, (s) => s.toUpperCase())
              .trim()
            return (
              <InsightSection
                key={key}
                title={title}
                icon={null}
                bullets={bullets}
                borderColor="border-[var(--surface-strong)]"
                onSourceClick={() => {}}
              />
            )
          })}
        </div>
      )}

      {sources.length > 0 && (
        <div className="mt-6">
          <SourcesStrip sources={sources as BriefSource[]} />
        </div>
      )}

      {status && <StatusBar status={status} />}

      <div className="mt-6 text-center text-xs text-[var(--text-soft)]">
        Generated {new Date(createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </div>
    </div>
  )
}
