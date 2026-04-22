import type {
  BriefSource,
  BusinessCaseRequest,
  CompetitiveAnalysisRequest,
  EvidencePack,
  MarketResearchRequest,
  MeetingPrepRequest,
  NormalizedEvidence,
  PriorMemorySummary,
  ResearchDepth,
  ResearchPlan,
  ResearchPlanV2,
  ResearchType,
  SearchTask,
  SourceRole,
} from '../contracts'
import { buildResearchIntentPacket } from '../context/intent-packet'
import { buildUserLens } from '../context/user-lens'
import { buildEvidencePack } from '../evidence/pack'
import { normalizedEvidenceToEvidenceItem } from '../evidence/score'
import { intelligenceFlags } from '../feature-flags'
import { buildDeltaSummary } from '../memory/delta'
import { EMPTY_PRIOR_MEMORY, getPriorMentions } from '../memory/prior-mentions'
import type { PipelineContext } from '../pipeline'
import { planLanes } from '../planner/plan'
import { runRetrieval, type RetrievalResult } from '../retrieval/controller'
import { patchRunAsync, recordEvidencePack, recordProviderEvent } from '../runs/store'

type IntelligenceRequest =
  | MeetingPrepRequest
  | CompetitiveAnalysisRequest
  | BusinessCaseRequest
  | MarketResearchRequest

export interface V2PlanBridge {
  intent: ReturnType<typeof buildResearchIntentPacket>
  userLens: ReturnType<typeof buildUserLens>
  priorMemory: PriorMemorySummary
  planV2: ResearchPlanV2
  researchPlan: ResearchPlan
}

export interface V2EvidenceBridge {
  retrieval: RetrievalResult
  priorMemory: PriorMemorySummary
  sources: BriefSource[]
  evidence: NormalizedEvidence[]
}

function toDepth(value: string | undefined): ResearchDepth | undefined {
  if (!value) return undefined
  if (value === 'fast' || value === 'standard' || value === 'deep') return value
  if (value === 'fast-scan') return 'fast'
  if (value === 'deep-dive') return 'deep'
  return undefined
}

function requestDepth(request: IntelligenceRequest): ResearchDepth | undefined {
  return 'depth' in request && typeof request.depth === 'string'
    ? toDepth(request.depth)
    : undefined
}

function primaryEntityName(intent: ReturnType<typeof buildResearchIntentPacket>): string | null {
  return intent.entities.primary[0]?.name
    ?? intent.entities.competitors[0]?.name
    ?? intent.entities.people[0]?.name
    ?? intent.entities.marketTerms[0]
    ?? null
}

function buildPastMentions(
  entity: string | null,
  priorMemory: typeof EMPTY_PRIOR_MEMORY,
  topic: string,
): ReturnType<typeof buildUserLens>['pastMentions'] {
  if (!entity || !priorMemory.hasPriorCoverage || !priorMemory.lastMentionedAt) return []
  return [{
    topic,
    entity,
    count: priorMemory.totalMentions,
    lastSeenAt: priorMemory.lastMentionedAt,
    lastTakeaway: priorMemory.lastKnownTakeaway ?? 'Prior coverage exists.',
  }]
}

function providerForLane(plan: ResearchPlanV2['lanes'][number]): SearchTask['provider'] {
  const preferred = plan.providerPreference[0]
  if (preferred === 'internal') return 'internal'
  if (preferred === 'tavily' || preferred === 'reddit' || preferred === 'youtube') return 'tavily'
  return 'exa'
}

function typeForLane(provider: SearchTask['provider'], sourceRole: SourceRole): SearchTask['type'] {
  if (sourceRole === 'people') return 'person'
  if (sourceRole === 'primary' && provider !== 'tavily') return 'snapshot'
  if (provider === 'tavily') return 'tavily_news'
  return 'news'
}

export function adaptPlanForDisplay(planV2: ResearchPlanV2): ResearchPlan {
  const searches = planV2.lanes
    .flatMap((lane) => {
      const provider = providerForLane(lane)
      return lane.queryTemplates
        .slice(0, Math.min(2, lane.budget.maxQueries))
        .map((query) => ({
          provider,
          type: typeForLane(provider, lane.sourceRole),
          query,
          purpose: lane.purpose,
          lookbackDays: lane.freshnessDays,
          sourceRole: lane.sourceRole,
          meta: {
            providers: lane.providerPreference.join(','),
            required: String(lane.required),
          },
        }))
    })
    .slice(0, 10)

  return {
    summary: planV2.intentSummary,
    intent: planV2.lanes.map((lane) => `${lane.sourceRole}: ${lane.questions[0]}`).slice(0, 6),
    searches,
    v2: planV2,
  }
}

