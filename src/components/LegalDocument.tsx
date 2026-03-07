import type { ReactNode } from 'react'
import Link from 'next/link'

import BrandMark from '@/components/BrandMark'

export type LegalSection = {
  title: string
  body: ReactNode
}

type LegalDocumentProps = {
  eyebrow: string
  title: string
  intro: string
  effectiveDate: string
  secondaryHref: string
  secondaryLabel: string
  sections: LegalSection[]
}

export default function LegalDocument({
  eyebrow,
  title,
  intro,
  effectiveDate,
  secondaryHref,
  secondaryLabel,
  sections,
}: LegalDocumentProps) {
  const currentYear = new Date().getFullYear()

  return (
    <main className="brand-page">
      <header className="site-nav brand-page-nav">
        <div className="site-frame site-nav-inner brand-page-nav-inner">
          <BrandMark href="/" />

          <div className="brand-page-nav-actions">
            <Link href="/" className="btn btn-ghost">
              Back home
            </Link>
            <Link href={secondaryHref} className="btn btn-ghost">
              {secondaryLabel}
            </Link>
          </div>
        </div>
      </header>

      <section className="brand-page-main">
        <div className="site-frame brand-page-stack">
          <div className="section-heading brand-page-heading">
            <span className="section-kicker">{eyebrow}</span>
            <h1 className="brand-page-title">{title}</h1>
            <p>{intro}</p>
          </div>

          <div className="brand-meta-row">
            <article className="brand-meta-card mirror-card">
              <span className="surface-label">Effective date</span>
              <strong>{effectiveDate}</strong>
            </article>

            <article className="brand-meta-card mirror-card">
              <span className="surface-label">Contact</span>
              <a className="brand-inline-link" href="mailto:support@getrelevantapp.com">
                support@getrelevantapp.com
              </a>
            </article>

            <article className="brand-meta-card mirror-card">
              <span className="surface-label">Scope</span>
              <strong>Website, product access, and account use</strong>
            </article>
          </div>

          <article className="legal-article mirror-card">
            {sections.map((section) => (
              <section key={section.title} className="legal-section">
                <h2>{section.title}</h2>
                <div className="legal-section-body">{section.body}</div>
              </section>
            ))}
          </article>
        </div>
      </section>

      <footer className="site-footer">
        <div className="site-frame footer-inner">
          <p>© {currentYear} Relevant</p>
          <div className="footer-links">
            <Link href="/">Home</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <a href="mailto:support@getrelevantapp.com">support@getrelevantapp.com</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
