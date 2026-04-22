import { type ZodSchema } from 'zod'
import {
  DEFAULT_MODEL_PREFERENCE,
  getModelFamilyId,
  getModelFamilyLabel,
  isCuratedModelId,
  normalizeModelPreference,
  sortFamilyIds,
  type ModelCatalogFamily,
  type ModelCatalogItem,
  type ModelCatalogResponse,
  type ModelPreference,
} from './model-selection'
import { generateRepairPrompt, validateSchema } from './pipeline'

const OPENROUTER_CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models'
const SYNTHESIS_TIMEOUT = 20_000
const SYNTHESIS_FALLBACK_MODEL: ModelPreference = 'google/gemini-3.1-flash-lite-preview'
const SYNTHESIS_UNSTABLE_PRIMARY_MODELS = new Set<ModelPreference>([
  'openai/gpt-5.4-mini',
])
const MODEL_CATALOG_TTL_MS = 30 * 60 * 1000

type ChatMessage = { role: 'user' | 'assistant'; content: string }
type JsonObjectResponseFormat = { type: 'json_object' }
type JsonSchemaResponseFormat = {
  type: 'json_schema'
  json_schema: {
    name: string
    strict: boolean
    schema: Record<string, unknown>
  }
}
type ResponseFormat = JsonObjectResponseFormat | JsonSchemaResponseFormat

interface OpenRouterModelRecord {
  id: string
  name?: string
  description?: string
  created?: number
  expiration_date?: string | null
  context_length?: number
  supported_parameters?: string[]
  architecture?: {
    modality?: string
    output_modalities?: string[]
  }
  pricing?: {
    prompt?: string
    completion?: string
  }
}

export interface SynthesisResult<T> {
  data: T | null
  model: string | null
  promptTokens: number
  responseTokens: number
  parseSuccess: boolean
  errorClass: string | null
  fallbackReason?: string | null
}

let modelCatalogCache: { expiresAt: number; data: ModelCatalogResponse } | null = null

function getOpenRouterHeaders(): HeadersInit {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not configured')
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'HTTP-Referer': 'https://www.getrelevantapp.com',
    'X-OpenRouter-Title': 'Relevant Intelligence',
  }
}

function coerceTextContent(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part
        if (part && typeof part === 'object' && 'text' in part && typeof part.text === 'string') {
          return part.text
        }
        return ''
      })
      .filter(Boolean)
      .join('\n')
  }
  return ''
}

function isSelectableModel(model: OpenRouterModelRecord): boolean {
  if (!isCuratedModelId(model.id)) return false

  if (model.expiration_date) {
    const expiration = Date.parse(model.expiration_date)
    if (!Number.isNaN(expiration) && expiration <= Date.now()) return false
  }

  const outputs = model.architecture?.output_modalities
  if (outputs && !outputs.includes('text')) return false

  const supported = model.supported_parameters ?? []
  const supportsStructuredOutput = supported.includes('response_format') || supported.includes('structured_outputs')
  const supportsReasoning = supported.includes('reasoning') || supported.includes('include_reasoning')
  return supportsStructuredOutput && supportsReasoning
}

function toCatalogItem(model: OpenRouterModelRecord): ModelCatalogItem {
  const familyId = getModelFamilyId(model.id)
  return {
    id: model.id,
    name: model.name?.trim() || model.id.split('/')[1] || model.id,
    familyId,
    familyLabel: getModelFamilyLabel(familyId),
    description: model.description?.trim() || '',
    contextLength: typeof model.context_length === 'number' ? model.context_length : null,
    promptPrice: model.pricing?.prompt ?? null,
    completionPrice: model.pricing?.completion ?? null,
    supportedParameters: model.supported_parameters ?? [],
    created: typeof model.created === 'number' ? model.created : null,
  }
}

