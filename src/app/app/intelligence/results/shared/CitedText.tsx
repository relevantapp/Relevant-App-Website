'use client'

import { useMemo, useState } from 'react'
import type { BriefSource, CitedSpan } from '@/lib/intelligence/contracts'
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
              const number = sourceNumberMap.get(sourceId) ?? '?'
              const source = sourceMap.get(sourceId)
              const popoverId = `source-popover-${key}`
              const isOpen = openKey === key

              return (
                <span
                  key={key}
                  className="relative inline-flex"
                  onMouseEnter={() => setOpenKey(key)}
                  onMouseLeave={() => setOpenKey((current) => (current === key ? null : current))}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                      setOpenKey((current) => (current === key ? null : current))
                    }
                  }}
                >
                  <button
                    type="button"
                    className={`ml-1 inline-flex translate-y-[-0.15rem] rounded px-1 text-[10px] font-semibold align-super transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1 ${source ? 'text-[var(--accent)]' : 'text-[var(--text-soft)]'}`}
                    aria-label={source ? `Open source ${number}` : `Source ${number} unavailable`}
                    aria-describedby={isOpen ? popoverId : undefined}
                    onFocus={() => setOpenKey(key)}
                    onClick={() => setOpenKey((current) => (current === key ? null : key))}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        setOpenKey((current) => (current === key ? null : key))
                      }
                      if (event.key === 'Escape') {
                        setOpenKey(null)
                      }
                    }}
                  >
                    {number}
                  </button>

                  {isOpen && (
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
