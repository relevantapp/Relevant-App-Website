'use client'

import Link from 'next/link'
import { Clock3 } from 'lucide-react'

interface HistoryButtonProps {
  compact?: boolean
}

export default function HistoryButton({ compact = false }: HistoryButtonProps) {
  return (
    <Link
      href="/app/intelligence/history"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: compact ? '6px 14px' : '8px 14px',
        fontSize: compact ? 12 : 13,
        color: 'var(--text-muted)',
        background: 'transparent',
        border: '1px solid var(--border)',
        borderRadius: 9999,
        textDecoration: 'none',
        cursor: 'pointer',
      }}
    >
      <Clock3 size={compact ? 14 : 15} />
      History
    </Link>
  )
}
