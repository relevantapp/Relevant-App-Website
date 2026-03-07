'use client'

import { useState, useEffect, useRef } from 'react'

/* ─── Card 1: Consequence Chain ─── */

function ConsequenceChainCard() {
  const [step, setStep] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStep(1)
          const t2 = setTimeout(() => setStep(2), 800)
          const t3 = setTimeout(() => setStep(3), 1600)
          const t4 = setTimeout(() => setStep(4), 2400)
          return () => { clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
        }
      },
      { threshold: 0.3 },
    )
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="bento-chain" ref={containerRef}>
      <div className={`bento-chain-node bento-chain-event${step >= 1 ? ' bento-chain-node--visible' : ''}`}>
        <span className="bento-chain-node-type">EVENT</span>
        <span className="bento-chain-node-text">Fed signals rate cuts</span>
      </div>
      <div className={`bento-chain-arrow${step >= 2 ? ' bento-chain-arrow--visible' : ''}`}>
        <svg width="40" height="16" viewBox="0 0 40 16" fill="none">
          <path d="M0 8h32M28 2l6 6-6 6" stroke="var(--text-soft)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className={`bento-chain-node bento-chain-dimension${step >= 2 ? ' bento-chain-node--visible' : ''}`}>
        <span className="bento-chain-node-type" style={{ color: '#FBBF24' }}>YOUR DIMENSION</span>
        <span className="bento-chain-node-text">Series A runway</span>
      </div>
      <div className={`bento-chain-arrow${step >= 3 ? ' bento-chain-arrow--visible' : ''}`}>
        <svg width="40" height="16" viewBox="0 0 40 16" fill="none">
          <path d="M0 8h32M28 2l6 6-6 6" stroke="var(--text-soft)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className={`bento-chain-node bento-chain-consequence${step >= 3 ? ' bento-chain-node--visible' : ''}`}>
        <span className="bento-chain-node-type" style={{ color: '#4ADE80' }}>CONSEQUENCE</span>
        <span className="bento-chain-node-text">Bridge round extends 6-12 months</span>
      </div>
      {step >= 4 && (
        <div className="bento-chain-branch">
          <div className="bento-chain-branch-line" />
          <div className="bento-chain-node bento-chain-node--visible bento-chain-branch-node">
            <span className="bento-chain-node-type" style={{ color: '#A78BFA' }}>IF CPI &lt; 3.2%</span>
            <span className="bento-chain-node-text">Accelerated timeline (74% likely)</span>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Card 2: Multi-Source ─── */

const FAN_SOURCES = ['Reuters', 'Bloomberg', 'Financial Times', 'WSJ', 'CNBC']

function MultiSourceCard() {
  return (
    <div className="bento-multisource">
      <div className="bento-fan">
        {FAN_SOURCES.map((src, i) => (
          <div
            key={src}
            className="bento-fan-card"
            style={{
              '--fan-i': i,
              '--fan-total': FAN_SOURCES.length,
            } as React.CSSProperties}
          >
            <span className="bento-fan-label">{src}</span>
          </div>
        ))}
      </div>
      <div className="bento-collapse-arrow">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12l7 7 7-7" stroke="var(--text-soft)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="bento-collapsed-signal">
        <span className="bento-collapsed-dot" style={{ background: '#60A5FA' }} />
        <span className="bento-collapsed-text">1 signal</span>
      </div>
    </div>
  )
}

/* ─── Card 3: Ask AI ─── */

function AskAICard() {
  return (
    <div className="bento-chat">
      <div className="bento-chat-summary">
        Federal Reserve Signals Accelerated Rate Cuts
      </div>
      <div className="bento-chat-bubble bento-chat-user">
        How does this affect my Q2 hiring plan?
      </div>
      <div className="bento-chat-bubble bento-chat-ai">
        Your cost of capital drops ~40bps. That frees approximately $180K in Q2 budget — enough for 1.5 additional headcount at your target comp band.
      </div>
    </div>
  )
}

/* ─── Card 4: Influence Dimensions ─── */

const DIMS = [
  'Federal Reserve policy', 'Series A conditions', 'AI regulation',
  'Cloud pricing', 'Supply chain risk', 'Canadian housing',
  'Competitor: Stripe', 'Biotech M&A', 'Tariff policy',
  'Defense budget', 'Streaming churn', 'Ad spend shifts',
]

function DimensionsCard() {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <div className="bento-dimensions">
      {DIMS.map((d, i) => (
        <span
          key={d}
          className={`bento-dim-chip${hovered === i ? ' bento-dim-chip--hover' : ''}`}
          style={{ animationDelay: `${i * 120}ms` }}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
        >
          {d}
          {hovered === i && (
            <span className="bento-dim-tooltip">Matched 14 signals this month</span>
          )}
        </span>
      ))}
    </div>
  )
}

/* ─── Card 5: Goals ─── */

function GoalsCard() {
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const progress = 0.87
  const offset = circumference * (1 - progress)

  return (
    <div className="bento-goals">
      <div className="bento-goals-ring-wrap">
        <svg width="88" height="88" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={radius} fill="none" stroke="var(--border)" strokeWidth="6" />
          <circle
            cx="44" cy="44" r={radius} fill="none"
            stroke="#4ADE80" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 44 44)"
            className="bento-goals-progress"
          />
        </svg>
        <span className="bento-goals-score">87</span>
      </div>
      <div className="bento-goals-info">
        <span className="bento-goals-title">Career Growth</span>
        <span className="bento-goals-meta">Week 4 · 🔥 4-week streak</span>
      </div>
      <div className="bento-goals-signal">
        <span className="bento-goals-badge">Affects your career growth →</span>
      </div>
    </div>
  )
}

