import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CompetitiveAnalysisRequest } from '../contracts'

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

describe('generateCompetitiveAnalysisBrief', () => {
  beforeEach(() => {
    vi.resetAllMocks()

    searchExaSnapshot.mockImplementation(async (name: string) => ({
      name,
      description: `${name} snapshot`,
      sourceUrl: `https://${name.toLowerCase().replace(/\s+/g, '')}.example.com`,
      raw: {},
    }))
    buildResearchSearchPlan.mockResolvedValue(null)
    executeSearchPlan.mockResolvedValue({ sources: [], evidence: [] })
    rankEvidence.mockImplementation((evidence: unknown[]) => evidence)
    extractQueryTerms.mockReturnValue(['relevant', 'competitive', 'analysis'])
    loadPriorBriefBaseline.mockResolvedValue(`- Generated at: 2026-03-14T12:00:00.000Z
- Headline: Relevant still had the cleaner workflow story, but the gap was narrower.
- Conclusion: Relevant had a workflow edge, while AlphaSense still owned breadth.
- Bottom line: The story still leaned on workflow clarity, not market breadth.
- Key points: Relevant still led on directness. | AlphaSense still led on enterprise comfort.`)
    synthesizeWithSchema.mockImplementation(async (_systemPrompt: string, userPrompt: string) => {
      expect(userPrompt).toContain('"answer"')
      expect(userPrompt).toContain('"priority": "must|should|fyi"')
      expect(userPrompt).toContain('"compositeQuadrant"')
      expect(userPrompt).toContain('"whitespace"')
      expect(userPrompt).toContain('Every comparisonMatrix row must include exactly one values entry for Relevant')
      expect(userPrompt).toContain('## Prior Brief Baseline')
      expect(userPrompt).toContain('the gap was narrower')

      return {
        data: {
          headline: 'Relevant wins on direct answers while AlphaSense wins on breadth.',
          bottomLine: 'Relevant should sell the decision layer, not the data warehouse.',
          answer: {
            conclusion: {
              text: 'Relevant wins on direct answers while AlphaSense still wins on enterprise breadth.',
              sourceIds: ['s1'],
            },
            whyItMatters: {
              text: 'You should position against breadth-heavy incumbents by selling the decision layer.',
              sourceIds: ['s1'],
            },
            whatChanged: {
              text: 'Since the last brief, AlphaSense has widened enterprise packaging, so Relevant now needs to sell workflow speed even more explicitly against breadth.',
              sourceIds: ['s1'],
            },
            confidence: {
              level: 'high',
              driver: 'The evidence consistently separates direct answer quality from enterprise breadth.',
            },
            recommendedNext: {
              text: 'Lead with answer quality and proof of decision speed.',
              action: 'Refine positioning',
            },
          },
          confidence: 'high',
          competitors: [
            {
              name: 'AlphaSense',
              description: 'Broad market and research platform.',
              strengths: ['breadth'],
              weaknesses: ['heavier workflow'],
              recentMoves: ['Expanded enterprise packaging'],
            },
            {
              name: 'Klue',
              description: 'Competitive enablement platform.',
              strengths: ['battlecards'],
              weaknesses: ['less deep research'],
              recentMoves: ['Added more sales enablement automation'],
            },
            {
              name: 'Crayon',
              description: 'Monitoring-focused platform.',
              strengths: ['monitoring'],
              weaknesses: ['weaker answer layer'],
              recentMoves: ['Expanded change tracking coverage'],
            },
          ],
          comparisonMatrix: [
            {
              dimension: 'Answer quality',
              values: [
                { company: 'Relevant', position: 'Best direct answer', score: 5 },
                { company: 'AlphaSense', position: 'Broad but less direct', score: 4 },
                { company: 'Klue', position: 'Enablement-first', score: 3 },
                { company: 'Crayon', position: 'Monitoring-first', score: 3 },
              ],
            },
            {
              dimension: 'Enterprise comfort',
              values: [
                { company: 'Relevant', position: 'Earlier but improving', score: 3 },
                { company: 'AlphaSense', position: 'Category leader', score: 5 },
                { company: 'Klue', position: 'Proven commercial motion', score: 4 },
                { company: 'Crayon', position: 'Established enough', score: 4 },
              ],
            },
          ],
          compositeQuadrant: {
            rendered: true,
            xAxis: {
              name: 'Market breadth',
              description: 'How broad and enterprise-ready the platform feels.',
              rationale: {
                text: 'Breadth is driven by coverage and enterprise comfort across the set.',
                sourceIds: ['s1'],
              },
            },
            yAxis: {
              name: 'Decision velocity',
              description: 'How quickly an operator gets to a usable answer.',
              rationale: {
                text: 'Decision velocity is based on how much synthesis work still falls back to the user.',
                sourceIds: ['s1'],
              },
            },
            points: [
              {
                entity: 'Relevant',
                x: 0.42,
                y: 0.84,
                rationale: {
                  text: 'Relevant is narrower but faster to a usable answer.',
                  sourceIds: ['s1'],
                },
              },
              {
                entity: 'AlphaSense',
                x: 0.92,
                y: 0.63,
                rationale: {
                  text: 'AlphaSense leads on breadth but still asks the user to do more synthesis.',
                  sourceIds: ['s1'],
                },
              },
            ],
          },
          whitespace: [
            {
              kind: 'segment',
              headline: 'Relevant can own the answer-first layer for mid-market operating teams.',
              evidence: {
                text: 'Mid-market teams still want a decision-ready layer instead of broader monitoring exhaust.',
                sourceIds: ['s1'],
              },
            },
            {
              kind: 'pricing',
              headline: 'There is room to position against enterprise cost and analyst overhead together.',
              evidence: {
                text: 'Higher-cost workflows remain part of the incumbent story when the buyer does not need full breadth.',
                sourceIds: ['s1'],
              },
            },
          ],
          keyFindings: [{ text: 'Relevant leads on directness.', sourceIds: ['s1'], tag: 'fact', priority: 'must' }],
          strategicImplications: [{ text: 'Position as the decision layer.', sourceIds: ['s1'], tag: 'inference', priority: 'should' }],
          recommendations: [{ text: 'Lead with answer quality.', sourceIds: ['s1'], tag: 'fact', priority: 'must' }],
        },
      }
    })
  })

  it('keeps yourCompany in every comparison row when provided', async () => {
    const { generateCompetitiveAnalysisBrief } = await import('../orchestrators/competitive-analysis')

    const request: CompetitiveAnalysisRequest = {
      competitors: ['AlphaSense', 'Klue', 'Crayon'],
      yourCompany: 'Relevant',
      focusArea: 'competitive positioning',
    }

    const brief = await generateCompetitiveAnalysisBrief(request)

    expect(brief.yourCompany).toBe('Relevant')
    expect(brief.answer?.conclusion.text).toBe('Relevant wins on direct answers while AlphaSense still wins on enterprise breadth.')
    expect(brief.answer?.whatChanged).toEqual({
      text: 'Since the last brief, AlphaSense has widened enterprise packaging, so Relevant now needs to sell workflow speed even more explicitly against breadth.',
      sourceIds: ['s1'],
    })
    expect(brief.answer?.recommendedNext.action).toBe('Refine positioning')
    expect(brief.sections.keyFindings[0]?.priority).toBe('must')
    expect(brief.sections.strategicImplications[0]?.priority).toBe('should')
    expect(brief.trust?.sourcedClaimCount).toBeGreaterThan(0)
    expect(brief.trust?.conflicts).toEqual([])
    expect(brief.trust?.knownUnknowns).toEqual([])
    expect(brief.methodology?.providers.length).toBeGreaterThan(0)
    expect(brief.methodology?.confidenceDrivers.length).toBeGreaterThan(0)
    expect(brief.sources.some((source) => source.usedInAnswer)).toBe(true)
    expect(brief.comparisonMatrix).toHaveLength(2)
    expect(brief.compositeQuadrant).toEqual({
      rendered: true,
      xAxis: {
        name: 'Market breadth',
        description: 'How broad and enterprise-ready the platform feels.',
        rationale: {
          text: 'Breadth is driven by coverage and enterprise comfort across the set.',
          sourceIds: ['s1'],
        },
      },
      yAxis: {
        name: 'Decision velocity',
        description: 'How quickly an operator gets to a usable answer.',
        rationale: {
          text: 'Decision velocity is based on how much synthesis work still falls back to the user.',
          sourceIds: ['s1'],
        },
      },
      points: [
        {
          entity: 'Relevant',
          x: 0.42,
          y: 0.84,
          rationale: {
            text: 'Relevant is narrower but faster to a usable answer.',
            sourceIds: ['s1'],
          },
        },
        {
          entity: 'AlphaSense',
          x: 0.92,
          y: 0.63,
          rationale: {
            text: 'AlphaSense leads on breadth but still asks the user to do more synthesis.',
            sourceIds: ['s1'],
          },
        },
      ],
    })
    expect(brief.whitespace).toEqual([
      {
        kind: 'segment',
        headline: 'Relevant can own the answer-first layer for mid-market operating teams.',
        evidence: {
          text: 'Mid-market teams still want a decision-ready layer instead of broader monitoring exhaust.',
          sourceIds: ['s1'],
        },
      },
      {
        kind: 'pricing',
        headline: 'There is room to position against enterprise cost and analyst overhead together.',
        evidence: {
          text: 'Higher-cost workflows remain part of the incumbent story when the buyer does not need full breadth.',
          sourceIds: ['s1'],
        },
      },
    ])
    brief.comparisonMatrix.forEach((row) => {
      expect(row.values.some((value) => value.company === 'Relevant')).toBe(true)
    })
  })

  it('preserves the render-false quadrant reason when the model says the axes are not defensible', async () => {
    synthesizeWithSchema.mockResolvedValueOnce({
      data: {
        headline: 'The comparison is real, but a quadrant would overstate precision.',
        bottomLine: 'Stick with the matrix because the axes collapse into one another.',
        confidence: 'medium',
        competitors: [],
        comparisonMatrix: [],
        compositeQuadrant: {
          rendered: false,
          reason: 'The candidate axes mostly restate the same breadth score, so a quadrant would be misleading.',
        },
        keyFindings: [{ text: 'The evidence is still useful without a quadrant.', sourceIds: ['s1'], tag: 'fact', priority: 'must' }],
        strategicImplications: [],
        recommendations: [],
      },
    })

    const { generateCompetitiveAnalysisBrief } = await import('../orchestrators/competitive-analysis')
    const brief = await generateCompetitiveAnalysisBrief({
      competitors: ['AlphaSense', 'Klue'],
      yourCompany: 'Relevant',
      focusArea: 'competitive positioning',
    })

    expect(brief.compositeQuadrant).toEqual({
      rendered: false,
      reason: 'The candidate axes mostly restate the same breadth score, so a quadrant would be misleading.',
    })
  })
})
