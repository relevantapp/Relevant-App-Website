import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MeetingPrepRequest } from '../contracts'

const synthesizeWithSchema = vi.fn()
const searchExaSnapshot = vi.fn()
const searchExaPerson = vi.fn()
const extractTavilySite = vi.fn()
const buildResearchSearchPlan = vi.fn()
const executeSearchPlan = vi.fn()
const rankEvidence = vi.fn()
const extractQueryTerms = vi.fn()

vi.mock('../models', () => ({
  synthesizeWithSchema,
}))

vi.mock('../providers/exa', () => ({
  searchExaSnapshot,
  searchExaPerson,
}))

vi.mock('../providers/tavily', () => ({
  extractTavilySite,
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

describe('generateMeetingPrepBrief', () => {
  beforeEach(() => {
    vi.resetAllMocks()

    searchExaSnapshot.mockResolvedValue({
      name: 'Acme',
      description: 'Acme sells workflow software.',
      sourceUrl: 'https://acme.example.com',
      raw: {},
    })
    searchExaPerson.mockResolvedValue([])
    extractTavilySite.mockResolvedValue(null)
    buildResearchSearchPlan.mockResolvedValue(null)
    executeSearchPlan.mockResolvedValue({ sources: [], evidence: [] })
    rankEvidence.mockImplementation((evidence: unknown[]) => evidence)
    extractQueryTerms.mockReturnValue(['acme', 'meeting'])
    synthesizeWithSchema.mockImplementation(async (_systemPrompt: string, userPrompt: string) => {
      expect(userPrompt).toContain('"answer"')
      expect(userPrompt).toContain('"priority": "must|should|fyi"')

      return {
        data: {
          headline: 'Acme has fresh momentum, but the buying path still needs shaping.',
          bottomLine: 'Lead with the rollout push, then test champion depth and timing.',
          whyItMatters: 'You can use the new rollout motion to make this meeting more concrete.',
          confidence: 'high',
          answer: {
            conclusion: {
              text: 'Acme has a fresh rollout motion, so this meeting should center on adoption risk rather than feature pitch.',
              sourceIds: ['s1'],
            },
            whyItMatters: {
              text: 'You have a reason to make the conversation more concrete right now.',
              sourceIds: ['s1'],
            },
            whatChanged: null,
            confidence: {
              level: 'high',
              driver: 'The snapshot provides a clear recent milestone and a concrete meeting angle.',
            },
            recommendedNext: {
              text: 'Lead with the rollout proof point and ask who owns deployment approval.',
              copyable: 'Lead with the rollout proof point and ask who owns deployment approval.',
            },
          },
          whatJustHappened: [{ text: 'Acme is pushing a new rollout motion.', sourceIds: ['s1'], tag: 'fact', priority: 'must' }],
          talkingPoints: [{ text: 'Tie the rollout to business impact.', sourceIds: ['s1'], tag: 'inference', priority: 'should' }],
          landmines: [{ text: 'Do not assume deployment is already staffed.', sourceIds: ['s1'], tag: 'inference', priority: 'must' }],
          questionsToAsk: [{ text: 'Who owns rollout approval?', sourceIds: ['s1'], tag: 'fact', priority: 'must' }],
          competitorContext: [],
        },
      }
    })
  })

  it('maps the synthesized answer block into the final brief', async () => {
    const { generateMeetingPrepBrief } = await import('../orchestrators/meeting-prep')

    const request: MeetingPrepRequest = {
      accountName: 'Acme',
      meetingType: 'sales',
      goal: 'Get to a pilot',
    }

    const brief = await generateMeetingPrepBrief(request)

    expect(brief.answer?.conclusion.text).toContain('fresh rollout motion')
    expect(brief.answer?.recommendedNext.copyable).toBe('Lead with the rollout proof point and ask who owns deployment approval.')
    expect(brief.sections.whatJustHappened[0]?.priority).toBe('must')
    expect(brief.sections.talkingPoints[0]?.priority).toBe('should')
    expect(brief.trust?.sourcedClaimCount).toBeGreaterThan(0)
    expect(brief.trust?.conflicts).toEqual([])
    expect(brief.trust?.knownUnknowns).toEqual([])
    expect(brief.sources.find((source) => source.id === 's1')?.usedInAnswer).toBe(true)
  })
})
