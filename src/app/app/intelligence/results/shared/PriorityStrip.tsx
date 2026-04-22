'use client'

import type { Priority } from '@/lib/intelligence/contracts'

interface PriorityStripProps {
  priority: Priority
}

const COLORS: Record<Priority, string> = {
  must: 'var(--accent-coral)',
  should: 'var(--accent-amber)',
  fyi: 'var(--text-soft)',
}

export default function PriorityStrip({ priority }: PriorityStripProps) {
  return (
    <span
      aria-label={`Priority ${priority}`}
      className="inline-block h-full min-h-6 w-1 shrink-0 rounded-full"
      style={{ background: COLORS[priority] }}
    />
  )
}
