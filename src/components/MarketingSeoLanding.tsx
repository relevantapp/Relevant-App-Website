import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import BrandMark from '@/components/BrandMark'
import type { MarketingSeoPage } from '@/lib/marketingSeoPages'

const APP_STORE_URL = 'https://apps.apple.com/app/id6756225699'

export function createMarketingSeoMetadata(page: MarketingSeoPage): Metadata {
  const url = `https://www.getrelevantapp.com/${page.slug}`

  return {
    title: page.metaTitle,
    description: page.description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${page.title} | Relevant`,
      description: page.description,
      url,
      siteName: 'Relevant',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: `${page.title} by Relevant`,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${page.title} | Relevant`,
      description: page.description,
      images: ['/og-image.png'],
    },
  }
}

export default function MarketingSeoLanding({ page }: { page: MarketingSeoPage }) {
  return (
    <main className="signal-home signal-seo-page">
      <nav className="signal-nav signal-nav--static" aria-label="Primary navigation">
        <div className="signal-frame signal-nav__inner">
          <div className="signal-nav__brand">
            <BrandMark href="/" />
            <span className="signal-nav__product">Role-aware intelligence</span>
          </div>
          <div className="signal-nav__actions">
            <Link href="/login" className="signal-nav__signin">Sign in</Link>
            <Link href="/signup" className="signal-nav__cta">Start a first brief</Link>
          </div>
        </div>
      </nav>

      <section className="signal-seo-hero">
        <div className="signal-frame signal-seo-hero__grid">
          <div>
            <p className="signal-eyebrow signal-eyebrow--blue">{page.eyebrow}</p>
            <h1>{page.hero}</h1>
            <p>{page.body}</p>
            <div className="signal-hero__actions">
              <Link href="/signup" className="signal-button signal-button--primary">
                {page.primaryCta}
              </Link>
              <a href={APP_STORE_URL} className="signal-button signal-button--secondary" target="_blank" rel="noopener noreferrer">
                {page.secondaryCta}
              </a>
            </div>
          </div>

          <div className="signal-seo-proof-card" aria-label={`${page.title} proof points`}>
            <span>Signal frame</span>
            <h2>What changed. Why it matters. What to do next.</h2>
            <div>
              {page.proof.map((item) => (
                <em key={item}>{item}</em>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="signal-section signal-seo-section" aria-label={`${page.title} process`}>
        <div className="signal-frame signal-step-grid">
          {page.sections.map((section, index) => (
            <article className="signal-step-card" key={section.title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="signal-section signal-final-section" aria-label={`${page.title} access`}>
        <div className="signal-frame signal-final-card">
          <div className="signal-final-card__copy">
            <h2>Move with the signal, not the noise.</h2>
            <p>{page.description}</p>
            <div className="signal-hero__actions">
              <Link href="/signup" className="signal-button signal-button--primary">
                Start a first brief <ArrowRight size={16} />
              </Link>
              <Link href="/" className="signal-button signal-button--secondary">
                Back to homepage
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
