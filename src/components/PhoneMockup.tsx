'use client'

import { useState, useEffect, useRef } from 'react'

/* ─── Signal Data ─── */

interface FeedSignal {
  color: string
  category: string
  headline: string
  synthesis: string
  sources: string
  tabs: {
    happened: string
    matters: string
    todo: string
  }
}

const FEED_SIGNALS: FeedSignal[] = [
  {
    color: '#60A5FA',
    category: 'COMPETITIVE',
    headline: 'Fed signals rate pause through Q3 2026',
    synthesis: 'Bond markets repriced immediately — 10-year yield dropped 12bps. Your cost of capital outlook shifts.',
    sources: '5 sources · 2 days active',
    tabs: {
      happened: 'Three Fed governors gave aligned statements signaling a pause. Markets priced in 89% probability of no change through September.',
      matters: 'Your expansion timeline just got more room. Cost of capital stays lower, and competitor funding rounds get easier.',
      todo: 'Lock in current rates on planned debt. Accelerate Q3 hiring before the market catches up.',
    },
  },
  {
    color: '#4ADE80',
    category: 'OPPORTUNITY',
    headline: 'Enterprise AI spending projected up 40% YoY',
    synthesis: 'RAG and fine-tuning budgets growing 3× faster than general AI training. The window for early movers is narrowing.',
    sources: '3 sources · 1 day active',
    tabs: {
      happened: 'Gartner, IDC, and Bloomberg Intelligence all project $340B in enterprise AI infrastructure spending globally.',
      matters: 'Companies building retrieval-heavy systems attract disproportionate funding. This widens the gap between early movers and followers.',
      todo: 'Position your roadmap around RAG capabilities. Start conversations with enterprise buyers uncommitted on budgets.',
    },
  },
  {
    color: '#FBBF24',
    category: 'RISK',
    headline: 'Supply chain transparency bill clears Senate committee',
    synthesis: 'Requires public disclosure of tier-2 supplier relationships for companies above $500M revenue.',
    sources: '2 sources · 4 days active',
    tabs: {
      happened: 'The bipartisan Supply Chain Accountability Act passed 14-9 after a compromise amendment on timelines.',
      matters: 'If your revenue exceeds $500M, compliance systems typically take 4-6 months to build. Start now.',
      todo: 'Audit supplier visibility depth. Engage compliance counsel on disclosure requirements.',
    },
  },
  {
    color: '#F87171',
    category: 'REGULATORY',
    headline: 'New data privacy framework proposed for AI systems',
    synthesis: 'Consent architecture overhaul required for companies processing data from more than 10M users.',
    sources: '4 sources · 1 day active',
    tabs: {
      happened: 'The EU-US joint task force released draft requirements for AI data processing consent, effective 2027.',
      matters: 'Your current consent flow likely doesn\'t meet the new standard. The engineering lift is 2-3 sprints.',
      todo: 'Map current consent architecture against the draft. Budget for a Q4 compliance sprint.',
    },
  },
  {
    color: '#A78BFA',
    category: 'STRATEGIC',
    headline: 'Three major retailers adopt same-day AI pricing',
    synthesis: 'Average price adjustment frequency increased from weekly to every 4 hours. Static pricing strategies erode.',
    sources: '4 sources · 3 days active',
    tabs: {
      happened: 'Walmart, Target, and Costco independently confirmed AI-driven pricing rollouts across categories.',
      matters: 'If you compete on price or supply into these chains, your margin assumptions need updating within two quarters.',
      todo: 'Model the margin impact of 4-hour price cycles on your top 20 SKUs. Evaluate dynamic pricing tools.',
    },
  },
]

type TabKey = 'happened' | 'matters' | 'todo'

const TAB_LABELS: { key: TabKey; label: string }[] = [
  { key: 'happened', label: 'What Happened' },
  { key: 'matters', label: 'Why It Matters' },
  { key: 'todo', label: 'What To Do' },
]

/* ─── Feed Card ─── */

