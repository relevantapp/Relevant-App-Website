'use client'

interface AsOfChipProps {
  at?: string | null
  now?: Date
  prefix?: string
}

function formatCalendarLabel(date: Date) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function formatRelativeAsOf(at: string, now = new Date(), prefix = 'updated') {
  const target = new Date(at)
  if (Number.isNaN(target.getTime())) return null

  const diffMs = target.getTime() - now.getTime()
  const diffDays = Math.round(diffMs / 86400000)
  const absDays = Math.abs(diffDays)

  let detail = formatCalendarLabel(target)
  if (diffDays === 0) detail = 'today'
  else if (diffDays === -1) detail = 'yesterday'
  else if (diffDays === 1) detail = 'tomorrow'
  else if (diffDays < -1 && absDays < 30) detail = `${absDays} days ago`
  else if (diffDays > 1 && absDays < 30) detail = `in ${absDays} days`
  else if (diffDays <= -30 && diffDays > -60) detail = 'last month'
  else if (diffDays >= 30 && diffDays < 60) detail = 'next month'

  return `${prefix} ${detail}`
}

export default function AsOfChip({ at, now, prefix = 'updated' }: AsOfChipProps) {
  if (!at) return null

  const label = formatRelativeAsOf(at, now, prefix)
  if (!label) return null

  return (
    <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs text-[var(--text-muted)]">
      {label}
    </span>
  )
}
