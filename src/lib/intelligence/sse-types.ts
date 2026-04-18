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

export function streamReducer(state: StreamState, action: StreamAction): StreamState {
  switch (action.type) {
    case 'START_STREAM':
      return { ...INITIAL_STREAM_STATE, isStreaming: true }

    case 'RESET':
      return INITIAL_STREAM_STATE

    case 'step_start':
      return {
        ...state,
        steps: [
          ...state.steps,
          { id: action.step, label: action.label, status: 'in-progress' },
        ],
      }

    case 'step_done':
      return {
        ...state,
        steps: state.steps.map((s) =>
          s.id === action.step ? { ...s, status: 'done' as const, summary: action.summary } : s
        ),
      }

    case 'discovery':
      return {
        ...state,
        discoveries: [...state.discoveries, { kind: action.kind, text: action.text }],
      }

    case 'step_error':
      return {
        ...state,
        steps: state.steps.map((s) =>
          s.id === action.step ? { ...s, status: 'error' as const, errorReason: action.reason } : s
        ),
      }

    case 'brief_ready':
      return { ...state, brief: action.brief, isStreaming: false }

    case 'stream_error':
      return { ...state, error: action.error, isStreaming: false }

    default:
      return state
  }
}
