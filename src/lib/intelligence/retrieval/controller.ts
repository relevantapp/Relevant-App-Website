import type { SupabaseClient } from '@supabase/supabase-js'
import type { EvidenceItem, ResearchIntentPacket, ResearchLane, ResearchPlanV2, SourceRole } from '../contracts'
import { searchExaQuery } from '../providers/exa'
import { searchTavilyQuery } from '../providers/tavily'
import { InternalCorpusProvider } from '../providers/internal-corpus'

export interface CoverageScore {
  enoughToSynthesize: boolean
  missingQuestions: string[]
  weakSourceRoles: SourceRole[]
  needsFreshness: boolean
  needsCounterEvidence: boolean
  score: number
}

export interface RetrievalResult {
  evidence: EvidenceItem[]
  coverage: CoverageScore
  lanesRun: string[]
  lanesSkipped: string[]
  timings: {
    internalMs: number
    exaMs: number
    tavilyMs: number
  }
}

function domainFrom(url: string | null): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
}

function facts(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 30)
    .slice(0, 3)
}

function externalEvidence(args: {
  provider: 'exa' | 'tavily'
  lane: ResearchLane
  result: {
    url: string
    title: string
    publishedDate: string | null
    text?: string | null
    summary?: string | null
    highlights?: string[]
    content?: string
    score?: number
    imageUrl?: string | null
  }
  index: number
}): EvidenceItem {
  const excerpt = (
    args.result.summary ||
    args.result.content ||
    args.result.text ||
    args.result.highlights?.join(' ') ||
    args.result.title
  ).slice(0, args.lane.budget.maxContentChars)
  const url = args.result.url

  return {
    id: `${args.provider}:${args.lane.id}:${args.index}`,
    sourceId: `${args.provider}:${args.lane.id}:${args.index}`,
    provider: args.provider,
    laneId: args.lane.id,
    sourceRole: args.lane.sourceRole,
    title: args.result.title || url,
    url,
    domain: domainFrom(url),
    publishedAt: args.result.publishedDate,
    capturedAt: new Date().toISOString(),
    excerpt,
    facts: facts(excerpt),
    entities: [],
    topicKeys: [],
    quality: {
      authority: 0.5,
      freshness: args.result.publishedDate ? 0.8 : 0.4,
      relevance: args.provider === 'tavily' ? Math.min(Math.max(args.result.score ?? 0.5, 0), 1) : 0.65,
      independence: 0.6,
      primarySource: args.lane.sourceRole === 'primary',
    },
  }
}

async function runInternalLane(args: {
  provider: InternalCorpusProvider
  lane: ResearchLane
  intent: ResearchIntentPacket
}): Promise<{ evidence: EvidenceItem[]; durationMs: number }> {
  const start = performance.now()
  const entities = [
    ...args.intent.entities.primary.map((item) => item.name),
    ...args.intent.entities.competitors.map((item) => item.name),
  ]
  const [signals, articles, briefs, dossiers] = await Promise.all([
    args.provider.searchLivingSignals({ entities, topicKeys: args.intent.entities.marketTerms, limit: args.lane.budget.maxResults }),
    args.provider.searchArticles({ queries: args.lane.queryTemplates, entities, limit: args.lane.budget.maxResults }),
    entities[0] ? args.provider.searchPriorBriefs({ entity: entities[0], researchType: args.intent.researchType, limit: 4 }) : Promise.resolve([]),
    entities[0] ? args.provider.searchEntityDossier(entities[0], 4) : Promise.resolve([]),
  ])
  return {
    evidence: [...signals, ...articles, ...briefs, ...dossiers].slice(0, args.lane.budget.maxResults),
    durationMs: Math.round(performance.now() - start),
  }
}

