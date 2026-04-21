/* ── streamReducer Unit Tests ───────────────────────────────── */

import { describe, it, expect } from 'vitest'
import { streamReducer, INITIAL_STREAM_STATE, MAX_DISCOVERY_HISTORY } from '../sse-types'
import type { StreamState, StreamAction } from '../sse-types'

function dispatch(actions: StreamAction[]): StreamState {
  return actions.reduce(streamReducer, INITIAL_STREAM_STATE)
}

describe('streamReducer', () => {
  it('START_STREAM resets state and sets isStreaming', () => {
    const state = dispatch([{ type: 'START_STREAM' }])
    expect(state.isStreaming).toBe(true)
    expect(state.steps).toHaveLength(0)
    expect(state.brief).toBeNull()
    expect(state.error).toBeNull()
  })

  it('RESET clears everything', () => {
    const state = dispatch([
      { type: 'START_STREAM' },
      { type: 'step_start', step: 'fetch', label: 'Fetching' },
      { type: 'RESET' },
    ])
    expect(state).toEqual(INITIAL_STREAM_STATE)
  })

  it('step_start adds a step with in-progress status', () => {
    const state = dispatch([
      { type: 'START_STREAM' },
      { type: 'step_start', step: 'fetch', label: 'Fetching sources' },
    ])
    expect(state.steps).toHaveLength(1)
    expect(state.steps[0].id).toBe('fetch')
    expect(state.steps[0].label).toBe('Fetching sources')
    expect(state.steps[0].status).toBe('in-progress')
  })

  it('step_done marks step as done with summary', () => {
    const state = dispatch([
      { type: 'START_STREAM' },
      { type: 'step_start', step: 'fetch', label: 'Fetching' },
      { type: 'step_done', step: 'fetch', summary: 'Found 12 sources' },
    ])
    expect(state.steps[0].status).toBe('done')
    expect(state.steps[0].summary).toBe('Found 12 sources')
  })

  it('step_error marks step as error', () => {
    const state = dispatch([
      { type: 'START_STREAM' },
      { type: 'step_start', step: 'synth', label: 'Synthesizing' },
      { type: 'step_error', step: 'synth', reason: 'Model timeout' },
    ])
    expect(state.steps[0].status).toBe('error')
    expect(state.steps[0].errorReason).toBe('Model timeout')
  })

  it('discovery appends to discoveries list', () => {
    const state = dispatch([
      { type: 'START_STREAM' },
      { type: 'discovery', kind: 'entity', text: 'OpenAI' },
      { type: 'discovery', kind: 'source', text: 'reuters.com article' },
    ])
    expect(state.discoveries).toHaveLength(2)
    expect(state.discoveries[0].kind).toBe('entity')
    expect(state.discoveries[1].text).toBe('reuters.com article')
  })

  it('caps discoveries to a rolling window', () => {
    const actions: StreamAction[] = [{ type: 'START_STREAM' }]

    for (let i = 0; i < MAX_DISCOVERY_HISTORY + 3; i++) {
      actions.push({ type: 'discovery', kind: 'source', text: `discovery-${i}` })
    }

    const state = dispatch(actions)
    expect(state.discoveries).toHaveLength(MAX_DISCOVERY_HISTORY)
    expect(state.discoveries[0].text).toBe('discovery-3')
    expect(state.discoveries.at(-1)?.text).toBe(`discovery-${MAX_DISCOVERY_HISTORY + 2}`)
  })

  it('upserts duplicate step_start events instead of duplicating the step', () => {
    const state = dispatch([
      { type: 'START_STREAM' },
      { type: 'step_start', step: 'fetch', label: 'Fetching sources' },
      { type: 'step_start', step: 'fetch', label: 'Fetching sources again' },
    ])

    expect(state.steps).toHaveLength(1)
    expect(state.steps[0].label).toBe('Fetching sources again')
    expect(state.steps[0].status).toBe('in-progress')
  })

  it('brief_ready stores brief and stops streaming', () => {
    const mockBrief = { type: 'meeting_prep', headline: 'Test' } as never
    const state = dispatch([
      { type: 'START_STREAM' },
      { type: 'brief_ready', brief: mockBrief },
    ])
    expect(state.brief).toBe(mockBrief)
    expect(state.isStreaming).toBe(false)
  })

  it('stream_error stores error and stops streaming', () => {
    const state = dispatch([
      { type: 'START_STREAM' },
      { type: 'stream_error', error: 'Rate limited' },
    ])
    expect(state.error).toBe('Rate limited')
    expect(state.isStreaming).toBe(false)
  })

  it('handles multiple steps in sequence', () => {
    const state = dispatch([
      { type: 'START_STREAM' },
      { type: 'step_start', step: 'exa', label: 'Exa search' },
      { type: 'step_done', step: 'exa', summary: 'Found 8' },
      { type: 'step_start', step: 'tavily', label: 'Tavily search' },
      { type: 'step_done', step: 'tavily', summary: 'Found 6' },
      { type: 'step_start', step: 'synth', label: 'Synthesizing' },
      { type: 'step_done', step: 'synth', summary: 'Brief generated' },
    ])
    expect(state.steps).toHaveLength(3)
    expect(state.steps.every((s) => s.status === 'done')).toBe(true)
  })
})
