'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import IntelligenceSetupNotice from './IntelligenceSetupNotice'
import ActivityRail from './ActivityRail'
import HistoryButton from './HistoryButton'
import { useIntelligenceStream } from '@/hooks/useIntelligenceStream'
import { MODEL_STORAGE_KEY, normalizeModelPreference } from '@/lib/intelligence/models'
import type {
  MeetingPrepBrief,
  CompetitiveAnalysisBrief,
  BusinessCaseBrief,
  MarketResearchBrief,
  IntelligenceBrief,
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

interface IntelligenceProviderStatus {
  key: string
  label: string
  purpose: string
  configured: boolean
}

interface IntelligenceSetupState {
  generateReady: boolean
  chatReady: boolean
  providers: IntelligenceProviderStatus[]
}

function buildApiBodyFromInput(input: IntelligenceInput): Record<string, unknown> {
  if (input.researchType === 'meeting_prep') {
    return {
      researchType: 'meeting_prep',
      accountName: input.accountName,
      website: input.website || undefined,
      attendees: input.attendees?.map((attendee) => attendee.name) || undefined,
      meetingType: mapMeetingType(input.meetingType),
      goal: input.goal,
      notes: input.context || undefined,
      competitors: input.competitors?.length ? input.competitors : undefined,
      relationshipStage: input.relationshipStage || undefined,
      whatYoureSelling: input.whatYoureSelling || undefined,
      desiredNextStep: input.desiredNextStep || undefined,
      painPoints: input.painPoints?.length ? input.painPoints : undefined,
      steering: input.steering || undefined,
    }
  }

  if (input.researchType === 'competitive_analysis') {
    return {
      researchType: 'competitive_analysis',
      competitors: input.competitors,
      yourCompany: input.yourCompany,
      focusArea: input.focusArea,
      specificQuestions: input.specificQuestions || undefined,
      marketSegment: input.marketSegment || undefined,
      geography: input.geography || undefined,
      customerType: input.customerType || undefined,
      useCasePreset: input.useCasePreset || undefined,
      steering: input.steering || undefined,
    }
  }

  if (input.researchType === 'business_case') {
    return {
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
      steering: input.steering || undefined,
    }
  }

  return {
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
    steering: input.steering || undefined,
  }
}

function getStoredPreferredModel() {
  return typeof window !== 'undefined'
    ? normalizeModelPreference(localStorage.getItem(MODEL_STORAGE_KEY))
    : undefined
}

export default function IntelligencePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedType, setSelectedType] = useState<ResearchType | null>(null)
  const [formStates, setFormStates] = useState<FormStates>({ ...INITIAL_FORM_STATES })
  const [pendingInput, setPendingInput] = useState<IntelligenceInput | null>(null)
  const [lastRequestPayload, setLastRequestPayload] = useState<Record<string, unknown> | null>(null)
  const { state: streamState, generate, abort, reset } = useIntelligenceStream()
  const [savedBriefId, setSavedBriefId] = useState<string | null>(null)
  const [loadedBrief, setLoadedBrief] = useState<IntelligenceBrief | null>(null)
  const [loadingSavedBrief, setLoadingSavedBrief] = useState(false)
  const [savedBriefError, setSavedBriefError] = useState<string | null>(null)
  const [setupState, setSetupState] = useState<IntelligenceSetupState | null>(null)
  const [setupLoading, setSetupLoading] = useState(true)

  const brief = loadedBrief ?? streamState.brief
  const loading = streamState.isStreaming || loadingSavedBrief
  const error = streamState.error ?? savedBriefError
  const briefParam = searchParams?.get('brief') ?? null
  const generateReady = setupState?.generateReady ?? true
  const chatReady = setupState?.chatReady ?? true

  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated) {
      setSetupState(null)
      setSetupLoading(false)
      return
    }

    let cancelled = false
    setSetupLoading(true)

    fetch('/api/intelligence/status', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('status_check_failed')
        const payload = await response.json()
        if (cancelled) return
        setSetupState({
          generateReady: Boolean(payload.generateReady),
          chatReady: Boolean(payload.chatReady),
          providers: Array.isArray(payload.providers) ? payload.providers : [],
        })
      })
      .catch(() => {
        if (cancelled) return
        setSetupState({
          generateReady: true,
          chatReady: true,
          providers: [],
        })
      })
      .finally(() => {
        if (!cancelled) setSetupLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [authLoading, isAuthenticated])

  useEffect(() => {
    if (streamState.brief?.id) setSavedBriefId(streamState.brief.id)
  }, [streamState.brief])

  useEffect(() => {
    if (!streamState.brief?.id || briefParam === streamState.brief.id) return

    const nextParams = new URLSearchParams(searchParams?.toString() ?? '')
    nextParams.set('brief', streamState.brief.id)
    router.replace(`/app/intelligence?${nextParams.toString()}`, { scroll: false })
  }, [briefParam, router, searchParams, streamState.brief?.id])

  useEffect(() => {
    if (!briefParam || authLoading || !isAuthenticated) return

    let cancelled = false
    setLoadingSavedBrief(true)
    setSavedBriefError(null)
    reset()

    import('@/lib/supabase').then(({ getValidAccessToken }) =>
      getValidAccessToken(180).then((token) =>
        fetch('/api/intelligence/briefs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action: 'get', briefId: briefParam }),
        })
          .then(async (response) => {
            const payload = await response.json().catch(() => ({}))
            if (!response.ok) throw new Error(payload.error || 'Brief not found')
            return payload.brief
          })
          .then((saved) => {
            if (cancelled) return
            const synthesis = saved?.synthesis as IntelligenceBrief | undefined
            if (!synthesis) throw new Error('Saved brief is missing content')
            setLoadedBrief({ ...synthesis, id: saved.id })
            setSavedBriefId(saved.id)
            setLastRequestPayload({
              researchType: saved.research_type,
              ...((saved.request_payload as Record<string, unknown> | undefined) ?? {}),
            })
          })
          .catch((err) => {
            if (!cancelled) setSavedBriefError(err instanceof Error ? err.message : 'Brief not found')
          })
          .finally(() => {
            if (!cancelled) setLoadingSavedBrief(false)
          }),
      ),
    )

    return () => {
      cancelled = true
    }
  }, [briefParam, authLoading, isAuthenticated, reset])

  const handleSubmit = useCallback((input: IntelligenceInput) => {
    setPendingInput(input)
  }, [])

  const handleConfirm = useCallback(async () => {
    if (!pendingInput || !generateReady) return
    const input = pendingInput
    setLoadedBrief(null)
    setSavedBriefId(null)
    const apiBody = buildApiBodyFromInput(input)
    setLastRequestPayload(apiBody)
    setPendingInput(null)

    await generate({
      ...apiBody,
      preferredModel: getStoredPreferredModel(),
    })
  }, [generate, generateReady, pendingInput])

  const handleRefresh = useCallback(() => {
    if (!lastRequestPayload || streamState.isStreaming || loadingSavedBrief || !generateReady) return

    setLoadedBrief(null)
    setSavedBriefId(null)
    setSavedBriefError(null)
    void generate({
      ...lastRequestPayload,
      preferredModel: getStoredPreferredModel(),
    })
  }, [generate, generateReady, lastRequestPayload, loadingSavedBrief, streamState.isStreaming])

  useEffect(() => {
    const onRefresh = () => {
      handleRefresh()
    }

    window.addEventListener('intel:refresh', onRefresh)
    return () => window.removeEventListener('intel:refresh', onRefresh)
  }, [handleRefresh])

  const handleNewSearch = useCallback(() => {
    reset()
    setSavedBriefId(null)
    setLoadedBrief(null)
    setSavedBriefError(null)
    setPendingInput(null)
    setLastRequestPayload(null)
    if (briefParam) {
      const nextParams = new URLSearchParams(searchParams?.toString() ?? '')
      nextParams.delete('brief')
      const nextQuery = nextParams.toString()
      router.replace(nextQuery ? `/app/intelligence?${nextQuery}` : '/app/intelligence', { scroll: false })
    }
  }, [briefParam, reset, router, searchParams])

  const handleBack = useCallback(() => {
    setSelectedType(null)
    setPendingInput(null)
    setLoadedBrief(null)
    reset()
  }, [reset])

  if (authLoading || (isAuthenticated && setupLoading && !brief)) {
    return (
      <div data-intel="v4" className="intel-shell">
        <div className="intel-stage flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div data-intel="v4" className="intel-shell">
        <div className="intel-stage flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
          <Briefcase className="h-8 w-8 text-[var(--text-soft)]" />
          <p className="text-[var(--text-muted)]">Sign in to use Intelligence.</p>
        </div>
      </div>
    )
  }

  // Show results if we have a brief
  if (brief) {
    const researchType = brief.researchType
    return (
      <div data-intel="v4" className="intel-shell">
        <div className="intel-stage">
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
          {chatReady && <FollowUpChat briefId={savedBriefId} researchType={researchType ?? undefined} />}
        </div>
      </div>
    )
  }

  const showSetupNotice = !loading && !pendingInput && !brief && !generateReady

  return (
    <div data-intel="v4" className="intel-shell">
      <div className="intel-stage min-h-[60vh]">
        <div className="mb-5 flex justify-end sm:mb-6">
          <HistoryButton />
        </div>

        {/* Error */}
        {error && (
          <div className="mx-auto mb-6 max-w-3xl rounded-xl border border-[var(--accent-coral)]/30 bg-[var(--accent-coral)]/10 p-4">
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

        {showSetupNotice && <IntelligenceSetupNotice providers={setupState?.providers ?? []} />}

        {/* Step 1: Research type selector (if no type selected) */}
        {!showSetupNotice && !selectedType && !loading && !pendingInput && <ResearchTypeSelector selected={null} onSelect={setSelectedType} />}

        {/* Step 2a: Confirmation step */}
        {!showSetupNotice && pendingInput && !loading && (
          <ResearchConfirmation
            input={pendingInput}
            onChange={(next) => setPendingInput(next)}
            onConfirm={() => void handleConfirm()}
            onEdit={() => setPendingInput(null)}
            loading={loading}
          />
        )}

        {/* Step 2: Per-type form */}
        {!showSetupNotice && selectedType && !loading && !pendingInput && (
          <div>
            <button
              type="button"
              onClick={handleBack}
              className="intel-back-button mb-5 sm:mb-6"
            >
              <ArrowLeft size={14} />
              Back to workflows
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
