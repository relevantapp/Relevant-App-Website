import type { ReactNode } from 'react'
import Link from 'next/link'

import BrandMark from '@/components/BrandMark'
import { siteConfig } from '@/config/content'

export type LegalSection = {
  id: string
  title: string
  body: ReactNode
}

export type LegalFact = {
  label: string
  value: ReactNode
  detail?: ReactNode
}

type LegalDocumentProps = {
  eyebrow: string
  title: string
  intro: string
  effectiveDate: string
  secondaryHref: string
  secondaryLabel: string
  sections: LegalSection[]
  facts: LegalFact[]
  calloutTitle: string
  calloutBody: ReactNode
}

export default function LegalDocument({
  eyebrow,
  title,
  intro,
  effectiveDate,
  secondaryHref,
  secondaryLabel,
  sections,
  facts,
  calloutTitle,
  calloutBody,
}: LegalDocumentProps) {
  const currentYear = new Date().getFullYear()
  const factCards: LegalFact[] = [{ label: 'Effective date', value: effectiveDate }, ...facts]

  return (
    <main className="legal-page">
      <header className="site-nav">
        <div className="site-frame site-nav-inner legal-nav-inner">
          <BrandMark href="/" />

          <div className="legal-nav-actions">
            <Link href="/" className="btn-secondary legal-nav-link">
              Back home
            </Link>
            <Link href={secondaryHref} className="btn-secondary legal-nav-link">
              {secondaryLabel}
            </Link>
          </div>
        </div>
      </header>

      <section className="legal-page-main">
        <div className="site-frame legal-page-stack">
          <section className="legal-hero legal-card">
            <div className="legal-hero-copy">
              <span className="section-kicker">{eyebrow}</span>
              <h1 className="legal-page-title">{title}</h1>
              <p className="legal-page-intro">{intro}</p>
            </div>

            <div className="legal-fact-grid">
              {factCards.map((fact) => (
                <article key={fact.label} className="legal-fact-card">
                  <span className="legal-fact-label">{fact.label}</span>
                  <div className="legal-fact-value">{fact.value}</div>
                  {fact.detail ? <div className="legal-fact-detail">{fact.detail}</div> : null}
                </article>
              ))}
            </div>
          </section>

          <div className="legal-layout">
            <aside className="legal-sidebar">
              <div className="legal-sidebar-card">
                <span className="legal-sidebar-label">On this page</span>
                <nav className="legal-toc" aria-label={`${title} sections`}>
                  {sections.map((section) => (
                    <a key={section.id} href={`#${section.id}`}>
                      {section.title}
                    </a>
                  ))}
                </nav>
              </div>

              <div className="legal-sidebar-card legal-sidebar-callout">
                <span className="legal-sidebar-label">Quick answers</span>
                <h2>{calloutTitle}</h2>
                <div className="legal-callout-body">{calloutBody}</div>
              </div>
            </aside>

            <article className="legal-card legal-article">
              {sections.map((section) => (
                <section key={section.id} id={section.id} className="legal-section">
                  <h2>{section.title}</h2>
                  <div className="legal-section-body">{section.body}</div>
                </section>
              ))}
            </article>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="site-frame footer-inner">
          <p>© {currentYear} Relevant</p>
          <div className="footer-links">
            <Link href="/">Home</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
