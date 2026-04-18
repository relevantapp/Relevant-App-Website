/* ── SSE Emitter — sends typed events to a ReadableStream ─── */

import type { SSEEvent } from './sse-types'

export interface SSEEmitter {
  send: (event: SSEEvent) => void
  close: () => void
  stream: ReadableStream<Uint8Array>
  signal: AbortSignal
}

export function createSSEEmitter(): SSEEmitter {
  const encoder = new TextEncoder()
  const controller = new AbortController()
  let streamController: ReadableStreamDefaultController<Uint8Array> | null = null

  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      streamController = c
    },
    cancel() {
      controller.abort()
    },
  })

  function send(event: SSEEvent) {
    if (!streamController || controller.signal.aborted) return
    try {
      const data = JSON.stringify(event)
      streamController.enqueue(encoder.encode(`data: ${data}\n\n`))
    } catch {
      // Stream may have closed
    }
  }

  function close() {
    if (!streamController) return
    try {
      streamController.close()
    } catch {
      // Already closed
    }
  }

  return { send, close, stream, signal: controller.signal }
}
