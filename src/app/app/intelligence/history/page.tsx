/* ── Intelligence History Page ──────────────────────────── */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, FileText, BarChart3, Users, TrendingUp, Share2, Loader2 } from 'lucide-react'
import { getValidAccessToken } from '@/lib/supabase'
import type { BriefListItem } from '@/lib/intelligence/db'

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  meeting_prep: { label: 'Meeting Prep', icon: <Users className="h-3.5 w-3.5" />, color: 'text-[var(--accent)]' },
  competitive_analysis: { label: 'Competitive Analysis', icon: <BarChart3 className="h-3.5 w-3.5" />, color: 'text-[var(--accent-amber)]' },
  business_case: { label: 'Business Case', icon: <FileText className="h-3.5 w-3.5" />, color: 'text-[var(--accent-teal)]' },
  market_research: { label: 'Market Research', icon: <TrendingUp className="h-3.5 w-3.5" />, color: 'text-[var(--accent-violet)]' },
}

const FILTERS = ['all', 'meeting_prep', 'competitive_analysis', 'business_case', 'market_research'] as const

export default function IntelligenceHistoryPage() {
  const router = useRouter()
  const [briefs, setBriefs] = useState<BriefListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  const fetchBriefs = useCallback(async () => {
    try {
      const token = await getValidAccessToken(180)
      const res = await fetch('/api/intelligence/briefs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'list', limit: 100 }),
      })
      if (res.ok) {
        const data = await res.json()
        setBriefs(data.briefs ?? [])
      }
    } catch {
      // Silently fail — page shows empty state
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchBriefs() }, [fetchBriefs])

  const filtered = filter === 'all'
    ? briefs
    : briefs.filter((b) => b.research_type === filter)

  const handleShare = async (briefId: string, isShared: boolean) => {
    try {
      const token = await getValidAccessToken(180)
      const res = await fetch('/api/intelligence/briefs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'share', briefId, share: !isShared }),
      })
      if (res.ok) {
        const data = await res.json()
        setBriefs((prev) =>
          prev.map((b) =>
            b.id === briefId
              ? { ...b, is_shared: !isShared, share_slug: data.slug ?? null }
              : b,
          ),
        )
        if (!isShared && data.slug) {
          const url = `${window.location.origin}/intelligence/share/${data.slug}`
          await navigator.clipboard.writeText(url)
        }
      }
    } catch {
      // Silently fail
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-bold text-[var(--text)] sm:text-xl">Intelligence History</h1>
        <button
          onClick={() => router.push('/app/intelligence')}
          className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-medium text-white sm:text-sm"
        >
          New Research
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-strong)]'
            }`}
          >
            {f === 'all' ? 'All' : TYPE_CONFIG[f]?.label ?? f}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-12 text-center">
          <Clock className="mx-auto h-8 w-8 text-[var(--text-soft)]" />
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            {filter === 'all' ? 'No research briefs yet.' : 'No briefs for this filter.'}
          </p>
          <p className="mt-1 text-xs text-[var(--text-soft)]">
            Generate a brief and it will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((brief) => {
            const config = TYPE_CONFIG[brief.research_type]
            return (
              <div
                key={brief.id}
                className="flex items-start gap-3 rounded-xl border border-[var(--surface-strong)] bg-[var(--surface)] p-3 transition-colors hover:border-[var(--accent)]/30 cursor-pointer sm:items-center sm:gap-4 sm:p-4"
                onClick={() => router.push(`/app/intelligence?brief=${brief.id}`)}
              >
                <div className={`shrink-0 ${config?.color ?? 'text-[var(--text-muted)]'}`}>
                  {config?.icon ?? <FileText className="h-3.5 w-3.5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--text)]">
                    {brief.headline}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <span>{config?.label ?? brief.research_type}</span>
                    <span>·</span>
                    <span>{new Date(brief.created_at).toLocaleDateString()}</span>
                    {brief.confidence && (
                      <>
                        <span>·</span>
                        <span className={
                          brief.confidence === 'high'
                            ? 'text-[var(--accent-teal)]'
                            : brief.confidence === 'low'
                              ? 'text-[var(--accent-coral)]'
                              : 'text-[var(--accent-amber)]'
                        }>
                          {brief.confidence} confidence
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleShare(brief.id, brief.is_shared)
                  }}
                  className={`shrink-0 rounded-lg p-2 text-xs transition-colors ${
                    brief.is_shared
                      ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                      : 'bg-[var(--surface-strong)] text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                  title={brief.is_shared ? 'Unshare (link copied)' : 'Share & copy link'}
                >
                  <Share2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
