'use client'

import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  Check,
  ChevronRight,
  Factory,
  Handshake,
  Link2,
  MapPin,
  Moon,
  Newspaper,
  PhoneCall,
  Rocket,
  ScanLine,
  Send,
  Sparkles,
  Sun,
  Telescope,
} from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { type CSSProperties, FormEvent, MouseEvent, useEffect, useState } from 'react'
import BrandMark from '@/components/BrandMark'

type ThemeMode = 'dark' | 'light'
type FormStatus = 'idle' | 'loading' | 'success' | 'error'
type ScreenshotSurface = {
  label: string
  title: string
  body: string
  src: string
  alt: string
  height: number
}

const APP_STORE_URL = 'https://apps.apple.com/app/id6756225699'

const promiseCards = [
  {
    label: 'Fewer items',
    text: 'A small set of updates worth your attention.',
  },
  {
    label: 'Role-aware',
    text: 'Ranked against your company, role, industry, and market.',
  },
  {
    label: 'Consequence-first',
    text: 'Each signal explains the impact, not just the event.',
  },
  {
    label: 'Cited',
    text: 'Important claims stay tied to sources.',
  },
]

const mobileSurfaces: ScreenshotSurface[] = [
  {
    label: 'What happened',
    title: 'A clean read on the event.',
    body: 'No news clutter. Just the update and why it is here.',
    src: '/marketing-screenshots/detail-what-happened.png',
    alt: 'Relevant detail screen explaining what happened',
    height: 2877,
  },
  {
    label: 'Why it matters',
    title: 'The consequence is attached.',
    body: 'The app connects the update to your work context.',
    src: '/marketing-screenshots/detail-why-matters.png',
    alt: 'Relevant detail screen explaining why an update matters',
    height: 1821,
  },
  {
    label: 'What to do next',
    title: 'The next move is visible.',
    body: 'Relevant shows what to watch, ask, or consider next.',
    src: '/marketing-screenshots/detail-what-to-do.png',
    alt: 'Relevant detail screen explaining what to do next',
    height: 2790,
  },
]

const beyondSurfaces: ScreenshotSurface[] = [
  {
    label: 'Ask',
    title: 'Ask anything about the signal.',
    body: 'Follow up without starting from a blank prompt.',
    src: '/marketing-screenshots/ask-ai.png',
    alt: 'Relevant Ask AI screen',
    height: 2796,
  },
  {
    label: 'Watch and listen',
    title: 'Extra context stays beside the update.',
    body: 'Related video and audio live with the signal.',
    src: '/marketing-screenshots/watch-listen.png',
    alt: 'Relevant watch and listen screen',
    height: 1413,
  },
  {
    label: 'Capture',
    title: 'Save the thought before it disappears.',
    body: 'Keep notes while the context is still fresh.',
    src: '/marketing-screenshots/journal.png',
    alt: 'Relevant journal screen',
    height: 2073,
  },
  {
    label: 'Share',
    title: 'Send the useful version, not the noise.',
    body: 'Share the cleaned-up signal with the context included.',
    src: '/marketing-screenshots/share-composer.png',
    alt: 'Relevant share composer screen',
    height: 2517,
  },
]

const workflows = [
  {
    number: '01',
    title: 'Meeting Prep',
    body: 'Walk in already knowing what matters.',
    chips: ['customer call', 'partnership', 'investor meeting', 'cited brief', 'questions', 'landmines'],
  },
  {
    number: '02',
    title: 'Competitive Analysis',
    body: 'See where they win, where they are exposed, and how to counter.',
    chips: ['positioning', 'pricing', 'product motion', 'gaps', 'counters', 'watchlist'],
  },
  {
    number: '03',
    title: 'Business Case',
    body: 'Build the argument before the room pushes back.',
    chips: ['proof points', 'risks', 'objections', 'decision frame', 'what has to be true'],
  },
  {
    number: '04',
    title: 'Market Research',
    body: 'Understand the landscape, demand signals, and motion.',
    chips: ['market shifts', 'players', 'openings', 'trend evidence', 'next bets'],
  },
]

const howSteps = [
  ['Tell us four things', 'Company, role, industry, and location aim the system.'],
  ['Relevant scans the outside world', 'Headlines, filings, reports, and source updates are checked against your work context.'],
  ['You get the signal', 'A short card explains what changed, why it matters, and what to do next.'],
] as const

const heroSignals = [
  {
    src: '/marketing-screenshots/signal-card.png',
    alt: 'Relevant signal card showing a professional update',
    label: 'Main signal',
    className: 'signal-hero-signal--primary',
  },
  {
    src: '/marketing-screenshots/detail-what-happened.png',
    alt: 'Relevant detail screen explaining what changed',
    label: 'What changed',
    className: 'signal-hero-signal--left',
  },
  {
    src: '/marketing-screenshots/detail-why-matters.png',
    alt: 'Relevant detail screen explaining why the update matters',
    label: 'Why it matters',
    className: 'signal-hero-signal--right',
  },
]

