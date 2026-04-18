/* ── AI Goal Refinement API ─────────────────────────────────── */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 30

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/^=+/, '').trim()
const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').replace(/^=+/, '').trim()

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models'
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const REFINE_TIMEOUT = 15_000

const SYSTEM_PROMPT = `You are a research strategist. The user gives you a rough meeting goal. 
Rewrite it into a sharper, more specific, actionable goal statement.

Rules:
- Keep it to 1-2 sentences
- Make it specific and measurable where possible
- Preserve the user's intent — don't change the direction
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

  if (!goal) {
    return NextResponse.json({ error: 'Goal is required' }, { status: 400 })
  }

  const userPrompt = `Meeting type: ${meetingType || 'general'}
Account: ${accountName || 'unknown'}
Raw goal: ${goal}

Refined goal:`

  try {
    const refined = await callLLM(userPrompt)
    return NextResponse.json({ refined })
  } catch (err) {
    console.error('[refine-goal] LLM call failed:', err)
    return NextResponse.json({ error: 'Refinement failed' }, { status: 500 })
  }
}

async function callLLM(userPrompt: string): Promise<string> {
  // Try Gemini first
  if (process.env.GEMINI_API_KEY) {
    try {
      const result = await callGemini(userPrompt)
      if (result) return result
    } catch { /* fallthrough */ }
  }

  // Fallback to OpenRouter
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const result = await callOpenRouter(userPrompt)
      if (result) return result
    } catch { /* fallthrough */ }
  }

  throw new Error('All LLM providers failed')
}

async function callGemini(userPrompt: string): Promise<string | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REFINE_TIMEOUT)

  try {
    const res = await fetch(
      `${GEMINI_URL}/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 200 },
        }),
        signal: controller.signal,
      },
    )

    if (!res.ok) return null
    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    return text || null
  } finally {
    clearTimeout(timer)
  }
}

async function callOpenRouter(userPrompt: string): Promise<string | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REFINE_TIMEOUT)

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 200,
      }),
      signal: controller.signal,
    })

    if (!res.ok) return null
    const data = await res.json()
    const text = data?.choices?.[0]?.message?.content?.trim()
    return text || null
  } finally {
    clearTimeout(timer)
  }
}
