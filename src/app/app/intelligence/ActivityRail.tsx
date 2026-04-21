/* ── Activity Rail — Live streaming progress timeline ─────── */

'use client'

import { Loader2, Check, AlertTriangle, Activity } from 'lucide-react'
import type { StreamState } from '@/lib/intelligence/sse-types'
import { motion, useReducedMotion } from 'framer-motion'

interface PhaseStepDefinition {
  id: string
  optional?: boolean
}

interface PhaseDefinition {
  id: string
  title: string
  steps: readonly PhaseStepDefinition[]
}

const PHASE_DEFINITIONS = [
  {
    id: 'ingestion',
    title: 'Data Ingestion',
    steps: [
      { id: 'resolveEntity' },
      { id: 'planSearches' },
      { id: 'gatherEvidence' },
    ],
  },
  {
    id: 'extraction',
    title: 'Signal Extraction',
    steps: [{ id: 'rankEvidence' }],
  },
  {
    id: 'synthesis',
    title: 'Synthesis',
    steps: [{ id: 'synthesize' }, { id: 'assembleBrief', optional: true }],
  },
] satisfies readonly PhaseDefinition[]

const MAX_RENDERED_DISCOVERIES = 4
const RING_CIRCUMFERENCE = 283

type PhaseStatus = 'pending' | 'in-progress' | 'done' | 'error'

interface PhaseSnapshot {
  id: string
  title: string
  status: PhaseStatus
  progress: number
  detail: string
  errorReason: string | null
}

function getDiscoveryLabel(kind: StreamState['discoveries'][number]['kind']): string {
  switch (kind) {
    case 'entity':
      return 'ENTITY'
    case 'attendee':
      return 'ATTENDEE'
    case 'competitor':
      return 'COMPETITOR'
    case 'source':
      return 'SOURCE'
    case 'insight':
      return 'INSIGHT'
    default:
      return 'DISCOVERY'
  }
}

function getPhaseSnapshots(state: StreamState): PhaseSnapshot[] {
  const stepMap = new Map<string, StreamState['steps'][number]>(state.steps.map((step) => [step.id, step]))

  return PHASE_DEFINITIONS.map((phase, index) => {
    const entries = phase.steps.map((step) => ({ def: step, current: stepMap.get(step.id) }))
    const requiredEntries = entries.filter((entry) => !entry.def.optional)
    const startedEntries = entries.filter((entry) => entry.current)
    const doneEntries = entries.filter((entry) => entry.current?.status === 'done')
    const errorEntry = entries.find((entry) => entry.current?.status === 'error')
    const activeEntry = entries.find((entry) => entry.current?.status === 'in-progress')
    const allRequiredDone = requiredEntries.every((entry) => entry.current?.status === 'done')
    const allStartedOptionalDone = entries
      .filter((entry) => entry.def.optional && entry.current)
      .every((entry) => entry.current?.status === 'done')

    let status: PhaseStatus = 'pending'

    if (errorEntry) {
      status = 'error'
    } else if (
      allRequiredDone
      && allStartedOptionalDone
      && (Boolean(state.brief) || !state.isStreaming || entries.some((entry) => Boolean(entry.def.optional && entry.current)))
    ) {
      status = 'done'
    } else if (activeEntry || startedEntries.length > 0 || (state.isStreaming && state.steps.length === 0 && index === 0)) {
      status = 'in-progress'
    }

    const phaseStepCount = Math.max(1, requiredEntries.length + entries.filter((entry) => Boolean(entry.def.optional && entry.current)).length)
    const baseProgress = (doneEntries.length / phaseStepCount) * 100

    let progress = 0
    if (status === 'done') {
      progress = 100
    } else if (status === 'error') {
      progress = Math.max(baseProgress, 18)
    } else if (status === 'in-progress') {
      const hasActiveWork = Boolean(activeEntry) || (state.isStreaming && state.steps.length === 0 && index === 0)
      const activityLift = hasActiveWork
        ? 28 / phaseStepCount
        : 12 / phaseStepCount
      progress = Math.min(94, Math.max(baseProgress + activityLift * 100, 18))
    }

    const detail = errorEntry?.current?.errorReason
      ?? activeEntry?.current?.label
      ?? `${doneEntries.length}/${phaseStepCount} steps locked`

    return {
      id: phase.id,
      title: phase.title,
      status,
      progress,
      detail,
      errorReason: errorEntry?.current?.errorReason ?? null,
    }
  })
}

