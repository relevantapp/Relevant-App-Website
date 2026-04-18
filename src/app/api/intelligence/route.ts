/* ── Intelligence API Route — V2 + V3 ──────────────────────── */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateIntelligenceBrief } from '@/lib/intelligence'
import { generateCompetitiveAnalysisBrief } from '@/lib/intelligence/types/competitive-analysis'
import { generateBusinessCaseBrief } from '@/lib/intelligence/types/business-case'
import { generateMarketResearchBrief } from '@/lib/intelligence/types/market-research'
import type { IntelligenceRequest, MeetingType } from '@/lib/intelligence/types'

export const maxDuration = 60

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
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute.' },
        { status: 429 }
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

  // ── Branch by research type ──
  try {
    if (researchType === 'competitive_analysis') {
      return await handleCompetitiveAnalysis(body)
    }
    if (researchType === 'business_case') {
      return await handleBusinessCase(body)
    }
    if (researchType === 'market_research') {
      return await handleMarketResearch(body)
    }
    // Default: meeting_prep (V2 compat)
    return await handleMeetingPrep(body)
  } catch (err) {
    console.error(`[api/intelligence] ${researchType} generation failed:`, err)
    return NextResponse.json(
      { error: 'Failed to generate intelligence brief. Please try again.' },
      { status: 500 }
    )
  }
}

/* ── Meeting Prep (V2 compat) ────────────────────────────────── */

async function handleMeetingPrep(body: Record<string, unknown>) {
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
  const lookbackDays = typeof body.lookbackDays === 'number'
    ? Math.min(Math.max(body.lookbackDays, 7), 90)
    : 30

  if (website && !isValidHttpUrl(website)) {
    return NextResponse.json({ error: 'Invalid website URL' }, { status: 400 })
  }

  const intelligenceRequest: IntelligenceRequest = {
    accountName,
    meetingType,
    goal,
    ...(website && { website }),
    ...(attendees.length && { attendees }),
    ...(notes && { notes }),
    ...(competitors.length && { competitors }),
    lookbackDays,
  }

  const brief = await generateIntelligenceBrief(intelligenceRequest)
  return NextResponse.json(brief)
}

/* ── Competitive Analysis ────────────────────────────────────── */

async function handleCompetitiveAnalysis(body: Record<string, unknown>) {
  const competitors = sanitizeStringArray(body.competitors, 200, 3)
  if (competitors.length === 0) {
    return NextResponse.json({ error: 'At least one competitor is required' }, { status: 400 })
  }

  const yourCompany = sanitizeString(body.yourCompany, 200) || undefined
  const focusArea = sanitizeString(body.focusArea, 50) || 'overall'
  const specificQuestions = sanitizeString(body.specificQuestions, 1000) || undefined

  const brief = await generateCompetitiveAnalysisBrief({
    competitors,
    yourCompany,
    focusArea,
    specificQuestions,
  })
  return NextResponse.json(brief)
}

/* ── Business Case ───────────────────────────────────────────── */

async function handleBusinessCase(body: Record<string, unknown>) {
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

  const brief = await generateBusinessCaseBrief({
    initiativeName,
    hypothesis,
    targetMarket,
    successMetrics: successMetrics.length ? successMetrics : undefined,
    keyQuestions,
    comparableCompanies: comparableCompanies.length ? comparableCompanies : undefined,
  })
  return NextResponse.json(brief)
}

/* ── Market Research ─────────────────────────────────────────── */

async function handleMarketResearch(body: Record<string, unknown>) {
  const marketOrTrend = sanitizeString(body.marketOrTrend, 300)
  if (!marketOrTrend) {
    return NextResponse.json({ error: 'marketOrTrend is required' }, { status: 400 })
  }

  const scope = sanitizeString(body.scope, 50) || 'global'
  const keyQuestions = sanitizeString(body.keyQuestions, 1000) || undefined
  const knownPlayers = sanitizeStringArray(body.knownPlayers, 200, 5)
  const timeHorizon = sanitizeString(body.timeHorizon, 10) || '90d'

  const brief = await generateMarketResearchBrief({
    marketOrTrend,
    scope,
    keyQuestions,
    knownPlayers: knownPlayers.length ? knownPlayers : undefined,
    timeHorizon,
  })
  return NextResponse.json(brief)
}
