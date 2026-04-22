import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CompetitiveAnalysisRequest } from '../contracts'

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
    synthesizeWithSchema.mockImplementation(async (_systemPrompt: string, userPrompt: string) => {
      expect(userPrompt).toContain('"answer"')
      expect(userPrompt).toContain('"priority": "must|should|fyi"')
      expect(userPrompt).toContain('Every comparisonMatrix row must include exactly one values entry for Relevant')

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
            whatChanged: null,
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
    expect(brief.answer?.recommendedNext.action).toBe('Refine positioning')
    expect(brief.sections.keyFindings[0]?.priority).toBe('must')
    expect(brief.sections.strategicImplications[0]?.priority).toBe('should')
    expect(brief.sources.some((source) => source.usedInAnswer)).toBe(true)
    expect(brief.comparisonMatrix).toHaveLength(2)
    brief.comparisonMatrix.forEach((row) => {
      expect(row.values.some((value) => value.company === 'Relevant')).toBe(true)
    })
  })
})
