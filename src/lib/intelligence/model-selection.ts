export type ModelPreference = string

export const DEFAULT_MODEL_PREFERENCE: ModelPreference = 'google/gemini-3.1-flash-lite-preview'
export const MODEL_STORAGE_KEY = 'relevant-intelligence-model'

export const CURATED_MODEL_IDS = [
  'google/gemini-3.1-flash-lite-preview',
  'google/gemini-2.5-pro',
  'openai/gpt-5.4-mini',
  'openai/gpt-5.4',
  'openai/gpt-5.1',
  'anthropic/claude-sonnet-4.6',
  'z-ai/glm-5.1',
  'qwen/qwen3.6-plus',
  'qwen/qwen3-235b-a22b',
] as const satisfies readonly ModelPreference[]

const CURATED_MODEL_ID_SET = new Set<ModelPreference>(CURATED_MODEL_IDS)

const LEGACY_MODEL_ALIASES: Record<string, ModelPreference> = {
  auto: DEFAULT_MODEL_PREFERENCE,
  'gemini-2.5-flash': DEFAULT_MODEL_PREFERENCE,
  'gemini-2.0-flash': DEFAULT_MODEL_PREFERENCE,
  'claude-haiku-4.5': DEFAULT_MODEL_PREFERENCE,
}

const FAMILY_LABELS: Record<string, string> = {
  google: 'Google / Gemini',
  openai: 'OpenAI / GPT',
  anthropic: 'Anthropic / Claude',
  'z-ai': 'Z.ai / GLM',
  'meta-llama': 'Meta / Llama',
  qwen: 'Qwen',
}

const PINNED_FAMILY_ORDER = ['google', 'openai', 'anthropic', 'z-ai', 'meta-llama', 'qwen']

export interface ModelCatalogItem {
  id: string
  name: string
  familyId: string
  familyLabel: string
  description: string
  contextLength: number | null
  promptPrice: string | null
  completionPrice: string | null
  supportedParameters: string[]
  created: number | null
}

export interface ModelCatalogFamily {
  id: string
  label: string
  models: ModelCatalogItem[]
}

export interface ModelCatalogResponse {
  defaultModel: ModelPreference
  families: ModelCatalogFamily[]
  fetchedAt: string
}

function toTitleCase(input: string): string {
  return input
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function isLikelyOpenRouterModelId(value: string): boolean {
  return /^[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9\-.:]*$/i.test(value)
}

export function isCuratedModelId(value: string | null | undefined): value is ModelPreference {
  return Boolean(value && CURATED_MODEL_ID_SET.has(value))
}

export function normalizeModelPreference(raw: string | null | undefined): ModelPreference {
  if (!raw) return DEFAULT_MODEL_PREFERENCE

  const trimmed = raw.trim()
  const mapped = LEGACY_MODEL_ALIASES[trimmed] ?? trimmed

  if (!isLikelyOpenRouterModelId(mapped)) return DEFAULT_MODEL_PREFERENCE
  return isCuratedModelId(mapped) ? mapped : DEFAULT_MODEL_PREFERENCE
}

export function getModelFamilyId(modelId: string): string {
  const normalized = normalizeModelPreference(modelId)
  return normalized.split('/')[0] ?? 'google'
}

export function getModelFamilyLabel(familyId: string): string {
  return FAMILY_LABELS[familyId] ?? toTitleCase(familyId)
}

export function sortFamilyIds(a: string, b: string): number {
  const aIndex = PINNED_FAMILY_ORDER.indexOf(a)
  const bIndex = PINNED_FAMILY_ORDER.indexOf(b)

  if (aIndex !== -1 || bIndex !== -1) {
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  }

  return a.localeCompare(b)
}
