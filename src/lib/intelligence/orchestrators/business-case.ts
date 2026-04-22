/* ── Business Case Orchestrator — staged pipeline ─────────── */

import type {
  Assumption,
  BusinessCaseRequest,
  BusinessCaseBrief,
  BriefSource,
  DriverTree,
  NormalizedEvidence,
  ScenarioBands,
  SearchTask,
  TornadoEntry,
  WaterfallStep,
} from '../contracts'
import { BusinessCaseSynthesisSchema } from '../contracts'
import { runStep, generateBriefId, type PipelineContext } from '../pipeline'
import { synthesizeWithSchema } from '../models'
import { rankEvidence, extractQueryTerms } from '../ranker'
import { BUSINESS_CASE_SYSTEM_PROMPT, BUSINESS_CASE_SCHEMA_DESC, buildBusinessCasePrompt } from '../prompts/business-case.v1'
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
  sanitizeMeetingPrepText,
} from '../meeting-prep-display'
import {
  buildV2PlanBridge,
  collectV2EvidenceBridge,
  persistV2EvidencePack,
} from './v2-bridge'

function normalizeDriverTree(
  tree: DriverTree | undefined,
  sourceIdMap: Map<string, string>,
): DriverTree | undefined {
  if (!tree) return undefined

  const seen = new Set<string>()
  const branches = tree.branches
    .map((branch) => ({
      name: branch.name,
      score: Math.min(5, Math.max(0, branch.score)),
      confidence: branch.confidence,
      children: branch.children
        .map((child) => {
          const evidence = normalizeCitedSpan(child.evidence, sourceIdMap)
          if (!evidence) return null

          return {
            label: child.label.trim(),
            evidence,
          }
        })
        .filter((child): child is NonNullable<typeof child> => Boolean(child))
        .filter((child) => child.label),
    }))
    .filter((branch) => {
      if (seen.has(branch.name)) return false
      seen.add(branch.name)
      return true
    })

  return branches.length ? { branches } : undefined
}

function normalizeScenarioBands(scenarios: ScenarioBands | undefined): ScenarioBands | undefined {
  if (!scenarios) return undefined

  const metric = scenarios.metric.trim()
  if (!metric) return undefined

  return {
    metric,
    unit: sanitizeMeetingPrepText(scenarios.unit) ?? undefined,
    downside: {
      value: scenarios.downside.value,
      triggers: scenarios.downside.triggers.map((item) => item.trim()).filter(Boolean),
    },
    base: {
      value: scenarios.base.value,
      drivers: scenarios.base.drivers.map((item) => item.trim()).filter(Boolean),
    },
    upside: {
      value: scenarios.upside.value,
      triggers: scenarios.upside.triggers.map((item) => item.trim()).filter(Boolean),
    },
  }
}

function normalizeTornado(entries: TornadoEntry[] | undefined): TornadoEntry[] | undefined {
  if (!entries?.length) return undefined

  const normalized = entries
    .map((entry) => ({
      assumption: entry.assumption.trim(),
      lowImpact: entry.lowImpact,
      highImpact: entry.highImpact,
    }))
    .filter((entry) => entry.assumption)

  return normalized.length ? normalized : undefined
}

function normalizeWaterfall(
  steps: WaterfallStep[] | undefined,
  sourceIdMap: Map<string, string>,
): WaterfallStep[] | undefined {
  if (!steps?.length) return undefined

  const normalized = steps
    .map((step) => {
      const assumption = normalizeCitedSpan(step.assumption, sourceIdMap)
      if (!assumption) return null

      return {
        label: step.label.trim(),
        delta: step.delta,
        kind: step.kind,
        assumption,
      }
    })
    .filter((step): step is NonNullable<typeof step> => Boolean(step))
    .filter((step) => step.label)

  return normalized.length ? normalized : undefined
}

function normalizeAssumptions(
  assumptions: Assumption[] | undefined,
  sourceIdMap: Map<string, string>,
): Assumption[] | undefined {
  if (!assumptions?.length) return undefined

  const normalized = assumptions
    .map((assumption) => {
      const evidence = assumption.evidence
        .map((span) => normalizeCitedSpan(span, sourceIdMap))
        .filter((span): span is NonNullable<typeof span> => Boolean(span))

      return {
        text: assumption.text.trim(),
        mustBeTrueBecause: assumption.mustBeTrueBecause.trim(),
        confidence: assumption.confidence,
        evidence,
      }
    })
    .filter((assumption) => assumption.text && assumption.mustBeTrueBecause && assumption.evidence.length)

  return normalized.length ? normalized : undefined
}

