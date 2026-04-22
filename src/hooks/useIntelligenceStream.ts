/* ── useIntelligenceStream — SSE hook for streaming briefs ── */

'use client'

import { useReducer, useCallback, useRef } from 'react'
import { getValidAccessToken } from '@/lib/supabase'
import type { SSEEvent } from '@/lib/intelligence/sse-types'
import {
  streamReducer,
  INITIAL_STREAM_STATE,
  type StreamState,
} from '@/lib/intelligence/sse-types'

export interface UseIntelligenceStreamReturn {
  state: StreamState
  generate: (body: Record<string, unknown>) => void
  abort: () => void
  reset: () => void
}

export function useIntelligenceStream(): UseIntelligenceStreamReturn {
  const [state, dispatch] = useReducer(streamReducer, INITIAL_STREAM_STATE)
  const abortRef = useRef<AbortController | null>(null)
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)

  const abort = useCallback(() => {
    abortRef.current?.abort()
    readerRef.current?.cancel()
    abortRef.current = null
    readerRef.current = null
  }, [])

  const reset = useCallback(() => {
    abort()
    dispatch({ type: 'RESET' })
  }, [abort])

  const generate = useCallback(async (body: Record<string, unknown>) => {
    abort()
    dispatch({ type: 'START_STREAM' })

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const token = await getValidAccessToken(180)
      if (!token) {
        dispatch({ type: 'stream_error', error: 'Please sign in to use Intelligence.' })
        return
      }

      const res = await fetch('/api/intelligence', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Request failed' }))
        dispatch({ type: 'stream_error', error: errData.error || `Request failed (${res.status})` })
        return
      }

      const reader = res.body?.getReader()
      if (!reader) {
        dispatch({ type: 'stream_error', error: 'No stream body' })
        return
      }
      readerRef.current = reader

      const decoder = new TextDecoder()
      let buffer = ''
      let receivedTerminalEvent = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const chunk of lines) {
          const dataLine = chunk.trim()
          if (!dataLine.startsWith('data: ')) continue
          try {
            const event = JSON.parse(dataLine.slice(6)) as SSEEvent
            if (event.type === 'brief_ready' || event.type === 'stream_error') {
              receivedTerminalEvent = true
            }
            dispatch(event)
          } catch {
            // Skip malformed events
          }
        }
      }

      // Process remaining buffer
      if (buffer.trim().startsWith('data: ')) {
        try {
          const event = JSON.parse(buffer.trim().slice(6)) as SSEEvent
          if (event.type === 'brief_ready' || event.type === 'stream_error') {
            receivedTerminalEvent = true
          }
          dispatch(event)
        } catch {
          // Skip
        }
      }

      if (!receivedTerminalEvent && !controller.signal.aborted) {
        dispatch({
          type: 'stream_error',
          error: 'The analysis stream ended before a final result arrived. Please retry.',
        })
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      dispatch({
        type: 'stream_error',
        error: err instanceof Error ? err.message : 'Connection failed',
      })
    }
  }, [abort])

  return { state, generate, abort, reset }
}