function FeedCard({ signal, index }: { signal: FeedSignal; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>('matters')

  return (
    <div
      className={`phone-feed-card${expanded ? ' phone-feed-card--expanded' : ''}`}
      style={{ '--accent': signal.color } as React.CSSProperties}
      onClick={() => { if (!expanded) setExpanded(true) }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' && !expanded) setExpanded(true) }}
    >
      <div className="phone-feed-card-top">
        <span className="phone-feed-badge" style={{ color: signal.color }}>
          <span className="phone-feed-dot" style={{ background: signal.color }} />
          {signal.category}
        </span>
        <span className="phone-feed-sources">{signal.sources}</span>
      </div>
      <p className="phone-feed-headline">{signal.headline}</p>
      <p className="phone-feed-synthesis">{signal.synthesis}</p>

      {expanded && (
        <div className="phone-feed-detail">
          <div className="phone-feed-tabs">
            {TAB_LABELS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={`phone-feed-tab${activeTab === key ? ' phone-feed-tab--active' : ''}`}
                style={activeTab === key ? { background: signal.color, borderColor: signal.color } : undefined}
                onClick={(e) => { e.stopPropagation(); setActiveTab(key) }}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="phone-feed-tab-content">{signal.tabs[activeTab]}</p>
          <button
            type="button"
            className="phone-feed-collapse"
            onClick={(e) => { e.stopPropagation(); setExpanded(false) }}
          >
            Collapse
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── Main Component ─── */

export default function PhoneMockup() {
  return (
    <section id="the-feed" className="section-block section-tinted">
      <div className="site-frame">
        <div className="section-heading reveal-on-scroll">
          <span className="section-kicker">THE FEED</span>
          <h2>This is what it looks like.</h2>
          <p>Real signals. Scroll through them. Tap any card.</p>
        </div>

        <div className="phone-wrapper reveal-on-scroll">
          {/* Desktop annotations */}
          <div className="phone-annotations">
            <div className="phone-annotation phone-annotation--left" style={{ top: '12%' }}>
              <span>Impact type</span>
              <div className="phone-annotation-line" />
            </div>
            <div className="phone-annotation phone-annotation--left" style={{ top: '38%' }}>
              <span>Multi-source</span>
              <div className="phone-annotation-line" />
            </div>
            <div className="phone-annotation phone-annotation--right" style={{ top: '25%' }}>
              <div className="phone-annotation-line" />
              <span>Tap to expand</span>
            </div>
            <div className="phone-annotation phone-annotation--right" style={{ bottom: '8%' }}>
              <div className="phone-annotation-line" />
              <span>That&rsquo;s everything</span>
            </div>
          </div>

          {/* Phone frame */}
          <div className="phone-frame">
            {/* Notch / Dynamic Island */}
            <div className="phone-notch" />

            {/* Status bar */}
            <div className="phone-status-bar">
              <span>9:41</span>
              <div className="phone-status-icons">
                <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><rect x="0" y="3" width="3" height="9" rx="0.5" opacity="0.3"/><rect x="4.5" y="2" width="3" height="10" rx="0.5" opacity="0.5"/><rect x="9" y="0.5" width="3" height="11.5" rx="0.5" opacity="0.7"/><rect x="13.5" y="0" width="2.5" height="12" rx="0.5"/></svg>
                <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0.5" y="0.5" width="15" height="11" rx="2" stroke="currentColor" strokeWidth="1" fill="none"/><rect x="16" y="3.5" width="1.5" height="5" rx="0.5"/><rect x="2" y="2" width="10" height="8" rx="1"/></svg>
              </div>
            </div>

            {/* Feed content */}
            <div className="phone-feed-scroll">
              {FEED_SIGNALS.map((s, i) => (
                <FeedCard key={i} signal={s} index={i} />
              ))}

              {/* You're caught up */}
              <div className="phone-feed-caught-up">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <circle cx="14" cy="14" r="12" stroke="var(--success)" strokeWidth="2" />
                  <path d="M9 14l3.5 3.5 6.5-6.5" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="phone-feed-done-text">You&rsquo;re caught up</span>
                <span className="phone-feed-done-sub">5 signals · All read</span>
              </div>
            </div>

            {/* Home indicator */}
            <div className="phone-home-bar" />
          </div>
        </div>
      </div>
    </section>
  )
}
