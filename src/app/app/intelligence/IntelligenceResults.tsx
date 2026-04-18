/* NEW INTELLIGENCE RESULTS — PHASE 4 REDESIGN */
'use client'

import { useState, useCallback } from 'react'
import {
  Building2,
  Users,
  AlertTriangle,
  MessageSquare,
  HelpCircle,
  Swords,
  Copy,
  Check,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Newspaper,
} from 'lucide-react'
import type { IntelligenceBrief, BriefBullet, CompanySnapshot, AttendeeProfile } from './types'
import IntelligenceSources from './IntelligenceSources'

interface IntelligenceResultsProps {
  brief: IntelligenceBrief
  onNewSearch: () => void
}

/* ── Bento Section Card ──────────────────────────────────────── */

type SectionVariant = 'news' | 'talking' | 'landmines' | 'questions' | 'competitors'

const VARIANT_BORDER: Record<SectionVariant, string> = {
  news: 'border-[var(--surface-strong)]',
  talking: 'border-[var(--accent-teal)]/20',
  landmines: 'border-[var(--accent-coral)]/20',
  questions: 'border-[var(--accent-violet)]/20',
  competitors: 'border-[var(--accent-amber)]/20',
}

function BentoSection({
  title,
  icon,
  bullets,
  variant,
  onSourceClick,
}: {
  title: string
  icon: React.ReactNode
  bullets: BriefBullet[]
  variant: SectionVariant
  onSourceClick: (id: string) => void
}) {
  if (bullets.length === 0) return null

  return (
    <div className={`rounded-xl border ${VARIANT_BORDER[variant]} bg-[var(--surface)] p-5`}>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
        {icon} {title}
      </h3>
      <ul className="space-y-3">
        {bullets.map((bullet, i) => (
          <li key={i} className="text-sm text-[var(--text)]">
            <p>{bullet.text}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {bullet.sourceIds.map((id) => (
                <button
                  key={id}
                  onClick={() => onSourceClick(id)}
                  className="rounded bg-[var(--surface-strong)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                >
                  [{id}]
                </button>
              ))}
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  bullet.tag === 'fact'
                    ? 'bg-[var(--accent-teal)]/15 text-[var(--accent-teal)]'
                    : 'bg-[var(--accent-violet)]/15 text-[var(--accent-violet)]'
                }`}
              >
                {bullet.tag}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ── Snapshot Card ───────────────────────────────────────────── */

function SnapshotCard({ snapshot }: { snapshot: CompanySnapshot }) {
  const facts = [
    snapshot.industry && ['Industry', snapshot.industry],
    snapshot.headquarters && ['HQ', snapshot.headquarters],
    snapshot.employeeCount && ['Size', snapshot.employeeCount],
    snapshot.fundingStage && ['Funding', snapshot.fundingStage],
    snapshot.lastFundingAmount && ['Last Round', snapshot.lastFundingAmount],
    snapshot.ceo && ['CEO', snapshot.ceo],
  ].filter(Boolean) as Array<[string, string]>

  return (
    <div className="rounded-xl border border-[var(--surface-strong)] bg-[var(--surface)] p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
        <Building2 className="h-4 w-4" /> Company Snapshot
      </h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {facts.map(([label, value]) => (
          <div key={label}>
            <span className="text-xs text-[var(--text-soft)]">{label}</span>
            <p className="text-sm font-medium text-[var(--text)]">{value}</p>
          </div>
        ))}
      </div>
      {snapshot.recentMilestone && (
        <div className="mt-3 rounded-lg bg-[var(--accent-amber)]/10 px-3 py-2 text-sm text-[var(--accent-amber)]">
          <span className="text-xs font-medium opacity-70">Recent</span>
          <p>{snapshot.recentMilestone}</p>
        </div>
      )}
    </div>
  )
}

/* ── People Card ─────────────────────────────────────────────── */

function PeopleCard({ profiles }: { profiles: AttendeeProfile[] }) {
  if (!profiles.length) return null

  return (
    <div className="rounded-xl border border-[var(--surface-strong)] bg-[var(--surface)] p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
        <Users className="h-4 w-4" /> Key People
      </h3>
      <div className="space-y-3">
        {profiles.map((person) => (
          <div key={person.name} className="rounded-lg border border-[var(--surface-strong)] p-3">
            <div className="font-medium text-sm text-[var(--text)]">{person.name}</div>
            {(person.title || person.company) && (
              <div className="text-xs text-[var(--text-muted)]">
                {[person.title, person.company].filter(Boolean).join(' · ')}
              </div>
            )}
            {person.background && (
              <p className="mt-1 text-xs text-[var(--text-soft)] line-clamp-2">
                {person.background}
              </p>
            )}
            {person.linkedinUrl && (
              <a
                href={person.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-xs text-[var(--accent)] hover:underline"
              >
                LinkedIn ↗
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Confidence Badge ────────────────────────────────────────── */

function ConfidenceBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const config = {
    high: { icon: <ShieldCheck className="h-3.5 w-3.5" />, color: 'text-[var(--accent-teal)]', bg: 'bg-[var(--accent-teal)]/15', label: 'High confidence' },
    medium: { icon: <Shield className="h-3.5 w-3.5" />, color: 'text-[var(--accent-amber)]', bg: 'bg-[var(--accent-amber)]/15', label: 'Medium confidence' },
    low: { icon: <ShieldAlert className="h-3.5 w-3.5" />, color: 'text-[var(--accent-coral)]', bg: 'bg-[var(--accent-coral)]/15', label: 'Low confidence' },
  }
  const c = config[level]

  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${c.bg} ${c.color} px-2.5 py-1 text-xs font-medium`}>
      {c.icon} {c.label}
    </span>
  )
}

/* ── Copy brief as markdown ──────────────────────────────────── */

function copyBriefAsMarkdown(brief: IntelligenceBrief): Promise<void> {
  const lines: string[] = []
  lines.push(`# ${brief.summary.headline}`)
  lines.push('')
  lines.push(`> ${brief.summary.bottomLine}`)
  lines.push('')

  if (brief.snapshot) {
    lines.push('## Company Snapshot')
    if (brief.snapshot.industry) lines.push(`- **Industry:** ${brief.snapshot.industry}`)
    if (brief.snapshot.headquarters) lines.push(`- **HQ:** ${brief.snapshot.headquarters}`)
    if (brief.snapshot.employeeCount) lines.push(`- **Size:** ${brief.snapshot.employeeCount}`)
    if (brief.snapshot.fundingStage) lines.push(`- **Funding:** ${brief.snapshot.fundingStage}`)
    if (brief.snapshot.ceo) lines.push(`- **CEO:** ${brief.snapshot.ceo}`)
    lines.push('')
  }

  const sectionMap = [
    ['What Just Happened', brief.sections.whatJustHappened],
    ['Talking Points', brief.sections.talkingPoints],
    ['Landmines', brief.sections.landmines],
    ['Questions to Ask', brief.sections.questionsToAsk],
    ['Competitor Context', brief.sections.competitorContext],
  ] as const

  for (const [title, bullets] of sectionMap) {
    if (bullets.length === 0) continue
    lines.push(`## ${title}`)
    for (const b of bullets) {
      lines.push(`- ${b.text} [${b.sourceIds.join(', ')}] (${b.tag})`)
    }
    lines.push('')
  }

  lines.push('## Sources')
  for (const s of brief.sources) {
    lines.push(`- [${s.id}] ${s.title} — ${s.domain} (${s.url})`)
  }

  return navigator.clipboard.writeText(lines.join('\n'))
}

/* ── Main Results Component ──────────────────────────────────── */

export default function IntelligenceResults({ brief, onNewSearch }: IntelligenceResultsProps) {
  const [copied, setCopied] = useState(false)

  const scrollToSource = useCallback((id: string) => {
    const el = document.getElementById(`source-${id}`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    el.classList.add('intel-source-highlighted')
    setTimeout(() => el.classList.remove('intel-source-highlighted'), 2000)
  }, [])

  const handleCopy = useCallback(() => {
    copyBriefAsMarkdown(brief)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [brief])

  const { sections } = brief
  const hasSnapshot = !!brief.snapshot
  const hasPeople = brief.attendeeProfiles.length > 0
  const hasRow1 = hasSnapshot || hasPeople

  return (
    <div className="mx-auto w-full max-w-4xl">
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={onNewSearch}
          className="rounded-lg bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-strong)] hover:text-[var(--text)]"
        >
          ← New Search
        </button>
        <div className="flex items-center gap-2">
          <ConfidenceBadge level={brief.summary.confidence} />
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-strong)]"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Hero: Headline + Bottom Line */}
      <div className="rounded-xl border border-[var(--accent)]/15 bg-gradient-to-br from-[var(--accent)]/[0.08] to-[var(--accent-teal)]/[0.06] p-6">
        <h2 className="text-lg font-bold text-[var(--text)]">{brief.summary.headline}</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed">{brief.summary.bottomLine}</p>
      </div>

      {/* Bento Grid */}
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Row 1: Snapshot + People */}
        {hasSnapshot && <SnapshotCard snapshot={brief.snapshot!} />}
        {hasPeople && <PeopleCard profiles={brief.attendeeProfiles} />}
        {/* If only one of snapshot/people exists, it naturally takes one column */}

        {/* Row 2: What Happened + Talking Points */}
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

        {/* Row 3: Landmines + Questions */}
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

      {/* Competitors — full width */}
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

      {/* Sources — horizontal strip */}
      <div className="mt-6">
        <IntelligenceSources sources={brief.sources} />
      </div>

      {/* Status bar */}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[var(--text-soft)]">
        <span>⏱ {(brief.status.totalMs / 1000).toFixed(1)}s</span>
        <span>·</span>
        <span>{brief.status.sourceCount} sources</span>
        <span>·</span>
        <span className={brief.status.exaSearchMs > 0 ? 'text-[var(--accent-teal)]' : 'text-[var(--accent-coral)]'}>
          Exa {brief.status.exaSearchMs > 0 ? '✓' : '✗'}
        </span>
        <span className={brief.status.tavilySearchMs > 0 ? 'text-[var(--accent-teal)]' : 'text-[var(--accent-coral)]'}>
          Tavily {brief.status.tavilySearchMs > 0 ? '✓' : '✗'}
        </span>
        <span className={!brief.status.degraded ? 'text-[var(--accent-teal)]' : 'text-[var(--accent-coral)]'}>
          AI {!brief.status.degraded ? '✓' : '✗'}
        </span>
        {brief.status.synthesisModel && (
          <span className="rounded bg-[var(--surface-strong)] px-1.5 py-0.5 text-[10px]">
            {brief.status.synthesisModel}
          </span>
        )}
      </div>
    </div>
  )
}
