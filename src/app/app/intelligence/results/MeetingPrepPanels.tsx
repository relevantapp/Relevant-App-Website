/* ── Meeting Prep Panels — extracted components ──────────── */

'use client'

import { Building2, Users } from 'lucide-react'
import type { BriefBullet, CompanySnapshot, AttendeeProfile } from '@/lib/intelligence/contracts'

/* ── Bento Section Card ──────────────────────────────────────── */

type SectionVariant = 'news' | 'talking' | 'landmines' | 'questions' | 'competitors'

const VARIANT_BORDER: Record<SectionVariant, string> = {
  news: 'border-[var(--surface-strong)]',
  talking: 'border-[var(--accent-teal)]/20',
  landmines: 'border-[var(--accent-coral)]/20',
  questions: 'border-[var(--accent-violet)]/20',
  competitors: 'border-[var(--accent-amber)]/20',
}

export function BentoSection({
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
    <div className={`rounded-xl border ${VARIANT_BORDER[variant]} bg-[var(--surface)] p-4 sm:p-5`}>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
        {icon} {title}
      </h3>
      <ul className="space-y-3">
        {bullets.slice(0, 5).map((bullet, i) => (
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

export function SnapshotCard({ snapshot }: { snapshot: CompanySnapshot }) {
  const facts = [
    snapshot.industry && ['Industry', snapshot.industry],
    snapshot.headquarters && ['HQ', snapshot.headquarters],
    snapshot.employeeCount && ['Size', snapshot.employeeCount],
    snapshot.fundingStage && ['Funding', snapshot.fundingStage],
    snapshot.lastFundingAmount && ['Last Round', snapshot.lastFundingAmount],
    snapshot.ceo && ['CEO', snapshot.ceo],
  ].filter(Boolean) as Array<[string, string]>

  return (
    <div className="rounded-xl border border-[var(--surface-strong)] bg-[var(--surface)] p-4 sm:p-5">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
        <Building2 className="h-4 w-4" /> Company Snapshot
      </h3>
      <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
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

export function PeopleCard({ profiles }: { profiles: AttendeeProfile[] }) {
  if (!profiles.length) return null

  return (
    <div className="rounded-xl border border-[var(--surface-strong)] bg-[var(--surface)] p-4 sm:p-5">
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
