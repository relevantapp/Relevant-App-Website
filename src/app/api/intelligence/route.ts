/* ── Intelligence API Route — SSE Streaming ────────────────── */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  generateMeetingPrepBrief,
  generateCompetitiveAnalysisBrief,
  generateBusinessCaseBrief,
  generateMarketResearchBrief,
} from '@/lib/intelligence'
import type { MeetingType } from '@/lib/intelligence/contracts'
import type { UserResearchContext } from '@/lib/intelligence/contracts'
import { createSSEEmitter } from '@/lib/intelligence/sse-emitter'
import type { PipelineContext } from '@/lib/intelligence/pipeline'
import { normalizeModelPreference, type ModelPreference } from '@/lib/intelligence/models'
import { saveBrief } from '@/lib/intelligence/db'
import type { IntelligenceBrief, ResearchType } from '@/lib/intelligence/contracts'
import { createRun, patchRunAsync } from '@/lib/intelligence/runs/store'
import { intelligenceFlags } from '@/lib/intelligence/feature-flags'
import { repairUnsupportedCitations } from '@/lib/intelligence/verifier/repair'

// Competitive retries can legitimately take longer than the original 60s budget.
// Give streaming runs enough headroom so Vercel does not cut the SSE connection
// mid-flight and strand the client in a perpetual loading state.
export const maxDuration = 180

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/^=+/, '').trim()
const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').replace(/^=+/, '').trim()

const VALID_MEETING_TYPES = new Set<MeetingType>([
  'client', 'sales', 'partner', 'investor', 'board', 'hiring', 'general',
])

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 10
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function sanitizeString(val: unknown, maxLen: number): string {
  if (typeof val !== 'string') return ''
  return val.trim().slice(0, maxLen)
}

function sanitizeStringArray(val: unknown, maxLen: number, maxItems: number): string[] {
  if (!Array.isArray(val)) return []
  return val
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .slice(0, maxItems)
    .map((s) => s.trim().slice(0, maxLen))
}

