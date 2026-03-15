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
    src: '/screenshots/onboarding-context.png',
    label: 'Answer 3 work questions',
    description: 'Tell us your company, industry, and role so Relevant knows what affects your work.',
  },
  {
    src: '/screenshots/feed-main.png',
    label: 'Get alerted when something changes',
    description: 'Important signals show up when something could affect your company, industry, or role.',
  },
  {
    src: '/screenshots/signal-detail.png',
    label: 'Understand the signal fast',
    description: 'Open the alert to see what happened, why it matters, and what it means for you.',
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
    <div className="phone-showcase w-full max-w-5xl mx-auto" style={{ marginTop: '0' }}>
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
                  sizes="375px"
                  style={{
                    objectFit: 'cover',
                    objectPosition: 'top center',
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
  )
}