function PhaseRing({
  index,
  phase,
  shouldReduceMotion,
}: {
  index: number
  phase: PhaseSnapshot
  shouldReduceMotion: boolean
}) {
  const isDone = phase.status === 'done'
  const isError = phase.status === 'error'
  const isActive = phase.status === 'in-progress'

  const strokeColor = isError
    ? 'var(--accent-coral)'
    : isDone
      ? 'var(--accent-teal)'
      : isActive
        ? 'var(--accent)'
        : 'var(--border-strong)'

  return (
    <div className="z-10 flex flex-col items-center gap-3 text-center">
      <div className="relative flex h-20 w-20 items-center justify-center sm:h-24 sm:w-24">
        {isActive && !shouldReduceMotion && (
          <motion.div
            animate={{ opacity: [0.18, 0.38, 0.18], scale: [0.96, 1.04, 0.96] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full blur-xl"
            style={{
              background: 'color-mix(in oklch, var(--accent) 24%, transparent)',
            }}
          />
        )}

        <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="transparent"
            stroke="var(--surface-strong)"
            strokeWidth="5"
          />
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="transparent"
            stroke={strokeColor}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            initial={false}
            animate={{ strokeDashoffset: RING_CIRCUMFERENCE - (RING_CIRCUMFERENCE * phase.progress) / 100 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.45, ease: 'easeInOut' }}
          />
        </svg>

        <div
          className="absolute inset-0 flex items-center justify-center rounded-full border border-[var(--border)] shadow-[inset_0_0_0_1px_var(--border)]"
          style={{ background: 'color-mix(in oklch, var(--bg-elevated) 90%, transparent)' }}
        >
          {isDone ? (
            <Check className="h-5 w-5" style={{ color: strokeColor }} />
          ) : isError ? (
            <AlertTriangle className="h-5 w-5" style={{ color: strokeColor }} />
          ) : isActive ? (
            <Loader2 className={`h-5 w-5 ${shouldReduceMotion ? '' : 'animate-spin'}`} style={{ color: strokeColor }} />
          ) : (
            <span className="mono text-sm" style={{ color: 'var(--text-muted)' }}>
              0{index + 1}
            </span>
          )}
        </div>
      </div>

      <div className="min-h-[3.5rem] max-w-[7.5rem]">
        <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${isActive || isDone || isError ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>
          {phase.title}
        </p>
        <p className="mt-2 min-h-[2rem] text-[11px] leading-4 text-[var(--text-soft)]">
          {phase.detail}
        </p>
      </div>
    </div>
  )
}

function DiscoveryConsole({
  discoveries,
  isStreaming,
  error,
  shouldReduceMotion,
}: {
  discoveries: StreamState['discoveries']
  isStreaming: boolean
  error: string | null
  shouldReduceMotion: boolean
}) {
  const recentDiscoveries = discoveries.slice(-MAX_RENDERED_DISCOVERIES)
  const rows = Array.from({ length: MAX_RENDERED_DISCOVERIES }, (_, index) => {
    const offset = MAX_RENDERED_DISCOVERIES - recentDiscoveries.length
    return recentDiscoveries[index - offset] ?? null
  })

  return (
    <div
      className="border-t border-[var(--border)] px-4 py-3"
      style={{
        background: 'linear-gradient(180deg, color-mix(in oklch, var(--surface) 88%, var(--accent) 12%), var(--surface))',
      }}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="kicker">Discovery stream</span>
        <span className="mono text-[10px] tracking-[0.18em] text-[var(--text-soft)]">
          {isStreaming ? 'RECENT_PACKETS' : error ? 'STREAM_ERROR' : 'SESSION_LOG'}
        </span>
      </div>

      <div className="grid min-h-[6.25rem] grid-rows-4 gap-1 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg)]/70 px-3 py-2">
        {rows.map((discovery, index) => {
          const isNewest = Boolean(discovery && discovery === recentDiscoveries[recentDiscoveries.length - 1])

          if (!discovery) {
            return (
              <div
                key={`placeholder-${index}`}
                className="flex h-5 items-center gap-3 rounded px-2 text-[11px] text-[var(--text-soft)]"
              >
                <span className="mono w-[4.5rem] text-[10px] tracking-[0.18em]">WAIT</span>
                <span className="truncate">Awaiting the next verified signal...</span>
              </div>
            )
          }

          return (
            <motion.div
              key={`${discovery.kind}-${discovery.text}-${index}`}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.24, ease: 'easeOut' }}
              className="flex h-5 items-center gap-3 rounded px-2 text-[11px] text-[var(--text-muted)]"
              style={{
                background: isNewest ? 'color-mix(in oklch, var(--accent) 12%, transparent)' : 'transparent',
              }}
            >
              <span className="mono w-[4.5rem] text-[10px] tracking-[0.18em] text-[var(--accent)]">
                {getDiscoveryLabel(discovery.kind)}
              </span>
              <span className="truncate">{discovery.text}</span>
            </motion.div>
          )
        })}
      </div>

      {error && (
        <p className="mt-2 text-[11px] text-[var(--accent-coral)]">
          {error}
        </p>
      )}
    </div>
  )
}

interface ActivityRailProps {
  state: StreamState
}

export default function ActivityRail({ state }: ActivityRailProps) {
  const shouldReduceMotion = Boolean(useReducedMotion())
  const { steps, discoveries, isStreaming, error } = state

  if (steps.length === 0 && !isStreaming && !error) return null

  const phases = getPhaseSnapshots(state)
  const activePhase = phases.find((phase) => phase.status === 'error')
    ?? phases.find((phase) => phase.status === 'in-progress')
    ?? phases[phases.length - 1]
  const completedSteps = steps.filter((step) => step.status === 'done').length
  const totalTrackedSteps = PHASE_DEFINITIONS.flatMap((phase) => phase.steps).filter((step) => !step.optional).length
  const statusLabel = error ? 'STREAM_ERROR' : isStreaming ? 'STREAM_ACTIVE' : 'BRIEF_READY'

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-4 py-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[var(--accent)]" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text)]">
              Command Center
            </h3>
          </div>
          <div className="flex items-center gap-2 text-right">
            {isStreaming && !shouldReduceMotion && (
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent)]" />
              </span>
            )}
            <span className="text-xs font-mono text-[var(--text-muted)]">
              {statusLabel}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5">
          <div>
            <p className="kicker">Current phase</p>
            <p className="mt-1 text-sm font-medium text-[var(--text)]">{activePhase.title}</p>
          </div>
          <div className="text-right">
            <p className="mono text-xs text-[var(--text-muted)]">{completedSteps}/{totalTrackedSteps} core steps locked</p>
            <p className="mt-1 text-[11px] text-[var(--text-soft)]">{activePhase.detail}</p>
          </div>
        </div>

        <div className="relative flex min-h-[17rem] items-center justify-center overflow-hidden px-6 py-10 sm:px-8 sm:py-12">
          {isStreaming && !shouldReduceMotion && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-25">
              <motion.div
                animate={{ backgroundPosition: ['0% 0%', '100% 100%'], opacity: [0.22, 0.4, 0.22] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0"
                style={{
                  backgroundImage: 'radial-gradient(circle at center, color-mix(in oklch, var(--accent) 40%, transparent) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />
              <motion.div
                animate={{ scale: [0.95, 1.08, 0.95], opacity: [0.1, 0.22, 0.1] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute left-1/2 top-1/2 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
                style={{
                  background: 'radial-gradient(circle, color-mix(in oklch, var(--accent) 22%, transparent) 0%, transparent 68%)',
                }}
              />
            </div>
          )}

          <div className="absolute left-[18%] right-[18%] top-1/2 hidden h-px -translate-y-1/2 bg-[var(--border)] sm:block" />

          <div className="relative z-10 grid w-full max-w-2xl grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-10">
            {phases.map((phase, index) => (
              <PhaseRing
                key={phase.id}
                index={index}
                phase={phase}
                shouldReduceMotion={shouldReduceMotion}
              />
            ))}
          </div>
        </div>

        <DiscoveryConsole
          discoveries={discoveries}
          isStreaming={isStreaming}
          error={error}
          shouldReduceMotion={shouldReduceMotion}
        />
      </div>
    </div>
  )
}
