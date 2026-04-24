import type { Metadata } from 'next'
import Link from 'next/link'

import BrandMark from '@/components/BrandMark'
import SignalHeroImage from '@/components/SignalHeroImage'

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

type MatchedDimension = {
  id: string | null
  label: string
  normalized_value: string
  category: string
  consequence_chain: string
  consequence_type: string
  consequence_types: string[]
  relationship: string | null
  weight: number
  query_hint: string | null
  expires_at: string | null
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
  matched_dimensions: MatchedDimension[]
  updated_at: string | null
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

const TYPE_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  competitive: { bg: 'bg-[#8CABC8]/8', text: 'text-[#8CABC8]', bar: 'bg-[#8CABC8]' },
  opportunity: { bg: 'bg-[#7AB0A0]/8', text: 'text-[#7AB0A0]', bar: 'bg-[#7AB0A0]' },
  risk:        { bg: 'bg-[#C4A87A]/8', text: 'text-[#C4A87A]', bar: 'bg-[#C4A87A]' },
  strategic:   { bg: 'bg-[#A090C0]/8', text: 'text-[#A090C0]', bar: 'bg-[#A090C0]' },
  financial:   { bg: 'bg-[#C4A87A]/8', text: 'text-[#C4A87A]', bar: 'bg-[#C4A87A]' },
  operational: { bg: 'bg-[#7AB0A0]/8', text: 'text-[#7AB0A0]', bar: 'bg-[#7AB0A0]' },
  regulatory:  { bg: 'bg-[#C09474]/8', text: 'text-[#C09474]', bar: 'bg-[#C09474]' },
  career:      { bg: 'bg-[#78A88A]/8', text: 'text-[#78A88A]', bar: 'bg-[#78A88A]' },
  personal:    { bg: 'bg-[#B090BC]/8', text: 'text-[#B090BC]', bar: 'bg-[#B090BC]' },
}
const DEFAULT_TYPE_COLOR = { bg: 'bg-[var(--surface)]', text: 'text-[var(--text-muted)]', bar: 'bg-[var(--text-soft)]' }

/* Icon mapping for consequence types */
const TYPE_ICONS: Record<string, string> = {
  competitive: 'M3.05 11.97a9 9 0 1 1 9 8.98 9 9 0 0 1-9-8.98ZM12 12m-1 0a1 1 0 1 0 2 0 1 1 0 0 0-2 0',
  opportunity: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 12m-3 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0',
  risk:        'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
  strategic:   'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3',
  financial:   'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  operational: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  regulatory:  'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  career:      'M20 7h-4V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v3H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM10 4h4v3h-4z',
  personal:    'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
}

function likelihoodStyle(lh: string): { text: string; bg: string } {
  if (lh === 'likely') return { text: 'text-accent-teal', bg: 'bg-accent-teal/10' }
  if (lh === 'possible') return { text: 'text-accent-amber', bg: 'bg-accent-amber/10' }
  return { text: 'text-accent-coral', bg: 'bg-accent-coral/10' }
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d)
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
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <nav className="border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <BrandMark href="/" />
          <Link className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white" href="/signup">Start free</Link>
        </div>
      </nav>
      <main className="mx-auto max-w-2xl px-6 py-20 text-center">
        <span className="mb-4 inline-block rounded-full bg-accent-blue/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-accent-blue">Shared signal</span>
        <h1 className="mb-4 font-display text-2xl font-bold text-[var(--text)]">{title}</h1>
        <p className="mb-8 text-sm leading-relaxed text-[var(--text-muted)]">{body}</p>
        <Link className="inline-flex rounded-full bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90" href="/signup">Create your account</Link>
      </main>
    </div>
  )
}

