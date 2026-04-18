'use client'

import { useState, useCallback, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getValidAccessToken } from '@/lib/supabase'
import { Loader2, AlertCircle, Briefcase } from 'lucide-react'
import IntelligenceForm from './IntelligenceForm'
import type { FormData } from './IntelligenceForm'
import IntelligenceResults from './IntelligenceResults'
import type { IntelligenceBrief } from './types'

const LOADING_STEPS = [
  'Researching {account}...',
  'Analyzing sources...',
  'Building your briefing...',
]

export default function IntelligencePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [brief, setBrief] = useState<IntelligenceBrief | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingStep, setLoadingStep] = useState(0)
  const [accountLabel, setAccountLabel] = useState('')
  const loadingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const handleSubmit = useCallback(async (data: FormData) => {
    setLoading(true)
    setError(null)
    setBrief(null)
    setLoadingStep(0)
    setAccountLabel(data.accountName)

    const timer = setInterval(() => {
      setLoadingStep((prev) => Math.min(prev + 1, 2))
    }, 4000)
    loadingTimerRef.current = timer

    try {
      const token = await getValidAccessToken(180)
      if (!token) {
        setError('Please sign in to use Intelligence.')
        setLoading(false)
        clearInterval(timer)
        return
      }

      const res = await fetch('/api/intelligence', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountName: data.accountName,
          website: data.website || undefined,
          attendees: data.attendees.length ? data.attendees : undefined,
          meetingType: data.meetingType,
          goal: data.goal,
          notes: data.notes || undefined,
          competitors: data.competitors.length ? data.competitors : undefined,
        }),
      })

      clearInterval(timer)
      loadingTimerRef.current = null

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Request failed' }))
        setError(errData.error || `Request failed (${res.status})`)
        setLoading(false)
        return
      }

      const briefData: IntelligenceBrief = await res.json()
      setBrief(briefData)
    } catch (err) {
      console.error('[intelligence] fetch failed:', err)
      setError('Failed to generate brief. Please try again.')
    } finally {
      setLoading(false)
      if (loadingTimerRef.current) {
        clearInterval(loadingTimerRef.current)
        loadingTimerRef.current = null
      }
    }
  }, [])

  const handleNewSearch = useCallback(() => {
    setBrief(null)
    setError(null)
    setLoadingStep(0)
  }, [])

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <Briefcase className="h-8 w-8 text-[var(--text-soft)]" />
        <p className="text-[var(--text-muted)]">Sign in to use Intelligence.</p>
      </div>
    )
  }

  // Show results if we have a brief
  if (brief) {
    return (
      <div className="px-4 py-6 sm:px-6">
        <IntelligenceResults brief={brief} onNewSearch={handleNewSearch} />
      </div>
    )
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-[var(--text)]">Meeting Intelligence</h1>
        <p className="mt-1.5 text-sm text-[var(--text-muted)]">
          Know what matters before you walk in the room.
        </p>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="mb-6 w-full max-w-2xl">
          <div className="rounded-xl border border-[var(--surface-strong)] bg-[var(--surface)] p-6">
            <div className="space-y-3">
              {LOADING_STEPS.map((step, i) => {
                const label = step.replace('{account}', accountLabel)
                const isActive = i === loadingStep
                const isDone = i < loadingStep
                return (
                  <div key={i} className="flex items-center gap-3">
                    {isDone ? (
                      <div className="h-5 w-5 rounded-full bg-[var(--accent-teal)] flex items-center justify-center">
                        <span className="text-xs text-white">✓</span>
                      </div>
                    ) : isActive ? (
                      <Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border border-[var(--surface-strong)]" />
                    )}
                    <span className={`text-sm ${isActive ? 'text-[var(--text)]' : isDone ? 'text-[var(--text-muted)]' : 'text-[var(--text-soft)]'}`}>
                      {label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 w-full max-w-2xl rounded-xl border border-[var(--accent-coral)]/30 bg-[var(--accent-coral)]/10 p-4">
          <div className="flex items-center gap-2 text-sm text-[var(--accent-coral)]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        </div>
      )}

      {/* Form */}
      <IntelligenceForm onSubmit={handleSubmit} loading={loading} />
    </div>
  )
}