const contextInputs = [
  { label: 'Company', value: 'Shopify', icon: Building2 },
  { label: 'Role', value: 'Founder', icon: BriefcaseBusiness },
  { label: 'Industry', value: 'B2B software', icon: Factory },
  { label: 'Location', value: 'Toronto', icon: MapPin },
]

const headlineStreams = [
  { source: 'Reuters', text: 'Enterprise AI budgets shift toward workflow tools' },
  { source: 'SEC', text: 'Public filing shows rising cloud infrastructure spend' },
  { source: 'The Information', text: 'New pricing pressure hits vertical SaaS vendors' },
  { source: 'FT', text: 'Cross-border data rules move through committee' },
  { source: 'Bloomberg', text: 'Payments platform expands partnership channel' },
  { source: 'CB Insights', text: 'Seed funding concentrates around operational AI' },
  { source: 'Axios', text: 'Retail tech buyers slow discretionary software spend' },
  { source: 'TechCrunch', text: 'Workflow automation startup launches enterprise suite' },
]

const sourceScanRows = [
  {
    source: 'Reuters',
    company: 'Shopify',
    text: 'Supplier pricing pressure rises after import-cost ruling',
    decision: 'Kept',
    reason: 'Operational exposure',
  },
  {
    source: 'Company filing',
    company: 'Stripe',
    text: 'New logistics note changes near-term margin forecast',
    decision: 'Kept',
    reason: 'Direct company impact',
  },
  {
    source: 'Market brief',
    company: 'HubSpot',
    text: 'Competitor starts discounting in the same buyer segment',
    decision: 'Kept',
    reason: 'Competitive move',
  },
  {
    source: 'Generic tech blog',
    company: 'OpenAI',
    text: 'Broad AI productivity survey gets recirculated',
    decision: 'Skipped',
    reason: 'Weak role fit',
  },
  {
    source: 'Policy feed',
    company: 'Apple',
    text: 'Committee date moves for cross-border data rules',
    decision: 'Kept',
    reason: 'Timing risk',
  },
  {
    source: 'Podcast transcript',
    company: 'Salesforce',
    text: 'Customer segment repeats the same procurement objection',
    decision: 'Kept',
    reason: 'Sales signal',
  },
  {
    source: 'Bloomberg',
    company: 'Nvidia',
    text: 'Enterprise buyers delay hardware spend into next quarter',
    decision: 'Skipped',
    reason: 'Low direct impact',
  },
  {
    source: 'The Information',
    company: 'Datadog',
    text: 'Usage-based pricing pressure appears in mid-market accounts',
    decision: 'Kept',
    reason: 'Margin signal',
  },
]

const sourceProofs = [
  {
    source: 'Reuters',
    detail: 'Confirms the policy change and timing.',
    tag: 'Primary event',
  },
  {
    source: 'Company filing',
    detail: 'Shows direct exposure for the company.',
    tag: 'Business impact',
  },
  {
    source: 'Industry report',
    detail: 'Adds market context and second-order risk.',
    tag: 'Market context',
  },
]

const useCases = [
  {
    tone: 'meeting',
    accent: '#60A5FA',
    icon: CalendarClock,
    title: 'Before a meeting',
    body: 'Walk in with the move, the risk, and the question that matters.',
    label: 'Room brief',
    metric: '12 min saved',
    lines: [
      ['Recent move', 'What changed since the last conversation'],
      ['Risk to raise', 'The point the room may miss'],
      ['Question to ask', 'A sharper opener for the meeting'],
    ],
  },
  {
    tone: 'customer',
    accent: '#5EEAD4',
    icon: PhoneCall,
    title: 'Before a customer call',
    body: 'See what changed around the account before you talk to them.',
    label: 'Account pulse',
    metric: '3 openings',
    lines: [
      ['Account change', 'New pressure on their business'],
      ['Market signal', 'What their category is reacting to'],
      ['Opening', 'Where the conversation can move'],
    ],
  },
  {
    tone: 'strategy',
    accent: '#A78BFA',
    icon: Telescope,
    title: 'Before a strategy decision',
    body: 'Separate real evidence from noise before the decision hardens.',
    label: 'Decision map',
    metric: '4 tradeoffs',
    lines: [
      ['Evidence', 'What is actually moving'],
      ['Tradeoff', 'What becomes harder if you wait'],
      ['Next move', 'The decision path to pressure-test'],
    ],
  },
  {
    tone: 'launch',
    accent: '#FBBF24',
    icon: Rocket,
    title: 'Before a launch',
    body: 'Track competitor moves, category shifts, and timing risks.',
    label: 'Launch radar',
    metric: '5 watchpoints',
    lines: [
      ['Competitor move', 'What changed in the market'],
      ['Timing risk', 'Where the launch could meet resistance'],
      ['Watch next', 'The signal to monitor after launch'],
    ],
  },
  {
    tone: 'investor',
    accent: '#4ADE80',
    icon: Handshake,
    title: 'Before an investor conversation',
    body: 'Show sharper market awareness and command of what is changing.',
    label: 'Board packet',
    metric: '6 proof lines',
    lines: [
      ['Market shift', 'What changed in the category'],
      ['Proof point', 'A cited reason the change matters'],
      ['Follow-up', 'The question you can answer cleanly'],
    ],
  },
  {
    tone: 'week',
    accent: '#F59E0B',
    icon: BarChart3,
    title: 'Before the week starts',
    body: 'Start with the handful of signals that can change your week.',
    label: 'Week scan',
    metric: 'Top 7 ranked',
    lines: [
      ['Top signal', 'The update most worth your time'],
      ['Why it matters', 'The consequence for your role'],
      ['Action', 'What to watch, ask, or do next'],
    ],
  },
] as const

