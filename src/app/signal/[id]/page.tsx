import type { Metadata } from 'next'
import Link from 'next/link'

import BrandMark from '@/components/BrandMark'

type SignalSource = {
  url: string
  label: string
}

type ConsequenceBranch = {
  scenario: string
  likelihood: 'likely' | 'possible' | 'unlikely_but_severe'
  detail: string
}

type ConsequenceStep = {
  dimension: string
  category: string
  type: string
  weight: number
  chain: string
  fullChain: string
  articleChain?: string
  branches?: ConsequenceBranch[]
}

type PublicSignal = {
  id: string
  headline: string
  what_happened: string[]
  why_it_matters: string[]
  synthesis: string | null
  sources: SignalSource[]
  imageUrl: string | null
  consequence_steps: ConsequenceStep[]
  what_to_watch: string[] | null
}

type SignalResponse =
  | { success: true; signal: PublicSignal }
  | { success: false; error: string }

type PageProps = {
  params: {
    id: string
  }
}

const SIGNAL_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function likelihoodLabel(value: ConsequenceBranch['likelihood']): string {
  if (value === 'likely') return 'Likely'
  if (value === 'possible') return 'Possible'
  return 'Unlikely but severe'
}

function likelihoodColor(value: ConsequenceBranch['likelihood']): string {
  if (value === 'likely') return 'var(--sp-likely)'
  if (value === 'possible') return 'var(--sp-possible)'
  return 'var(--sp-severe)'
}

