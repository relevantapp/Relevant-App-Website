'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Loader2, Briefcase, AlertCircle, ArrowLeft } from 'lucide-react'
import ResearchTypeSelector from './ResearchTypeSelector'
import ResearchConfirmation from './ResearchConfirmation'
import MeetingPrepForm from './forms/MeetingPrepForm'
import BusinessCaseForm from './forms/BusinessCaseForm'
import CompetitiveAnalysisForm from './forms/CompetitiveAnalysisForm'
import MarketResearchForm from './forms/MarketResearchForm'
import IntelligenceResults from './IntelligenceResults'
import CompetitiveResults from './results/CompetitiveResults'
import BusinessCaseResults from './results/BusinessCaseResults'
import MarketResearchResults from './results/MarketResearchResults'
import FollowUpChat from './results/shared/FollowUpChat'
import ActivityRail from './ActivityRail'
import { useIntelligenceStream } from '@/hooks/useIntelligenceStream'
import { MODEL_STORAGE_KEY, normalizeModelPreference } from '@/lib/intelligence/models'
import type {
  MeetingPrepBrief,
  CompetitiveAnalysisBrief,
  BusinessCaseBrief,
  MarketResearchBrief,
} from '@/lib/intelligence/contracts'
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
  const [pendingInput, setPendingInput] = useState<IntelligenceInput | null>(null)
  const { state: streamState, generate, abort, reset } = useIntelligenceStream()
  const [savedBriefId, setSavedBriefId] = useState<string | null>(null)
  const savingRef = useRef(false)

  const brief = streamState.brief
  const loading = streamState.isStreaming
  const error = streamState.error

  // Auto-save brief when ready
  useEffect(() => {
    if (!brief || savingRef.current || savedBriefId) return
    savingRef.current = true
    import('@/lib/supabase').then(({ getValidAccessToken }) =>
      getValidAccessToken(180).then((token) =>
        fetch('/api/intelligence/briefs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: 'save', researchType: brief.researchType, requestPayload: {}, brief }),
        })
          .then((r) => r.json())
          .then((d) => { if (d.id) setSavedBriefId(d.id) })
          .catch(() => {})
          .finally(() => { savingRef.current = false }),
      ),
    )
  }, [brief, savedBriefId])

  const handleSubmit = useCallback((input: IntelligenceInput) => {
    setPendingInput(input)
  }, [])

  const handleConfirm = useCallback(async () => {
    if (!pendingInput) return
    const input = pendingInput
    setPendingInput(null)

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
        relationshipStage: input.relationshipStage || undefined,
        whatYoureSelling: input.whatYoureSelling || undefined,
        desiredNextStep: input.desiredNextStep || undefined,
        painPoints: input.painPoints?.length ? input.painPoints : undefined,
      }
    } else if (input.researchType === 'competitive_analysis') {
      apiBody = {
        researchType: 'competitive_analysis',
        competitors: input.competitors,
        yourCompany: input.yourCompany,
        focusArea: input.focusArea,
        specificQuestions: input.specificQuestions || undefined,
        marketSegment: input.marketSegment || undefined,
        geography: input.geography || undefined,
        customerType: input.customerType || undefined,
        useCasePreset: input.useCasePreset || undefined,
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
        decisionType: input.decisionType || undefined,
        decisionAudience: input.decisionAudience || undefined,
        timeHorizon: input.timeHorizon || undefined,
        investmentLevel: input.investmentLevel || undefined,
        roiFrame: input.roiFrame?.length ? input.roiFrame : undefined,
      }
    } else {
      apiBody = {
        researchType: 'market_research',
        marketOrTrend: input.marketOrTrend,
        scope: input.scope,
        keyQuestions: input.keyQuestions || undefined,
        knownPlayers: input.knownPlayers?.length ? input.knownPlayers : undefined,
        timeHorizon: input.timeHorizon || '90d',
        objective: input.objective || undefined,
        region: input.region || undefined,
        customerSegment: input.customerSegment || undefined,
        useCase: input.useCase || undefined,
        depth: input.depth || undefined,
      }
    }

    await generate({
      ...apiBody,
      preferredModel: typeof window !== 'undefined'
        ? normalizeModelPreference(localStorage.getItem(MODEL_STORAGE_KEY))
        : undefined,
    })
  }, [generate, pendingInput])

  const handleNewSearch = useCallback(() => {
    reset()
    setSavedBriefId(null)
    setPendingInput(null)
  }, [reset])

  const handleBack = useCallback(() => {
    setSelectedType(null)
    setPendingInput(null)
    reset()
  }, [reset])

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
    const researchType = brief.researchType
    return (
      <div className="px-4 py-6 sm:px-6">
        {brief.status?.degraded && (
          <div className="mx-auto mb-4 max-w-4xl rounded-xl border border-[var(--accent-coral)]/30 bg-[var(--accent-coral)]/10 p-4">
            <div className="flex items-center gap-2 text-sm text-[var(--accent-coral)]">
              <AlertCircle className="h-4 w-4 shrink-0" />
              AI analysis unavailable — showing raw evidence
            </div>
          </div>
        )}
        {researchType === 'meeting_prep' && (
          <IntelligenceResults brief={brief as MeetingPrepBrief} onNewSearch={handleNewSearch} savedBriefId={savedBriefId} />
        )}
        {researchType === 'competitive_analysis' && (
          <CompetitiveResults brief={brief as CompetitiveAnalysisBrief} onNewSearch={handleNewSearch} savedBriefId={savedBriefId} />
        )}
        {researchType === 'business_case' && (
          <BusinessCaseResults brief={brief as BusinessCaseBrief} onNewSearch={handleNewSearch} savedBriefId={savedBriefId} />
        )}
        {researchType === 'market_research' && (
          <MarketResearchResults brief={brief as MarketResearchBrief} onNewSearch={handleNewSearch} savedBriefId={savedBriefId} />
        )}
        <FollowUpChat briefId={savedBriefId} researchType={researchType ?? undefined} />
      </div>
    )
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-8 sm:py-12">
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

        {/* Streaming activity rail */}
        {loading && (
          <div className="mb-6">
            <ActivityRail state={streamState} />
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={abort}
                className="rounded-lg border border-[var(--surface-strong)] bg-[var(--surface)] px-4 py-2 text-xs text-[var(--text-muted)] transition-colors hover:border-[var(--accent-coral)] hover:text-[var(--accent-coral)]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Research type selector (if no type selected) */}
        {!selectedType && !loading && !pendingInput && <ResearchTypeSelector selected={null} onSelect={setSelectedType} />}

        {/* Step 2a: Confirmation step */}
        {pendingInput && !loading && (
          <ResearchConfirmation
            input={pendingInput}
            onConfirm={() => void handleConfirm()}
            onEdit={() => setPendingInput(null)}
            loading={loading}
          />
        )}

        {/* Step 2: Per-type form */}
        {selectedType && !loading && !pendingInput && (
          <div>
            <button
              type="button"
              onClick={handleBack}
              className="mb-5 inline-flex items-center gap-1.5 bg-transparent p-0 text-[13px] text-[var(--text-muted)] hover:text-[var(--text)] sm:mb-6"
              style={{ border: 'none', cursor: 'pointer' }}
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
