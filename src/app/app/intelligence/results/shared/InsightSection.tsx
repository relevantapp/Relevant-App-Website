'use client'

import type { BriefBullet } from '@/lib/intelligence/contracts'

interface InsightSectionProps {
  title: string
  icon: React.ReactNode
  bullets: BriefBullet[]
  borderColor?: string
  onSourceClick?: (id: string) => void
}

export default function InsightSection({ title, icon, bullets, borderColor, onSourceClick }: InsightSectionProps) {
  if (bullets.length === 0) return null

  return (
    <div className={`rounded-xl border ${borderColor ?? 'border-[var(--surface-strong)]'} bg-[var(--surface)] p-5`}>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
        {icon} {title}
      </h3>
      <div className="space-y-3">
        {bullets.map((bullet, i) => {
          const parts = splitKeyPhrase(bullet.text)
          return (
            <div key={i} className="rounded-lg border border-[var(--surface-strong)] bg-[var(--bg)] p-3">
              <p className="text-sm text-[var(--text)]">
                {parts.keyPhrase && <span className="font-semibold">{parts.keyPhrase} — </span>}
                {parts.detail}
              </p>
              {bullet.sourceIds.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
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
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function splitKeyPhrase(text: string): { keyPhrase: string | null; detail: string } {
  const match = text.match(/^(.{10,60}?)[\s]*[—–:]\s+(.+)$/)
  if (match) return { keyPhrase: match[1], detail: match[2] }
  return { keyPhrase: null, detail: text }
}
