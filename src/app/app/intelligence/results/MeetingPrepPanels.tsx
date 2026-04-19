/* ── Meeting Prep Panels — editorial design ──────────────── */

'use client'

import type { BriefBullet, CompanySnapshot, AttendeeProfile } from '@/lib/intelligence/contracts'

/* ── Bento Section Card ──────────────────────────────────────── */

type SectionVariant = 'news' | 'talking' | 'landmines' | 'questions' | 'competitors'

const VARIANT_COLOR: Record<SectionVariant, string> = {
  news: 'var(--text-muted)',
  talking: 'var(--accent-teal)',
  landmines: 'var(--accent-coral)',
  questions: 'var(--accent-violet)',
  competitors: 'var(--accent-amber)',
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
  const color = VARIANT_COLOR[variant]

  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color }}>{icon}</span>
        <span className="kicker">{title}</span>
      </div>
      <div style={{ padding: '8px 16px 14px' }}>
        {bullets.slice(0, 5).map((bullet, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 10,
              padding: '8px 0',
              borderBottom: i < Math.min(bullets.length, 5) - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <span className="mono tnum" style={{ fontSize: 10, color: 'var(--text-soft)', paddingTop: 3, minWidth: 16 }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{bullet.text}</p>
              <div style={{ marginTop: 5, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
                <span className={bullet.tag === 'fact' ? 'ev-tag ev-tag--fact' : 'ev-tag ev-tag--infer'}>
                  {bullet.tag === 'fact' ? 'FACT' : 'INFER'}
                </span>
                {bullet.sourceIds.map((id) => (
                  <button key={id} onClick={() => onSourceClick(id)} className="source-chip">[{id}]</button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
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
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
        <span className="kicker">Company snapshot</span>
      </div>
      {/* Grid-table */}
      <div className="grid-bordered" style={{ borderRadius: 0, border: 'none', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        {facts.map(([label, value]) => (
          <div key={label} style={{ padding: '8px 16px' }}>
            <span className="kicker" style={{ fontSize: 9, color: 'var(--text-soft)' }}>{label}</span>
            <p className="mono" style={{ fontSize: 13, color: 'var(--text)', marginTop: 2 }}>{value}</p>
          </div>
        ))}
      </div>
      {snapshot.recentMilestone && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '10px 16px', borderLeft: '2px solid var(--accent-amber)' }}>
          <span className="kicker" style={{ color: 'var(--accent-amber)' }}>Recent milestone</span>
          <p style={{ fontSize: 13, color: 'var(--text)', marginTop: 4, lineHeight: 1.5 }}>{snapshot.recentMilestone}</p>
        </div>
      )}
    </div>
  )
}

/* ── People Card ─────────────────────────────────────────────── */

export function PeopleCard({ profiles }: { profiles: AttendeeProfile[] }) {
  if (!profiles.length) return null

  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
        <span className="kicker">Key people</span>
      </div>
      <div>
        {profiles.map((person, i) => (
          <div
            key={person.name}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '10px 16px',
              borderBottom: i < profiles.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            {/* Monogram */}
            <div style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', flexShrink: 0, marginTop: 2 }}>
              <span className="mono" style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent)' }}>{person.name.charAt(0)}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{person.name}</span>
                {person.linkedinUrl && (
                  <a href={person.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', fontSize: 10 }}>↗</a>
                )}
              </div>
              {(person.title || person.company) && (
                <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                  {[person.title, person.company].filter(Boolean).join(' · ')}
                </div>
              )}
              {person.background && (
                <p style={{ fontSize: 12, color: 'var(--text-soft)', marginTop: 4, lineHeight: 1.45 }}>{person.background}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
