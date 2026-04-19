/* ── Model Provider — user-selectable primary, fallback chain ─── */

import Anthropic from '@anthropic-ai/sdk'
import { type ZodSchema } from 'zod'
import { validateSchema, generateRepairPrompt } from './pipeline'

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models'
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const SYNTHESIS_TIMEOUT = 45_000

/* ── Types ─────────────────────────────────────────────────── */

type ProviderName = 'anthropic' | 'gemini' | 'openrouter'

interface ModelCandidate {
  provider: ProviderName
  model: string
}

export type ModelPreference =
  | 'gemini-2.5-flash'
  | 'claude-haiku-4.5'
  | 'gemini-2.0-flash'
  | 'auto'

export const MODEL_OPTIONS: Array<{ value: ModelPreference; label: string; description: string }> = [
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', description: 'Fast, high quality (recommended)' },
  { value: 'claude-haiku-4.5', label: 'Claude Haiku 4.5', description: 'Anthropic, strong reasoning' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', description: 'Google, fast and capable' },
  { value: 'auto', label: 'Auto (best available)', description: 'Tries each model in order' },
]

export interface SynthesisResult<T> {
  data: T | null
  model: string | null
  promptTokens: number
  responseTokens: number
  parseSuccess: boolean
  errorClass: string | null
}

/* ── Candidate list ────────────────────────────────────────── */

const ALL_CANDIDATES: Array<ModelCandidate & { preference: ModelPreference; envKey: string }> = [
  { preference: 'gemini-2.5-flash', provider: 'gemini', model: 'gemini-2.5-flash', envKey: 'GEMINI_API_KEY' },
  { preference: 'claude-haiku-4.5', provider: 'anthropic', model: 'claude-haiku-4-5-20251001', envKey: 'ANTHROPIC_API_KEY' },
  { preference: 'gemini-2.0-flash', provider: 'gemini', model: 'gemini-2.0-flash', envKey: 'GEMINI_API_KEY' },
  { preference: 'auto', provider: 'openrouter', model: 'google/gemini-2.5-flash-lite', envKey: 'OPENROUTER_API_KEY' },
]

function getModelCandidates(preferred?: ModelPreference): ModelCandidate[] {
  const available = ALL_CANDIDATES.filter((c) => process.env[c.envKey])

  if (preferred && preferred !== 'auto') {
    const primary = available.find((c) => c.preference === preferred)
    const rest = available.filter((c) => c.preference !== preferred)
    return primary ? [primary, ...rest] : available
  }

  return available
}

/* ── Provider calls ────────────────────────────────────────── */

async function callAnthropic(
  systemPrompt: string,
  userPrompt: string,
  model: string,
  signal: AbortSignal
): Promise<{ content: string; promptTokens: number; responseTokens: number }> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    temperature: 0.3,
    system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userPrompt }],
  })

  if (signal.aborted) throw new DOMException('Aborted', 'AbortError')

  const textBlock = response.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') throw new Error('No text in Anthropic response')

  return {
    content: textBlock.text,
    promptTokens: response.usage.input_tokens,
    responseTokens: response.usage.output_tokens,
  }
}

async function callGemini(
  systemPrompt: string,
  userPrompt: string,
  model: string,
  signal: AbortSignal
): Promise<{ content: string; promptTokens: number; responseTokens: number }> {
  const res = await fetch(`${GEMINI_URL}/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 4096, responseMimeType: 'application/json' },
    }),
    signal,
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Gemini ${res.status}: ${errText.slice(0, 200)}`)
  }
  const data = await res.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!content) throw new Error('Empty Gemini response')
  return {
    content,
    promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
    responseTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
  }
}

