'use client'

import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  Check,
  Circle,
  ChevronRight,
  Factory,
  Handshake,
  MapPin,
  Moon,
  PhoneCall,
  Rocket,
  ScanLine,
  Sun,
  Telescope,
} from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { type CSSProperties, MouseEvent, useEffect, useState } from 'react'
import BrandMark from '@/components/BrandMark'

type ThemeMode = 'dark' | 'light'
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
    label: 'Small set',
    text: 'A small set of updates worth your attention.',
  },
  {
    label: 'Role-aware',
    text: 'Ranked against your company, role, industry, and market.',
  },
  {
    label: 'Consequence',
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
    className: 'signal-hero-signal--primary',
  },
  {
    src: '/marketing-screenshots/detail-what-happened.png',
    className: 'signal-hero-signal--left',
  },
  {
    src: '/marketing-screenshots/detail-why-matters.png',
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
  { source: 'Reuters', logo: 'Reuters', text: 'Enterprise AI budgets shift toward workflow tools' },
  { source: 'SEC', logo: 'SEC', text: 'Public filing shows rising cloud infrastructure spend' },
  { source: 'The Information', logo: 'The Information', text: 'New pricing pressure hits vertical SaaS vendors' },
  { source: 'Financial Times', logo: 'Financial Times', text: 'Cross-border data rules move through committee' },
  { source: 'Bloomberg', logo: 'Bloomberg', text: 'Payments platform expands partnership channel' },
  { source: 'CB Insights', logo: 'CB Insights', text: 'Seed funding concentrates around operational AI' },
  { source: 'Axios', logo: 'Axios', text: 'Retail tech buyers slow discretionary software spend' },
  { source: 'TechCrunch', logo: 'TechCrunch', text: 'Workflow automation startup launches enterprise suite' },
]

const sourceScanRows = [
  {
    source: 'Reuters',
    logo: 'Reuters',
    company: 'Shopify',
    text: 'Supplier pricing pressure rises after import-cost ruling',
    decision: 'Kept',
    reason: 'Operational exposure',
  },
  {
    source: 'SEC filing',
    logo: 'SEC',
    company: 'Stripe',
    text: 'New logistics note changes near-term margin forecast',
    decision: 'Kept',
    reason: 'Direct company impact',
  },
  {
    source: 'Financial Times',
    logo: 'Financial Times',
    company: 'HubSpot',
    text: 'Competitor starts discounting in the same buyer segment',
    decision: 'Kept',
    reason: 'Competitive move',
  },
  {
    source: 'TechCrunch',
    logo: 'TechCrunch',
    company: 'OpenAI',
    text: 'Broad AI productivity survey gets recirculated',
    decision: 'Skipped',
    reason: 'Weak role fit',
  },
  {
    source: 'The Verge',
    logo: 'The Verge',
    company: 'Apple',
    text: 'Committee date moves for cross-border data rules',
    decision: 'Kept',
    reason: 'Timing risk',
  },
  {
    source: 'WSJ',
    logo: 'WSJ',
    company: 'Salesforce',
    text: 'Customer segment repeats the same procurement objection',
    decision: 'Kept',
    reason: 'Sales signal',
  },
  {
    source: 'Bloomberg',
    logo: 'Bloomberg',
    company: 'Nvidia',
    text: 'Enterprise buyers delay hardware spend into next quarter',
    decision: 'Skipped',
    reason: 'Low direct impact',
  },
  {
    source: 'The Information',
    logo: 'The Information',
    company: 'Datadog',
    text: 'Usage-based pricing pressure appears in mid-market accounts',
    decision: 'Kept',
    reason: 'Margin signal',
  },
]

const sourceProofs = [
  {
    source: 'Reuters',
    detail: '"The new rule moves the effective date forward for importers."',
  },
  {
    source: 'Wall Street Journal',
    detail: '"Suppliers are preparing price changes ahead of the ruling."',
  },
  {
    source: 'Financial Times',
    detail: '"Buyers are asking for revised terms before contracts renew."',
  },
  {
    source: 'SEC filing',
    detail: '"Import costs are listed as a material operating exposure."',
  },
]

