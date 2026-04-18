'use client'

import { useState, useCallback } from 'react'
import { Sparkles, Undo2, Loader2 } from 'lucide-react'
import { getValidAccessToken } from '@/lib/supabase'

interface AIRefineButtonProps {
  goal: string
  meetingType: string
  accountName: string
  onRefine: (refined: string) => void
  disabled?: boolean
}

export default function AIRefineButton({
  goal,
  meetingType,
  accountName,
  onRefine,
  disabled,
}: AIRefineButtonProps) {
  const [loading, setLoading] = useState(false)
  const [original, setOriginal] = useState<string | null>(null)

  const handleRefine = useCallback(async () => {
    if (!goal.trim() || loading) return
    setLoading(true)
    setOriginal(goal)

    try {
      const token = await getValidAccessToken()
      const res = await fetch('/api/intelligence/refine-goal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ goal, meetingType, accountName }),
      })

      if (!res.ok) throw new Error('Refine failed')
      const data = await res.json()
      if (data.refined) onRefine(data.refined)
    } catch {
      setOriginal(null)
    } finally {
      setLoading(false)
    }
  }, [goal, meetingType, accountName, loading, onRefine])

  const handleUndo = useCallback(() => {
    if (original) {
      onRefine(original)
      setOriginal(null)
    }
  }, [original, onRefine])

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
      <button
        type="button"
        onClick={handleRefine}
        disabled={disabled || loading || !goal.trim()}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          background: 'none',
          border: 'none',
          fontSize: 12,
          fontWeight: 500,
          color: disabled || !goal.trim() ? 'var(--text-muted)' : 'var(--accent)',
          cursor: disabled || loading || !goal.trim() ? 'default' : 'pointer',
          padding: '2px 0',
        }}
      >
        {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
        Refine
      </button>
      {original && !loading && (
        <button
          type="button"
          onClick={handleUndo}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: 'none',
            border: 'none',
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '2px 0',
          }}
        >
          <Undo2 size={12} />
          Undo
        </button>
      )}
    </div>
  )
}
