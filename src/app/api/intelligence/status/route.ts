import { NextResponse } from 'next/server'
import {
  AI_ONLY_INTELLIGENCE_PROVIDERS,
  FULL_INTELLIGENCE_PROVIDERS,
  getIntelligenceProviderStatus,
} from '@/lib/intelligence/provider-config'

export const dynamic = 'force-dynamic'

export async function GET() {
  const generate = getIntelligenceProviderStatus(FULL_INTELLIGENCE_PROVIDERS)
  const ai = getIntelligenceProviderStatus(AI_ONLY_INTELLIGENCE_PROVIDERS)

  return NextResponse.json(
    {
      generateReady: generate.ready,
      refineReady: ai.ready,
      chatReady: ai.ready,
      providers: generate.providers,
      missingForGenerate: generate.missingProviders,
      missingForAI: ai.missingProviders,
    },
    {
      headers: { 'Cache-Control': 'no-store' },
    },
  )
}
