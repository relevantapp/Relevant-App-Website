'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

/* ─── Step 1: Onboarding Lens ─── */

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Energy', 'Manufacturing',
  'Retail', 'Real Estate', 'Media', 'Education', 'Defense',
]

const ROLES = [
  'CEO', 'VP Engineering', 'Product Manager', 'Analyst',
  'Founder', 'Designer', 'Student', 'Consultant', 'Operator',
]

const COMPANIES = [
  'Tesla', 'Deloitte', 'Shopify', 'Goldman Sachs',
  'My Startup', 'Google', 'McKinsey', 'Stripe',
]

const COUNTRIES = [
  { flag: '🇺🇸', name: 'United States' },
  { flag: '🇨🇦', name: 'Canada' },
  { flag: '🇬🇧', name: 'United Kingdom' },
  { flag: '🇩🇪', name: 'Germany' },
  { flag: '🇮🇳', name: 'India' },
  { flag: '🇦🇺', name: 'Australia' },
]

const DIMENSION_MAP: Record<string, string[]> = {
  Technology: ['AI infrastructure spend', 'SaaS pricing trends', 'Cloud cost trajectory'],
  Finance: ['Federal Reserve rates', 'Bond yield shifts', 'Credit market conditions'],
  Healthcare: ['FDA pipeline approvals', 'Biotech M&A activity', 'Drug pricing regulation'],
  Energy: ['Oil supply disruptions', 'Renewable subsidy policy', 'Grid infrastructure spend'],
  Manufacturing: ['Supply chain risk index', 'Tariff policy shifts', 'Automation cost curves'],
  Retail: ['Consumer spending signals', 'E-commerce margin shifts', 'Same-day delivery economics'],
  'Real Estate': ['Mortgage rate trajectory', 'Commercial vacancy trends', 'Housing starts data'],
  Media: ['Ad spend reallocation', 'Streaming churn metrics', 'Creator economy shifts'],
  Education: ['Enrollment trend shifts', 'EdTech funding cycles', 'Student debt policy'],
  Defense: ['Defense budget trajectory', 'Procurement timelines', 'Geopolitical risk signals'],
}

const ROLE_DIMENSIONS: Record<string, string> = {
  CEO: 'Board-level strategic exposure',
  'VP Engineering': 'Technical hiring & infra costs',
  'Product Manager': 'Competitive feature parity',
  Analyst: 'Research coverage accuracy',
  Founder: 'Fundraising climate signals',
  Designer: 'Design tool market shifts',
  Student: 'Industry entry conditions',
  Consultant: 'Client sector volatility',
  Operator: 'Operational cost drivers',
}

function OnboardingDemo() {
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null)
  const [dimensions, setDimensions] = useState<string[]>([])

  useEffect(() => {
    const dims: string[] = []
    if (selectedIndustry && DIMENSION_MAP[selectedIndustry]) {
      dims.push(...DIMENSION_MAP[selectedIndustry])
    }
    if (selectedRole && ROLE_DIMENSIONS[selectedRole]) {
      dims.push(ROLE_DIMENSIONS[selectedRole])
    }
    if (selectedCompany) {
      dims.push(`${selectedCompany} competitive landscape`)
    }
    if (selectedCountry) {
      dims.push(`${selectedCountry} policy landscape`)
    }
    setDimensions(dims)
  }, [selectedIndustry, selectedRole, selectedCountry, selectedCompany])

  const selectionCount = [selectedIndustry, selectedRole, selectedCountry, selectedCompany].filter(Boolean).length

  return (
    <div className="hiw-onboarding">
      <div className="hiw-field-group">
        <span className="hiw-field-label">Industry</span>
        <div className="hiw-chips">
          {INDUSTRIES.map((ind) => (
            <button
              key={ind}
              type="button"
              className={`hiw-chip${selectedIndustry === ind ? ' hiw-chip--active' : ''}`}
              onClick={() => setSelectedIndustry(selectedIndustry === ind ? null : ind)}
            >
              {ind}
            </button>
          ))}
        </div>
      </div>

      <div className="hiw-field-group">
        <span className="hiw-field-label">Role</span>
        <div className="hiw-chips">
          {ROLES.map((role) => (
            <button
              key={role}
              type="button"
              className={`hiw-chip${selectedRole === role ? ' hiw-chip--active' : ''}`}
              onClick={() => setSelectedRole(selectedRole === role ? null : role)}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      <div className="hiw-field-group">
        <span className="hiw-field-label">Company</span>
        <div className="hiw-chips">
          {COMPANIES.map((comp) => (
            <button
              key={comp}
              type="button"
              className={`hiw-chip${selectedCompany === comp ? ' hiw-chip--active' : ''}`}
              onClick={() => setSelectedCompany(selectedCompany === comp ? null : comp)}
            >
              {comp}
            </button>
          ))}
        </div>
      </div>

      <div className="hiw-field-group">
        <span className="hiw-field-label">Country</span>
        <div className="hiw-chips">
          {COUNTRIES.map((c) => (
            <button
              key={c.name}
              type="button"
              className={`hiw-chip hiw-chip--country${selectedCountry === c.name ? ' hiw-chip--active' : ''}`}
              onClick={() => setSelectedCountry(selectedCountry === c.name ? null : c.name)}
            >
              <span className="hiw-flag">{c.flag}</span> {c.name}
            </button>
          ))}
        </div>
      </div>

      {dimensions.length > 0 && (
        <div className="hiw-dimensions-preview">
          <span className="hiw-dim-label">Your influence dimensions ({selectionCount}/4)</span>
          <div className="hiw-dim-chips">
            {dimensions.map((d, i) => (
              <span key={d} className="hiw-dim-chip" style={{ animationDelay: `${i * 80}ms` }}>
                {d}
              </span>
            ))}
          </div>
          <p className="hiw-privacy-note">Your answers stay private. We never sell your data — we only use it to find what&rsquo;s relevant to you.</p>
        </div>
      )}
    </div>
  )
}

/* ─── Step 2: Ingestion Animation ─── */

const SOURCES = [
  'Reuters', 'Financial Times', 'SEC Filings', 'Industry Reports',
  'Tech Publications', 'Government Releases', 'Market Data', 'Global Trade Data',
]

function IngestionAnimation() {
  const [count, setCount] = useState(0)
  const [active, setActive] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !active) setActive(true)
      },
      { threshold: 0.3 },
    )
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [active])

  useEffect(() => {
    if (!active) return
    const target = 2847
    const duration = 2200
    const start = performance.now()
    let frame: number
    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active])

  return (
    <div className={`hiw-ingestion${active ? ' hiw-ingestion--active' : ''}`} ref={containerRef}>
      <div className="hiw-source-ring">
        {SOURCES.map((src, i) => (
          <span
            key={src}
            className="hiw-source-label"
            style={{
              '--angle': `${(i / SOURCES.length) * 360}deg`,
              '--delay': `${i * 150}ms`,
            } as React.CSSProperties}
          >
            {src}
          </span>
        ))}
      </div>

      <div className="hiw-center-glow" />

      <div className="hiw-counter-stack">
        <span className="hiw-count-big">{count.toLocaleString()}</span>
        <span className="hiw-count-label">articles scanned</span>
        <div className="hiw-count-divider" />
        <span className="hiw-count-match">7</span>
        <span className="hiw-count-label">matched your dimensions</span>
      </div>
    </div>
  )
}

