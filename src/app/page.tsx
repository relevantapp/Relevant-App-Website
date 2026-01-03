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
