'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { usePublicSignals, PublicSignal } from '@/lib/signals'

type TabKey = 'happened' | 'matters' | 'todo'

const TAB_LABELS: { key: TabKey; label: string }[] = [
  { key: 'happened', label: 'What Happened' },
  { key: 'matters', label: 'Why It Matters' },
  { key: 'todo', label: 'What To Do' },
]

const IMPACT_COLORS: Record<string, string> = {
  COMPETITIVE: '#60A5FA',
  OPPORTUNITY: '#4ADE80',
  RISK: '#FBBF24',
  REGULATORY: '#F87171',
  STRATEGIC: '#A78BFA',
  FINANCIAL: '#60A5FA',
  OPERATIONAL: '#FB923C',
  CAREER: '#EC4899',
  PERSONAL: '#A78BFA',
}

const CYCLE_MS = 7000

export default function InteractiveSignal() {
  const { signals: liveSignals, loading } = usePublicSignals()
  const [activeIndex, setActiveIndex] = useState(0)
  const [activeTab, setActiveTab] = useState<TabKey>('matters')
  const [fading, setFading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pausedRef = useRef(false)
  const touchStartRef = useRef<number | null>(null)
  const touchDeltaRef = useRef<number>(0)

  const signals = liveSignals.length > 0 ? liveSignals : []
  const signalCount = signals.length

  const goTo = useCallback(
    (index: number) => {
      if (index === activeIndex || signalCount === 0) return
      setFading(true)
      setTimeout(() => {
        setActiveIndex(index)
        setActiveTab('matters')
        setFading(false)
      }, 200)
    },
    [activeIndex, signalCount],
  )

  const advance = useCallback(() => {
    if (pausedRef.current || signalCount === 0) return
    goTo((activeIndex + 1) % signalCount)
  }, [activeIndex, goTo, signalCount])

  useEffect(() => {
    timerRef.current = setInterval(advance, CYCLE_MS)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [advance])

  const handleMouseEnter = () => { pausedRef.current = true }
  const handleMouseLeave = () => { pausedRef.current = false }

  const handleDot = (i: number) => {
    goTo(i)
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(advance, CYCLE_MS)
  }

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX
    touchDeltaRef.current = 0
    pausedRef.current = true
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return
    touchDeltaRef.current = e.touches[0].clientX - touchStartRef.current
  }

  const handleTouchEnd = () => {
    const SWIPE_THRESHOLD = 50
    if (signalCount > 0 && Math.abs(touchDeltaRef.current) > SWIPE_THRESHOLD) {
      if (touchDeltaRef.current < 0) {
        // Swipe left → next
        const next = (activeIndex + 1) % signalCount
        goTo(next)
      } else {
        // Swipe right → previous
        const prev = (activeIndex - 1 + signalCount) % signalCount
        goTo(prev)
      }
      // Reset timer after swipe
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = setInterval(advance, CYCLE_MS)
    }
    touchStartRef.current = null
    touchDeltaRef.current = 0
    pausedRef.current = false
  }

  if (loading || signalCount === 0) {
    return (
      <div className="signal-wrapper reveal-on-scroll">
        <div className="signal-card signal-card--loading">
          <div className="signal-card-inner">
            <div className="signal-loading-pulse" />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
              Loading live signals…
            </p>
          </div>
        </div>
      </div>
    )
  }

  const signal = signals[activeIndex]
  const color = IMPACT_COLORS[signal.impact_type] || '#60A5FA'

  const getTabContent = (sig: PublicSignal, tab: TabKey): string[] => {
    switch (tab) {
      case 'happened': return sig.what_happened
      case 'matters': return sig.why_it_matters
      case 'todo': return sig.what_to_do
    }
  }

  return (
    <div className="signal-wrapper reveal-on-scroll">
      <div
        className={`signal-card${fading ? ' signal-card--fading' : ''}`}
        style={{ '--signal-color': color, touchAction: 'pan-y' } as React.CSSProperties}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="signal-card-inner">
          {/* Hero image */}
          {signal.image_url && (
            <div className="signal-image">
              <Image src={signal.image_url} alt="" fill style={{ objectFit: 'cover' }} unoptimized />
              <div className="signal-image-gradient" />
            </div>
          )}

          {/* Top row: impact type + sources */}
          <div className="signal-top">
            <span className="signal-category">
              <span className="signal-dot" />
              {signal.impact_type}
            </span>
            <div className="signal-badges">
              <span className="signal-badge">{signal.sources.length} source{signal.sources.length !== 1 ? 's' : ''}</span>
              <span className="signal-badge">{signal.signal_date}</span>
            </div>
          </div>

          {/* Headline */}
          <h3 className="signal-headline">{signal.headline}</h3>

          {/* Synthesis */}
          {signal.synthesis && (
            <p className="signal-synthesis">{signal.synthesis}</p>
          )}

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
            {getTabContent(signal, activeTab).map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>

          {/* Source attribution */}
          <div className="signal-sources-row">
            {signal.sources.slice(0, 4).map((src) => (
              <span key={src.label} className="signal-source-pill">{src.label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Dots */}
      <div className="signal-dots">
        {signals.map((_, i) => (
          <button
            key={i}
            className={`signal-dot-btn${i === activeIndex ? ' signal-dot-btn--active' : ''}`}
            onClick={() => handleDot(i)}
            type="button"
            aria-label={`Signal ${i + 1}`}
          />
        ))}
      </div>

      {/* Live indicator */}
      <div className="signal-live-indicator">
        <span className="signal-live-dot" />
        <span>Live signals — swipe or tap dots to browse</span>
      </div>
    </div>
  )
}
