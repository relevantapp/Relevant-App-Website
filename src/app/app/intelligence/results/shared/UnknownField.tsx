'use client'

import { useId, useState } from 'react'

interface UnknownFieldProps {
  label: string
  queriesTried?: string[]
}

export default function UnknownField({ label, queriesTried }: UnknownFieldProps) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const queries = queriesTried?.length ? queriesTried : ['no queries recorded.']

  return (
    <span
      className="relative inline-flex max-w-full flex-col items-start"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-full border border-dashed border-[var(--border-strong)] px-2.5 py-1 text-left text-xs text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-elevated)]"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false)
        }}
      >
        <span className="font-medium text-[var(--text-soft)]">{label}:</span>
        <span>unknown - we couldn't verify</span>
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute left-0 top-[calc(100%+0.5rem)] z-20 w-72 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)]"
          role="status"
        >
          <p className="kicker">Queries tried</p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--text-muted)]">
            {queries.map((query) => (
              <li key={query} className="rounded-xl bg-[var(--surface)] px-3 py-2">
                {query}
              </li>
            ))}
          </ul>
        </div>
      )}
    </span>
  )
}
