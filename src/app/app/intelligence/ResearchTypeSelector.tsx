'use client'

import { ClipboardList, BarChart3, Swords, Search, type LucideProps } from 'lucide-react'
import type { ResearchType } from './types'
import { RESEARCH_TYPES } from './constants'

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  ClipboardList,
  BarChart3,
  Swords,
  Search,
}

interface ResearchTypeSelectorProps {
  selected: ResearchType | null
  onSelect: (type: ResearchType) => void
}

export default function ResearchTypeSelector({ selected, onSelect }: ResearchTypeSelectorProps) {
  return (
    <div>
      <h2
        style={{
          fontSize: 20,
          fontWeight: 600,
          color: 'var(--text)',
          textAlign: 'center',
          marginBottom: 24,
        }}
      >
        What would you like to prepare for?
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 16,
        }}
        className="research-type-grid"
      >
        {RESEARCH_TYPES.map((card) => {
          const Icon = ICON_MAP[card.icon]
          const isSelected = selected === card.type
          return (
            <button
              key={card.type}
              type="button"
              onClick={() => onSelect(card.type)}
              style={{
                background: isSelected ? 'rgba(47, 107, 255, 0.06)' : 'var(--surface)',
                border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 16,
                padding: 24,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all var(--motion-micro) var(--ease-out)',
                boxShadow: isSelected ? '0 0 0 1px var(--accent)' : 'none',
              }}
              className="research-type-card"
            >
              {Icon && (
                <div style={{ color: 'var(--accent)', marginBottom: 12 }}>
                  <Icon size={24} />
                </div>
              )}
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 16,
                  color: 'var(--text)',
                  marginBottom: 8,
                }}
              >
                {card.title}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                }}
              >
                {card.description}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
