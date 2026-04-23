import 'server-only'

export const FULL_INTELLIGENCE_PROVIDERS = [
  'EXA_API_KEY',
  'TAVILY_API_KEY',
  'OPENROUTER_API_KEY',
] as const

export const AI_ONLY_INTELLIGENCE_PROVIDERS = [
  'OPENROUTER_API_KEY',
] as const

export type IntelligenceProviderKey = typeof FULL_INTELLIGENCE_PROVIDERS[number]

interface ProviderMeta {
  label: string
  purpose: string
}

export interface IntelligenceProviderDescriptor extends ProviderMeta {
  key: IntelligenceProviderKey
  configured: boolean
}

export interface IntelligenceProviderStatus {
  ready: boolean
  missingProviders: IntelligenceProviderKey[]
  providers: IntelligenceProviderDescriptor[]
}

const PROVIDER_META: Record<IntelligenceProviderKey, ProviderMeta> = {
  EXA_API_KEY: {
    label: 'Exa',
    purpose: 'company snapshots and source discovery',
  },
  TAVILY_API_KEY: {
    label: 'Tavily',
    purpose: 'fresh web and news search',
  },
  OPENROUTER_API_KEY: {
    label: 'OpenRouter',
    purpose: 'AI synthesis, refinement, and follow-up answers',
  },
}

function isConfigured(key: IntelligenceProviderKey): boolean {
  const value = process.env[key]
  return typeof value === 'string' && value.trim().length > 0
}

export function getIntelligenceProviderStatus(
  requiredProviders: readonly IntelligenceProviderKey[] = FULL_INTELLIGENCE_PROVIDERS,
): IntelligenceProviderStatus {
  const providers = requiredProviders.map((key) => ({
    key,
    ...PROVIDER_META[key],
    configured: isConfigured(key),
  }))

  const missingProviders = providers
    .filter((provider) => !provider.configured)
    .map((provider) => provider.key)

  return {
    ready: missingProviders.length === 0,
    missingProviders,
    providers,
  }
}

export function formatProviderLabels(keys: readonly IntelligenceProviderKey[]): string {
  return keys.map((key) => PROVIDER_META[key].label).join(', ')
}

export function buildIntelligenceSetupMessage(
  actionLabel: string,
  requiredProviders: readonly IntelligenceProviderKey[] = FULL_INTELLIGENCE_PROVIDERS,
): string | null {
  const status = getIntelligenceProviderStatus(requiredProviders)
  if (status.ready) return null
  return `${actionLabel} is not configured in this local environment. Missing: ${formatProviderLabels(status.missingProviders)}.`
}
