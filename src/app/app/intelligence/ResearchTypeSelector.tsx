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
      <h2 className="mb-6 text-center text-base font-semibold text-[var(--text)] sm:text-xl">
        What would you like to prepare for?
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {RESEARCH_TYPES.map((card) => {
          const Icon = ICON_MAP[card.icon]
          const isSelected = selected === card.type
          return (
            <button
              key={card.type}
              type="button"
              onClick={() => onSelect(card.type)}
              className="research-type-card rounded-2xl border p-4 text-left transition-all sm:p-6"
              style={{
                background: isSelected ? 'rgba(47, 107, 255, 0.06)' : 'var(--surface)',
                borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                cursor: 'pointer',
                boxShadow: isSelected ? '0 0 0 1px var(--accent)' : 'none',
              }}
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
