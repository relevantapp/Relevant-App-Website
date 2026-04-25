'use client'

import {
  Database,
  Plus,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'

interface ResultCommandBarProps {
  /** Optional subject of the current brief — rendered on the left as orientation. */
  subject?: string | null
  /** Optional workflow label rendered as a kicker. */
  workflowLabel?: string | null
  onNewSearch?: () => void
  onViewEvidence?: () => void
  children?: ReactNode
}

const HIDE_THRESHOLD = 12

export default function ResultCommandBar({
  subject,
  workflowLabel,
  onNewSearch,
  onViewEvidence,
  children,
}: ResultCommandBarProps) {
  const [hidden, setHidden] = useState(false)
  const lastYRef = useRef<number>(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mobileOnly = typeof window.matchMedia === 'function'
      ? window.matchMedia('(max-width: 899px)')
      : null
    if (!mobileOnly?.matches) {
      setHidden(false)
      return
    }

    const handleScroll = () => {
      const current = window.scrollY
      const delta = current - lastYRef.current
      if (current < 60) {
        setHidden(false)
      } else if (delta > HIDE_THRESHOLD) {
        setHidden(true)
      } else if (delta < -HIDE_THRESHOLD) {
        setHidden(false)
      }
      lastYRef.current = current
    }

    const handleResize = () => {
      if (!mobileOnly.matches) setHidden(false)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div
      className={`result-command-bar ${hidden ? 'is-hidden' : ''}`}
      role="toolbar"
      aria-label="Result actions"
    >
      <div className="result-command-bar-subject">
        {workflowLabel && (
          <span className="kicker" style={{ color: 'var(--accent)' }}>{workflowLabel}</span>
        )}
        {subject && (
          <span className="result-command-bar-subject-name" title={subject}>
            {subject}
          </span>
        )}
      </div>

      <div className="result-command-bar-actions">
        <CommandButton onClick={onNewSearch} icon={<Plus className="h-3.5 w-3.5" aria-hidden="true" />} label="New search" />
        <CommandButton onClick={onViewEvidence} icon={<Database className="h-3.5 w-3.5" aria-hidden="true" />} label="Evidence" />
        {children}
      </div>

      <style jsx>{`
        .result-command-bar {
          position: sticky;
          top: 16px;
          z-index: 40;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
          padding: 10px 12px 10px 16px;
          border: 1px solid var(--border);
          border-radius: 14px;
          background: color-mix(in oklch, var(--bg-elevated) 90%, transparent);
          backdrop-filter: blur(14px);
          box-shadow: 0 16px 44px rgba(0, 0, 0, 0.14);
          transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1), opacity 220ms ease;
        }
        .result-command-bar.is-hidden {
          transform: translateY(-110%);
          opacity: 0;
          pointer-events: none;
        }
        .result-command-bar-subject {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
          flex: 1 1 auto;
        }
        .result-command-bar-subject-name {
          font-size: 13px;
          color: var(--text);
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .result-command-bar-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
        }
        @media (max-width: 640px) {
          .result-command-bar {
            border-radius: 14px;
            align-items: stretch;
            flex-direction: column;
            padding: 10px;
            top: 8px;
          }
          .result-command-bar-actions {
            justify-content: flex-start;
          }
        }
      `}</style>
    </div>
  )
}

function CommandButton({
  onClick,
  icon,
  label,
}: {
  onClick?: () => void
  icon: React.ReactNode
  label: string
}) {
  const disabled = !onClick
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="command-button"
    >
      {icon}
      <span className="command-button-label">{label}</span>

      <style jsx>{`
        .command-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border: 1px solid var(--border);
          border-radius: 9999px;
          background: var(--surface);
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 500;
          transition: color 140ms ease, border-color 140ms ease;
          cursor: pointer;
        }
        .command-button:hover:not(:disabled) {
          color: var(--text);
          border-color: var(--accent);
        }
        .command-button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .command-button:focus-visible {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 2px var(--accent);
          color: var(--text);
        }
        @media (max-width: 640px) {
          .command-button-label {
            display: none;
          }
        }
      `}</style>
    </button>
  )
}
