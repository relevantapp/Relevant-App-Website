'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Sparkles, Send, ChevronDown, ChevronUp, Copy, Check, Loader2,
} from 'lucide-react'
import { supabase, getValidAccessToken } from '@/lib/supabase'

/* ── types ────────────────────────────────────────────────────── */

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  suggestedPrompts?: string[]
}

/* ── constants ────────────────────────────────────────────────── */

const SUGGESTIONS = [
  { label: 'Risk analysis', prompt: 'What are the key risks here?' },
  { label: 'Impact assessment', prompt: 'How does this affect my industry?' },
  { label: 'Action plan', prompt: 'What should I do about this?' },
  { label: 'Simplify', prompt: 'Give me a simpler explanation' },
]

/* ── helpers ──────────────────────────────────────────────────── */

function tryParseResponseJson(
  raw: string,
): { reply: string; suggestedPrompts: string[] } | null {
  let s = raw.trim()
  if (s.startsWith('```')) {
    s = s
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/m, '')
      .trim()
  }
  if (!s.includes('"reply"')) return null
  try {
    const parsed = JSON.parse(s) as Record<string, unknown>
    const reply = typeof parsed.reply === 'string' ? parsed.reply.trim() : ''
    if (!reply) return null
    const arr = Array.isArray(parsed.suggestedPrompts)
      ? parsed.suggestedPrompts
      : []
    const suggestedPrompts = arr
      .map((p) => String(p).trim())
      .filter((p) => p.length > 0)
      .slice(0, 4)
    return { reply, suggestedPrompts }
  } catch {
    return null
  }
}

function getAssistantBody(msg: ChatMessage): string {
  if (msg.role !== 'assistant') return msg.text
  const embedded = tryParseResponseJson(msg.text)
  return embedded?.reply ?? msg.text
}

function getFollowUps(msg: ChatMessage): string[] {
  if (msg.role !== 'assistant') return []
  if (msg.suggestedPrompts && msg.suggestedPrompts.length > 0)
    return msg.suggestedPrompts
  const embedded = tryParseResponseJson(msg.text)
  return embedded?.suggestedPrompts ?? []
}

/* ── API call ─────────────────────────────────────────────────── */

async function askAboutSignal(
  signalId: string,
  headline: string,
  messages: ChatMessage[],
): Promise<{ reply: string; suggestedPrompts: string[] }> {
  const token = await getValidAccessToken()
  if (!token) throw new Error('Not authenticated')

  const { data, error } = await supabase.functions.invoke('pro-signal-chat', {
    headers: { Authorization: `Bearer ${token}` },
    body: {
      signalId,
      headline,
      messages: messages.map((m) => ({ role: m.role, text: m.text })),
    },
  })

  if (error) throw new Error('Could not reach AI. Please try again.')

  const response = data as {
    reply?: string
    suggestedPrompts?: unknown
  } | null
  const rawReply =
    response?.reply || "I couldn't generate a response. Please try again."
  const fromApi = Array.isArray(response?.suggestedPrompts)
    ? (response.suggestedPrompts as unknown[])
        .map((p) => String(p).trim())
        .filter((p) => p.length > 0)
        .slice(0, 4)
    : []

  const embedded = tryParseResponseJson(rawReply)
  const reply = embedded?.reply ?? rawReply
  const suggestedPrompts =
    fromApi.length > 0 ? fromApi : (embedded?.suggestedPrompts ?? [])

  return { reply, suggestedPrompts }
}

/* ── Inline markdown renderer ─────────────────────────────────── */

function renderInlineMd(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  const re = /\*\*(.+?)\*\*/g
  let cursor = 0
  let m: RegExpExecArray | null
  let idx = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > cursor) parts.push(text.slice(cursor, m.index))
    parts.push(<strong key={idx++}>{m[1]}</strong>)
    cursor = m.index + m[0].length
  }
  if (cursor < text.length) parts.push(text.slice(cursor))
  return parts.length === 1 ? parts[0] : <>{parts}</>
}

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trimStart()

    if (!trimmed) {
      elements.push(<div key={`sp-${i}`} className="h-2" />)
      continue
    }

    const headingMatch = /^#{1,3}\s+(.+)$/.exec(trimmed)
    if (headingMatch) {
      elements.push(
        <p key={`h-${i}`} className="askai-md-heading">
          {renderInlineMd(headingMatch[1])}
        </p>,
      )
      continue
    }

    const bulletMatch = /^(?:[-*]|\d+\.)\s+(.+)$/.exec(trimmed)
    if (bulletMatch) {
      elements.push(
        <div key={`b-${i}`} className="askai-md-bullet">
          <span className="askai-md-bullet-dot">&bull;</span>
          <span>{renderInlineMd(bulletMatch[1])}</span>
        </div>,
      )
      continue
    }

    elements.push(
      <p key={`p-${i}`} className="askai-md-para">
        {renderInlineMd(trimmed)}
      </p>,
    )
  }

  return <>{elements}</>
}

