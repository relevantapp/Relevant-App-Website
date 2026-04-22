'use client'

import { useMemo, useState } from 'react'
import type { BriefSource, PullQuote } from '@/lib/intelligence/contracts'
import ExhibitShell from '../ExhibitShell'

export function getQuoteThemes(quotes: PullQuote[]) {
  return Array.from(new Set(quotes.map((quote) => quote.theme)))
}

interface QuoteWallProps {
  data: PullQuote[]
  headline: string
  subhead?: string
  asOf: string
  sources: BriefSource[]
}

export default function QuoteWall({ data, headline, subhead, asOf, sources }: QuoteWallProps) {
  const [activeTheme, setActiveTheme] = useState<string | null>(null)
  const themes = useMemo(() => getQuoteThemes(data), [data])
  const visibleQuotes = activeTheme ? data.filter((quote) => quote.theme === activeTheme) : data

  if (data.length === 0) {
    return (
      <ExhibitShell headline={headline} subhead={subhead} asOf={asOf} sources={sources}>
        <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)] px-5 py-5 text-sm text-[var(--text-muted)]">
          No quotes captured yet.
        </div>
      </ExhibitShell>
    )
  }

  return (
    <ExhibitShell headline={headline} subhead={subhead} asOf={asOf} sources={sources}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
              activeTheme === null ? 'border-[var(--accent)] text-[var(--text)]' : 'border-[var(--border)] text-[var(--text-soft)]'
            }`}
            onClick={() => setActiveTheme(null)}
          >
            All
          </button>
          {themes.map((theme) => (
            <button
              key={theme}
              type="button"
              className={`rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                activeTheme === theme ? 'border-[var(--accent)] text-[var(--text)]' : 'border-[var(--border)] text-[var(--text-soft)]'
              }`}
              onClick={() => setActiveTheme((current) => (current === theme ? null : theme))}
            >
              {theme}
            </button>
          ))}
        </div>

        <div className="columns-1 gap-4 md:columns-2">
          {visibleQuotes.map((quote) => (
            <article
              key={`${quote.theme}-${quote.attribution.name}-${quote.attribution.date}`}
              className="mb-4 break-inside-avoid rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-5"
              data-testid="quote-card"
            >
              <p className="text-lg leading-relaxed text-[var(--text)]">“{quote.quote}”</p>
              <div className="mt-4 border-t border-[var(--border)] pt-4">
                <p className="text-sm font-semibold text-[var(--text)]">{quote.attribution.name}</p>
                {quote.attribution.role ? (
                  <p className="text-sm text-[var(--text-muted)]">{quote.attribution.role}</p>
                ) : null}
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--text-soft)]">
                  {quote.attribution.source} · {quote.attribution.date}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </ExhibitShell>
  )
}
