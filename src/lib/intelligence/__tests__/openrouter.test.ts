import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { synthesizeWithSchema } from '../openrouter'

const SimpleSchema = z.object({ headline: z.string() })

function makeOpenRouterResponse(model: string, content: Record<string, unknown>) {
  return new Response(
    JSON.stringify({
      model,
      choices: [{ message: { content: JSON.stringify(content) } }],
      usage: { prompt_tokens: 123, completion_tokens: 45 },
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  )
}

function makeModelsResponse() {
  return new Response(
    JSON.stringify({
      data: [
        {
          id: 'openai/gpt-5.4-mini',
          name: 'OpenAI GPT-5.4 Mini',
          supported_parameters: ['response_format', 'structured_outputs', 'reasoning'],
          architecture: { output_modalities: ['text'] },
        },
        {
          id: 'google/gemini-3.1-flash-lite-preview',
          name: 'Gemini Flash Lite',
          supported_parameters: ['response_format', 'structured_outputs', 'reasoning'],
          architecture: { output_modalities: ['text'] },
        },
      ],
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  )
}

function getRequestedModels(fetchMock: ReturnType<typeof vi.fn>): string[] {
  return fetchMock.mock.calls.flatMap(([, init]) => {
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : {}
    return body.model ? [body.model as string] : []
  })
}

function getCompletionBodies(fetchMock: ReturnType<typeof vi.fn>): Record<string, unknown>[] {
  return fetchMock.mock.calls.flatMap(([, init]) => {
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : null
    return body?.model ? [body] : []
  })
}

describe('synthesizeWithSchema', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    delete process.env.OPENROUTER_API_KEY
  })

  it('prefers Gemini for default market research synthesis', async () => {
    process.env.OPENROUTER_API_KEY = 'test-key'
    const fetchMock = vi.fn((url: string) => {
      if (url.includes('/models')) return Promise.resolve(makeModelsResponse())
      return Promise.resolve(makeOpenRouterResponse('google/gemini-3.1-flash-lite-preview-20260303', {
        headline: 'Market momentum is accelerating.',
      }))
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await synthesizeWithSchema(
      'system prompt',
      'user prompt',
      SimpleSchema,
      '{ "headline": "..." }',
      'market_research',
    )

    expect(result.data).toEqual({ headline: 'Market momentum is accelerating.' })
    expect(getRequestedModels(fetchMock)).toEqual(['google/gemini-3.1-flash-lite-preview'])
    expect(getCompletionBodies(fetchMock)[0].response_format).toMatchObject({ type: 'json_schema' })
  })

  it('prefers Gemini first when GPT-5.4 mini is selected for synthesis', async () => {
    process.env.OPENROUTER_API_KEY = 'test-key'
    const fetchMock = vi.fn((url: string) => {
      if (url.includes('/models')) return Promise.resolve(makeModelsResponse())
      return Promise.resolve(makeOpenRouterResponse('google/gemini-3.1-flash-lite-preview-20260303', {
        headline: 'Gemini succeeded immediately.',
      }))
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await synthesizeWithSchema(
      'system prompt',
      'user prompt',
      SimpleSchema,
      '{ "headline": "..." }',
      'meeting_prep',
      'openai/gpt-5.4-mini',
    )

    expect(result.data).toEqual({ headline: 'Gemini succeeded immediately.' })
    expect(result.model).toBe('openrouter/google/gemini-3.1-flash-lite-preview-20260303')
    expect(getRequestedModels(fetchMock)).toEqual(['google/gemini-3.1-flash-lite-preview'])
  })
})