async function fetchSignal(id: string): Promise<SignalResponse> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (!base) {
    return {
      success: false,
      error:
        'Signal backend is not configured. Set NEXT_PUBLIC_SUPABASE_URL in Vercel for this website.',
    }
  }

  try {
    const response = await fetch(
      `${base.replace(/\/$/, '')}/functions/v1/public-signal?signal=${encodeURIComponent(id)}`,
      {
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store',
      },
    )

    const payload = (await response.json().catch(() => null)) as SignalResponse | null

    if (!response.ok || !payload || !payload.success) {
      return {
        success: false,
        error: payload && !payload.success ? payload.error : 'Signal unavailable',
      }
    }

    return payload
  } catch {
    return {
      success: false,
      error: 'Could not load this signal right now.',
    }
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  if (!SIGNAL_ID_PATTERN.test(params.id)) {
    return {
      title: 'Relevant — Signal',
      description: 'A signal shared from Relevant.',
    }
  }

  const result = await fetchSignal(params.id)
  if (!result.success) {
    return {
      title: 'Relevant — Signal',
      description: 'A signal shared from Relevant.',
    }
  }

  const summary =
    result.signal.synthesis ||
    result.signal.why_it_matters[0] ||
    result.signal.what_happened[0] ||
    'A signal shared from Relevant.'

  return {
    title: `${result.signal.headline} — Relevant`,
    description: summary,
    openGraph: {
      title: result.signal.headline,
      description: summary,
      type: 'article',
      siteName: 'Relevant',
      images: result.signal.imageUrl ? [{ url: result.signal.imageUrl }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: result.signal.headline,
      description: summary,
    },
  }
}

/* ── Error / empty shell ─────────────────────────────────────── */
function ErrorShell({ title, body }: { title: string; body: string }) {
  return (
    <main className="sp-page">
      <div className="sp-hero-empty">
        <nav className="sp-nav">
          <BrandMark href="/" />
          <Link className="btn-primary sp-nav-cta" href="/#access">Get Relevant</Link>
        </nav>
      </div>
      <div className="sp-body">
        <div className="sp-card sp-card--center">
          <span className="sp-eyebrow">Shared signal</span>
          <h1 className="sp-headline">{title}</h1>
          <p className="sp-synthesis">{body}</p>
          <div className="sp-actions">
            <Link className="btn-primary sp-btn" href="/#access">Request access</Link>
          </div>
        </div>
      </div>
    </main>
  )
}

/* ── Main page ───────────────────────────────────────────────── */
export default async function SignalPage({ params }: PageProps) {
  const id = params.id.trim()

  if (!SIGNAL_ID_PATTERN.test(id)) {
    return <ErrorShell title="Signal unavailable" body="This link is invalid. Request access to get the full Relevant signal flow." />
  }

  const result = await fetchSignal(id)

  if (!result.success) {
    return <ErrorShell title="Signal unavailable" body={result.error} />
  }

  const signal = result.signal
  const hasImage = Boolean(signal.imageUrl)
  const sourceCount = signal.sources.length
  const hasConsequences = signal.consequence_steps.length > 0
  const hasWatchpoints = signal.what_to_watch && signal.what_to_watch.length > 0

  return (
    <main className="sp-page">
      {/* ── Hero ── */}
      {hasImage ? (
        <div className="sp-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="sp-hero-img" src={signal.imageUrl!} alt="" />
          <div className="sp-hero-fade" />
          <nav className="sp-nav sp-nav--over">
            <BrandMark href="/" />
            <div className="sp-nav-actions">
              <a className="sp-pill-btn sp-pill-btn--app" href={`relevant://signal/${signal.id}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                Open in app
              </a>
              <Link className="sp-pill-btn sp-pill-btn--primary" href="/#access">Get Relevant</Link>
            </div>
          </nav>
        </div>
      ) : (
        <div className="sp-hero-empty">
          <nav className="sp-nav">
            <BrandMark href="/" />
            <div className="sp-nav-actions">
              <a className="sp-pill-btn sp-pill-btn--app" href={`relevant://signal/${signal.id}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                Open in app
              </a>
              <Link className="sp-pill-btn sp-pill-btn--primary" href="/#access">Get Relevant</Link>
            </div>
          </nav>
        </div>
      )}

      {/* ── Body ── */}
      <div className="sp-body">
        {/* ── Main card ── */}
        <div className={`sp-card ${hasImage ? 'sp-card--overlap' : ''}`}>
          <span className="sp-eyebrow">Shared signal</span>
          <h1 className="sp-headline">{signal.headline}</h1>
          {signal.synthesis ? (
            <p className="sp-synthesis">{signal.synthesis}</p>
          ) : signal.why_it_matters[0] ? (
            <p className="sp-synthesis">{signal.why_it_matters[0]}</p>
          ) : null}

          {/* ── Meta row ── */}
          <div className="sp-meta-row">
            {sourceCount > 0 && (
              <span className="sp-meta-chip">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                {sourceCount} source{sourceCount !== 1 ? 's' : ''}
              </span>
            )}
            {hasConsequences && (
              <span className="sp-meta-chip">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                {signal.consequence_steps.length} impact path{signal.consequence_steps.length !== 1 ? 's' : ''}
              </span>
            )}
            {hasWatchpoints && (
              <span className="sp-meta-chip">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                {signal.what_to_watch!.length} watchpoint{signal.what_to_watch!.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* ── Content grid ── */}
        <div className="sp-grid">
          {/* What Happened */}
          <section className="sp-section">
            <h2 className="sp-section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              What happened
            </h2>
            <div className="sp-bullets">
              {signal.what_happened.map((item, i) => (
                <div key={`wh-${i}`} className="sp-bullet">
                  <span className="sp-bullet-dot" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Why It Matters */}
          <section className="sp-section">
            <h2 className="sp-section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Why it matters
            </h2>
            <div className="sp-bullets">
              {signal.why_it_matters.map((item, i) => (
                <div key={`wm-${i}`} className="sp-bullet">
                  <span className="sp-bullet-dot sp-bullet-dot--accent" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Consequence Paths */}
          {hasConsequences && (
            <section className="sp-section sp-section--full">
              <h2 className="sp-section-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><path d="M6 9v12"/></svg>
                Consequence paths
              </h2>
              <div className="sp-consequences">
                {signal.consequence_steps.map((step, i) => (
                  <div key={`cs-${i}`} className="sp-consequence-card">
                    <div className="sp-consequence-header">
                      <span className="sp-consequence-type">{step.type}</span>
                      <span className="sp-consequence-dim">{step.dimension}</span>
                    </div>
                    <p className="sp-consequence-chain">{step.articleChain || step.chain}</p>
                    {step.branches && step.branches.length > 0 && (
                      <div className="sp-branches">
                        {step.branches.map((branch, bi) => (
                          <div key={`br-${i}-${bi}`} className="sp-branch">
                            <span className="sp-branch-likelihood" style={{ '--lh-color': likelihoodColor(branch.likelihood) } as React.CSSProperties}>
                              {likelihoodLabel(branch.likelihood)}
                            </span>
                            <p className="sp-branch-scenario">{branch.scenario}</p>
                            <p className="sp-branch-detail">{branch.detail}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* What to Watch */}
          {hasWatchpoints && (
            <section className="sp-section sp-section--full">
              <h2 className="sp-section-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                What to watch
              </h2>
              <div className="sp-watchpoints">
                {signal.what_to_watch!.map((item, i) => (
                  <div key={`wp-${i}`} className="sp-watchpoint">
                    <span className="sp-watchpoint-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </span>
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Sources */}
          {sourceCount > 0 && (
            <section className="sp-section sp-section--full">
              <h2 className="sp-section-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                Sources
              </h2>
              <div className="sp-sources">
                {signal.sources.map((source, i) => {
                  let domain = source.url
                  try {
                    domain = new URL(source.url).hostname.replace(/^www\./, '')
                  } catch {
                    domain = source.url
                  }

                  return (
                    <a
                      key={`src-${i}`}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sp-source"
                    >
                      <span className="sp-source-label">{source.label}</span>
                      <span className="sp-source-domain">{domain}</span>
                      <svg className="sp-source-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
                    </a>
                  )
                })}
              </div>
            </section>
          )}
        </div>

        {/* ── CTA banner ── */}
        <div className="sp-cta-banner">
          <div className="sp-cta-text">
            <h3>Get the full picture</h3>
            <p>Relevant delivers personalized intelligence with consequence analysis, AI coaching, and real-time watchpoints — tuned to your goals.</p>
          </div>
          <div className="sp-cta-buttons">
            <a className="sp-pill-btn sp-pill-btn--app" href={`relevant://signal/${signal.id}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
              Open in app
            </a>
            <Link className="sp-pill-btn sp-pill-btn--primary" href="/#access">Request access</Link>
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="sp-footer">
          <BrandMark href="/" />
          <p>Intelligence that moves with you.</p>
        </footer>
      </div>
    </main>
  )
}
