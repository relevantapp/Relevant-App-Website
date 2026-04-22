import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MarketResearchRequest } from '../contracts'

const synthesizeWithSchema = vi.fn()
const searchExaSnapshot = vi.fn()
const buildResearchSearchPlan = vi.fn()
const executeSearchPlan = vi.fn()
const rankEvidence = vi.fn()
const extractQueryTerms = vi.fn()

vi.mock('../models', () => ({
  synthesizeWithSchema,
}))

vi.mock('../providers/exa', () => ({
  searchExaSnapshot,
}))

vi.mock('../search-planner', () => ({
  buildResearchSearchPlan,
  executeSearchPlan,
}))

vi.mock('../ranker', () => ({
  rankEvidence,
  extractQueryTerms,
}))

vi.mock('../orchestrators/v2-bridge', () => ({
  buildV2PlanBridge: vi.fn(async () => null),
  collectV2EvidenceBridge: vi.fn(),
  persistV2EvidencePack: vi.fn(),
}))

describe('generateMarketResearchBrief', () => {
  beforeEach(() => {
    vi.resetAllMocks()

    searchExaSnapshot.mockResolvedValue({
      name: 'AlphaSense',
      description: 'AlphaSense snapshot',
      sourceUrl: 'https://alphasense.example.com',
      raw: {},
    })
    buildResearchSearchPlan.mockResolvedValue(null)
    executeSearchPlan.mockResolvedValue({ sources: [], evidence: [] })
    rankEvidence.mockImplementation((evidence: unknown[]) => evidence)
    extractQueryTerms.mockReturnValue(['market', 'research'])
    synthesizeWithSchema.mockImplementation(async (_systemPrompt: string, userPrompt: string) => {
      expect(userPrompt).toContain('"answer"')

      return {
        data: {
          headline: 'The market is fragmenting, and the answer-first wedge is gaining credibility.',
          bottomLine: 'Broad incumbents still own awareness, but the workflow-specific wedge is real.',
          whyItMatters: 'You should define the wedge more narrowly before trying to look broad.',
          confidence: 'medium',
          answer: {
            conclusion: {
              text: 'The market is fragmenting, and the answer-first wedge is gaining practical credibility.',
              sourceIds: ['s1'],
            },
            whyItMatters: {
              text: 'You should own one repeated decision workflow before expanding the category story.',
              sourceIds: ['s1'],
            },
            whatChanged: null,
            confidence: {
              level: 'medium',
              driver: 'The direction is clear, but the final category boundaries are still forming.',
            },
            recommendedNext: {
              text: 'Define the wedge narrowly and track repeated usage in that motion.',
              action: 'Define the wedge',
            },
          },
          marketOverview: 'The market is splitting between broad monitoring and answer-first workflow tools.',
          players: [
            {
              name: 'AlphaSense',
              category: 'leader',
              description: 'Broad incumbent.',
              estimatedPosition: 'Strong breadth player.',
            },
          ],
          trendSignals: [{ text: 'Workflow-specific tools are gaining credibility.', sourceIds: ['s1'], tag: 'fact' }],
          opportunities: [{ text: 'Own the answer-plus-proof layer.', sourceIds: ['s1'], tag: 'inference' }],
          threats: [{ text: 'Broad incumbents still own awareness.', sourceIds: ['s1'], tag: 'fact' }],
          keyFindings: [{ text: 'The wedge is real but narrow.', sourceIds: ['s1'], tag: 'inference' }],
        },
      }
    })
  })

  it('maps the synthesized answer block into the final market-research brief', async () => {
    const { generateMarketResearchBrief } = await import('../orchestrators/market-research')

    const request: MarketResearchRequest = {
      marketOrTrend: 'AI research workflows',
      scope: 'global',
      timeHorizon: '90d',
      knownPlayers: ['AlphaSense'],
    }

    const brief = await generateMarketResearchBrief(request)

    expect(brief.answer?.conclusion.text).toContain('answer-first wedge')
    expect(brief.answer?.recommendedNext.action).toBe('Define the wedge')
    expect(brief.sources.some((source) => source.usedInAnswer)).toBe(true)
  })
})
