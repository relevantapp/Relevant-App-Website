/* ── ShareButton — share a brief and copy the link ─────────── */
'use client'

import { useState, useCallback } from 'react'
import { Link2, Check, Loader2, AlertCircle } from 'lucide-react'
import { getValidAccessToken } from '@/lib/supabase'
import { buildIntelligenceShareUrl } from '@/lib/public-url'

interface ShareButtonProps {
  briefId: string | null
}

export default function ShareButton({ briefId }: ShareButtonProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'copied' | 'error'>('idle')

  const handleShare = useCallback(async () => {
    if (!briefId || state === 'loading') return
    setState('loading')

    try {
      const token = await getValidAccessToken(180)
      if (!token) throw new Error('Missing session')
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
        if (!data.slug) throw new Error('Missing share link')
        await navigator.clipboard.writeText(buildIntelligenceShareUrl(data.slug))
        setState('copied')
        setTimeout(() => setState('idle'), 2000)
      } else {
        throw new Error('Share request failed')
      }
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 2500)
    }
  }, [briefId, state])

  if (!briefId) return null

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={state === 'loading'}
      aria-live="polite"
      title={state === 'error' ? 'Share failed. Try again.' : 'Share and copy link'}
      className="share-action"
    >
      {state === 'loading' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {state === 'copied' && <Check className="h-3.5 w-3.5" />}
      {state === 'error' && <AlertCircle className="h-3.5 w-3.5" />}
      {state === 'idle' && <Link2 className="h-3.5 w-3.5" />}
      {state === 'copied' ? 'Link copied' : state === 'error' ? 'Share failed' : 'Share'}

      <style jsx>{`
        .share-action {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 30px;
          padding: 6px 14px;
          border: 1px solid var(--border);
          border-radius: 9999px;
          background: transparent;
          color: ${state === 'copied'
            ? 'var(--accent)'
            : state === 'error'
              ? 'var(--text)'
              : 'var(--text-muted)'};
          font-size: 12px;
          cursor: ${state === 'loading' ? 'default' : 'pointer'};
          transition: color 150ms ease, border-color 150ms ease, background 150ms ease;
        }
        .share-action:hover:not(:disabled) {
          border-color: var(--accent);
          color: var(--text);
          background: var(--surface);
        }
        .share-action:disabled {
          opacity: 0.7;
        }
      `}</style>
    </button>
  )
}
