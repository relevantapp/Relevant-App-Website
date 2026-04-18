'use client'

import { useState, useCallback, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getValidAccessToken } from '@/lib/supabase'
import { Loader2, Briefcase, AlertCircle, ArrowLeft } from 'lucide-react'
import ResearchTypeSelector from './ResearchTypeSelector'
import MeetingPrepForm from './forms/MeetingPrepForm'
import BusinessCaseForm from './forms/BusinessCaseForm'
import CompetitiveAnalysisForm from './forms/CompetitiveAnalysisForm'
import MarketResearchForm from './forms/MarketResearchForm'
import IntelligenceResults from './IntelligenceResults'
import CompetitiveResults from './results/CompetitiveResults'
import BusinessCaseResults from './results/BusinessCaseResults'
import MarketResearchResults from './results/MarketResearchResults'
import type { IntelligenceBrief } from './types'
import type {
  CompetitiveAnalysisBrief,
  BusinessCaseBrief,
  MarketResearchBrief,
  IntelligenceBriefV3,
} from './types'
import type {
  ResearchType,
  IntelligenceInput,
  MeetingPrepInput,
  BusinessCaseInput,
  CompetitiveAnalysisInput,
  MarketResearchInput,
} from './types'

type FormStates = {
  meeting_prep: Partial<MeetingPrepInput>
  business_case: Partial<BusinessCaseInput>
  competitive_analysis: Partial<CompetitiveAnalysisInput>
  market_research: Partial<MarketResearchInput>
}

const INITIAL_FORM_STATES: FormStates = {
  meeting_prep: {},
  business_case: {},
  competitive_analysis: {},
  market_research: {},
}