async function callOpenRouter(
  systemPrompt: string,
  userPrompt: string,
  model: string,
  signal: AbortSignal
): Promise<{ content: string; promptTokens: number; responseTokens: number }> {
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://www.getrelevantapp.com',
      'X-Title': 'Relevant Intelligence',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    }),
    signal,
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`OpenRouter ${res.status}: ${errText.slice(0, 200)}`)
  }
  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('Empty OpenRouter response')
  return {
    content,
    promptTokens: data.usage?.prompt_tokens ?? 0,
    responseTokens: data.usage?.completion_tokens ?? 0,
  }
}

/* ── JSON cleaning ─────────────────────────────────────────── */

function cleanJsonContent(raw: string): string {
  let cleaned = raw.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }
  return cleaned
}

/* ── Main synthesis function ───────────────────────────────── */

export async function synthesizeWithSchema<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: ZodSchema<T>,
  schemaDescription: string,
  logTag: string,
  preferredModel?: ModelPreference
): Promise<SynthesisResult<T>> {
  const candidates = getModelCandidates(preferredModel)
  if (candidates.length === 0) {
    return {
      data: null,
      model: null,
      promptTokens: 0,
      responseTokens: 0,
      parseSuccess: false,
      errorClass: 'no_provider',
    }
  }

  for (const { provider, model } of candidates) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), SYNTHESIS_TIMEOUT)

    try {
      const callFn = provider === 'anthropic'
        ? callAnthropic
        : provider === 'gemini'
          ? callGemini
          : callOpenRouter

      const { content, promptTokens, responseTokens } = await callFn(
        systemPrompt, userPrompt, model, controller.signal
      )
      clearTimeout(timeout)

      const cleaned = cleanJsonContent(content)
      const parsed = JSON.parse(cleaned)

      // Validate against schema
      const validation = validateSchema(schema, parsed)
      if (validation.ok) {
        console.log(`[intel:${logTag}:synthesize]`, `${provider}/${model} OK, ${promptTokens}+${responseTokens} tokens`)
        return {
          data: validation.data,
          model: `${provider}/${model}`,
          promptTokens,
          responseTokens,
          parseSuccess: true,
          errorClass: null,
        }
      }

      // Repair attempt: one retry with error feedback
      console.warn(`[intel:${logTag}:synthesize]`, `Schema validation failed for ${provider}/${model}:`, validation.issues)
      const repairPrompt = generateRepairPrompt(validation.issues!, schemaDescription)

      const controller2 = new AbortController()
      const timeout2 = setTimeout(() => controller2.abort(), SYNTHESIS_TIMEOUT)

      try {
        const { content: repairContent, promptTokens: rpt, responseTokens: rrt } = await callFn(
          systemPrompt, repairPrompt, model, controller2.signal
        )
        clearTimeout(timeout2)

        const repairCleaned = cleanJsonContent(repairContent)
        const repairParsed = JSON.parse(repairCleaned)
        const repairValidation = validateSchema(schema, repairParsed)

        if (repairValidation.ok) {
          console.log(`[intel:${logTag}:synthesize]`, `${provider}/${model} repaired OK`)
          return {
            data: repairValidation.data,
            model: `${provider}/${model}`,
            promptTokens: promptTokens + rpt,
            responseTokens: responseTokens + rrt,
            parseSuccess: true,
            errorClass: null,
          }
        }
        console.warn(`[intel:${logTag}:synthesize]`, `Repair also failed for ${provider}/${model}, trying next`)
      } catch (repairErr) {
        clearTimeout(timeout2)
        console.error(`[intel:${logTag}:synthesize]`, `Repair call failed for ${provider}/${model}:`, repairErr)
      }

      // Continue to next candidate
    } catch (err) {
      clearTimeout(timeout)
      const isAbort = err instanceof DOMException && err.name === 'AbortError'
      const errorClass = isAbort ? 'timeout' : 'provider_error'
      console.error(`[intel:${logTag}:synthesize]`, `${errorClass} for ${provider}/${model}:`, err)
      continue
    }
  }

  return {
    data: null,
    model: null,
    promptTokens: 0,
    responseTokens: 0,
    parseSuccess: false,
    errorClass: 'all_models_failed',
  }
}