const useCases = [
  {
    tone: 'meeting',
    icon: CalendarClock,
    title: 'Before a meeting',
    body: 'Turn recent account and market changes into the few points worth bringing into the room.',
    illustration: '/marketing-illustrations/use-case-00.png',
    label: 'Room brief',
    metric: 'Prepared brief',
    lines: [
      ['What changed', 'Recent moves since the last conversation.'],
      ['Why it matters', 'The risk or opening the room may miss.'],
      ['What to ask', 'A sharper first question for the meeting.'],
    ],
  },
  {
    tone: 'customer',
    icon: PhoneCall,
    title: 'Before a customer call',
    body: 'Know what shifted around the account before you open the conversation.',
    illustration: '/marketing-illustrations/use-case-01.png',
    label: 'Account pulse',
    metric: 'Account signal',
    lines: [
      ['What changed', 'New pressure on their business.'],
      ['Why it matters', 'The category signal shaping urgency.'],
      ['What to do', 'Where the conversation can move next.'],
    ],
  },
  {
    tone: 'strategy',
    icon: Telescope,
    title: 'Before a strategy decision',
    body: 'Separate real evidence from background noise before the decision hardens.',
    illustration: '/marketing-illustrations/use-case-02.png',
    label: 'Decision map',
    metric: 'Tradeoff map',
    lines: [
      ['What changed', 'The outside evidence that is actually moving.'],
      ['Why it matters', 'The tradeoff that gets harder if you wait.'],
      ['What to test', 'The decision path to pressure-test.'],
    ],
  },
  {
    tone: 'launch',
    icon: Rocket,
    title: 'Before a launch',
    body: 'Catch competitor moves, category shifts, and timing risks before the launch window closes.',
    illustration: '/marketing-illustrations/use-case-03.png',
    label: 'Launch radar',
    metric: 'Timing read',
    lines: [
      ['What changed', 'Competitor or category movement.'],
      ['Why it matters', 'Where the launch could meet resistance.'],
      ['What to watch', 'The signal to monitor after launch.'],
    ],
  },
  {
    tone: 'investor',
    icon: Handshake,
    title: 'Before an investor conversation',
    body: 'Show command of the market changes behind the company story.',
    illustration: '/marketing-illustrations/use-case-04.png',
    label: 'Board packet',
    metric: 'Proof ready',
    lines: [
      ['What changed', 'The category shift worth naming.'],
      ['Why it matters', 'A cited reason the shift changes the story.'],
      ['What to answer', 'The follow-up you can handle cleanly.'],
    ],
  },
  {
    tone: 'week',
    icon: BarChart3,
    title: 'Before the week starts',
    body: 'Start with the handful of signals that can actually change the week.',
    illustration: '/marketing-illustrations/use-case-05.png',
    label: 'Week scan',
    metric: 'Ranked week',
    lines: [
      ['What changed', 'The update most worth your time.'],
      ['Why it matters', 'The consequence for your role.'],
      ['What to do', 'The watchpoint, question, or action.'],
    ],
  },
] as const

const audienceRows = [
  [
    'Founders',
    'Operators',
    'Product managers',
    'Analysts',
    'Investors',
    'Chiefs of staff',
    'Strategy leads',
    'Revenue leaders',
    'Sales leads',
    'Partnerships leads',
    'Consultants',
    'Account managers',
    'Product marketers',
    'GTM leads',
    'Customer success',
    'Finance leads',
    'Policy leads',
    'Comms leads',
    'Growth leads',
    'Market researchers',
    'BizOps teams',
    'RevOps teams',
    'Category owners',
    'Platform leads',
    'Launch leads',
    'Board advisors',
    'Venture teams',
    'Portfolio managers',
    'Corporate development',
    'Competitive intelligence',
    'Innovation teams',
    'Procurement leads',
    'Supply chain leads',
    'Risk leads',
    'Legal counsel',
    'Talent leads',
  ],
  [
    'General managers',
    'Department heads',
    'Research leads',
    'Data leaders',
    'Editorial teams',
    'Agency partners',
    'Startup teams',
    'Enterprise teams',
    'Founding teams',
    'Product strategists',
    'Commercial leads',
    'Client partners',
    'Investor relations',
    'Business case owners',
    'Market entry teams',
    'Pricing teams',
    'Field teams',
    'Solution consultants',
    'Enablement leads',
    'Due diligence teams',
    'Board operators',
    'Functional leaders',
    'Program managers',
    'Transformation teams',
    'Research desks',
    'Industry specialists',
    'M&A teams',
    'Policy operators',
    'Regulatory teams',
    'Communications teams',
    'Brand leaders',
    'Executive assistants',
    'Decision makers',
    'People who act',
    'People in the room',
    'People on the hook',
  ],
] as const

