'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Pen, Zap } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { Btn, Dot, Kicker } from './ui/primitives'
import type { IntelligenceInput, ResearchType, UserResearchContext } from './types'

interface ResearchConfirmationProps {
  input: IntelligenceInput
  onChange: (input: IntelligenceInput) => void
  onConfirm: () => void
  onEdit: () => void
  loading?: boolean
}

const TYPE_LABELS: Record<ResearchType, string> = {
  meeting_prep: 'Meeting Prep',
  competitive_analysis: 'Competitive Analysis',
  business_case: 'Business Case',
  market_research: 'Market Research',
}

function clean(value?: string | null): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function sentence(value: string): string {
  return value.trim().replace(/[.!?]+$/, '')
}

function profileLens(profile: UserResearchContext | null): string {
  if (!profile) return 'Role · Founder'
  const parts = [profile.role, profile.industry].filter(Boolean)
  return parts.length ? parts.join(' · ') : 'Role · Founder'
}

function buildBrief(input: IntelligenceInput, profile: UserResearchContext | null): string {
  const lens = profile?.role || profile?.industry || profile?.company
    ? ` through your ${[profile?.role, profile?.industry, profile?.company].filter(Boolean).join(' / ')} lens`
    : ''

  if (input.researchType === 'meeting_prep') {
    const pieces = [
      `Prepare for a ${input.meetingType ?? 'meeting'} with ${input.accountName}${lens}.`,
      `Goal: ${sentence(input.goal)}.`,
    ]
    if (input.whatYoureSelling) pieces.push(`Positioning: ${sentence(input.whatYoureSelling)}.`)
    if (input.desiredNextStep) pieces.push(`Targeted next step: ${sentence(input.desiredNextStep)}.`)
    pieces.push(
      'Turn recent changes, attendee context, pain points, and competitor moves into talking points, landmines, and specific questions for the room.',
    )
    return pieces.join(' ')
  }
  if (input.researchType === 'competitive_analysis') {
    return `Compare ${input.competitors.join(', ')} against ${input.yourCompany}${lens}. Focus: ${input.focusArea}. Show where each player is strong or exposed, and what you should do next.`
  }
  if (input.researchType === 'business_case') {
    return `Test the case for ${input.initiativeName}${lens}. Claim: ${sentence(input.hypothesis)}. Prove or weaken it, surface comparable outcomes, and show the risks before a decision is made.`
  }
  return `Map ${input.marketOrTrend}${lens}. Scope: ${input.region ?? input.scope ?? 'global'}. Find market shifts, named players, risks, and opportunities tied to ${input.customerSegment || input.useCase || 'the category'}.`
}

function buildEvidencePlan(input: IntelligenceInput): Array<[string, string]> {
  if (input.researchType === 'meeting_prep') {
    return [
      ['Account snapshot', `${input.accountName}, public profile, funding`],
      ['Recent announcements', '90d news + product launches'],
      ['Leadership & attendees', 'LinkedIn, podcasts, interviews'],
      ['Hiring signals', 'careers page, job boards'],
      ['Competitive context', input.competitors?.join(', ') || 'category watchlist'],
      ['Analyst coverage', 'press, research reports'],
    ]
  }
  if (input.researchType === 'competitive_analysis') {
    return [
      ['Competitor moves', `${input.competitors.join(', ')} · 90d`],
      ['Focus area', `${input.focusArea} signals`],
      ['Market view', input.marketSegment ?? 'category landscape'],
      ['Customer complaints', 'reviews, social, forums'],
      ['Pricing & packaging', 'public pricing pages, analyst notes'],
      ['Counter-evidence', 'weaknesses, churn signals'],
    ]
  }
  if (input.researchType === 'business_case') {
    return [
      ['Proof for claim', `${input.initiativeName} demand signals`],
      ['Market sizing', input.targetMarket ?? 'category size + growth'],
      ['Comparable outcomes', input.comparableCompanies?.join(', ') || 'comparable companies'],
      ['Risks & failures', 'unit economics, objections'],
      ['ROI framing', (input.roiFrame ?? []).join(', ') || 'revenue / cost / speed'],
      ['Decision audience', input.decisionAudience ?? 'exec audience lens'],
    ]
  }
  return [
    ['Market movement', `${input.marketOrTrend} · 90d`],
    ['Named players', input.knownPlayers?.join(', ') || 'key companies'],
    ['Customer segment', input.customerSegment ?? 'segment signals'],
    ['Use case', input.useCase ?? 'category use cases'],
    ['Risks & barriers', 'regulation, adoption blockers'],
    ['Analyst forecasts', 'press + research reports'],
  ]
}

