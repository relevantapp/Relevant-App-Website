/* ── Follow-up Q&A API — ask questions about a brief ──────── */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { callOpenRouterMessages } from '@/lib/intelligence/openrouter'
import {
  DEFAULT_MODEL_PREFERENCE,
  normalizeModelPreference,
} from '@/lib/intelligence/models'

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/^=+/, '').trim()
const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').replace(/^=+/, '').trim()

const MAX_QUESTION_LENGTH = 500
const MAX_MODEL_LENGTH = 160
const MAX_HISTORY = 10
const FOLLOW_UP_TIMEOUT = 20_000

type ChatMessage = { role: 'user' | 'assistant'; content: string }

async function generateFollowUpAnswer(
  systemPrompt: string,
  messages: ChatMessage[],
  preferredModel: string,
): Promise<string> {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OpenRouter is not configured')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FOLLOW_UP_TIMEOUT)

  try {
    const answer = await callOpenRouterMessages(
      systemPrompt,
      messages,
      preferredModel,
      controller.signal,
      { maxTokens: 1024, temperature: 0.3 },
    )
    console.log(`[api/intelligence/chat] ${answer.model} OK`)
    return answer.content
  } finally {
    clearTimeout(timeout)
  }
}

export async function POST(request: NextRequest) {
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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const briefId = typeof body.briefId === 'string' ? body.briefId.slice(0, 50) : ''
  const question = typeof body.question === 'string' ? body.question.slice(0, MAX_QUESTION_LENGTH) : ''
  const preferredModel = normalizeModelPreference(
    typeof body.preferredModel === 'string'
      ? body.preferredModel.slice(0, MAX_MODEL_LENGTH)
      : DEFAULT_MODEL_PREFERENCE,
  )

  if (!briefId || !question.trim()) {
    return NextResponse.json({ error: 'briefId and question are required' }, { status: 400 })
  }

  const { data: brief, error: briefErr } = await supabase
    .from('intelligence_briefs')
    .select('synthesis, sources, research_type')
    .eq('id', briefId)
    .single()

  if (briefErr || !brief) {
    return NextResponse.json({ error: 'Brief not found' }, { status: 404 })
  }

  const { data: history } = await supabase
    .from('intelligence_chat_messages')
    .select('role, content')
    .eq('brief_id', briefId)
    .order('created_at', { ascending: false })
    .limit(MAX_HISTORY)

  await supabase.from('intelligence_chat_messages').insert({
    brief_id: briefId,
    user_id: user.id,
    role: 'user',
    content: question.trim(),
  })

  const systemPrompt = `You are a research assistant. The user previously generated an intelligence brief. Answer their follow-up question using ONLY the brief and sources below. Be concise (2-4 sentences). If the answer isn't in the brief data, say so honestly.

Research type: ${brief.research_type}

Brief synthesis:
${JSON.stringify(brief.synthesis, null, 2)}

Sources (${Array.isArray(brief.sources) ? brief.sources.length : 0} total):
${Array.isArray(brief.sources) ? brief.sources.slice(0, 10).map((s: Record<string, unknown>) => `- ${s.title} (${s.domain}): ${s.snippet ?? ''}`).join('\n') : 'None'}`

  const messages: ChatMessage[] = []
  if (history) {
    for (const msg of [...history].reverse()) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({ role: msg.role, content: msg.content })
      }
    }
  }
  messages.push({ role: 'user', content: question.trim() })

  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({ error: 'AI provider not configured' }, { status: 503 })
  }

  try {
    const answer = await generateFollowUpAnswer(systemPrompt, messages, preferredModel)

    await supabase.from('intelligence_chat_messages').insert({
      brief_id: briefId,
      user_id: user.id,
      role: 'assistant',
      content: answer,
    })

    return NextResponse.json({ answer })
  } catch (err) {
    console.error('[api/intelligence/chat] Failed:', err)
    return NextResponse.json({ error: 'Failed to generate answer' }, { status: 500 })
  }
}
