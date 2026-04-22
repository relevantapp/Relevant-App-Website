/* ── Meeting Prep Orchestrator — staged pipeline ─────────── */

import type {
  MeetingPrepRequest,
  MeetingPrepBrief,
  CompanySnapshot,
  AttendeeProfile,
  BriefSource,
  NormalizedEvidence,
  SearchTask,
  TimelineEvent,
  RadarMetric,
  CompetitorMatrixRow,
  BriefBullet,
} from '../contracts'
import { runStep, generateBriefId, type PipelineContext } from '../pipeline'
import { synthesizeWithSchema } from '../models'
import { rankEvidence, extractQueryTerms } from '../ranker'
import { MEETING_PREP_SYSTEM_PROMPT, MEETING_PREP_SCHEMA_DESC, buildMeetingPrepPrompt } from '../prompts/meeting-prep.v1'
import { searchExaSnapshot, searchExaPerson } from '../providers/exa'
import { extractTavilySite } from '../providers/tavily'
import { buildResearchSearchPlan, executeSearchPlan } from '../search-planner'
import {
  normalizeExaSnapshot,
  normalizeExaResults,
  deduplicateSources,
  resetSourceCounter,
} from '../normalize'
import {
  buildV2PlanBridge,
  collectV2EvidenceBridge,
  persistV2EvidencePack,
} from './v2-bridge'
import {
  buildCanonicalSourceIdMap,
  buildMeetingPrepSnapshot,
  canonicalizeSourceIds,
  COMPETITOR_ADVANTAGE_MAX,
  COMPETITOR_TAG_LIMIT,
  deriveSourceCounts,
  markSourcesUsedInAnswer,
  RADAR_DETAIL_MAX,
  sanitizeMeetingPrepText,
  TIMELINE_EVENT_TEXT_MAX,
} from '../meeting-prep-display'
import {
  MEETING_PREP_RADAR_CATEGORIES,
  MeetingPrepSynthesisSchema as SynthesisSchema,
} from '../contracts'

const TIMELINE_EVENT_LIMIT = 6
const COMPETITOR_MATRIX_LIMIT = 5

const MONTH_INDEX: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

function clampInt(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)))
}

function getTimelineSortValue(label: string): number {
  const direct = Date.parse(label)
  if (!Number.isNaN(direct)) return direct

  const quarterMatch = label.match(/\bQ([1-4])\s+([12]\d{3})\b/i)
  if (quarterMatch) {
    const quarter = Number(quarterMatch[1])
    const year = Number(quarterMatch[2])
    return new Date(year, (quarter - 1) * 3, 1).getTime()
  }

  const monthYearMatch = label.match(/\b([A-Za-z]+)\s+([12]\d{3})\b/)
  if (monthYearMatch) {
    const month = MONTH_INDEX[monthYearMatch[1].toLowerCase()]
    const year = Number(monthYearMatch[2])
    if (month !== undefined) return new Date(year, month, 1).getTime()
  }

  const yearMatch = label.match(/\b([12]\d{3})\b/)
  if (yearMatch) return new Date(Number(yearMatch[1]), 0, 1).getTime()

  return Number.MAX_SAFE_INTEGER
}

function normalizeTimelineEvents(
  events: TimelineEvent[] | undefined,
  sourceIdMap: Map<string, string>,
): TimelineEvent[] | undefined {
  if (!events?.length) return undefined

  const normalized = events
    .map((event) => ({
      ...event,
      date: event.date.trim(),
      text: sanitizeMeetingPrepText(event.text, TIMELINE_EVENT_TEXT_MAX) ?? '',
      sourceIds: canonicalizeSourceIds(event.sourceIds, sourceIdMap),
    }))
    .filter((event) => event.date && event.text && event.sourceIds.length)
    .sort((a, b) => getTimelineSortValue(a.date) - getTimelineSortValue(b.date))

  if (!normalized.length) return undefined
  return normalized.slice(-TIMELINE_EVENT_LIMIT)
}

function normalizeRadarMetrics(
  metrics: RadarMetric[] | undefined,
  sourceIdMap: Map<string, string>,
): RadarMetric[] | undefined {
  if (!metrics?.length) return undefined

  const byCategory = new Map<RadarMetric['category'], RadarMetric>()

  for (const metric of metrics) {
    const sourceIds = canonicalizeSourceIds(metric.sourceIds, sourceIdMap)
    if (!sourceIds.length) continue
    if (byCategory.has(metric.category)) continue

    const details = sanitizeMeetingPrepText(metric.details, RADAR_DETAIL_MAX)
    if (!details) continue

    byCategory.set(metric.category, {
      ...metric,
      severity: clampInt(metric.severity, 0, 5),
      details,
      sourceIds,
    })
  }

  if (byCategory.size !== MEETING_PREP_RADAR_CATEGORIES.length) return undefined

  return MEETING_PREP_RADAR_CATEGORIES.map((category) => byCategory.get(category)!)
}