export async function generateBusinessCaseBrief(
  input: BusinessCaseRequest,
  ctx?: PipelineContext
): Promise<BusinessCaseBrief> {
  const totalStart = performance.now()
  resetSourceCounter()

  const degradedReasons: string[] = []

  /* ── Step 1: resolveEntity ───────────────────────────────── */
  const entityStep = await runStep('business_case', 'resolveEntity', async () => {
    const comparableSnapshots = new Map<string, { description: string; sourceUrl: string | null }>()

    if (input.comparableCompanies?.length) {
      const results = await Promise.allSettled(
        input.comparableCompanies.slice(0, 3).map((c) => searchExaSnapshot(c))
      )
      for (let i = 0; i < input.comparableCompanies.length && i < 3; i++) {
        const r = results[i]
        if (r.status === 'fulfilled' && r.value) {
          comparableSnapshots.set(input.comparableCompanies[i], {
            description: r.value.description || input.comparableCompanies[i],
            sourceUrl: r.value.sourceUrl,
          })
        }
      }
    }

    return { comparableSnapshots }
  }, undefined, ctx)

  const comparableSnapshots = entityStep.data?.comparableSnapshots ?? new Map<string, { description: string; sourceUrl: string | null }>()
  const comparableSnapshotDescriptions = new Map(
    Array.from(comparableSnapshots.entries()).map(([name, snapshot]) => [name, snapshot.description]),
  )

  /* ── Step 2: planSearches ───────────────────────────────── */
  const fallbackSearches: SearchTask[] = [
    {
      provider: 'exa',
      type: 'news',
      query: `${input.initiativeName} ${input.hypothesis} recent evidence customer demand`,
      purpose: 'Find recent proof for or against the business case hypothesis.',
      lookbackDays: 90,
      category: 'news',
    },
    {
      provider: 'tavily',
      type: 'tavily_news',
      query: `${input.initiativeName} ${input.targetMarket ?? ''} market size growth adoption`,
      purpose: 'Find market sizing, adoption, and demand evidence.',
      topic: 'general',
      timeRange: 'year',
      includeImages: true,
    },
    {
      provider: 'tavily',
      type: 'tavily_news',
      query: `${input.initiativeName} risks failures unit economics objections`,
      purpose: 'Find disconfirming evidence and reasons the initiative could fail.',
      topic: 'general',
      timeRange: 'year',
      includeImages: false,
    },
  ]

  for (const comparable of input.comparableCompanies ?? []) {
    fallbackSearches.push({
      provider: 'exa',
      type: 'news',
      query: `${comparable} ${input.initiativeName} comparable outcome revenue adoption`,
      purpose: 'Find comparable company outcomes and lessons.',
      lookbackDays: 365,
    })
  }

  if (input.keyQuestions) {
    fallbackSearches.push({
      provider: 'tavily',
      type: 'tavily_news',
      query: `${input.keyQuestions} ${input.targetMarket ?? input.initiativeName}`,
      purpose: 'Answer the specific decision questions from the user.',
      topic: 'general',
      timeRange: 'year',
      includeImages: true,
    })
  }

  const planStep = await runStep('business_case', 'planSearches', async () => {
    const v2Bridge = await buildV2PlanBridge({
      researchType: 'business_case',
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
      researchPlan: await buildResearchSearchPlan('business_case', input, fallbackSearches, ctx),
      v2Bridge: null,
    }
  }, undefined, ctx)

  const researchPlan = planStep.data?.researchPlan ?? null
  const v2Bridge = planStep.data?.v2Bridge ?? null

  /* ── Step 3: gatherEvidence ──────────────────────────────── */
  const evidenceStep = await runStep('business_case', 'gatherEvidence', async () => {
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

    // Add comparable snapshots as evidence
    for (const [name, snapshot] of Array.from(comparableSnapshots)) {
      const { source, evidence } = normalizeExaSnapshot({
        name, description: snapshot.description, sourceUrl: snapshot.sourceUrl,
        industry: undefined, headquarters: undefined, employeeCount: undefined,
        fundingStage: undefined, lastFundingAmount: undefined, ceo: undefined, recentMilestone: undefined,
        raw: null,
      })
      if (source) allSources.push({ ...source, sourceRole: 'primary' })
      if (evidence) allEvidence.push({ ...evidence, sourceRole: 'primary' })
    }

    return { sources: allSources, evidence: allEvidence, v2Evidence, providerMs }
  }, undefined, ctx)

  const allSources = evidenceStep.data?.sources ?? []
  const allEvidence = evidenceStep.data?.evidence ?? []
  const v2Evidence = evidenceStep.data?.v2Evidence ?? null
  const providerMs = evidenceStep.data?.providerMs ?? { exaMs: 0, tavilyMs: 0 }

  /* ── Step 3: rankEvidence ────────────────────────────────── */
  const queryTerms = extractQueryTerms(`${input.initiativeName} ${input.hypothesis} ${input.targetMarket ?? ''}`)
  const rankStep = await runStep('business_case', 'rankEvidence', async () => {
    return rankEvidence(allEvidence, { topN: 24, queryTerms })
  }, undefined, ctx)

  const rankedEvidence = rankStep.data ?? allEvidence
  const priorBriefBaseline = await loadPriorBriefBaseline({
    supabase: ctx?.supabase,
    userId: ctx?.userId,
    researchType: 'business_case',
    requestPayload: input,
  })

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
  const synthesisStep = await runStep('business_case', 'synthesize', async () => {
    const userPrompt = buildBusinessCasePrompt({
      initiativeName: input.initiativeName,
      hypothesis: input.hypothesis,
      targetMarket: input.targetMarket,
      successMetrics: input.successMetrics,
      keyQuestions: input.keyQuestions,
      comparableCompanies: input.comparableCompanies,
      decisionType: input.decisionType,
      decisionAudience: input.decisionAudience,
      timeHorizon: input.timeHorizon,
      investmentLevel: input.investmentLevel,
      roiFrame: input.roiFrame,
      steering: input.steering,
      userContext: input.userContext,
      evidence: rankedEvidence,
      comparableSnapshots: comparableSnapshotDescriptions,
      priorBriefBaseline,
    })
    return synthesizeWithSchema(
      BUSINESS_CASE_SYSTEM_PROMPT, userPrompt,
      BusinessCaseSynthesisSchema, BUSINESS_CASE_SCHEMA_DESC, 'business_case',
      ctx?.preferredModel
    )
  }, undefined, ctx)

  const synthesis = synthesisStep.data
  if (!synthesis?.data) degradedReasons.push('AI synthesis failed')

  /* ── Step 5: assembleBrief ───────────────────────────────── */
  const canonicalSourceIdMap = buildCanonicalSourceIdMap(allSources)
  const normalizedAnswer = normalizeAnswerBlock(synthesis?.data?.answer, canonicalSourceIdMap)
  const finalAnswer = priorBriefBaseline || !normalizedAnswer
    ? normalizedAnswer
    : { ...normalizedAnswer, whatChanged: null }
  const normalizedDriverTree = normalizeDriverTree(synthesis?.data?.driverTree, canonicalSourceIdMap)
  const normalizedScenarios = normalizeScenarioBands(synthesis?.data?.scenarios)
  const normalizedTornado = normalizeTornado(synthesis?.data?.tornado)
  const normalizedWaterfall = normalizeWaterfall(synthesis?.data?.waterfall, canonicalSourceIdMap)
  const normalizedAssumptions = normalizeAssumptions(synthesis?.data?.assumptions, canonicalSourceIdMap)
  const dedupedSources = markSourcesUsedInAnswer(
    deduplicateSources(allSources),
    [
      ...collectAnswerSourceIds(finalAnswer),
      ...(normalizedDriverTree?.branches.flatMap((branch) => branch.children.flatMap((child) => child.evidence.sourceIds)) ?? []),
      ...(normalizedWaterfall?.flatMap((step) => step.assumption.sourceIds) ?? []),
      ...(normalizedAssumptions?.flatMap((assumption) => assumption.evidence.flatMap((span) => span.sourceIds)) ?? []),
    ],
  )
  const trust = buildTrustLayer({
    sources: dedupedSources,
    sourceIdMap: canonicalSourceIdMap,
    claimSourceGroups: [
      ...(normalizedDriverTree?.branches.flatMap((branch) => branch.children.map((child) => child.evidence.sourceIds)) ?? []),
      ...(normalizedWaterfall?.map((step) => step.assumption.sourceIds) ?? []),
      ...(normalizedAssumptions?.flatMap((assumption) => assumption.evidence.map((span) => span.sourceIds)) ?? []),
      ...(synthesis?.data?.marketEvidence.map((bullet) => bullet.sourceIds) ?? []),
      ...(synthesis?.data?.supportingFactors.map((factor) => factor.sourceIds) ?? []),
      ...(synthesis?.data?.riskFactors.map((factor) => factor.sourceIds) ?? []),
      ...(synthesis?.data?.openQuestions.map((bullet) => bullet.sourceIds) ?? []),
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
    researchType: 'business_case',
    generatedAt: new Date().toISOString(),
    headline: synthesis?.data?.headline ?? 'Unable to generate business case analysis',
    bottomLine: synthesis?.data?.bottomLine ?? 'AI synthesis failed. Raw evidence is still available.',
    whyItMatters: synthesis?.data?.whyItMatters ?? null,
    confidence: synthesis?.data?.confidence ?? 'low',
    answer: finalAnswer,
    verdict: synthesis?.data?.verdict ?? 'insufficient_data',
    verdictRationale: synthesis?.data?.verdictRationale ?? 'Analysis could not be completed.',
    comparables: synthesis?.data?.comparables ?? [],
    driverTree: normalizedDriverTree,
    scenarios: normalizedScenarios,
    tornado: normalizedTornado,
    waterfall: normalizedWaterfall,
    assumptions: normalizedAssumptions,
    sections: {
      marketEvidence: synthesis?.data?.marketEvidence ?? [],
      supportingFactors: synthesis?.data?.supportingFactors ?? [],
      riskFactors: synthesis?.data?.riskFactors ?? [],
      openQuestions: synthesis?.data?.openQuestions ?? [],
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