export default function ResearchConfirmation({
  input,
  onChange,
  onConfirm,
  onEdit,
  loading,
}: ResearchConfirmationProps) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserResearchContext | null>(null)
  const [editingBrief, setEditingBrief] = useState(false)
  const [briefDraft, setBriefDraft] = useState('')
  const typeLabel = TYPE_LABELS[input.researchType]
  const brief = buildBrief(input, profile)
  const evidencePlan = buildEvidencePlan(input)

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false

    const loadProfile = async () => {
      const { data } = await supabase
        .from('users')
        .select('profile_kind, industry_raw, role_raw, company_id, company_name_manual')
        .eq('id', user.id)
        .maybeSingle()

      if (!data || cancelled) return
      const row = data as Record<string, unknown>
      let company = typeof row.company_name_manual === 'string' ? row.company_name_manual.trim() : ''
      const companyId = typeof row.company_id === 'string' ? row.company_id.trim() : ''

      if (companyId) {
        const { data: companyData } = await supabase
          .from('companies')
          .select('name')
          .eq('id', companyId)
          .maybeSingle()
        const lookup = companyData as { name?: string | null } | null
        company = lookup?.name?.trim() || company
      }

      if (cancelled) return
      setProfile({
        profileKind: clean(row.profile_kind as string | null),
        industry: clean(row.industry_raw as string | null),
        role: clean(row.role_raw as string | null),
        company: clean(company),
        country: null,
        contextNote: null,
      })
    }

    void loadProfile()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const depthLabel =
    input.researchType === 'market_research' && input.depth === 'deep-dive'
      ? 'Deep · 15–22 sources'
      : input.researchType === 'meeting_prep'
        ? 'Standard · 8–12 sources'
        : input.researchType === 'competitive_analysis'
          ? 'Standard · 12–18 sources'
          : input.researchType === 'business_case'
            ? 'Standard · 14–20 sources'
            : 'Standard · 10–15 sources'

  return (
    <div className="intel-refined-layout intel-rise">
      <aside className="intel-refined-copy">
        <button type="button" onClick={onEdit} className="intel-back-button">
          <ArrowLeft size={14} strokeWidth={1.6} />
          Edit inputs
        </button>

        <div style={{ marginTop: 28 }}>
          <Kicker color="var(--amber)">02 / Refined intent / {typeLabel}</Kicker>
          <h1 className="intel-display">Review the run before it starts.</h1>
          <p>
            Relevant has turned your intake into a sharper research brief. Add steering if
            there is a specific angle the evidence should respect.
          </p>
        </div>

        <div className="intel-docket-block">
          <Kicker>Run settings</Kicker>
          <div className="intel-docket-table">
            {[
              { k: 'Lens', v: profileLens(profile) },
              { k: 'Depth', v: depthLabel },
              { k: 'Buckets', v: `${evidencePlan.length} planned` },
            ].map((item) => (
              <div key={item.k} className="intel-docket-row">
                <span className="mono">{item.k}</span>
                <strong>{item.v}</strong>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main>
        <section className="intel-refined-panel">
          <div className="intel-refined-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Dot color="var(--amber)" size={7} />
              <Kicker>System brief</Kicker>
            </div>
            <button
              type="button"
              onClick={() => {
                if (editingBrief) {
                  onChange({ ...input, steering: briefDraft } as IntelligenceInput)
                  setEditingBrief(false)
                } else {
                  setBriefDraft(input.steering ?? '')
                  setEditingBrief(true)
                }
              }}
              className="intel-back-button"
            >
              <Pen size={12} strokeWidth={1.6} />
              {editingBrief ? 'Save steering' : input.steering ? 'Edit steering' : 'Add steering'}
            </button>
          </div>
          <div className="intel-refined-brief">{brief}</div>
          {(editingBrief || input.steering) && (
            <div className="intel-steering-block">
              <Kicker>Your steering notes</Kicker>
              {editingBrief ? (
                <textarea
                  rows={4}
                  value={briefDraft}
                  onChange={(event) => setBriefDraft(event.target.value)}
                  placeholder="Focus on evidence a founder can act on this week. Skip generic market commentary."
                  className="intel-steering-textarea"
                  style={{
                    width: '100%',
                    marginTop: 10,
                    resize: 'vertical',
                    padding: '11px 13px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-elev)',
                    color: 'var(--ink)',
                    fontSize: 13,
                    lineHeight: 1.5,
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              ) : (
                <p>{input.steering}</p>
              )}
            </div>
          )}
        </section>

        <div className="intel-refined-meta">
          {[
            { k: 'Lens', v: profileLens(profile) },
            { k: 'Depth', v: depthLabel },
            { k: 'Evidence buckets', v: `${evidencePlan.length} planned` },
          ].map((m) => (
            <div key={m.k}>
              <Kicker>{m.k}</Kicker>
              <strong>{m.v}</strong>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 28 }}>
          <Kicker>Evidence plan</Kicker>
          <div className="intel-evidence-grid">
            {evidencePlan.map(([k, v]) => (
              <div key={k} className="intel-evidence-row">
                <strong>{k}</strong>
                <span>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="intel-refined-actions">
          <Btn variant="ghost" size="lg" onClick={onEdit}>
            Edit inputs
          </Btn>
          <Btn
            variant="amber"
            size="lg"
            onClick={onConfirm}
            disabled={loading}
            icon={<Zap size={15} strokeWidth={2} />}
          >
            {loading ? 'Running…' : 'Run the brief'}
          </Btn>
        </div>
      </main>
    </div>
  )
}
