'use client'

import { ArrowRight, ClipboardList, BarChart3, Swords, Search, type LucideProps } from 'lucide-react'
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
    <div className="research-type-shell">
      <div className="research-type-head">
        <div>
          <span className="research-type-kicker">Intelligence</span>
          <h2 className="research-type-title">What decision are you preparing for?</h2>
          <p className="research-type-subtitle">
            Pick a workflow. Answer a few structured questions. Get a sourced brief shaped for the work in front of you.
          </p>
        </div>
      </div>

      <div className="research-type-grid-editorial">
        {RESEARCH_TYPES.map((card) => {
          const Icon = ICON_MAP[card.icon]
          const isSelected = selected === card.type
          return (
            <button
              key={card.type}
              type="button"
              onClick={() => onSelect(card.type)}
              className="research-type-editorial-card research-type-card"
              style={{
                background: isSelected ? 'color-mix(in srgb, var(--accent) 6%, var(--bg-elevated))' : 'var(--bg-elevated)',
                borderColor: isSelected ? 'var(--accent)' : 'var(--border)',
                cursor: 'pointer',
                boxShadow: isSelected ? '0 0 0 1px var(--accent)' : 'none',
              }}
            >
              <div className="research-type-editorial-top">
                {Icon && (
                  <div className="research-type-editorial-icon" style={{ color: 'var(--accent)' }}>
                    <Icon size={20} />
                  </div>
                )}
                <ArrowRight size={16} />
              </div>
              <div className="research-type-editorial-copy">
                <div className="research-type-editorial-title">
                  {card.title}
                </div>
                <div className="research-type-editorial-desc">{card.description}</div>
              </div>
              <div className="research-type-editorial-footer">
                <div>
                  <span className="research-type-editorial-note">Example</span>
                  <span className="research-type-editorial-example">{card.example}</span>
                </div>
                <span className="research-type-editorial-meta">{card.meta}</span>
              </div>
            </button>
          )
        })}
      </div>

      <div className="research-type-stats">
        <div>
          <span className="research-type-stat-label">This week</span>
          <span className="research-type-stat-value">14</span>
          <span className="research-type-stat-copy">briefs generated</span>
        </div>
        <div>
          <span className="research-type-stat-label">Noise filtered</span>
          <span className="research-type-stat-value">94.2%</span>
          <span className="research-type-stat-copy">rejected signal</span>
        </div>
        <div>
          <span className="research-type-stat-label">Signal rate</span>
          <span className="research-type-stat-value">0.7/hr</span>
          <span className="research-type-stat-copy">your lens · active</span>
        </div>
        <div>
          <span className="research-type-stat-label">Time saved</span>
          <span className="research-type-stat-value">3.2h</span>
          <span className="research-type-stat-copy">per brief</span>
        </div>
      </div>
    </div>
  )
}
