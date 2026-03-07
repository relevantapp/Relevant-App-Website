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
        <span className="bento-chain-node-text">Interest rates hold steady</span>
      </div>
      <div className={`bento-chain-arrow${step >= 2 ? ' bento-chain-arrow--visible' : ''}`}>
        <svg width="40" height="16" viewBox="0 0 40 16" fill="none">
          <path d="M0 8h32M28 2l6 6-6 6" stroke="var(--text-soft)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className={`bento-chain-node bento-chain-dimension${step >= 2 ? ' bento-chain-node--visible' : ''}`}>
        <span className="bento-chain-node-type" style={{ color: '#FBBF24' }}>YOUR DIMENSION</span>
        <span className="bento-chain-node-text">Your company&rsquo;s expansion plan</span>
      </div>
      <div className={`bento-chain-arrow${step >= 3 ? ' bento-chain-arrow--visible' : ''}`}>
        <svg width="40" height="16" viewBox="0 0 40 16" fill="none">
          <path d="M0 8h32M28 2l6 6-6 6" stroke="var(--text-soft)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className={`bento-chain-node bento-chain-consequence${step >= 3 ? ' bento-chain-node--visible' : ''}`}>
        <span className="bento-chain-node-type" style={{ color: '#4ADE80' }}>CONSEQUENCE</span>
        <span className="bento-chain-node-text">You have 6 more months of cheap capital</span>
      </div>
      {step >= 4 && (
        <div className="bento-chain-branch">
          <div className="bento-chain-branch-line" />
          <div className="bento-chain-node bento-chain-node--visible bento-chain-branch-node">
            <span className="bento-chain-node-type" style={{ color: '#A78BFA' }}>IF INFLATION &lt; 2.5%</span>
            <span className="bento-chain-node-text">Timeline could extend further (74% likely)</span>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Card 2: Multi-Source ─── */

const SOURCES = ['Reuters', 'Financial Times', 'Bloomberg']

function MultiSourceCard() {
  return (
    <div className="bento-multisource">
      <div className="bento-source-stack">
        {SOURCES.map((src, i) => (
          <div
            key={src}
            className="bento-source-card"
            style={{
              '--stack-i': i,
            } as React.CSSProperties}
          >
            <span className="bento-source-dot" />
            <span className="bento-source-name">{src}</span>
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
        <span className="bento-collapsed-text">3 sources, 1 signal</span>
      </div>
    </div>
  )
}

/* ─── Card 3: Ask Deeper ─── */

function AskDeeperCard() {
  return (
    <div className="bento-chat">
      <div className="bento-chat-context">
        <span className="bento-chat-context-label">SIGNAL</span>
        <span className="bento-chat-context-text">Fed signals rate pause through Q3 2026</span>
      </div>
      <div className="bento-chat-messages">
        <div className="bento-chat-bubble bento-chat-user">
          How does this affect my hiring budget?
        </div>
        <div className="bento-chat-bubble bento-chat-ai">
          <span className="bento-chat-ai-text">
            With borrowing costs holding steady, your Q3 budget frees up roughly $180K
            &mdash; enough for 1-2 additional hires at your target comp band.
            I&rsquo;d move before September.
          </span>
        </div>
      </div>
      <div className="bento-chat-input">
        <span className="bento-chat-input-placeholder">Ask anything about this signal…</span>
      </div>
    </div>
  )
}

/* ─── Card 4: Influence Dimensions ─── */

const DIMS = [
  'SaaS pricing shifts', 'Federal Reserve policy', 'AI infrastructure spend',
  'Competitor: Stripe', 'Supply chain risk', 'Canadian housing market',
  'Series A conditions', 'Ad spend reallocation', 'Data privacy regulation',
  'Cloud cost trajectory', 'Remote work policy', 'Interest rate exposure',
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

/* ─── Card 6: Listen & Watch ─── */

function ListenWatchCard() {
  return (
    <div className="bento-listen">
      <div className="bento-listen-items">
        <div className="bento-listen-item">
          <div className="bento-listen-icon bento-listen-icon--podcast">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
            </svg>
          </div>
          <div className="bento-listen-meta">
            <span className="bento-listen-type">PODCAST</span>
            <span className="bento-listen-title">The rate pause explained</span>
            <span className="bento-listen-duration">12 min · auto-matched</span>
          </div>
        </div>
        <div className="bento-listen-item">
          <div className="bento-listen-icon bento-listen-icon--video">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <div className="bento-listen-meta">
            <span className="bento-listen-type">VIDEO</span>
            <span className="bento-listen-title">AI pricing revolution</span>
            <span className="bento-listen-duration">8 min · auto-matched</span>
          </div>
        </div>
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
          <h2>More than a feed. An intelligence layer.</h2>
        </div>

        <div className="bento-grid">
          <BentoCard
            label="CONSEQUENCE MAP"
            description="Every signal traces forward. Here's how a rate decision connects to your budget."
            className="bento-card--wide"
          >
            <ConsequenceChainCard />
          </BentoCard>

          <BentoCard
            label="MULTI-SOURCE"
            description="Same story, reported by three publishers. We verify, merge, and give you one clear signal."
          >
            <MultiSourceCard />
          </BentoCard>

          <BentoCard
            label="ASK DEEPER"
            description="Read a signal, then ask it anything. Like having an analyst on call."
          >
            <AskDeeperCard />
          </BentoCard>

          <BentoCard
            label="YOUR DIMENSIONS"
            description="The things that can affect your work. Automatically built from your profile."
          >
            <DimensionsCard />
          </BentoCard>

          <BentoCard
            label="GOALS"
            description="Track what you're working toward. Relevant connects signals to your progress."
          >
            <GoalsCard />
          </BentoCard>

          <BentoCard
            label="LISTEN & WATCH"
            description="Some signals come with a podcast or video. Found automatically — no searching."
          >
            <ListenWatchCard />
          </BentoCard>
        </div>
      </div>
    </section>
  )
}
