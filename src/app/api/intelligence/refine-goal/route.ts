/* ── AI Goal Refinement API ─────────────────────────────────── */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { callOpenRouterPrompt } from '@/lib/intelligence/openrouter'
import {
  DEFAULT_MODEL_PREFERENCE,
} from '@/lib/intelligence/models'
import {
  AI_ONLY_INTELLIGENCE_PROVIDERS,
  buildIntelligenceSetupMessage,
  getIntelligenceProviderStatus,
} from '@/lib/intelligence/provider-config'

export const maxDuration = 30

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/^=+/, '').trim()
const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').replace(/^=+/, '').trim()
const REFINE_TIMEOUT = 15_000

const SYSTEM_PROMPT = `You are a research strategist. The user gives you a rough meeting goal.
Rewrite it into a sharper, more specific, actionable goal statement.

Rules:
- Keep it to 1-2 sentences
- Make it specific and measurable where possible
- Preserve the user's intent and direction
- If the input is already sharp, return it with minor improvements
- Return ONLY the refined goal text, no quotes, no explanation`

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userToken = authHeader.replace('Bearer ', '')
  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${userToken}` } },
  })

  const { data: { user }, error: authErr } = await supabase.auth.getUser(userToken)
  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const goal = typeof body.goal === 'string' ? body.goal.trim().slice(0, 500) : ''
  const meetingType = typeof body.meetingType === 'string' ? body.meetingType.trim() : ''
  const accountName = typeof body.accountName === 'string' ? body.accountName.trim().slice(0, 200) : ''
  const preferredModel = DEFAULT_MODEL_PREFERENCE

  if (!goal) {
    return NextResponse.json({ error: 'Goal is required' }, { status: 400 })
  }

  const providerStatus = getIntelligenceProviderStatus(AI_ONLY_INTELLIGENCE_PROVIDERS)
  if (!providerStatus.ready) {
    return NextResponse.json(
      { error: buildIntelligenceSetupMessage('AI refinement', AI_ONLY_INTELLIGENCE_PROVIDERS) },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const userPrompt = `Meeting type: ${meetingType || 'general'}
Account: ${accountName || 'unknown'}
Raw goal: ${goal}

Refined goal:`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REFINE_TIMEOUT)

  try {
    const refined = await callOpenRouterPrompt(
      SYSTEM_PROMPT,
      userPrompt,
      preferredModel,
      controller.signal,
      { maxTokens: 200, temperature: 0.4 },
    )
    return NextResponse.json({ refined: refined.content.trim() })
  } catch (err) {
    console.error('[refine-goal] OpenRouter call failed:', err)
    return NextResponse.json({ error: 'Refinement failed' }, { status: 500 })
  } finally {
    clearTimeout(timer)
  }
}
