'use client'

import { useEffect, useState, useRef } from 'react'

/* ─── Stream items that flow into the funnel ─── */

const STREAM_ITEMS = [
  // Left stream: news
  ['Fed rate decision', 'Trade deal collapse', 'Housing data drops', 'Earnings miss', 'Bank merger news', 'GDP revision'],
  // Center stream: reports
  ['Gartner forecast', 'SEC filing', 'Industry report', 'Patent grant', 'Analyst upgrade', 'Market outlook'],
  // Right stream: updates
  ['Competitor launch', 'Policy change', 'Supply alert', 'Hire announcement', 'Regulation draft', 'Tariff update'],
]

const STREAM_LABELS = ['News & media', 'Reports & filings', 'Market signals']

const OUTPUT_SIGNALS = [
  { color: '#60A5FA', label: 'What changed', text: 'Fed signals rate pause through Q3' },
  { color: '#4ADE80', label: 'Why it matters', text: 'Your expansion runway just extended' },
  { color: '#FBBF24', label: 'What to do', text: 'Lock rates now, hire before Q3 surge' },
]

export default function HeroFunnel() {
  const [activeItems, setActiveItems] = useState([0, 0, 0])
  const [showOutput, setShowOutput] = useState(false)
  const [cycle, setCycle] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Cycle through stream items
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveItems(prev => prev.map((v, i) => (v + 1) % STREAM_ITEMS[i].length) as [number, number, number])
    }, 1200)
    return () => clearInterval(interval)
  }, [])

  // Pulse the output signals
  useEffect(() => {
    const timer = setInterval(() => {
      setShowOutput(false)
      setTimeout(() => {
        setCycle(c => c + 1)
        setShowOutput(true)
      }, 400)
    }, 4500)

    // Show initially after a brief delay
    const initial = setTimeout(() => setShowOutput(true), 800)
    return () => {
      clearInterval(timer)
      clearTimeout(initial)
    }
  }, [])

  return (
    <div className="hero-funnel" ref={containerRef} aria-hidden="true">
      {/* Three input streams */}
      <div className="funnel-streams">
        {STREAM_ITEMS.map((stream, streamIdx) => (
          <div key={streamIdx} className="funnel-stream">
            <span className="funnel-stream-label">{STREAM_LABELS[streamIdx]}</span>
            <div className="funnel-stream-items">
              {stream.map((item, itemIdx) => (
                <span
                  key={item}
                  className={`funnel-stream-item${activeItems[streamIdx] === itemIdx ? ' funnel-stream-item--active' : ''}`}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Funnel convergence point */}
      <div className="funnel-engine">
        <div className="funnel-engine-glow" />
        <div className="funnel-engine-icon">
          {/* Simple filter/funnel icon */}
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M4 6h24l-9 10.5V26l-6-3V16.5L4 6z" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="funnel-engine-label">Relevance engine</span>
      </div>

      {/* Output signals */}
      <div className="funnel-output">
        {OUTPUT_SIGNALS.map((signal, i) => (
          <div
            key={`${signal.label}-${cycle}`}
            className={`funnel-output-card${showOutput ? ' funnel-output-card--visible' : ''}`}
            style={{
              '--signal-color': signal.color,
              '--delay': `${i * 120}ms`,
            } as React.CSSProperties}
          >
            <span className="funnel-output-label">{signal.label}</span>
            <span className="funnel-output-text">{signal.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