export default function IntelligencePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [selectedType, setSelectedType] = useState<ResearchType | null>(null)
  const [formStates, setFormStates] = useState<FormStates>({ ...INITIAL_FORM_STATES })
  const [brief, setBrief] = useState<IntelligenceBrief | null>(null)
  const [v3Brief, setV3Brief] = useState<IntelligenceBriefV3 | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const loadingCancelledRef = useRef(false)

  const handleSubmit = useCallback(async (input: IntelligenceInput) => {
    setLoading(true)
    setError(null)
    setBrief(null)
    setV3Brief(null)
    loadingCancelledRef.current = false

    try {
      const token = await getValidAccessToken(180)
      if (!token) {
        setError('Please sign in to use Intelligence.')
        setLoading(false)
        return
      }

      // Build request body based on research type
      let apiBody: Record<string, unknown>

      if (input.researchType === 'meeting_prep') {
        apiBody = {
          researchType: 'meeting_prep',
          accountName: input.accountName,
          website: input.website || undefined,
          attendees: input.attendees?.map((a) => a.name) || undefined,
          meetingType: mapMeetingType(input.meetingType),
          goal: input.goal,
          notes: input.context || undefined,
          competitors: input.competitors?.length ? input.competitors : undefined,
        }
      } else if (input.researchType === 'competitive_analysis') {
        apiBody = {
          researchType: 'competitive_analysis',
          competitors: input.competitors,
          yourCompany: input.yourCompany || undefined,
          focusArea: input.focusArea,
          specificQuestions: input.specificQuestions || undefined,
        }
      } else if (input.researchType === 'business_case') {
        apiBody = {
          researchType: 'business_case',
          initiativeName: input.initiativeName,
          hypothesis: input.hypothesis,
          targetMarket: input.targetMarket || undefined,
          successMetrics: input.successMetrics?.length ? input.successMetrics : undefined,
          keyQuestions: input.keyQuestions || undefined,
          comparableCompanies: input.comparableCompanies?.length ? input.comparableCompanies : undefined,
        }
      } else {
        apiBody = {
          researchType: 'market_research',
          marketOrTrend: input.marketOrTrend,
          scope: input.scope,
          keyQuestions: input.keyQuestions || undefined,
          knownPlayers: input.knownPlayers?.length ? input.knownPlayers : undefined,
          timeHorizon: input.timeHorizon || '90d',
        }
      }

      const res = await fetch('/api/intelligence', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiBody),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Request failed' }))
        setError(errData.error || `Request failed (${res.status})`)
        setLoading(false)
        return
      }

      const briefData = await res.json()

      // Meeting prep returns V2 format, others return V3
      if (input.researchType === 'meeting_prep') {
        setBrief(briefData as IntelligenceBrief)
      } else {
        setV3Brief(briefData as IntelligenceBriefV3)
      }
    } catch (err) {
      console.error('[intelligence] fetch failed:', err)
      setError('Failed to generate brief. Please try again.')
    } finally {
      setLoading(false)
      loadingCancelledRef.current = true
    }
  }, [])

  const handleNewSearch = useCallback(() => {
    setBrief(null)
    setV3Brief(null)
    setError(null)
  }, [])

  const handleBack = useCallback(() => {
    setSelectedType(null)
    setError(null)
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
  if (brief || v3Brief) {
    return (
      <div className="px-4 py-6 sm:px-6">
        {(brief?.status?.degraded || v3Brief?.status?.degraded) && (
          <div className="mx-auto mb-4 max-w-4xl rounded-xl border border-[var(--accent-coral)]/30 bg-[var(--accent-coral)]/10 p-4">
            <div className="flex items-center gap-2 text-sm text-[var(--accent-coral)]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              AI analysis unavailable — showing raw evidence
            </div>
          </div>
        )}
        {brief && <IntelligenceResults brief={brief} onNewSearch={handleNewSearch} />}
        {v3Brief?.researchType === 'competitive_analysis' && (
          <CompetitiveResults brief={v3Brief as CompetitiveAnalysisBrief} onNewSearch={handleNewSearch} />
        )}
        {v3Brief?.researchType === 'business_case' && (
          <BusinessCaseResults brief={v3Brief as BusinessCaseBrief} onNewSearch={handleNewSearch} />
        )}
        {v3Brief?.researchType === 'market_research' && (
          <MarketResearchResults brief={v3Brief as MarketResearchBrief} onNewSearch={handleNewSearch} />
        )}
      </div>
    )
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-[var(--accent-coral)]/30 bg-[var(--accent-coral)]/10 p-4">
            <div className="flex items-center gap-2 text-sm text-[var(--accent-coral)]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="mb-6">
            <div className="mb-4 text-center">
              <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-[var(--accent)]" />
              <p className="text-sm text-[var(--text-muted)]">Researching...</p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {[120, 120, 180, 180].map((h, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-[var(--surface-strong)] bg-[var(--surface)] intel-skeleton"
                  style={{ height: h }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Research type selector (if no type selected) */}
        {!selectedType && !loading && <ResearchTypeSelector selected={null} onSelect={setSelectedType} />}

        {/* Step 2: Per-type form */}
        {selectedType && !loading && (
          <div>
            <button
              type="button"
              onClick={handleBack}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'none',
                border: 'none',
                fontSize: 13,
                color: 'var(--text-muted)',
                cursor: 'pointer',
                marginBottom: 24,
                padding: 0,
              }}
            >
              <ArrowLeft size={14} />
              Back
            </button>

            {selectedType === 'meeting_prep' && (
              <MeetingPrepForm
                value={formStates.meeting_prep}
                onChange={(v) => setFormStates((s) => ({ ...s, meeting_prep: v }))}
                onSubmit={handleSubmit}
                loading={loading}
              />
            )}
            {selectedType === 'business_case' && (
              <BusinessCaseForm
                value={formStates.business_case}
                onChange={(v) => setFormStates((s) => ({ ...s, business_case: v }))}
                onSubmit={handleSubmit}
                loading={loading}
              />
            )}
            {selectedType === 'competitive_analysis' && (
              <CompetitiveAnalysisForm
                value={formStates.competitive_analysis}
                onChange={(v) => setFormStates((s) => ({ ...s, competitive_analysis: v }))}
                onSubmit={handleSubmit}
                loading={loading}
              />
            )}
            {selectedType === 'market_research' && (
              <MarketResearchForm
                value={formStates.market_research}
                onChange={(v) => setFormStates((s) => ({ ...s, market_research: v }))}
                onSubmit={handleSubmit}
                loading={loading}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/** Map V3 meeting type to V2 meeting type for backward compat */
function mapMeetingType(v3Type: string): string {
  const map: Record<string, string> = {
    customer: 'client',
    partner: 'partner',
    reseller: 'partner',
    investor: 'investor',
    board: 'board',
    internal: 'general',
    other: 'general',
  }
  return map[v3Type] ?? 'general'
}
