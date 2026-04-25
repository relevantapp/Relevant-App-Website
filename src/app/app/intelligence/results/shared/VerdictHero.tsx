'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { Confidence } from '@/lib/intelligence/contracts'
import { useReducedMotionSafe } from './motion'

/**
 * Trust state surfaced inline in the hero — not a detached banner.
 */
export type TrustState = 'safe' | 'degraded' | 'low-evidence'

export interface EvidenceMeter {
  found: number
  ranked: number
  used: number
}

interface VerdictHeroProps {
  /** One-line verdict — display-scale type. */
  verdict: string
  /** Short secondary line rendered under the verdict. Keep it under ~160 chars. */
  subline?: string | null
  /** Confidence level; drives glow color + intensity. */
  confidence: Confidence
  /** Optional 0-1 numeric confidence to scale glow intensity beyond the level bucket. */
  confidenceScore?: number | null
  /** Trust state rendered as an inline badge. */
  trustState?: TrustState
  /** ISO timestamp the brief was generated at. Powers the live "Xm ago" readout. */
  generatedAt?: string | null
  /** Optional workflow label ("Competitive Analysis", etc.) shown as a kicker. */
  workflowLabel?: string | null
  /** Optional compact found/ranked/used counts shown beneath the verdict. */
  evidenceMeter?: EvidenceMeter | null
  /** Optional subject (e.g. company / person) rendered as secondary kicker. */
  subject?: string | null
}

const CONFIDENCE_COLOR: Record<Confidence, string> = {
  high: 'var(--accent-teal)',
  medium: 'var(--accent-amber)',
  low: 'var(--accent-coral)',
}

const CONFIDENCE_LABEL: Record<Confidence, string> = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence',
}

const CONFIDENCE_FALLBACK_SCORE: Record<Confidence, number> = {
  high: 0.88,
  medium: 0.62,
  low: 0.34,
}

const TRUST_CONFIG: Record<TrustState, { label: string; color: string; background: string }> = {
  safe: {
    label: 'Safe to use',
    color: 'var(--accent-teal)',
    background: 'color-mix(in oklch, var(--accent-teal) 14%, transparent)',
  },
  degraded: {
    label: 'Degraded run',
    color: 'var(--accent-amber)',
    background: 'color-mix(in oklch, var(--accent-amber) 16%, transparent)',
  },
  'low-evidence': {
    label: 'Low evidence',
    color: 'var(--accent-coral)',
    background: 'color-mix(in oklch, var(--accent-coral) 14%, transparent)',
  },
}

