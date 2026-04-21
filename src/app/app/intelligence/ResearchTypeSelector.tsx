'use client'

import { ArrowRight } from 'lucide-react'
import type { ResearchType } from './types'
import { Kicker } from './ui/primitives'

type Workflow = {
  id: ResearchType
  title: string
  lede: string
  example: string
  meta: string
  output: string
}

const WORKFLOWS: Workflow[] = [
  {
    id: 'meeting_prep',
    title: 'Meeting Prep',
    lede: 'Walk in already knowing what matters.',
    example: 'Anthropic · partnership intro',
    meta: '~1m 45s · 8–12 sources',
    output: 'Talking points, landmines, questions',
  },
  {
    id: 'competitive_analysis',
    title: 'Competitive Analysis',
    lede: "Where they win. Where they're exposed.",
    example: 'Cursor vs Copilot · positioning',
    meta: '~2m 10s · 12–18 sources',
    output: 'Positioning, gaps, counters',
  },
  {
    id: 'business_case',
    title: 'Business Case',
    lede: 'Proof points. Objections. What has to be true.',
    example: 'Launch weekend delivery · East Coast',
    meta: '~2m 30s · 14–20 sources',
    output: 'Evidence, risks, decision frame',
  },
  {
    id: 'market_research',
    title: 'Market Research',
    lede: 'Landscape, demand signals, motion.',
    example: 'Agent payments · infra category',
    meta: '~2m 15s · 15–22 sources',
    output: 'Market shifts, players, openings',
  },
]

interface ResearchTypeSelectorProps {
  selected: ResearchType | null
  onSelect: (type: ResearchType) => void
}

export default function ResearchTypeSelector({ onSelect }: ResearchTypeSelectorProps) {
  return (
    <div className="intel-picker-grid intel-rise" style={{ maxWidth: 1160, margin: '0 auto', padding: '28px 0 24px' }}>
      <div className="intel-picker-brief">
        <Kicker color="var(--amber)">Intelligence desk</Kicker>
        <h1
          className="intel-display"
          style={{
            fontSize: 'clamp(34px, 6vw, 68px)',
            marginTop: 12,
            lineHeight: 0.98,
            maxWidth: 720,
            color: 'var(--ink)',
          }}
        >
          What decision are you preparing for?
        </h1>
        <p className="intel-picker-lede">
          Pick the job. Relevant turns a short brief into ranked evidence, role-aware judgment,
          and the next moves you can use.
        </p>

        <div className="intel-picker-stats">
          {[
            ['Workflows', '04', 'meeting, market, competitor, case'],
            ['Inputs', '3-5', 'enough to aim the research'],
            ['Output', 'cited', 'every claim points back to sources'],
            ['Lens', 'role', 'framed for what you need to decide'],
          ].map(([label, value, note]) => (
            <div key={label} className="intel-picker-stat">
              <Kicker>{label}</Kicker>
              <strong>{value}</strong>
              <span>{note}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="intel-workflow-list">
        {WORKFLOWS.map((w, index) => (
          <button
            key={w.id}
            type="button"
            onClick={() => onSelect(w.id)}
            className="intel-workflow-row intel-hoverable"
          >
            <span className="mono intel-workflow-index">{String(index + 1).padStart(2, '0')}</span>
            <div>
              <h2>{w.title}</h2>
              <p>{w.lede}</p>
              <span className="intel-workflow-meta">
                <span className="mono">{w.example}</span>
                <span className="mono">{w.meta}</span>
                <span className="mono">{w.output}</span>
              </span>
            </div>
            <ArrowRight className="intel-workflow-arrow" size={18} strokeWidth={1.6} />
          </button>
        ))}
      </div>
    </div>
  )
}
