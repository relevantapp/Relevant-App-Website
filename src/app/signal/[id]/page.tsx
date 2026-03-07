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
  return 'Unlikely (high impact)'
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
      title: 'Relevant signal',
      description: 'A signal shared from Relevant.',
    }
  }

  const result = await fetchSignal(params.id)
  if (!result.success) {
    return {
      title: 'Relevant signal',
      description: 'A signal shared from Relevant.',
    }
  }

  const summary =
    result.signal.synthesis ||
    result.signal.why_it_matters[0] ||
    result.signal.what_happened[0] ||
    'A signal shared from Relevant.'

  return {
    title: result.signal.headline,
    description: summary,
    openGraph: {
      title: result.signal.headline,
      description: summary,
      type: 'article',
      images: result.signal.imageUrl ? [{ url: result.signal.imageUrl }] : undefined,
    },
  }
}

export default async function SignalPage({ params }: PageProps) {
  const id = params.id.trim()

  if (!SIGNAL_ID_PATTERN.test(id)) {
    return (
      <main className="signal-page">
        <section className="signal-shell">
          <header className="signal-top">
            <BrandMark href="/" />
          </header>
          <span className="eyebrow-pill">Shared signal</span>
          <h1 className="signal-title">Signal unavailable</h1>
          <p className="signal-summary">This link is invalid. Request access to get the full Relevant signal flow.</p>
          <div className="signal-cta-row">
            <Link className="btn btn-primary" href="/#access">
              Request access
            </Link>
          </div>
        </section>
      </main>
    )
  }

  const result = await fetchSignal(id)

  if (!result.success) {
    return (
      <main className="signal-page">
        <section className="signal-shell">
          <header className="signal-top">
            <BrandMark href="/" />
          </header>
          <span className="eyebrow-pill">Shared signal</span>
          <h1 className="signal-title">Signal unavailable</h1>
          <p className="signal-summary">{result.error}</p>
          <div className="signal-cta-row">
            <Link className="btn btn-primary" href="/#access">
              Request access
            </Link>
          </div>
        </section>
      </main>
    )
  }

  const signal = result.signal

  return (
    <main className="signal-page">
      <section className="signal-shell">
        <header className="signal-top">
          <BrandMark href="/" />
          <div className="signal-cta-row">
            <a className="btn btn-ghost" href={`relevant://signal/${signal.id}`}>
              Open in app
            </a>
            <Link className="btn btn-primary" href="/#access">
              Get access
            </Link>
          </div>
        </header>

        {signal.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="signal-hero-image" src={signal.imageUrl} alt="Signal hero" loading="lazy" />
        ) : null}

        <span className="eyebrow-pill">Shared signal</span>
        <h1 className="signal-title">{signal.headline}</h1>
        <p className="signal-summary">
          {signal.synthesis ||
            signal.why_it_matters[0] ||
            signal.what_happened[0] ||
            'This signal was shared from Relevant.'}
        </p>

        <div className="signal-grid">
          <article className="panel">
            <p className="signal-kicker">What happened</p>
            <ul className="signal-list">
              {signal.what_happened.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="panel">
            <p className="signal-kicker">Why it matters</p>
            <ul className="signal-list">
              {signal.why_it_matters.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="panel signal-span-2">
            <p className="signal-kicker">Consequence path</p>
            <div className="chain-grid">
              {signal.consequence_steps.length > 0 ? (
                signal.consequence_steps.map((step) => (
                  <div key={`${step.dimension}-${step.type}-${step.chain}`} className="chain-card">
                    <p className="chain-meta">
                      {step.type} · {step.dimension}
                    </p>
                    <p>{step.articleChain || step.chain}</p>
                    {step.branches && step.branches.length > 0 ? (
                      <div className="branch-list">
                        {step.branches.map((branch) => (
                          <div key={`${branch.scenario}-${branch.likelihood}`} className="branch-card">
                            <p className="branch-pill">{likelihoodLabel(branch.likelihood)}</p>
                            <p className="branch-title">{branch.scenario}</p>
                            <p>{branch.detail}</p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="signal-muted">No consequence path available for this signal.</p>
              )}
            </div>
          </article>

          <article className="panel signal-span-2">
            <p className="signal-kicker">What to watch next</p>
            {signal.what_to_watch && signal.what_to_watch.length > 0 ? (
              <ul className="signal-list">
                {signal.what_to_watch.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="signal-muted">No watchpoints listed yet.</p>
            )}
          </article>

          <article className="panel signal-span-2">
            <p className="signal-kicker">Sources</p>
            <div className="source-list">
              {signal.sources.map((source) => {
                let domain = source.url
                try {
                  domain = new URL(source.url).hostname.replace(/^www\./, '')
                } catch {
                  domain = source.url
                }

                return (
                  <a
                    key={`${source.url}-${source.label}`}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="source-item"
                  >
                    <span>{source.label}</span>
                    <span className="source-domain">{domain}</span>
                  </a>
                )
              })}
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}
