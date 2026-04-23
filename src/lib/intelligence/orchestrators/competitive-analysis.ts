/* ── Competitive Analysis Orchestrator — staged pipeline ──── */

import type {
  CompetitiveAnalysisRequest,
  CompetitiveAnalysisBrief,
  CompetitiveSynthesis,
  BriefSource,
  CompositeQuadrant,
  NormalizedEvidence,
  SearchTask,
} from '../contracts'
import { CompetitiveSynthesisSchema } from '../contracts'
import { runStep, generateBriefId, type PipelineContext } from '../pipeline'
import { synthesizeWithSchema, type ModelPreference, type SynthesisResult } from '../models'
import { rankEvidence, extractQueryTerms } from '../ranker'
import { COMPETITIVE_SYSTEM_PROMPT, COMPETITIVE_SCHEMA_DESC, buildCompetitivePrompt } from '../prompts/competitive.v1'
import { searchExaSnapshot } from '../providers/exa'
import { loadPriorBriefBaseline } from '../prior-briefs'
import { buildResearchSearchPlan, executeSearchPlan } from '../search-planner'
import {
  normalizeExaSnapshot,
  deduplicateSources,
  resetSourceCounter,
} from '../normalize'
import {
  buildCanonicalSourceIdMap,
  buildMethodology,
  buildTrustLayer,
  collectAnswerSourceIds,
  markSourcesUsedInAnswer,
  normalizeAnswerBlock,
  normalizeCitedSpan,
} from '../meeting-prep-display'
import {
  buildV2PlanBridge,
  collectV2EvidenceBridge,
  persistV2EvidencePack,
} from './v2-bridge'

// Keep the alignment retry on providers that reliably accept our structured-output params.
const COMPETITIVE_ALIGNMENT_RETRY_MODEL: ModelPreference = 'anthropic/claude-sonnet-4.6'
const COMPETITIVE_ALIGNMENT_SECONDARY_MODEL: ModelPreference = 'google/gemini-3.1-flash-lite-preview'
const COMPETITIVE_ALIGNMENT_RETRY_TIMEOUT_MS = 12_000

