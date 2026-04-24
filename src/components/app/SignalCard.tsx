'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  Bookmark,
  Check,
  Headphones,
  Layers,
  MessageCircle,
  Share2,
  ThumbsDown,
  ThumbsUp,
  Video,
} from 'lucide-react'
import type { ProBriefItem, ConsequenceStep } from '@/types/signals'
import { supabase } from '@/lib/supabase'

function getTopConsequenceTypes(steps?: ConsequenceStep[]): string[] {
  if (!steps || steps.length === 0) return []
  const seen = new Set<string>()
  const types: string[] = []
  for (const s of steps) {
    const t = (s.category || s.type || s.dimension)?.toLowerCase()
    if (t && !seen.has(t)) {
      seen.add(t)
      types.push(t)
      if (types.length >= 1) break
    }
  }
  return types
}

function formatCategory(value?: string | null): string | null {
  if (!value) return null
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

type Props = {
  signal: ProBriefItem
  onClick: () => void
  index?: number
  isNew?: boolean
}

export default function SignalCard({ signal, onClick, index = 0 }: Props) {
  const [imgError, setImgError] = useState(false)
  const [shareFeedback, setShareFeedback] = useState(false)
  const [saved, setSaved] = useState(false)
  const [feedback, setFeedback] = useState<boolean | null>(null)
  const [savingAction, setSavingAction] = useState<'feedback' | 'save' | null>(null)

  useEffect(() => {
    setImgError(false)
  }, [signal.imageUrl])

  useEffect(() => {
    let cancelled = false

    async function loadUserState() {
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData.user?.id
      if (!userId || cancelled) return

      const [feedbackResult, savedResult] = await Promise.all([
        supabase
          .from('signal_feedback')
          .select('is_relevant')
          .eq('user_id', userId)
          .eq('signal_id', signal.id)
          .maybeSingle(),
        supabase
          .from('notes_entries')
          .select('id')
          .eq('user_id', userId)
          .eq('source_ref', signal.id)
          .limit(1)
          .maybeSingle(),
      ])

      if (cancelled) return
      if (!feedbackResult.error) {
        setFeedback(typeof feedbackResult.data?.is_relevant === 'boolean' ? feedbackResult.data.is_relevant : null)
      }
      if (!savedResult.error && savedResult.data?.id) {
        setSaved(true)
      }
    }

    void loadUserState()
    return () => {
      cancelled = true
    }
  }, [signal.id])

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const url = `https://www.getrelevantapp.com/signal/${encodeURIComponent(signal.id)}`
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: signal.headline, url })
        return
      } catch { /* user cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(url)
      setShareFeedback(true)
      setTimeout(() => setShareFeedback(false), 1500)
    } catch { /* noop */ }
  }

  const handleFeedback = async (value: boolean, event: React.MouseEvent) => {
    event.stopPropagation()
    if (savingAction === 'feedback') return

    const previous = feedback
    const next = previous === value ? null : value
    setFeedback(next)
    setSavingAction('feedback')

    try {
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData.user?.id
      if (!userId) return

      if (next === null) {
        const { error } = await supabase
          .from('signal_feedback')
          .delete()
          .eq('user_id', userId)
          .eq('signal_id', signal.id)
        if (error) setFeedback(previous)
        return
      }

      const { error } = await supabase.from('signal_feedback').upsert(
        {
          user_id: userId,
          signal_id: signal.id,
          is_relevant: next,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,signal_id' },
      )
      if (error) setFeedback(previous)
    } catch {
      setFeedback(previous)
    } finally {
      setSavingAction(null)
    }
  }

  const handleSave = async (event: React.MouseEvent) => {
    event.stopPropagation()
    if (saved || savingAction === 'save') return

    setSaved(true)
    setSavingAction('save')

    try {
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData.user?.id
      if (!userId) {
        setSaved(false)
        return
      }

      const now = new Date()
      const jan4 = new Date(now.getFullYear(), 0, 4)
      const dayOfYear = Math.floor((now.getTime() - jan4.getTime()) / 86_400_000 + jan4.getDay())
      const weekNum = Math.ceil(dayOfYear / 7)
      const weekKey = `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`

      const notePayload = {
        user_id: userId,
        week_key: weekKey,
        entry_type: 'freeform',
        content: 'Saved',
        source_ref: signal.id,
        source_headline: signal.headline,
        origin: 'feed_save',
        is_prompt_response: false,
        prompt_text: null,
      }

      const { error } = await supabase.from('notes_entries').insert(notePayload)

      if (error && /column|schema cache/i.test(error.message)) {
        const { error: fallbackError } = await supabase.from('notes_entries').insert({
          user_id: userId,
          week_key: weekKey,
          entry_type: 'freeform',
          content: 'Saved',
          source_ref: signal.id,
        })
        if (fallbackError) {
          setSaved(false)
        }
        return
      }

      if (error) {
        setSaved(false)
      }
    } catch {
      setSaved(false)
    } finally {
      setSavingAction(null)
    }
  }
  const consequenceTypes = getTopConsequenceTypes(signal.consequence_steps)
  const mainImpact = formatCategory(consequenceTypes[0]) || 'Signal'
  const bottomLine =
    signal.synthesis?.trim() ||
    signal.why_it_matters?.find((line) => line.trim())?.trim() ||
    signal.what_happened?.find((line) => line.trim())?.trim() ||
    'Open the signal to assess the full impact.'
  const sourceCount = signal.sourceCount ?? signal.sources?.length ?? null
  const hasVideo = signal.mediaLinks?.some((media) => media.type === 'youtube_video' || media.type === 'youtube_short')
  const hasAudio = signal.mediaLinks?.some((media) => media.type === 'spotify_episode')
  const hasImage = Boolean(signal.imageUrl && !imgError)

  const actionButtonClass =
    'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] px-3 text-xs font-medium text-[var(--text-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30'
  const iconButtonClass =
    'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/30'

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0, 0, 0.2, 1] }}
      className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[0_1px_0_rgba(255,255,255,0.03)_inset] transition-[border-color,background-color,box-shadow] duration-200 hover:border-[var(--border-strong)] hover:bg-[var(--surface)] hover:shadow-[0_18px_48px_rgba(0,0,0,0.16)]"
    >
      <div className="flex min-h-full flex-col p-5">
        {hasImage ? (
          <div className="mb-5 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={signal.imageUrl as string}
              alt=""
              loading={index < 2 ? 'eager' : 'lazy'}
              onError={() => setImgError(true)}
              className="aspect-[16/7] w-full object-cover opacity-90 grayscale-[18%] transition duration-300 hover:opacity-100 hover:grayscale-0"
            />
          </div>
        ) : null}

        <div>
          <h3 className="font-display text-[1.35rem] font-semibold leading-[1.12] tracking-[-0.025em] text-[var(--text)] sm:text-[1.5rem]">
            {signal.headline}
          </h3>
        </div>

        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-soft)]">
            Bottom line
          </p>
          <p className="mt-1.5 text-[15px] leading-6 text-[var(--text-muted)]">
            {bottomLine}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--border)] pt-3 text-[11px] font-medium text-[var(--text-soft)]">
          <span className="inline-flex items-center gap-1.5 text-[var(--text-muted)]">
            <Layers size={12} />
            {sourceCount ?? 0} {(sourceCount ?? 0) === 1 ? 'source' : 'sources'}
          </span>
          {hasAudio ? (
            <span className="inline-flex items-center gap-1.5">
              <Headphones size={12} />
              Audio
            </span>
          ) : null}
          {hasVideo ? (
            <span className="inline-flex items-center gap-1.5">
              <Video size={12} />
              Video
            </span>
          ) : null}
          <span className="inline-flex items-center rounded-full border border-[var(--border)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            {mainImpact}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border)] pt-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(event) => void handleFeedback(true, event)}
              disabled={savingAction === 'feedback'}
              aria-pressed={feedback === true}
              aria-label="Like signal"
              className={`${iconButtonClass} ${feedback === true ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]' : ''} disabled:opacity-50`}
            >
              <ThumbsUp size={14} />
            </button>
            <button
              type="button"
              onClick={(event) => void handleFeedback(false, event)}
              disabled={savingAction === 'feedback'}
              aria-pressed={feedback === false}
              aria-label="Dislike signal"
              className={`${iconButtonClass} ${feedback === false ? 'border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)]' : ''} disabled:opacity-50`}
            >
              <ThumbsDown size={14} />
            </button>
            <button
              type="button"
              onClick={handleShare}
              aria-label={shareFeedback ? 'Copied' : 'Share signal'}
              className={iconButtonClass}
            >
              {shareFeedback ? <Check size={14} /> : <Share2 size={14} />}
            </button>
            <button
              type="button"
              onClick={(event) => void handleSave(event)}
              disabled={savingAction === 'save'}
              aria-pressed={saved}
              aria-label={saved ? 'Saved signal' : 'Save signal'}
              className={`${iconButtonClass} ${saved ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]' : ''} disabled:opacity-50`}
            >
              <Bookmark size={14} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onClick()
              }}
              className={`${actionButtonClass} border-[var(--text)] bg-[var(--text)] !text-[var(--bg)] hover:border-[var(--text)] hover:bg-[var(--text)] hover:!text-[var(--bg)]`}
            >
              <Activity size={14} />
              Impact
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onClick()
              }}
              className={`${actionButtonClass} border-[var(--accent)] bg-[var(--accent)] text-white hover:border-[var(--accent)] hover:text-white`}
            >
              <MessageCircle size={14} />
              Ask
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  )
}
