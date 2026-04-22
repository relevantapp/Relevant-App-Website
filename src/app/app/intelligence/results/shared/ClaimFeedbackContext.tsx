'use client'

import { createContext, useCallback, useContext, useMemo } from 'react'
import type { PropsWithChildren } from 'react'
import type { ResearchType } from '@/lib/intelligence/contracts'
import type { ClaimFeedbackPayload } from '@/lib/intelligence/feedback'

type ClaimFeedbackSubmission = Omit<ClaimFeedbackPayload, 'briefId' | 'researchType'>

interface ClaimFeedbackContextValue {
  briefId: string | null
  researchType: ResearchType
  enabled: boolean
  submitFeedback: (payload: ClaimFeedbackSubmission) => Promise<void>
}

const ClaimFeedbackContext = createContext<ClaimFeedbackContextValue | null>(null)

export function ClaimFeedbackProvider({
  briefId,
  researchType,
  children,
}: PropsWithChildren<{ briefId?: string | null; researchType: ResearchType }>) {
  const submitFeedback = useCallback(async (payload: ClaimFeedbackSubmission) => {
    if (!briefId) return

    const { getValidAccessToken } = await import('@/lib/supabase')
    const token = await getValidAccessToken(180)

    const response = await fetch('/api/intelligence/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        briefId,
        researchType,
        ...payload,
      }),
    })

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}))
      throw new Error(errorPayload.error || 'Could not save claim feedback')
    }
  }, [briefId, researchType])

  const value = useMemo<ClaimFeedbackContextValue>(() => ({
    briefId: briefId ?? null,
    researchType,
    enabled: Boolean(briefId),
    submitFeedback,
  }), [briefId, researchType, submitFeedback])

  return (
    <ClaimFeedbackContext.Provider value={value}>
      {children}
    </ClaimFeedbackContext.Provider>
  )
}

export function useClaimFeedback() {
  const context = useContext(ClaimFeedbackContext)
  if (!context) return null
  return context
}