function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function normalizeEntityToken(value: string | null | undefined): string {
  if (!value) return ''
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const ENTITY_DESCRIPTOR_TAILS = new Set([
  'ground',
  'express',
  'logistics',
  'shipping',
  'ship',
  'courier',
  'delivery',
  'freight',
  'mail',
  'parcel',
  'services',
  'service',
])

interface CompetitiveEntityMatcher {
  label: string
  aliases: string[]
}

function buildEntityAliases(value: string | null | undefined): string[] {
  const normalized = normalizeEntityToken(value)
  if (!normalized) return []

  const aliases = new Set<string>([normalized])
  const parts = normalized.split(' ').filter(Boolean)
  if (parts.length === 2 && ENTITY_DESCRIPTOR_TAILS.has(parts[1])) {
    aliases.add(parts[0])
  }

  return Array.from(aliases)
}

function collectExpectedEntities(input: CompetitiveAnalysisRequest): CompetitiveEntityMatcher[] {
  const seen = new Set<string>()
  const entities = [input.yourCompany, ...input.competitors]
  const matchers: CompetitiveEntityMatcher[] = []

  for (const entity of entities) {
    const aliases = buildEntityAliases(entity)
    if (!aliases.length) continue
    const label = aliases[0]
    if (seen.has(label)) continue
    seen.add(label)
    matchers.push({ label, aliases })
  }

  return matchers
}

function collectCompetitiveOutputText(data: NonNullable<CompetitiveAnalysisBrief['answer']> | undefined, synthesis: CompetitiveSynthesis | null | undefined): string {
  const competitorBlocks = (synthesis?.competitors ?? []).flatMap((competitor) => [
    competitor.name,
    competitor.description,
    ...competitor.strengths,
    ...competitor.weaknesses,
    ...competitor.recentMoves,
  ])

  const matrixValues = (synthesis?.comparisonMatrix ?? []).flatMap((row) => row.values.flatMap((value) => [
    value.company,
    value.position,
  ]))

  const quadrantValues = synthesis?.compositeQuadrant?.rendered
    ? [
      synthesis.compositeQuadrant.xAxis.name,
      synthesis.compositeQuadrant.yAxis.name,
      synthesis.compositeQuadrant.xAxis.rationale.text,
      synthesis.compositeQuadrant.yAxis.rationale.text,
      ...synthesis.compositeQuadrant.points.flatMap((point) => [point.entity, point.rationale.text]),
    ]
    : []

  return normalizeEntityToken([
    synthesis?.headline,
    synthesis?.bottomLine,
    synthesis?.whyItMatters,
    data?.conclusion.text,
    data?.whyItMatters.text,
    data?.whatChanged?.text,
    data?.recommendedNext.text,
    ...competitorBlocks,
    ...matrixValues,
    ...quadrantValues,
  ]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(' '))
}

function baselineLooksRelevant(priorBriefBaseline: string | null | undefined, expectedEntities: CompetitiveEntityMatcher[]): boolean {
  if (!priorBriefBaseline || expectedEntities.length === 0) return false
  const normalizedBaseline = normalizeEntityToken(priorBriefBaseline)
  return expectedEntities.some((entity) => entity.aliases.some((alias) => normalizedBaseline.includes(alias)))
}

function validateCompetitiveAlignment(
  synthesis: CompetitiveSynthesis | null | undefined,
  input: CompetitiveAnalysisRequest,
): { ok: boolean; missing: string[] } {
  if (!synthesis) {
    return { ok: false, missing: collectExpectedEntities(input).map((entity) => entity.label) }
  }

  const expectedEntities = collectExpectedEntities(input)
  if (expectedEntities.length === 0) return { ok: true, missing: [] }

  const answer = synthesis.answer
    ? {
      conclusion: synthesis.answer.conclusion,
      whyItMatters: synthesis.answer.whyItMatters,
      whatChanged: synthesis.answer.whatChanged,
      confidence: synthesis.answer.confidence,
      recommendedNext: synthesis.answer.recommendedNext,
    }
    : undefined
  const corpus = collectCompetitiveOutputText(answer, synthesis)
  const missing = expectedEntities
    .filter((entity) => !entity.aliases.some((alias) => corpus.includes(alias)))
    .map((entity) => entity.label)

  return { ok: missing.length === 0, missing }
}

function collectEntityEvidence(evidence: NormalizedEvidence[], aliases: string[]): NormalizedEvidence[] {
  if (!aliases.length) return []
  return evidence.filter((item) => {
    const haystack = normalizeEntityToken(`${item.title} ${item.text}`)
    return aliases.some((alias) => haystack.includes(alias))
  })
}

function buildFallbackSourceIds(evidence: NormalizedEvidence[], limit = 3): string[] {
  return Array.from(new Set(evidence.map((item) => item.id))).slice(0, limit)
}

function clipSentence(value: string, max = 160): string {
  const trimmed = value.replace(/\s+/g, ' ').trim()
  if (!trimmed) return ''
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1).trimEnd()}…`
}

function buildFallbackCompetitiveSynthesis(
  input: CompetitiveAnalysisRequest,
  evidence: NormalizedEvidence[],
  competitorSnapshots: Map<string, string>,
  yourSnapshot: string | null,
  alignmentMissing: string[],
): CompetitiveSynthesis {
  const entities = collectExpectedEntities(input)
  const yourEntity = entities.find((entity) => entity.label === normalizeEntityToken(input.yourCompany))
  const competitorEntities = entities.filter((entity) => entity.label !== normalizeEntityToken(input.yourCompany))
  const yourEvidence = collectEntityEvidence(evidence, yourEntity?.aliases ?? [])
  const competitorEvidence = competitorEntities.flatMap((entity) => collectEntityEvidence(evidence, entity.aliases))
  const allEvidence = evidence.length ? evidence : [...yourEvidence, ...competitorEvidence]
  const dominantCompetitor = competitorEntities[0]
  const dominantCompetitorName = input.competitors[0] ?? 'the requested competitor'
  const yourName = input.yourCompany ?? 'your company'
  const sourceIds = buildFallbackSourceIds([
    ...yourEvidence.slice(0, 2),
    ...competitorEvidence.slice(0, 2),
    ...allEvidence.slice(0, 2),
  ])

  const yourCoverage = yourEvidence.length
  const competitorCoverage = competitorEvidence.length
  const coverageHeadline = yourCoverage && competitorCoverage
    ? `${yourName} vs ${dominantCompetitorName} stays relevant, but the evidence is too uneven for a high-confidence ${input.focusArea} verdict.`
    : `Relevant found source material for ${yourName} vs ${dominantCompetitorName}, but not enough balanced evidence to make a confident ${input.focusArea} call.`

  const whyItMatters = `You can still review the cited sources for ${yourName} and ${dominantCompetitorName}, but this comparison should stay provisional until the synthesis pass stops drifting off-topic.`
  const alignmentReason = alignmentMissing.length
    ? `The model kept substituting unrelated companies instead of staying with ${alignmentMissing.join(' and ')}.`
    : `The model could not keep the comparison anchored to ${yourName} and ${dominantCompetitorName}.`

  const competitorProfiles = input.competitors.map((name) => {
    const matcher = entities.find((entity) => entity.aliases.includes(normalizeEntityToken(name)))
    const entityEvidence = collectEntityEvidence(evidence, matcher?.aliases ?? [])
    const snapshot = competitorSnapshots.get(name)

    return {
      name,
      description: clipSentence(snapshot ?? entityEvidence[0]?.title ?? `${name} is part of the requested competitor set in this analysis.`),
      strengths: entityEvidence.length
        ? entityEvidence.slice(0, 2).map((item) => clipSentence(item.title))
        : ['Current source coverage for this competitor is thin in the retrieved set.'],
      weaknesses: [
        entityEvidence.length
          ? 'The retrieved source set does not isolate a defensible weakness without more primary evidence.'
          : 'There is not enough direct evidence in the current source set to score weaknesses confidently.',
      ],
      recentMoves: entityEvidence.length
        ? entityEvidence.slice(0, 2).map((item) => clipSentence(item.title))
        : ['No specific recent move was strong enough to cite confidently from the current retrieval set.'],
    }
  })

  const comparisonMatrix = input.yourCompany
    ? [
      {
        dimension: 'Evidence coverage',
        values: [
          { company: yourName, position: `${yourCoverage} cited signals in the current set`, score: Math.min(5, Math.max(1, yourCoverage || 1)) },
          { company: dominantCompetitorName, position: `${competitorCoverage} cited signals in the current set`, score: Math.min(5, Math.max(1, competitorCoverage || 1)) },
        ],
      },
      {
        dimension: 'Structured confidence',
        values: [
          { company: yourName, position: 'Still provisional because the synthesis drifted off-topic', score: 2 },
          { company: dominantCompetitorName, position: 'Still provisional because the synthesis drifted off-topic', score: 2 },
        ],
      },
    ]
    : []

  return {
    headline: coverageHeadline,
    bottomLine: `${alignmentReason} Relevant still retrieved ${allEvidence.length} source-backed signals for this request, so the answer remains on ${yourName} vs ${dominantCompetitorName} instead of falling back to a different market entirely.`,
    whyItMatters,
    confidence: 'low',
    answer: {
      conclusion: {
        text: `${yourName} and ${dominantCompetitorName} remain the right comparison set, but the current evidence is too uneven to declare a reliable ${input.focusArea} winner.`,
        sourceIds,
      },
      whyItMatters: {
        text: whyItMatters,
        sourceIds,
      },
      whatChanged: null,
      confidence: {
        level: 'low',
        driver: alignmentReason,
      },
      recommendedNext: {
        text: `Use the cited sources to narrow the next rerun around one GTM sub-question for ${yourName} vs ${dominantCompetitorName}, such as pricing, channel motion, or service positioning.`,
      },
    },
    competitors: competitorProfiles,
    comparisonMatrix,
    compositeQuadrant: {
      rendered: false,
      reason: 'The AI synthesis drifted off-topic, so a quadrant would imply confidence we do not actually have.',
    },
    whitespace: [],
    keyFindings: [
      {
        text: `${dominantCompetitorName} has ${competitorCoverage} directly retrieved evidence items in this run, while ${yourName} has ${yourCoverage}.`,
        sourceIds,
        tag: 'fact',
        priority: 'must',
      },
    ],
    strategicImplications: [
      {
        text: `Keep the comparison scoped to ${yourName} and ${dominantCompetitorName} until the synthesis model can stay anchored to the retrieved logistics evidence.`,
        sourceIds,
        tag: 'inference',
        priority: 'should',
      },
    ],
    recommendations: [
      {
        text: `Rerun ${yourName} vs ${dominantCompetitorName} with a narrower GTM question if you need a sharper answer than this low-confidence fallback.`,
        sourceIds,
        tag: 'fact',
        priority: 'must',
      },
    ],
  }
}

async function synthesizeCompetitiveBrief(
  input: CompetitiveAnalysisRequest,
  evidence: NormalizedEvidence[],
  competitorSnapshots: Map<string, string>,
  yourSnapshot: string | null,
  priorBriefBaseline: string | null,
  preferredModel?: ModelPreference,
  disableModelFallback = false,
  timeoutMs?: number,
): Promise<SynthesisResult<CompetitiveSynthesis>> {
  const userPrompt = buildCompetitivePrompt({
    competitors: input.competitors,
    yourCompany: input.yourCompany,
    focusArea: input.focusArea,
    specificQuestions: input.specificQuestions,
    marketSegment: input.marketSegment,
    geography: input.geography,
    customerType: input.customerType,
    useCasePreset: input.useCasePreset,
    steering: input.steering,
    userContext: input.userContext,
    evidence,
    competitorSnapshots,
    yourSnapshot,
    priorBriefBaseline,
  })

  return synthesizeWithSchema(
    COMPETITIVE_SYSTEM_PROMPT,
    userPrompt,
    CompetitiveSynthesisSchema,
    COMPETITIVE_SCHEMA_DESC,
    'competitive_analysis',
    preferredModel,
    { disableModelFallback, timeoutMs },
  )
}

function normalizeCompositeQuadrant(
  quadrant: CompositeQuadrant | undefined,
  sourceIdMap: Map<string, string>,
): CompositeQuadrant | undefined {
  if (!quadrant) return undefined

  if (!quadrant.rendered) {
    const reason = quadrant.reason.trim()
    return reason ? { rendered: false, reason } : undefined
  }

  const xRationale = normalizeCitedSpan(quadrant.xAxis.rationale, sourceIdMap)
  const yRationale = normalizeCitedSpan(quadrant.yAxis.rationale, sourceIdMap)
  if (!xRationale || !yRationale) {
    return {
      rendered: false,
      reason: 'The quadrant evidence was not distinct enough to render reliably.',
    }
  }

  const points = quadrant.points
    .map((point) => {
      const rationale = normalizeCitedSpan(point.rationale, sourceIdMap)
      if (!rationale) return null

      return {
        entity: point.entity.trim(),
        x: clampUnit(point.x),
        y: clampUnit(point.y),
        rationale,
      }
    })
    .filter((point): point is NonNullable<typeof point> => Boolean(point))
    .filter((point) => point.entity)

  if (!quadrant.xAxis.name.trim() || !quadrant.yAxis.name.trim() || points.length < 2) {
    return {
      rendered: false,
      reason: 'The quadrant evidence was not distinct enough to render reliably.',
    }
  }

  return {
    rendered: true,
    xAxis: {
      name: quadrant.xAxis.name.trim(),
      description: quadrant.xAxis.description.trim(),
      rationale: xRationale,
    },
    yAxis: {
      name: quadrant.yAxis.name.trim(),
      description: quadrant.yAxis.description.trim(),
      rationale: yRationale,
    },
    points,
  }
}

function normalizeWhitespace(
  pockets: CompetitiveAnalysisBrief['whitespace'] | undefined,
  sourceIdMap: Map<string, string>,
): CompetitiveAnalysisBrief['whitespace'] | undefined {
  if (!pockets?.length) return undefined

  const seen = new Set<string>()
  const normalized = pockets
    .map((pocket) => {
      const evidence = normalizeCitedSpan(pocket.evidence, sourceIdMap)
      if (!evidence) return null

      return {
        kind: pocket.kind,
        headline: pocket.headline.trim(),
        evidence,
      }
    })
    .filter((pocket): pocket is NonNullable<typeof pocket> => Boolean(pocket))
    .filter((pocket) => {
      if (!pocket.headline || seen.has(pocket.kind)) return false
      seen.add(pocket.kind)
      return true
    })

  return normalized.length ? normalized : undefined
}

export async function generateCompetitiveAnalysisBrief(
  input: CompetitiveAnalysisRequest,
  ctx?: PipelineContext
): Promise<CompetitiveAnalysisBrief> {
  const totalStart = performance.now()
  resetSourceCounter()

  const limitedCompetitors = input.competitors.slice(0, 3)
  const degradedReasons: string[] = []

  /* ── Step 1: resolveEntity ───────────────────────────────── */
  const entityStep = await runStep('competitive_analysis', 'resolveEntity', async () => {
    const snapshots = new Map<string, { description: string; sourceUrl: string | null }>()
    let yourSnapshot: string | null = null

    const jobs = [
      ...limitedCompetitors.map((c) => ({ type: 'competitor' as const, name: c })),
      ...(input.yourCompany ? [{ type: 'your' as const, name: input.yourCompany }] : []),
    ]

    const results = await Promise.allSettled(
      jobs.map((j) => searchExaSnapshot(j.name))
    )

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i]
      const result = results[i]
      if (result.status === 'fulfilled' && result.value) {
        if (job.type === 'your') {
          yourSnapshot = result.value.description || job.name
        } else {
          snapshots.set(job.name, {
            description: result.value.description || job.name,
            sourceUrl: result.value.sourceUrl,
          })
        }
      }
    }

    return { snapshots, yourSnapshot }
  }, undefined, ctx)

  const competitorSnapshots = entityStep.data?.snapshots ?? new Map<string, { description: string; sourceUrl: string | null }>()
  const competitorSnapshotDescriptions = new Map(
    Array.from(competitorSnapshots.entries()).map(([name, snapshot]) => [name, snapshot.description]),
  )
  const yourSnapshot = entityStep.data?.yourSnapshot ?? null

  /* ── Step 2: planSearches ───────────────────────────────── */
  const fallbackSearches: SearchTask[] = [
    ...limitedCompetitors.map((competitor) => ({
      provider: 'exa' as const,
      type: 'news' as const,
      query: `${competitor} ${input.focusArea} recent product pricing customer moves`,
      purpose: `Find recent evidence for ${competitor} in ${input.focusArea}.`,
      lookbackDays: 90,
      category: 'news' as const,
    })),
    {
      provider: 'tavily',
      type: 'tavily_news',
      query: `${limitedCompetitors.join(' vs ')} ${input.focusArea} comparison customer segment`,
      purpose: 'Find cross-source competitive comparisons and market perception.',
      topic: 'general',
      timeRange: 'month',
      includeImages: true,
    },
    {
      provider: 'tavily',
      type: 'tavily_news',
      query: `${limitedCompetitors.join(' ')} risks weaknesses pricing complaints`,
      purpose: 'Find counter-evidence, objections, and weaknesses.',
      topic: 'general',
      timeRange: 'month',
      includeImages: false,
    },
  ]

  if (input.yourCompany) {
    fallbackSearches.push({
      provider: 'exa',
      type: 'news',
      query: `${input.yourCompany} ${limitedCompetitors.join(' ')} competitive positioning ${input.focusArea}`,
      purpose: 'Compare the user company against named competitors.',
      lookbackDays: 120,
    })
  }

  if (input.marketSegment || input.customerType || input.geography) {
    fallbackSearches.push({
      provider: 'tavily',
      type: 'tavily_news',
      query: `${limitedCompetitors.join(' ')} ${input.marketSegment ?? ''} ${input.customerType ?? ''} ${input.geography ?? ''} buying criteria`,
      purpose: 'Ground the analysis in the requested segment, buyer, and geography.',
      topic: 'general',
      timeRange: 'month',
      includeImages: true,
    })
  }

  const planStep = await runStep('competitive_analysis', 'planSearches', async () => {
    const v2Bridge = await buildV2PlanBridge({
      researchType: 'competitive_analysis',
      request: input,
      ctx,
    })

    if (v2Bridge) {
      return {
        researchPlan: v2Bridge.researchPlan,
        v2Bridge,
      }
    }

    return {
      researchPlan: await buildResearchSearchPlan('competitive_analysis', input, fallbackSearches, ctx),
      v2Bridge: null,
    }
  }, undefined, ctx)

  const researchPlan = planStep.data?.researchPlan ?? null
  const v2Bridge = planStep.data?.v2Bridge ?? null

  /* ── Step 3: gatherEvidence ──────────────────────────────── */
  const evidenceStep = await runStep('competitive_analysis', 'gatherEvidence', async () => {
    const allSources: BriefSource[] = []
    const allEvidence: NormalizedEvidence[] = []
    let v2Evidence: Awaited<ReturnType<typeof collectV2EvidenceBridge>> | null = null
    const providerMs = { exaMs: 0, tavilyMs: 0 }

    if (v2Bridge) {
      v2Evidence = await collectV2EvidenceBridge({ bridge: v2Bridge, ctx })
      providerMs.exaMs += v2Evidence.retrieval.timings.exaMs
      providerMs.tavilyMs += v2Evidence.retrieval.timings.tavilyMs
      allSources.push(...v2Evidence.sources)
      allEvidence.push(...v2Evidence.evidence)
    } else {
      const planned = researchPlan ? await executeSearchPlan(researchPlan) : { sources: [], evidence: [] }
      allSources.push(...planned.sources)
      allEvidence.push(...planned.evidence)
    }

    // Also add snapshot sources
    for (const [name, snap] of Array.from(competitorSnapshots)) {
      if (snap) {
        const { source, evidence } = normalizeExaSnapshot({
          name, description: snap.description, sourceUrl: snap.sourceUrl,
          industry: undefined, headquarters: undefined, employeeCount: undefined,
          fundingStage: undefined, lastFundingAmount: undefined, ceo: undefined, recentMilestone: undefined,
          raw: null,
        })
        if (source) allSources.push({ ...source, sourceRole: 'primary' })
        if (evidence) allEvidence.push({ ...evidence, sourceRole: 'primary' })
      }
    }

    return { sources: allSources, evidence: allEvidence, v2Evidence, providerMs }
  }, undefined, ctx)

  const allSources = evidenceStep.data?.sources ?? []
  const allEvidence = evidenceStep.data?.evidence ?? []
  const v2Evidence = evidenceStep.data?.v2Evidence ?? null
  const providerMs = evidenceStep.data?.providerMs ?? { exaMs: 0, tavilyMs: 0 }

  /* ── Step 3: rankEvidence ────────────────────────────────── */
  const queryTerms = extractQueryTerms(
    `${limitedCompetitors.join(' ')} ${input.focusArea} ${input.yourCompany ?? ''}`
  )
  const rankStep = await runStep('competitive_analysis', 'rankEvidence', async () => {
    return rankEvidence(allEvidence, { topN: 24, queryTerms })
  }, undefined, ctx)

  const rankedEvidence = rankStep.data ?? allEvidence
  const rawPriorBriefBaseline = await loadPriorBriefBaseline({
    supabase: ctx?.supabase,
    userId: ctx?.userId,
    researchType: 'competitive_analysis',
    requestPayload: input,
  })
  const expectedEntities = collectExpectedEntities(input)
  const priorBriefBaseline = baselineLooksRelevant(rawPriorBriefBaseline, expectedEntities)
    ? rawPriorBriefBaseline
    : null

  const evidencePack = v2Bridge && v2Evidence
    ? persistV2EvidencePack({
      bridge: v2Bridge,
      retrieval: v2Evidence.retrieval,
      priorMemory: v2Evidence.priorMemory,
      evidence: allEvidence,
      queryTerms,
      ctx,
    })
    : null

  /* ── Step 4: synthesize ──────────────────────────────────── */
  const synthesisStep = await runStep('competitive_analysis', 'synthesize', async () => {
    const firstAttempt = await synthesizeCompetitiveBrief(
      input,
      rankedEvidence,
      competitorSnapshotDescriptions,
      yourSnapshot,
      priorBriefBaseline,
      ctx?.preferredModel,
    )

    const firstAlignment = validateCompetitiveAlignment(firstAttempt.data, input)
    if (firstAttempt.data && firstAlignment.ok) return firstAttempt

    const retryModel = ctx?.preferredModel === COMPETITIVE_ALIGNMENT_RETRY_MODEL
      ? COMPETITIVE_ALIGNMENT_SECONDARY_MODEL
      : COMPETITIVE_ALIGNMENT_RETRY_MODEL
    const retryAttempt = await synthesizeCompetitiveBrief(
      input,
      rankedEvidence,
      competitorSnapshotDescriptions,
      yourSnapshot,
      null,
      retryModel,
      true,
      COMPETITIVE_ALIGNMENT_RETRY_TIMEOUT_MS,
    )
    const retryAlignment = validateCompetitiveAlignment(retryAttempt.data, input)
    if (retryAttempt.data && retryAlignment.ok) return retryAttempt

    return {
      ...retryAttempt,
      data: null,
      errorClass: retryAttempt.errorClass ?? 'entity_alignment_failed',
      fallbackReason: firstAttempt.data || retryAttempt.data
        ? `entity_alignment_failed:${Array.from(new Set([...firstAlignment.missing, ...retryAlignment.missing])).join('|')}`
        : retryAttempt.fallbackReason ?? firstAttempt.fallbackReason ?? null,
    }
  }, undefined, ctx)

  const synthesis = synthesisStep.data
  const alignmentMissing = synthesisStep.data?.fallbackReason?.startsWith('entity_alignment_failed:')
    ? synthesisStep.data.fallbackReason.replace('entity_alignment_failed:', '').split('|').filter(Boolean)
    : []
  const fallbackSynthesis = !synthesis?.data
    ? buildFallbackCompetitiveSynthesis(
      input,
      rankedEvidence,
      competitorSnapshotDescriptions,
      yourSnapshot,
      alignmentMissing,
    )
    : null
  const finalSynthesis = synthesis?.data ?? fallbackSynthesis
  if (!synthesis?.data) {
    const alignmentReason = synthesisStep.data?.fallbackReason
    degradedReasons.push(
      alignmentReason?.startsWith('entity_alignment_failed:')
        ? `AI synthesis drifted away from requested companies (${alignmentReason.replace('entity_alignment_failed:', '').replace(/\|/g, ', ')})`
        : 'AI synthesis failed',
    )
  }

  /* ── Step 5: assembleBrief ───────────────────────────────── */
  const canonicalSourceIdMap = buildCanonicalSourceIdMap(allSources)
  const normalizedAnswer = normalizeAnswerBlock(finalSynthesis?.answer, canonicalSourceIdMap)
  const finalAnswer = priorBriefBaseline || !normalizedAnswer
    ? normalizedAnswer
    : { ...normalizedAnswer, whatChanged: null }
  const normalizedCompositeQuadrant = normalizeCompositeQuadrant(finalSynthesis?.compositeQuadrant, canonicalSourceIdMap)
  const normalizedWhitespace = normalizeWhitespace(finalSynthesis?.whitespace, canonicalSourceIdMap)
  const dedupedSources = markSourcesUsedInAnswer(
    deduplicateSources(allSources),
    [
      ...collectAnswerSourceIds(finalAnswer),
      ...(normalizedCompositeQuadrant?.rendered
        ? [
          ...normalizedCompositeQuadrant.xAxis.rationale.sourceIds,
          ...normalizedCompositeQuadrant.yAxis.rationale.sourceIds,
          ...normalizedCompositeQuadrant.points.flatMap((point) => point.rationale.sourceIds),
        ]
        : []),
      ...(normalizedWhitespace?.flatMap((pocket) => pocket.evidence.sourceIds) ?? []),
    ],
  )
  const trust = buildTrustLayer({
    sources: dedupedSources,
    sourceIdMap: canonicalSourceIdMap,
    claimSourceGroups: [
      ...(normalizedWhitespace?.map((pocket) => pocket.evidence.sourceIds) ?? []),
      ...(normalizedCompositeQuadrant?.rendered
        ? [
          normalizedCompositeQuadrant.xAxis.rationale.sourceIds,
          normalizedCompositeQuadrant.yAxis.rationale.sourceIds,
          ...normalizedCompositeQuadrant.points.map((point) => point.rationale.sourceIds),
        ]
        : []),
      ...(finalSynthesis?.keyFindings.map((bullet) => bullet.sourceIds) ?? []),
      ...(finalSynthesis?.strategicImplications.map((bullet) => bullet.sourceIds) ?? []),
      ...(finalSynthesis?.recommendations.map((bullet) => bullet.sourceIds) ?? []),
      ...(finalAnswer ? [
        finalAnswer.conclusion.sourceIds,
        finalAnswer.whyItMatters.sourceIds,
        finalAnswer.whatChanged?.sourceIds,
      ] : []),
    ],
    pack: evidencePack,
    plan: v2Bridge?.planV2,
  })
  const methodology = buildMethodology({
    sources: dedupedSources,
    sourceIdMap: canonicalSourceIdMap,
    trust,
    researchPlan,
    allEvidence,
    rankedEvidence,
    retrieval: v2Evidence?.retrieval,
  })
  if (dedupedSources.length < 4) degradedReasons.push('Low source count')
  const totalMs = Math.round(performance.now() - totalStart)
  const internalMs = v2Evidence?.retrieval.timings.internalMs ?? 0
  const exaMs = entityStep.timings.durationMs + providerMs.exaMs
  const tavilyMs = providerMs.tavilyMs

  return {
    id: generateBriefId(),
    researchType: 'competitive_analysis',
    generatedAt: new Date().toISOString(),
    headline: finalSynthesis?.headline ?? 'Unable to generate competitive analysis',
    bottomLine: finalSynthesis?.bottomLine ?? 'AI synthesis failed. Raw evidence is still available.',
    whyItMatters: finalSynthesis?.whyItMatters ?? null,
    confidence: finalSynthesis?.confidence ?? 'low',
    answer: finalAnswer,
    yourCompany: input.yourCompany ?? null,
    competitors: finalSynthesis?.competitors ?? [],
    comparisonMatrix: finalSynthesis?.comparisonMatrix ?? [],
    compositeQuadrant: normalizedCompositeQuadrant,
    whitespace: normalizedWhitespace,
    sections: {
      keyFindings: finalSynthesis?.keyFindings ?? [],
      strategicImplications: finalSynthesis?.strategicImplications ?? [],
      recommendations: finalSynthesis?.recommendations ?? [],
    },
    sources: dedupedSources,
    trust,
    methodology,
    researchPlan,
    contextUsed: input.userContext ?? null,
    status: {
      degraded: degradedReasons.length > 0,
      reasons: degradedReasons,
      internalMs,
      plannerMs: planStep.timings.durationMs,
      exaMs,
      tavilyMs,
      verifierMs: 0,
      exaSearchMs: exaMs,
      tavilySearchMs: tavilyMs,
      synthesisMs: synthesisStep.timings.durationMs,
      totalMs,
      sourceCount: dedupedSources.length,
      cached: false,
      synthesisModel: synthesis?.model ?? null,
    },
  }
}
