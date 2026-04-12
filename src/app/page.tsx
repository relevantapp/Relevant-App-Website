'use client'

import { FormEvent, useEffect, useState } from 'react'
import BrandMark from '@/components/BrandMark'
import FeatureBento from '@/components/FeatureBento'
import HeroHeadline from '@/components/HeroHeadline'
import PhoneMockup from '@/components/PhoneMockup'
import InteractiveSignal from '@/components/InteractiveSignal'
import HowItWorks from '@/components/HowItWorks'
import WhoItsFor from '@/components/WhoItsFor'

export default function Home() {
  const [email, setEmail] = useState('')
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [waitlistMessage, setWaitlistMessage] = useState('')
  const [showMobileCta, setShowMobileCta] = useState(false)
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

  useEffect(() => {
    const syncMobileCta = () => {
      if (window.innerWidth > 880) {
        setShowMobileCta(false)
        return
      }

      const accessSection = document.getElementById('access')
      const accessTop = accessSection?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY
      const threshold = Math.min(window.innerHeight * 0.7, 560)

      setShowMobileCta(window.scrollY > threshold && accessTop > window.innerHeight - 120)
    }

    syncMobileCta()
    window.addEventListener('scroll', syncMobileCta, { passive: true })
    window.addEventListener('resize', syncMobileCta)

    return () => {
      window.removeEventListener('scroll', syncMobileCta)
      window.removeEventListener('resize', syncMobileCta)
    }
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
              <a href="#signal">What you get</a>
              <a href="#how">How it works</a>
              <a href="#features">Inside the app</a>
              <a href="#who">Who it&apos;s for</a>
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
            <a href="/login" className="nav-button" style={{ background: 'transparent', border: '1px solid var(--border-strong)', color: 'var(--text)' }}>Sign in</a>
          </div>
        </div>
      </nav>

      <main id="top">
        {/* §1 — HERO: THE PROBLEM */}
        <section className="hero-section">
          <div className="site-frame hero-centered">
            <span className="hero-badge">YOU ALREADY KNOW THIS</span>
            <HeroHeadline />
            <p className="hero-sub">
              Hundreds of articles. Hours of scrolling. Almost zero insight.
            </p>
            <div className="hero-actions">
              <a href="#access" className="btn-primary btn-pill">Get early access</a>
              <a href="#signal" className="btn-secondary btn-pill">See how it works</a>
            </div>
            <p className="hero-pricing">7-day free trial · $4.99/month · Cancel anytime</p>

            {/* Mobile inline waitlist — visible only on small screens */}
            <form onSubmit={handleWaitlist} className="hero-mobile-waitlist">
              <label className="sr-only" htmlFor="waitlist-email-mobile">Email</label>
              <div className="hero-mobile-waitlist-row">
                <input
                  id="waitlist-email-mobile"
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
                <p className="waitlist-hint" style={{ textAlign: 'center' }}>No spam. Just your invite when it&apos;s ready.</p>
              )}
            </form>
            <div className="hero-cards reveal-stagger">
              <div className="hero-info-card reveal-on-scroll">
                <span className="hero-info-kicker">WITHOUT RELEVANT</span>
                <span className="hero-info-text">Tabs, newsletters, random posts, and still the feeling you missed something important.</span>
              </div>
              <div className="hero-info-card reveal-on-scroll">
                <span className="hero-info-kicker">WHAT RELEVANT DOES</span>
                <span className="hero-info-text">AI reads thousands of articles and filters them for your company, industry, and role.</span>
              </div>
              <div className="hero-info-card reveal-on-scroll">
                <span className="hero-info-kicker">WHAT YOU GET</span>
                <span className="hero-info-text">A clear signal when something important could affect you — with what happened, why it matters, and what to do.</span>
              </div>
            </div>
          </div>
        </section>

        {/* §2 — THE ANSWER: Interactive Signal Card */}
        <section id="signal" className="section-block">
          <div className="site-frame">
            <div className="section-heading reveal-on-scroll">
              <span className="section-kicker">WHAT YOU GET</span>
              <h2>Not a headline. A signal.</h2>
              <p>Every signal answers three questions. That&apos;s it.</p>
            </div>
            <InteractiveSignal />
          </div>
        </section>

        {/* §3 — HOW IT WORKS */}
        <section id="how" className="section-block section-tinted">
          <div className="site-frame">
            <div className="section-heading reveal-on-scroll">
              <span className="section-kicker">HOW IT WORKS</span>
              <h2>Three steps. That&apos;s the whole product.</h2>
            </div>
            <HowItWorks />
          </div>
        </section>

        {/* §4 — INSIDE THE APP: Feature Bento Grid */}
        <FeatureBento />

        {/* §5 — SEE THE FEED: Phone Mockup */}
        <section id="feed" className="section-block">
          <div className="site-frame">
            <div className="section-heading reveal-on-scroll">
              <span className="section-kicker">THE FEED</span>
              <h2>This is what it looks like.</h2>
              <p>Real signals. Scroll through them. Tap any card.</p>
            </div>
            <div className="hero-centered-visual">
              <PhoneMockup />
            </div>
          </div>
        </section>

        {/* §6 — WHO IT'S FOR */}
        <section id="who" className="section-block section-tinted">
          <div className="site-frame">
            <div className="section-heading reveal-on-scroll">
              <span className="section-kicker">WHO IT&apos;S FOR</span>
              <h2>If information affects your decisions, this is for you.</h2>
            </div>
            <WhoItsFor />
          </div>
        </section>

        {/* §7 — GET ACCESS */}
        <section id="access" className="section-block section-cta border-t border-[var(--border)] bg-[var(--bg-elevated)]">
          <div className="site-frame access-shell">
            <div className="access-copy reveal-on-scroll">
              <span className="section-kicker">EARLY ACCESS</span>
              <h2>Information you should read. Not information you could read.</h2>
              <p>Relevant is in early access. Join the waitlist.</p>
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
                <p className="waitlist-hint">No spam. Just your invite when it&apos;s ready.</p>
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
            <span>The information you should read.</span>
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

      {/* Sticky mobile CTA bar */}
      <div className={`mobile-sticky-cta${showMobileCta ? ' is-visible' : ''}`}>
        <a href="#access" className="mobile-sticky-cta-btn">Get early access</a>
      </div>
    </>
  )
}