function normalizeCompetitorMatrix(
  rows: CompetitorMatrixRow[] | undefined,
  sourceIdMap: Map<string, string>,
): CompetitorMatrixRow[] | undefined {
  if (!rows?.length) return undefined

  const seen = new Set<string>()
  const normalized = rows
    .map((row) => ({
      ...row,
      name: row.name.trim(),
      threatLevel: clampInt(row.threatLevel, 0, 4),
      marketOverlap: clampInt(row.marketOverlap, 0, 4),
      advantage: sanitizeMeetingPrepText(row.advantage, COMPETITOR_ADVANTAGE_MAX) ?? '',
      tags: row.tags.map((tag) => tag.trim()).filter(Boolean).slice(0, COMPETITOR_TAG_LIMIT),
      sourceIds: canonicalizeSourceIds(row.sourceIds, sourceIdMap),
    }))
    .filter((row) => {
      if (!row.name || !row.advantage || !row.sourceIds.length) return false
      const key = row.name.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

  if (!normalized.length) return undefined
  return normalized.slice(0, COMPETITOR_MATRIX_LIMIT)
}

function normalizeBulletSections(bullets: BriefBullet[] | undefined, sourceIdMap: Map<string, string>): BriefBullet[] {
  return (bullets ?? [])
    .map((bullet) => {
      const text = sanitizeMeetingPrepText(bullet.text)
      return {
        ...bullet,
        text: text ?? '',
        sourceIds: canonicalizeSourceIds(bullet.sourceIds, sourceIdMap),
      }
    })
    .filter((bullet) => bullet.text && bullet.sourceIds.length)
}

function collectUsedSourceIds(groups: Array<string[] | undefined>): string[] {
  return Array.from(new Set(groups.flatMap((group) => group ?? []).filter(Boolean)))
}

export async function generateMeetingPrepBrief(
  request: MeetingPrepRequest,
  ctx?: PipelineContext
): Promise<MeetingPrepBrief> {
  const totalStart = performance.now()
  resetSourceCounter()

  const degradedReasons: string[] = []
  const safeWebsite = request.website && isValidUrl(request.website) ? request.website : undefined

  /* ── Step 1: resolveEntity ───────────────────────────────── */
  const entityStep = await runStep('meeting_prep', 'resolveEntity', async () => {
    const snapshot = await searchExaSnapshot(request.accountName)
    if (!snapshot) return null
    ctx?.emitter?.send({ type: 'discovery', kind: 'entity', text: `Found ${snapshot.name}` })
    return {
      name: snapshot.name,
      description: snapshot.description,
      website: safeWebsite || null,
      industry: snapshot.industry || null,
      headquarters: snapshot.headquarters || null,
      employeeCount: snapshot.employeeCount || null,
      fundingStage: snapshot.fundingStage || null,
      lastFundingAmount: snapshot.lastFundingAmount || null,
      ceo: snapshot.ceo || null,
      keyPeople: null,
      recentMilestone: snapshot.recentMilestone || null,
      sourceUrl: snapshot.sourceUrl,
    } as CompanySnapshot
  }, undefined, ctx)

  const snapshot = entityStep.data
  if (!snapshot) degradedReasons.push('Company snapshot unavailable')
  const displaySnapshot = buildMeetingPrepSnapshot(snapshot, safeWebsite)

  /* ── Step 2: planSearches ───────────────────────────────── */
  const fallbackSearches: SearchTask[] = [
    {
      provider: 'exa',
      type: 'news',
      query: `${request.accountName} ${request.goal} recent announcements customer impact`,
      purpose: 'Find recent company moves tied to the meeting goal.',
      lookbackDays: request.lookbackDays ?? 30,
      category: 'news',
    },
    {
      provider: 'tavily',
      type: 'tavily_news',
      query: `${request.accountName} latest news risks objections ${request.meetingType}`,
      purpose: 'Find fresh news, risks, and conversation hooks.',
      topic: 'news',
      timeRange: 'month',
      includeImages: true,
    },
    {
      provider: 'exa',
      type: 'news',
      query: `${request.accountName} leadership product strategy customer expansion`,
      purpose: 'Find strategic shifts, leadership changes, and customer-facing updates.',
      lookbackDays: request.lookbackDays ?? 60,
      category: 'news',
    },
  ]

  if (request.whatYoureSelling) {
    fallbackSearches.push({
      provider: 'tavily',
      type: 'tavily_news',
      query: `${request.accountName} ${request.whatYoureSelling} buying trigger pain point`,
      purpose: 'Find evidence connected to what the user is selling.',
      topic: 'general',
      timeRange: 'month',
      includeImages: true,
    })
  }

  for (const attendee of request.attendees ?? []) {
    fallbackSearches.push({
      provider: 'exa',
      type: 'person',
      query: `${attendee} ${request.accountName} role background`,
      purpose: 'Understand attendee background and likely concerns.',
      category: 'people',
      lookbackDays: 365,
    })
  }

  for (const competitor of request.competitors ?? []) {
    fallbackSearches.push({
      provider: 'exa',
      type: 'competitor',
      query: `${competitor} vs ${request.accountName} ${request.goal}`,
      purpose: 'Find competitive leverage or landmines for the meeting.',
      lookbackDays: 90,
    })
  }

  const planStep = await runStep('meeting_prep', 'planSearches', async () => {
    const v2Bridge = await buildV2PlanBridge({
      researchType: 'meeting_prep',
      request,
      ctx,
    })

    if (v2Bridge) {
      return {
        researchPlan: v2Bridge.researchPlan,
        v2Bridge,
      }
    }

    return {
      researchPlan: await buildResearchSearchPlan('meeting_prep', request, fallbackSearches, ctx),
      v2Bridge: null,
    }
  }, undefined, ctx)

  const researchPlan = planStep.data?.researchPlan ?? null
  const v2Bridge = planStep.data?.v2Bridge ?? null

  /* ── Step 3: gatherEvidence ──────────────────────────────── */
  const evidenceStep = await runStep('meeting_prep', 'gatherEvidence', async () => {
    const allSources: BriefSource[] = []
    const allEvidence: NormalizedEvidence[] = []
    let v2Evidence: Awaited<ReturnType<typeof collectV2EvidenceBridge>> | null = null
    const providerMs = {
      exaMs: 0,
      tavilyMs: 0,
    }

    // Snapshot source
    if (snapshot?.sourceUrl) {
      const { source, evidence } = normalizeExaSnapshot({
        name: snapshot.name,
        description: snapshot.description,
        sourceUrl: snapshot.sourceUrl,
        industry: snapshot.industry ?? undefined,
        headquarters: snapshot.headquarters ?? undefined,
        employeeCount: snapshot.employeeCount ?? undefined,
        fundingStage: snapshot.fundingStage ?? undefined,
        lastFundingAmount: snapshot.lastFundingAmount ?? undefined,
        ceo: snapshot.ceo ?? undefined,
        recentMilestone: snapshot.recentMilestone ?? undefined,
        raw: null,
      })
      if (source) allSources.push({ ...source, sourceRole: 'primary' })
      if (evidence) allEvidence.push({ ...evidence, sourceRole: 'primary' })
    }

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

    // Website and attendee enrichment.
    const siteStart = performance.now()
    const sitePromise = safeWebsite ? extractTavilySite(safeWebsite) : Promise.resolve(null)
    const attendeeStart = performance.now()
    const attendeePromises = (request.attendees || []).slice(0, 5).map((name) => searchExaPerson(name, request.accountName))

    const [siteResult, attendeeResults] = await Promise.all([
      sitePromise.then((value) => ({ status: 'fulfilled' as const, value })).catch((reason) => ({ status: 'rejected' as const, reason })),
      Promise.allSettled(attendeePromises),
    ])

    if (safeWebsite) providerMs.tavilyMs += Math.round(performance.now() - siteStart)
    if (attendeePromises.length) providerMs.exaMs += Math.round(performance.now() - attendeeStart)

    if (siteResult.status === 'fulfilled' && siteResult.value) {
      const extracted = siteResult.value
      if (extracted.rawContent) {
        const id = 's_site'
        allSources.push({
          id,
          url: extracted.url,
          title: `${request.accountName} website`,
          domain: new URL(extracted.url).hostname.replace(/^www\./, ''),
          publishedAt: null,
          provider: 'tavily',
          snippet: extracted.rawContent.slice(0, 300),
          sourceRole: 'primary',
        })
        allEvidence.push({
          id,
          text: extracted.rawContent.slice(0, 3000),
          url: extracted.url,
          title: `${request.accountName} website content`,
          domain: new URL(extracted.url).hostname.replace(/^www\./, ''),
          publishedAt: null,
          provider: 'tavily',
          sourceRole: 'primary',
        })
      }
    }

    // Attendee profiles
    const attendeeProfiles: AttendeeProfile[] = []
    const attendeeNames = (request.attendees || []).slice(0, 5)

    for (let i = 0; i < attendeeNames.length; i++) {
      const result = attendeeResults[i]
      if (result?.status === 'fulfilled' && result.value.length > 0) {
        const top = result.value[0]
        const { sources, evidence } = normalizeExaResults(result.value)
        allSources.push(...sources.map((source) => ({ ...source, sourceRole: 'people' })))
        allEvidence.push(...evidence.map((item) => ({ ...item, sourceRole: 'people' })))
        attendeeProfiles.push({
          name: attendeeNames[i],
          title: null,
          company: request.accountName,
          background: top.summary || top.highlights.join(' ') || null,
          linkedinUrl: result.value.find((r) => r.url.includes('linkedin.com'))?.url || null,
          sourceUrl: top.url || null,
        })
      } else {
        attendeeProfiles.push({
          name: attendeeNames[i], title: null, company: null,
          background: null, linkedinUrl: null, sourceUrl: null,
        })
      }
    }

    return { sources: allSources, evidence: allEvidence, attendeeProfiles, v2Evidence, providerMs }
  }, undefined, ctx)

  const allSources = evidenceStep.data?.sources ?? []
  const allEvidence = evidenceStep.data?.evidence ?? []
  const attendeeProfiles = evidenceStep.data?.attendeeProfiles ?? []
  const v2Evidence = evidenceStep.data?.v2Evidence ?? null
  const providerMs = evidenceStep.data?.providerMs ?? { exaMs: 0, tavilyMs: 0 }

  /* ── Step 3: rankEvidence ────────────────────────────────── */
  const queryTerms = extractQueryTerms(`${request.accountName} ${request.goal}`)
  const rankStep = await runStep('meeting_prep', 'rankEvidence', async () => {
    return rankEvidence(allEvidence, { topN: 24, queryTerms })
  }, undefined, ctx)

  const rankedEvidence = rankStep.data ?? allEvidence

  if (v2Bridge && v2Evidence) {
    persistV2EvidencePack({
      bridge: v2Bridge,
      retrieval: v2Evidence.retrieval,
      priorMemory: v2Evidence.priorMemory,
      evidence: allEvidence,
      queryTerms,
      ctx,
    })
  }

  /* ── Step 4: synthesize ──────────────────────────────────── */
  const synthesisStep = await runStep('meeting_prep', 'synthesize', async () => {
    const userPrompt = buildMeetingPrepPrompt({
      accountName: request.accountName,
      meetingType: request.meetingType,
      goal: request.goal,
      notes: request.notes,
      attendees: request.attendees,
      competitors: request.competitors,
      relationshipStage: request.relationshipStage,
      whatYoureSelling: request.whatYoureSelling,
      desiredNextStep: request.desiredNextStep,
      painPoints: request.painPoints,
      steering: request.steering,
      userContext: request.userContext,
      snapshot: displaySnapshot,
      evidence: rankedEvidence,
      attendeeProfiles,
    })
    return synthesizeWithSchema(
      MEETING_PREP_SYSTEM_PROMPT, userPrompt,
      SynthesisSchema, MEETING_PREP_SCHEMA_DESC, 'meeting_prep',
      ctx?.preferredModel
    )
  }, undefined, ctx)

  const synthesis = synthesisStep.data
  if (!synthesis?.data) degradedReasons.push('AI synthesis failed')

  /* ── Step 5: assembleBrief ───────────────────────────────── */
  const dedupedSources = deduplicateSources(allSources)
  if (dedupedSources.length < 4) degradedReasons.push('Low source count')
  const totalMs = Math.round(performance.now() - totalStart)

  const internalMs = v2Evidence?.retrieval.timings.internalMs ?? 0
  const exaMs = entityStep.timings.durationMs + providerMs.exaMs
  const tavilyMs = providerMs.tavilyMs

  const assembleStep = await runStep('meeting_prep', 'assembleBrief', async () => {
    const canonicalSourceIdMap = buildCanonicalSourceIdMap(allSources)
    const normalizedTimelineEvents = normalizeTimelineEvents(synthesis?.data?.timelineEvents, canonicalSourceIdMap)
    const normalizedRadarMetrics = normalizeRadarMetrics(synthesis?.data?.radarMetrics, canonicalSourceIdMap)
    const normalizedCompetitorMatrix = request.competitors?.length
      ? normalizeCompetitorMatrix(synthesis?.data?.competitorMatrix, canonicalSourceIdMap)
      : undefined
    const normalizedSections = {
      whatJustHappened: normalizeBulletSections(synthesis?.data?.whatJustHappened, canonicalSourceIdMap),
      talkingPoints: normalizeBulletSections(synthesis?.data?.talkingPoints, canonicalSourceIdMap),
      landmines: normalizeBulletSections(synthesis?.data?.landmines, canonicalSourceIdMap),
      questionsToAsk: normalizeBulletSections(synthesis?.data?.questionsToAsk, canonicalSourceIdMap),
      competitorContext: normalizeBulletSections(synthesis?.data?.competitorContext, canonicalSourceIdMap),
    }
    const dedupedSources = markSourcesUsedInAnswer(
      deduplicateSources(allSources),
      collectUsedSourceIds([
        normalizedTimelineEvents?.flatMap((event) => event.sourceIds),
        normalizedRadarMetrics?.flatMap((metric) => metric.sourceIds),
        normalizedCompetitorMatrix?.flatMap((row) => row.sourceIds),
        normalizedSections.whatJustHappened.flatMap((bullet) => bullet.sourceIds),
        normalizedSections.talkingPoints.flatMap((bullet) => bullet.sourceIds),
        normalizedSections.landmines.flatMap((bullet) => bullet.sourceIds),
        normalizedSections.questionsToAsk.flatMap((bullet) => bullet.sourceIds),
        normalizedSections.competitorContext.flatMap((bullet) => bullet.sourceIds),
      ]),
    )
    const sourceCounts = deriveSourceCounts({
      sources: dedupedSources,
      rankedSourceIds: canonicalizeSourceIds(rankedEvidence.map((item) => item.id), canonicalSourceIdMap),
      usedSourceIds: dedupedSources.filter((source) => source.usedInAnswer).map((source) => source.id),
    })

    return {
      id: generateBriefId(),
      researchType: 'meeting_prep',
      generatedAt: new Date().toISOString(),
      headline: synthesis?.data?.headline ?? 'Unable to generate full analysis',
      bottomLine: synthesis?.data?.bottomLine ?? 'The AI synthesis step failed. The raw evidence is still available below.',
      whyItMatters: synthesis?.data?.whyItMatters ?? null,
      confidence: synthesis?.data?.confidence ?? 'low',
      snapshot: displaySnapshot,
      attendeeProfiles,
      momentumScore: typeof synthesis?.data?.momentumScore === 'number'
        ? clampInt(synthesis.data.momentumScore, 0, 100)
        : undefined,
      riskLevel: synthesis?.data?.riskLevel,
      sentiment: synthesis?.data?.sentiment,
      timelineEvents: normalizedTimelineEvents,
      radarMetrics: normalizedRadarMetrics,
      competitorMatrix: normalizedCompetitorMatrix,
      sections: normalizedSections,
      sources: dedupedSources,
      researchPlan,
      contextUsed: request.userContext ?? null,
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
        sourceCounts,
        cached: false,
        synthesisModel: synthesis?.model ?? null,
      },
    } satisfies MeetingPrepBrief
  }, { summary: 'Dashboard assembled' }, ctx)

  return assembleStep.data ?? {
    id: generateBriefId(),
    researchType: 'meeting_prep',
    generatedAt: new Date().toISOString(),
    headline: 'Unable to generate full analysis',
    bottomLine: 'The final assembly step failed. The raw evidence is still available below.',
    whyItMatters: null,
    confidence: 'low',
    snapshot: displaySnapshot,
    attendeeProfiles,
    sections: {
      whatJustHappened: [],
      talkingPoints: [],
      landmines: [],
      questionsToAsk: [],
      competitorContext: [],
    },
    sources: dedupedSources,
    researchPlan,
    contextUsed: request.userContext ?? null,
    status: {
      degraded: true,
      reasons: [...degradedReasons, 'Final brief assembly failed'],
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
      sourceCounts: {
        found: dedupedSources.length,
        ranked: 0,
        used: 0,
      },
      cached: false,
      synthesisModel: synthesis?.model ?? null,
    },
  }
}