function buildCatalog(models: OpenRouterModelRecord[]): ModelCatalogResponse {
  const grouped = new Map<string, ModelCatalogItem[]>()

  for (const model of models.filter(isSelectableModel)) {
    const item = toCatalogItem(model)
    const bucket = grouped.get(item.familyId) ?? []
    bucket.push(item)
    grouped.set(item.familyId, bucket)
  }

  const families: ModelCatalogFamily[] = Array.from(grouped.entries())
    .sort(([a], [b]) => sortFamilyIds(a, b))
    .map(([familyId, items]) => ({
      id: familyId,
      label: getModelFamilyLabel(familyId),
      models: items.sort((a, b) => {
        if (a.id === DEFAULT_MODEL_PREFERENCE) return -1
        if (b.id === DEFAULT_MODEL_PREFERENCE) return 1
        if (a.created && b.created && a.created !== b.created) return b.created - a.created
        return a.name.localeCompare(b.name)
      }),
    }))

  return {
    defaultModel: DEFAULT_MODEL_PREFERENCE,
    families,
    fetchedAt: new Date().toISOString(),
  }
}

function buildFallbackCatalog(): ModelCatalogResponse {
  const fallbackModels: OpenRouterModelRecord[] = [
    { id: 'openai/gpt-5.4-mini', name: 'OpenAI: GPT-5.4 Mini' },
    { id: 'openai/gpt-5.4', name: 'OpenAI: GPT-5.4' },
    { id: 'openai/gpt-5.1', name: 'OpenAI: GPT-5.1' },
    { id: 'google/gemini-2.5-pro', name: 'Google: Gemini 2.5 Pro' },
    { id: 'google/gemini-3.1-flash-lite-preview', name: 'Google: Gemini 3.1 Flash Lite Preview' },
    { id: 'anthropic/claude-sonnet-4.6', name: 'Anthropic: Claude Sonnet 4.6' },
    { id: 'z-ai/glm-5.1', name: 'Z.ai: GLM 5.1' },
    { id: 'qwen/qwen3.6-plus', name: 'Qwen: Qwen3.6 Plus' },
    { id: 'qwen/qwen3-235b-a22b', name: 'Qwen: Qwen3 235B A22B' },
  ].map((model) => ({
    ...model,
    description: '',
    supported_parameters: ['response_format', 'structured_outputs', 'reasoning'],
    architecture: { modality: 'text->text', output_modalities: ['text'] },
  }))

  return buildCatalog(fallbackModels)
}

export async function listSelectableOpenRouterModels(forceFresh = false): Promise<ModelCatalogResponse> {
  const now = Date.now()
  if (!forceFresh && modelCatalogCache && modelCatalogCache.expiresAt > now) {
    return modelCatalogCache.data
  }

  try {
    const res = await fetch(OPENROUTER_MODELS_URL, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 1800 },
    })

    if (!res.ok) {
      throw new Error(`OpenRouter models ${res.status}`)
    }

    const payload = await res.json()
    const catalog = buildCatalog(Array.isArray(payload?.data) ? payload.data as OpenRouterModelRecord[] : [])
    if (catalog.families.length === 0) {
      throw new Error('OpenRouter curated catalog was empty')
    }

    modelCatalogCache = { data: catalog, expiresAt: now + MODEL_CATALOG_TTL_MS }
    return catalog
  } catch (err) {
    if (modelCatalogCache) return modelCatalogCache.data
    console.error('[intel:openrouter:models] Failed to load curated catalog:', err)
    return buildFallbackCatalog()
  }
}

export async function callOpenRouterMessages(
  systemPrompt: string,
  messages: ChatMessage[],
  model: ModelPreference,
  signal: AbortSignal,
  options?: {
    maxTokens?: number
    temperature?: number
    responseFormat?: ResponseFormat
    reasoning?: { effort?: 'minimal' | 'low' | 'medium' | 'high' | 'xhigh'; exclude?: boolean; enabled?: boolean; max_tokens?: number }
    provider?: { require_parameters?: boolean }
  },
): Promise<{ content: string; model: string; promptTokens: number; responseTokens: number }> {
  const selectedModel = normalizeModelPreference(model)

  const res = await fetch(OPENROUTER_CHAT_URL, {
    method: 'POST',
    headers: getOpenRouterHeaders(),
    body: JSON.stringify({
      model: selectedModel,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 4096,
      ...(options?.responseFormat ? { response_format: options.responseFormat } : {}),
      ...(options?.reasoning ? { reasoning: options.reasoning } : {}),
      ...(options?.provider ? { provider: options.provider } : {}),
    }),
    signal,
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`OpenRouter ${res.status}: ${errText.slice(0, 300)}`)
  }

  const data = await res.json()
  const content = coerceTextContent(data?.choices?.[0]?.message?.content).trim()
  if (!content) throw new Error('Empty OpenRouter response')

  return {
    content,
    model: typeof data?.model === 'string' ? data.model : selectedModel,
    promptTokens: data?.usage?.prompt_tokens ?? 0,
    responseTokens: data?.usage?.completion_tokens ?? 0,
  }
}

