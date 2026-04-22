import type {
  EvidenceItem,
  EvidencePack,
  PriorMemorySummary,
  ResearchIntentPacket,
  ResearchPlanV2,
  UserLens,
} from '../contracts'
import { EMPTY_PRIOR_MEMORY } from '../memory/prior-mentions'
import { clusterEvidence, detectContradictions } from './cluster'
import { rankEvidenceItems, scoreEvidenceItem } from './score'
import { validateEvidencePack } from './validate'

function qualityLabel(item: EvidenceItem): EvidencePack['sourceLedger'][number]['qualityLabel'] {
  if (item.quality.primarySource) return 'primary'
  const score = scoreEvidenceItem(item)
  if (score >= 0.72) return 'strong'
  if (score >= 0.45) return 'useful'
  return 'weak'
}

function buildLedger(items: EvidenceItem[]): EvidencePack['sourceLedger'] {
  const seen = new Set<string>()
  const ledger: EvidencePack['sourceLedger'] = []
  for (const item of items) {
    if (seen.has(item.sourceId)) continue
    seen.add(item.sourceId)
    ledger.push({
      sourceId: item.sourceId,
      role: item.sourceRole,
      title: item.title,
      domain: item.domain,
      url: item.url,
      provider: item.provider,
      qualityLabel: qualityLabel(item),
    })
  }
  return ledger
}

function knownGaps(plan: ResearchPlanV2, items: EvidenceItem[]): string[] {
  return plan.lanes
    .filter((lane) => lane.required && !items.some((item) => item.sourceRole === lane.sourceRole))
    .map((lane) => `${lane.sourceRole}: ${lane.questions[0]}`)
}

export function buildEvidencePack(args: {
  runId: string
  intent: ResearchIntentPacket
  userLens: UserLens
  plan: ResearchPlanV2
  evidence: EvidenceItem[]
  lanesRun?: string[]
  lanesSkipped?: string[]
  priorMemory?: PriorMemorySummary
  queryTerms?: string[]
  targetItems?: number
}): EvidencePack {
  const targetItems = args.targetItems ?? 32
  const ranked = rankEvidenceItems(args.evidence, {
    topN: Math.min(Math.max(targetItems, 20), 40),
    queryTerms: args.queryTerms ?? [],
  })

  const clusters = clusterEvidence(ranked)
  const contradictions = detectContradictions(ranked)
  const pack: EvidencePack = {
    run: {
      runId: args.runId,
      researchType: args.intent.researchType,
      generatedAt: new Date().toISOString(),
    },
    intent: args.intent,
    userLens: args.userLens,
    priorMemory: args.priorMemory ?? EMPTY_PRIOR_MEMORY,
    planSummary: {
      lanesRun: args.lanesRun ?? args.plan.lanes.map((lane) => lane.id),
      lanesSkipped: args.lanesSkipped ?? [],
      knownGaps: knownGaps(args.plan, ranked),
    },
    sourceLedger: buildLedger(ranked),
    evidence: ranked,
    clusters,
    contradictions,
    unknowns: knownGaps(args.plan, ranked).map((gap) => ({
      question: gap,
      reasonMissing: 'No covering evidence survived ranking for this required lane.',
    })),
  }

  const validation = validateEvidencePack(pack)
  if (!validation.ok) {
    throw new Error(`Invalid evidence pack: ${validation.issues.join('; ')}`)
  }

  return pack
}
