// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { useIntelligenceStream } from '../useIntelligenceStream'

vi.mock('@/lib/supabase', () => ({
  getValidAccessToken: vi.fn(async () => 'test-token'),
}))

function createTextStream(chunks: string[]) {
  const encoder = new TextEncoder()
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk))
      }
      controller.close()
    },
  })
}

describe('useIntelligenceStream', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('fails closed when the stream ends without a terminal event', async () => {
    global.fetch = vi.fn(async () => new Response(createTextStream([
      `data: ${JSON.stringify({ type: 'step_start', step: 'synthesize', label: 'Synthesis' })}\n\n`,
      `data: ${JSON.stringify({ type: 'step_done', step: 'synthesize', summary: 'Analyzed sources' })}\n\n`,
    ]), {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    })) as typeof fetch

    const { result } = renderHook(() => useIntelligenceStream())

    await act(async () => {
      await result.current.generate({ researchType: 'competitive_analysis', competitors: ['UPS'] })
    })

    await waitFor(() => {
      expect(result.current.state.isStreaming).toBe(false)
      expect(result.current.state.error).toBe('The analysis stream ended before a final result arrived. Please retry.')
    })
  })

  it('accepts a brief_ready terminal event and stops streaming cleanly', async () => {
    const brief = {
      id: 'brief-1',
      researchType: 'competitive_analysis',
      generatedAt: '2026-04-22T22:00:00.000Z',
      headline: 'Purolator can counter UPS more directly.',
      bottomLine: 'UPS is pushing premium lanes while Purolator still has a Canadian trust edge.',
      whyItMatters: 'You need a sharper SMB story.',
      confidence: 'medium',
      competitors: [],
      comparisonMatrix: [],
      sections: {
        keyFindings: [],
        strategicImplications: [],
        recommendations: [],
      },
      sources: [],
      status: {
        degraded: false,
        reasons: [],
        exaSearchMs: 0,
        tavilySearchMs: 0,
        synthesisMs: 0,
        totalMs: 0,
        sourceCount: 0,
        cached: false,
        synthesisModel: null,
      },
    }

    global.fetch = vi.fn(async () => new Response(createTextStream([
      `data: ${JSON.stringify({ type: 'brief_ready', brief })}\n\n`,
    ]), {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    })) as typeof fetch

    const { result } = renderHook(() => useIntelligenceStream())

    await act(async () => {
      await result.current.generate({ researchType: 'competitive_analysis', competitors: ['UPS'] })
    })

    await waitFor(() => {
      expect(result.current.state.isStreaming).toBe(false)
      expect(result.current.state.error).toBeNull()
      expect(result.current.state.brief?.id).toBe('brief-1')
    })
  })
})
