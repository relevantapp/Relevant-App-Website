'use client'

import { useState, useCallback } from 'react'
import { Search, X, Plus, Loader2 } from 'lucide-react'
import type { MeetingType } from '@/lib/intelligence/types'
import { MEETING_TYPE_OPTIONS } from './types'

interface IntelligenceFormProps {
  onSubmit: (data: FormData) => void
  loading: boolean
}

export interface FormData {
  accountName: string
  website: string
  attendees: string[]
  meetingType: MeetingType
  goal: string
  notes: string
  competitors: string[]
}

export default function IntelligenceForm({ onSubmit, loading }: IntelligenceFormProps) {
  const [accountName, setAccountName] = useState('')
  const [website, setWebsite] = useState('')
  const [attendees, setAttendees] = useState<string[]>([])
  const [attendeeInput, setAttendeeInput] = useState('')
  const [meetingType, setMeetingType] = useState<MeetingType>('sales')
  const [goal, setGoal] = useState('')
  const [notes, setNotes] = useState('')
  const [competitors, setCompetitors] = useState<string[]>([])
  const [competitorInput, setCompetitorInput] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  const addAttendee = useCallback(() => {
    const name = attendeeInput.trim()
    if (name && !attendees.includes(name) && attendees.length < 5) {
      setAttendees((prev) => [...prev, name])
      setAttendeeInput('')
    }
  }, [attendeeInput, attendees])

  const removeAttendee = useCallback((name: string) => {
    setAttendees((prev) => prev.filter((a) => a !== name))
  }, [])

  const addCompetitor = useCallback(() => {
    const name = competitorInput.trim()
    if (name && !competitors.includes(name) && competitors.length < 3) {
      setCompetitors((prev) => [...prev, name])
      setCompetitorInput('')
    }
  }, [competitorInput, competitors])

  const removeCompetitor = useCallback((name: string) => {
    setCompetitors((prev) => prev.filter((c) => c !== name))
  }, [])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!accountName.trim() || !goal.trim()) return
      onSubmit({ accountName, website, attendees, meetingType, goal, notes, competitors })
    },
    [accountName, website, attendees, meetingType, goal, notes, competitors, onSubmit]
  )

  const canSubmit = accountName.trim().length > 0 && goal.trim().length > 0 && !loading

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-2xl space-y-5">
      {/* Account Name */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
          Who are you meeting with?
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-soft)]" />
          <input
            type="text"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="Company or person name"
            className="w-full rounded-lg border border-[var(--surface-strong)] bg-[var(--surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--text)] placeholder:text-[var(--text-soft)] focus:border-[var(--accent)] focus:outline-none"
            required
            maxLength={200}
          />
        </div>
      </div>

      {/* Meeting Type Chips */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--text)]">
          Meeting type
        </label>
        <div className="flex flex-wrap gap-2">
          {MEETING_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setMeetingType(opt.value)}
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                meetingType === opt.value
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-strong)]'
              }`}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Goal */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
          What&apos;s your goal?
        </label>
        <input
          type="text"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Close the deal / Explore partnership / Raise Series A"
          className="w-full rounded-lg border border-[var(--surface-strong)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-soft)] focus:border-[var(--accent)] focus:outline-none"
          required
          maxLength={500}
        />
      </div>

      {/* Website */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
          Website <span className="text-[var(--text-soft)]">(optional)</span>
        </label>
        <input
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://example.com"
          className="w-full rounded-lg border border-[var(--surface-strong)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-soft)] focus:border-[var(--accent)] focus:outline-none"
          maxLength={500}
        />
      </div>

      {/* Attendees */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
          Attendees <span className="text-[var(--text-soft)]">(optional, up to 5)</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={attendeeInput}
            onChange={(e) => setAttendeeInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAttendee() } }}
            placeholder="Name, then press Enter"
            className="flex-1 rounded-lg border border-[var(--surface-strong)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-soft)] focus:border-[var(--accent)] focus:outline-none"
            maxLength={100}
          />
          <button
            type="button"
            onClick={addAttendee}
            disabled={!attendeeInput.trim() || attendees.length >= 5}
            className="rounded-lg bg-[var(--surface)] p-2.5 text-[var(--text-muted)] hover:bg-[var(--surface-strong)] disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {attendees.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {attendees.map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--accent)]/15 px-3 py-1 text-sm text-[var(--accent)]"
              >
                {name}
                <button type="button" onClick={() => removeAttendee(name)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Advanced toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
      >
        {showAdvanced ? '− Less options' : '+ More options'}
      </button>

      {showAdvanced && (
        <div className="space-y-4">
          {/* Notes */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
              Context / Notes <span className="text-[var(--text-soft)]">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any background you already know..."
              rows={3}
              className="w-full rounded-lg border border-[var(--surface-strong)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-soft)] focus:border-[var(--accent)] focus:outline-none resize-none"
              maxLength={2000}
            />
          </div>

          {/* Competitors */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text)]">
              Competitors <span className="text-[var(--text-soft)]">(optional, up to 3)</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={competitorInput}
                onChange={(e) => setCompetitorInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCompetitor() } }}
                placeholder="Competitor name"
                className="flex-1 rounded-lg border border-[var(--surface-strong)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-soft)] focus:border-[var(--accent)] focus:outline-none"
                maxLength={100}
              />
              <button
                type="button"
                onClick={addCompetitor}
                disabled={!competitorInput.trim() || competitors.length >= 3}
                className="rounded-lg bg-[var(--surface)] p-2.5 text-[var(--text-muted)] hover:bg-[var(--surface-strong)] disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {competitors.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {competitors.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-coral)]/15 px-3 py-1 text-sm text-[var(--accent-coral)]"
                  >
                    {name}
                    <button type="button" onClick={() => removeCompetitor(name)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating brief...
          </span>
        ) : (
          'Generate Intelligence Brief'
        )}
      </button>
    </form>
  )
}
