import { describe, expect, it } from 'vitest'
import type { MeetingPrepBrief } from '../contracts'
import {
  deriveMeetingPrepRequestIdentity,
  mapMeetingPrepTrustState,
  parseMeetingPrepRequestContext,
} from '../meeting-prep-identity'

const baseBrief: Pick<MeetingPrepBrief, 'snapshot' | 'status'> = {
  snapshot: {
    name: 'Fallback Company',
    summary: 'Fallback summary',
    website: 'https://fallback.example.com',
    whatTheyDo: 'Fallback company summary',
    industry: 'Software',
    headquarters: null,
    employeeRange: null,
    funding: null,
    ceo: null,
    recentMilestone: null,
    knownUnknowns: [],
    sourceUrl: null,
  },
  status: {
    degraded: false,
    reasons: [],
    internalMs: 0,
    plannerMs: 0,
    exaMs: 0,
    tavilyMs: 0,
    verifierMs: 0,
    exaSearchMs: 0,
    tavilySearchMs: 0,
    synthesisMs: 0,
    totalMs: 0,
    sourceCount: 8,
    sourceCounts: {
      found: 8,
      ranked: 5,
      used: 4,
    },
    cached: false,
    synthesisModel: 'openai/gpt-5.4',
  },
}

describe('meeting prep identity helper', () => {
  it('prefers request payload identity over generated snapshot identity', () => {
    const identity = deriveMeetingPrepRequestIdentity(baseBrief, {
      accountName: 'Graham Company',
      website: 'https://graham.example.com',
      meetingType: 'client',
      goal: 'Prepare for a staffing services sales meeting',
      whatYoureSelling: 'Arrow workforce solutions staffing services',
      desiredNextStep: 'Book an operations review',
      attendees: ['Taylor Graham', { name: 'Morgan Ops' }],
    })

    expect(identity.companyName).toBe('Graham Company')
    expect(identity.website).toBe('https://graham.example.com')
    expect(identity.meetingTypeLabel).toBe('Client meeting')
    expect(identity.offer).toBe('Arrow workforce solutions staffing services')
    expect(identity.attendees).toEqual(['Taylor Graham', 'Morgan Ops'])
    expect(identity.sourceCount).toBe(4)
  })

  it('falls back safely for older briefs without request payload', () => {
    const identity = deriveMeetingPrepRequestIdentity(baseBrief)

    expect(identity.companyName).toBe('Fallback Company')
    expect(identity.website).toBe('https://fallback.example.com')
    expect(identity.offer).toBe('Offer not provided.')
    expect(identity.meetingTypeLabel).toBe('Meeting prep')
  })

  it('parses attendee arrays from strings and objects', () => {
    const context = parseMeetingPrepRequestContext({
      attendees: ['Alex Buyer', { name: 'Jordan CFO' }, { notName: 'Ignored' }],
    })

    expect(context?.attendees).toEqual(['Alex Buyer', 'Jordan CFO'])
  })
})

describe('meeting prep trust state helper', () => {
  it('maps account and offer drift to blocked state', () => {
    const state = mapMeetingPrepTrustState({
      status: {
        ...baseBrief.status,
        degraded: true,
        reasons: [
          'AI synthesis drifted away from requested account (Graham Company)',
          'AI synthesis drifted away from what the user is selling',
        ],
      },
      confidence: 'low',
    })

    expect(state.kind).toBe('blocked')
    expect(state.label).toBe('Blocked')
  })

  it('maps thin evidence to low-evidence state', () => {
    const state = mapMeetingPrepTrustState({
      status: {
        ...baseBrief.status,
        sourceCount: 2,
        sourceCounts: {
          found: 2,
          ranked: 2,
          used: 1,
        },
      },
      confidence: 'low',
    })

    expect(state.kind).toBe('low_evidence')
    expect(state.label).toBe('Low evidence')
  })
})