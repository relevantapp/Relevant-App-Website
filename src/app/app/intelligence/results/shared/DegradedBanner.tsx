/* ── DegradedBanner — editorial partial-success notice ────── */
'use client'

interface DegradedBannerProps {
  reasons: string[]
}

export default function DegradedBanner({ reasons }: DegradedBannerProps) {
  if (reasons.length === 0) return null

  return (
    <div
      style={{
        marginTop: 16,
        borderLeft: '2px solid var(--accent-amber)',
        padding: '10px 16px',
        background: 'var(--bg-elevated)',
        borderRadius: '0 6px 6px 0',
      }}
    >
      <span className="kicker" style={{ color: 'var(--accent-amber)' }}>Partial results</span>
      <div style={{ marginTop: 4 }}>
        {reasons.map((reason) => (
          <p key={reason} style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.45 }}>{reason}</p>
        ))}
      </div>
    </div>
  )
}
