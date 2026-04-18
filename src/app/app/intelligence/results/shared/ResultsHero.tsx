'use client'

import { useState, useCallback } from 'react'
import { Copy, Check, Shield, ShieldAlert, ShieldCheck } from 'lucide-react'

const GRADIENT_BY_TYPE: Record<string, string> = {
  meeting_prep: 'from-[var(--accent)]/[0.08] to-[var(--accent-teal)]/[0.06]',
  competitive_analysis: 'from-[var(--accent-amber)]/[0.08] to-[var(--accent-coral)]/[0.06]',
  business_case: 'from-[var(--accent-teal)]/[0.08] to-[var(--accent)]/[0.06]',
  market_research: 'from-[var(--accent-violet)]/[0.08] to-[var(--accent-teal)]/[0.06]',
}

function ConfidenceBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const config = {
    high: { icon: <ShieldCheck className="h-3.5 w-3.5" />, color: 'text-[var(--accent-teal)]', bg: 'bg-[var(--accent-teal)]/15', label: 'High confidence' },
    medium: { icon: <Shield className="h-3.5 w-3.5" />, color: 'text-[var(--accent-amber)]', bg: 'bg-[var(--accent-amber)]/15', label: 'Medium confidence' },
    low: { icon: <ShieldAlert className="h-3.5 w-3.5" />, color: 'text-[var(--accent-coral)]', bg: 'bg-[var(--accent-coral)]/15', label: 'Low confidence' },
  }
  const c = config[level]

  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${c.bg} ${c.color} px-2.5 py-1 text-xs font-medium`}>
      {c.icon} {c.label}
    </span>
  )
}

interface ResultsHeroProps {
  headline: string
  bottomLine: string
  confidence: 'high' | 'medium' | 'low'
  researchType: string
  onNewSearch?: () => void
  onCopy?: () => Promise<void>
}

export default function ResultsHero({ headline, bottomLine, confidence, researchType, onNewSearch, onCopy }: ResultsHeroProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    if (!onCopy) return
    onCopy()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [onCopy])

  const gradient = GRADIENT_BY_TYPE[researchType] ?? GRADIENT_BY_TYPE.meeting_prep

  return (
    <>
      {(onNewSearch || onCopy) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {onNewSearch && (
            <button
              onClick={onNewSearch}
              className="rounded-lg bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-muted)] hover:bg-[var(--surface-strong)] hover:text-[var(--text)] sm:text-sm"
            >
              ← New Search
            </button>
          )}
          {onCopy && (
            <div className="flex items-center gap-2">
              <ConfidenceBadge level={confidence} />
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-strong)]"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          )}
        </div>
      )}

      <div className={`rounded-xl border border-[var(--accent)]/15 bg-gradient-to-br ${gradient} p-4 sm:p-6`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-[var(--text)] sm:text-lg">{headline}</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)] leading-relaxed">{bottomLine}</p>
          </div>
          <ConfidenceBadge level={confidence} />
        </div>
      </div>
    </>
  )
}
