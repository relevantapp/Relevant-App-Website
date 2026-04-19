'use client'

const TYPE_LABELS: Record<string, string> = {
  meeting_prep: 'Meeting Prep',
  competitive_analysis: 'Competitive Intel',
  business_case: 'Business Case',
  market_research: 'Market Research',
}

const TYPE_KICKER_COLOR: Record<string, string> = {
  meeting_prep: 'var(--accent-amber)',
  competitive_analysis: 'var(--accent-teal)',
  business_case: 'var(--accent-amber)',
  market_research: 'var(--accent-teal)',
}

function Meter({ value, color, label }: { value: number; color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="kicker" style={{ minWidth: 40 }}>{label}</span>
      <div className="h-1 w-20 overflow-hidden rounded-sm" style={{ background: 'var(--surface)' }}>
        <div className="h-full rounded-sm" style={{ width: `${value * 100}%`, background: color }} />
      </div>
      <span className="mono tnum text-[10px]" style={{ color: 'var(--text-muted)' }}>
        {Math.round(value * 100)}
      </span>
    </div>
  )
}

interface ResultsHeroProps {
  headline: string
  bottomLine: string
  confidence: 'high' | 'medium' | 'low'
  researchType: string
  whyItMatters?: string | null
  generatedAt?: string | null
}

export default function ResultsHero({ headline, bottomLine, confidence, researchType, whyItMatters, generatedAt }: ResultsHeroProps) {
  const typeLabel = TYPE_LABELS[researchType] ?? 'Intelligence'
  const kickerColor = TYPE_KICKER_COLOR[researchType] ?? 'var(--accent-amber)'
  const confValue = confidence === 'high' ? 0.88 : confidence === 'medium' ? 0.62 : 0.35

  let formattedTime = ''
  if (generatedAt) {
    try {
      formattedTime = new Date(generatedAt).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
      })
    } catch { /* skip */ }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="kicker" style={{ color: kickerColor }}>{typeLabel}</div>
        {formattedTime && (
          <span className="mono tnum" style={{ fontSize: 10, color: 'var(--text-soft)' }}>
            Generated {formattedTime}
          </span>
        )}
      </div>

      <h1 className="display text-[32px] font-normal leading-[1.1] tracking-tight sm:text-[38px]" style={{ color: 'var(--text)' }}>
        {headline}
      </h1>

      <div
        className="mt-5 border-l-2 py-1 pl-5"
        style={{ borderColor: kickerColor }}
      >
        <div className="kicker mb-2" style={{ color: kickerColor }}>Bottom line</div>
        <p className="display text-[15px] leading-[1.55]" style={{ color: 'var(--text-muted)' }}>
          {bottomLine}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-5 border-t pt-5" style={{ borderColor: 'var(--border)' }}>
        <Meter value={confValue} color="var(--accent-teal)" label="Conf" />
        <Meter value={0.82} color="var(--accent-amber)" label="Evid" />
        <Meter value={0.94} color="var(--accent-teal)" label="Fresh" />
      </div>

      {whyItMatters && (
        <div
          style={{
            marginTop: 20,
            padding: '12px 16px',
            borderLeft: '2px solid var(--accent-amber)',
            background: 'rgba(255,190,60,0.04)',
          }}
        >
          <div className="kicker" style={{ color: 'var(--accent-amber)', marginBottom: 4 }}>
            Why this matters to you
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text-muted)', margin: 0 }}>
            {whyItMatters}
          </p>
        </div>
      )}
    </div>
  )
}
