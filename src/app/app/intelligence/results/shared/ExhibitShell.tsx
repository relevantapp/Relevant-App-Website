'use client'

import { ChevronDown, Download } from 'lucide-react'
import { toPng } from 'html-to-image'
import { useRef, useState } from 'react'
import type { PropsWithChildren } from 'react'
import type { BriefSource } from '@/lib/intelligence/contracts'
import AsOfChip from './AsOfChip'
import ClaimFeedback from './ClaimFeedback'
import DeclarativeHeadline from './DeclarativeHeadline'

interface ExhibitShellProps extends PropsWithChildren {
  headline: string
  subhead?: string
  asOf?: string | null
  sources: BriefSource[]
  className?: string
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function ExhibitShell({
  headline,
  subhead,
  asOf,
  sources,
  className,
  children,
}: ExhibitShellProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [sourcesOpen, setSourcesOpen] = useState(false)

  const handleScreenshot = async () => {
    if (!ref.current) return

    const dataUrl = await toPng(ref.current, {
      cacheBust: true,
      pixelRatio: 2,
    })

    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `${slugify(headline) || 'exhibit'}.png`
    link.click()
  }

  return (
    <section
      ref={ref}
      className={`rounded-[28px] border border-[var(--border)] bg-[var(--bg-elevated)] ${className ?? ''}`.trim()}
    >
      <div className="border-b border-[var(--border)] px-5 py-5 sm:px-6">
        <DeclarativeHeadline headline={headline} />
        {subhead && (
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[var(--text-muted)]">
            {subhead}
          </p>
        )}
        <div className="mt-4 h-px w-24 bg-[var(--accent)]" aria-hidden="true" />
        <ClaimFeedback
          className="mt-3"
          claimKey={`exhibit:${slugify(headline) || 'headline'}`}
          claimText={headline}
          sourceIds={sources.map((source) => source.id)}
        />
      </div>

      <div className="px-5 py-5 sm:px-6">
        {children}
      </div>

      <div className="flex flex-col gap-4 border-t border-[var(--border)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0 flex-1">
          <button
            type="button"
            aria-expanded={sourcesOpen}
            onClick={() => setSourcesOpen((value) => !value)}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${sourcesOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            <span>Sources ({sources.length})</span>
          </button>

          {sourcesOpen && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {sources.map((source) => (
                <a
                  key={source.id}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text)]"
                >
                  {source.domain}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AsOfChip at={asOf} />
          <button
            type="button"
            data-intel-screenshot-action
            onClick={handleScreenshot}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-elevated)]"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Screenshot</span>
          </button>
        </div>
      </div>
    </section>
  )
}