export async function callOpenRouterPrompt(
  systemPrompt: string,
  userPrompt: string,
  model: ModelPreference,
  signal: AbortSignal,
  options?: {
    maxTokens?: number
    temperature?: number
    responseFormat?: ResponseFormat
    reasoning?: { effort?: 'minimal' | 'low' | 'medium' | 'high' | 'xhigh'; exclude?: boolean; enabled?: boolean; max_tokens?: number }
    provider?: { require_parameters?: boolean }
  },
): Promise<{ content: string; model: string; promptTokens: number; responseTokens: number }> {
  return callOpenRouterMessages(
    systemPrompt,
    [{ role: 'user', content: userPrompt }],
    model,
    signal,
    options,
  )
}

function getSynthesisModelCandidates(logTag: string, preferredModel?: ModelPreference): ModelPreference[] {
  const primaryModel = normalizeModelPreference(preferredModel)

  if (SYNTHESIS_UNSTABLE_PRIMARY_MODELS.has(primaryModel)) {
    return [SYNTHESIS_FALLBACK_MODEL, primaryModel]
  }

  if (logTag === 'market_research' && primaryModel === DEFAULT_MODEL_PREFERENCE) {
    return [SYNTHESIS_FALLBACK_MODEL, primaryModel]
  }

  return primaryModel === SYNTHESIS_FALLBACK_MODEL
    ? [primaryModel]
    : [primaryModel, SYNTHESIS_FALLBACK_MODEL]
}

async function modelSupportsJsonSchema(model: ModelPreference): Promise<boolean> {
  const normalized = normalizeModelPreference(model)
  const catalog = await listSelectableOpenRouterModels()
  const item = catalog.families.flatMap((family) => family.models).find((candidate) => candidate.id === normalized)
  const supported = item?.supportedParameters ?? []
  return supported.includes('response_format') || supported.includes('structured_outputs')
}

function genericJsonSchemaFormat(logTag: string): JsonSchemaResponseFormat {
  return {
    type: 'json_schema',
    json_schema: {
      name: `${logTag}_brief`,
      strict: true,
      schema: {
        type: 'object',
        additionalProperties: true,
      },
    },
  }
}

