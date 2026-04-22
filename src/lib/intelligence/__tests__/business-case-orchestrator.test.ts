import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { BusinessCaseRequest } from '../contracts'

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

describe('generateBusinessCaseBrief', () => {
  beforeEach(() => {
    vi.resetAllMocks()

    searchExaSnapshot.mockResolvedValue({
      name: 'PeerCo',
      description: 'PeerCo snapshot',
      sourceUrl: 'https://peerco.example.com',
      raw: {},
    })
    buildResearchSearchPlan.mockResolvedValue(null)
    executeSearchPlan.mockResolvedValue({ sources: [], evidence: [] })
    rankEvidence.mockImplementation((evidence: unknown[]) => evidence)
    extractQueryTerms.mockReturnValue(['business', 'case'])
    synthesizeWithSchema.mockImplementation(async (_systemPrompt: string, userPrompt: string) => {
      expect(userPrompt).toContain('"answer"')
      expect(userPrompt).toContain('"priority": "must|should|fyi"')
      expect(userPrompt).toContain('"driverTree"')
      expect(userPrompt).toContain('"scenarios"')
      expect(userPrompt).toContain('"tornado"')
      expect(userPrompt).toContain('"waterfall"')
      expect(userPrompt).toContain('"assumptions"')

      return {
        data: {
          headline: 'The case is promising if weekly reuse holds.',
          bottomLine: 'The payoff is visible, but adoption discipline still decides the outcome.',
          whyItMatters: 'You can move forward, but only if the adoption bet is explicit.',
          confidence: 'medium',
          answer: {
            conclusion: {
              text: 'The business case is promising if weekly reuse holds, but it is still fragile on adoption.',
              sourceIds: ['s1'],
            },
            whyItMatters: {
              text: 'You should treat reuse and rollout discipline as the real gating assumptions.',
              sourceIds: ['s1'],
            },
            whatChanged: null,
            confidence: {
              level: 'medium',
              driver: 'The directional signal is good, but the outcome still depends on one critical adoption assumption.',
            },
            recommendedNext: {
              text: 'Validate weekly reuse before committing the full rollout.',
              action: 'Validate reuse',
            },
          },
          verdict: 'moderate',
          verdictRationale: 'The case works if adoption becomes durable.',
          comparables: [
            {
              name: 'PeerCo',
              outcome: 'mixed',
              relevance: 'Comparable workflow',
              keyTakeaway: 'Adoption pace determined the result.',
            },
          ],
          driverTree: {
            branches: [
              {
                name: 'demand',
                score: 4.4,
                confidence: 'high',
                children: [
                  {
                    label: 'Buyer pull',
                    evidence: {
                      text: 'Teams already value faster decision support.',
                      sourceIds: ['s1'],
                    },
                  },
                ],
              },
            ],
          },
          scenarios: {
            metric: 'Gross-margin payback',
            unit: '%',
            downside: {
              value: 80,
              triggers: ['Adoption stays shallow.'],
            },
            base: {
              value: 120,
              drivers: ['One workflow reaches weekly reuse.'],
            },
            upside: {
              value: 150,
              triggers: ['Two workflows reach reuse quickly.'],
            },
          },
          tornado: [
            {
              assumption: 'Workflow reuse rate',
              lowImpact: -18,
              highImpact: 22,
            },
          ],
          waterfall: [
            {
              label: 'Baseline',
              delta: 100,
              kind: 'baseline',
              assumption: {
                text: 'The baseline assumes today’s conversion and reuse profile.',
                sourceIds: ['s1'],
              },
            },
            {
              label: 'Target',
              delta: 0,
              kind: 'total',
              assumption: {
                text: 'The target depends on maintaining reuse gains.',
                sourceIds: ['s1'],
              },
            },
          ],
          assumptions: [
            {
              text: 'Weekly reuse will become real.',
              mustBeTrueBecause: 'The case weakens fast if the workflow stays occasional.',
              confidence: 'med',
              evidence: [
                {
                  text: 'Comparable wins come from repeated workflow usage.',
                  sourceIds: ['s1'],
                },
              ],
            },
          ],
          marketEvidence: [{ text: 'Decision support demand exists.', sourceIds: ['s1'], tag: 'fact', priority: 'must' }],
          supportingFactors: [{ text: 'Output quality is differentiated.', sourceIds: ['s1'], tag: 'fact', priority: 'should' }],
          riskFactors: [{ text: 'Adoption may stay occasional.', sourceIds: ['s1'], tag: 'inference', priority: 'must' }],
          openQuestions: [{ text: 'Will weekly reuse happen?', sourceIds: [], tag: 'inference', priority: 'must' }],
        },
      }
    })
  })

  it('maps the synthesized answer block into the final business-case brief', async () => {
    const { generateBusinessCaseBrief } = await import('../orchestrators/business-case')

    const request: BusinessCaseRequest = {
      initiativeName: 'Relevant Decision Briefs',
      hypothesis: 'Decision-specific output can support a premium workflow.',
      comparableCompanies: ['PeerCo'],
    }

    const brief = await generateBusinessCaseBrief(request)

    expect(brief.answer?.conclusion.text).toContain('weekly reuse')
    expect(brief.answer?.recommendedNext.action).toBe('Validate reuse')
    expect(brief.sections.marketEvidence[0]?.priority).toBe('must')
    expect(brief.sections.supportingFactors[0]?.priority).toBe('should')
    expect(brief.sections.riskFactors[0]?.priority).toBe('must')
    expect(brief.driverTree?.branches[0]?.name).toBe('demand')
    expect(brief.scenarios?.metric).toBe('Gross-margin payback')
    expect(brief.tornado?.[0]?.assumption).toBe('Workflow reuse rate')
    expect(brief.waterfall?.[0]?.label).toBe('Baseline')
    expect(brief.assumptions?.[0]?.confidence).toBe('med')
    expect(brief.trust?.sourcedClaimCount).toBeGreaterThan(0)
    expect(brief.trust?.conflicts).toEqual([])
    expect(brief.trust?.knownUnknowns).toEqual([])
    expect(brief.methodology?.providers.length).toBeGreaterThan(0)
    expect(brief.methodology?.confidenceDrivers.length).toBeGreaterThan(0)
    expect(brief.sources.some((source) => source.usedInAnswer)).toBe(true)
  })
})
