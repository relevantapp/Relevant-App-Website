'use client'

import { useEffect, useState } from 'react'

const headlines = [
  { text: 'Markets Rally on Fed Signal', source: 'Reuters' },
  { text: 'Tech Giants Report Mixed Earnings', source: 'Journal' },
  { text: 'Supply Chain Disruption Deepens', source: 'FT' },
  { text: 'Central Bank Holds Rates Steady', source: 'Bloomberg' },
  { text: 'AI Startup Raises $2B', source: 'Tech Daily' },
  { text: 'Healthcare Reform Bill Advances', source: 'Times' },
  { text: 'Oil Prices Surge on OPEC News', source: 'Reuters' },
  { text: 'Retail Sales Beat Expectations', source: 'WSJ' },
  { text: 'Crypto Market Sees Sharp Reversal', source: 'Bloomberg' },
  { text: 'Trade Tensions Escalate Between Allies', source: 'FT' },
  { text: 'Climate Summit Yields New Pledges', source: 'CBC' },
  { text: 'Housing Market Shows Mixed Signals', source: 'Journal' },
  { text: 'Semiconductor Shortage Enters Third Year', source: 'Tech Daily' },
  { text: 'Consumer Confidence Index Falls', source: 'WSJ' },
]

const signals = [
  {
    color: '#60A5FA',
    sources: '3 sources',
    headline: 'Fed signals rate pause through Q3',
    matter: 'Your expansion timeline just got more room',
  },
  {
    color: '#4ADE80',
    sources: '5 sources',
    headline: 'Enterprise AI spending up 40% YoY',
    matter: 'Your sector is accelerating — competitors are moving',
  },
  {
    color: '#FBBF24',
    sources: '2 sources',
    headline: 'Supply chain bill clears committee',
    matter: 'Regulatory risk for Q2 procurement strategy',
  },
]

type Phase = 'noise' | 'converge' | 'signal'

const PHASE_DURATIONS: Record<Phase, number> = {
  noise: 3500,
  converge: 2000,
  signal: 3000,
}

export default function NoiseToSignal() {
  const [phase, setPhase] = useState<Phase>('noise')

  useEffect(() => {
    const duration = PHASE_DURATIONS[phase]
    const timer = setTimeout(() => {
      if (phase === 'noise') setPhase('converge')
      else if (phase === 'converge') setPhase('signal')
      else setPhase('noise')
    }, duration)
    return () => clearTimeout(timer)
  }, [phase])

  return (
    <div className="noise-to-signal" aria-hidden="true">
      <div className="nts-glow" />

      {/* Phase A: Chaotic headlines */}
      <div className={`nts-headlines ${phase === 'noise' ? 'nts-headlines--active' : ''} ${phase === 'converge' ? 'nts-headlines--converge' : ''}`}>
        {headlines.map((h, i) => (
          <div
            key={i}
            className={`nts-headline nts-headline--${i % 5}`}
            style={{ animationDelay: `${i * 0.18}s` }}
          >
            <span className="nts-headline-text">{h.text}</span>
            <span className="nts-headline-source">{h.source}</span>
          </div>
        ))}
      </div>

      {/* Phase C: Signal cards */}
      <div className={`nts-signals ${phase === 'signal' ? 'nts-signals--active' : ''}`}>
        {signals.map((s, i) => (
          <div
            key={i}
            className="nts-signal-card"
            style={{
              borderLeftColor: s.color,
              transitionDelay: `${i * 0.15}s`,
            }}
          >
            <span className="nts-signal-sources">{s.sources}</span>
            <p className="nts-signal-headline">{s.headline}</p>
            <p className="nts-signal-matter">{s.matter}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
