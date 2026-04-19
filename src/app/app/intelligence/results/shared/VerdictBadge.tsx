'use client'

type Verdict = 'strong' | 'moderate' | 'weak' | 'insufficient_data'

interface VerdictBadgeProps {
  verdict: Verdict
  rationale?: string
}

const CONFIG: Record<Verdict, { label: string; color: string }> = {
  strong: { label: 'Strong case', color: 'var(--accent-teal)' },
  moderate: { label: 'Moderate case', color: 'var(--accent-amber)' },
  weak: { label: 'Weak case', color: 'var(--accent-coral)' },
  insufficient_data: { label: 'Insufficient data', color: 'var(--text-muted)' },
}

export default function VerdictBadge({ verdict, rationale }: VerdictBadgeProps) {
  const c = CONFIG[verdict]

  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
        <span className="display" style={{ fontSize: 18, letterSpacing: '-0.01em', color: c.color }}>{c.label}</span>
      </div>
      {rationale && (
        <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.55, color: 'var(--text-muted)' }}>{rationale}</p>
      )}
    </div>
  )
}
