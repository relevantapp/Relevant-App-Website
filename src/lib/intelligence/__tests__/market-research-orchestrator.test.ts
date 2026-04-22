import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MarketResearchRequest } from '../contracts'

const synthesizeWithSchema = vi.fn()
const searchExaSnapshot = vi.fn()
const buildResearchSearchPlan = vi.fn()
const executeSearchPlan = vi.fn()
const rankEvidence = vi.fn()
const extractQueryTerms = vi.fn()
const loadPriorBriefBaseline = vi.fn()

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

vi.mock('../prior-briefs', () => ({
  loadPriorBriefBaseline,
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
    loadPriorBriefBaseline.mockResolvedValue(`- Generated at: 2026-03-09T12:00:00.000Z
- Headline: The wedge was emerging, but category boundaries were still fuzzy.
- Conclusion: The market was fragmenting, but the answer-first wedge still needed clearer proof.
- Bottom line: Broad incumbents still controlled awareness while the wedge was forming.
- Key points: The wedge was emerging. | Category boundaries were still fuzzy.`)
    synthesizeWithSchema.mockImplementation(async (_systemPrompt: string, userPrompt: string) => {
      expect(userPrompt).toContain('"answer"')
      expect(userPrompt).toContain('"priority": "must|should|fyi"')
      expect(userPrompt).toContain('"marketMap"')
      expect(userPrompt).toContain('"trackedSignals"')
      expect(userPrompt).toContain('"maturity"')
      expect(userPrompt).toContain('"quotes"')
      expect(userPrompt).toContain('"watchList"')
      expect(userPrompt).toContain('## Prior Brief Baseline')
      expect(userPrompt).toContain('category boundaries were still fuzzy')

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
            whatChanged: {
              text: 'Since the last brief, the answer-first wedge has moved from emerging to practically credible, even though the final category boundaries are still forming.',
              sourceIds: ['s1'],
            },
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
          marketMap: {
            segments: [
              {
                name: 'Answer-first workflow tools',
                rationale: 'This wedge is where decisive output with proof feels most distinct.',
                players: [
                  {
                    name: 'Relevant',
                    logoUrl: null,
                    domain: 'getrelevant.ai',
                  },
                ],
              },
            ],
          },
          trackedSignals: [
            {
              metric: 'Search interest',
              headline: 'Search interest is rising faster than general category awareness.',
              unit: ' pts',
              points: [
                { t: 'Q1', value: 14 },
                { t: 'Q2', value: 19 },
              ],
            },
          ],
          maturity: {
            stage: 'slope',
            rationale: {
              text: 'The market is moving out of novelty and into practical evaluation.',
              sourceIds: ['s1'],
            },
          },
          quotes: [
            {
              quote: 'Teams keep asking whether the system gets them to a conclusion they can defend.',
              attribution: {
                name: 'Alicia Ford',
                role: 'VP Strategy',
                source: 'Operator interview',
                date: '2026-04-04',
              },
              theme: 'Workflow proof',
            },
          ],
          watchList: [
            {
              signal: 'More buyers naming answer plus proof in evaluations',
              whyItMatters: 'That would confirm the wedge is moving into explicit buying criteria.',
              nextCheckBy: '2026-05-12T12:00:00.000Z',
              sources: ['s1'],
            },
          ],
          players: [
            {
              name: 'AlphaSense',
              category: 'leader',
              description: 'Broad incumbent.',
              estimatedPosition: 'Strong breadth player.',
            },
          ],
          trendSignals: [{ text: 'Workflow-specific tools are gaining credibility.', sourceIds: ['s1'], tag: 'fact', priority: 'must' }],
          opportunities: [{ text: 'Own the answer-plus-proof layer.', sourceIds: ['s1'], tag: 'inference', priority: 'should' }],
          threats: [{ text: 'Broad incumbents still own awareness.', sourceIds: ['s1'], tag: 'fact', priority: 'must' }],
          keyFindings: [{ text: 'The wedge is real but narrow.', sourceIds: ['s1'], tag: 'inference', priority: 'should' }],
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
    expect(brief.answer?.whatChanged).toEqual({
      text: 'Since the last brief, the answer-first wedge has moved from emerging to practically credible, even though the final category boundaries are still forming.',
      sourceIds: ['s1'],
    })
    expect(brief.answer?.recommendedNext.action).toBe('Define the wedge')
    expect(brief.sections.trendSignals[0]?.priority).toBe('must')
    expect(brief.sections.opportunities[0]?.priority).toBe('should')
    expect(brief.marketMap?.segments[0]?.name).toBe('Answer-first workflow tools')
    expect(brief.trackedSignals?.[0]?.metric).toBe('Search interest')
    expect(brief.maturity?.stage).toBe('slope')
    expect(brief.quotes?.[0]?.theme).toBe('Workflow proof')
    expect(brief.watchList?.[0]?.signal).toContain('answer plus proof')
    expect(brief.trust?.sourcedClaimCount).toBeGreaterThan(0)
    expect(brief.trust?.conflicts).toEqual([])
    expect(brief.trust?.knownUnknowns).toEqual([])
    expect(brief.methodology?.providers.length).toBeGreaterThan(0)
    expect(brief.methodology?.confidenceDrivers.length).toBeGreaterThan(0)
    expect(brief.sources.some((source) => source.usedInAnswer)).toBe(true)
  })
})
