/* ── FollowUpChat — inline editorial follow-up Q&A panel ──── */
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MessageCircle, Send, Loader2, X } from 'lucide-react'
import { getValidAccessToken } from '@/lib/supabase'
import { MODEL_STORAGE_KEY, normalizeModelPreference } from '@/lib/intelligence/models'

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
  const [open, setOpen] = useState(false)
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
    <>
      <button
        type="button"
        className="intel-ask-fab"
        aria-expanded={open}
        aria-controls="intel-ask-panel"
        onClick={() => setOpen((value) => !value)}
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        <span>Ask AI</span>
      </button>

      {open && (
        <aside id="intel-ask-panel" className="intel-ask-panel" aria-label="Ask AI">
          <div className="intel-ask-header">
            <div>
              <span className="kicker">Ask AI</span>
              <p>Ask a follow-up about this brief.</p>
            </div>
            <button type="button" aria-label="Close Ask AI" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {messages.length === 0 && (
            <div className="intel-ask-suggestions">
              {suggestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleSend(q)}
                  disabled={loading}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {messages.length > 0 && (
            <div ref={scrollRef} className="intel-ask-messages">
              {messages.map((msg, i) => (
                <div key={i} className={`intel-ask-message intel-ask-message--${msg.role}`}>
                  <div className="kicker">
                    {msg.role === 'user' ? 'You' : 'Intelligence'}
                  </div>
                  <p>{msg.content}</p>
                </div>
              ))}
              {loading && (
                <div className="intel-ask-loading">
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                  <span className="mono">Thinking...</span>
                </div>
              )}
            </div>
          )}

          <div className="intel-ask-input-row">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask about this brief..."
              maxLength={500}
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              aria-label="Send question"
            >
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </aside>
      )}

      <style jsx>{`
        .intel-ask-fab {
          position: fixed;
          right: 24px;
          bottom: 24px;
          z-index: 55;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 44px;
          padding: 0 16px;
          border: 1px solid color-mix(in oklch, var(--accent) 48%, var(--border));
          border-radius: 9999px;
          background: var(--accent);
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          box-shadow: 0 18px 52px rgba(0, 0, 0, 0.28);
        }
        .intel-ask-panel {
          position: fixed;
          right: 24px;
          bottom: 82px;
          z-index: 56;
          width: min(420px, calc(100vw - 32px));
          max-height: min(620px, calc(100vh - 112px));
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid var(--border);
          border-radius: 18px;
          background: var(--bg-elevated);
          box-shadow: 0 26px 80px rgba(0, 0, 0, 0.36);
        }
        .intel-ask-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 14px;
          padding: 16px 18px;
          border-bottom: 1px solid var(--border);
        }
        .intel-ask-header p {
          margin-top: 5px;
          color: var(--text-muted);
          font-size: 12px;
          line-height: 1.4;
        }
        .intel-ask-header button {
          display: inline-flex;
          width: 32px;
          height: 32px;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border);
          border-radius: 9999px;
          background: var(--surface);
          color: var(--text-muted);
        }
        .intel-ask-suggestions {
          display: grid;
          gap: 8px;
          padding: 14px 18px;
        }
        .intel-ask-suggestions button {
          min-height: 38px;
          padding: 8px 11px;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: var(--surface);
          color: var(--text-muted);
          font-size: 12px;
          text-align: left;
        }
        .intel-ask-suggestions button:hover:not(:disabled) {
          border-color: var(--accent);
          color: var(--text);
        }
        .intel-ask-messages {
          min-height: 120px;
          max-height: 360px;
          overflow-y: auto;
          padding: 14px 18px;
        }
        .intel-ask-message {
          margin-bottom: 12px;
          padding: 11px 13px;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: var(--surface);
        }
        .intel-ask-message--assistant {
          border-left: 3px solid var(--accent);
          background: transparent;
        }
        .intel-ask-message .kicker {
          margin-bottom: 5px;
          color: var(--accent);
        }
        .intel-ask-message p {
          margin: 0;
          color: var(--text-muted);
          font-size: 13px;
          line-height: 1.55;
          white-space: pre-wrap;
        }
        .intel-ask-loading {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 13px;
          color: var(--text-soft);
          font-size: 11px;
        }
        .intel-ask-input-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          border-top: 1px solid var(--border);
          background: var(--surface);
        }
        .intel-ask-input-row input {
          min-width: 0;
          flex: 1;
          height: 38px;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: var(--bg-elevated);
          color: var(--text);
          font-size: 13px;
          outline: none;
          padding: 0 12px;
        }
        .intel-ask-input-row button {
          display: inline-flex;
          width: 38px;
          height: 38px;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: ${input.trim() ? 'var(--accent)' : 'var(--bg-elevated)'};
          color: ${input.trim() ? '#fff' : 'var(--text-soft)'};
        }
        .intel-ask-input-row button:disabled {
          cursor: default;
          opacity: 0.62;
        }
        @media (max-width: 640px) {
          .intel-ask-fab {
            right: 16px;
            bottom: 16px;
          }
          .intel-ask-panel {
            right: 12px;
            bottom: 72px;
            width: calc(100vw - 24px);
          }
        }
      `}</style>
    </>
  )
}
