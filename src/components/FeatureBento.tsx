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

/* ─── Card 5: Spotify & YouTube ─── */

function SpotifyYouTubeCard() {
  return (
    <div className="bento-media-sources">
      <div className="bento-media-item">
        <div className="bento-media-icon bento-media-icon--spotify">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#1DB954">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
        </div>
        <div className="bento-media-meta">
          <span className="bento-media-label">SPOTIFY</span>
          <span className="bento-media-title">The rate pause explained — what it means for founders</span>
        </div>
      </div>
      <div className="bento-media-item">
        <div className="bento-media-icon bento-media-icon--youtube">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#FF0000">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        </div>
        <div className="bento-media-meta">
          <span className="bento-media-label">YOUTUBE</span>
          <span className="bento-media-title">AI pricing revolution: 3 retailers, one strategy shift</span>
        </div>
      </div>
      <p className="bento-media-auto">Auto-matched from your signals. No searching.</p>
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
            label="SPOTIFY & YOUTUBE"
            description="Relevant finds podcasts and videos that explain your signals. Matched automatically."
          >
            <SpotifyYouTubeCard />
          </BentoCard>
        </div>
      </div>
    </section>
  )
}
