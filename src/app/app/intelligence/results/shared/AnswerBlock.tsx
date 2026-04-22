'use client'

import { Copy } from 'lucide-react'
import { useEffect } from 'react'
import type { AnswerBlock as AnswerBlockData, BriefSource, Confidence } from '@/lib/intelligence/contracts'
import CitedText from './CitedText'
import ConfidenceBadge from './ConfidenceBadge'

interface AnswerBlockProps {
  answer?: AnswerBlockData
  fallback: {
    headline: string
    bottomLine: string
    confidence: Confidence
    whyItMatters?: string | null
  }
  sources: BriefSource[]
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function Slot({
  label,
  children,
  accent,
}: {
  label: string
  children: React.ReactNode
  accent?: string
}) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
      <p className="kicker" style={accent ? { color: accent } : undefined}>{label}</p>
      <div className="mt-2">{children}</div>
    </section>
  )
}

export default function AnswerBlock({ answer, fallback, sources }: AnswerBlockProps) {
  const wordCount = answer
    ? countWords([answer.conclusion.text, answer.whyItMatters.text, answer.whatChanged?.text ?? ''].join(' '))
    : 0

  useEffect(() => {
    if (!answer || process.env.NODE_ENV === 'production' || wordCount <= 120) return
    console.warn('AnswerBlock: this brief is wordier than usual.')
  }, [answer, wordCount])

  const handleCopy = async () => {
    if (!answer?.recommendedNext.copyable || !navigator.clipboard?.writeText) return
    await navigator.clipboard.writeText(answer.recommendedNext.copyable)
  }

  if (!answer) {
    return (
      <section className="sticky top-0 z-20 rounded-[28px] border border-[var(--border)] bg-[var(--bg-elevated)] px-5 py-5 shadow-[0_14px_40px_rgba(0,0,0,0.08)] backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-3xl">
            <p className="kicker text-[var(--accent)]">Bottom line</p>
            <h2 className="mt-2 text-2xl font-normal leading-tight tracking-tight text-[var(--text)]">{fallback.headline}</h2>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">{fallback.bottomLine}</p>
            {fallback.whyItMatters && (
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-soft)]">{fallback.whyItMatters}</p>
            )}
          </div>
          <ConfidenceBadge level={fallback.confidence} />
        </div>
      </section>
    )
  }

  return (
    <section className="sticky top-0 z-20 rounded-[28px] border border-[var(--border)] bg-[var(--bg-elevated)] px-5 py-5 shadow-[0_14px_40px_rgba(0,0,0,0.08)] backdrop-blur">
      <div className="grid gap-4 lg:grid-cols-2">
        <Slot label="Conclusion" accent="var(--accent)">
          <CitedText spans={[answer.conclusion]} sources={sources} />
        </Slot>

        <Slot label="Why it matters">
          <CitedText spans={[answer.whyItMatters]} sources={sources} />
        </Slot>

        {answer.whatChanged && (
          <Slot label="What changed">
            <CitedText spans={[answer.whatChanged]} sources={sources} />
          </Slot>
        )}

        <Slot label="Confidence">
          <ConfidenceBadge level={answer.confidence.level} driver={answer.confidence.driver} />
        </Slot>

        <Slot label="Recommended next">
          <div className="flex items-start justify-between gap-3">
            <div>
              {answer.recommendedNext.action && (
                <p className="kicker text-[var(--accent-amber)]">{answer.recommendedNext.action}</p>
              )}
              <p className="mt-2 text-sm leading-relaxed text-[var(--text)]">{answer.recommendedNext.text}</p>
            </div>
            {answer.recommendedNext.copyable && (
              <button
                type="button"
                onClick={() => void handleCopy()}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]"
              >
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Copy</span>
              </button>
            )}
          </div>
        </Slot>
      </div>
    </section>
  )
}
