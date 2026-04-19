'use client'

import { useState, useEffect } from 'react'

const SAMPLE_CANDIDATES = [
  {
    eventKey: 'ev_stripe_embed',
    headline: 'Stripe launches embedded finance SDK',
    summary: 'New SDK enables platforms to embed payments, lending, and treasury into their products.',
    dimensions: ['competitive', 'product', 'strategic'],
  },
  {
    eventKey: 'ev_fed_rate',
    headline: 'Fed signals rate hold through Q3',
    summary: 'Federal Reserve indicates rates will remain elevated, impacting fintech lending margins.',
    dimensions: ['financial', 'regulatory', 'macro'],
  },
  {
    eventKey: 'ev_plaid_breach',
    headline: 'Plaid data handling practices under FTC review',
    summary: 'FTC opens investigation into Plaid\'s data collection scope, potential consent violations.',
    dimensions: ['regulatory', 'operational', 'trust'],
  },
  {
    eventKey: 'ev_ai_underwriting',
    headline: 'AI underwriting accuracy surpasses traditional models',
    summary: 'New study shows ML-based credit scoring reduces default rates by 23% across fintech lenders.',
    dimensions: ['technical', 'competitive', 'financial'],
  },
]

const SAMPLE_INTENT = {
  label: 'Payments infrastructure consolidation is reshaping competitive positioning',
  rationale:
    'Three of four signals this week point to embedded finance fragmentation — Stripe SDK, Plaid scrutiny, and AI underwriting all intersect at platform infrastructure.',
  topDimensions: ['competitive', 'strategic', 'regulatory'],
}

type Phase = 'candidates' | 'analyzing' | 'intent'