function sourceUrl(url: string | null, sourceId: string): string {
  return url ?? `internal://${encodeURIComponent(sourceId)}`
}

export function evidenceItemToBriefSource(item: RetrievalResult['evidence'][number]): BriefSource {
  return {
    id: item.sourceId,
    url: sourceUrl(item.url, item.sourceId),
    title: item.title,
    domain: item.domain ?? 'internal',
    publishedAt: item.publishedAt,
    provider: item.provider,
    snippet: item.excerpt.slice(0, 300) || null,
    sourceRole: item.sourceRole,
    usedInAnswer: false,
  }
}

export function evidenceItemToNormalizedEvidence(item: RetrievalResult['evidence'][number]): NormalizedEvidence {
  return {
    id: item.sourceId,
    text: item.excerpt,
    url: sourceUrl(item.url, item.sourceId),
    title: item.title,
    domain: item.domain ?? 'internal',
    publishedAt: item.publishedAt,
    provider: item.provider,
    sourceRole: item.sourceRole,
  }
}

export async function buildV2PlanBridge(args: {
  researchType: ResearchType
  request: IntelligenceRequest
  ctx?: PipelineContext
}): Promise<V2PlanBridge | null> {
  if (!intelligenceFlags.plannerV2()) return null

  const intent = buildResearchIntentPacket({
    runId: args.ctx?.runId,
    userId: args.ctx?.userId ?? 'anonymous',
    researchType: args.researchType,
    request: args.request,
    userContext: args.request.userContext,
    depth: requestDepth(args.request),
  })

  const entity = primaryEntityName(intent)
  const priorMemory = args.ctx?.supabase && args.ctx.userId && entity
    ? await getPriorMentions({
      supabase: args.ctx.supabase,
      userId: args.ctx.userId,
      entity,
      researchType: args.researchType,
    })
    : EMPTY_PRIOR_MEMORY

  const userLens = buildUserLens({
    intent,
    userContext: args.request.userContext,
    pastMentions: buildPastMentions(entity, priorMemory, intent.decision.statedGoal),
  })

  const planV2 = await planLanes({
    intent,
    userLens,
    signal: args.ctx?.signal,
    preferredModel: args.ctx?.preferredModel,
  })

  if (args.ctx?.runId && args.ctx.supabase) {
    patchRunAsync({
      supabase: args.ctx.supabase,
      runId: args.ctx.runId,
      fields: {
        intent_packet: intent,
        user_lens: userLens,
        plan: planV2,
        plan_version: 'v2',
      },
    })
  }

  return {
    intent,
    userLens,
    priorMemory,
    planV2,
    researchPlan: adaptPlanForDisplay(planV2),
  }
}

export async function collectV2EvidenceBridge(args: {
  bridge: V2PlanBridge
  ctx?: PipelineContext
}): Promise<V2EvidenceBridge> {
  const retrieval = await runRetrieval({
    plan: args.bridge.planV2,
    intent: args.bridge.intent,
    supabase: intelligenceFlags.internalCorpus() ? args.ctx?.supabase : undefined,
    userId: args.ctx?.userId,
    onProviderEvent: args.ctx?.supabase && args.ctx?.runId
      ? (event) => {
        void recordProviderEvent({
          supabase: args.ctx!.supabase!,
          runId: args.ctx!.runId!,
          provider: event.provider,
          kind: event.kind,
          details: event.details,
        })
      }
      : undefined,
  })

  return {
    retrieval,
    priorMemory: buildDeltaSummary({
      priorMemory: args.bridge.priorMemory,
      evidence: retrieval.evidence,
    }),
    sources: retrieval.evidence.map(evidenceItemToBriefSource),
    evidence: retrieval.evidence.map(evidenceItemToNormalizedEvidence),
  }
}

export function persistV2EvidencePack(args: {
  bridge: V2PlanBridge
  retrieval: RetrievalResult
  priorMemory: PriorMemorySummary
  evidence: NormalizedEvidence[]
  queryTerms: string[]
  ctx?: PipelineContext
}): EvidencePack {
  const pack = buildEvidencePack({
    runId: args.ctx?.runId ?? args.bridge.intent.runId,
    intent: args.bridge.intent,
    userLens: args.bridge.userLens,
    priorMemory: args.priorMemory,
    plan: args.bridge.planV2,
    evidence: args.evidence.map(normalizedEvidenceToEvidenceItem),
    lanesRun: args.retrieval.lanesRun,
    lanesSkipped: args.retrieval.lanesSkipped,
    queryTerms: args.queryTerms,
  })

  if (intelligenceFlags.evidencePack() && args.ctx?.supabase && args.ctx.runId) {
    void recordEvidencePack({
      supabase: args.ctx.supabase,
      runId: args.ctx.runId,
      pack,
    })
  }

  return pack
}
