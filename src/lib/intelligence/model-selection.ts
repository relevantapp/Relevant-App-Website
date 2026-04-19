export type ModelPreference = string

export const DEFAULT_MODEL_PREFERENCE: ModelPreference = 'google/gemini-3.1-flash-lite-preview'
export const MODEL_STORAGE_KEY = 'relevant-intelligence-model'

const LEGACY_MODEL_ALIASES: Record<string, ModelPreference> = {
  auto: DEFAULT_MODEL_PREFERENCE,
  'gemini-2.5-flash-lite': 'google/gemini-2.5-flash-lite',
  'gemini-2.5-flash': 'google/gemini-2.5-flash',
  'gemini-2.0-flash': 'google/gemini-2.0-flash-001',
  'claude-haiku-4.5': 'anthropic/claude-haiku-4.5',
}

const FAMILY_LABELS: Record<string, string> = {
  google: 'Google / Gemini',
  openai: 'OpenAI / GPT',
  anthropic: 'Anthropic / Claude',
  'x-ai': 'xAI / Grok',
  'z-ai': 'Z.ai / GLM',
  'meta-llama': 'Meta / Llama',
}

const PINNED_FAMILY_ORDER = ['google', 'openai', 'anthropic', 'x-ai', 'z-ai', 'meta-llama']

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

export function normalizeModelPreference(raw: string | null | undefined): ModelPreference {
  if (!raw) return DEFAULT_MODEL_PREFERENCE

  const trimmed = raw.trim()
  const mapped = LEGACY_MODEL_ALIASES[trimmed] ?? trimmed
  return isLikelyOpenRouterModelId(mapped) ? mapped : DEFAULT_MODEL_PREFERENCE
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
