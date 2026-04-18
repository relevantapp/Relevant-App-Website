/* ── Intelligence Orchestrator — plan → search → normalize → synthesize ── */

import type {
  IntelligenceRequest,
  IntelligenceBrief,
  CompanySnapshot,
  AttendeeProfile,
  BriefSource,
  NormalizedEvidence,
} from './types'
import { buildResearchPlan } from './research-plan'
import {
  searchExaSnapshot,
  searchExaNews,
  searchExaPerson,
  searchExaCompetitor,
} from './providers/exa'
import { searchTavilyNews, extractTavilySite } from './providers/tavily'
import {
  normalizeExaSnapshot,
  normalizeExaResults,
  normalizeTavilyResults,
  deduplicateSources,
  resetSourceCounter,
} from './normalize'
import { synthesizeBrief } from './synthesize'

function generateId(): string {
  return `ib_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

export async function generateIntelligenceBrief(
  request: IntelligenceRequest
): Promise<IntelligenceBrief> {
  const startTime = Date.now()

  try {
  resetSourceCounter()

  const plan = buildResearchPlan(request)
  const degradedReasons: string[] = []

  // Sanitize website URL
  const safeWebsite = request.website && isValidUrl(request.website) ? request.website : undefined

  // ── Run all searches in parallel ──
  const exaStart = Date.now()

  const [
    snapshotResult,
    exaNewsResult,
    tavilyNewsResult,
    siteExtractResult,
    ...attendeeResults
  ] = await Promise.allSettled([
    searchExaSnapshot(request.accountName),
    searchExaNews(request.accountName, request.lookbackDays || 30),
    searchTavilyNews(request.accountName),
    safeWebsite ? extractTavilySite(safeWebsite) : Promise.resolve(null),
    ...(request.attendees || []).slice(0, 5).map((name) =>
      searchExaPerson(name, request.accountName)
    ),
  ])

  const exaSearchMs = Date.now() - exaStart

  // ── Process snapshot ──
  let snapshot: CompanySnapshot | null = null
  const allSources: BriefSource[] = []
  const allEvidence: NormalizedEvidence[] = []

  if (snapshotResult.status === 'fulfilled' && snapshotResult.value) {
    const raw = snapshotResult.value
    const { source, evidence } = normalizeExaSnapshot(raw)
    snapshot = {
      name: raw.name,
      description: raw.description,
      website: safeWebsite || null,
      industry: raw.industry || null,
      headquarters: raw.headquarters || null,
      employeeCount: raw.employeeCount || null,
      fundingStage: raw.fundingStage || null,
      lastFundingAmount: raw.lastFundingAmount || null,
      ceo: raw.ceo || null,
      keyPeople: null,
      recentMilestone: raw.recentMilestone || null,
      sourceUrl: raw.sourceUrl,
    }
    if (source) allSources.push(source)
    if (evidence) allEvidence.push(evidence)
  } else {
    degradedReasons.push('Company snapshot unavailable')
  }

  // ── Process Exa news ──
  if (exaNewsResult.status === 'fulfilled') {
    const { sources, evidence } = normalizeExaResults(exaNewsResult.value)
    allSources.push(...sources)
    allEvidence.push(...evidence)
  } else {
    degradedReasons.push('Exa news search failed')
  }

  // ── Process Tavily news ──
  const tavilyStart = Date.now()
  if (tavilyNewsResult.status === 'fulfilled') {
    const { sources, evidence } = normalizeTavilyResults(tavilyNewsResult.value.results)
    allSources.push(...sources)
    allEvidence.push(...evidence)
  } else {
    degradedReasons.push('Tavily news search failed')
  }
  const tavilySearchMs = Date.now() - tavilyStart

  // ── Process site extraction ──
  if (siteExtractResult.status === 'fulfilled' && siteExtractResult.value) {
    const extracted = siteExtractResult.value
    if (extracted.rawContent) {
      const id = `s_site`
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

  // ── Process attendee searches ──
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
        name: attendeeNames[i],
        title: null,
        company: null,
        background: null,
        linkedinUrl: null,
        sourceUrl: null,
      })
    }
  }

  // ── Run competitor searches (parallel) ──
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

  // ── Deduplicate sources ──
  const dedupedSources = deduplicateSources(allSources)

  // ── Synthesize via LLM ──
  const synthesisStart = Date.now()
  const synthesis = await synthesizeBrief({
    request,
    snapshot,
    evidence: allEvidence,
    attendeeProfiles,
  })
  const synthesisMs = Date.now() - synthesisStart

  const totalMs = Date.now() - startTime

  return {
    id: generateId(),
    mode: 'prep',
    generatedAt: new Date().toISOString(),
    request,
    snapshot,
    attendeeProfiles,
    summary: {
      headline: synthesis.headline,
      bottomLine: synthesis.bottomLine,
      confidence: synthesis.confidence,
    },
    sections: {
      whatJustHappened: synthesis.whatJustHappened,
      talkingPoints: synthesis.talkingPoints,
      landmines: synthesis.landmines,
      questionsToAsk: synthesis.questionsToAsk,
      competitorContext: synthesis.competitorContext,
    },
    sources: dedupedSources,
    status: {
      degraded: degradedReasons.length > 0,
      reasons: degradedReasons,
      exaSearchMs,
      tavilySearchMs,
      synthesisMs,
      totalMs,
      sourceCount: dedupedSources.length,
      cached: false,
      synthesisModel: synthesis.synthesisModel,
    },
  }

  } catch (err) {
    console.error('[intelligence] Orchestrator crash:', err)
    const totalMs = Date.now() - startTime
    return {
      id: generateId(),
      mode: 'prep',
      generatedAt: new Date().toISOString(),
      request,
      snapshot: null,
      attendeeProfiles: [],
      summary: {
        headline: 'Unable to generate full analysis',
        bottomLine: 'Something went wrong during research. Try again — intermittent provider issues usually resolve quickly.',
        confidence: 'low',
      },
      sections: {
        whatJustHappened: [],
        talkingPoints: [],
        landmines: [],
        questionsToAsk: [],
        competitorContext: [],
      },
      sources: [],
      status: {
        degraded: true,
        reasons: [String(err instanceof Error ? err.message : err)],
        exaSearchMs: 0,
        tavilySearchMs: 0,
        synthesisMs: 0,
        totalMs,
        sourceCount: 0,
        cached: false,
        synthesisModel: null,
      },
    }
  }
}
