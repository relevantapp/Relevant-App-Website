'use client'

import { useState, FormEvent, useEffect } from 'react'
import Image from 'next/image'

export default function Home() {
  const [email, setEmail] = useState('')
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [waitlistMessage, setWaitlistMessage] = useState('')
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' })
  const [contactStatus, setContactStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [contactFeedback, setContactFeedback] = useState('')
  const [showStickyCTA, setShowStickyCTA] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (waitlistStatus === 'success') {
        setShowStickyCTA(false)
        return
      }
      setShowStickyCTA(window.scrollY > 800)
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

  const handleContactSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setContactStatus('loading')
    setContactFeedback('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: contactForm.email.trim(),
          name: contactForm.name.trim(),
          message: contactForm.message.trim(),
          subject: 'Message from the Relevant landing page',
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setContactStatus('success')
        setContactFeedback(data.message || 'Message sent! Talk soon.')
        setContactForm({ name: '', email: '', message: '' })
      } else {
        throw new Error(data.error || 'Failed to send message')
      }
    } catch (error) {
      setContactStatus('error')
      setContactFeedback(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  const currentYear = new Date().getFullYear()

  const feedCards = [
    {
      category: 'NEWS',
      headline: 'Major shift in federal housing policy',
      summary: 'Government announces new affordability measures targeting first-time buyers. Implementation timeline unclear.',
      whyMatters: 'If you\'re under 35, this could affect your mortgage approval process by spring.',
      image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80'
    },
    {
      category: 'LOCAL',
      headline: 'Toronto Film Festival announces surprise opener',
      summary: 'World premiere confirmed for September. Director attached, cast TBA.',
      whyMatters: 'Downtown streets close Sept 7–10. Plan your commute now.',
      image: 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&w=800&q=80'
    },
    {
      category: 'AI TOOL',
      headline: 'Claude 4 now writes production code',
      summary: 'Anthropic releases model with autonomous debugging. Early access rolling out.',
      whyMatters: 'Could cut dev time 30%. Beta waitlist open until Friday.',
      image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80'
    },
    {
      category: 'LEARN',
      headline: 'Word of the day: Zeitgeist',
      summary: 'The defining spirit or mood of a particular period, especially as shown in ideas and beliefs.',
      whyMatters: 'Shows up in business writing 3x more than casual conversation.',
      image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80'
    },
    {
      category: 'EVENTS',
      headline: 'Free startup meetup at MaRS this Thursday',
      summary: '6pm, networking + panel on product-market fit. RSVP required.',
      whyMatters: 'Last event had 3 hiring founders. Bring business cards.',
      image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80'
    },
    {
      category: 'GOALS',
      headline: 'You\'re 2 days from your weekly streak',
      summary: 'Current: 5 days reading. Target: 7 days. Almost there.',
      whyMatters: 'Hit 7 and unlock your first badge. Keep going.',
      image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=800&q=80'
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
            <Image src="/logo-black.svg" alt="Relevant" width={40} height={40} style={{ display: 'block' }} />
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
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
              <Image src="/logo-black.svg" alt="Relevant" width={80} height={80} />
            </div>
            <h1>Stay Relevant in 5 Minutes a Day</h1>
            <div style={{ maxWidth: '680px', margin: '0 auto' }}>
              <p className="hero-tagline" style={{ marginBottom: '8px' }}>
                News, local context, learning, and AI.
              </p>
              <p className="hero-tagline" style={{ marginBottom: '20px' }}>
                Explained clearly. Built for busy people.
              </p>
              <p className="hero-identity" style={{ fontSize: '15px', opacity: 0.6, marginBottom: '32px', letterSpacing: '-0.01em' }}>
                Designed for busy professionals who still want to stay sharp.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', marginTop: '40px' }}>
                <a href="#waitlist" className="btn btn-primary" style={{ fontSize: '18px', padding: '18px 48px' }}>
                  Get Early Access
                </a>
                <p style={{ fontSize: '14px', opacity: 0.6, letterSpacing: '-0.01em' }}>
                  Free 7-day trial at launch • $4.99/month after
                </p>
                <p style={{ fontSize: '13px', opacity: 0.5, marginTop: '8px' }}>
                  5 minutes a day. That&apos;s it.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Daily Brief Preview */}
        <section className="section" style={{ paddingTop: '120px', paddingBottom: '120px', background: '#000' }}>
          <div className="container">
            <div style={{ maxWidth: '980px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.1em', opacity: 0.5, marginBottom: '20px' }}>DAILY BRIEF</p>
                <h2 style={{ fontSize: '48px', fontWeight: 700, marginBottom: '20px', letterSpacing: '-0.03em' }}>
                  Your 2-minute brief
                </h2>
                <p style={{ fontSize: '18px', opacity: 0.7, maxWidth: '600px', margin: '0 auto' }}>
                  Every morning. Career-first. Money-aware. Only productive. No filler.
                </p>
              </div>

              {/* Brief Preview Card */}
              <div style={{
                maxWidth: '680px',
                margin: '0 auto',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                padding: '48px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)'
              }}>
                {/* Brief Header */}
                <div style={{ marginBottom: '40px', paddingBottom: '24px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <h3 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>Today&apos;s Brief</h3>
                  <p style={{ fontSize: '14px', opacity: 0.5 }}>Tuesday, April 15 • 2 min read</p>
                </div>

                {/* Brief Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', opacity: 0.5, marginBottom: '12px' }}>ONE THING CHANGING</p>
                    <h4 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', lineHeight: 1.4 }}>
                      Remote work tax rules shift in 6 states
                    </h4>
                    <p style={{ fontSize: '15px', opacity: 0.7, lineHeight: 1.6, marginBottom: '12px' }}>
                      New withholding requirements for distributed teams. Affects payroll starting May 1.
                    </p>
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderLeft: '2px solid rgba(255, 255, 255, 0.3)',
                      padding: '12px 16px',
                      borderRadius: '4px',
                      marginTop: '12px'
                    }}>
                      <p style={{ fontSize: '14px', fontWeight: 500, opacity: 0.9 }}>
                        💡 If you manage payroll or work remote, check your state&apos;s list by Friday.
                      </p>
                    </div>
                  </div>

                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', opacity: 0.5, marginBottom: '12px' }}>ONE SMART MOVE</p>
                    <h4 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', lineHeight: 1.4 }}>
                      Set your AI budget now
                    </h4>
                    <p style={{ fontSize: '15px', opacity: 0.7, lineHeight: 1.6 }}>
                      Teams are spending $200/month per person on ChatGPT, Claude, and tools they forget about. Audit before it compounds.
                    </p>
                  </div>

                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', opacity: 0.5, marginBottom: '12px' }}>ONE SIGNAL TO WATCH</p>
                    <h4 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', lineHeight: 1.4 }}>
                      3 competitors raised this week
                    </h4>
                    <p style={{ fontSize: '15px', opacity: 0.7, lineHeight: 1.6 }}>
                      Your space is heating up. Know who&apos;s funded, what they&apos;re building, and how much runway they have.
                    </p>
                  </div>
                </div>
              </div>

              <p style={{ textAlign: 'center', fontSize: '14px', opacity: 0.5, marginTop: '48px' }}>
                Built for professionals who need to stay sharp without wasting time.
              </p>
            </div>
          </div>
        </section>

        {/* The Feed Preview */}
        <section className="section" style={{ paddingTop: '90px', paddingBottom: '90px' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <h2 className="section-title" style={{ marginBottom: '16px' }}>Your daily feed looks like this</h2>
              <p style={{ fontSize: '16px', opacity: 0.6, letterSpacing: '-0.01em' }}>Tailored to your work, your city, and what you care about.</p>
            </div>
            
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
                    <div className="phone-card-single">
                      <div style={{ 
                        width: '100%', 
                        height: '180px', 
                        borderRadius: '8px', 
                        overflow: 'hidden', 
                        marginBottom: '12px',
                        position: 'relative'
                      }}>
                        <Image 
                          src={feedCards[0].image}
                          alt={feedCards[0].headline}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                      </div>
                      <div style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.05em', opacity: 0.5, marginBottom: '8px' }}>{feedCards[0].category}</div>
                      <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px', lineHeight: 1.3 }}>{feedCards[0].headline}</div>
                      <div style={{ fontSize: '12px', opacity: 0.7, marginBottom: '12px', lineHeight: 1.5 }}>{feedCards[0].summary}</div>
                      <div style={{ 
                        paddingTop: '12px', 
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255, 255, 255, 0.03)',
                        padding: '12px',
                        borderRadius: '6px'
                      }}>
                        <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', opacity: 0.5, marginBottom: '6px' }}>WHY IT MATTERS</div>
                        <div style={{ fontSize: '12px', fontWeight: 500, lineHeight: 1.5, opacity: 0.9 }}>{feedCards[0].whyMatters}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feed Cards - Horizontal Scroll */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', opacity: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>�</span>
                Swipe to see all 6 cards
              </p>
            </div>
            <div className="feed-scroll-container">
              <div className="feed-scroll">
                {feedCards.map((card, i) => (
                  <div key={i} className="feed-card">
                    <div className="feed-image-wrapper">
                      <Image 
                        src={card.image} 
                        alt={card.headline} 
                        fill 
                        sizes="320px"
                        className="feed-image"
                      />
                    </div>
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
          </div>
        </section>

        {/* Personalized for You */}
        <section className="section">
          <div className="container">
            <h2 className="section-title" style={{ marginBottom: '60px' }}>Built for your life, not everyone else&apos;s</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', maxWidth: '1100px', margin: '0 auto' }}>
              <div style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '16px' }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>👨‍💼</div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>Startup Founder</h3>
                <p style={{ fontSize: '15px', opacity: 0.7, lineHeight: 1.6 }}>Funding trends, competitor moves, YC updates, local tech events, productivity tools.</p>
              </div>
              <div style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '16px' }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>👨‍💻</div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>Software Engineer</h3>
                <p style={{ fontSize: '15px', opacity: 0.7, lineHeight: 1.6 }}>New frameworks, AI coding tools, remote jobs, tech layoffs, industry shifts.</p>
              </div>
              <div style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '16px' }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>📊</div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>Product Manager</h3>
                <p style={{ fontSize: '15px', opacity: 0.7, lineHeight: 1.6 }}>Product trends, user research, roadmap strategies, PM tools, career growth.</p>
              </div>
              <div style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '16px' }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>📈</div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>Sales Professional</h3>
                <p style={{ fontSize: '15px', opacity: 0.7, lineHeight: 1.6 }}>Sales tactics, closing tips, CRM updates, commission trends, client insights.</p>
              </div>
              <div style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '16px' }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>🎨</div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>Marketing Leader</h3>
                <p style={{ fontSize: '15px', opacity: 0.7, lineHeight: 1.6 }}>Campaign strategies, growth tactics, brand trends, AI marketing, analytics.</p>
              </div>
              <div style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '16px' }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>💼</div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>Business Professional</h3>
                <p style={{ fontSize: '15px', opacity: 0.7, lineHeight: 1.6 }}>Market updates, leadership insights, industry news, networking events.</p>
              </div>
            </div>
            <p style={{ textAlign: 'center', fontSize: '16px', opacity: 0.6, marginTop: '48px', maxWidth: '600px', margin: '48px auto 0' }}>
              Tell us your role, industry, and goals. We build a feed that actually fits your life.
            </p>
          </div>
        </section>

        {/* Before vs After */}
        <section className="section">
          <div className="container">
            <h2 className="section-title" style={{ marginBottom: '60px' }}>Staying informed shouldn&apos;t feel like work</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '48px', maxWidth: '900px', margin: '0 auto' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px', opacity: 0.5 }}>Before</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '16px', lineHeight: 1.6, opacity: 0.7 }}>
                  <p>Too many apps</p>
                  <p>Long articles you don&apos;t finish</p>
                  <p>Group chats talking about things you missed</p>
                  <p>Still feel behind</p>
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '24px' }}>With Relevant</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '16px', lineHeight: 1.6 }}>
                  <p>One feed</p>
                  <p>Clear context</p>
                  <p>You know why things matter</p>
                  <p>You actually remember what you read</p>
                </div>
              </div>
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

        {/* You Should Know Section */}
        <section className="section" style={{ paddingTop: '90px', paddingBottom: '90px' }}>
          <div className="container">
            <div style={{ maxWidth: '980px', margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                <h2 style={{ fontSize: '48px', fontWeight: 700, marginBottom: '16px', letterSpacing: '-0.03em' }}>
                  Worth knowing today
                </h2>
                <p style={{ fontSize: '18px', opacity: 0.7, maxWidth: '600px', margin: '0 auto' }}>
                  Things you would&apos;ve missed. Now you won&apos;t.
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '32px',
                maxWidth: '980px',
                margin: '0 auto'
              }}>
                {/* Card 1 */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  padding: '32px',
                  transition: 'all 0.3s ease'
                }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', opacity: 0.5, marginBottom: '16px' }}>CITY</p>
                  <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px', lineHeight: 1.3 }}>
                    Subway delays on Line 1 until Friday
                  </h3>
                  <p style={{ fontSize: '15px', opacity: 0.7, lineHeight: 1.6, marginBottom: '16px' }}>
                    Track work between Union and King. Add 15 minutes to your commute.
                  </p>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderLeft: '2px solid rgba(255, 255, 255, 0.3)',
                    padding: '10px 14px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: 500
                  }}>
                    💡 Shuttle buses running. Or take King streetcar.
                  </div>
                </div>

                {/* Card 2 */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  padding: '32px',
                  transition: 'all 0.3s ease'
                }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', opacity: 0.5, marginBottom: '16px' }}>TECH</p>
                  <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px', lineHeight: 1.3 }}>
                    GitHub Actions now 2x faster
                  </h3>
                  <p style={{ fontSize: '15px', opacity: 0.7, lineHeight: 1.6, marginBottom: '16px' }}>
                    New runners with better caching. Same price. Available now in all repos.
                  </p>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderLeft: '2px solid rgba(255, 255, 255, 0.3)',
                    padding: '10px 14px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: 500
                  }}>
                    💡 Switch your workflows this week and cut CI time in half.
                  </div>
                </div>

                {/* Card 3 */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  padding: '32px',
                  transition: 'all 0.3s ease'
                }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', opacity: 0.5, marginBottom: '16px' }}>MONEY</p>
                  <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px', lineHeight: 1.3 }}>
                    Your SaaS bill just went up 12%
                  </h3>
                  <p style={{ fontSize: '15px', opacity: 0.7, lineHeight: 1.6, marginBottom: '16px' }}>
                    Notion, Slack, Figma all announced price increases this month. Check your invoices.
                  </p>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderLeft: '2px solid rgba(255, 255, 255, 0.3)',
                    padding: '10px 14px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: 500
                  }}>
                    💡 Grandfathered plans expire June 1. Lock in old pricing now.
                  </div>
                </div>

                {/* Card 4 */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  padding: '32px',
                  transition: 'all 0.3s ease'
                }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', opacity: 0.5, marginBottom: '16px' }}>CAREER</p>
                  <h3 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '12px', lineHeight: 1.3 }}>
                    Senior roles now require AI experience
                  </h3>
                  <p style={{ fontSize: '15px', opacity: 0.7, lineHeight: 1.6, marginBottom: '16px' }}>
                    78% of job postings for senior positions mention AI skills. Up from 12% last year.
                  </p>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderLeft: '2px solid rgba(255, 255, 255, 0.3)',
                    padding: '10px 14px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: 500
                  }}>
                    💡 Start building projects with Claude or ChatGPT. Add them to your portfolio.
                  </div>
                </div>
              </div>
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
                <h3>Tell us about you</h3>
                <p>Your role, industry, city. Takes 60 seconds.</p>
              </div>
              <div className="step-card">
                <div className="step-number">2</div>
                <h3>Pick your direction</h3>
                <p>Career growth? Money moves? Staying local? You choose.</p>
              </div>
              <div className="step-card">
                <div className="step-number">3</div>
                <h3>We tailor your feed</h3>
                <p>News, tools, events, learning. Built around your life.</p>
              </div>
              <div className="step-card">
                <div className="step-number">4</div>
                <h3>Get the &quot;why it matters&quot;</h3>
                <p>Every story explains what it means for you. No guessing.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Relevant Exists */}
        <section className="section">
          <div className="container" style={{ maxWidth: '600px', textAlign: 'center' }}>
            <h2 className="section-title" style={{ marginBottom: '48px' }}>Why Relevant exists</h2>
            <div style={{ fontSize: '18px', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'left' }}>
              <p>We all try to stay updated.<br />We skim headlines. Save articles. Open tabs.</p>
              <p>But somehow, we still feel behind.</p>
              <p>It&apos;s not because we don&apos;t care.<br />It&apos;s because we&apos;re busy.</p>
              <p>So we built Relevant.<br />A feed that assumes you have a life.</p>
              <p style={{ fontWeight: 500 }}>No guilt.<br />No FOMO.<br />Just what matters.</p>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="section">
          <div className="container" style={{ maxWidth: '600px', textAlign: 'center' }}>
            <h2 className="section-title">Pricing</h2>
            <div style={{ marginBottom: '40px' }}>
              <p style={{ fontSize: '24px', fontWeight: 500, marginBottom: '8px' }}>Free 7-day trial</p>
              <p style={{ fontSize: '18px', opacity: 0.7, marginBottom: '12px' }}>Then $4.99/month</p>
              <p style={{ fontSize: '14px', opacity: 0.6 }}>Less than a coffee. More useful than most apps you scroll.</p>
            </div>
            <a href="#waitlist" className="btn btn-primary" style={{ fontSize: '18px', padding: '18px 48px' }}>
              Join Waitlist
            </a>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="section">
          <div className="container">
            <h2 className="section-title">Need something else?</h2>
            <div className="contact-grid">
              <div className="contact-card">
                <p style={{ fontSize: '18px', fontWeight: 500, marginBottom: '16px' }}>
                  Partnerships, press, or product questions? Drop a note and it hits our inbox instantly.
                </p>
                <p style={{ fontSize: '15px', opacity: 0.7, marginBottom: '24px' }}>
                  We reply within a day. Prefer sending directly?
                </p>
                <div className="contact-pill">support@getrelevantapp.com</div>
                <div className="contact-list">
                  <span>• Collabs & sponsorships</span>
                  <span>• Press & speaking</span>
                  <span>• Product feedback</span>
                </div>
              </div>
              <form className="contact-form" onSubmit={handleContactSubmit}>
                <div className="contact-form-grid">
                  <input
                    type="text"
                    value={contactForm.name}
                    onChange={(e) => setContactForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Your name"
                    className="input"
                    disabled={contactStatus === 'loading'}
                  />
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="you@email.com"
                    required
                    className="input"
                    disabled={contactStatus === 'loading'}
                  />
                </div>
                <textarea
                  value={contactForm.message}
                  onChange={(e) => setContactForm((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="What should we know?"
                  required
                  className="input textarea"
                  rows={4}
                  disabled={contactStatus === 'loading'}
                />
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={contactStatus === 'loading'}
                >
                  {contactStatus === 'loading' ? 'Sending...' : 'Send message'}
                </button>
                {contactFeedback && (
                  <p className={`message ${contactStatus === 'success' ? 'message-success' : 'message-error'}`}>
                    {contactFeedback}
                  </p>
                )}
              </form>
            </div>
          </div>
        </section>

        {/* Waitlist */}
        <section id="waitlist" className="section">
          <div className="container">
            <h2 className="section-title">Get Early Access</h2>
            <p style={{ textAlign: 'center', fontSize: '16px', opacity: 0.7, marginBottom: '32px' }}>Early access is limited</p>
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
              {!waitlistMessage && (
                <p style={{ textAlign: 'center', fontSize: '13px', opacity: 0.5, marginTop: '16px' }}>
                  No spam. One email when it&apos;s ready.
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
