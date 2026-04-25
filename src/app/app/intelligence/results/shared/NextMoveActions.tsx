'use client'

import { Calendar, Copy, Mail, MessageSquare } from 'lucide-react'
import { useState } from 'react'

interface NextMoveActionsProps {
  /** The recommended-next text to copy / share. */
  text: string
  /** Optional subject name (e.g. person or company) used in email/calendar defaults. */
  subject?: string | null
  /** Optional headline used for email subject + calendar title. */
  headline?: string | null
  /** Optional callback after copy succeeds. */
  onCopy?: () => void
  /** Optional override for the rendered label block next to the actions. */
  actionLabel?: string
  /** Optional ISO start time for calendar block. Defaults to one hour from now. */
  calendarStart?: string | null
  /** Optional duration in minutes for the calendar block. Defaults to 30. */
  calendarDurationMinutes?: number
}

const ICS_HEADER = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Relevant Intelligence//EN'
const ICS_FOOTER = 'END:VCALENDAR'

function formatIcsDate(iso: string | null | undefined, fallback: Date): string {
  const d = iso ? new Date(iso) : fallback
  const valid = !Number.isNaN(d.getTime()) ? d : fallback
  return valid.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function buildIcs({
  title,
  description,
  start,
  durationMinutes,
}: {
  title: string
  description: string
  start: string | null | undefined
  durationMinutes: number
}): string {
  const now = new Date()
  const startDate = start && !Number.isNaN(new Date(start).getTime())
    ? new Date(start)
    : new Date(now.getTime() + 60 * 60 * 1000)
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000)

  const lines = [
    ICS_HEADER,
    'BEGIN:VEVENT',
    `UID:${Date.now()}@relevant-intelligence`,
    `DTSTAMP:${formatIcsDate(now.toISOString(), now)}`,
    `DTSTART:${formatIcsDate(startDate.toISOString(), startDate)}`,
    `DTEND:${formatIcsDate(endDate.toISOString(), endDate)}`,
    `SUMMARY:${title.replace(/\n/g, ' ')}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    'END:VEVENT',
    ICS_FOOTER,
  ]
  return lines.join('\n')
}

function buildSlackBlock(text: string, headline?: string | null): string {
  const lines: string[] = []
  if (headline) lines.push(`*${headline}*`)
  lines.push('', text.trim())
  return lines.join('\n')
}

export default function NextMoveActions({
  text,
  subject,
  headline,
  onCopy,
  actionLabel,
  calendarStart,
  calendarDurationMinutes = 30,
}: NextMoveActionsProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle')
  const [slackState, setSlackState] = useState<'idle' | 'copied'>('idle')

  const resolvedTitle = headline ?? (subject ? `Follow-up: ${subject}` : 'Follow-up')

  const flash = (setter: (v: 'idle' | 'copied') => void) => {
    setter('copied')
    window.setTimeout(() => setter('idle'), 1600)
  }

  const handleCopy = async () => {
    if (!navigator.clipboard?.writeText) return
    await navigator.clipboard.writeText(text.trim())
    flash(setCopyState)
    onCopy?.()
  }

  const handleEmail = () => {
    const subjectLine = headline ? headline : `Follow-up${subject ? ` — ${subject}` : ''}`
    const href = `mailto:?subject=${encodeURIComponent(subjectLine)}&body=${encodeURIComponent(text.trim())}`
    window.location.href = href
  }

  const handleCalendar = () => {
    const ics = buildIcs({
      title: resolvedTitle,
      description: text.trim(),
      start: calendarStart,
      durationMinutes: calendarDurationMinutes,
    })
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${resolvedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.setTimeout(() => URL.revokeObjectURL(url), 2000)
  }

  const handleSlack = async () => {
    if (!navigator.clipboard?.writeText) return
    await navigator.clipboard.writeText(buildSlackBlock(text, headline))
    flash(setSlackState)
  }

  return (
    <div className="next-move-actions" role="group" aria-label="Next move actions">
      {actionLabel && (
        <span className="next-move-label kicker" style={{ color: 'var(--accent-amber)' }}>
          {actionLabel}
        </span>
      )}

      <div className="next-move-row">
        <button type="button" onClick={() => void handleCopy()} className="next-move-btn" aria-label="Copy recommended text to clipboard">
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{copyState === 'copied' ? 'Copied' : 'Copy'}</span>
        </button>

        <button type="button" onClick={handleEmail} className="next-move-btn" aria-label="Draft email">
          <Mail className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Draft email</span>
        </button>

        <button type="button" onClick={handleCalendar} className="next-move-btn" aria-label="Download calendar block">
          <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Calendar block</span>
        </button>

        <button type="button" onClick={() => void handleSlack()} className="next-move-btn" aria-label="Copy Slack-formatted block">
          <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{slackState === 'copied' ? 'Copied' : 'Slack copy'}</span>
        </button>
      </div>

      <style jsx>{`
        .next-move-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .next-move-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .next-move-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 12px;
          border: 1px solid var(--border);
          border-radius: 9999px;
          background: var(--surface);
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 500;
          transition: color 140ms ease, border-color 140ms ease, background 140ms ease;
          cursor: pointer;
        }
        .next-move-btn:hover {
          color: var(--text);
          border-color: var(--accent);
        }
        .next-move-btn:focus-visible {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 2px var(--accent);
          color: var(--text);
        }
      `}</style>
    </div>
  )
}
