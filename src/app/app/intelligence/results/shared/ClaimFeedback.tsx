'use client'

import { ThumbsDown, ThumbsUp } from 'lucide-react'
import { useState } from 'react'
import type { ClaimFeedbackFlag, ClaimFeedbackSentiment } from '@/lib/intelligence/feedback'
import { useClaimFeedback } from './ClaimFeedbackContext'

const FLAG_OPTIONS: Array<{ value: ClaimFeedbackFlag; label: string }> = [
  { value: 'wrong', label: 'Wrong' },
  { value: 'stale', label: 'Stale' },
  { value: 'generic', label: 'Generic' },
]

interface ClaimFeedbackProps {
  claimKey: string
  claimText: string
  sourceIds?: string[]
  className?: string
}

export default function ClaimFeedback({ claimKey, claimText, sourceIds = [], className }: ClaimFeedbackProps) {
  const feedback = useClaimFeedback()
  const [selectedSentiment, setSelectedSentiment] = useState<ClaimFeedbackSentiment | null>(null)
  const [selectedFlag, setSelectedFlag] = useState<ClaimFeedbackFlag | null>(null)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  if (!feedback?.enabled) return null

  const submit = async (sentiment: ClaimFeedbackSentiment, flag?: ClaimFeedbackFlag | null) => {
    setStatus('saving')

    try {
      await feedback.submitFeedback({
        claimKey,
        claimText,
        sentiment,
        flags: flag ? [flag] : [],
        sourceIds,
      })

      setSelectedSentiment(sentiment)
      setSelectedFlag(flag ?? null)
      setStatus('saved')
    } catch (error) {
      console.error('[ClaimFeedback] Submit failed:', error)
      setStatus('error')
    }
  }

  const isNegative = selectedSentiment === 'down'

  return (
    <div className={className} data-testid="claim-feedback">
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--text-soft)]">Claim feedback</span>
        <button
          type="button"
          aria-label="Mark claim helpful"
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)] ${
            selectedSentiment === 'up'
              ? 'border-[var(--accent-teal)] bg-[color-mix(in_oklch,var(--accent-teal)_16%,transparent)] text-[var(--accent-teal)]'
              : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-soft)] hover:border-[var(--accent)] hover:text-[var(--text)]'
          }`}
          onClick={() => void submit('up')}
        >
          <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Helpful</span>
        </button>
        <button
          type="button"
          aria-label="Flag claim"
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)] ${
            isNegative
              ? 'border-[var(--accent-coral)] bg-[color-mix(in_oklch,var(--accent-coral)_14%,transparent)] text-[var(--accent-coral)]'
              : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-soft)] hover:border-[var(--accent)] hover:text-[var(--text)]'
          }`}
          onClick={() => {
            setSelectedSentiment((current) => (current === 'down' ? null : 'down'))
            setSelectedFlag(null)
            if (status !== 'idle') setStatus('idle')
          }}
        >
          <ThumbsDown className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Flag</span>
        </button>
        <span className="text-xs text-[var(--text-soft)]" aria-live="polite">
          {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : status === 'error' ? 'Could not save' : ''}
        </span>
      </div>

      {isNegative ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {FLAG_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-label={`Flag claim as ${option.label.toLowerCase()}`}
              className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)] ${
                selectedFlag === option.value
                  ? 'border-[var(--accent-coral)] bg-[color-mix(in_oklch,var(--accent-coral)_14%,transparent)] text-[var(--accent-coral)]'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-soft)] hover:border-[var(--accent)] hover:text-[var(--text)]'
              }`}
              onClick={() => void submit('down', option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