/* ── AskAIChat component ─────────────────────────────────────── */

type Props = {
  signalId: string
  headline: string
}

export function AskAIChat({ signalId, headline }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const container = messagesContainerRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [messages, isLoading])

  const handleSend = useCallback(
    async (text?: string) => {
      const question = (text || inputText).trim()
      if (!question || isLoading) return

      setInputText('')
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: question,
      }
      const updated = [...messages, userMsg]
      setMessages(updated)
      setIsLoading(true)

      try {
        const { reply, suggestedPrompts } = await askAboutSignal(
          signalId,
          headline,
          updated,
        )
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            text: reply,
            suggestedPrompts,
          },
        ])
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            text:
              err instanceof Error ? err.message : 'Something went wrong.',
          },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [inputText, isLoading, messages, signalId, headline],
  )

  const handleCopy = useCallback(async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  return (
    <section className="askai-section mt-8">
      <button
        onClick={() => {
          setExpanded((e) => !e)
          if (!expanded) setTimeout(() => inputRef.current?.focus(), 100)
        }}
        className="askai-toggle"
      >
        <div className="askai-toggle-left">
          <Sparkles size={18} />
          <span>Ask AI about this signal</span>
          {messages.length > 0 && (
            <span className="askai-msg-count">{messages.length}</span>
          )}
        </div>
        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {expanded && (
        <div className="askai-body">
          {messages.length === 0 && !isLoading ? (
            <div className="askai-empty">
              <p className="askai-empty-title">Ask about this signal</p>
              <p className="askai-empty-subtitle">
                Deeper analysis, simpler explanations, or tailored insights.
              </p>
              <div className="askai-suggestions">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.prompt}
                    onClick={() => void handleSend(s.prompt)}
                    className="askai-suggestion"
                  >
                    <span className="askai-suggestion-label">{s.label}</span>
                    <span className="askai-suggestion-text">{s.prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="askai-messages" ref={messagesContainerRef}>
              {messages.map((msg) => {
                const isUser = msg.role === 'user'
                const body = getAssistantBody(msg)
                const followUps = getFollowUps(msg)
                return (
                  <div
                    key={msg.id}
                    className={`askai-msg ${isUser ? 'askai-msg--user' : 'askai-msg--ai'}`}
                  >
                    {!isUser && (
                      <div className="askai-ai-avatar">
                        <Sparkles size={12} />
                      </div>
                    )}
                    <div className="askai-msg-content">
                      {isUser ? (
                        <p>{msg.text}</p>
                      ) : (
                        <div className="askai-md">
                          {renderMarkdown(body)}
                          <div className="askai-msg-actions">
                            <button
                              onClick={() => void handleCopy(body, msg.id)}
                              className="askai-action-btn"
                              title="Copy"
                            >
                              {copiedId === msg.id ? (
                                <Check size={14} />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                          </div>
                          {followUps.length > 0 && (
                            <div className="askai-followups">
                              {followUps.map((p, i) => (
                                <button
                                  key={i}
                                  onClick={() => void handleSend(p)}
                                  className="askai-followup"
                                >
                                  {p}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              {isLoading && (
                <div className="askai-msg askai-msg--ai">
                  <div className="askai-ai-avatar">
                    <Loader2 size={12} className="animate-spin" />
                  </div>
                  <div className="askai-msg-content">
                    <p className="askai-thinking">Thinking&hellip;</p>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          <div className="askai-input-bar">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void handleSend()
                }
              }}
              placeholder="Ask a follow-up question..."
              className="askai-input"
              disabled={isLoading}
            />
            <button
              onClick={() => void handleSend()}
              disabled={!inputText.trim() || isLoading}
              className="askai-send"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
