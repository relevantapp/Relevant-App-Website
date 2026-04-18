'use client'

import { useState, useCallback } from 'react'
import { Share2, Check, Copy, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ProBriefItem } from '@/types/signals'

/* ── share URL (matches mobile format) ─────────────────────── */

function signalShareUrl(signalId: string): string {
  const safe = encodeURIComponent(String(signalId || '').trim())
  return `https://www.getrelevantapp.com/signal/${safe}`
}

/* ── share text (matches mobile defaultPostText) ────────────── */

function buildShareText(signal: ProBriefItem): string {
  const stripLead = (s: string) =>
    s.replace(/^(update|breaking|alert|new)\s*:\s*/i, '').trim()

  const firstSentence = (s: string) => {
    const t = s.replace(/\s+/g, ' ').trim()
    if (!t) return ''
    const match = t.match(/^(.{1,220}?[.!?])\s/)
    return (match?.[1] || t).trim()
  }

  const firstWhat =
    Array.isArray(signal.what_happened) && typeof signal.what_happened[0] === 'string'
      ? signal.what_happened[0].trim()
      : ''

  const title = (signal.headline || '').trim()
  const raw = stripLead(firstWhat || signal.headline || '')
  const one = firstSentence(raw)
  const base = (one || raw).replace(/\s+/g, ' ').trim()
  const clipped =
    base.length <= 140 ? base : base.slice(0, 140).replace(/\s+\S*$/, '').trim()

  if (title && clipped && title.toLowerCase() !== clipped.toLowerCase()) {
    return `${title}. ${clipped} (via Relevant)`
  }
  if (title) return `${title} (via Relevant)`
  return clipped ? `${clipped} (via Relevant)` : '(via Relevant)'
}

/* ── component ──────────────────────────────────────────────── */

type ShareButtonProps = {
  signal: ProBriefItem
  /** 'icon' = compact icon button, 'full' = icon + label */
  variant?: 'icon' | 'full'
  className?: string
}

type FeedbackState = 'idle' | 'copied' | 'shared' | 'error'

export default function ShareButton({ signal, variant = 'icon', className = '' }: ShareButtonProps) {
  const [feedback, setFeedback] = useState<FeedbackState>('idle')

  const handleShare = useCallback(async () => {
    const url = signalShareUrl(signal.id)
    const text = buildShareText(signal)

    // Try native Web Share API first (works on mobile browsers + some desktops)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: signal.headline,
          text,
          url,
        })
        setFeedback('shared')
        setTimeout(() => setFeedback('idle'), 2000)
        return
      } catch (err: unknown) {
        // User cancelled — don't show error
        if (err instanceof Error && err.name === 'AbortError') return
      }
    }

    // Fallback: copy link to clipboard
    try {
      await navigator.clipboard.writeText(url)
      setFeedback('copied')
      setTimeout(() => setFeedback('idle'), 2000)
    } catch {
      // Last resort: prompt fallback
      try {
        const textarea = document.createElement('textarea')
        textarea.value = url
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        setFeedback('copied')
        setTimeout(() => setFeedback('idle'), 2000)
      } catch {
        setFeedback('error')
        setTimeout(() => setFeedback('idle'), 3000)
      }
    }
  }, [signal])

  const feedbackIcon =
    feedback === 'copied' ? <Check size={14} /> :
    feedback === 'shared' ? <Check size={14} /> :
    feedback === 'error' ? <X size={14} /> :
    <Share2 size={14} />

  const feedbackLabel =
    feedback === 'copied' ? 'Copied!' :
    feedback === 'shared' ? 'Shared!' :
    feedback === 'error' ? 'Failed' :
    'Share'

  if (variant === 'full') {
    return (
      <button
        onClick={handleShare}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] transition-all hover:border-accent-blue/30 hover:text-accent-blue ${className}`}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={feedback}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1.5"
          >
            {feedbackIcon}
            {feedbackLabel}
          </motion.span>
        </AnimatePresence>
      </button>
    )
  }

  // Icon-only variant
  return (
    <button
      onClick={handleShare}
      title={feedbackLabel}
      className={`group relative inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)] transition-all hover:border-accent-blue/30 hover:text-accent-blue ${className}`}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={feedback}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {feedbackIcon}
        </motion.span>
      </AnimatePresence>

      {/* Tooltip on hover (desktop) */}
      {feedback !== 'idle' && (
        <motion.span
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          className="absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[var(--bg)] px-2 py-0.5 text-[10px] font-medium text-[var(--text)] shadow-lg border border-[var(--border)]"
        >
          {feedbackLabel}
        </motion.span>
      )}
    </button>
  )
}