/* ── Main page ───────────────────────────────────────────────── */
export default async function SignalPage({ params }: PageProps) {
  const id = params.id.trim()

  if (!SIGNAL_ID_PATTERN.test(id)) {
    return <ErrorShell title="Signal unavailable" body="This link is invalid. Create an account to access Relevant signals." />
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
  const hasDimensions = signal.matched_dimensions && signal.matched_dimensions.length > 0
  const synthesisText = signal.synthesis || signal.why_it_matters[0] || null

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* ── Sticky nav ── */}
      <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <BrandMark href="/" />
          <div className="flex items-center gap-3">
            <a
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-strong)]"
              href={`relevant://signal/${signal.id}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
              Open in app
            </a>
            <Link
              className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white transition-colors hover:opacity-90"
              href="/signup"
            >
              Start free
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 pb-20">
        {/* ── Hero image ── */}
        {hasImage && (
          <div className="relative mt-6 h-56 w-full overflow-hidden rounded-xl sm:h-72 lg:h-80">
            <SignalHeroImage src={signal.imageUrl!} />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-transparent to-transparent" />
          </div>
        )}

        {/* ── Shared signal badge ── */}
        <div className={hasImage ? 'mt-6' : 'mt-8'}>
          <span className="inline-block rounded-full bg-accent-blue/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-accent-blue">
            Shared signal
          </span>
        </div>

        {/* ── Headline ── */}
        <h1 className="mb-4 mt-4 font-display text-2xl font-bold leading-tight text-[var(--text)] sm:text-3xl lg:text-4xl">
          {signal.headline}
        </h1>

        {/* ── Personalization disclaimer ── */}
        <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-[var(--text-soft)]"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <p className="text-xs leading-relaxed text-[var(--text-muted)]">
            This signal was personalized for someone based on their role, industry, and goals. The impact analysis, matched dimensions, and watchpoints would look different for you. <Link href="/signup" className="font-medium text-accent-blue hover:underline">Sign up</Link> to get signals built around your world.
          </p>
        </div>

        {/* ── Meta bar ── */}
        <div className="mb-6 flex flex-wrap items-center gap-3 text-xs text-[var(--text-soft)]">
          {signal.updated_at && (
            <span className="inline-flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {formatDate(signal.updated_at)}
            </span>
          )}
          {sourceCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface)] px-2 py-0.5 text-[var(--text-muted)]">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              {sourceCount} source{sourceCount !== 1 ? 's' : ''}
            </span>
          )}
          {hasConsequences && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface)] px-2 py-0.5 text-[var(--text-muted)]">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              {signal.consequence_steps.length} impact path{signal.consequence_steps.length !== 1 ? 's' : ''}
            </span>
          )}
          {hasWatchpoints && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface)] px-2 py-0.5 text-[var(--text-muted)]">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              {signal.what_to_watch!.length} watchpoint{signal.what_to_watch!.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* ── Synthesis ── */}
        {synthesisText && (
          <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
            <p className="text-sm leading-relaxed text-[var(--text)]">{synthesisText}</p>
          </div>
        )}

        {/* ── Two-column layout ── */}
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Main content */}
          <div className="min-w-0 flex-1">
            {/* What Happened */}
            <section className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                What Happened
              </h2>
              <ul className="flex flex-col gap-2">
                {signal.what_happened.map((item, i) => (
                  <li key={`wh-${i}`} className="flex gap-3 text-sm leading-relaxed text-[var(--text-muted)]">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-blue" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* Why It Matters */}
            <section className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                Why It Matters
              </h2>
              <ul className="flex flex-col gap-2">
                {signal.why_it_matters.map((item, i) => (
                  <li key={`wm-${i}`} className="flex gap-3 text-sm leading-relaxed text-[var(--text-muted)]">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-teal" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* Impact Analysis — compact cards */}
            {hasConsequences && (
              <section className="mb-6">
                <h2 className="mb-4 font-display text-lg font-bold text-[var(--text)]">Why this matters to you</h2>

                {/* Mobile: horizontal snap-scroll | Desktop: 2-col grid */}
                <div className="scrollbar-hide flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 -mx-6 px-6 md:mx-0 md:px-0 md:grid md:grid-cols-2 md:overflow-visible md:pb-0">
                  {signal.consequence_steps.map((step, i) => {
                    const typeKey = step.type?.toLowerCase() || ''
                    const color = TYPE_COLORS[typeKey] || DEFAULT_TYPE_COLOR
                    const iconPath = TYPE_ICONS[typeKey] || TYPE_ICONS.strategic
                    const hasBranches = step.branches && step.branches.length > 0

                    return (
                      <div
                        key={`cs-${i}`}
                        className="snap-start shrink-0 w-[280px] rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 md:w-auto md:shrink"
                      >
                        <div>
                          {/* Type + weight row */}
                          <div className="mb-1.5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={color.text}>
                                <path d={iconPath} />
                              </svg>
                              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--text-soft)]">
                                {step.type}
                              </span>
                            </div>
                            {step.weight > 0 && (
                              <span className="font-mono text-[10px] text-[var(--text-soft)]">{Math.round(step.weight * 100)}%</span>
                            )}
                          </div>

                          {/* Dimension title */}
                          <h4 className="mb-1 text-[14px] font-bold leading-snug text-[var(--text)]">
                            {step.dimension}
                          </h4>

                          {/* Description */}
                          <p className="text-[12px] leading-relaxed text-[var(--text-muted)] line-clamp-3">
                            {step.articleChain || step.chain}
                          </p>

                          {/* Scenarios (collapsible) */}
                          {hasBranches && (
                            <details className="group mt-2.5">
                              <summary className="flex cursor-pointer select-none list-none items-center gap-1 text-[11px] font-medium text-[var(--text-muted)] [&::-webkit-details-marker]:hidden">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-open:rotate-90"><polyline points="9 18 15 12 9 6"/></svg>
                                {step.branches!.length} scenario{step.branches!.length !== 1 ? 's' : ''}
                              </summary>
                              <div className="mt-2 flex flex-col gap-1.5">
                                {step.branches!.map((b, bi) => (
                                  <div key={`br-${i}-${bi}`} className="rounded-lg bg-[var(--surface)] px-3 py-2">
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${likelihoodStyle(b.likelihood).text}`}>
                                      {b.likelihood.replace(/_/g, ' ')}
                                    </span>
                                    <p className="mt-0.5 text-[11px] font-medium leading-snug text-[var(--text)]">{b.scenario}</p>
                                    <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--text-muted)]">{b.detail}</p>
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}
          </div>

          {/* ── Sidebar ── */}
          <aside className="flex w-full shrink-0 flex-col gap-5 lg:w-[340px]">
            {/* What to Watch */}
            {hasWatchpoints && (
              <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  What to Watch
                </h3>
                <ul className="flex flex-col gap-2">
                  {signal.what_to_watch!.map((item, i) => (
                    <li key={`wp-${i}`} className="flex gap-3 text-sm leading-relaxed text-[var(--text-muted)]">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-amber" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Matched Dimensions */}
            {hasDimensions && (
              <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Why this is relevant
                </h3>
                <div className="flex flex-col gap-3">
                  {signal.matched_dimensions.map((dim, i) => (
                    <div key={`dim-${i}`} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
                      <div className="mb-1 flex items-baseline gap-2">
                        <span className="text-sm font-bold text-[var(--text)]">{dim.label}</span>
                        <span className="rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 font-mono text-[10px] uppercase text-[var(--text-soft)]">{dim.category}</span>
                      </div>
                      <p className="text-xs leading-relaxed text-[var(--text-muted)]">{dim.consequence_chain}</p>
                      {dim.consequence_types.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {dim.consequence_types.map((ct, ci) => (
                            <span key={`ct-${i}-${ci}`} className="rounded-full bg-accent-blue/10 px-2 py-0.5 text-[10px] font-semibold text-accent-blue">{ct}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Sources */}
            {sourceCount > 0 && (
              <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  Sources
                </h3>
                <div className="flex flex-col gap-2">
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
                        className="group flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-sm text-[var(--text-muted)] transition-colors hover:border-accent-blue/40 hover:text-accent-blue"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                        <span className="line-clamp-1 flex-1">{source.label}</span>
                        <span className="shrink-0 font-mono text-[10px] text-[var(--text-soft)]">{domain}</span>
                      </a>
                    )
                  })}
                </div>
              </section>
            )}

            {/* ── Signup CTA card ── */}
            <div className="rounded-xl border border-accent-blue/20 bg-accent-blue/5 p-5">
              <h3 className="mb-2 font-display text-base font-bold text-[var(--text)]">
                Your signal would look different.
              </h3>
              <p className="mb-4 text-sm leading-relaxed text-[var(--text-muted)]">
                Relevant builds every signal around your role, industry, and goals — so the impact analysis, watchpoints, and priorities are yours, not someone else&apos;s.
              </p>
              <Link
                href="/signup"
                className="block w-full rounded-lg bg-[var(--accent)] py-2.5 text-center text-sm font-semibold text-white transition-colors hover:opacity-90"
              >
                Start free
              </Link>
              <p className="mt-3 text-center text-xs text-[var(--text-soft)]">
                Already have an account?{' '}
                <Link href="/login" className="text-accent-blue hover:underline">Log in</Link>
              </p>
            </div>
          </aside>
        </div>

        {/* ── Bottom CTA banner ── */}
        <div className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-8 text-center">
          <h3 className="mb-2 font-display text-xl font-bold text-[var(--text)]">
            Know what matters — for your role.
          </h3>
          <p className="mx-auto mb-6 max-w-lg text-sm leading-relaxed text-[var(--text-muted)]">
            Relevant reads thousands of articles and tells you what changed, why it matters, and what to do next — personalized to your industry, role, and goals.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-full bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
            >
              Start free
            </Link>
            <a
              href={`relevant://signal/${signal.id}`}
              className="rounded-full border border-[var(--border)] px-6 py-2.5 text-sm font-semibold text-[var(--text-muted)] transition-colors hover:bg-[var(--surface)]"
            >
              Open in app
            </a>
          </div>
          <p className="mt-4 text-xs text-[var(--text-soft)]">
            The app is live. Get Relevant from the App Store.
          </p>
        </div>

        {/* ── Footer ── */}
        <footer className="mt-16 flex flex-col items-center gap-3 border-t border-[var(--border)] pt-8 text-center">
          <BrandMark href="/" />
          <p className="font-mono text-[10px] tracking-widest text-[var(--text-soft)]">Less noise. More clarity.</p>
        </footer>
      </main>
    </div>
  )
}
