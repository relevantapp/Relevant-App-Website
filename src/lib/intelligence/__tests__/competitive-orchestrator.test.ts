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
        headline: 'Relevant and AlphaSense are comparable, but a quadrant would overstate precision.',
        bottomLine: 'Stick with the matrix because the axes collapse into one another for Relevant and AlphaSense.',
        confidence: 'medium',
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
            weaknesses: ['narrower research depth'],
            recentMoves: ['Expanded sales enablement automation'],
          },
        ],
        comparisonMatrix: [
          {
            dimension: 'Evidence quality',
            values: [
              { company: 'Relevant', position: 'Narrower but direct', score: 4 },
              { company: 'AlphaSense', position: 'Broader but heavier', score: 4 },
              { company: 'Klue', position: 'Enablement-first', score: 3 },
            ],
          },
        ],
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

  it('drops an irrelevant prior baseline before prompting the model', async () => {
    loadPriorBriefBaseline.mockResolvedValueOnce(`- Generated at: 2026-04-22T21:54:56.875Z
- Headline: The enterprise cloud storage market is shifting toward AI-integrated data management.
- Conclusion: Box leads on regulated sharing while Dropbox wins on simplicity.`)
    synthesizeWithSchema.mockImplementationOnce(async (_systemPrompt: string, userPrompt: string) => {
      expect(userPrompt).not.toContain('## Prior Brief Baseline')
      expect(userPrompt).not.toContain('cloud storage market')

      return {
        data: {
          headline: 'Purolator can defend Canadian SMB logistics if it answers UPS’s premium-services pivot.',
          bottomLine: 'UPS is shifting toward higher-margin SMB, B2B, and healthcare lanes while Purolator still owns local familiarity in Canada.',
          confidence: 'medium',
          answer: {
            conclusion: {
              text: 'UPS is pushing up-market margin plays while Purolator still has a domestic trust and coverage story in Canada.',
              sourceIds: ['s1'],
            },
            whyItMatters: {
              text: 'You need a clearer SMB and cross-border story before UPS’s premium-services push resets buyer expectations.',
              sourceIds: ['s1'],
            },
            whatChanged: null,
            confidence: {
              level: 'medium',
              driver: 'The evidence is directionally clear but still thin on Purolator-specific primary disclosures.',
            },
            recommendedNext: {
              text: 'Lead with Canadian SMB reliability and cross-border simplicity.',
            },
          },
          competitors: [
            {
              name: 'UPS',
              description: 'Global parcel and logistics incumbent.',
              strengths: ['Scale'],
              weaknesses: ['Less localized Canadian positioning'],
              recentMoves: ['Shifted toward higher-margin SMB and B2B segments'],
            },
          ],
          comparisonMatrix: [
            {
              dimension: 'SMB positioning',
              values: [
                { company: 'Purolator Ground', position: 'Canada-first story', score: 4 },
                { company: 'UPS', position: 'Premium-services pivot', score: 4 },
              ],
            },
          ],
          compositeQuadrant: {
            rendered: false,
            reason: 'The evidence is still too thin to place a reliable quadrant.',
          },
          whitespace: [],
          keyFindings: [{ text: 'UPS is leaning into higher-margin SMB and B2B segments.', sourceIds: ['s1'], tag: 'fact', priority: 'must' }],
          strategicImplications: [{ text: 'Purolator should sharpen its Canada-first SMB story.', sourceIds: ['s1'], tag: 'inference', priority: 'should' }],
          recommendations: [{ text: 'Package cross-border simplicity more aggressively.', sourceIds: ['s1'], tag: 'fact', priority: 'must' }],
        },
      }
    })

    const { generateCompetitiveAnalysisBrief } = await import('../orchestrators/competitive-analysis')
    const brief = await generateCompetitiveAnalysisBrief({
      competitors: ['UPS'],
      yourCompany: 'Purolator Ground',
      focusArea: 'gtm',
    })

    expect(brief.headline).toContain('Purolator')
    expect(brief.answer?.whatChanged).toBeNull()
  })

  it('retries with a stronger model when the first synthesis omits the requested companies', async () => {
    loadPriorBriefBaseline.mockResolvedValueOnce(null)
    synthesizeWithSchema
      .mockResolvedValueOnce({
        data: {
          headline: 'Salesforce faces pressure from HubSpot in the mid-market.',
          bottomLine: 'HubSpot is simplifying CRM adoption while Salesforce holds enterprise depth.',
          confidence: 'high',
          answer: {
            conclusion: {
              text: 'Salesforce dominates enterprise, but HubSpot is winning the mid-market.',
              sourceIds: ['s1'],
            },
            whyItMatters: {
              text: 'You are losing on implementation complexity.',
              sourceIds: ['s1'],
            },
            whatChanged: {
              text: 'HubSpot launched Breeze AI.',
              sourceIds: ['s1'],
            },
            confidence: {
              level: 'high',
              driver: 'The model drifted into a canned SaaS comparison.',
            },
            recommendedNext: {
              text: 'Launch a lite onboarding package.',
            },
          },
          competitors: [
            {
              name: 'Salesforce',
              description: 'CRM suite',
              strengths: ['Depth'],
              weaknesses: ['Complexity'],
              recentMoves: ['Expanded Data Cloud'],
            },
            {
              name: 'HubSpot',
              description: 'Mid-market CRM',
              strengths: ['UX'],
              weaknesses: ['Customization limits'],
              recentMoves: ['Launched Breeze'],
            },
          ],
          comparisonMatrix: [
            {
              dimension: 'Ease of use',
              values: [
                { company: 'Salesforce', position: 'Complex', score: 2 },
                { company: 'HubSpot', position: 'Simple', score: 5 },
              ],
            },
          ],
          compositeQuadrant: {
            rendered: false,
            reason: 'Not enough evidence.',
          },
          whitespace: [],
          keyFindings: [{ text: 'HubSpot is easier to use.', sourceIds: ['s1'], tag: 'fact', priority: 'must' }],
          strategicImplications: [],
          recommendations: [],
        },
      })
      .mockResolvedValueOnce({
        data: {
          headline: 'Purolator can counter UPS by packaging Canadian SMB reliability more directly.',
          bottomLine: 'UPS is pushing harder into higher-margin SMB and B2B lanes, but Purolator still has a domestic trust and network story to lean on.',
          confidence: 'medium',
          answer: {
            conclusion: {
              text: 'UPS is broadening its SMB push, while Purolator Ground still has a stronger Canada-first trust and coverage story.',
              sourceIds: ['s1'],
            },
            whyItMatters: {
              text: 'You need a sharper GTM message before UPS’s premium-services pivot changes buyer expectations in Canadian SMB shipping.',
              sourceIds: ['s1'],
            },
            whatChanged: null,
            confidence: {
              level: 'medium',
              driver: 'The stronger retry model stayed on the requested logistics entities.',
            },
            recommendedNext: {
              text: 'Lead with Canadian SMB reliability and cross-border simplicity.',
            },
          },
          competitors: [
            {
              name: 'UPS',
              description: 'Global parcel and logistics incumbent.',
              strengths: ['Scale'],
              weaknesses: ['Less localized Canadian positioning'],
              recentMoves: ['Shifted toward higher-margin SMB and B2B segments'],
            },
          ],
          comparisonMatrix: [
            {
              dimension: 'SMB positioning',
              values: [
                { company: 'Purolator Ground', position: 'Canada-first story', score: 4 },
                { company: 'UPS', position: 'Premium-services pivot', score: 4 },
              ],
            },
          ],
          compositeQuadrant: {
            rendered: false,
            reason: 'The evidence is still too thin to place a reliable quadrant.',
          },
          whitespace: [],
          keyFindings: [{ text: 'UPS is leaning into higher-margin SMB and B2B segments.', sourceIds: ['s1'], tag: 'fact', priority: 'must' }],
          strategicImplications: [{ text: 'Purolator should sharpen its Canada-first SMB story.', sourceIds: ['s1'], tag: 'inference', priority: 'should' }],
          recommendations: [{ text: 'Package cross-border simplicity more aggressively.', sourceIds: ['s1'], tag: 'fact', priority: 'must' }],
        },
      })

    const { generateCompetitiveAnalysisBrief } = await import('../orchestrators/competitive-analysis')
    const brief = await generateCompetitiveAnalysisBrief({
      competitors: ['UPS'],
      yourCompany: 'Purolator Ground',
      focusArea: 'gtm',
    })

    expect(synthesizeWithSchema).toHaveBeenCalledTimes(2)
    expect(synthesizeWithSchema.mock.calls[1]?.[5]).toBe('anthropic/claude-sonnet-4.6')
    expect(synthesizeWithSchema.mock.calls[1]?.[6]).toEqual({ disableModelFallback: true, timeoutMs: 12000 })
    expect(brief.headline).toContain('Purolator')
    expect(brief.competitors.map((competitor: { name: string }) => competitor.name)).toEqual(['UPS'])
  })
})