const comparisonCards = [
  {
    tone: 'muted',
    label: 'Generic alerts',
    title: 'A notification with work attached.',
    body: 'Most tools hand you a link, a headline, and the job of deciding whether it matters.',
    rows: [
      'Everything looks equally urgent',
      'The same summary goes to everyone',
      'Duplicates stack up across sources',
      'You still have to decide the next move',
    ],
  },
  {
    tone: 'active',
    label: 'Relevant',
    title: 'A signal with judgment attached.',
    body: 'Relevant ranks the change against your role, company, market, and decision window.',
    rows: [
      'Fewer signals, ranked by consequence',
      'Your work context shapes the answer',
      'Related updates stay connected',
      'The next move is visible',
    ],
  },
] as const

const comparisonProofs = [
  ['What changed', 'The event, company, source, and timing are separated from the noise.'],
  ['Why it matters', 'Relevant explains the consequence for your role and current work.'],
  ['What to do next', 'You get the watchpoint, question, or action while the window is still open.'],
] as const

const socialLinks = [
  { label: 'Instagram', href: 'https://www.instagram.com/relevant.app/', platform: 'instagram' },
  { label: 'TikTok', href: 'https://www.tiktok.com/@relevant.app', platform: 'tiktok' },
  { label: 'X', href: 'https://twitter.com/relevant', platform: 'x' },
  { label: 'LinkedIn', href: 'https://linkedin.com/company/relevant', platform: 'linkedin' },
] as const

type SocialPlatform = (typeof socialLinks)[number]['platform']

function applyTheme(nextTheme: ThemeMode) {
  document.documentElement.dataset.theme = nextTheme
  document.documentElement.style.colorScheme = nextTheme
  localStorage.setItem('relevant-site-theme', nextTheme)
}