const audiences = [
  ['Founders', 'Track market shifts, competitors, customers, and investor-relevant movement.'],
  ['Operators', 'Know what could affect delivery, planning, hiring, and execution.'],
  ['Product leaders', 'Spot category movement, competitor bets, customer pressure, and technology shifts.'],
  ['Investors', 'Follow companies, markets, themes, and second-order consequences.'],
  ['Consultants', 'Prepare faster with cited context and sharper questions.'],
  ['Sales and partnerships', 'Walk into conversations with the context others missed.'],
] as const

const genericAlerts = [
  'More links',
  'Same summary for everyone',
  'No role context',
  'No clear consequence',
  'Duplicate story spam',
  'Leaves you to decide what matters',
]

const relevantRows = [
  'Fewer, sharper signals',
  'Personalized to your work context',
  'Explains why it matters to you',
  'Shows what to do or watch next',
  'Updates stories as they evolve',
  'Built for decisions, not scrolling',
]

const socialLinks = [
  { label: 'Instagram', href: 'https://www.instagram.com/relevant.app/' },
  { label: 'TikTok', href: 'https://www.tiktok.com/@relevant.app' },
  { label: 'X', href: 'https://twitter.com/relevant' },
  { label: 'LinkedIn', href: 'https://linkedin.com/company/relevant' },
]

const preparationOptions = [
  'Meeting',
  'Competitor',
  'Market',
  'Business case',
  'Launch',
  'Investor call',
  'Customer call',
  'Strategy decision',
]

function applyTheme(nextTheme: ThemeMode) {
  document.documentElement.dataset.theme = nextTheme
  document.documentElement.style.colorScheme = nextTheme
  localStorage.setItem('relevant-site-theme', nextTheme)
}

