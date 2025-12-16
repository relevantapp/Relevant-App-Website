'use client'

import { useState, FormEvent } from 'react'

export default function Home() {
  const [email, setEmail] = useState('')
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [waitlistMessage, setWaitlistMessage] = useState('')

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

  const feedCards = [
    {
      category: 'NEWS',
      headline: 'Major shift in federal housing policy',
      summary: 'Government announces new affordability measures targeting first-time buyers. Implementation timeline unclear.',
      whyMatters: 'If you\'re under 35, this could affect your mortgage approval process by spring.'
    },
    {
      category: 'LOCAL',
      headline: 'Toronto Film Festival announces surprise opener',
      summary: 'World premiere confirmed for September. Director attached, cast TBA.',
      whyMatters: 'Downtown streets close Sept 7–10. Plan your commute now.'
    },
    {
      category: 'AI TOOL',
      headline: 'Claude 4 now writes production code',
      summary: 'Anthropic releases model with autonomous debugging. Early access rolling out.',
      whyMatters: 'Could cut dev time 30%. Beta waitlist open until Friday.'
    },
    {
      category: 'LEARN',
      headline: 'Word of the day: Zeitgeist',
      summary: 'The defining spirit or mood of a particular period, especially as shown in ideas and beliefs.',
      whyMatters: 'Shows up in business writing 3x more than casual conversation.'
    },
    {
      category: 'EVENTS',
      headline: 'Free startup meetup at MaRS this Thursday',
      summary: '6pm, networking + panel on product-market fit. RSVP required.',
      whyMatters: 'Last event had 3 hiring founders. Bring business cards.'
    },
    {
      category: 'GOALS',
      headline: 'You\'re 2 days from your weekly streak',
      summary: 'Current: 5 days reading. Target: 7 days. Almost there.',
      whyMatters: 'Hit 7 and unlock your first badge. Keep going.'
    }
  ]

  const features = [
    { title: 'News summaries', desc: 'No fluff. Just what happened and who said what.', icon: '📰' },
    { title: 'Why it matters', desc: 'Every story explains its relevance to your life and work.', icon: '💡' },
    { title: 'Local context', desc: 'Events, transit updates, and what\'s happening in your city.', icon: '📍' },
    { title: 'Learn daily', desc: 'One word. One insight. Build knowledge without trying.', icon: '📚' },
    { title: 'AI tools', desc: 'New tools that actually matter, explained in plain language.', icon: '🤖' },
    { title: 'Goal tracking', desc: 'Streaks and progress. Stay consistent without pressure.', icon: '🎯' }
  ]

  return (
    <>
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-logo">
            <img src="/logo.svg" alt="Relevant" style={{ width: '40px', height: '40px', display: 'block' }} />
          </div>
          <div className="nav-links">
            <a href="#pricing" className="nav-link">Pricing</a>
            <a href="#waitlist" className="nav-link">Waitlist</a>
            <a 
              href="https://www.instagram.com/relevant.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="nav-link"
            >
              Instagram
            </a>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="hero">
          <div className="container">
            <h1>Stay Relevant</h1>
            <div style={{ maxWidth: '680px', margin: '0 auto' }}>
              <p className="hero-tagline" style={{ marginBottom: '12px' }}>
                Too much news. Not enough time.
              </p>
              <p className="hero-tagline" style={{ marginBottom: '12px' }}>
                You feel guilty skipping articles. You feel behind.
              </p>
              <p className="hero-tagline" style={{ marginBottom: '32px', opacity: 1, fontWeight: 500 }}>
                We built a feed that respects your time and keeps you sharp.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', marginTop: '40px' }}>
                <a href="#waitlist" className="btn btn-primary" style={{ fontSize: '18px', padding: '18px 48px' }}>
                  Get Early Access
                </a>
                <p style={{ fontSize: '14px', opacity: 0.6, letterSpacing: '-0.01em' }}>
                  Free 7-day trial at launch • $4.99/month after
                </p>
                <p style={{ fontSize: '13px', opacity: 0.5, marginTop: '8px' }}>
                  5 minutes a day. That's it.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* The Feed Preview */}
        <section className="section" style={{ paddingTop: '120px', paddingBottom: '120px' }}>
          <div className="container">
            <h2 className="section-title" style={{ marginBottom: '80px' }}>The Feed</h2>
            
            {/* Phone Mockup */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '80px' }}>
              <div className="phone-mockup">
                <div className="phone-notch"></div>
                <div className="phone-screen">
                  <div className="phone-statusbar">
                    <span style={{ fontSize: '12px', fontWeight: 500 }}>9:41</span>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <div style={{ width: '16px', height: '10px', border: '1px solid #fff', borderRadius: '2px', opacity: 0.8 }}></div>
                    </div>
                  </div>
                  <div className="phone-header">Relevant</div>
                  <div className="phone-content">
                    {feedCards.slice(0, 3).map((card, i) => (
                      <div key={i} className="phone-card">
                        <div style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.05em', opacity: 0.5, marginBottom: '6px' }}>{card.category}</div>
                        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', lineHeight: 1.3 }}>{card.headline}</div>
                        <div style={{ fontSize: '11px', opacity: 0.6, marginBottom: '8px', lineHeight: 1.4 }}>{card.summary}</div>
                        <div style={{ paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                          <div style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.08em', opacity: 0.4, marginBottom: '4px' }}>WHY IT MATTERS</div>
                          <div style={{ fontSize: '11px', fontWeight: 500, lineHeight: 1.4 }}>{card.whyMatters}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Feed Cards Grid */}
            <div className="feed-grid">
              {feedCards.map((card, i) => (
                <div key={i} className="feed-card">
                  <div className="feed-category">{card.category}</div>
                  <h3 className="feed-headline">{card.headline}</h3>
                  <p className="feed-summary">{card.summary}</p>
                  <div className="feed-why-matters">
                    <div className="feed-why-label">WHY IT MATTERS</div>
                    <p className="feed-why-text">{card.whyMatters}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What You Get */}
        <section className="section">
          <div className="container">
            <h2 className="section-title">What You Get</h2>
            <div className="features-grid">
              {features.map((feature, i) => (
                <div key={i} className="feature-card">
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>{feature.icon}</div>
                  <h3>{feature.title}</h3>
                  <p>{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="section">
          <div className="container">
            <h2 className="section-title">How It Works</h2>
            <div className="steps-grid">
              <div className="step-card">
                <div className="step-number">1</div>
                <h3>Choose your goals</h3>
                <p>Career growth, stay local, learn daily. Pick what matters.</p>
              </div>
              <div className="step-card">
                <div className="step-number">2</div>
                <h3>Choose your city and interests</h3>
                <p>Toronto tech? Miami founder? We tailor the feed to you.</p>
              </div>
              <div className="step-card">
                <div className="step-number">3</div>
                <h3>Daily feed + progress</h3>
                <p>Read. Learn. Track streaks. Stay consistent.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Relevant Exists */}
        <section className="section">
          <div className="container" style={{ maxWidth: '700px', textAlign: 'center' }}>
            <h2 className="section-title">Why Relevant Exists</h2>
            <div style={{ fontSize: 'clamp(16px, 2.5vw, 18px)', lineHeight: 1.7, opacity: 0.85, fontWeight: 300, letterSpacing: '-0.01em' }}>
              <p style={{ marginBottom: '20px' }}>
                I got tired of feeling behind. Every group chat had a topic I missed. Every dinner had a reference I didn't get.
              </p>
              <p style={{ marginBottom: '20px' }}>
                Reading more didn't help. I just felt overwhelmed and guilty.
              </p>
              <p style={{ marginBottom: '20px' }}>
                So I built this. A feed that assumes you're busy. That values your attention. That tells you why something matters before asking you to care.
              </p>
              <p style={{ opacity: 0.7 }}>
                No guilt. No FOMO. Just relevance.
              </p>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="section">
          <div className="container" style={{ maxWidth: '600px', textAlign: 'center' }}>
            <h2 className="section-title">Pricing</h2>
            <div style={{ marginBottom: '40px' }}>
              <p style={{ fontSize: '24px', fontWeight: 500, marginBottom: '8px' }}>Free 7-day trial</p>
              <p style={{ fontSize: '18px', opacity: 0.7, marginBottom: '24px' }}>Then $4.99/month</p>
              <p style={{ fontSize: '14px', opacity: 0.5 }}>Less than a coffee. Cancel anytime.</p>
            </div>
            <a href="#waitlist" className="btn btn-primary" style={{ fontSize: '18px', padding: '18px 48px' }}>
              Join Waitlist
            </a>
          </div>
        </section>

        {/* Waitlist */}
        <section id="waitlist" className="section">
          <div className="container">
            <h2 className="section-title">Get Early Access</h2>
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
                  {waitlistStatus === 'loading' ? 'Joining...' : 'Join Waitlist'}
                </button>
              </div>
              {waitlistMessage && (
                <p className={`message ${waitlistStatus === 'success' ? 'message-success' : 'message-error'}`}>
                  {waitlistMessage}
                </p>
              )}
            </form>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="container">
            <p className="footer-content">
              © {currentYear} Relevant.{' '}
              <a href="mailto:support@getrelevantapp.com" className="footer-email">
                support@getrelevantapp.com
              </a>
              {' • '}
              <a 
                href="https://www.instagram.com/relevant.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="footer-email"
              >
                Instagram
              </a>
            </p>
          </div>
        </footer>
      </main>
    </>
  )
}
