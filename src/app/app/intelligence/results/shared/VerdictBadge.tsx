'use client'

import { CheckCircle2, AlertCircle, MinusCircle, HelpCircle } from 'lucide-react'

type Verdict = 'strong' | 'moderate' | 'weak' | 'insufficient_data'

interface VerdictBadgeProps {
  verdict: Verdict
  rationale?: string
}

const CONFIG: Record<Verdict, { label: string; icon: React.ReactNode; bg: string; text: string; border: string }> = {
  strong: {
    label: 'Strong Case',
    icon: <CheckCircle2 className="h-6 w-6" />,
    bg: 'bg-[var(--accent-teal)]/10',
    text: 'text-[var(--accent-teal)]',
    border: 'border-[var(--accent-teal)]/20',
  },
  moderate: {
    label: 'Moderate Case',
    icon: <MinusCircle className="h-6 w-6" />,
    bg: 'bg-[var(--accent-amber)]/10',
    text: 'text-[var(--accent-amber)]',
    border: 'border-[var(--accent-amber)]/20',
  },
  weak: {
    label: 'Weak Case',
    icon: <AlertCircle className="h-6 w-6" />,
    bg: 'bg-[var(--accent-coral)]/10',
    text: 'text-[var(--accent-coral)]',
    border: 'border-[var(--accent-coral)]/20',
  },
  insufficient_data: {
    label: 'Need More Data',
    icon: <HelpCircle className="h-6 w-6" />,
    bg: 'bg-[var(--surface-strong)]',
    text: 'text-[var(--text-muted)]',
    border: 'border-[var(--surface-strong)]',
  },
}

export default function VerdictBadge({ verdict, rationale }: VerdictBadgeProps) {
  const c = CONFIG[verdict]

  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-5`}>
      <div className={`flex items-center gap-3 ${c.text}`}>
        {c.icon}
        <span className="text-lg font-bold">{c.label}</span>
      </div>
      {rationale && (
        <p className="mt-3 text-sm text-[var(--text-muted)] leading-relaxed">{rationale}</p>
      )}
    </div>
  )
}
