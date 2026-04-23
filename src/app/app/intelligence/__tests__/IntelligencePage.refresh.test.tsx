// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import React from 'react'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { marketResearchFixture } from '@/app/app/intelligence/results/__fixtures__/market-research.fixture'

const generate = vi.fn()
const abort = vi.fn()
const reset = vi.fn()
const replace = vi.fn()
const fetchMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => ({
    get: (key: string) => (key === 'brief' ? 'saved-brief-1' : null),
    toString: () => 'brief=saved-brief-1',
  }),
}))

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true, isLoading: false }),
}))

vi.mock('@/hooks/useIntelligenceStream', () => ({
  useIntelligenceStream: () => ({
    state: {
      brief: null,
      isStreaming: false,
      error: null,
    },
    generate,
    abort,
    reset,
  }),
}))

vi.mock('@/lib/supabase', () => ({
  getValidAccessToken: vi.fn(async () => 'token-123'),
}))

vi.mock('../ResearchTypeSelector', () => ({
  default: () => <div>research type selector</div>,
}))

vi.mock('../ResearchConfirmation', () => ({
  default: () => <div>research confirmation</div>,
}))

vi.mock('../forms/MeetingPrepForm', () => ({
  default: () => <div>meeting prep form</div>,
}))

vi.mock('../forms/BusinessCaseForm', () => ({
  default: () => <div>business case form</div>,
}))

vi.mock('../forms/CompetitiveAnalysisForm', () => ({
  default: () => <div>competitive analysis form</div>,
}))

vi.mock('../forms/MarketResearchForm', () => ({
  default: () => <div>market research form</div>,
}))

vi.mock('../IntelligenceResults', () => ({
  default: () => <div>meeting prep results</div>,
}))

vi.mock('../results/CompetitiveResults', () => ({
  default: () => <div>competitive results</div>,
}))

vi.mock('../results/BusinessCaseResults', () => ({
  default: () => <div>business case results</div>,
}))

vi.mock('../results/MarketResearchResults', () => ({
  default: () => <div>market research results</div>,
}))

vi.mock('../results/shared/FollowUpChat', () => ({
  default: () => <div>follow up chat</div>,
}))

vi.mock('../IntelligenceSetupNotice', () => ({
  default: () => <div>setup notice</div>,
}))

vi.mock('../ActivityRail', () => ({
  default: () => <div>activity rail</div>,
}))

vi.mock('../HistoryButton', () => ({
  default: () => <div>history button</div>,
}))

describe('IntelligencePage refresh wiring', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    fetchMock.mockImplementation(async (input: string) => {
      if (input === '/api/intelligence/status') {
        return {
          ok: true,
          json: async () => ({
            generateReady: true,
            chatReady: true,
            providers: [],
          }),
        }
      }

      if (input === '/api/intelligence/briefs') {
        return {
          ok: true,
          json: async () => ({
            brief: {
              id: 'saved-brief-1',
              research_type: 'market_research',
              request_payload: {
                marketOrTrend: 'AI research workflows',
                scope: 'global',
                timeHorizon: '90d',
                region: 'North America',
              },
              synthesis: marketResearchFixture,
            },
          }),
        }
      }

      throw new Error(`Unexpected fetch ${input}`)
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    window.localStorage.clear()
    cleanup()
  })

  it('replays the saved request when intel:refresh is dispatched', async () => {
    const { default: IntelligencePage } = await import('../page')

    render(<IntelligencePage />)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/intelligence/briefs', expect.objectContaining({
        method: 'POST',
      }))
    })

    await waitFor(() => {
      expect(screen.getByText('market research results')).toBeInTheDocument()
    })

    window.dispatchEvent(new CustomEvent('intel:refresh'))

    await waitFor(() => {
      expect(generate).toHaveBeenCalledWith(expect.objectContaining({
        researchType: 'market_research',
        marketOrTrend: 'AI research workflows',
        scope: 'global',
        timeHorizon: '90d',
        region: 'North America',
      }))
    })
  })
})
