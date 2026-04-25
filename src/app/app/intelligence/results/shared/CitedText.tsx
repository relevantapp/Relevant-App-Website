'use client'

import { useMemo, useState } from 'react'
import type { BriefSource, CitedSpan } from '@/lib/intelligence/contracts'
import { useClaimSpotlight, useHasClaimSpotlightProvider } from './ClaimSpotlightContext'
import SourcePopover from './SourcePopover'

interface CitedTextProps {
  spans: CitedSpan[]
  sources: BriefSource[]
}

function buildSourceNumberMap(spans: CitedSpan[]) {
  const orderedSourceIds: string[] = []

  for (const span of spans) {
    for (const sourceId of span.sourceIds) {
      if (!orderedSourceIds.includes(sourceId)) orderedSourceIds.push(sourceId)
    }
  }

  return new Map(orderedSourceIds.map((sourceId, index) => [sourceId, index + 1]))
}

export default function CitedText({ spans, sources }: CitedTextProps) {
  const [openKey, setOpenKey] = useState<string | null>(null)
  const sourceNumberMap = useMemo(() => buildSourceNumberMap(spans), [spans])
  const sourceMap = useMemo(() => new Map(sources.map((source) => [source.id, source])), [sources])
  const spotlight = useClaimSpotlight()
  const hasSpotlightProvider = useHasClaimSpotlightProvider()

  return (
    <span className="text-sm leading-relaxed text-[var(--text)]">
      {spans.map((span, spanIndex) => {
        const uniqueSourceIds = Array.from(new Set(span.sourceIds))

        return (
          <span key={`${span.text}-${spanIndex}`}>
            {spanIndex > 0 ? ' ' : null}
            <span>{span.text}</span>
            {uniqueSourceIds.map((sourceId, sourceIndex) => {
              const key = `${sourceId}-${spanIndex}-${sourceIndex}`
              const claimId = `cited-span-${spanIndex}`
              const number = sourceNumberMap.get(sourceId) ?? '?'
              const source = sourceMap.get(sourceId)
              const popoverId = `source-popover-${key}`
              const isPopoverOpen = openKey === key

              const openSpotlight = () => {
                spotlight.openForClaim(claimId, uniqueSourceIds, {
                  claimLabel: span.text,
                  snippet: span.sourceSnippet ?? span.text,
                })
              }

              return (
                <span
                  key={key}
                  className="relative inline-flex"
                  onMouseEnter={() => {
                    if (hasSpotlightProvider) {
                      openSpotlight()
                      return
                    }
                    setOpenKey(key)
                  }}
                  onMouseLeave={() => {
                    if (hasSpotlightProvider) {
                      spotlight.close()
                      return
                    }
                    setOpenKey((current) => (current === key ? null : current))
                  }}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                      if (hasSpotlightProvider) {
                        spotlight.close()
                        return
                      }
                      setOpenKey((current) => (current === key ? null : current))
                    }
                  }}
                >
                  <button
                    type="button"
                    className={`ml-1 inline-flex translate-y-[-0.15rem] rounded px-1 text-[10px] font-semibold align-super transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1 ${source ? 'text-[var(--accent)]' : 'text-[var(--text-soft)]'}`}
                    aria-label={source ? `Open source ${number}` : `Source ${number} unavailable`}
                    aria-describedby={!hasSpotlightProvider && isPopoverOpen ? popoverId : undefined}
                    onFocus={() => {
                      if (hasSpotlightProvider) {
                        openSpotlight()
                        return
                      }
                      setOpenKey(key)
                    }}
                    onClick={() => {
                      if (hasSpotlightProvider) {
                        openSpotlight()
                        spotlight.pin()
                        return
                      }
                      setOpenKey((current) => (current === key ? null : key))
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        if (hasSpotlightProvider) {
                          openSpotlight()
                          spotlight.pin()
                          return
                        }
                        setOpenKey((current) => (current === key ? null : key))
                      }
                      if (event.key === 'Escape') {
                        if (hasSpotlightProvider) {
                          spotlight.close(true)
                        }
                        setOpenKey(null)
                      }
                    }}
                  >
                    {number}
                  </button>

                  {!hasSpotlightProvider && isPopoverOpen && (
                    <SourcePopover id={popoverId} source={source} snippet={span.sourceSnippet} />
                  )}
                </span>
              )
            })}
          </span>
        )
      })}
    </span>
  )
}
