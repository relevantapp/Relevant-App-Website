'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Layers, TrendingUp, Radio, Sparkles, Share2, Check } from 'lucide-react'
import type { ProBriefItem, ConsequenceStep } from '@/types/signals'

const TRAJECTORY_COLORS: Record<string, string> = {
  ESCALATING: 'bg-accent-coral text-white',
  EMERGING: 'bg-accent-teal text-white',
  DEVELOPING: 'bg-accent-amber text-gray-950',
  STABLE: 'bg-[var(--surface-strong)] text-[var(--text)]',
  FADING: 'bg-[var(--surface)] text-[var(--text-muted)]',
}

const TRAJECTORY_GRADIENTS: Record<string, string> = {
  ESCALATING: 'from-red-500/30 to-orange-400/20',
  EMERGING: 'from-teal-500/30 to-cyan-400/20',
  DEVELOPING: 'from-blue-500/30 to-indigo-400/20',
  STABLE: 'from-gray-500/20 to-gray-400/10',
  FADING: 'from-violet-400/25 to-purple-300/15',
}

const CONSEQUENCE_TYPE_COLORS: Record<string, string> = {
  competitive: 'bg-accent-coral',
  opportunity: 'bg-accent-teal',
  risk: 'bg-accent-amber',
  strategic: 'bg-accent-violet',
}

function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  if (diffMs < 0) return 'Just now'
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(dateStr))
}

function getTopConsequenceTypes(steps?: ConsequenceStep[]): string[] {
  if (!steps || steps.length === 0) return []
  const seen = new Set<string>()
  const types: string[] = []
  for (const s of steps) {
    const t = s.type?.toLowerCase()
    if (t && !seen.has(t) && CONSEQUENCE_TYPE_COLORS[t]) {
      seen.add(t)
      types.push(t)
      if (types.length >= 3) break
    }
  }
  return types
}

type Props = {
  signal: ProBriefItem
  onClick: () => void
  index?: number
}

export default function SignalCard({ signal, onClick, index = 0 }: Props) {
  const [imgError, setImgError] = useState(false)
  const [shareFeedback, setShareFeedback] = useState(false)

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
  const consequenceTypes = getTopConsequenceTypes(signal.consequence_steps)
  const trajectoryLabel = signal.trajectory?.toUpperCase()
  const trajectoryClass = trajectoryLabel ? TRAJECTORY_COLORS[trajectoryLabel] ?? TRAJECTORY_COLORS.STABLE : null
  const hasImage = !!signal.imageUrl && !imgError
  const placeholderGradient = trajectoryLabel
    ? TRAJECTORY_GRADIENTS[trajectoryLabel] ?? TRAJECTORY_GRADIENTS.STABLE
    : TRAJECTORY_GRADIENTS.STABLE

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0, 0, 0.2, 1] }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick() }}
      className="group cursor-pointer overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] will-change-transform transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
    >
      {/* Hero image or gradient placeholder */}
      <div className="relative h-36 w-full overflow-hidden sm:h-44 lg:h-40">
        {hasImage ? (
          <img
            src={signal.imageUrl!}
            alt=""
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${placeholderGradient}`}>
            <Sparkles size={24} className="text-[var(--text-soft)] opacity-40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-elevated)] via-transparent to-transparent" />
        {/* Share button — visible on hover (desktop) or always (mobile) */}
        <button
          onClick={handleShare}
          title={shareFeedback ? 'Copied!' : 'Share'}
          className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-opacity md:opacity-0 md:group-hover:opacity-100"
        >
          {shareFeedback ? <Check size={13} /> : <Share2 size={13} />}
        </button>
      </div>

      <div className="p-5">
        {/* Top badges row */}
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {signal.isDeveloping && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-blue/15 px-2 py-0.5 text-xs font-medium text-accent-blue">
              <Radio size={10} className="animate-pulse" />
              Developing
            </span>
          )}
          {trajectoryClass && trajectoryLabel && (
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${trajectoryClass}`}>
              <TrendingUp size={10} />
              {trajectoryLabel.charAt(0) + trajectoryLabel.slice(1).toLowerCase()}
            </span>
          )}
        </div>

        {/* Headline */}
        <h3 className="mb-2 font-display text-lg font-bold leading-snug text-[var(--text)]">
          {signal.headline}
        </h3>

        {/* Synthesis */}
        {signal.synthesis && (
          <p className="mb-3 text-sm leading-relaxed text-[var(--text-muted)]">
            {signal.synthesis}
          </p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-soft)]">
          {signal.signalDate && (
            <span className="inline-flex items-center gap-1">
              <Clock size={12} />
              {formatRelativeTime(signal.signalDate)}
            </span>
          )}
          {signal.sourceCount != null && signal.sourceCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface)] px-2 py-0.5 font-medium text-[var(--text-muted)]">
              <Layers size={11} />
              {signal.sourceCount} {signal.sourceCount === 1 ? 'source' : 'sources'}
            </span>
          )}
          {/* Consequence type dots */}
          {consequenceTypes.length > 0 && (
            <div className="flex items-center gap-1">
              {consequenceTypes.map((t) => (
                <span
                  key={t}
                  className={`inline-block h-2 w-2 rounded-full ${CONSEQUENCE_TYPE_COLORS[t]}`}
                  title={t}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.article>
  )
}
