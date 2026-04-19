/* ── Pre-search confirmation — editorial design ────────── */
'use client'

import { Edit3 } from 'lucide-react'
import type { IntelligenceInput, ResearchType } from './types'

interface ResearchConfirmationProps {
  input: IntelligenceInput
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

function buildSummaryItems(input: IntelligenceInput): Array<{ label: string; value: string }> {
  const items: Array<{ label: string; value: string }> = []

  if (input.researchType === 'meeting_prep') {
    items.push({ label: 'Company', value: input.accountName })
    if (input.meetingType) items.push({ label: 'Meeting type', value: input.meetingType })
    if (input.goal) items.push({ label: 'Goal', value: input.goal })
    if (input.relationshipStage) items.push({ label: 'Relationship', value: input.relationshipStage })
    if (input.attendees?.length) {
      items.push({ label: 'Attendees', value: input.attendees.map((a) => a.name).join(', ') })
    }
    if (input.competitors?.length) {
      items.push({ label: 'Competitors', value: input.competitors.join(', ') })
    }
    if (input.context) items.push({ label: 'Context', value: input.context })
  } else if (input.researchType === 'competitive_analysis') {
    if (input.competitors?.length) {
      items.push({ label: 'Competitors', value: input.competitors.join(', ') })
    }
    if (input.yourCompany) items.push({ label: 'Your company', value: input.yourCompany })
    if (input.focusArea) items.push({ label: 'Focus', value: input.focusArea })
    if (input.specificQuestions) items.push({ label: 'Questions', value: input.specificQuestions })
  } else if (input.researchType === 'business_case') {
    items.push({ label: 'Initiative', value: input.initiativeName })
    if (input.hypothesis) items.push({ label: 'Hypothesis', value: input.hypothesis })
    if (input.targetMarket) items.push({ label: 'Target market', value: input.targetMarket })
    if (input.successMetrics?.length) {
      items.push({ label: 'Success metrics', value: input.successMetrics.join(', ') })
    }
  } else if (input.researchType === 'market_research') {
    items.push({ label: 'Market / Trend', value: input.marketOrTrend })
    if (input.scope) items.push({ label: 'Scope', value: input.scope })
    if (input.knownPlayers?.length) {
      items.push({ label: 'Known players', value: input.knownPlayers.join(', ') })
    }
    if (input.keyQuestions) items.push({ label: 'Key questions', value: input.keyQuestions })
  }

  return items
}

export default function ResearchConfirmation({
  input,
  onConfirm,
  onEdit,
  loading,
}: ResearchConfirmationProps) {
  const items = buildSummaryItems(input)
  const typeLabel = TYPE_LABELS[input.researchType]

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <span className="kicker" style={{ color: 'var(--accent-amber)' }}>Confirm brief</span>
          <p className="display" style={{ fontSize: 20, marginTop: 4, color: 'var(--text)', letterSpacing: '-0.01em' }}>
            {typeLabel}
          </p>
        </div>

        {/* Summary grid */}
        <div className="grid-bordered" style={{ borderRadius: 0, border: 'none', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          {items.map(({ label, value }) => (
            <div key={label} style={{ padding: '10px 20px' }}>
              <span className="kicker" style={{ fontSize: 9, color: 'var(--text-soft)' }}>{label}</span>
              <p style={{ fontSize: 13, color: 'var(--text)', marginTop: 2, lineHeight: 1.45 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1,
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 600,
              color: '#000',
              background: 'var(--accent-amber)',
              border: 'none',
              borderRadius: 6,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
          >
            Run the brief
          </button>
          <button
            type="button"
            onClick={onEdit}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '10px 14px',
              fontSize: 13,
              color: 'var(--text-muted)',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            <Edit3 className="h-3.5 w-3.5" />
            Edit
          </button>
        </div>
      </div>
    </div>
  )
}
