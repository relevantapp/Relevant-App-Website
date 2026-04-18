'use client'

type Category = 'leader' | 'challenger' | 'niche' | 'emerging'

interface PlayerCardProps {
  name: string
  category: Category
  description: string
  estimatedPosition?: string
}

const CATEGORY_STYLE: Record<Category, { label: string; bg: string; text: string }> = {
  leader: { label: 'Leader', bg: 'bg-[var(--accent)]/15', text: 'text-[var(--accent)]' },
  challenger: { label: 'Challenger', bg: 'bg-[var(--accent-teal)]/15', text: 'text-[var(--accent-teal)]' },
  niche: { label: 'Niche', bg: 'bg-[var(--accent-amber)]/15', text: 'text-[var(--accent-amber)]' },
  emerging: { label: 'Emerging', bg: 'bg-[var(--accent-violet)]/15', text: 'text-[var(--accent-violet)]' },
}

export default function PlayerCard({ name, category, description, estimatedPosition }: PlayerCardProps) {
  const style = CATEGORY_STYLE[category]

  return (
    <div className="rounded-xl border border-[var(--surface-strong)] bg-[var(--surface)] p-4">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-[var(--text)]">{name}</h4>
        <span className={`shrink-0 rounded-full ${style.bg} ${style.text} px-2 py-0.5 text-[10px] font-medium`}>
          {style.label}
        </span>
      </div>
      <p className="mt-1.5 text-xs text-[var(--text-muted)] line-clamp-2">{description}</p>
      {estimatedPosition && (
        <p className="mt-2 text-[10px] font-medium text-[var(--text-soft)]">{estimatedPosition}</p>
      )}
    </div>
  )
}