/* ─── Step 3: Mini Feed ─── */

const MINI_SIGNALS = [
  { color: '#60A5FA', category: 'COMPETITIVE', headline: 'Fed signals rate pause through Q3', sources: '5 sources', synthesis: 'Cost of capital stays lower — your expansion timeline has more room.' },
  { color: '#4ADE80', category: 'OPPORTUNITY', headline: 'Enterprise AI spending up 40% YoY', sources: '3 sources', synthesis: 'RAG budgets growing 3× faster. The window for early movers is 90 days.' },
  { color: '#FBBF24', category: 'RISK', headline: 'Supply chain bill clears committee', sources: '2 sources', synthesis: 'Compliance prep should start now — implementation takes 4-6 months.' },
  { color: '#F87171', category: 'REGULATORY', headline: 'New data privacy framework proposed', sources: '4 sources', synthesis: 'Consent architecture overhaul required for companies above 10M users.' },
  { color: '#A78BFA', category: 'STRATEGIC', headline: 'Major retailers adopt AI pricing', sources: '4 sources', synthesis: 'Static pricing strategies will underperform within two quarters.' },
]

function MiniFeed() {
  const [visible, setVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true)
      },
      { threshold: 0.2 },
    )
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="hiw-mini-feed" ref={containerRef}>
      {MINI_SIGNALS.map((s, i) => (
        <div
          key={i}
          className={`hiw-mini-card${visible ? ' hiw-mini-card--visible' : ''}`}
          style={{ '--delay': `${i * 120}ms`, '--accent': s.color } as React.CSSProperties}
        >
          <div className="hiw-mini-top">
            <span className="hiw-mini-badge" style={{ color: s.color }}>{s.category}</span>
            <span className="hiw-mini-sources">{s.sources}</span>
          </div>
          <p className="hiw-mini-headline">{s.headline}</p>
          <p className="hiw-mini-synthesis">{s.synthesis}</p>
        </div>
      ))}
      <div className={`hiw-caught-up${visible ? ' hiw-caught-up--visible' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="9" stroke="var(--success)" strokeWidth="2" />
          <path d="M6 10l3 3 5-5" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>5/5 signals read · You&rsquo;re caught up</span>
      </div>
    </div>
  )
}

/* ─── Main Component ─── */

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section-block section-tinted">
      <div className="site-frame">
        <div className="section-heading reveal-on-scroll">
          <span className="section-kicker">HOW IT WORKS</span>
          <h2>Tell us what you do. We&apos;ll filter the world.</h2>
        </div>

        <div className="hiw-steps">
          {/* Step 1 */}
          <div className="hiw-step reveal-on-scroll">
            <div className="hiw-step-header">
              <span className="hiw-step-num">01</span>
              <h3>Tell us what you do. We&apos;ll figure out the rest.</h3>
              <p>Your role, your industry, and your company. That&apos;s all we need.</p>
            </div>
            <div className="hiw-step-visual">
              <OnboardingDemo />
            </div>
          </div>

          {/* Step 2 */}
          <div className="hiw-step reveal-on-scroll">
            <div className="hiw-step-header">
              <span className="hiw-step-num">02</span>
              <h3>Relevant watches what affects you.</h3>
              <p>Every day, we scan news, reports, and filings. We filter the world against what actually matters to your job.</p>
            </div>
            <div className="hiw-step-visual">
              <IngestionAnimation />
            </div>
          </div>

          {/* Step 3 */}
          <div className="hiw-step reveal-on-scroll">
            <div className="hiw-step-header">
              <span className="hiw-step-num">03</span>
              <h3>You just open and get smarter.</h3>
              <p>A handful of updates in 5 minutes. No duplicates. Just the signal.</p>
            </div>
            <div className="hiw-step-visual">
              <MiniFeed />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