function isValidHttpUrl(str: string): boolean {
  try {
    const url = new URL(str)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function nullableString(value: unknown, maxLen: number): string | null {
  const sanitized = sanitizeString(value, maxLen)
  return sanitized || null
}

function coerceResearchType(value: string): ResearchType {
  if (
    value === 'meeting_prep' ||
    value === 'competitive_analysis' ||
    value === 'business_case' ||
    value === 'market_research'
  ) {
    return value
  }
  return 'meeting_prep'
}

async function loadUserResearchContext(
  supabase: any,
  user: { id: string; user_metadata?: Record<string, unknown> | null },
): Promise<UserResearchContext | null> {
  const { data } = await supabase
    .from('users')
    .select('profile_kind, industry_raw, role_raw, company_id, company_name_manual')
    .eq('id', user.id)
    .maybeSingle()

  const row = (data ?? {}) as Record<string, unknown>
  const metadata = user.user_metadata ?? {}
  const companyId = nullableString(row.company_id ?? metadata.company_id, 120)
  let company = nullableString(row.company_name_manual ?? metadata.company_name_manual, 200)

  if (companyId) {
    const { data: companyData } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .maybeSingle()
    company = nullableString((companyData as Record<string, unknown> | null)?.name, 200) ?? company
  }

  const context: UserResearchContext = {
    profileKind: nullableString(row.profile_kind ?? metadata.profile_kind, 80),
    industry: nullableString(row.industry_raw ?? metadata.industry_raw, 160),
    role: nullableString(row.role_raw ?? metadata.role_raw, 160),
    company,
    country: nullableString(metadata.location_country, 80),
    contextNote: nullableString(metadata.profile_context_note, 1000),
  }

  return Object.values(context).some(Boolean) ? context : null
}

async function persistGeneratedBrief(
  supabase: any,
  userId: string,
  researchType: string,
  requestPayload: Record<string, unknown>,
  brief: IntelligenceBrief,
  runId?: string,
): Promise<IntelligenceBrief> {
  const verifier = intelligenceFlags.verifier() ? repairUnsupportedCitations(brief) : null
  const briefToSave = verifier
    ? {
      ...verifier.brief,
      status: {
        ...verifier.brief.status,
        degraded: verifier.brief.status.degraded || !verifier.verifierResult.ok,
        reasons: verifier.verifierResult.ok
          ? verifier.brief.status.reasons
          : Array.from(new Set([...verifier.brief.status.reasons, 'Citation verification found unsupported citations'])),
        verifierMs: verifier.brief.status.verifierMs,
      },
    } as IntelligenceBrief
    : brief

  const result = await saveBrief(supabase, userId, researchType, requestPayload, briefToSave)
  if (!result.error && result.id) {
    if (runId) {
      patchRunAsync({
        supabase,
        runId,
        fields: {
          brief_id: result.id,
          status: briefToSave.status.degraded ? 'degraded' : 'ok',
          degraded_reasons: briefToSave.status.reasons,
          model: briefToSave.status.synthesisModel,
          timings: briefToSave.status,
          verifier_result: verifier?.verifierResult ?? null,
          claim_map: verifier?.verifierResult.claimMap ?? null,
        },
      })
    }
    return { ...briefToSave, id: result.id } as IntelligenceBrief
  }

  console.error('[api/intelligence] Server-side brief save failed:', result.error)
  if (runId) {
    patchRunAsync({
      supabase,
      runId,
      fields: {
        status: 'degraded',
        degraded_reasons: ['Brief save failed'],
      },
    })
  }
  return {
    ...brief,
    status: {
      ...briefToSave.status,
      degraded: true,
      reasons: Array.from(new Set([...briefToSave.status.reasons, 'Brief save failed'])),
    },
  } as IntelligenceBrief
}

export async function POST(request: NextRequest) {
  // ── Auth ──
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userToken = authHeader.replace('Bearer ', '')
  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${userToken}` } },
  })
  const { data: { user }, error: authError } = await supabase.auth.getUser(userToken)
  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
  }

  // ── Rate limit ──
  const now = Date.now()
  const bucket = rateLimitMap.get(user.id)
  if (bucket && now < bucket.resetAt) {
    if (bucket.count >= RATE_LIMIT_MAX) {
      const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000)
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute.' },
        { status: 429, headers: { 'Retry-After': String(retryAfterSec) } }
      )
    }
    bucket.count++
  } else {
    rateLimitMap.set(user.id, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
  }

  // ── Parse + validate body ──
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const researchType = sanitizeString(body.researchType, 30) || 'meeting_prep'
  const effectiveResearchType = coerceResearchType(researchType)
  const rawModel = sanitizeString(body.preferredModel, 160)
  const preferredModel = normalizeModelPreference(rawModel)
  const userContext = await loadUserResearchContext(supabase, user)
  const runId = await createRun({
    supabase,
    userId: user.id,
    researchType: effectiveResearchType,
    depth: 'standard',
  })

  // ── Check if client wants SSE streaming ──
  const wantsStream = request.headers.get('accept')?.includes('text/event-stream')

  if (wantsStream) {
    return handleStreaming(body, effectiveResearchType, preferredModel, userContext, supabase, user.id, runId)
  }

  // ── Branch by research type (JSON fallback) ──
  try {
    if (effectiveResearchType === 'competitive_analysis') {
      return await handleCompetitiveAnalysis(body, userContext, preferredModel, supabase, user.id, runId)
    }
    if (effectiveResearchType === 'business_case') {
      return await handleBusinessCase(body, userContext, preferredModel, supabase, user.id, runId)
    }
    if (effectiveResearchType === 'market_research') {
      return await handleMarketResearch(body, userContext, preferredModel, supabase, user.id, runId)
    }
    return await handleMeetingPrep(body, userContext, preferredModel, supabase, user.id, runId)
  } catch (err) {
    patchRunAsync({
      supabase,
      runId,
      fields: {
        status: 'failed',
        degraded_reasons: [err instanceof Error ? err.message : String(err)],
      },
    })
    console.error(`[api/intelligence] ${effectiveResearchType} generation failed:`, err)
    return NextResponse.json(
      { error: 'Failed to generate intelligence brief. Please try again.' },
      { status: 500 }
    )
  }
}

/* ── Meeting Prep ────────────────────────────────────────────── */

async function handleMeetingPrep(
  body: Record<string, unknown>,
  userContext: UserResearchContext | null,
  preferredModel: ModelPreference,
  supabase: any,
  userId: string,
  runId: string,
) {
  const accountName = sanitizeString(body.accountName, 200)
  if (!accountName) {
    return NextResponse.json({ error: 'accountName is required' }, { status: 400 })
  }

  const meetingType = sanitizeString(body.meetingType, 20) as MeetingType
  if (!VALID_MEETING_TYPES.has(meetingType)) {
    return NextResponse.json({ error: 'Invalid meetingType' }, { status: 400 })
  }

  const goal = sanitizeString(body.goal, 500)
  if (!goal) {
    return NextResponse.json({ error: 'goal is required' }, { status: 400 })
  }

  const website = sanitizeString(body.website, 500)
  const attendees = sanitizeStringArray(body.attendees, 100, 5)
  const notes = sanitizeString(body.notes, 2000)
  const competitors = sanitizeStringArray(body.competitors, 100, 3)
  const relationshipStage = sanitizeString(body.relationshipStage, 80) || undefined
  const whatYoureSelling = sanitizeString(body.whatYoureSelling, 300) || undefined
  const desiredNextStep = sanitizeString(body.desiredNextStep, 300) || undefined
  const painPoints = sanitizeStringArray(body.painPoints, 200, 5)
  const steering = sanitizeString(body.steering, 1500) || undefined
  const lookbackDays = typeof body.lookbackDays === 'number'
    ? Math.min(Math.max(body.lookbackDays, 7), 90)
    : 30

  if (website && !isValidHttpUrl(website)) {
    return NextResponse.json({ error: 'Invalid website URL' }, { status: 400 })
  }

  const requestPayload = {
    accountName,
    meetingType,
    goal,
    ...(website && { website }),
    ...(attendees.length && { attendees }),
    ...(notes && { notes: notes }),
    ...(competitors.length && { competitors }),
    relationshipStage,
    whatYoureSelling,
    desiredNextStep,
    ...(painPoints.length && { painPoints }),
    steering,
    userContext,
    lookbackDays,
  }

  const brief = await generateMeetingPrepBrief(requestPayload, { preferredModel, supabase, userId, runId })
  const savedBrief = await persistGeneratedBrief(supabase, userId, 'meeting_prep', requestPayload, brief, runId)
  return NextResponse.json(savedBrief)
}

/* ── Competitive Analysis ────────────────────────────────────── */

async function handleCompetitiveAnalysis(
  body: Record<string, unknown>,
  userContext: UserResearchContext | null,
  preferredModel: ModelPreference,
  supabase: any,
  userId: string,
  runId: string,
) {
  const competitors = sanitizeStringArray(body.competitors, 200, 3)
  if (competitors.length === 0) {
    return NextResponse.json({ error: 'At least one competitor is required' }, { status: 400 })
  }

  const yourCompany = sanitizeString(body.yourCompany, 200) || undefined
  const focusArea = sanitizeString(body.focusArea, 50) || 'overall'
  const specificQuestions = sanitizeString(body.specificQuestions, 1000) || undefined
  const marketSegment = sanitizeString(body.marketSegment, 200) || undefined
  const geography = sanitizeString(body.geography, 100) || undefined
  const customerType = sanitizeString(body.customerType, 200) || undefined
  const useCasePreset = sanitizeString(body.useCasePreset, 100) || undefined
  const steering = sanitizeString(body.steering, 1500) || undefined

  const requestPayload = {
    competitors,
    yourCompany,
    focusArea,
    specificQuestions,
    marketSegment,
    geography,
    customerType,
    useCasePreset,
    steering,
    userContext,
  }

  const brief = await generateCompetitiveAnalysisBrief(requestPayload, { preferredModel, supabase, userId, runId })
  const savedBrief = await persistGeneratedBrief(supabase, userId, 'competitive_analysis', requestPayload, brief, runId)
  return NextResponse.json(savedBrief)
}

/* ── Business Case ───────────────────────────────────────────── */

async function handleBusinessCase(
  body: Record<string, unknown>,
  userContext: UserResearchContext | null,
  preferredModel: ModelPreference,
  supabase: any,
  userId: string,
  runId: string,
) {
  const initiativeName = sanitizeString(body.initiativeName, 200)
  if (!initiativeName) {
    return NextResponse.json({ error: 'initiativeName is required' }, { status: 400 })
  }

  const hypothesis = sanitizeString(body.hypothesis, 500)
  if (!hypothesis) {
    return NextResponse.json({ error: 'hypothesis is required' }, { status: 400 })
  }

  const targetMarket = sanitizeString(body.targetMarket, 200) || undefined
  const successMetrics = sanitizeStringArray(body.successMetrics, 200, 5)
  const keyQuestions = sanitizeString(body.keyQuestions, 1000) || undefined
  const comparableCompanies = sanitizeStringArray(body.comparableCompanies, 200, 3)
  const decisionType = sanitizeString(body.decisionType, 100) || undefined
  const decisionAudience = sanitizeString(body.decisionAudience, 100) || undefined
  const timeHorizon = sanitizeString(body.timeHorizon, 100) || undefined
  const investmentLevel = sanitizeString(body.investmentLevel, 100) || undefined
  const roiFrame = sanitizeStringArray(body.roiFrame, 100, 6)
  const steering = sanitizeString(body.steering, 1500) || undefined

  const requestPayload = {
    initiativeName,
    hypothesis,
    targetMarket,
    successMetrics: successMetrics.length ? successMetrics : undefined,
    keyQuestions,
    comparableCompanies: comparableCompanies.length ? comparableCompanies : undefined,
    decisionType,
    decisionAudience,
    timeHorizon,
    investmentLevel,
    roiFrame: roiFrame.length ? roiFrame : undefined,
    steering,
    userContext,
  }

  const brief = await generateBusinessCaseBrief(requestPayload, { preferredModel, supabase, userId, runId })
  const savedBrief = await persistGeneratedBrief(supabase, userId, 'business_case', requestPayload, brief, runId)
  return NextResponse.json(savedBrief)
}

/* ── Market Research ─────────────────────────────────────────── */

async function handleMarketResearch(
  body: Record<string, unknown>,
  userContext: UserResearchContext | null,
  preferredModel: ModelPreference,
  supabase: any,
  userId: string,
  runId: string,
) {
  const marketOrTrend = sanitizeString(body.marketOrTrend, 300)
  if (!marketOrTrend) {
    return NextResponse.json({ error: 'marketOrTrend is required' }, { status: 400 })
  }

  const scope = sanitizeString(body.scope, 50) || 'global'
  const keyQuestions = sanitizeString(body.keyQuestions, 1000) || undefined
  const knownPlayers = sanitizeStringArray(body.knownPlayers, 200, 5)
  const timeHorizon = sanitizeString(body.timeHorizon, 10) || '90d'
  const objective = sanitizeString(body.objective, 100) || undefined
  const region = sanitizeString(body.region, 120) || undefined
  const customerSegment = sanitizeString(body.customerSegment, 200) || undefined
  const useCase = sanitizeString(body.useCase, 200) || undefined
  const depth = sanitizeString(body.depth, 50) || undefined
  const steering = sanitizeString(body.steering, 1500) || undefined

  const requestPayload = {
    marketOrTrend,
    scope,
    keyQuestions,
    knownPlayers: knownPlayers.length ? knownPlayers : undefined,
    timeHorizon,
    objective,
    region,
    customerSegment,
    useCase,
    depth,
    steering,
    userContext,
  }

  const brief = await generateMarketResearchBrief(requestPayload, { preferredModel, supabase, userId, runId })
  const savedBrief = await persistGeneratedBrief(supabase, userId, 'market_research', requestPayload, brief, runId)
  return NextResponse.json(savedBrief)
}

/* ── SSE Streaming Handler ───────────────────────────────────── */

function handleStreaming(
  body: Record<string, unknown>,
  researchType: string,
  preferredModel: ModelPreference,
  userContext: UserResearchContext | null,
  supabase: any,
  userId: string,
  runId: string,
): Response {
  const emitter = createSSEEmitter()
  const ctx: PipelineContext = { emitter, signal: emitter.signal, preferredModel, supabase, userId, runId }

  // Run generation in background, stream events
  const generateAsync = async () => {
    try {
      let brief: unknown
      let requestPayload: any = {}

      if (researchType === 'competitive_analysis') {
        const competitors = sanitizeStringArray(body.competitors, 200, 3)
        if (competitors.length === 0) {
          emitter.send({ type: 'stream_error', error: 'At least one competitor is required' })
          emitter.close()
          return
        }
        requestPayload = {
          competitors,
          yourCompany: sanitizeString(body.yourCompany, 200) || undefined,
          focusArea: sanitizeString(body.focusArea, 50) || 'overall',
          specificQuestions: sanitizeString(body.specificQuestions, 1000) || undefined,
          marketSegment: sanitizeString(body.marketSegment, 200) || undefined,
          geography: sanitizeString(body.geography, 100) || undefined,
          customerType: sanitizeString(body.customerType, 200) || undefined,
          useCasePreset: sanitizeString(body.useCasePreset, 100) || undefined,
          steering: sanitizeString(body.steering, 1500) || undefined,
          userContext,
        }
        brief = await generateCompetitiveAnalysisBrief(requestPayload, ctx)
      } else if (researchType === 'business_case') {
        const initiativeName = sanitizeString(body.initiativeName, 200)
        const hypothesis = sanitizeString(body.hypothesis, 500)
        if (!initiativeName || !hypothesis) {
          emitter.send({ type: 'stream_error', error: 'initiativeName and hypothesis are required' })
          emitter.close()
          return
        }
        requestPayload = {
          initiativeName,
          hypothesis,
          targetMarket: sanitizeString(body.targetMarket, 200) || undefined,
          successMetrics: sanitizeStringArray(body.successMetrics, 200, 5).length ? sanitizeStringArray(body.successMetrics, 200, 5) : undefined,
          keyQuestions: sanitizeString(body.keyQuestions, 1000) || undefined,
          comparableCompanies: sanitizeStringArray(body.comparableCompanies, 200, 3).length ? sanitizeStringArray(body.comparableCompanies, 200, 3) : undefined,
          decisionType: sanitizeString(body.decisionType, 100) || undefined,
          decisionAudience: sanitizeString(body.decisionAudience, 100) || undefined,
          timeHorizon: sanitizeString(body.timeHorizon, 100) || undefined,
          investmentLevel: sanitizeString(body.investmentLevel, 100) || undefined,
          roiFrame: sanitizeStringArray(body.roiFrame, 100, 6).length ? sanitizeStringArray(body.roiFrame, 100, 6) : undefined,
          steering: sanitizeString(body.steering, 1500) || undefined,
          userContext,
        }
        brief = await generateBusinessCaseBrief(requestPayload, ctx)
      } else if (researchType === 'market_research') {
        const marketOrTrend = sanitizeString(body.marketOrTrend, 300)
        if (!marketOrTrend) {
          emitter.send({ type: 'stream_error', error: 'marketOrTrend is required' })
          emitter.close()
          return
        }
        requestPayload = {
          marketOrTrend,
          scope: sanitizeString(body.scope, 50) || 'global',
          keyQuestions: sanitizeString(body.keyQuestions, 1000) || undefined,
          knownPlayers: sanitizeStringArray(body.knownPlayers, 200, 5).length ? sanitizeStringArray(body.knownPlayers, 200, 5) : undefined,
          timeHorizon: sanitizeString(body.timeHorizon, 10) || '90d',
          objective: sanitizeString(body.objective, 100) || undefined,
          region: sanitizeString(body.region, 120) || undefined,
          customerSegment: sanitizeString(body.customerSegment, 200) || undefined,
          useCase: sanitizeString(body.useCase, 200) || undefined,
          depth: sanitizeString(body.depth, 50) || undefined,
          steering: sanitizeString(body.steering, 1500) || undefined,
          userContext,
        }
        brief = await generateMarketResearchBrief(requestPayload, ctx)
      } else {
        const accountName = sanitizeString(body.accountName, 200)
        const meetingType = sanitizeString(body.meetingType, 20) as MeetingType
        const goal = sanitizeString(body.goal, 500)
        if (!accountName || !goal) {
          emitter.send({ type: 'stream_error', error: 'accountName and goal are required' })
          emitter.close()
          return
        }
        const website = sanitizeString(body.website, 500)
        requestPayload = {
          accountName,
          meetingType: VALID_MEETING_TYPES.has(meetingType) ? meetingType : 'general',
          goal,
          ...(website && isValidHttpUrl(website) && { website }),
          ...(sanitizeStringArray(body.attendees, 100, 5).length && { attendees: sanitizeStringArray(body.attendees, 100, 5) }),
          ...(sanitizeString(body.notes, 2000) && { notes: sanitizeString(body.notes, 2000) }),
          ...(sanitizeStringArray(body.competitors, 100, 3).length && { competitors: sanitizeStringArray(body.competitors, 100, 3) }),
          relationshipStage: sanitizeString(body.relationshipStage, 80) || undefined,
          whatYoureSelling: sanitizeString(body.whatYoureSelling, 300) || undefined,
          desiredNextStep: sanitizeString(body.desiredNextStep, 300) || undefined,
          ...(sanitizeStringArray(body.painPoints, 200, 5).length && { painPoints: sanitizeStringArray(body.painPoints, 200, 5) }),
          steering: sanitizeString(body.steering, 1500) || undefined,
          userContext,
          lookbackDays: typeof body.lookbackDays === 'number' ? Math.min(Math.max(body.lookbackDays, 7), 90) : 30,
        }
        brief = await generateMeetingPrepBrief(requestPayload, ctx)
      }

      const typedBrief = brief as import('@/lib/intelligence/contracts').IntelligenceBrief
      const savedBrief = await persistGeneratedBrief(
        supabase,
        userId,
        typedBrief.researchType,
        requestPayload,
        typedBrief,
        runId,
      )
      emitter.send({ type: 'brief_ready', brief: savedBrief })
    } catch (err) {
      patchRunAsync({
        supabase,
        runId,
        fields: {
          status: 'failed',
          degraded_reasons: [err instanceof Error ? err.message : String(err)],
        },
      })
      console.error(`[api/intelligence] SSE ${researchType} failed:`, err)
      emitter.send({ type: 'stream_error', error: 'Failed to generate brief. Please try again.' })
    } finally {
      emitter.close()
    }
  }

  generateAsync()

  return new Response(emitter.stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
