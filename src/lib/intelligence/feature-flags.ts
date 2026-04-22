export function isIntelFlagEnabled(name: string): boolean {
  return process.env[name] === '1' || process.env[name]?.toLowerCase() === 'true'
}

export const intelligenceFlags = {
  engineV2: () => isIntelFlagEnabled('INTELLIGENCE_ENGINE_V2_ENABLED'),
  internalCorpus: () => isIntelFlagEnabled('INTELLIGENCE_INTERNAL_CORPUS_ENABLED'),
  plannerV2: () => isIntelFlagEnabled('INTELLIGENCE_PLANNER_V2_ENABLED'),
  evidencePack: () => isIntelFlagEnabled('INTELLIGENCE_EVIDENCE_PACK_ENABLED'),
  verifier: () => isIntelFlagEnabled('INTELLIGENCE_VERIFIER_ENABLED'),
  deepSearch: () => isIntelFlagEnabled('INTELLIGENCE_PROVIDER_DEEP_SEARCH_ENABLED'),
  tavilyCrawl: () => isIntelFlagEnabled('INTELLIGENCE_TAVILY_CRAWL_ENABLED'),
  streamingSections: () => isIntelFlagEnabled('INTELLIGENCE_STREAMING_SECTIONS_ENABLED'),
  depthTiers: () => isIntelFlagEnabled('INTELLIGENCE_DEPTH_TIERS_ENABLED'),
  newProviders: () => isIntelFlagEnabled('INTELLIGENCE_NEW_PROVIDERS_ENABLED'),
}

export const INTEL_RESULTS_V2 =
  process.env.NEXT_PUBLIC_INTEL_RESULTS_V2 === 'true' || process.env.NODE_ENV !== 'production'
