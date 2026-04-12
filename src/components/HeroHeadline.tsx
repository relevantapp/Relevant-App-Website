'use client'

import { useEffect, useRef, useState } from 'react'

const PHRASES = [
  "You shouldn't need",
  'to read the news',
  'just to stay sharp',
  'at work.',
]

export default function HeroHeadline() {
  const ref = useRef<HTMLHeadingElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <h1 ref={ref} className="hero-title hero-title--animated">
      {PHRASES.map((phrase, i) => (
        <span
          key={i}
          className={`hero-phrase${visible ? ' hero-phrase--visible' : ''}`}
          style={{ transitionDelay: `${i * 140}ms` }}
        >
          {phrase}{' '}
        </span>
      ))}
    </h1>
  )
}
