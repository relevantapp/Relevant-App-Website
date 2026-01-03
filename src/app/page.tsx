'use client'

import { useState, FormEvent, useEffect } from 'react'
import Image from 'next/image'
import WhyRelevant from '@/components/WhyRelevant'
import {
  heroContent,
  problemContent,
  whatIsContent,
  howItWorksContent,
  featuresContent,
  whoItsForContent,
  waitlistContent,
  pricingContent,
  navLinks,
  footerLinks,
} from '@/config/content'

export default function Home() {
  const [email, setEmail] = useState('')
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [waitlistMessage, setWaitlistMessage] = useState('')
  const [showStickyCTA, setShowStickyCTA] = useState(false)

  // Feed cards with more interesting, actionable content
  const feedCards = [
    {
      category: 'MONEY',
      headline: 'Apple just bought your favorite app',
      summary: 'Pixelmator acquired for $50M. Expect subscription pricing by Q2.',
      whyMatters: 'Export your files now. Pricing always changes post-acquisition.',
    },
    {
      category: 'CAREER',
      headline: '84% of hiring managers now check LinkedIn activity',
      summary: 'New survey shows passive candidates get 3x more recruiter outreach.',
      whyMatters: 'Post once this week. Even a comment counts as activity.',
    },
    {
      category: 'AI',
      headline: 'GPT-5 launches Tuesday with real-time web access',
      summary: 'No more knowledge cutoffs. Browses live data. API pricing unchanged.',
      whyMatters: 'Your competitors will use this in 48 hours. Get access first.',
    },
    {
      category: 'LOCAL',
      headline: 'Your commute doubles starting Monday',
      summary: 'Highway 101 construction begins. 6-month project, no detours.',
      whyMatters: 'Leave 45 min early or work remote Mon/Wed. Plan this weekend.',
    },
    {
      category: 'FINANCE',
      headline: 'RRSP deadline is in 9 days',
      summary: 'March 3rd cutoff for 2025 tax year. Most banks need 3 days to process.',
      whyMatters: 'You have until Friday to transfer. Missing it costs ~$2,400 in taxes.',
    },
    {
      category: 'SKILLS',
      headline: 'SQL is now required for product roles',
      summary: '67% of PM job postings mention SQL. Up from 23% last year.',
      whyMatters: 'Free 4-hour course on Mode Analytics. Add to LinkedIn after.',
    },
  ]

  useEffect(() => {
    const handleScroll = () => {
      if (waitlistStatus === 'success') {
        setShowStickyCTA(false)
        return
      }
      setShowStickyCTA(window.scrollY > 600)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [waitlistStatus])

  const handleWaitlist = async (e: FormEvent) => {
    e.preventDefault()
    setWaitlistStatus('loading')
    setWaitlistMessage('')

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setWaitlistStatus('success')
        setWaitlistMessage(data.message || "You're on the list!")
        setEmail('')
      } else {
        throw new Error(data.error || 'Failed to join waitlist')
      }
    } catch (error) {
      setWaitlistStatus('error')
      setWaitlistMessage(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  const currentYear = new Date().getFullYear()

  return (
    <>
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-inner">
          <a href="#" className="nav-logo">
            <Image src="/logo-black.svg" alt="Relevant" width={32} height={32} style={{ display: 'block' }} />
          </a>
          <div className="nav-links">
            {navLinks.slice(1).map((link) => (
              <a key={link.href} href={link.href} className="nav-link">
                {link.label}
              </a>
            ))}
            <a
              href="https://www.instagram.com/relevant.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link"
              aria-label="Instagram"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
          </div>
        </div>
      </nav>

      <main>
        {/* 1. HERO SECTION */}
        <section className="hero">
          <div className="container">
            <h1>{heroContent.headline}</h1>
            <p className="hero-subheadline">{heroContent.subheadline}</p>
            <div className="hero-cta-wrapper">
              <a href="#waitlist" className="btn btn-primary btn-large">
                {heroContent.cta}
              </a>
              <p className="hero-microcopy">{heroContent.microcopy}</p>
            </div>
          </div>
        </section>

        {/* 2. PROBLEM SECTION */}
        <section className="section section-problem">
          <div className="container container-narrow">
            <h2 className="section-title">{problemContent.title}</h2>
            <ul className="problem-list">
              {problemContent.bullets.map((bullet, i) => (
                <li key={i}>{bullet}</li>
              ))}
            </ul>
            <p className="problem-closing">{problemContent.closing}</p>
          </div>
        </section>

        {/* 3. WHAT IS RELEVANT */}
        <section className="section section-what">
          <div className="container container-narrow">
            <h2 className="section-title">{whatIsContent.title}</h2>
            <div className="what-intro">
              {whatIsContent.intro.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
            <p className="what-focus-label">We help you focus on:</p>
            <ul className="what-focus-list">
              {whatIsContent.focusPoints.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
            <p className="what-closing">{whatIsContent.closing}</p>
          </div>
        </section>

        {/* WHY WE BUILT RELEVANT */}
        <WhyRelevant />

        {/* DAILY BRIEF PREVIEW - Phone Mockup */}
        <section className="section section-dark">
          <div className="container">
            <div className="section-header">
              <p className="section-label">DAILY BRIEF</p>
              <h2 className="section-title">Your 2-minute morning edge</h2>
              <p className="section-subtitle">What changed. What to do. Why it matters.</p>
            </div>

            {/* App Screenshot */}
            <div className="screenshot-showcase">
              <div className="phone-frame">
                <div className="phone-notch"></div>
                <div className="phone-screen-image">
                  <Image 
                    src="/app-screenshot.png"
                    alt="Relevant App Daily Brief"
                    fill
                    style={{ objectFit: 'cover' }}
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. HOW IT WORKS */}
        <section id="how-it-works" className="section">
          <div className="container">
            <h2 className="section-title">{howItWorksContent.title}</h2>
            <div className="steps-grid">
              {howItWorksContent.steps.map((step) => (
                <div key={step.number} className="step-card">
                  <div className="step-number">{step.number}</div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEED PREVIEW - Card Screens */}
        <section className="section section-dark">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Your feed, personalized</h2>
              <p className="section-subtitle">Every card has a &quot;why it matters&quot; — so you know what to do next.</p>
            </div>

            {/* Scrollable Phone Cards */}
            <div className="cards-showcase">
              <p className="scroll-hint">
                <span>�</span> Swipe to explore
              </p>
              <div className="cards-scroll">
                {feedCards.map((card, i) => (
                  <div key={i} className="card-phone">
                    <div className="card-phone-notch"></div>
                    <div className="card-phone-screen">
                      <span className="card-category">{card.category}</span>
                      <h3 className="card-headline">{card.headline}</h3>
                      <p className="card-summary">{card.summary}</p>
                      <div className="card-why">
                        <span className="card-why-label">WHY IT MATTERS</span>
                        <p>{card.whyMatters}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 5. FEATURES */}
        <section id="features" className="section">
          <div className="container">
            <h2 className="section-title">{featuresContent.title}</h2>
            <div className="features-grid">
              {featuresContent.features.map((feature) => (
                <div key={feature.title} className="feature-card">
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. WHO IT'S FOR */}
        <section className="section section-audience">
          <div className="container container-narrow">
            <h2 className="section-title">{whoItsForContent.title}</h2>
            <div className="audience-chips">
              {whoItsForContent.audiences.map((audience) => (
                <span key={audience} className="audience-chip">{audience}</span>
              ))}
            </div>
          </div>
        </section>

        {/* 7. WAITLIST SECTION */}
        <section id="waitlist" className="section section-waitlist">
          <div className="container container-narrow">
            <h2 className="section-title">{waitlistContent.title}</h2>
            <p className="waitlist-subtext">{waitlistContent.subtext}</p>
            <form onSubmit={handleWaitlist} className="waitlist-form">
              <div className="input-group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="input"
                  disabled={waitlistStatus === 'loading'}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={waitlistStatus === 'loading'}
                >
                  {waitlistStatus === 'loading' ? 'Joining...' : waitlistContent.cta}
                </button>
              </div>
              {waitlistMessage && (
                <p className={`message ${waitlistStatus === 'success' ? 'message-success' : 'message-error'}`}>
                  {waitlistMessage}
                </p>
              )}
              {!waitlistMessage && (
                <p className="waitlist-microcopy">{waitlistContent.microcopy}</p>
              )}
            </form>
          </div>
        </section>

        {/* 8. PRICING SECTION */}
        <section id="pricing" className="section section-pricing">
          <div className="container container-narrow">
            <p className="pricing-disclaimer">{pricingContent.disclaimer}</p>
            <h2 className="section-title">{pricingContent.title}</h2>
            <div className="pricing-details">
              <p className="pricing-trial">{pricingContent.trial}</p>
              <p className="pricing-price">{pricingContent.price}</p>
              <p className="pricing-value">{pricingContent.value}</p>
            </div>
          </div>
        </section>

        {/* 9. FOOTER */}
        <footer className="footer">
          <div className="container">
            <div className="footer-inner">
              <p className="footer-copyright">© {currentYear} Relevant</p>
              <div className="footer-links">
                {footerLinks.map((link) => (
                  <a key={link.label} href={link.href} className="footer-link">
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </footer>

        {/* Sticky Mobile CTA */}
        <div className={`sticky-cta ${showStickyCTA ? 'visible' : ''} ${waitlistStatus === 'success' ? 'hidden' : ''}`}>
          <a
            href="#waitlist"
            className="btn btn-primary"
            style={{ width: '100%', display: 'block', textAlign: 'center', padding: '16px' }}
            onClick={() => setShowStickyCTA(false)}
          >
            Join Waitlist
          </a>
        </div>
      </main>
    </>
  )
}