/* ─── Card 6: Finite Feed ─── */

function FiniteFeedCard() {
  return (
    <div className="bento-finite">
      <div className="bento-finite-mini-cards">
        <div className="bento-finite-mini" style={{ '--accent': '#60A5FA' } as React.CSSProperties} />
        <div className="bento-finite-mini" style={{ '--accent': '#4ADE80' } as React.CSSProperties} />
        <div className="bento-finite-mini bento-finite-mini--faded" style={{ '--accent': '#FBBF24' } as React.CSSProperties} />
      </div>
      <div className="bento-finite-done">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="14" stroke="var(--success)" strokeWidth="2" />
          <path d="M10 16l4 4 8-8" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>You&rsquo;re caught up</span>
      </div>
    </div>
  )
}

/* ─── Main Component ─── */

interface BentoCardProps {
  label: string
  description: string
  className?: string
  children: React.ReactNode
}

function BentoCard({ label, description, className, children }: BentoCardProps) {
  return (
    <div className={`bento-card reveal-on-scroll${className ? ` ${className}` : ''}`}>
      <div className="bento-card-visual">{children}</div>
      <div className="bento-card-text">
        <span className="bento-card-label">{label}</span>
        <p className="bento-card-desc">{description}</p>
      </div>
    </div>
  )
}

export default function FeatureBento() {
  return (
    <section id="features" className="section-block">
      <div className="site-frame">
        <div className="section-heading reveal-on-scroll">
          <span className="section-kicker">INSIDE THE APP</span>
          <h2>More than a feed.</h2>
        </div>

        <div className="bento-grid">
          <BentoCard
            label="CONSEQUENCE MAP"
            description="We don't just tell you what happened. We trace what it means for you."
            className="bento-card--wide"
          >
            <ConsequenceChainCard />
          </BentoCard>

          <BentoCard
            label="MULTI-SOURCE"
            description="Same story. Eight publishers. One signal."
          >
            <MultiSourceCard />
          </BentoCard>

          <BentoCard
            label="ASK DEEPER"
            description="Read the signal. Then ask it anything."
          >
            <AskAICard />
          </BentoCard>

          <BentoCard
            label="YOUR DIMENSIONS"
            description="150+ things that can affect you. Computed from who you are."
          >
            <DimensionsCard />
          </BentoCard>

          <BentoCard
            label="GOALS"
            description="Don't just know things. Use them."
          >
            <GoalsCard />
          </BentoCard>

          <BentoCard
            label="YOU'RE DONE"
            description="No infinite scroll. When you've read everything, we tell you."
          >
            <FiniteFeedCard />
          </BentoCard>
        </div>
      </div>
    </section>
  )
}
