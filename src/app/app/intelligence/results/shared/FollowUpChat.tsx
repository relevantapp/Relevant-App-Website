/* ── FollowUpChat — ask follow-up questions about a brief ─── */
'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, MessageCircle, X } from 'lucide-react'
import { getValidAccessToken } from '@/lib/supabase'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface FollowUpChatProps {
  briefId: string | null
}

export default function FollowUpChat({ briefId }: FollowUpChatProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  if (!briefId) return null

  const handleSend = async () => {
    const q = input.trim()
    if (!q || loading) return

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
        body: JSON.stringify({ briefId, question: q }),
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
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105 sm:bottom-6 sm:right-6"
      >
        <MessageCircle className="h-4 w-4" />
        Ask a follow-up
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-[calc(100vw-2rem)] flex-col rounded-xl border border-[var(--surface-strong)] bg-[var(--bg)] shadow-2xl sm:bottom-6 sm:right-6 sm:w-96">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--surface-strong)] px-4 py-3">
        <span className="text-sm font-semibold text-[var(--text)]">Follow-up Q&A</span>
        <button onClick={() => setOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text)]">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3 sm:px-4" style={{ maxHeight: 'min(320px, 50vh)' }}>
        {messages.length === 0 && (
          <p className="text-center text-xs text-[var(--text-soft)]">
            Ask anything about this brief — I&apos;ll answer using the research data.
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`rounded-lg px-3 py-2 text-sm ${
              msg.role === 'user'
                ? 'ml-4 bg-[var(--accent)]/10 text-[var(--text)] sm:ml-8'
                : 'mr-4 bg-[var(--surface)] text-[var(--text-muted)] sm:mr-8'
            }`}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="mr-4 flex items-center gap-2 rounded-lg bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-soft)] sm:mr-8">
            <Loader2 className="h-3 w-3 animate-spin" />
            Thinking…
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-[var(--surface-strong)] px-3 py-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask a follow-up…"
            maxLength={500}
            className="flex-1 rounded-lg border border-[var(--surface-strong)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-soft)] focus:border-[var(--accent)] focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="rounded-lg bg-[var(--accent)] p-2 text-white disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
