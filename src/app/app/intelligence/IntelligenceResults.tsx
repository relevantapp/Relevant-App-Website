'use client'

import { useState, useCallback } from 'react'
import {
  Building2,
  Users,
  AlertTriangle,
  MessageSquare,
  HelpCircle,
  Swords,
  Clock,
  ChevronDown,
  Copy,
  Check,
  Shield,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'
import type { IntelligenceBrief, BriefBullet, CompanySnapshot, AttendeeProfile } from './types'
import IntelligenceSources from './IntelligenceSources'

interface IntelligenceResultsProps {
  brief: IntelligenceBrief
  onNewSearch: () => void
}

/* ── Collapsible Section ─────────────────────────────────────── */

function Section({
  title,
  icon,
  children,
  defaultOpen = true,
  count,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
  count?: number
}) {
  const [open, setOpen] = useState(defaultOpen)
  if (count === 0) return null

  return (
    <div className="border-b border-[var(--surface-strong)] pb-4">
      <button
        onClick={() => setOpen(!open)}
        className="mb-2 flex w-full items-center gap-2 text-left text-sm font-semibold text-[var(--text)]"
      >
        {icon}
        {title}
        {count !== undefined && (
          <span className="rounded-full bg-[var(--surface-strong)] px-1.5 py-0.5 text-xs text-[var(--text-muted)]">
            {count}
          </span>
        )}
        <ChevronDown
          className={`ml-auto h-4 w-4 text-[var(--text-soft)] transition-transform ${
            !open ? '-rotate-90' : ''
          }`}
        />
      </button>
      {open && <div className="space-y-2">{children}</div>}
    </div>
  )
}

/* ── Bullet Item ─────────────────────────────────────────────── */

function BulletItem({
  bullet,
  onSourceClick,
  variant = 'default',
}: {
  bullet: BriefBullet
  onSourceClick: (id: string) => void
  variant?: 'default' | 'warning' | 'quote'
}) {
  const borderColor =
    variant === 'warning'
      ? 'border-l-[var(--accent-coral)]'
      : variant === 'quote'
        ? 'border-l-[var(--accent-teal)]'
        : 'border-l-[var(--accent)]/40'

  return (
    <div className={`border-l-2 ${borderColor} pl-3 py-1`}>
      <p className="text-sm text-[var(--text)]">
        {variant === 'quote' ? `"${bullet.text}"` : bullet.text}
      </p>
      <div className="mt-1 flex items-center gap-2">
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
            bullet.tag === 'fact'
              ? 'bg-[var(--accent-teal)]/15 text-[var(--accent-teal)]'
              : 'bg-[var(--accent-violet)]/15 text-[var(--accent-violet)]'
          }`}
        >
          {bullet.tag}
        </span>
        {bullet.sourceIds.map((id) => (
          <button
            key={id}
            onClick={() => onSourceClick(id)}
            className="rounded bg-[var(--surface-strong)] px-1.5 py-0.5 text-[10px] text-[var(--text-muted)] hover:text-[var(--accent)]"
          >
            [{id}]
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Snapshot Card ───────────────────────────────────────────── */

function SnapshotCard({ snapshot }: { snapshot: CompanySnapshot }) {
  const facts = [
    snapshot.industry && { label: 'Industry', value: snapshot.industry },
    snapshot.headquarters && { label: 'HQ', value: snapshot.headquarters },
    snapshot.employeeCount && { label: 'Employees', value: snapshot.employeeCount },
    snapshot.fundingStage && { label: 'Funding', value: snapshot.fundingStage },
    snapshot.lastFundingAmount && { label: 'Last Round', value: snapshot.lastFundingAmount },
    snapshot.ceo && { label: 'CEO', value: snapshot.ceo },
  ].filter(Boolean) as Array<{ label: string; value: string }>

  return (
    <div className="rounded-xl border border-[var(--surface-strong)] bg-[var(--surface)] p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)]/15 text-[var(--accent)]">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-[var(--text)]">{snapshot.name}</h3>
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">{snapshot.description}</p>
        </div>
      </div>
      {facts.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3">
          {facts.map((f) => (
            <div key={f.label}>
              <span className="text-xs text-[var(--text-soft)]">{f.label}</span>
              <p className="text-sm font-medium text-[var(--text)]">{f.value}</p>
            </div>
          ))}
        </div>
      )}
      {snapshot.recentMilestone && (
        <p className="mt-3 rounded-lg bg-[var(--accent-amber)]/10 px-3 py-2 text-sm text-[var(--accent-amber)]">
          🏆 {snapshot.recentMilestone}
        </p>
      )}
    </div>
  )
}

/* ── Attendee Chips ──────────────────────────────────────────── */

function AttendeeList({ profiles }: { profiles: AttendeeProfile[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  if (!profiles.length) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
        <Users className="h-4 w-4" /> Attendees
      </div>
      <div className="flex flex-wrap gap-2">
        {profiles.map((p) => (
          <div key={p.name}>
            <button
              onClick={() => setExpanded(expanded === p.name ? null : p.name)}
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                expanded === p.name
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-strong)]'
              }`}
            >
              {p.name}
              {p.title && <span className="ml-1 opacity-70">· {p.title}</span>}
            </button>
            {expanded === p.name && p.background && (
              <div className="mt-1 rounded-lg bg-[var(--surface)] p-3 text-sm text-[var(--text-muted)]">
                {p.background}
                {p.linkedinUrl && (
                  <a
                    href={p.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-[var(--accent)] hover:underline"
                  >
                    LinkedIn →
                  </a>
                )}
              </div>
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

/* ── Main Results Component ──────────────────────────────────── */

export default function IntelligenceResults({ brief, onNewSearch }: IntelligenceResultsProps) {
  const [copied, setCopied] = useState(false)
  const [highlightSource, setHighlightSource] = useState<string | null>(null)

  const scrollToSource = useCallback((id: string) => {
    setHighlightSource(id)
    const el = document.getElementById(`source-${id}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setTimeout(() => setHighlightSource(null), 3000)
  }, [])

  const copyBrief = useCallback(() => {
    const s = brief.summary
    const lines: string[] = [
      `# ${s.headline}`,
      '',
      s.bottomLine,
      '',
    ]

    const addSection = (title: string, bullets: BriefBullet[]) => {
      if (!bullets.length) return
      lines.push(`## ${title}`)
      bullets.forEach((b) => lines.push(`- ${b.text}`))
      lines.push('')
    }

    addSection('What Just Happened', brief.sections.whatJustHappened)
    addSection('Talking Points', brief.sections.talkingPoints)
    addSection('Landmines', brief.sections.landmines)
    addSection('Questions to Ask', brief.sections.questionsToAsk)
    addSection('Competitor Context', brief.sections.competitorContext)

    lines.push('---', `*Generated by Relevant Intelligence · ${new Date(brief.generatedAt).toLocaleDateString()}*`)
    navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [brief])

  const { sections } = brief

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
            onClick={copyBrief}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-strong)]"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Main column */}
        <div className="space-y-5">
          {/* Snapshot */}
          {brief.snapshot && <SnapshotCard snapshot={brief.snapshot} />}

          {/* Attendees */}
          <AttendeeList profiles={brief.attendeeProfiles} />

          {/* Bottom line */}
          <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-4">
            <h2 className="text-base font-semibold text-[var(--text)]">{brief.summary.headline}</h2>
            <p className="mt-1.5 text-sm text-[var(--text-muted)]">{brief.summary.bottomLine}</p>
          </div>

          {/* Sections */}
          <Section
            title="What Just Happened"
            icon={<Clock className="h-4 w-4 text-[var(--accent-teal)]" />}
            count={sections.whatJustHappened.length}
          >
            {sections.whatJustHappened.map((b, i) => (
              <BulletItem key={i} bullet={b} onSourceClick={scrollToSource} />
            ))}
          </Section>

          <Section
            title="Talking Points"
            icon={<MessageSquare className="h-4 w-4 text-[var(--accent)]" />}
            count={sections.talkingPoints.length}
          >
            {sections.talkingPoints.map((b, i) => (
              <BulletItem key={i} bullet={b} onSourceClick={scrollToSource} />
            ))}
          </Section>

          <Section
            title="Landmines"
            icon={<AlertTriangle className="h-4 w-4 text-[var(--accent-coral)]" />}
            count={sections.landmines.length}
          >
            {sections.landmines.map((b, i) => (
              <BulletItem key={i} bullet={b} onSourceClick={scrollToSource} variant="warning" />
            ))}
          </Section>

          <Section
            title="Questions to Ask"
            icon={<HelpCircle className="h-4 w-4 text-[var(--accent-teal)]" />}
            count={sections.questionsToAsk.length}
          >
            {sections.questionsToAsk.map((b, i) => (
              <BulletItem key={i} bullet={b} onSourceClick={scrollToSource} variant="quote" />
            ))}
          </Section>

          {sections.competitorContext.length > 0 && (
            <Section
              title="Competitor Context"
              icon={<Swords className="h-4 w-4 text-[var(--accent-amber)]" />}
              count={sections.competitorContext.length}
            >
              {sections.competitorContext.map((b, i) => (
                <BulletItem key={i} bullet={b} onSourceClick={scrollToSource} />
              ))}
            </Section>
          )}
        </div>

        {/* Sidebar — Sources */}
        <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <IntelligenceSources sources={brief.sources} highlightId={highlightSource} />
          {/* Timing */}
          <div className="mt-4 space-y-1 text-xs text-[var(--text-soft)]">
            <p>Generated in {(brief.status.totalMs / 1000).toFixed(1)}s</p>
            <p>{brief.status.sourceCount} sources</p>
            {brief.status.degraded && (
              <p className="text-[var(--accent-coral)]">
                ⚠ {brief.status.reasons.join(', ')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