async function attemptSynthesizeWithSchema<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: ZodSchema<T>,
  schemaDescription: string,
  logTag: string,
  model: ModelPreference,
  strictSchema: boolean,
): Promise<SynthesisResult<T>> {
  const resolvedModel = normalizeModelPreference(model)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), SYNTHESIS_TIMEOUT)

  try {
    const response = await callOpenRouterPrompt(
      systemPrompt,
      userPrompt,
      resolvedModel,
      controller.signal,
      {
        maxTokens: 8192,
        temperature: 0.2,
        responseFormat: strictSchema ? genericJsonSchemaFormat(logTag) : { type: 'json_object' },
        ...(strictSchema ? { provider: { require_parameters: true } } : {}),
        reasoning: { effort: 'medium', exclude: true },
      },
    )
    clearTimeout(timeout)

    const parsed = JSON.parse(cleanJsonContent(response.content))
    const validation = validateSchema(schema, parsed)

    if (validation.ok) {
      console.log(`[intel:${logTag}:synthesize]`, `openrouter/${response.model} OK, ${response.promptTokens}+${response.responseTokens} tokens`)
      return {
        data: validation.data,
        model: `openrouter/${response.model}`,
        promptTokens: response.promptTokens,
        responseTokens: response.responseTokens,
        parseSuccess: true,
        errorClass: null,
      }
    }

    console.warn(`[intel:${logTag}:synthesize]`, `Schema validation failed for openrouter/${response.model}:`, validation.issues)
    const repairPrompt = generateRepairPrompt(validation.issues!, schemaDescription)
    const repairController = new AbortController()
    const repairTimeout = setTimeout(() => repairController.abort(), SYNTHESIS_TIMEOUT)

    try {
      const repair = await callOpenRouterPrompt(
        systemPrompt,
        repairPrompt,
        resolvedModel,
        repairController.signal,
        {
        maxTokens: 8192,
        temperature: 0.1,
        responseFormat: { type: 'json_object' },
        reasoning: { effort: 'medium', exclude: true },
      },
      )
      clearTimeout(repairTimeout)

      const repairParsed = JSON.parse(cleanJsonContent(repair.content))
      const repairValidation = validateSchema(schema, repairParsed)

      if (repairValidation.ok) {
        console.log(`[intel:${logTag}:synthesize]`, `openrouter/${repair.model} repaired OK`)
        return {
          data: repairValidation.data,
          model: `openrouter/${repair.model}`,
          promptTokens: response.promptTokens + repair.promptTokens,
          responseTokens: response.responseTokens + repair.responseTokens,
        parseSuccess: true,
        errorClass: null,
        fallbackReason: strictSchema ? null : 'json_object_repair',
      }
      }

      return {
        data: null,
        model: `openrouter/${repair.model}`,
        promptTokens: response.promptTokens + repair.promptTokens,
        responseTokens: response.responseTokens + repair.responseTokens,
        parseSuccess: false,
        errorClass: 'schema_validation_failed',
        fallbackReason: strictSchema ? 'strict_schema_validation_failed' : 'json_object_validation_failed',
      }
    } catch (repairErr) {
      clearTimeout(repairTimeout)
      console.error(`[intel:${logTag}:synthesize]`, `Repair call failed for openrouter/${response.model}:`, repairErr)
      return {
        data: null,
        model: `openrouter/${response.model}`,
        promptTokens: response.promptTokens,
        responseTokens: response.responseTokens,
        parseSuccess: false,
        errorClass: repairErr instanceof DOMException && repairErr.name === 'AbortError'
          ? 'timeout'
          : 'provider_error',
      }
    }
  } catch (err) {
    clearTimeout(timeout)
    const errorClass = err instanceof DOMException && err.name === 'AbortError'
      ? 'timeout'
      : 'provider_error'
    console.error(`[intel:${logTag}:synthesize]`, `${errorClass} for openrouter/${resolvedModel}:`, err)
    return {
      data: null,
      model: null,
      promptTokens: 0,
      responseTokens: 0,
      parseSuccess: false,
      errorClass,
      fallbackReason: strictSchema ? 'strict_schema_provider_error' : 'json_object_provider_error',
    }
  }
}

function cleanJsonContent(raw: string): string {
  let cleaned = raw.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  }
  return cleaned
}

export async function synthesizeWithSchema<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: ZodSchema<T>,
  schemaDescription: string,
  logTag: string,
  preferredModel?: ModelPreference,
): Promise<SynthesisResult<T>> {
  if (!process.env.OPENROUTER_API_KEY) {
    return {
      data: null,
      model: null,
      promptTokens: 0,
      responseTokens: 0,
      parseSuccess: false,
      errorClass: 'no_provider',
    }
  }

  const candidates = getSynthesisModelCandidates(logTag, preferredModel)
  let lastFailure: SynthesisResult<T> = {
    data: null,
    model: null,
    promptTokens: 0,
    responseTokens: 0,
    parseSuccess: false,
    errorClass: 'provider_error',
    fallbackReason: null,
  }

  for (let index = 0; index < candidates.length; index++) {
    const candidate = candidates[index]
    const strictSupported = await modelSupportsJsonSchema(candidate).catch(() => false)
    const attempts = strictSupported ? [true, false] : [false]

    let result: SynthesisResult<T> | null = null
    for (const strictSchema of attempts) {
      result = await attemptSynthesizeWithSchema(
        systemPrompt,
        userPrompt,
        schema,
        schemaDescription,
        logTag,
        candidate,
        strictSchema,
      )
      if (result.data) return result
      lastFailure = result
    }

    const nextCandidate = candidates[index + 1]
    if (nextCandidate) {
      console.warn(
        `[intel:${logTag}:synthesize]`,
        `Retrying with openrouter/${nextCandidate} after ${result?.errorClass ?? 'schema_validation_failed'} on openrouter/${candidate}`,
      )
    }
  }

  return lastFailure
}
