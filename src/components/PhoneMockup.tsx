'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

/* ─── Screenshots ─── */

interface AppScreen {
  src: string
  label: string
  description: string
}

const APP_SCREENS: AppScreen[] = [
  {
    src: '/relevant-welcome.png',
    label: 'Onboarding',
    description: 'Four questions. Two minutes. Your engine starts learning immediately.',
  },
  {
    src: '/relevant-feed-mobile.png',
    label: 'Your Feed',
    description: 'Five signals. Everything that matters today. Nothing that doesn\'t.',
  },
  {
    src: '/relevant-signal-detail-mobile.png',
    label: 'Signal Detail',
    description: 'What happened, why it matters to you, and what to do about it.',
  },
]

/* ─── Main Component ─── */

export default function PhoneMockup() {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % APP_SCREENS.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section id="the-feed" className="section-block section-tinted">
      <div className="site-frame">
        <div className="section-heading reveal-on-scroll">
          <span className="section-kicker">THE APP</span>
          <h2>This is what it actually looks like.</h2>
          <p>Real screenshots. Real interface. No mockups.</p>
        </div>

        <div className="phone-showcase reveal-on-scroll">
          {/* Screen picker - left side */}
          <div className="phone-picker">
            {APP_SCREENS.map((screen, i) => (
              <button
                key={screen.label}
                type="button"
                className={`phone-picker-item${activeIndex === i ? ' phone-picker-item--active' : ''}`}
                onClick={() => setActiveIndex(i)}
              >
                <span className="phone-picker-number">{String(i + 1).padStart(2, '0')}</span>
                <div className="phone-picker-text">
                  <span className="phone-picker-label">{screen.label}</span>
                  <span className="phone-picker-desc">{screen.description}</span>
                </div>
                {activeIndex === i && (
                  <div className="phone-picker-progress">
                    <div className="phone-picker-progress-bar" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Phone frame - right side */}
          <div className="phone-frame-real">
            {/* Dynamic Island */}
            <div className="phone-island" />

            {/* Screenshot container */}
            <div className="phone-screen-container">
              {APP_SCREENS.map((screen, i) => (
                  <div
                    key={screen.label}
                    className={`phone-screen-slide${activeIndex === i ? ' phone-screen-slide--active' : ''}`}
                  >
                    <Image
                      src={screen.src}
                      alt={screen.label}
                      fill
                      style={{
                        objectFit: 'cover',
                        objectPosition: 'center center',
                      }}
                      priority={i === 0}
                      unoptimized
                    />
                  </div>
              ))}
            </div>

            {/* Home indicator */}
            <div className="phone-home-bar" />
          </div>
        </div>
      </div>
    </section>
  )
}