async function runExternalLane(lane: ResearchLane): Promise<{
  evidence: EvidenceItem[]
  provider: 'exa' | 'tavily'
  durationMs: number
}> {
  const queries = lane.queryTemplates.slice(0, lane.budget.maxQueries)
  const provider = lane.providerPreference.includes('tavily') && lane.sourceRole === 'fresh_news'
    ? 'tavily'
    : lane.providerPreference.includes('exa')
      ? 'exa'
      : 'tavily'
  const start = performance.now()

  const jobs = queries.map(async (query, queryIndex) => {
    if (provider === 'exa') {
      const results = await searchExaQuery(query, {
        lookbackDays: lane.freshnessDays,
        numResults: lane.budget.maxResults,
        category: lane.sourceRole === 'fresh_news' ? 'news' : undefined,
      })
      return results.map((result, index) => externalEvidence({ provider, lane, result, index: queryIndex * 100 + index }))
    }

    const results = await searchTavilyQuery(query, {
      topic: lane.sourceRole === 'fresh_news' ? 'news' : 'general',
      maxResults: lane.budget.maxResults,
      includeImages: false,
      searchDepth: lane.sourceRole === 'gap_fill' ? 'advanced' : 'fast',
    })
    return results.results.map((result, index) => externalEvidence({ provider, lane, result, index: queryIndex * 100 + index }))
  })

  const settled = await Promise.allSettled(jobs)
  return {
    evidence: settled.flatMap((result) => result.status === 'fulfilled' ? result.value : []),
    provider,
    durationMs: Math.round(performance.now() - start),
  }
}

export function scoreCoverage(plan: ResearchPlanV2, evidence: EvidenceItem[]): CoverageScore {
  const byRole = new Map<SourceRole, EvidenceItem[]>()
  for (const item of evidence) {
    byRole.set(item.sourceRole, [...(byRole.get(item.sourceRole) ?? []), item])
  }

  const weakSourceRoles = plan.lanes
    .filter((lane) => lane.required && (byRole.get(lane.sourceRole)?.length ?? 0) === 0)
    .map((lane) => lane.sourceRole)

  const missingQuestions = plan.lanes
    .flatMap((lane) => lane.questions.map((question) => ({ lane, question })))
    .filter(({ lane }) => (byRole.get(lane.sourceRole)?.length ?? 0) === 0)
    .map(({ question }) => question)

  const requiredLanes = plan.lanes.filter((lane) => lane.required).length || 1
  const coveredRequired = plan.lanes.filter((lane) => lane.required && (byRole.get(lane.sourceRole)?.length ?? 0) > 0).length
  const score = coveredRequired / requiredLanes

  return {
    enoughToSynthesize: score >= plan.stopRules.enoughEvidenceScore || evidence.length >= 12,
    missingQuestions,
    weakSourceRoles: Array.from(new Set(weakSourceRoles)),
    needsFreshness: plan.lanes.some((lane) => lane.sourceRole === 'fresh_news' && (byRole.get('fresh_news')?.length ?? 0) === 0),
    needsCounterEvidence: plan.lanes.some((lane) => lane.sourceRole === 'counter_evidence' && (byRole.get('counter_evidence')?.length ?? 0) === 0),
    score,
  }
}

export async function runRetrieval(args: {
  plan: ResearchPlanV2
  intent: ResearchIntentPacket
  supabase?: SupabaseClient
  userId?: string
  onProviderEvent?: (event: { provider: 'internal'; kind: string; details?: Record<string, unknown> }) => void
}): Promise<RetrievalResult> {
  const lanesRun: string[] = []
  const lanesSkipped: string[] = []
  const evidence: EvidenceItem[] = []
  const timings = {
    internalMs: 0,
    exaMs: 0,
    tavilyMs: 0,
  }
  const internal = args.supabase
    ? new InternalCorpusProvider({ supabase: args.supabase, userId: args.userId, emitEvent: args.onProviderEvent })
    : null

  for (const lane of args.plan.lanes) {
    if (lane.providerPreference[0] === 'internal') {
      if (!internal) {
        lanesSkipped.push(lane.id)
        continue
      }
      lanesRun.push(lane.id)
      const result = await runInternalLane({ provider: internal, lane, intent: args.intent })
      timings.internalMs += result.durationMs
      evidence.push(...result.evidence)
      continue
    }

    const currentCoverage = scoreCoverage(args.plan, evidence)
    if (currentCoverage.score >= 0.7 && lane.sourceRole !== 'counter_evidence') {
      lane.budget.maxQueries = Math.max(1, Math.floor(lane.budget.maxQueries / 2))
    }

    lanesRun.push(lane.id)
    const result = await runExternalLane(lane)
    if (result.provider === 'exa') timings.exaMs += result.durationMs
    if (result.provider === 'tavily') timings.tavilyMs += result.durationMs
    evidence.push(...result.evidence)
  }

  return {
    evidence,
    coverage: scoreCoverage(args.plan, evidence),
    lanesRun,
    lanesSkipped,
    timings,
  }
}