function formatRelative(from: Date, now: Date): string {
  const diffMs = now.getTime() - from.getTime()
  const seconds = Math.max(0, Math.round(diffMs / 1000))
  if (seconds < 45) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function useLiveTimestamp(iso: string | null | undefined) {
  const [label, setLabel] = useState<string>(() => {
    if (!iso) return ''
    const parsed = new Date(iso)
    if (Number.isNaN(parsed.getTime())) return ''
    return formatRelative(parsed, new Date())
  })

  useEffect(() => {
    if (!iso) {
      setLabel('')
      return
    }
    const parsed = new Date(iso)
    if (Number.isNaN(parsed.getTime())) {
      setLabel('')
      return
    }

    const tick = () => setLabel(formatRelative(parsed, new Date()))
    tick()
    const interval = window.setInterval(tick, 30_000)
    return () => window.clearInterval(interval)
  }, [iso])

  return label
}

function CompactMeter({ meter }: { meter: EvidenceMeter }) {
  return (
    <div className="verdict-hero-meter" aria-label={`Evidence: ${meter.found} found, ${meter.ranked} ranked, ${meter.used} used`}>
      <MeterCell label="Found" value={meter.found} />
      <span className="verdict-hero-meter-sep" aria-hidden="true">·</span>
      <MeterCell label="Ranked" value={meter.ranked} />
      <span className="verdict-hero-meter-sep" aria-hidden="true">·</span>
      <MeterCell label="Used" value={meter.used} accent />
    </div>
  )
}

function MeterCell({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <span className="verdict-hero-meter-cell">
      <span className="mono tnum" style={{ fontSize: 13, color: accent ? 'var(--text)' : 'var(--text-muted)', fontWeight: 600 }}>
        {value}
      </span>
      <span className="kicker" style={{ fontSize: 9 }}>{label}</span>
    </span>
  )
}

export default function VerdictHero({
  verdict,
  subline,
  confidence,
  confidenceScore,
  trustState,
  generatedAt,
  workflowLabel,
  evidenceMeter,
  subject,
}: VerdictHeroProps) {
  const variants = useReducedMotionSafe()
  const live = useLiveTimestamp(generatedAt)

  const scoreRaw = confidenceScore ?? CONFIDENCE_FALLBACK_SCORE[confidence]
  const score = Math.max(0, Math.min(1, scoreRaw))
  const color = CONFIDENCE_COLOR[confidence]
  const confLabel = CONFIDENCE_LABEL[confidence]

  // Glow intensity scales with score. Low confidence reads muted.
  const glowSize = 360 + Math.round(score * 180)
  const glowOpacity = 0.18 + score * 0.42
  const trust = trustState ? TRUST_CONFIG[trustState] : null

  return (
    <motion.section
      className="verdict-hero"
      initial="hidden"
      animate="visible"
      variants={variants.heroReveal}
      aria-label="Verdict"
    >
      <motion.div
        aria-hidden="true"
        className="verdict-hero-glow"
        style={{
          width: glowSize,
          height: glowSize,
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          opacity: glowOpacity,
        }}
        initial="hidden"
        animate="visible"
        variants={variants.confidenceGlow}
      />

      <div className="verdict-hero-topline">
        <div className="verdict-hero-kicker-stack">
          {workflowLabel && (
            <span className="kicker" style={{ color }}>{workflowLabel}</span>
          )}
          {subject && (
            <span className="mono" style={{ fontSize: 11, color: 'var(--text-soft)', letterSpacing: '0.04em' }}>
              {subject}
            </span>
          )}
        </div>

        {live && (
          <span
            className="mono tnum"
            style={{ fontSize: 11, color: 'var(--text-soft)' }}
            title={generatedAt ?? undefined}
          >
            Generated {live}
          </span>
        )}
      </div>

      <h1 className="verdict-hero-headline display">{verdict}</h1>

      {subline && (
        <p className="verdict-hero-subline">{subline}</p>
      )}

      <div className="verdict-hero-badges">
        <span
          className="verdict-hero-confidence"
          style={{
            color,
            borderColor: color,
            background: `color-mix(in oklch, ${color} 10%, transparent)`,
          }}
          aria-label={confLabel}
        >
          <span className="verdict-hero-confidence-dot" style={{ background: color }} aria-hidden="true" />
          {confLabel}
        </span>

        {trust && (
          <span
            className="verdict-hero-trust"
            style={{ color: trust.color, borderColor: trust.color, background: trust.background }}
            aria-label={`Trust state: ${trust.label}`}
          >
            {trust.label}
          </span>
        )}

        {evidenceMeter && <CompactMeter meter={evidenceMeter} />}
      </div>

      <style jsx>{`
        .verdict-hero {
          position: relative;
          overflow: hidden;
          isolation: isolate;
          padding: 36px 28px 32px;
          border: 1px solid var(--border);
          border-radius: 28px;
          background: var(--bg-elevated);
        }
        .verdict-hero-glow {
          position: absolute;
          top: -30%;
          left: 50%;
          transform: translateX(-50%);
          border-radius: 9999px;
          filter: blur(60px);
          pointer-events: none;
          z-index: 0;
        }
        .verdict-hero > :not(.verdict-hero-glow) {
          position: relative;
          z-index: 1;
        }
        .verdict-hero-topline {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
        }
        .verdict-hero-kicker-stack {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .verdict-hero-headline {
          font-size: clamp(28px, 4.4vw, 48px);
          line-height: 1.08;
          letter-spacing: -0.02em;
          font-weight: 400;
          color: var(--text);
          margin: 0;
          max-width: 28ch;
        }
        .verdict-hero-subline {
          margin-top: 14px;
          font-size: 15px;
          line-height: 1.55;
          color: var(--text-muted);
          max-width: 64ch;
        }
        .verdict-hero-badges {
          margin-top: 22px;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px 14px;
        }
        .verdict-hero-confidence,
        .verdict-hero-trust {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid;
          border-radius: 9999px;
          padding: 5px 12px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.02em;
        }
        .verdict-hero-confidence-dot {
          width: 6px;
          height: 6px;
          border-radius: 9999px;
        }
        :global(.verdict-hero-meter) {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 4px 12px;
          border: 1px solid var(--border);
          border-radius: 9999px;
          background: var(--surface);
        }
        :global(.verdict-hero-meter-cell) {
          display: inline-flex;
          align-items: baseline;
          gap: 5px;
        }
        :global(.verdict-hero-meter-sep) {
          color: var(--text-soft);
          font-size: 11px;
        }
        @media (max-width: 640px) {
          .verdict-hero {
            padding: 28px 20px 24px;
            border-radius: 22px;
          }
          .verdict-hero-headline {
            font-size: clamp(26px, 8vw, 34px);
          }
        }
      `}</style>
    </motion.section>
  )
}
