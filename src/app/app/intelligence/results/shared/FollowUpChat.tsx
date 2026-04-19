/* ── FollowUpChat — inline editorial follow-up Q&A panel ──── */
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { MODEL_STORAGE_KEY, normalizeModelPreference } from '@/lib/intelligence/models'
import { getValidAccessToken } from '@/lib/supabase'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface FollowUpChatProps {
  briefId: string | null
  researchType?: string
}

const SUGGESTED_QUESTIONS: Record<string, string[]> = {
  meeting_prep: [
    'What are the biggest risks in this meeting?',
    'How should I open the conversation?',
    'What questions will they likely ask me?',
  ],
  competitive_analysis: [
    'Where are we most vulnerable?',
    'Which competitor is gaining fastest?',
    'What should we do differently this quarter?',
  ],
  business_case: [
    'What would make this a stronger case?',
    'What are the key assumptions to test?',
    'How do comparable companies compare?',
  ],
  market_research: [
    'What trend is most actionable right now?',
    'Where is the biggest gap in the market?',
    'Which players should we watch most closely?',
  ],
}

export default function FollowUpChat({ briefId, researchType }: FollowUpChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = useCallback(async (question?: string) => {
    const q = (question ?? input).trim()
    if (!q || loading || !briefId) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: q }])
    setLoading(true)

    try {
      const token = await getValidAccessToken(180)
      const res = await fetch('/api/intelligence/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          briefId,
          question: q,
          preferredModel: normalizeModelPreference(localStorage.getItem(MODEL_STORAGE_KEY)),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }])
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Sorry, something went wrong. Try again.' },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Network error. Please try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }, [input, loading, briefId])

  if (!briefId) return null

  const suggestions = SUGGESTED_QUESTIONS[researchType ?? ''] ?? SUGGESTED_QUESTIONS.meeting_prep

  return (
    <div
      style={{
        marginTop: 32,
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--border)' }}>
        <span className="kicker">Ask a follow-up</span>
      </div>

      {/* Suggested questions (shown when no messages yet) */}
      {messages.length === 0 && (
        <div style={{ padding: '12px 18px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {suggestions.map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              disabled={loading}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                color: 'var(--text-muted)',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 4,
                cursor: 'pointer',
                transition: 'border-color 150ms, color 150ms',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)'
                e.currentTarget.style.color = 'var(--text)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.color = 'var(--text-muted)'
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Message history */}
      {messages.length > 0 && (
        <div ref={scrollRef} style={{ maxHeight: 360, overflowY: 'auto', padding: '12px 18px' }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                marginBottom: 12,
                padding: '10px 14px',
                background: msg.role === 'user' ? 'var(--surface)' : 'transparent',
                borderLeft: msg.role === 'assistant' ? '2px solid var(--accent-teal)' : 'none',
                borderRadius: msg.role === 'user' ? 6 : 0,
              }}
            >
              <div className="kicker" style={{ marginBottom: 4, color: msg.role === 'user' ? 'var(--text-soft)' : 'var(--accent-teal)' }}>
                {msg.role === 'user' ? 'You' : 'Intelligence'}
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--text-muted)', margin: 0, whiteSpace: 'pre-wrap' }}>
                {msg.content}
              </p>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderLeft: '2px solid var(--accent-teal)' }}>
              <Loader2 className="h-3 w-3 animate-spin" style={{ color: 'var(--accent-teal)' }} />
              <span className="mono" style={{ fontSize: 11, color: 'var(--text-soft)' }}>Thinking…</span>
            </div>
          )}
        </div>
      )}

      {/* Input bar */}
      <div style={{ padding: '10px 18px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Ask anything about this brief…"
          maxLength={500}
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: 13,
            color: 'var(--text)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            outline: 'none',
          }}
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          style={{
            padding: '8px 12px',
            background: input.trim() ? 'var(--accent)' : 'var(--surface)',
            color: input.trim() ? '#fff' : 'var(--text-soft)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            cursor: input.trim() ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            transition: 'background 150ms',
          }}
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
