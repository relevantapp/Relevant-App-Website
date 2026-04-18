'use client'

import { useCallback } from 'react'
import { TrendingUp, AlertTriangle, Lightbulb, HelpCircle } from 'lucide-react'
import type { BusinessCaseBrief } from '../types'
import ResultsHero from './shared/ResultsHero'
import VerdictBadge from './shared/VerdictBadge'
import BalanceView from './shared/BalanceView'
import InsightSection from './shared/InsightSection'
import SourcesStrip from './shared/SourcesStrip'
import StatusBar from './shared/StatusBar'

interface BusinessCaseResultsProps {
  brief: BusinessCaseBrief
  onNewSearch: () => void
}

const OUTCOME_STYLE = {
  success: { bg: 'bg-[var(--accent-teal)]/15', text: 'text-[var(--accent-teal)]', label: 'Success' },
  mixed: { bg: 'bg-[var(--accent-amber)]/15', text: 'text-[var(--accent-amber)]', label: 'Mixed' },
  failure: { bg: 'bg-[var(--accent-coral)]/15', text: 'text-[var(--accent-coral)]', label: 'Failed' },
}

export default function BusinessCaseResults({ brief, onNewSearch }: BusinessCaseResultsProps) {
  const scrollToSource = useCallback((id: string) => {
    const el = document.getElementById(`source-${id}`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    el.classList.add('intel-source-highlighted')
    setTimeout(() => el.classList.remove('intel-source-highlighted'), 2000)
  }, [])

  const handleCopy = useCallback(async () => {
    const lines: string[] = [
      `# ${brief.headline}`, '', `> ${brief.bottomLine}`, '',
      `**Verdict:** ${brief.verdict}`, brief.verdictRationale, '',
    ]
    if (brief.comparables.length) {
      lines.push('## Comparable Companies')
      for (const c of brief.comparables) {
        lines.push(`- **${c.name}** (${c.outcome}): ${c.keyTakeaway}`)
      }
      lines.push('')
    }
    const sectionMap = [
      ['Market Evidence', brief.sections.marketEvidence],
      ['Supporting Factors', brief.sections.supportingFactors],
      ['Risk Factors', brief.sections.riskFactors],
      ['Open Questions', brief.sections.openQuestions],
    ] as const
    for (const [title, bullets] of sectionMap) {
      if (bullets.length === 0) continue
      lines.push(`## ${title}`)
      for (const b of bullets) lines.push(`- ${b.text} [${b.sourceIds.join(', ')}]`)
      lines.push('')
    }
    await navigator.clipboard.writeText(lines.join('\n'))
  }, [brief])

  return (
    <div className="mx-auto w-full max-w-4xl">
      <ResultsHero
        headline={brief.headline}
        bottomLine={brief.bottomLine}
        confidence={brief.confidence}
        researchType="business_case"
        onNewSearch={onNewSearch}
        onCopy={handleCopy}
      />

      {/* Verdict */}
      <div className="mt-5">
        <VerdictBadge verdict={brief.verdict} rationale={brief.verdictRationale} />
      </div>

      {/* Evidence Balance */}
      <div className="mt-5">
        <BalanceView
          leftTitle="Supporting Factors"
          rightTitle="Risk Factors"
          leftItems={brief.sections.supportingFactors}
          rightItems={brief.sections.riskFactors}
          leftColor="green"
          rightColor="red"
          onSourceClick={scrollToSource}
        />
      </div>

      {/* Comparable Companies */}
      {brief.comparables.length > 0 && (
        <div className="mt-5">
          <h3 className="mb-3 text-sm font-semibold text-[var(--text)]">Comparable Companies</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {brief.comparables.map((comp) => {
              const style = OUTCOME_STYLE[comp.outcome]
              return (
                <div key={comp.name} className="rounded-xl border border-[var(--surface-strong)] bg-[var(--surface)] p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-[var(--text)]">{comp.name}</h4>
                    <span className={`shrink-0 rounded-full ${style.bg} ${style.text} px-2 py-0.5 text-[10px] font-medium`}>
                      {style.label}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-[var(--text-muted)]">{comp.relevance}</p>
                  <p className="mt-1 text-xs text-[var(--text-soft)] italic">{comp.keyTakeaway}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Market Evidence + Open Questions */}
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <InsightSection
          title="Market Evidence"
          icon={<TrendingUp className="h-4 w-4 text-[var(--accent-teal)]" />}
          bullets={brief.sections.marketEvidence}
          borderColor="border-[var(--accent-teal)]/20"
          onSourceClick={scrollToSource}
        />
        <InsightSection
          title="Open Questions"
          icon={<HelpCircle className="h-4 w-4 text-[var(--accent-violet)]" />}
          bullets={brief.sections.openQuestions}
          borderColor="border-[var(--accent-violet)]/20"
          onSourceClick={scrollToSource}
        />
      </div>

      <div className="mt-6">
        <SourcesStrip sources={brief.sources} />
      </div>
      <StatusBar status={brief.status} />
    </div>
  )
}
