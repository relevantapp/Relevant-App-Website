/* ── Meeting Prep Orchestrator — staged pipeline ─────────── */

import type {
  MeetingPrepRequest,
  MeetingPrepBrief,
  CompanySnapshot,
  AttendeeProfile,
  BriefSource,
  NormalizedEvidence,
  MeetingPrepSynthesisSchema,
} from '../contracts'
import { runStep, generateBriefId, type PipelineContext } from '../pipeline'
import { synthesizeWithSchema } from '../models'
import { rankEvidence, extractQueryTerms } from '../ranker'
import { MEETING_PREP_SYSTEM_PROMPT, MEETING_PREP_SCHEMA_DESC, buildMeetingPrepPrompt } from '../prompts/meeting-prep.v1'
import { searchExaSnapshot, searchExaNews, searchExaPerson, searchExaCompetitor } from '../providers/exa'
import { searchTavilyNews, extractTavilySite } from '../providers/tavily'
import {
  normalizeExaSnapshot,
  normalizeExaResults,
  normalizeTavilyResults,
  deduplicateSources,
  resetSourceCounter,
} from '../normalize'
import { MeetingPrepSynthesisSchema as SynthesisSchema } from '../contracts'

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
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

  /* ── Step 2: gatherEvidence ──────────────────────────────── */
  const evidenceStep = await runStep('meeting_prep', 'gatherEvidence', async () => {
    const allSources: BriefSource[] = []
    const allEvidence: NormalizedEvidence[] = []

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
      if (source) allSources.push(source)
      if (evidence) allEvidence.push(evidence)
    }

    // Parallel searches
    const [exaNewsResult, tavilyNewsResult, siteResult, ...attendeeResults] = await Promise.allSettled([
      searchExaNews(request.accountName, request.lookbackDays || 30),
      searchTavilyNews(request.accountName),
      safeWebsite ? extractTavilySite(safeWebsite) : Promise.resolve(null),
      ...(request.attendees || []).slice(0, 5).map((name) =>
        searchExaPerson(name, request.accountName)
      ),
    ])

    if (exaNewsResult.status === 'fulfilled') {
      const { sources, evidence } = normalizeExaResults(exaNewsResult.value)
      allSources.push(...sources)
      allEvidence.push(...evidence)
    } else {
      degradedReasons.push('Exa news search failed')
    }

    if (tavilyNewsResult.status === 'fulfilled') {
      const { sources, evidence } = normalizeTavilyResults(tavilyNewsResult.value.results)
      allSources.push(...sources)
      allEvidence.push(...evidence)
    } else {
      degradedReasons.push('Tavily news search failed')
    }

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
          provider: 'internal',
          snippet: extracted.rawContent.slice(0, 300),
        })
        allEvidence.push({
          id,
          text: extracted.rawContent.slice(0, 3000),
          url: extracted.url,
          title: `${request.accountName} website content`,
          domain: new URL(extracted.url).hostname.replace(/^www\./, ''),
          publishedAt: null,
          provider: 'tavily',
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
        allSources.push(...sources)
        allEvidence.push(...evidence)
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

    // Competitor searches
    if (request.competitors?.length) {
      const compResults = await Promise.allSettled(
        request.competitors.slice(0, 3).map((c) => searchExaCompetitor(c, request.accountName))
      )
      for (const cr of compResults) {
        if (cr.status === 'fulfilled') {
          const { sources, evidence } = normalizeExaResults(cr.value)
          allSources.push(...sources)
          allEvidence.push(...evidence)
        }
      }
    }

    return { sources: allSources, evidence: allEvidence, attendeeProfiles }
  }, undefined, ctx)

  const allSources = evidenceStep.data?.sources ?? []
  const allEvidence = evidenceStep.data?.evidence ?? []
  const attendeeProfiles = evidenceStep.data?.attendeeProfiles ?? []

  /* ── Step 3: rankEvidence ────────────────────────────────── */
  const rankStep = await runStep('meeting_prep', 'rankEvidence', async () => {
    const queryTerms = extractQueryTerms(`${request.accountName} ${request.goal}`)
    return rankEvidence(allEvidence, { topN: 8, queryTerms })
  }, undefined, ctx)

  const rankedEvidence = rankStep.data ?? allEvidence

  /* ── Step 4: synthesize ──────────────────────────────────── */
  const synthesisStep = await runStep('meeting_prep', 'synthesize', async () => {
    const userPrompt = buildMeetingPrepPrompt({
      accountName: request.accountName,
      meetingType: request.meetingType,
      goal: request.goal,
      notes: request.notes,
      attendees: request.attendees,
      competitors: request.competitors,
      snapshot,
      evidence: rankedEvidence,
      attendeeProfiles,
    })
    return synthesizeWithSchema(
      MEETING_PREP_SYSTEM_PROMPT, userPrompt,
      SynthesisSchema, MEETING_PREP_SCHEMA_DESC, 'meeting_prep'
    )
  }, undefined, ctx)

  const synthesis = synthesisStep.data
  if (!synthesis?.data) degradedReasons.push('AI synthesis failed')

  /* ── Step 5: assembleBrief ───────────────────────────────── */
  const dedupedSources = deduplicateSources(allSources)
  const totalMs = Math.round(performance.now() - totalStart)

  const brief: MeetingPrepBrief = {
    id: generateBriefId(),
    researchType: 'meeting_prep',
    generatedAt: new Date().toISOString(),
    headline: synthesis?.data?.headline ?? 'Unable to generate full analysis',
    bottomLine: synthesis?.data?.bottomLine ?? 'The AI synthesis step failed. The raw evidence is still available below.',
    confidence: synthesis?.data?.confidence ?? 'low',
    snapshot,
    attendeeProfiles,
    sections: {
      whatJustHappened: synthesis?.data?.whatJustHappened ?? [],
      talkingPoints: synthesis?.data?.talkingPoints ?? [],
      landmines: synthesis?.data?.landmines ?? [],
      questionsToAsk: synthesis?.data?.questionsToAsk ?? [],
      competitorContext: synthesis?.data?.competitorContext ?? [],
    },
    sources: dedupedSources,
    status: {
      degraded: degradedReasons.length > 0,
      reasons: degradedReasons,
      exaSearchMs: entityStep.timings.durationMs + (evidenceStep.timings.durationMs || 0),
      tavilySearchMs: 0,
      synthesisMs: synthesisStep.timings.durationMs,
      totalMs,
      sourceCount: dedupedSources.length,
      cached: false,
      synthesisModel: synthesis?.model ?? null,
    },
  }

  return brief
}
