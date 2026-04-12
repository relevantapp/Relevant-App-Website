'use client'

import { motion } from 'framer-motion'
import { Clock, Layers, TrendingUp, Radio } from 'lucide-react'
import type { ProBriefItem, ConsequenceStep } from '@/types/signals'

const TRAJECTORY_COLORS: Record<string, string> = {
  ESCALATING: 'bg-accent-coral text-white',
  EMERGING: 'bg-accent-teal text-white',
  DEVELOPING: 'bg-accent-amber text-gray-950',
  STABLE: 'bg-[var(--surface-strong)] text-[var(--text)]',
  FADING: 'bg-[var(--surface)] text-[var(--text-muted)]',
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
  const consequenceTypes = getTopConsequenceTypes(signal.consequence_steps)
  const trajectoryLabel = signal.trajectory?.toUpperCase()
  const trajectoryClass = trajectoryLabel ? TRAJECTORY_COLORS[trajectoryLabel] ?? TRAJECTORY_COLORS.STABLE : null

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0, 0, 0.2, 1] }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick() }}
      className="group cursor-pointer overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] transition-shadow hover:shadow-lg"
    >
      {/* Hero image */}
      {signal.imageUrl && (
        <div className="relative h-36 w-full overflow-hidden sm:h-44 lg:h-40">
          <img
            src={signal.imageUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-elevated)] via-transparent to-transparent" />
        </div>
      )}

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