export default function Home() {
  const [theme, setTheme] = useState<ThemeMode>('dark')
  const [briefStatus, setBriefStatus] = useState<FormStatus>('idle')
  const [briefMessage, setBriefMessage] = useState('')
  const [briefForm, setBriefForm] = useState({
    preparation: preparationOptions[0],
    role: '',
    market: '',
    email: '',
  })
  const [showMobileCta, setShowMobileCta] = useState(false)
  const [navScrolled, setNavScrolled] = useState(false)
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    const stored = localStorage.getItem('relevant-site-theme')
    const nextTheme = stored === 'light' || stored === 'dark' ? stored : 'dark'
    setTheme(nextTheme)
    applyTheme(nextTheme)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('is-visible')
        })
      },
      { threshold: 0.12, rootMargin: '-32px' }
    )

    document.querySelectorAll('.signal-reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const syncMobileCta = () => {
      if (window.innerWidth > 820) {
        setShowMobileCta(false)
        return
      }

      setShowMobileCta(window.scrollY > 560)
    }

    syncMobileCta()
    window.addEventListener('scroll', syncMobileCta, { passive: true })
    window.addEventListener('resize', syncMobileCta)
    return () => {
      window.removeEventListener('scroll', syncMobileCta)
      window.removeEventListener('resize', syncMobileCta)
    }
  }, [])

  useEffect(() => {
    const getScrollY = () => window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0
    let ticking = false

    const syncNav = () => {
      const currentScrollY = getScrollY()
      setNavScrolled(currentScrollY > 12)
      ticking = false
    }

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(syncNav)
        ticking = true
      }
    }

    syncNav()
    window.addEventListener('scroll', handleScroll, { passive: true })
    document.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handleAnchorClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const hash = event.currentTarget.hash
    const target = hash ? document.getElementById(hash.slice(1)) : null
    if (!target) return

    event.preventDefault()
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.history.pushState(null, '', hash)
  }

  const joinWaitlist = async (email: string, metadata?: Record<string, string>) => {
    const response = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, ...metadata }),
    })
    const data = await response.json()

    if (!response.ok) throw new Error(data.error || 'Request failed')
    return data.message || 'Thanks. We will follow up shortly.'
  }

  const handleBriefRequest = async (event: FormEvent) => {
    event.preventDefault()
    setBriefStatus('loading')
    setBriefMessage('')

    try {
      await joinWaitlist(briefForm.email, {
        source: 'homepage-intelligence-desk',
        preparation: briefForm.preparation,
        role: briefForm.role,
        companyOrMarket: briefForm.market,
      })
      setBriefStatus('success')
      setBriefMessage('Thanks. We will send the next step shortly.')
      setBriefForm({ preparation: preparationOptions[0], role: '', market: '', email: '' })
    } catch (error) {
      setBriefStatus('error')
      setBriefMessage(error instanceof Error ? error.message : 'Something went wrong')
    }
  }

  return (
    <div className="signal-home">
      <nav className={`signal-nav${navScrolled ? ' is-scrolled' : ''}`} aria-label="Primary navigation">
        <div className="signal-frame signal-nav__inner">
          <BrandMark href="#top" onClick={handleAnchorClick} />
          <div className="signal-nav__links">
            <a href="#signals" onClick={handleAnchorClick}>Signals</a>
            <a href="#intelligence" onClick={handleAnchorClick}>Intelligence Desk</a>
            <a href="#use-cases" onClick={handleAnchorClick}>Use Cases</a>
            <a href="#how-it-works" onClick={handleAnchorClick}>How it Works</a>
          </div>
          <div className="signal-nav__actions">
            <button
              type="button"
              className="signal-theme-toggle"
              onClick={() => {
                const nextTheme = theme === 'dark' ? 'light' : 'dark'
                setTheme(nextTheme)
                applyTheme(nextTheme)
              }}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <a href="/login">Sign in</a>
            <a href="/signup" className="signal-nav__cta">Get started</a>
          </div>
        </div>
      </nav>

      <div className="signal-app-marquee" aria-label="Relevant app availability">
        <div className="signal-app-marquee__track">
          {[0, 1, 2, 3].map((group) => (
            <div className="signal-app-marquee__group" key={group}>
              <span>The app is live</span>
              <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">Get Relevant</a>
              <span>Never feel behind at work</span>
              <AppStoreBadge compact />
            </div>
          ))}
        </div>
      </div>

      <main id="top">
        <section className="signal-hero" aria-labelledby="home-title">
          <div className="signal-frame signal-hero__grid">
            <div className="signal-hero__copy">
              <p className="signal-eyebrow">Professional awareness, built for your role</p>
              <h1 id="home-title">Know what matters before it becomes obvious.</h1>
              <p>
                Relevant tracks your company, role, industry, and market, then turns the noise into a few clear signals, why they matter to you, and what to do next.
              </p>
              <div className="signal-hero__actions">
                <a href={APP_STORE_URL} className="signal-button signal-button--primary" target="_blank" rel="noopener noreferrer">Get Relevant</a>
              </div>
              <AppStoreBadge />
              <p className="signal-hero__micro">
                No endless feed. No generic summaries. Just the updates that could change your next move.
              </p>
            </div>

            <HeroIntelligenceVisual />
          </div>
        </section>

        <section className="signal-promise-strip" aria-label="Product promise">
          <div className="signal-frame signal-promise-strip__grid">
            {promiseCards.map((card) => (
              <article className="signal-proof-card signal-reveal" key={card.label}>
                <span>{card.label}</span>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="signals" className="signal-section signal-mobile-section" aria-labelledby="signals-title">
          <div className="signal-frame signal-mobile-section__grid">
            <div className="signal-section__copy signal-reveal">
              <p className="signal-eyebrow">Mobile app</p>
              <h2 id="signals-title">Never feel behind at work.</h2>
              <p>
                Open the app, set your work context, and get the few signals that matter to your role: competitors, customers, markets, policy, technology, people, and companies you care about.
              </p>
              <a href={APP_STORE_URL} className="signal-inline-cta" target="_blank" rel="noopener noreferrer">
                Download the app <ArrowRight size={16} />
              </a>
            </div>

            <div className="signal-phone-stage signal-reveal">
              <Image
                src="/marketing-screenshots/home-feed.png"
                alt="Relevant mobile app professional signal feed"
                width={1290}
                height={2502}
                sizes="(max-width: 900px) 76vw, 390px"
                className="signal-real-phone"
              />
            </div>
          </div>

          <div className="signal-frame signal-screenshot-heading signal-reveal">
            <h3>What changed, why it matters, and what to do next.</h3>
            <p>
              The detail screen shows the event, the impact, and the next move.
            </p>
          </div>

          <ScreenshotSurfaceStrip items={mobileSurfaces} />
          <div className="signal-frame signal-screenshot-heading signal-screenshot-heading--compact signal-reveal">
            <h3>Keep the context beside the signal.</h3>
            <p>Ask, watch, capture, or share without rebuilding the story from scratch.</p>
          </div>
          <ScreenshotSurfaceStrip items={beyondSurfaces} variant="beyond" />
        </section>

        <section id="intelligence" className="signal-section signal-desk-section" aria-labelledby="desk-title">
          <div className="signal-frame signal-desk-section__grid">
            <div className="signal-desk-section__copy signal-reveal">
              <p className="signal-eyebrow signal-eyebrow--blue">Intelligence Desk</p>
              <h2 id="desk-title">What decision are you preparing for?</h2>
              <p>
                Pick the job. Give Relevant a short brief. Get ranked evidence, role-aware judgment, and the next moves you can use.
              </p>
              <div className="signal-stat-grid" aria-label="Intelligence Desk stats">
                <StatCard label="Workflows" value="04" detail="meeting, competitor, market, case" />
                <StatCard label="Inputs" value="3-5" detail="enough to aim the research" />
                <StatCard label="Output" value="cited" detail="every claim points back to sources" />
                <StatCard label="Lens" value="role" detail="framed for what you need to decide" />
              </div>
            </div>

            <div className="signal-workflow-stack">
              {workflows.map((workflow, index) => (
                <motion.article
                  className="signal-workflow-card"
                  key={workflow.title}
                  initial={{ y: 34, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true, amount: 0.32 }}
                  transition={{ duration: 0.55, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div>
                    <span>{workflow.number}</span>
                    <h3>{workflow.title}</h3>
                    <p>{workflow.body}</p>
                  </div>
                  <div className="signal-chip-row">
                    {workflow.chips.map((chip) => (
                      <em key={chip}>{chip}</em>
                    ))}
                  </div>
                  <ChevronRight className="signal-workflow-card__arrow" size={22} aria-hidden="true" />
                </motion.article>
              ))}
            </div>
          </div>

          <div className="signal-frame signal-brief-module">
            <div>
                <h3>Build your first brief.</h3>
              <p>We will turn your brief into cited intelligence, not a pile of links.</p>
            </div>
            <form className="signal-brief-form" onSubmit={handleBriefRequest}>
              <label>
                <span>What are you preparing for?</span>
                <select
                  value={briefForm.preparation}
                  onChange={(event) => setBriefForm((current) => ({ ...current, preparation: event.target.value }))}
                >
                  {preparationOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Your role</span>
                <input
                  value={briefForm.role}
                  onChange={(event) => setBriefForm((current) => ({ ...current, role: event.target.value }))}
                  placeholder="Founder, operator, product lead"
                  required
                />
              </label>
              <label>
                <span>Company or market</span>
                <input
                  value={briefForm.market}
                  onChange={(event) => setBriefForm((current) => ({ ...current, market: event.target.value }))}
                  placeholder="Company, market, or category"
                  required
                />
              </label>
              <label>
                <span>Work email</span>
                <input
                  type="email"
                  value={briefForm.email}
                  onChange={(event) => setBriefForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="you@company.com"
                  required
                />
              </label>
              <button type="submit" disabled={briefStatus === 'loading'}>
                {briefStatus === 'loading' ? 'Sending' : 'Request my brief'}
                <Send size={16} />
              </button>
              <p className={`signal-form-status signal-form-status--${briefStatus}`}>
                {briefMessage || 'Tell us what you are preparing for. We will send the next step.'}
              </p>
            </form>
          </div>
        </section>

        <section id="how-it-works" className="signal-section signal-how-section" aria-labelledby="how-title">
          <div className="signal-frame signal-section__center signal-reveal">
            <h2 id="how-title">Four inputs. Thousands of checks. One useful signal.</h2>
            <p>
              Relevant starts with your work context, scans the outside world against it, and gives you the update that deserves attention.
            </p>
          </div>
          <HowItWorksVisualStory />
          <div className="signal-frame signal-step-grid">
            {howSteps.map(([title, body], index) => (
              <article className="signal-step-card signal-reveal" key={title}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="use-cases" className="signal-section signal-use-section" aria-labelledby="use-title">
          <div className="signal-frame signal-section__center signal-reveal">
            <h2 id="use-title">Use Relevant before the room asks.</h2>
          </div>
          <div className="signal-frame signal-use-grid">
            {useCases.map((useCase) => (
              <article className="signal-use-card signal-reveal" key={useCase.title}>
                <UseCasePreview useCase={useCase} />
                <h3>{useCase.title}</h3>
                <p>{useCase.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="signal-section signal-compare-section" aria-labelledby="compare-title">
          <div className="signal-frame signal-compare-grid">
            <div className="signal-section__copy signal-reveal">
              <h2 id="compare-title">Not another feed.</h2>
              <p>Relevant is built for decisions, not scrolling.</p>
            </div>
            <ComparisonColumn title="Generic alerts" rows={genericAlerts} muted />
            <ComparisonColumn title="Relevant" rows={relevantRows} />
          </div>
        </section>

        <section className="signal-section signal-audience-section" aria-labelledby="audience-title">
          <div className="signal-frame signal-section__center signal-reveal">
            <h2 id="audience-title">For people whose job depends on noticing change early.</h2>
          </div>
          <div className="signal-frame signal-audience-grid">
            {audiences.map(([title, body]) => (
              <article className="signal-audience-card signal-reveal" key={title}>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="signal-section signal-trust-section" aria-labelledby="trust-title">
          <div className="signal-frame signal-trust-grid">
            <div className="signal-section__copy signal-reveal">
              <h2 id="trust-title">Cited intelligence you can check.</h2>
              <p>
                Relevant is built to show its work. Important claims should connect back to the sources behind them, so professionals can use the output in real decisions.
              </p>
            </div>
            <TrustCard />
          </div>
        </section>

        <section id="access" className="signal-section signal-final-section" aria-labelledby="final-title">
          <div className="signal-frame signal-final-card">
            <div className="signal-final-card__copy">
              <h2 id="final-title">Stop catching up. Start showing up prepared.</h2>
              <p>
                Relevant gives you the professional awareness layer your role deserves: daily signals when the world changes, and on-demand intelligence when a decision is coming.
              </p>
              <div className="signal-hero__actions">
                <a href={APP_STORE_URL} className="signal-button signal-button--primary" target="_blank" rel="noopener noreferrer">Get Relevant</a>
                <a href="/signup" className="signal-button signal-button--secondary">Get started</a>
              </div>
              <p className="signal-hero__micro">Fewer updates. Better judgment. Clearer next moves.</p>
            </div>

            <div className="signal-app-store-panel">
              <span>Get the app</span>
              <AppStoreBadge />
              <p>Set your work context once. Let the app surface the signals worth opening.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="signal-footer">
        <div className="signal-frame signal-footer__inner">
          <div className="signal-footer__brand">
            <BrandMark />
            <p>Know what changed. See why it matters. Move prepared.</p>
            <AppStoreBadge />
          </div>
          <div className="signal-footer__group">
            <span>Social</span>
            <div className="signal-footer__social" aria-label="Social links">
              {socialLinks.map((link) => (
                <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <div className="signal-footer__group">
            <span>Company</span>
            <div className="signal-footer__links">
              <a href="/privacy">Privacy</a>
              <a href="/terms">Terms</a>
              <a href="mailto:support@getrelevantapp.com">Contact</a>
            </div>
          </div>
          <div className="signal-footer__group">
            <span>Explore</span>
            <div className="signal-footer__links">
              <a href="#signals" onClick={handleAnchorClick}>Mobile app</a>
              <a href="#intelligence" onClick={handleAnchorClick}>Intelligence Desk</a>
              <a href="#use-cases" onClick={handleAnchorClick}>Use Cases</a>
              <a href="#how-it-works" onClick={handleAnchorClick}>How it Works</a>
            </div>
          </div>
          <span className="signal-footer__copy">&copy; {currentYear} Relevant</span>
        </div>
      </footer>

      <div className={`signal-mobile-cta${showMobileCta ? ' is-visible' : ''}`}>
        <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">Get Relevant</a>
      </div>
    </div>
  )
}

function AppStoreBadge({ compact = false }: { compact?: boolean }) {
  return (
    <a className={`signal-app-store-badge${compact ? ' signal-app-store-badge--compact' : ''}`} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" aria-label="Download Relevant on the App Store">
      <Image
        src="/app-store-badge.svg"
        alt="Download on the App Store"
        width={120}
        height={40}
        unoptimized
      />
    </a>
  )
}

function ScreenshotSurfaceStrip({
  items,
  variant = 'default',
}: {
  items: ScreenshotSurface[]
  variant?: 'default' | 'beyond'
}) {
  return (
    <div className={`signal-frame signal-screenshot-strip signal-screenshot-strip--${variant}`}>
      {items.map((item, index) => (
        <motion.article
          className="signal-screenshot-card"
          key={item.label}
          initial={{ y: 34, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.58, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
        >
          <div>
            <span>{item.label}</span>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </div>
          <div className="signal-screenshot-card__image">
            <Image
              src={item.src}
              alt={item.alt}
              width={1290}
              height={item.height}
              sizes="(max-width: 900px) 78vw, 310px"
              className="signal-product-screenshot"
            />
          </div>
        </motion.article>
      ))}
    </div>
  )
}

function HeroIntelligenceVisual() {
  return (
    <motion.div
      className="signal-hero-visual"
      aria-label="Relevant signal cluster and source scanning preview"
      initial={false}
    >
      <motion.div
        className="signal-hero-scan-field"
        aria-hidden="true"
        initial={{ opacity: 0, y: 26, rotate: 0.4 }}
        animate={{ opacity: 0.84, y: 0, rotate: -0.6 }}
        transition={{ duration: 0.9, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="signal-hero-scan-field__header">
          <ScanLine size={15} />
          <span>AI checking live sources</span>
        </div>
        <div className="signal-hero-headline-cloud">
          {headlineStreams.slice(0, 6).map((item, index) => (
            <motion.span
              key={`${item.source}-${item.text}`}
              style={{ '--delay': `${index * 0.22}s` } as CSSProperties}
              initial={{ opacity: 0, x: 28 }}
              animate={{ opacity: [0.52, 1, 0.62], x: [18, 0, -12] }}
              transition={{
                duration: 4.8,
                delay: 0.26 + index * 0.13,
                repeat: Infinity,
                repeatType: 'mirror',
                ease: 'easeInOut',
              }}
            >
              <em>{item.source}</em>
              {item.text}
            </motion.span>
          ))}
        </div>
        <div className="signal-source-streams">
          <span />
          <span />
          <span />
          <span />
        </div>
      </motion.div>

      <motion.div
        className="signal-hero-context-pill signal-hero-context-pill--one"
        initial={{ opacity: 0, y: 14, scale: 0.94 }}
        animate={{ opacity: 1, y: [0, -6, 0], scale: 1 }}
        transition={{
          opacity: { duration: 0.45, delay: 0.5 },
          scale: { duration: 0.45, delay: 0.5 },
          y: { duration: 4.8, delay: 0.5, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        <Building2 size={14} />
        Shopify
      </motion.div>
      <motion.div
        className="signal-hero-context-pill signal-hero-context-pill--two"
        initial={{ opacity: 0, y: 14, scale: 0.94 }}
        animate={{ opacity: 1, y: [0, 6, 0], scale: 1 }}
        transition={{
          opacity: { duration: 0.45, delay: 0.68 },
          scale: { duration: 0.45, delay: 0.68 },
          y: { duration: 5.2, delay: 0.68, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        <BriefcaseBusiness size={14} />
        Founder
      </motion.div>

      <div className="signal-hero-cluster" aria-hidden="true">
        {heroSignals.map((shot, index) => {
          const baseRotate = index === 0 ? -2.4 : index === 1 ? 5 : 3

          return (
            <motion.div
              className={`signal-hero-signal ${shot.className}`}
              key={shot.src}
              initial={{ opacity: 0, y: 42, scale: 0.9, rotate: baseRotate - 2 }}
              animate={{
                opacity: 1,
                y: index === 0 ? [0, -8, 0] : index === 1 ? [0, 7, 0] : [0, -5, 0],
                scale: 1,
                rotate: baseRotate,
              }}
              transition={{
                opacity: { duration: 0.55, delay: 0.28 + index * 0.15 },
                scale: { duration: 0.55, delay: 0.28 + index * 0.15 },
                rotate: { duration: 0.75, delay: 0.28 + index * 0.15 },
                y: {
                  duration: index === 0 ? 5.8 : 6.6,
                  delay: 0.28 + index * 0.15,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }}
            >
              <span>{shot.label}</span>
              <Image
                src={shot.src}
                alt=""
                width={1290}
                height={index === 0 ? 1818 : 2796}
                sizes="(max-width: 900px) 76vw, 360px"
                className="signal-product-screenshot"
                priority={index === 0}
              />
            </motion.div>
          )
        })}
      </div>

      <motion.div
        className="signal-hero-output-card"
        initial={{ opacity: 0, x: 34, scale: 0.92 }}
        animate={{ opacity: 1, x: 0, scale: [1, 1.025, 1] }}
        transition={{
          opacity: { duration: 0.5, delay: 0.88 },
          x: { duration: 0.5, delay: 0.88 },
          scale: { duration: 4.4, delay: 0.88, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        <span><Sparkles size={13} /> Signal card</span>
        <p>What changed. Why it matters. What to do next.</p>
        <div>
          <em>3 source-backed reasons</em>
          <em>1 next move</em>
        </div>
      </motion.div>
    </motion.div>
  )
}

function HowItWorksVisualStory() {
  return (
    <div className="signal-frame signal-how-visual-grid signal-reveal" aria-label="How Relevant turns context into a signal">
      <article className="signal-how-visual-card signal-how-visual-card--context">
        <div className="signal-how-visual-card__top">
          <span>01</span>
          <h3>Tell Relevant the basics.</h3>
        </div>
        <div className="signal-context-input-grid">
          {contextInputs.map((input) => {
            const Icon = input.icon
            return (
              <div className="signal-context-input" key={input.label}>
                <Icon size={18} />
                <span>{input.label}</span>
                <strong>{input.value}</strong>
              </div>
            )
          })}
        </div>
      </article>

      <article className="signal-how-visual-card signal-how-visual-card--scan">
        <div className="signal-how-visual-card__top">
          <span>02</span>
          <h3>Relevant scans live sources.</h3>
        </div>
        <div className="signal-source-stream" aria-hidden="true">
          <div className="signal-source-stream__header">
            <span>Live source scan</span>
            <em>role lens active</em>
          </div>
          <div className="signal-source-stream__viewport">
            <div className="signal-source-stream__track">
              {[...sourceScanRows, ...sourceScanRows].map((item, index) => (
                <div
                  className={`signal-source-row${item.decision === 'Kept' ? ' signal-source-row--match' : ''}`}
                  key={`${item.source}-${item.company}-${index}`}
                >
                  <div className="signal-source-row__icon">
                    {item.source === 'Company filing' ? <Building2 size={15} /> : <Newspaper size={15} />}
                  </div>
                  <div className="signal-source-row__body">
                    <div>
                      <strong>{item.company}</strong>
                      <span>{item.source}</span>
                    </div>
                    <p>{item.text}</p>
                  </div>
                  <em>{item.decision}</em>
                </div>
              ))}
            </div>
          </div>
          <div className="signal-source-scan-card">
            <ScanLine size={18} />
            <strong>2,847 articles scanned</strong>
            <span>7 matched your context</span>
          </div>
        </div>
      </article>

      <article className="signal-how-visual-card signal-how-visual-card--output">
        <div className="signal-how-visual-card__top">
          <span>03</span>
          <h3>Relevant gives you the card.</h3>
        </div>
        <div className="signal-output-phone">
          <Image
            src="/marketing-screenshots/signal-card.png"
            alt="Relevant signal card output"
            width={1290}
            height={1818}
            sizes="(max-width: 900px) 74vw, 280px"
            className="signal-product-screenshot"
          />
        </div>
        <div className="signal-output-tags">
          <span>What changed</span>
          <span>Why it matters</span>
          <span>What to do next</span>
        </div>
      </article>
    </div>
  )
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="signal-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  )
}

function UseCasePreview({ useCase }: { useCase: (typeof useCases)[number] }) {
  const Icon = useCase.icon
  const [primaryLine, secondaryLine, tertiaryLine] = useCase.lines

  return (
    <div
      className={`signal-use-preview signal-use-preview--${useCase.tone}`}
      style={{ '--use-accent': useCase.accent } as CSSProperties}
      aria-hidden="true"
    >
      <div className="signal-use-preview__top">
        <span><Icon size={15} /> {useCase.label}</span>
        <em>{useCase.metric}</em>
      </div>
      <div className="signal-use-preview__stage">
        <div className="signal-use-preview__grid" />
        <div className="signal-use-preview__radar">
          <span />
          <span />
          <span />
        </div>
        <div className="signal-use-preview__brief">
          <span>{primaryLine[0]}</span>
          <strong>{primaryLine[1]}</strong>
        </div>
        <div className="signal-use-preview__note signal-use-preview__note--one">
          <span>{secondaryLine[0]}</span>
          <strong>{secondaryLine[1]}</strong>
        </div>
        <div className="signal-use-preview__note signal-use-preview__note--two">
          <span>{tertiaryLine[0]}</span>
          <strong>{tertiaryLine[1]}</strong>
        </div>
        <div className="signal-use-preview__rank">
          <i />
          <i />
          <i />
        </div>
        <div className="signal-use-preview__path" />
      </div>
      <div className="signal-use-preview__footer">
        {useCase.lines.map(([label]) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  )
}

function ComparisonColumn({ title, rows, muted = false }: { title: string; rows: string[]; muted?: boolean }) {
  return (
    <article className={`signal-compare-column${muted ? ' signal-compare-column--muted' : ''} signal-reveal`}>
      <h3>{title}</h3>
      <ul>
        {rows.map((row) => (
          <li key={row}>
            <Check size={15} />
            <span>{row}</span>
          </li>
        ))}
      </ul>
    </article>
  )
}

function TrustCard() {
  return (
    <article className="signal-trust-card signal-reveal">
      <div className="signal-trust-proof">
        <div className="signal-trust-source-stack" aria-label="Source proof examples">
          {sourceProofs.map((source, index) => (
            <div className="signal-trust-source" key={source.source} style={{ '--delay': `${index * 0.16}s` } as CSSProperties}>
              <span>{source.tag}</span>
              <strong>{source.source}</strong>
              <p>{source.detail}</p>
            </div>
          ))}
        </div>

        <div className="signal-trust-link-path" aria-hidden="true">
          <Link2 size={20} />
        </div>

        <div className="signal-trust-card__screen">
          <Image
            src="/marketing-screenshots/signal-detail.png"
            alt="Relevant full signal detail screen"
            width={1290}
            height={12645}
            sizes="(max-width: 900px) 84vw, 420px"
            className="signal-product-screenshot"
          />
        </div>
      </div>
      <span>Real signal detail</span>
      <h3>Sources, consequence, and next move stay in one place.</h3>
      <p>
        The full detail screen shows the signal with the source-backed context around it, so the user is not guessing why it matters.
      </p>
    </article>
  )
}
