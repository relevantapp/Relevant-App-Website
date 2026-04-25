'use client'

import { forwardRef, useMemo } from 'react'

/**
 * ShareCard — off-screen, dark editorial cover card used to produce a PNG
 * share asset. Intentionally declarative: the hero visual is a stylized
 * confidence ring with tagged drivers, not a screenshot of the page.
 *
 * Two fixed sizes are supported: `1200x630` (Open Graph landscape) and
 * `1080x1080` (social square). Callers render this tree invisibly, pass the
 * DOM node to `html-to-image`, and discard after capture.
 */

export type ShareCardSize = '1200x630' | '1080x1080'

export interface ShareCardEvidenceCounts {
  /** How many documents the pipeline considered after search. */
  found: number | null
  /** How many it ranked high enough to keep. */
  ranked: number | null
  /** How many ended up cited in the answer. */
  used: number | null
  /** Age of the newest source, in days. null when unknown. */
  newestAgeDays: number | null
}

export interface ShareCardDriver {
  label: string
  /** Optional short tag shown alongside the label (e.g. "must"). */
  tag?: string | null
}

export interface ShareCardProps {
  size?: ShareCardSize
  /** "Meeting prep", "Competitive", etc. */
  workflowLabel: string
  /** The subject of the brief — account name, market, competitor, etc. */
  subject: string
  /** One-line verdict. Wraps on two lines max. */
  verdict: string
  /** Numeric confidence 0..1 for the ring arc. */
  confidence: number
  /** "High" | "Medium" | "Low" label for the ring. */
  confidenceLevel: 'high' | 'medium' | 'low'
  /** 1-3 stylized drivers shown under the ring. */
  drivers: ShareCardDriver[]
  evidence: ShareCardEvidenceCounts
  /** Brand mark shown in the footer. */
  brand?: string
}

const SIZE_MAP: Record<ShareCardSize, { w: number; h: number; layout: 'landscape' | 'square' }> = {
  '1200x630': { w: 1200, h: 630, layout: 'landscape' },
  '1080x1080': { w: 1080, h: 1080, layout: 'square' },
}

const ACCENT_BY_LEVEL: Record<ShareCardProps['confidenceLevel'], string> = {
  high: '#4ddbb3',
  medium: '#f5c06a',
  low: '#f08a7a',
}

const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(function ShareCard(
  {
    size = '1200x630',
    workflowLabel,
    subject,
    verdict,
    confidence,
    confidenceLevel,
    drivers,
    evidence,
    brand = 'relevant',
  },
  ref,
) {
  const { w, h, layout } = SIZE_MAP[size]
  const accent = ACCENT_BY_LEVEL[confidenceLevel]
  const clampedConfidence = useMemo(() => Math.max(0, Math.min(1, confidence)), [confidence])

  const isSquare = layout === 'square'
  const verdictSize = isSquare ? 56 : 52
  const subjectSize = isSquare ? 24 : 22
  const ringSize = isSquare ? 260 : 220

  const counts: Array<{ label: string; value: string }> = [
    { label: 'Found', value: formatCount(evidence.found) },
    { label: 'Ranked', value: formatCount(evidence.ranked) },
    { label: 'Used', value: formatCount(evidence.used) },
    { label: 'Newest', value: formatAge(evidence.newestAgeDays) },
  ]

  return (
    <div
      ref={ref}
      data-intel-share-card=""
      data-size={size}
      style={{
        width: w,
        height: h,
        background: 'radial-gradient(120% 100% at 0% 0%, #1b1f26 0%, #0c0e12 58%, #08090c 100%)',
        color: '#eef1f4',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        padding: isSquare ? 64 : 56,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        letterSpacing: '-0.01em',
      }}
    >
      {/* Top band: workflow + subject */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div
          style={{
            fontSize: 12,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: accent,
            fontWeight: 600,
          }}
        >
          {workflowLabel}
        </div>
        <div
          style={{
            fontSize: subjectSize,
            color: '#8d96a3',
            fontWeight: 400,
            maxWidth: '90%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {subject}
        </div>
      </div>

      {/* Middle band: verdict + ring + drivers */}
      <div
        style={{
          display: 'flex',
          flexDirection: isSquare ? 'column' : 'row',
          alignItems: isSquare ? 'flex-start' : 'center',
          gap: isSquare ? 40 : 56,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: verdictSize,
              lineHeight: 1.1,
              fontWeight: 600,
              color: '#f5f7fa',
              letterSpacing: '-0.02em',
              maxWidth: isSquare ? '100%' : 640,
            }}
          >
            {verdict}
          </div>
          {drivers.length > 0 ? (
            <div
              style={{
                marginTop: 28,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              {drivers.slice(0, 3).map((driver, idx) => (
                <div
                  key={`${driver.label}-${idx}`}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 999,
                    border: `1px solid ${accent}33`,
                    background: `${accent}0d`,
                    color: '#d6dbe1',
                    fontSize: 14,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      background: accent,
                      display: 'inline-block',
                    }}
                  />
                  {driver.tag ? (
                    <span style={{ color: '#8d96a3', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      {driver.tag}
                    </span>
                  ) : null}
                  <span>{driver.label}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <ConfidenceRing
          size={ringSize}
          confidence={clampedConfidence}
          level={confidenceLevel}
          accent={accent}
        />
      </div>

      {/* Bottom band: evidence counts + brand */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: 24,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
          }}
        >
          {counts.map((c) => (
            <div key={c.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: '#6c7480',
                }}
              >
                {c.label}
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                  color: '#eef1f4',
                }}
              >
                {c.value}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12,
            color: '#6c7480',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          <span style={{ fontWeight: 600, color: '#d6dbe1' }}>{brand}</span>
          <span>Intelligence brief</span>
        </div>
      </div>
    </div>
  )
})

export default ShareCard

function formatCount(n: number | null): string {
  if (n == null || Number.isNaN(n)) return '—'
  return String(n)
}

function formatAge(days: number | null): string {
  if (days == null || Number.isNaN(days)) return '—'
  if (days < 1) return '<1d'
  if (days < 30) return `${Math.round(days)}d`
  if (days < 365) return `${Math.round(days / 30)}mo`
  return `${Math.round(days / 365)}y`
}

/* ── Confidence ring ─────────────────────────────────────────── */

function ConfidenceRing({
  size,
  confidence,
  level,
  accent,
}: {
  size: number
  confidence: number
  level: ShareCardProps['confidenceLevel']
  accent: string
}) {
  const stroke = Math.max(8, Math.round(size * 0.06))
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const dash = circumference * confidence
  const pct = Math.round(confidence * 100)

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ display: 'block', transform: 'rotate(-90deg)' }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={accent}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        <div
          style={{
            fontSize: Math.round(size * 0.22),
            fontWeight: 600,
            color: '#f5f7fa',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.02em',
          }}
        >
          {pct}
        </div>
        <div
          style={{
            fontSize: 11,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: accent,
            fontWeight: 600,
          }}
        >
          {level} confidence
        </div>
      </div>
    </div>
  )
}
