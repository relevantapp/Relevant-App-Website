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
        setWaitlistMessage(data.message || 'You\'re on the list!')
        setEmail('')
      } else {
        throw new Error(data.error || 'Failed to join waitlist')
      }
    } catch (error) {
      setWaitlistStatus('error')
      setWaitlistMessage(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  const handleContact = () => {
    window.location.href = 'mailto:support@getrelevantapp.com?subject=Relevant Support'
  }

  const currentYear = new Date().getFullYear()

  return (
    <>
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-logo">Relevant</div>
          <div className="nav-links">
            <a href="#about" className="nav-link">About</a>
            <a href="#waitlist" className="nav-link">Waitlist</a>
            <a 
              href="https://www.instagram.com/relevant.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="nav-link"
            >
              Instagram
            </a>
            <button onClick={handleContact} className="nav-link" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
              Contact
            </button>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="hero">
          <div className="container">
            <h1>Relevant</h1>
            <p className="hero-tagline">Stay informed without the noise</p>
            <p className="hero-description">
              A personalized professional feed that cuts through the clutter. 
              Get bias-aware summaries, career insights, and local updates—tailored to you.
            </p>
          </div>
        </section>

        {/* Waitlist */}
        <section id="waitlist" className="section">
          <div className="container">
            <h2 className="section-title">Join the Waitlist</h2>
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

        {/* About */}
        <section id="about" className="section">
          <div className="container">
            <h2 className="section-title">What Makes Relevant Different</h2>
            <div className="about-grid">
              <div className="about-item">
                <h3>Bias-Aware Summaries</h3>
                <p>
                  See multiple perspectives on every story. 
                  Understand not just what happened, but how different sources frame it.
                </p>
              </div>
              <div className="about-item">
                <h3>Career Growth</h3>
                <p>
                  Get updates tailored to your profession and industry. 
                  Stay ahead in your field without information overload.
                </p>
              </div>
              <div className="about-item">
                <h3>Local Culture & Sports</h3>
                <p>
                  Never miss what's happening in your city. 
                  From events to local teams, stay connected to your community.
                </p>
              </div>
            </div>
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
            </p>
          </div>
        </footer>
      </main>
    </>
  )
}
