import type { Metadata } from 'next'
import styles from './public-signal.module.css'
import PublicSignalClient from './public-signal-client'
import NavBar, { NavItem } from '@/components/NavBar'

type PublicConsequenceBranch = {
  scenario: string
  likelihood: 'likely' | 'possible' | 'unlikely_but_severe'
  detail: string
}

type PublicConsequenceStep = {
  dimension: string
  category: string
  type: string
  weight: number
  chain: string
  fullChain: string
  articleChain?: string
  branches?: PublicConsequenceBranch[]
}

type PublicSignal = {
  id: string
  headline: string
  what_happened: string[]
  why_it_matters: string[]
  synthesis: string | null
  sources: Array<{ url: string; label: string }>
  imageUrl: string | null
  consequence_steps: PublicConsequenceStep[]
  what_to_watch: string[] | null
  updated_at: string | null
}

function safeText(input: string | null | undefined, fallback = ''): string {
  if (!input) return fallback
  const trimmed = input.trim()
  return trimmed || fallback
}

function formatDate(input: string | null): string | null {
  if (!input) return null
  const dt = new Date(input)
  if (Number.isNaN(dt.getTime())) return null
  return dt.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function normalizeList(input: unknown, max = 8): string[] {
  if (!Array.isArray(input)) return []
  const out: string[] = []
  for (const item of input) {
    if (typeof item !== 'string') continue
    const trimmed = item.trim()
    if (!trimmed) continue
    out.push(trimmed)
    if (out.length >= max) break
  }
  return out
}

function normalizeLikelihood(input: unknown): PublicConsequenceBranch['likelihood'] | null {
  if (input === 'likely' || input === 'possible' || input === 'unlikely_but_severe') return input
  return null
}

function normalizeConsequenceSteps(input: unknown, max = 4): PublicConsequenceStep[] {
  if (!Array.isArray(input)) return []
  const out: PublicConsequenceStep[] = []

  for (const raw of input) {
    if (!raw || typeof raw !== 'object') continue
    const obj = raw as Record<string, unknown>

    const dimension = typeof obj.dimension === 'string' ? obj.dimension.trim() : ''
    const category = typeof obj.category === 'string' ? obj.category.trim() : ''
    const type = typeof obj.type === 'string' ? obj.type.trim() : ''
    const chain = typeof obj.chain === 'string' ? obj.chain.trim() : ''
    const fullChain = typeof obj.fullChain === 'string' ? obj.fullChain.trim() : ''
    const weight = typeof obj.weight === 'number' && Number.isFinite(obj.weight) ? obj.weight : 0
    const articleChain = typeof obj.articleChain === 'string' && obj.articleChain.trim() ? obj.articleChain.trim() : undefined

    if (!dimension || !type || !chain) continue

    let branches: PublicConsequenceBranch[] | undefined
    if (Array.isArray(obj.branches)) {
      const b: PublicConsequenceBranch[] = []
      for (const rawBranch of obj.branches) {
        if (!rawBranch || typeof rawBranch !== 'object') continue
        const br = rawBranch as Record<string, unknown>
        const scenario = typeof br.scenario === 'string' ? br.scenario.trim() : ''
        const likelihood = normalizeLikelihood(br.likelihood)
        const detail = typeof br.detail === 'string' ? br.detail.trim() : ''
        if (!scenario || !likelihood || !detail) continue
        b.push({ scenario, likelihood, detail })
        if (b.length >= 3) break
      }
      if (b.length) branches = b
    }

    out.push({
      dimension,
      category,
      type,
      weight,
      chain,
      fullChain: fullChain || chain,
      ...(articleChain ? { articleChain } : {}),
      ...(branches ? { branches } : {}),
    })

    if (out.length >= max) break
  }

  return out
}

function domainFrom(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function likelihoodLabel(input: PublicConsequenceBranch['likelihood']): string {
  if (input === 'likely') return 'Likely'
  if (input === 'possible') return 'Possible'
  return 'Unlikely (but severe)'
}

async function fetchSignal(signalId: string): Promise<PublicSignal | null> {
  const baseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').trim()
  if (!baseUrl) return null

  const url = `${baseUrl.replace(/\/$/, '')}/functions/v1/public-signal?signal=${encodeURIComponent(signalId)}`
  const response = await fetch(url, { next: { revalidate: 120 } })
  const data = await response.json().catch(() => null)

  if (!response.ok || !data?.success || !data?.signal?.id) {
    return null
  }

  const signal = data.signal as PublicSignal
  const imageUrl =
    typeof (data.signal as { imageUrl?: unknown }).imageUrl === 'string'
      ? String((data.signal as { imageUrl?: unknown }).imageUrl).trim()
      : typeof (data.signal as { image_url?: unknown }).image_url === 'string'
        ? String((data.signal as { image_url?: unknown }).image_url).trim()
        : typeof (data.signal as { hero_image_url?: unknown }).hero_image_url === 'string'
          ? String((data.signal as { hero_image_url?: unknown }).hero_image_url).trim()
          : ''

  return {
    id: signal.id,
    headline: safeText(signal.headline, 'Relevant signal'),
    synthesis: safeText(signal.synthesis, '') || null,
    what_happened: normalizeList(signal.what_happened),
    why_it_matters: normalizeList(signal.why_it_matters),
    sources: Array.isArray(signal.sources) ? signal.sources : [],
    imageUrl: imageUrl || null,
    consequence_steps: normalizeConsequenceSteps((data.signal as { consequence_steps?: unknown }).consequence_steps),
    what_to_watch: Array.isArray((data.signal as { what_to_watch?: unknown }).what_to_watch)
      ? normalizeList((data.signal as { what_to_watch?: unknown }).what_to_watch, 8)
      : null,
    updated_at: signal.updated_at || null,
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const signal = await fetchSignal(params.id)
  const title = signal?.headline || 'Relevant signal'
  const description =
    signal?.synthesis ||
    signal?.why_it_matters?.[0] ||
    signal?.what_happened?.[0] ||
    'A signal shared from Relevant.'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      images: signal?.imageUrl ? [signal.imageUrl] : undefined,
    },
    twitter: {
      card: signal?.imageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      images: signal?.imageUrl ? [signal.imageUrl] : undefined,
    },
  }
}

export default async function PublicSignalPage({ params }: { params: { id: string } }) {
  const signal = await fetchSignal(params.id)
  const updated = formatDate(signal?.updated_at || null)
  const navItems: NavItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Get access', href: '#early-access' },
  ]

  if (!signal) {
    return (
      <div className={styles.page}>
        <NavBar items={[{ label: 'Home', href: '/' }]} />
        <div className={styles.shell}>
          <main className={styles.main}>
            <section className={styles.signalCard}>
              <div className={styles.signalBody}>
                <h1 className={styles.headline}>Signal unavailable</h1>
                <p className={styles.summary}>This link is no longer valid. Request early access to get Relevant.</p>
              </div>
            </section>
            <aside className={styles.ctaCard}>
              <PublicSignalClient signalId={params.id} />
            </aside>
          </main>

          <p className={styles.footerNote}>
            This shared page is a public view of a Relevant signal. It can include personalized analysis chosen by the
            person who shared it.
          </p>
          <footer className={styles.footer}>
            <div className="footer-inner">
              <div className="footer-copyright">
                © {new Date().getFullYear()} Relevant. All rights reserved.
              </div>
              <div className="footer-links">
                <a className="footer-link" href="/privacy">Privacy</a>
                <a className="footer-link" href="/terms">Terms</a>
                <a className="footer-link" href="mailto:support@getrelevantapp.com">Contact</a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <NavBar items={navItems} />
      <div className={styles.shell}>
        <main className={styles.main}>
          <section className={styles.signalCard}>
            {signal.imageUrl ? (
              <div className={styles.hero}>
                {/* Remote images can be hosted on many domains (Perigon, publishers, etc.). */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className={styles.heroImage} src={signal.imageUrl} alt="" loading="lazy" />
                <div className={styles.heroOverlay} />
              </div>
            ) : null}

            <div className={styles.signalBody}>
              <div>
                <h1 className={styles.headline}>{signal.headline}</h1>
                <p className={styles.summary}>{signal.synthesis || 'A Relevant signal shared with you.'}</p>
              </div>

              <div className={styles.actionRow}>
                <a className="btn btn-outline" href={`relevant://share/${encodeURIComponent(signal.id)}`}>
                  Open in app
                </a>
                <a className="btn btn-primary" href="#early-access">
                  Get access
                </a>
              </div>

              <div className={styles.metaRow}>
                <span>Shared signal</span>
                {updated ? <span>Updated {updated}</span> : null}
              </div>

              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>What happened</h2>
                {signal.what_happened.length ? (
                  <ul className={styles.bulletList}>
                    {signal.what_happened.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.summary}>No additional details were included.</p>
                )}
              </div>

              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Why it matters</h2>
                {signal.why_it_matters.length ? (
                  <ul className={styles.bulletList}>
                    {signal.why_it_matters.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.summary}>No additional details were included.</p>
                )}
              </div>

              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Why this matters to you</h2>
                {signal.consequence_steps.length ? (
                  <div className={styles.chain}>
                    {signal.consequence_steps.map((step) => (
                      <div key={`${step.type}:${step.dimension}:${step.chain}`} className={styles.chainStep}>
                        <div className={styles.chainHeader}>
                          <span className={styles.chainType}>{step.type}</span>
                          <span className={styles.chainDim}>{step.dimension}</span>
                        </div>
                        <p className={styles.chainBody}>{step.articleChain || step.chain}</p>
                        {step.branches?.length ? (
                          <div className={styles.branches}>
                            {step.branches.map((b) => (
                              <div key={`${b.likelihood}:${b.scenario}`} className={styles.branch}>
                                <div className={styles.branchTop}>
                                  <span className={styles.branchPill}>{likelihoodLabel(b.likelihood)}</span>
                                  <span className={styles.branchTitle}>{b.scenario}</span>
                                </div>
                                <p className={styles.branchDetail}>{b.detail}</p>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.summary}>No consequence chain was included.</p>
                )}
              </div>

              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>What to watch next</h2>
                {signal.what_to_watch?.length ? (
                  <ul className={styles.bulletList}>
                    {signal.what_to_watch.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.summary}>No watchpoints were included.</p>
                )}
              </div>

              <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Sources</h2>
                {signal.sources.length ? (
                  <ul className={styles.sourceList}>
                    {signal.sources.map((source) => (
                      <li key={source.url} className={styles.sourceItem}>
                        <a className={styles.sourceLabel} href={source.url} target="_blank" rel="noreferrer noopener">
                          {source.label}
                        </a>
                        <span className={styles.sourceDomain}>{domainFrom(source.url)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.summary}>No sources listed.</p>
                )}
              </div>
            </div>
          </section>

          <aside className={styles.ctaCard} id="early-access">
            <PublicSignalClient signalId={signal.id} />
          </aside>
        </main>

        <p className={styles.footerNote}>
          This shared page is a public view of a Relevant signal. It can include personalized analysis chosen by the
          person who shared it.
        </p>
        <footer className={styles.footer}>
          <div className="footer-inner">
            <div className="footer-copyright">
              © {new Date().getFullYear()} Relevant. All rights reserved.
            </div>
            <div className="footer-links">
              <a className="footer-link" href="/privacy">Privacy</a>
              <a className="footer-link" href="/terms">Terms</a>
              <a className="footer-link" href="mailto:support@getrelevantapp.com">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
