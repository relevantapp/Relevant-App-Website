'use client'

import type { BriefBullet } from '@/lib/intelligence/contracts'

interface InsightCardProps {
  icon: React.ReactNode
  bullet: BriefBullet
  onSourceClick?: (id: string) => void
}

export default function InsightCard({ icon, bullet, onSourceClick }: InsightCardProps) {
  const parts = splitKeyPhrase(bullet.text)

  return (
    <div className="rounded-xl border border-[var(--surface-strong)] bg-[var(--surface)] p-4">
      <div className="flex gap-3">
        <span className="mt-0.5 shrink-0">{icon}</span>
        <div className="min-w-0">
          <p className="text-sm text-[var(--text)]">
            {parts.keyPhrase && (
              <span className="font-semibold">{parts.keyPhrase} </span>
            )}
            {parts.detail}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            {bullet.sourceIds.map((id) => (
              <button
                key={id}
                onClick={() => onSourceClick?.(id)}
                className="rounded bg-[var(--surface-strong)] px-1 py-0.5 text-[10px] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
              >
                {id}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Split text into a bold key phrase + detail if there's a natural break */
function splitKeyPhrase(text: string): { keyPhrase: string | null; detail: string } {
  // Try splitting on first colon, dash, or em-dash
  const match = text.match(/^(.{10,60}?)[\s]*[—–:]\s+(.+)$/)
  if (match) return { keyPhrase: match[1], detail: match[2] }
  return { keyPhrase: null, detail: text }
}
