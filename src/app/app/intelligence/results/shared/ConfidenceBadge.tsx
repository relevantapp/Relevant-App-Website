'use client'

import { AlertTriangle, CheckCircle2, MinusCircle } from 'lucide-react'
import type { Confidence } from '@/lib/intelligence/contracts'

interface ConfidenceBadgeProps {
  level: Confidence
  driver?: string
}

const CONFIG = {
  high: {
    label: 'High confidence',
    color: 'var(--accent-teal)',
    background: 'color-mix(in oklch, var(--accent-teal) 12%, transparent)',
    Icon: CheckCircle2,
  },
  medium: {
    label: 'Medium confidence',
    color: 'var(--accent-amber)',
    background: 'color-mix(in oklch, var(--accent-amber) 14%, transparent)',
    Icon: AlertTriangle,
  },
  low: {
    label: 'Low confidence',
    color: 'var(--text-soft)',
    background: 'color-mix(in oklch, var(--text-soft) 12%, transparent)',
    Icon: MinusCircle,
  },
} as const

export default function ConfidenceBadge({ level, driver }: ConfidenceBadgeProps) {
  const { label, color, background, Icon } = CONFIG[level]

  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium"
      style={{ color, borderColor: color, background }}
      title={driver}
      aria-label={driver ? `${label}: ${driver}` : label}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{label}</span>
    </span>
  )
}
