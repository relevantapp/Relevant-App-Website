import { describe, expect, it } from 'vitest'
import {
  buildCanonicalSourceIdMap,
  buildTrustLayer,
  buildMeetingPrepSnapshot,
  canonicalizeSourceIds,
  deriveSourceCounts,
  markSourcesUsedInAnswer,
  SNAPSHOT_MILESTONE_MAX,
  SNAPSHOT_SUMMARY_MAX,
} from '../meeting-prep-display'
import type { BriefSource, CompanySnapshot, EvidencePack, ResearchPlanV2 } from '../contracts'

describe('buildMeetingPrepSnapshot', () => {
  it('sanitizes markdown artifacts, caps expensive fields, and records known unknowns', () => {
    const rawSnapshot: CompanySnapshot = {
      name: 'Acme AI',
      description: '## Overview\nAcme AI builds workflow software for enterprise operators. It centralizes research, approvals, and reporting across global revenue teams with long-form narrative that should be trimmed before it reaches the UI because the surface needs a bounded summary instead of a prose dump.',
      website: null,
      industry: null,
      headquarters: null,
      employeeCount: null,
      fundingStage: 'Series B',
      lastFundingAmount: '$45M',
      ceo: null,
      keyPeople: null,
      recentMilestone: '### Milestone\nExpanded into Europe and launched an enterprise package with a very long explanation that should be clamped before the card tries to render it as a full paragraph on the page.',
      sourceUrl: 'https://acme.example.com',
    }

    const snapshot = buildMeetingPrepSnapshot(rawSnapshot, 'https://acme.example.com')

    expect(snapshot).not.toBeNull()
    expect(snapshot?.summary).not.toContain('##')
    expect(snapshot?.recentMilestone).not.toContain('###')
    expect(snapshot?.summary.length ?? 0).toBeLessThanOrEqual(SNAPSHOT_SUMMARY_MAX + 1)
    expect(snapshot?.recentMilestone?.length ?? 0).toBeLessThanOrEqual(SNAPSHOT_MILESTONE_MAX + 1)
    expect(snapshot?.funding).toBe('Series B · $45M')
    expect(snapshot?.knownUnknowns).toContain('Industry not verified.')
    expect(snapshot?.knownUnknowns).toContain('Headquarters not verified.')
  })
})

describe('source canonicalization and counts', () => {
  it('maps duplicate URLs to a canonical id and derives found/ranked/used counts from the displayed ledger', () => {
    const allSources: BriefSource[] = [
      {
        id: 's1',
        url: 'https://example.com/story',
        title: 'Story one',
        domain: 'example.com',
        publishedAt: '2026-04-20T00:00:00.000Z',
        provider: 'exa',
        snippet: 'Story one snippet',
        sourceRole: 'primary',
      },
      {
        id: 's2',
        url: 'https://example.com/story/',
        title: 'Story one duplicate',
        domain: 'example.com',
        publishedAt: '2026-04-20T00:00:00.000Z',
        provider: 'tavily',
        snippet: 'Duplicate snippet',
      },
      {
        id: 's3',
        url: 'internal://memory-1',
        title: 'Prior note',
        domain: 'internal',
        publishedAt: null,
        provider: 'internal',
        snippet: 'Internal memory snippet',
        sourceRole: 'internal_memory',
      },
    ]

    const sourceIdMap = buildCanonicalSourceIdMap(allSources)
    const displayedSources = markSourcesUsedInAnswer([allSources[0], allSources[2]], ['s1'])
    const rankedSourceIds = canonicalizeSourceIds(['s1', 's2', 's3'], sourceIdMap)
    const usedSourceIds = canonicalizeSourceIds(['s2'], sourceIdMap)

    expect(rankedSourceIds).toEqual(['s1', 's3'])
    expect(usedSourceIds).toEqual(['s1'])

    expect(deriveSourceCounts({
      sources: displayedSources,
      rankedSourceIds,
      usedSourceIds,
    })).toEqual({
      found: 2,
      ranked: 2,
      used: 1,
    })
  })
})

describe('buildTrustLayer', () => {
  it('summarizes freshness, important sources, contradictions, and known unknowns', () => {
    const sources: BriefSource[] = [
      {
        id: 's1',
        url: 'https://example.com/one',
        title: 'Source one',
        domain: 'example.com',
        publishedAt: '2026-04-10T00:00:00.000Z',
        provider: 'exa',
        snippet: 'One',
      },
      {
        id: 's2',
        url: 'https://example.com/two',
        title: 'Source two',
        domain: 'example.com',
        publishedAt: '2026-04-12T00:00:00.000Z',
        provider: 'tavily',
        snippet: 'Two',
      },
      {
        id: 's3',
        url: 'https://example.com/three',
        title: 'Source three',
        domain: 'example.com',
        publishedAt: '2026-04-18T00:00:00.000Z',
        provider: 'exa',
        snippet: 'Three',
      },
    ]

    const pack = {
      evidence: [
        { sourceId: 's1' },
        { sourceId: 's2' },
        { sourceId: 's3' },
      ],
      contradictions: [
        {
          issue: 'Sources disagree on the rollout timeline.',
          evidenceIds: ['s1', 's2', 's3'],
        },
      ],
      unknowns: [
        {
          question: 'counter_evidence: Who owns final procurement sign-off?',
          reasonMissing: 'No source covered the final approver.',
        },
      ],
    } as unknown as EvidencePack

    const plan = {
      lanes: [
        {
          sourceRole: 'counter_evidence',
          questions: ['Who owns final procurement sign-off?'],
          queryTemplates: [
            'procurement sign-off workflow owner',
            'final procurement approver enterprise rollout',
          ],
        },
      ],
    } as unknown as ResearchPlanV2

    const trust = buildTrustLayer({
      sources,
      sourceIdMap: buildCanonicalSourceIdMap(sources),
      claimSourceGroups: [['s1'], ['s1', 's2'], ['s3']],
      pack,
      plan,
    })

    expect(trust.sourcedClaimCount).toBe(3)
    expect(trust.freshness).toEqual({
      oldestSourceAt: '2026-04-10T00:00:00.000Z',
      newestSourceAt: '2026-04-18T00:00:00.000Z',
    })
    expect(trust.mostImportantSourceIds).toEqual(['s1', 's2', 's3'])
    expect(trust.conflicts).toEqual([
      {
        claim: 'Sources disagree on the rollout timeline.',
        supportingSourceIds: ['s1', 's2'],
        againstSourceIds: ['s3'],
      },
    ])
    expect(trust.knownUnknowns).toEqual([
      {
        question: 'Who owns final procurement sign-off?',
        queriesTried: [
          'procurement sign-off workflow owner',
          'final procurement approver enterprise rollout',
        ],
      },
    ])
  })
})
