/* ── ShareButton — share a brief and copy the link ─────────── */
'use client'

import { useState, useCallback } from 'react'
import { Link2, Check, Loader2 } from 'lucide-react'
import { getValidAccessToken } from '@/lib/supabase'

interface ShareButtonProps {
  briefId: string | null
}

export default function ShareButton({ briefId }: ShareButtonProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'copied'>('idle')

  const handleShare = useCallback(async () => {
    if (!briefId || state === 'loading') return
    setState('loading')

    try {
      const token = await getValidAccessToken(180)
      const res = await fetch('/api/intelligence/briefs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'share', briefId, share: true }),
      })

      if (res.ok) {
        const data = await res.json()
        const shareUrl = `${window.location.origin}/intelligence/share/${data.slug}`
        await navigator.clipboard.writeText(shareUrl)
        setState('copied')
        setTimeout(() => setState('idle'), 2000)
      } else {
        setState('idle')
      }
    } catch {
      setState('idle')
    }
  }, [briefId, state])

  if (!briefId) return null

  return (
    <button
      onClick={handleShare}
      disabled={state === 'loading'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 14px',
        fontSize: 12,
        color: state === 'copied' ? 'var(--accent-teal)' : 'var(--text-muted)',
        background: 'transparent',
        border: '1px solid var(--border)',
        borderRadius: 6,
        cursor: 'pointer',
        transition: 'color 150ms',
      }}
    >
      {state === 'loading' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {state === 'copied' && <Check className="h-3.5 w-3.5" />}
      {state === 'idle' && <Link2 className="h-3.5 w-3.5" />}
      {state === 'copied' ? 'Link copied' : 'Share'}
    </button>
  )
}
