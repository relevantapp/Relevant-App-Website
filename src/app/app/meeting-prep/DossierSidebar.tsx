'use client'

import { ExternalLink, CheckCircle2 } from 'lucide-react'
import { DossierResponse, COVERAGE_BADGE, formatDate, domainFromUrl, safeUrl } from './types'

interface DossierSidebarProps {
  dossier: DossierResponse
}

export default function DossierSidebar({ dossier }: DossierSidebarProps) {
  const badge = COVERAGE_BADGE[dossier.status.coverageBand] ?? COVERAGE_BADGE.none

  return (
    <div className="space-y-6 lg:col-span-2">
      {/* Coverage Badge */}
      <div
        className={`flex flex-col items-start gap-1.5 rounded-xl border px-4 py-3 text-sm font-medium sm:flex-row sm:items-center sm:gap-2 ${badge.color}`}
      >
        <CheckCircle2 className="h-4 w-4" />
        {badge.label}
        <span className="text-xs font-normal opacity-70 sm:ml-auto">
          {dossier.status.coverage.totalArticles} articles ·{' '}
          {dossier.status.coverage.uniqueSources} sources
        </span>
      </div>

      {/* Timeline */}
      {dossier.timeline.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-[var(--text)]">Timeline</h3>
          <div className="space-y-3">
            {dossier.timeline.map((event) => (
              <div
                key={event.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs text-[var(--text-soft)]">
                    {formatDate(event.publishedAt)}
                  </span>
                  <span className="text-xs text-[var(--text-soft)]">
                    {event.sourceCount} source{event.sourceCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <p className="text-sm font-medium leading-snug text-[var(--text)]">
                  {event.headline}
                </p>
                {event.summary && (
                  <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
                    {event.summary}
                  </p>
                )}
                {event.sourceDomains.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {event.sourceDomains.slice(0, 3).map((domain) => (
                      <span
                        key={domain}
                        className="rounded bg-[var(--bg)] px-1.5 py-0.5 text-[10px] text-[var(--text-soft)]"
                      >
                        {domain}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sources */}
      {Object.keys(dossier.proofSources).length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-[var(--text)]">Sources</h3>
          <div className="space-y-2">
            {Object.values(dossier.proofSources)
              .filter((source) => safeUrl(source.url))
              .sort(
                (a, b) =>
                  new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
              )
              .slice(0, 15)
              .map((source) => (
                <a
                  key={source.articleId}
                  href={safeUrl(source.url)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 transition-colors hover:border-[var(--accent)]/30"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-[var(--text)] group-hover:text-[var(--accent)]">
                      {source.title}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--text-soft)]">
                      {domainFromUrl(source.url)} · {formatDate(source.publishedAt)}
                    </p>
                  </div>
                  <ExternalLink className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[var(--text-soft)] group-hover:text-[var(--accent)]" />
                </a>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
