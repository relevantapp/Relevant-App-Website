/* ── SSE Event Types for Intelligence Streaming ────────────── */

import type { IntelligenceBrief, ResearchType } from './contracts'

/* ── Server → Client events ────────────────────────────────── */

export interface StepStartEvent {
  type: 'step_start'
  step: string
  label: string
}

export interface StepDoneEvent {
  type: 'step_done'
  step: string
  summary: string
}

export interface DiscoveryEvent {
  type: 'discovery'
  kind: 'entity' | 'attendee' | 'competitor' | 'source' | 'insight'
  text: string
}

export interface StepErrorEvent {
  type: 'step_error'
  step: string
  reason: string
}

export interface BriefReadyEvent {
  type: 'brief_ready'
  brief: IntelligenceBrief
}

export interface StreamErrorEvent {
  type: 'stream_error'
  error: string
}

export type SSEEvent =
  | StepStartEvent
  | StepDoneEvent
  | DiscoveryEvent
  | StepErrorEvent
  | BriefReadyEvent
  | StreamErrorEvent

/* ── Client-side stream state ──────────────────────────────── */

export interface StreamStep {
  id: string
  label: string
  status: 'in-progress' | 'done' | 'error'
  summary?: string
  errorReason?: string
}

export interface StreamState {
  steps: StreamStep[]
  discoveries: Array<{ kind: DiscoveryEvent['kind']; text: string }>
  brief: IntelligenceBrief | null
  error: string | null
  isStreaming: boolean
}

export const MAX_DISCOVERY_HISTORY = 25

export const INITIAL_STREAM_STATE: StreamState = {
  steps: [],
  discoveries: [],
  brief: null,
  error: null,
  isStreaming: false,
}

/* ── Stream state reducer ──────────────────────────────────── */

export type StreamAction =
  | { type: 'START_STREAM' }
  | { type: 'RESET' }
  | SSEEvent

function upsertStep(state: StreamState, nextStep: StreamStep): StreamStep[] {
  const existingIndex = state.steps.findIndex((step) => step.id === nextStep.id)
  if (existingIndex === -1) return [...state.steps, nextStep]

  return state.steps.map((step, index) => (index === existingIndex ? nextStep : step))
}

export function streamReducer(state: StreamState, action: StreamAction): StreamState {
  switch (action.type) {
    case 'START_STREAM':
      return { ...INITIAL_STREAM_STATE, isStreaming: true }

    case 'RESET':
      return INITIAL_STREAM_STATE

    case 'step_start':
      return {
        ...state,
        steps: upsertStep(state, { id: action.step, label: action.label, status: 'in-progress' }),
      }

    case 'step_done':
      return {
        ...state,
        steps: upsertStep(state, {
          id: action.step,
          label: state.steps.find((step) => step.id === action.step)?.label ?? action.step,
          status: 'done',
          summary: action.summary,
        }),
      }

    case 'discovery':
      return {
        ...state,
        discoveries: [...state.discoveries, { kind: action.kind, text: action.text }].slice(-MAX_DISCOVERY_HISTORY),
      }

    case 'step_error':
      return {
        ...state,
        steps: upsertStep(state, {
          id: action.step,
          label: state.steps.find((step) => step.id === action.step)?.label ?? action.step,
          status: 'error',
          errorReason: action.reason,
        }),
      }

    case 'brief_ready':
      return { ...state, brief: action.brief, isStreaming: false }

    case 'stream_error':
      return { ...state, error: action.error, isStreaming: false }

    default:
      return state
  }
}
