'use client'

import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  MousePointerClick,
  Telescope,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { ResearchType } from './types'
import { Kicker } from './ui/primitives'

type Workflow = {
  id: ResearchType
  icon: LucideIcon
  title: string
  lede: string
  example: string
  meta: string
  output: string
  audience: string
}

const WORKFLOWS: Workflow[] = [
  {
    id: 'meeting_prep',
    icon: Users,
    title: 'Meeting Prep',
    lede: 'Walk in already knowing what matters.',
    example: 'Anthropic · partnership intro',
    meta: '~1m 45s · 8–12 sources',
    output: 'Talking points, landmines, questions',
    audience: 'Best default',
  },
  {
    id: 'competitive_analysis',
    icon: BarChart3,
    title: 'Competitive Analysis',
    lede: "Where they win. Where they're exposed.",
    example: 'Cursor vs Copilot · positioning',
    meta: '~2m 10s · 12–18 sources',
    output: 'Positioning, gaps, counters',
    audience: 'When a rival is moving',
  },
  {
    id: 'business_case',
    icon: BriefcaseBusiness,
    title: 'Business Case',
    lede: 'Proof points. Objections. What has to be true.',
    example: 'Launch weekend delivery · East Coast',
    meta: '~2m 30s · 14–20 sources',
    output: 'Evidence, risks, decision frame',
    audience: 'When the room needs proof',
  },
  {
    id: 'market_research',
    icon: Telescope,
    title: 'Market Research',
    lede: 'Landscape, demand signals, motion.',
    example: 'Agent payments · infra category',
    meta: '~2m 15s · 15–22 sources',
    output: 'Market shifts, players, openings',
    audience: 'When the market is fuzzy',
  },
]

const DEFAULT_RETURN = [
  ['What changed', 'Recent events that matter to the decision.'],
  ['Why it matters', 'The consequence for your role, company, and timing.'],
  ['Next move', 'Questions, risks, and actions to use immediately.'],
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
          Start with the default if you are not sure. Relevant turns a short brief into ranked
          evidence, role-aware judgment, and the next moves you can use.
        </p>

        <div className="intel-picker-default">
          <div className="intel-picker-default-copy">
            <span className="intel-picker-default-icon">
              <MousePointerClick size={16} strokeWidth={1.8} />
            </span>
            <div>
              <Kicker>Recommended start</Kicker>
              <h2>Meeting Prep</h2>
              <p>
                The fastest useful brief. Give it the account, goal, and meeting type.
                It returns the room-read, landmines, and questions.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelect('meeting_prep')}
            className="intel-picker-default-cta"
          >
            Start here
            <ArrowRight size={16} strokeWidth={1.8} />
          </button>
        </div>

        <div className="intel-picker-return">
          {DEFAULT_RETURN.map(([label, note], index) => (
            <button
              key={label}
              type="button"
              onClick={() => onSelect('meeting_prep')}
              className="intel-picker-return-step"
            >
              <span className="mono">{String(index + 1).padStart(2, '0')}</span>
              <strong>{label}</strong>
              <small>{note}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="intel-workflow-list">
        <div className="intel-workflow-list-header">
          <Kicker>Choose a sharper job</Kicker>
          <p>Use these when the decision is already clear.</p>
        </div>
        {WORKFLOWS.map((w, index) => (
          <button
            key={w.id}
            type="button"
            onClick={() => onSelect(w.id)}
            className="intel-workflow-row intel-hoverable"
          >
            <span className="mono intel-workflow-index">{String(index + 1).padStart(2, '0')}</span>
            <span className="intel-workflow-icon">
              <w.icon size={18} strokeWidth={1.7} />
            </span>
            <div>
              <span className="mono intel-workflow-audience">{w.audience}</span>
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
