'use client'

import { FormEvent, useEffect, useState } from 'react'
import BrandMark from '@/components/BrandMark'
import InteractiveSignalLive from '@/components/InteractiveSignalLive'
import HeroFunnel from '@/components/HeroFunnel'
import HowItWorks from '@/components/HowItWorks'
import FeatureBento from '@/components/FeatureBento'
import PhoneMockup from '@/components/PhoneMockup'
import WhoItsFor from '@/components/WhoItsFor'

export default function Home() {
  const [email, setEmail] = useState('')
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [waitlistMessage, setWaitlistMessage] = useState('')
  const currentYear = new Date().getFullYear()

  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    const stored = localStorage.getItem('relevant-site-theme')
    const resolved = stored === 'light' || stored === 'dark'
      ? stored
      : window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
    setTheme(resolved)
    document.documentElement.dataset.theme = resolved
    document.documentElement.style.colorScheme = resolved
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('revealed')
        })
      },
      { threshold: 0.08, rootMargin: '-20px' }
    )
    document.querySelectorAll('.reveal-on-scroll').forEach((el) => observer.observe(el))
    // Also observe stagger containers to trigger child reveals
    document.querySelectorAll('.reveal-stagger').forEach((container) => {
      const staggerObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              container.querySelectorAll('.reveal-on-scroll').forEach((child) => {
                child.classList.add('revealed')
              })
            }
          })
        },
        { threshold: 0.1 }
      )
      staggerObserver.observe(container)
    })
    return () => observer.disconnect()
  }, [])

  const handleWaitlist = async (event: FormEvent) => {
    event.preventDefault()
    setWaitlistStatus('loading')
    setWaitlistMessage('')
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to join waitlist')
      setWaitlistStatus('success')
      setWaitlistMessage(data.message || "You're on the list.")
      setEmail('')
    } catch (error) {
      setWaitlistStatus('error')
      setWaitlistMessage(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  return (
    <>
      {/* NAV */}
      <nav className="site-nav">
        <div className="site-frame site-nav-inner">
          <BrandMark href="#top" />
          <div className="site-nav-right">
            <div className="nav-social-links">
              <a href="https://www.instagram.com/relevant.app/" target="_blank" rel="noopener noreferrer" className="nav-social-link" aria-label="Instagram">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
              <a href="https://www.tiktok.com/@relevant.app" target="_blank" rel="noopener noreferrer" className="nav-social-link" aria-label="TikTok">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V9.07a8.16 8.16 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.5z"/></svg>
              </a>
            </div>
            <div className="site-nav-links">
              <a href="#signal">Signal</a>
              <a href="#how-it-works">How it works</a>
              <a href="#pricing">Pricing</a>
            </div>
            <button
              className="theme-toggle"
              aria-label="Toggle theme"
              onClick={() => {
                const next = theme === 'dark' ? 'light' : 'dark'
                setTheme(next)
                document.documentElement.dataset.theme = next
                document.documentElement.style.colorScheme = next
                localStorage.setItem('relevant-site-theme', next)
              }}
            >
              {theme === 'dark' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>
            <a href="#access" className="nav-button">Join waitlist</a>
          </div>
        </div>
      </nav>

      <main id="top">
        {/* HERO */}
        <section className="hero-section">
          <div className="site-frame hero-split">
            <div className="hero-left">
              <span className="hero-badge">YOUR PERSONAL RELEVANCE ENGINE</span>
              <h1 className="hero-title">
                Know what{' '}matters.{'\n'}Skip what{' '}doesn&rsquo;t.
              </h1>
              <p className="hero-sub">
                Relevant scans thousands of articles every day and shows you only what affects your work, your goals, and your next move — explained in plain language.
              </p>
              <div className="hero-actions">
                <a href="#access" className="btn-primary btn-pill">Get early access</a>
                <a href="#how-it-works" className="btn-secondary btn-pill">See how it works</a>
              </div>
              <div className="hero-cards">
                <div className="hero-info-card">
                  <span className="hero-info-kicker">SETUP</span>
                  <p className="hero-info-text">4 questions, 2 minutes</p>
                </div>
                <div className="hero-info-card">
                  <span className="hero-info-kicker">YOUR FEED</span>
                  <p className="hero-info-text">Daily signals, not a firehose</p>
                </div>
                <div className="hero-info-card">
                  <span className="hero-info-kicker">EVERY SIGNAL</span>
                  <p className="hero-info-text">What happened, why, what to do</p>
                </div>
              </div>
            </div>
            <div className="hero-right">
              <HeroFunnel />
            </div>
          </div>
        </section>

        {/* SIGNAL — live demo */}
        <section id="signal" className="section-block">
          <div className="site-frame">
            <div className="section-heading reveal-on-scroll">
              <span className="section-kicker">REAL SIGNALS</span>
              <h2>Not a headline. A signal.</h2>
              <p>Every signal tells you what happened, why it matters to you, and what to do about it. These are real.</p>
            </div>
            <InteractiveSignalLive />
          </div>
        </section>

        {/* HOW IT WORKS — interactive 3-step */}
        <HowItWorks />

        {/* FEATURE BENTO GRID */}
        <FeatureBento />

        {/* THE FEED — Phone Mockup */}
        <PhoneMockup />

        {/* WHO IT'S FOR — Persona Grid */}
        <WhoItsFor />

        {/* PRICING */}
        <section id="pricing" className="section-block">
          <div className="site-frame">
            <div className="section-heading reveal-on-scroll">
              <span className="section-kicker">PRICING</span>
              <h2>One plan. No tiers. No surprises.</h2>
            </div>
            <div className="pricing-center reveal-on-scroll">
              <div className="pricing-card pricing-card--glow">
                <div className="pricing-glow" aria-hidden="true" />
                <div className="pricing-amount">
                  <strong>$4.99</strong>
                  <span>/ month</span>
                </div>
                <p className="pricing-details">Free 7-day trial &middot; Cancel anytime &middot; No credit card to start</p>
                <p className="pricing-value">Less than a coffee a month. More useful than the 30 tabs you opened this morning.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ACCESS */}
        <section id="access" className="section-block section-cta">
          <div className="site-frame access-shell">
            <div className="access-copy reveal-on-scroll">
              <span className="section-kicker">EARLY ACCESS</span>
              <h2>Stop reading everything.<br />Start knowing what matters.</h2>
              <p>Relevant is in early access. Drop your email and we&rsquo;ll send your invite.</p>
            </div>
            <form onSubmit={handleWaitlist} className="waitlist-card reveal-on-scroll">
              <span className="waitlist-label">Request access</span>
              <label className="sr-only" htmlFor="waitlist-email">Email</label>
              <div className="waitlist-row">
                <input
                  id="waitlist-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  disabled={waitlistStatus === 'loading'}
                  className="waitlist-input"
                />
                <button type="submit" className="btn-primary waitlist-submit" disabled={waitlistStatus === 'loading'}>
                  {waitlistStatus === 'loading' ? 'Joining...' : 'Get early access'}
                </button>
              </div>
              {waitlistMessage ? (
                <p className={`waitlist-msg ${waitlistStatus === 'success' ? 'msg-success' : 'msg-error'}`}>{waitlistMessage}</p>
              ) : (
                <p className="waitlist-hint">No spam. Just your invite when it&rsquo;s ready.</p>
              )}
            </form>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="site-frame footer-inner">
          <div className="footer-brand">
            <BrandMark />
            <span>Know what matters. Skip what doesn&rsquo;t.</span>
          </div>
          <div className="footer-social">
            <a href="https://www.instagram.com/relevant.app/" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="Instagram">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
            <a href="https://www.tiktok.com/@relevant.app" target="_blank" rel="noopener noreferrer" className="footer-social-link" aria-label="TikTok">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V9.07a8.16 8.16 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.5z"/></svg>
            </a>
          </div>
          <div className="footer-links">
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="mailto:support@getrelevantapp.com">Contact</a>
          </div>
          <p className="footer-copy">&copy; {currentYear} Relevant</p>
        </div>
      </footer>
    </>
  )
}
