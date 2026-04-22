'use client'

import ClaimFeedback from './ClaimFeedback'

type Category = 'leader' | 'challenger' | 'niche' | 'emerging'

interface PlayerCardProps {
  name: string
  category: Category
  description: string
  estimatedPosition?: string
  feedbackKey?: string
}

const CATEGORY_COLOR: Record<Category, string> = {
  leader: 'var(--accent)',
  challenger: 'var(--accent-teal)',
  niche: 'var(--accent-amber)',
  emerging: 'var(--accent-violet)',
}

const CATEGORY_LABEL: Record<Category, string> = {
  leader: 'Leader',
  challenger: 'Challenger',
  niche: 'Niche',
  emerging: 'Emerging',
}

export default function PlayerCard({ name, category, description, estimatedPosition, feedbackKey }: PlayerCardProps) {
  const color = CATEGORY_COLOR[category]

  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        {/* LogoChip — monogram */}
        <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
          <span className="mono" style={{ fontSize: 11, fontWeight: 600, color }}>{name.charAt(0)}</span>
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{name}</span>
        <span className="mono" style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '1px 6px', borderRadius: 3, color, border: `1px solid ${color}`, marginLeft: 'auto' }}>
          {CATEGORY_LABEL[category]}
        </span>
      </div>
      <p style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--text-muted)' }}>{description}</p>
      {estimatedPosition && (
        <p className="mono" style={{ fontSize: 11, color: 'var(--text-soft)', marginTop: 6 }}>{estimatedPosition}</p>
      )}
      <ClaimFeedback className="mt-3" claimKey={feedbackKey ?? `player:${name}`} claimText={`${name} ${description}`.trim()} />
    </div>
  )
}