export default function Home() {
  const [theme, setTheme] = useState<ThemeMode>('dark')
  const [navScrolled, setNavScrolled] = useState(false)
  const [navHidden, setNavHidden] = useState(false)
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
    const getScrollY = () => window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0
    let previousScrollY = getScrollY()
    let ticking = false

    const syncNav = () => {
      const currentScrollY = getScrollY()
      const scrollDelta = currentScrollY - previousScrollY

      setNavScrolled(currentScrollY > 12)

      if (currentScrollY < 96) {
        setNavHidden(false)
      } else if (Math.abs(scrollDelta) > 6) {
        setNavHidden(scrollDelta > 0)
      }

      previousScrollY = currentScrollY
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

  return (
    <div className="signal-home">
      <nav className={`signal-nav${navScrolled ? ' is-scrolled' : ''}${navHidden ? ' is-hidden' : ''}`} aria-label="Primary navigation">
        <div className="signal-frame signal-nav__inner">
          <div className="signal-nav__brand">
            <BrandMark href="#top" onClick={handleAnchorClick} />
            <span className="signal-nav__product">Role-aware intelligence</span>
          </div>
          <div className="signal-nav__links">
            <a href="#signals" onClick={handleAnchorClick}>Signals</a>
            <a href="#intelligence" onClick={handleAnchorClick}>Intelligence Desk</a>
            <a href="#use-cases" onClick={handleAnchorClick}>Use Cases</a>
            <a href="#how-it-works" onClick={handleAnchorClick}>How it Works</a>
          </div>
          <div className="signal-nav__actions">
            <a href="/login" className="signal-nav__signin">Sign in</a>
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
            <a href="/signup" className="signal-nav__cta">Get started</a>
          </div>
        </div>
      </nav>

      <div className={`signal-app-marquee${navHidden ? ' is-hidden' : ''}`} aria-label="Relevant app availability">
        <div className="signal-app-marquee__track">
          {Array.from({ length: 8 }, (_, group) => (
            <div className="signal-app-marquee__group" key={group}>
              <span>The app is live</span>
              <span>Free early access</span>
              <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">Get Relevant</a>
              <span>More clarity. Less noise.</span>
            </div>
          ))}
        </div>
      </div>

      <main id="top">
        <section className="signal-hero" aria-labelledby="home-title">
          <div className="signal-frame signal-hero__grid">
            <div className="signal-hero__copy">
              <p className="signal-eyebrow">AI-powered. Role-aware.</p>
              <h1 id="home-title">The intelligence platform for people who can&apos;t miss what changed.</h1>
              <p>
                Relevant watches the companies, topics, and market moves around your work, then turns them into short briefs: what changed, why it matters, and what to do next.
              </p>
              <div className="signal-hero__actions">
                <a href="/signup" className="signal-button signal-button--primary">Get started</a>
                <a href={APP_STORE_URL} className="signal-button signal-button--secondary" target="_blank" rel="noopener noreferrer">Download on the App Store</a>
              </div>
              <p className="signal-hero__micro">
                Free early access. Built for decisions, not scrolling.
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
              <h2 id="signals-title">More clarity. Less noise.</h2>
              <p>
                Open the app, set your work context, and get the few signals that matter to your role: competitors, customers, markets, policy, technology, people, and companies you care about.
              </p>
              <a href={APP_STORE_URL} className="signal-inline-cta" target="_blank" rel="noopener noreferrer">
                Download the app <ArrowRight size={16} />
              </a>
              <p className="signal-cta-note">Free early access on iPhone.</p>
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
              <span className="signal-access-note">Free - early access</span>
              <h3>Get Relevant working for your next decision.</h3>
              <p>Create your account, set your work context, and start from the app instead of another blank research tab.</p>
            </div>
            <div className="signal-brief-cta">
              <a href="/signup" className="signal-button signal-button--primary">
                Get started <ArrowRight size={16} />
              </a>
              <p>No credit card required during early access.</p>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="signal-section signal-how-section" aria-labelledby="how-title">
          <div className="signal-frame signal-section__center signal-reveal">
            <h2 id="how-title" className="signal-stacked-title">
              <span>Four inputs.</span>
              <span>Thousands of checks.</span>
              <span>One useful signal.</span>
            </h2>
            <p>
              Relevant starts with your work context, scans the outside world against it, and gives you the update that deserves attention.
            </p>
          </div>
          <HowItWorksVisualStory />
        </section>

        <section id="use-cases" className="signal-section signal-use-section" aria-labelledby="use-title">
          <div className="signal-frame signal-section__center signal-reveal">
            <h2 id="use-title">Know what to say before the meeting, call, or decision.</h2>
            <p>Relevant turns company, market, and competitor changes into a short brief for the situation ahead: what changed, why it matters, and what to say or do next.</p>
          </div>
          <div className="signal-frame signal-use-grid">
            {useCases.map((useCase) => (
              <article className="signal-use-card signal-reveal" key={useCase.title}>
                <UseCasePreview useCase={useCase} />
                <div className="signal-use-card__copy">
                  <h3>{useCase.title}</h3>
                  <p>{useCase.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="signal-section signal-compare-section" aria-labelledby="compare-title">
          <div className="signal-frame signal-compare-shell">
            <div className="signal-compare-copy signal-reveal">
              <p className="signal-eyebrow signal-eyebrow--blue">Relevant vs. generic alerts</p>
              <h2 id="compare-title">Alerts say something happened. Relevant says what to do with it.</h2>
              <p>
                The difference is judgment. Relevant does not make you open ten links to find the one move that matters.
              </p>
              <div className="signal-compare-actions">
                <a href={APP_STORE_URL} className="signal-button signal-button--primary" target="_blank" rel="noopener noreferrer">
                  Download the app <ArrowRight size={16} />
                </a>
                <a href="/signup" className="signal-button signal-button--secondary">
                  Get started
                </a>
                <p className="signal-cta-note signal-cta-note--compare">Free early access. No credit card required.</p>
              </div>
            </div>

            <ComparisonShowcase />
          </div>
        </section>

        <section className="signal-section signal-audience-section" aria-labelledby="audience-title">
          <div className="signal-frame signal-section__center signal-reveal">
            <h2 id="audience-title">For people whose job depends on noticing change early.</h2>
            <p>Relevant is built for the people expected to know what moved, why it matters, and what should happen next.</p>
          </div>
          <div className="signal-audience-marquee signal-reveal" aria-label="Roles Relevant is built for">
            {audienceRows.map((row, rowIndex) => (
              <div className="signal-audience-marquee__row" data-direction={rowIndex === 0 ? 'left' : 'right'} key={`audience-row-${rowIndex}`}>
                <div className="signal-audience-marquee__track">
                  {[...row, ...row].map((role, index) => (
                    <span key={`${role}-${index}`}>{role}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="signal-section signal-trust-section" aria-labelledby="trust-title">
          <div className="signal-frame signal-trust-grid">
            <div className="signal-section__copy signal-reveal">
              <h2 id="trust-title">Cited intelligence you can check.</h2>
              <p>
                Every important point keeps the source attached, so you can see which publisher, filing, or report it came from before you trust it.
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
                <a href={APP_STORE_URL} className="signal-button signal-button--primary" target="_blank" rel="noopener noreferrer">Download the app</a>
                <a href="/signup" className="signal-button signal-button--secondary">Get started</a>
              </div>
              <p className="signal-hero__micro">Free early access. Fewer updates. Better judgment. Clearer next moves.</p>
            </div>

            <div className="signal-app-store-panel">
              <span>Free early access</span>
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
            <div className="signal-footer__brand-actions">
              <span>More clarity. Less noise.</span>
            </div>
          </div>
          <div className="signal-footer__group">
            <span>Social</span>
            <div className="signal-footer__social" aria-label="Social links">
              {socialLinks.map((link) => (
                <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" aria-label={link.label}>
                  <SocialLogo platform={link.platform} />
                  <span>{link.label}</span>
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
    </div>
  )
}

function SocialLogo({ platform }: { platform: SocialPlatform }) {
  if (platform === 'instagram') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
        <path d="M12 2.16c3.2 0 3.58.02 4.85.07 3.25.15 4.77 1.7 4.92 4.92.05 1.27.07 1.65.07 4.85s-.02 3.58-.07 4.85c-.15 3.23-1.67 4.77-4.92 4.92-1.27.05-1.65.07-4.85.07s-3.58-.02-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.05-1.27-.07-1.65-.07-4.85s.02-3.58.07-4.85c.15-3.23 1.66-4.77 4.92-4.92 1.27-.05 1.65-.07 4.85-.07ZM12 0C8.74 0 8.33.01 7.05.07 2.69.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98 1.28.06 1.69.07 4.95.07s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.35-2.63-6.78-6.98-6.98C15.67.01 15.26 0 12 0Zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.41-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88Z" />
      </svg>
    )
  }

  if (platform === 'tiktok') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.3 0 .58.04.86.13V9.4a6.34 6.34 0 0 0-5.25 10.97 6.34 6.34 0 0 0 10.73-4.7V8.74a8.16 8.16 0 0 0 4.77 1.53V6.69Z" />
      </svg>
    )
  }

  if (platform === 'x') {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
        <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.22-6.82-5.96 6.82H1.68l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z" />
      </svg>
    )
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04s-2.13 1.45-2.13 2.94v5.67H9.35V9h3.42v1.56h.04c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13Zm1.78 13.02H3.56V9h3.56v11.45ZM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.73V1.73C24 .77 23.21 0 22.23 0Z" />
    </svg>
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
          <i aria-hidden="true" />
          <span>Live source scan</span>
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
              <em className="signal-publisher-wordmark">{item.logo}</em>
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
        Shopify store
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
        Store founder
      </motion.div>

      <div className="signal-hero-cluster" aria-hidden="true">
        {heroSignals.map((shot, index) => {
          const floatPath = index === 0 ? [0, -4, 0] : [0, 3, 0]

          return (
            <motion.div
              className={`signal-hero-signal ${shot.className}`}
              key={shot.src}
              initial={{ opacity: 0, y: 28, scale: index === 0 ? 0.94 : 0.9 }}
              animate={{
                opacity: 1,
                y: floatPath,
                scale: 1,
              }}
              transition={{
                opacity: { duration: 0.55, delay: 0.28 + index * 0.15 },
                scale: { duration: 0.55, delay: 0.28 + index * 0.15 },
                y: {
                  duration: index === 0 ? 6.2 : 7,
                  delay: 0.28 + index * 0.15,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }}
            >
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
        <div className="signal-how-visual-body signal-how-visual-body--context">
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
        </div>
        <div className="signal-how-card-copy">
          <strong>{howSteps[0][0]}</strong>
          <p>{howSteps[0][1]}</p>
        </div>
      </article>

      <article className="signal-how-visual-card signal-how-visual-card--scan">
        <div className="signal-how-visual-card__top">
          <span>02</span>
          <h3>Relevant scans live sources.</h3>
        </div>
        <div className="signal-how-visual-body signal-how-visual-body--scan">
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
                    <div className="signal-source-row__logo" aria-hidden="true">
                      <span>{item.logo}</span>
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
              <div className="signal-source-metric signal-source-metric--read">
                <strong>2,847</strong>
                <span>read</span>
              </div>
              <div className="signal-source-metric signal-source-metric--matched">
                <strong>7</strong>
                <span>matched to you</span>
              </div>
            </div>
          </div>
        </div>
        <div className="signal-how-card-copy">
          <strong>{howSteps[1][0]}</strong>
          <p>{howSteps[1][1]}</p>
        </div>
      </article>

      <article className="signal-how-visual-card signal-how-visual-card--output">
        <div className="signal-how-visual-card__top">
          <span>03</span>
          <h3>Relevant gives you the card.</h3>
        </div>
        <div className="signal-how-visual-body signal-how-visual-body--output">
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
        </div>
        <div className="signal-how-card-copy">
          <strong>{howSteps[2][0]}</strong>
          <p>{howSteps[2][1]}</p>
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

  return (
    <div
      className={`signal-use-preview signal-use-preview--${useCase.tone}`}
      aria-hidden="true"
    >
      <div className="signal-use-preview__top">
        <span><Icon size={15} /> {useCase.label}</span>
        <em>{useCase.metric}</em>
      </div>
      <div className="signal-use-image">
        <Image
          src={useCase.illustration}
          alt=""
          width={512}
          height={512}
          sizes="(max-width: 720px) calc(100vw - 84px), 320px"
        />
      </div>
      <div className="signal-use-preview__brief">
        {useCase.lines.map(([label, detail]) => (
          <div className="signal-use-preview__row" key={label}>
            <strong>{label}</strong>
            <p>{detail}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ComparisonShowcase() {
  return (
    <div className="signal-compare-board signal-reveal">
      <div className="signal-compare-board__top">
        <span>Decision layer</span>
        <p>Same outside-world change. Different outcome.</p>
      </div>
      <div className="signal-compare-card-grid">
        {comparisonCards.map((card) => (
          <article
            className={`signal-compare-column signal-compare-column--${card.tone}`}
            key={card.label}
          >
            <span>{card.label}</span>
            <h3>{card.title}</h3>
            <p>{card.body}</p>
            <ul>
              {card.rows.map((row) => (
                <li key={row}>
                  {card.tone === 'muted' ? <Circle size={10} /> : <Check size={15} />}
                  <span>{row}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <div className="signal-compare-proof-grid">
        {comparisonProofs.map(([title, body]) => (
          <div className="signal-compare-proof" key={title}>
            <strong>{title}</strong>
            <p>{body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function TrustCard() {
  return (
    <article className="signal-trust-card signal-reveal">
      <div className="signal-trust-publishers" aria-label="Publisher source examples">
        {sourceProofs.map((source) => (
          <div className="signal-trust-publisher" key={source.source}>
            <span>{source.source}</span>
            <p>{source.detail}</p>
          </div>
        ))}
      </div>
      <span>Source-backed signal</span>
      <h3>Open the source behind every claim.</h3>
      <p>
        Relevant does not ask people to trust a black box. It keeps the article, filing, or report visible next to the intelligence.
      </p>
    </article>
  )
}
