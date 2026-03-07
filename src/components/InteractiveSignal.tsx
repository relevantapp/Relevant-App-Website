'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

type TabKey = 'happened' | 'matters' | 'todo'

interface Signal {
  category: string
  color: string
  impact: string
  sources: string
  headline: string
  synthesis: string
  tabs: Record<TabKey, string>
}

const SIGNALS: Signal[] = [
  {
    category: 'COMPETITIVE',
    color: '#60A5FA',
    impact: 'HIGH IMPACT',
    sources: '5 sources',
    headline: 'Fed signals rate pause through Q3 2026',
    synthesis:
      'The Federal Reserve indicated rates will hold steady through Q3, citing stable inflation at 2.4%. Bond markets repriced immediately, with the 10-year yield dropping 12 basis points.',
    tabs: {
      happened:
        'Three Fed governors gave aligned statements this week signaling a pause. Markets priced in 89% probability of no change through September.',
      matters:
        'Your expansion timeline just got more room. Cost of capital stays lower, and competitor funding rounds get easier. Watch for a hiring surge in your sector within 60 days.',
      todo: 'Lock in current rates on any planned debt. Accelerate Q3 hiring before the market catches up. Brief your board on the revised macro outlook.',
    },
  },
  {
    category: 'OPPORTUNITY',
    color: '#4ADE80',
    impact: 'HIGH IMPACT',
    sources: '3 sources',
    headline: 'Enterprise AI spending projected up 40% YoY',
    synthesis:
      "Gartner's latest forecast projects enterprise AI infrastructure spending to reach $340B globally. The growth is concentrated in inference compute and retrieval-augmented generation.",
    tabs: {
      happened:
        'The projection consolidates Gartner, IDC, and Bloomberg Intelligence estimates. RAG and fine-tuning budgets are growing 3x faster than general AI training spend.',
      matters:
        'Your sector is accelerating. Companies building retrieval-heavy systems will attract disproportionate funding. This widens the gap between early movers and followers.',
      todo: "Position your product roadmap around RAG capabilities. Start conversations with enterprise buyers who haven't committed budgets yet. The window is 90 days.",
    },
  },
  {
    category: 'RISK',
    color: '#FBBF24',
    impact: 'MEDIUM IMPACT',
    sources: '2 sources',
    headline: 'Supply chain transparency bill clears Senate committee',
    synthesis:
      'The bipartisan Supply Chain Accountability Act passed the Senate Commerce Committee 14-9. It requires public disclosure of tier-2 supplier relationships for companies above $500M revenue.',
    tabs: {
      happened:
        'The bill advanced faster than expected after a compromise amendment on phase-in timelines. Full Senate vote expected within 6 weeks.',
      matters:
        'If your company is above $500M revenue, compliance preparation should start now. Supplier auditing infrastructure typically takes 4-6 months to implement.',
      todo: 'Audit your current supplier visibility depth. Engage compliance counsel on the disclosure requirements. Flag to operations lead as a Q3 priority.',
    },
  },
  {
    category: 'COMPETITIVE',
    color: '#60A5FA',
    impact: 'MEDIUM IMPACT',
    sources: '4 sources',
    headline: 'Three major retailers adopt same-day AI pricing',
    synthesis:
      'Walmart, Target, and Costco have all deployed real-time AI pricing engines in the past 90 days. Average price adjustment frequency increased from weekly to every 4 hours.',
    tabs: {
      happened:
        'All three retailers independently confirmed AI-driven pricing rollouts. Walmart leads with full category coverage, while Target and Costco are phasing in by department.',
      matters:
        'If you compete on price in retail or supply into these chains, your margin assumptions need updating. Static pricing strategies will underperform within two quarters.',
      todo: 'Model the margin impact of 4-hour price cycles on your top 20 SKUs. Evaluate dynamic pricing tools for your own channels. Request updated terms from retail partners.',
    },
  },
]

const TAB_LABELS: { key: TabKey; label: string }[] = [
  { key: 'happened', label: 'What Happened' },
  { key: 'matters', label: 'Why It Matters' },
  { key: 'todo', label: 'What To Do' },
]

const CYCLE_MS = 7000

export default function InteractiveSignal() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<TabKey>('matters')
  const [fading, setFading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pausedRef = useRef(false)

  const goTo = useCallback(
    (index: number) => {
      if (index === activeIndex) return
      setFading(true)
      setTimeout(() => {
        setActiveIndex(index)
        setActiveTab('matters')
        setFading(false)
      }, 200)
    },
    [activeIndex],
  )

  const advance = useCallback(() => {
    if (pausedRef.current) return
    goTo((activeIndex + 1) % SIGNALS.length)
  }, [activeIndex, goTo])

  useEffect(() => {
    timerRef.current = setInterval(advance, CYCLE_MS)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [advance])

  const handleMouseEnter = () => {
    pausedRef.current = true
  }

  const handleMouseLeave = () => {
    pausedRef.current = false
  }

  const handleDot = (i: number) => {
    goTo(i)
    // restart timer
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(advance, CYCLE_MS)
  }

  const signal = SIGNALS[activeIndex]

  return (
    <div className="signal-wrapper reveal-on-scroll">
      <div
        className={`signal-card${fading ? ' signal-card--fading' : ''}`}
        style={{ '--signal-color': signal.color } as React.CSSProperties}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Top row: category + badges */}
        <div className="signal-top">
          <span className="signal-category">
            <span className="signal-dot" />
            {signal.category}
          </span>
          <div className="signal-badges">
            <span className="signal-badge">{signal.impact}</span>
            <span className="signal-badge">{signal.sources}</span>
          </div>
        </div>

        {/* Headline */}
        <h3 className="signal-headline">{signal.headline}</h3>

        {/* Synthesis */}
        <p className="signal-synthesis">{signal.synthesis}</p>

        {/* Tabs */}
        <div className="signal-tabs">
          {TAB_LABELS.map(({ key, label }) => (
            <button
              key={key}
              className={`signal-tab${activeTab === key ? ' signal-tab--active' : ''}`}
              onClick={() => setActiveTab(key)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="signal-tab-content" key={`${activeIndex}-${activeTab}`}>
          <p>{signal.tabs[activeTab]}</p>
        </div>
      </div>

      {/* Dots */}
      <div className="signal-dots">
        {SIGNALS.map((_, i) => (
          <button
            key={i}
            className={`signal-dot-btn${i === activeIndex ? ' signal-dot-btn--active' : ''}`}
            onClick={() => handleDot(i)}
            type="button"
            aria-label={`Signal ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