export function IntentLayerViz() {
  const [phase, setPhase] = useState<Phase>('candidates')
  const [highlightedEvent, setHighlightedEvent] = useState<string | null>(null)

  useEffect(() => {
    if (phase !== 'analyzing') return
    const timer = setTimeout(() => setPhase('intent'), 2000)
    return () => clearTimeout(timer)
  }, [phase])

  return (
    <div className="space-y-8">
      {/* Explanation */}
      <div className="max-w-2xl">
        <h2 className="text-2xl font-display font-bold mb-2">Intent Layer</h2>
        <p className="text-[var(--color-gray-400)]">
          Before writing individual signals, the AI looks at all candidates together
          and identifies a &quot;narrative spine&quot; — the overarching theme that connects this
          week&apos;s events. Each signal is then framed relative to this spine, creating
          a coherent brief instead of a disconnected list.
        </p>
      </div>

      {/* Interactive flow */}
      <div className="flex gap-2 mb-4">
        <PhaseButton label="1. Candidates" active={phase === 'candidates'} onClick={() => setPhase('candidates')} />
        <PhaseButton label="2. AI Analysis" active={phase === 'analyzing'} onClick={() => setPhase('analyzing')} />
        <PhaseButton label="3. Intent" active={phase === 'intent'} onClick={() => setPhase('intent')} />
      </div>

      {phase === 'candidates' && (
        <div className="space-y-6">
          <p className="text-sm text-[var(--color-gray-500)]">
            This week&apos;s signal candidates — each scored and ready for generation:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {SAMPLE_CANDIDATES.map((c) => (
              <div
                key={c.eventKey}
                className="p-4 rounded-xl bg-[var(--color-gray-900)] border border-[var(--color-gray-800)]"
              >
                <p className="font-semibold text-sm text-[var(--color-gray-200)] mb-1">{c.headline}</p>
                <p className="text-xs text-[var(--color-gray-500)] mb-3">{c.summary}</p>
                <div className="flex gap-1.5 flex-wrap">
                  {c.dimensions.map((d) => (
                    <span key={d} className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--color-teal-500)]/10 text-[var(--color-teal-400)]">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setPhase('analyzing')}
            className="px-4 py-2 rounded-lg bg-[var(--color-teal-500)]/20 text-[var(--color-teal-400)] text-sm font-medium hover:bg-[var(--color-teal-500)]/30 transition-colors"
          >
            Run intent analysis →
          </button>
        </div>
      )}

      {phase === 'analyzing' && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full border-2 border-[var(--color-teal-500)] border-t-transparent animate-spin mx-auto" />
            <p className="text-sm text-[var(--color-teal-400)] font-mono">
              Analyzing cross-signal patterns...
            </p>
            <p className="text-xs text-[var(--color-gray-600)]">
              AI reads all candidates together to find the connecting theme
            </p>
          </div>
        </div>
      )}

      {phase === 'intent' && (
        <div className="space-y-6">
          {/* Intent result */}
          <div className="p-6 rounded-xl bg-gradient-to-r from-[var(--color-teal-500)]/10 to-[var(--color-blue-500)]/5 border border-[var(--color-teal-500)]/30">
            <p className="text-xs font-mono text-[var(--color-teal-400)] uppercase tracking-wider mb-2">
              Weekly intent — narrative spine
            </p>
            <p className="text-lg font-display font-semibold text-[var(--color-gray-100)] mb-3">
              &quot;{SAMPLE_INTENT.label}&quot;
            </p>
            <p className="text-sm text-[var(--color-gray-400)] mb-4">{SAMPLE_INTENT.rationale}</p>
            <div className="flex gap-2">
              {SAMPLE_INTENT.topDimensions.map((d) => (
                <span key={d} className="px-3 py-1 rounded-full text-xs font-mono bg-[var(--color-teal-500)]/10 text-[var(--color-teal-300)] border border-[var(--color-teal-500)]/20">
                  {d}
                </span>
              ))}
            </div>
          </div>

          {/* How it affects each signal */}
          <p className="text-sm font-semibold text-[var(--color-gray-300)]">
            Each signal now gets framed relative to this spine:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {SAMPLE_CANDIDATES.map((c) => (
              <div
                key={c.eventKey}
                onMouseEnter={() => setHighlightedEvent(c.eventKey)}
                onMouseLeave={() => setHighlightedEvent(null)}
                className={`p-4 rounded-xl border transition-all ${
                  highlightedEvent === c.eventKey
                    ? 'bg-[var(--color-teal-500)]/5 border-[var(--color-teal-500)]/30'
                    : 'bg-[var(--color-gray-900)] border-[var(--color-gray-800)]'
                }`}
              >
                <p className="font-semibold text-sm text-[var(--color-gray-200)] mb-1">{c.headline}</p>
                <p className="text-xs text-[var(--color-teal-400)] mt-2">
                  ↳ Framed through: infrastructure consolidation lens
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setPhase('candidates')}
            className="text-sm text-[var(--color-gray-500)] hover:text-[var(--color-gray-300)] transition-colors"
          >
            ← Reset
          </button>
        </div>
      )}

      {/* How it works */}
      <div className="bg-[var(--color-gray-900)] rounded-xl border border-[var(--color-gray-800)] p-6 mt-4">
        <p className="text-sm font-semibold text-[var(--color-gray-200)] mb-3">How it works</p>
        <div className="space-y-3 text-sm text-[var(--color-gray-400)]">
          <p>1. All scored candidates are sent to the AI as a batch</p>
          <p>2. AI identifies the dominant cross-cutting theme</p>
          <p>3. The &quot;intent&quot; becomes the narrative spine for this brief</p>
          <p>4. Each individual signal is written with this spine as context</p>
          <p>5. Result: a coherent daily brief, not a disconnected list</p>
        </div>
      </div>
    </div>
  )
}

function PhaseButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        active
          ? 'bg-[var(--color-teal-500)]/20 text-[var(--color-teal-400)] border border-[var(--color-teal-500)]/40'
          : 'text-[var(--color-gray-500)] hover:text-[var(--color-gray-400)]'
      }`}
    >
      {label}
    </button>
  )
}
