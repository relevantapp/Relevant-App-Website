/* ── Activity Rail — Live streaming progress timeline ─────── */

'use client'

import { Loader2, Check, AlertTriangle, Sparkles, Search, Brain, Layers } from 'lucide-react'
import type { StreamState } from '@/lib/intelligence/sse-types'

const STEP_ICONS: Record<string, React.ReactNode> = {
  resolveEntity: <Search className="h-3.5 w-3.5" />,
  gatherEvidence: <Layers className="h-3.5 w-3.5" />,
  rankEvidence: <Sparkles className="h-3.5 w-3.5" />,
  synthesize: <Brain className="h-3.5 w-3.5" />,
  assembleBrief: <Check className="h-3.5 w-3.5" />,
}

function StepIcon({ stepId, status }: { stepId: string; status: 'in-progress' | 'done' | 'error' }) {
  if (status === 'in-progress') {
    return <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--accent)]" />
  }
  if (status === 'error') {
    return <AlertTriangle className="h-3.5 w-3.5 text-[var(--accent-coral)]" />
  }
  return <span className="text-[var(--accent-teal)]">{STEP_ICONS[stepId] ?? <Check className="h-3.5 w-3.5" />}</span>
}

interface ActivityRailProps {
  state: StreamState
}

export default function ActivityRail({ state }: ActivityRailProps) {
  const { steps, discoveries } = state

  if (steps.length === 0 && !state.isStreaming) return null

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="rounded-xl border border-[var(--surface-strong)] bg-[var(--surface)] p-3 sm:p-5">
        <h3 className="mb-4 text-sm font-semibold text-[var(--text)]">Research Progress</h3>

        {/* Steps timeline */}
        <div className="relative space-y-0">
          {steps.map((step, i) => (
            <div key={step.id} className="relative flex gap-3 pb-4">
              {/* Timeline line */}
              {i < steps.length - 1 && (
                <div className="absolute left-[11px] top-6 h-[calc(100%-12px)] w-px bg-[var(--surface-strong)]" />
              )}

              {/* Icon */}
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--surface-strong)] bg-[var(--bg)]">
                <StepIcon stepId={step.id} status={step.status} />
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 pt-0.5">
                <p className={`text-sm font-medium ${
                  step.status === 'error' ? 'text-[var(--accent-coral)]' :
                  step.status === 'done' ? 'text-[var(--text)]' :
                  'text-[var(--accent)]'
                }`}>
                  {step.label}
                </p>
                {step.summary && (
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">{step.summary}</p>
                )}
                {step.errorReason && (
                  <p className="mt-0.5 text-xs text-[var(--accent-coral)]">{step.errorReason}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Discoveries */}
        {discoveries.length > 0 && (
          <div className="mt-3 border-t border-[var(--surface-strong)] pt-3">
            <div className="space-y-1.5">
              {discoveries.slice(-5).map((d, i) => (
                <p key={i} className="text-xs text-[var(--text-soft)]">
                  <span className="mr-1.5 inline-block rounded bg-[var(--accent)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[var(--accent)]">
                    {d.kind}
                  </span>
                  {d.text}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
