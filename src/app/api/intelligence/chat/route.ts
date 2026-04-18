/* ── Follow-up Q&A API — ask questions about a brief ──────── */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/^=+/, '').trim()
const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').replace(/^=+/, '').trim()
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models'
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

const MAX_QUESTION_LENGTH = 500
const MAX_HISTORY = 10
const FOLLOW_UP_TIMEOUT = 20_000

type ChatMessage = { role: 'user' | 'assistant'; content: string }

function getFollowUpCandidates(): Array<{ provider: 'anthropic' | 'gemini' | 'openrouter'; model: string }> {
  const candidates: Array<{ provider: 'anthropic' | 'gemini' | 'openrouter'; model: string }> = []

  if (process.env.ANTHROPIC_API_KEY) {
    candidates.push({ provider: 'anthropic', model: 'claude-haiku-4-5-20251001' })
  }
  if (process.env.OPENROUTER_API_KEY) {
    candidates.push({ provider: 'openrouter', model: 'google/gemini-2.5-flash-lite' })
  }
  if (process.env.GEMINI_API_KEY) {
    candidates.push({ provider: 'gemini', model: 'gemini-1.5-flash' })
  }

  return candidates
}

async function callAnthropic(
  systemPrompt: string,
  messages: ChatMessage[],
  model: string,
  signal: AbortSignal,
) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const response = await client.messages.create({
    model,
    max_tokens: 1024,
    temperature: 0.3,
    system: systemPrompt,
    messages: messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  }, { signal })

  const textBlock = response.content.find((block) => block.type === 'text')
  return textBlock && textBlock.type === 'text' ? textBlock.text.trim() : ''
}

async function callGemini(
  systemPrompt: string,
  messages: ChatMessage[],
  model: string,
  signal: AbortSignal,
) {
  const prompt = [
    systemPrompt,
    '',
    ...messages.map((message) => `${message.role.toUpperCase()}: ${message.content}`),
    '',
    'ASSISTANT:',
  ].join('\n')

  const res = await fetch(`${GEMINI_URL}/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
    }),
    signal,
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Gemini ${res.status}: ${errText.slice(0, 200)}`)
  }

  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ''
}

async function callOpenRouter(
  systemPrompt: string,
  messages: ChatMessage[],
  model: string,
  signal: AbortSignal,
) {
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://www.getrelevantapp.com',
      'X-Title': 'Relevant Intelligence Follow-up',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((message) => ({ role: message.role, content: message.content })),
      ],
      temperature: 0.3,
      max_tokens: 1024,
    }),
    signal,
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`OpenRouter ${res.status}: ${errText.slice(0, 200)}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  return typeof content === 'string' ? content.trim() : ''
}

async function generateFollowUpAnswer(systemPrompt: string, messages: ChatMessage[]): Promise<string> {
  const candidates = getFollowUpCandidates()
  if (candidates.length === 0) {
    throw new Error('No AI provider configured')
  }

  for (const candidate of candidates) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FOLLOW_UP_TIMEOUT)

    try {
      const answer = candidate.provider === 'anthropic'
        ? await callAnthropic(systemPrompt, messages, candidate.model, controller.signal)
        : candidate.provider === 'openrouter'
          ? await callOpenRouter(systemPrompt, messages, candidate.model, controller.signal)
          : await callGemini(systemPrompt, messages, candidate.model, controller.signal)

      clearTimeout(timeout)

      if (answer) {
        console.log(`[api/intelligence/chat] ${candidate.provider}/${candidate.model} OK`)
        return answer
      }
    } catch (err) {
      clearTimeout(timeout)
      console.error(`[api/intelligence/chat] ${candidate.provider}/${candidate.model} failed:`, err)
    }
  }

  throw new Error('All follow-up providers failed')
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

  if (!briefId || !question.trim()) {
    return NextResponse.json({ error: 'briefId and question are required' }, { status: 400 })
  }

  // Fetch the brief (RLS ensures user owns it)
  const { data: brief, error: briefErr } = await supabase
    .from('intelligence_briefs')
    .select('synthesis, sources, research_type')
    .eq('id', briefId)
    .single()

  if (briefErr || !brief) {
    return NextResponse.json({ error: 'Brief not found' }, { status: 404 })
  }

  // Fetch prior chat history for this brief
  const { data: history } = await supabase
    .from('intelligence_chat_messages')
    .select('role, content')
    .eq('brief_id', briefId)
    .order('created_at', { ascending: true })
    .limit(MAX_HISTORY)

  // Save the user's question
  await supabase.from('intelligence_chat_messages').insert({
    brief_id: briefId,
    user_id: user.id,
    role: 'user',
    content: question.trim(),
  })

  // Build context for the active AI provider
  const systemPrompt = `You are a research assistant. The user previously generated an intelligence brief. Answer their follow-up question using ONLY the brief and sources below. Be concise (2-4 sentences). If the answer isn't in the brief data, say so honestly.

Research type: ${brief.research_type}

Brief synthesis:
${JSON.stringify(brief.synthesis, null, 2)}

Sources (${Array.isArray(brief.sources) ? brief.sources.length : 0} total):
${Array.isArray(brief.sources) ? brief.sources.slice(0, 10).map((s: Record<string, unknown>) => `- ${s.title} (${s.domain}): ${s.snippet ?? ''}`).join('\n') : 'None'}`

  const messages: ChatMessage[] = []
  if (history) {
    for (const msg of history) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        messages.push({ role: msg.role, content: msg.content })
      }
    }
  }
  messages.push({ role: 'user', content: question.trim() })

  if (getFollowUpCandidates().length === 0) {
    return NextResponse.json({ error: 'AI provider not configured' }, { status: 503 })
  }

  try {
    const answer = await generateFollowUpAnswer(systemPrompt, messages)

    // Save the assistant reply
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
