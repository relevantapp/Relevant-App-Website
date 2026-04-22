import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { meetingPrepFixture } from '@/app/app/intelligence/results/__fixtures__/meeting-prep.fixture'
import {
  buildBriefSignature,
  formatPriorBriefBaseline,
  loadPriorBriefBaseline,
} from '../prior-briefs'

function makeSupabaseMock(
  rows: Array<{
    request_payload: Record<string, unknown>
    synthesis: unknown
    created_at: string
  }>,
  error: { message: string } | null = null,
): SupabaseClient {
  const limit = vi.fn(async () => ({ data: rows, error }))
  const order = vi.fn(() => ({ limit }))
  const eqResearchType = vi.fn(() => ({ order }))
  const eqUser = vi.fn(() => ({ eq: eqResearchType }))
  const select = vi.fn(() => ({ eq: eqUser }))
  const from = vi.fn(() => ({ select }))

  return {
    from,
  } as unknown as SupabaseClient
}

describe('buildBriefSignature', () => {
  it('normalizes and sorts request fields for stable signatures', () => {
    const signature = buildBriefSignature('competitive_analysis', {
      yourCompany: ' Relevant ',
      competitors: ['Crayon', 'AlphaSense', 'Crayon'],
      focusArea: ' Positioning ',
    })

    expect(signature).toBe('competitive_analysis:relevant|alphasense,crayon|positioning')
  })

  it('returns null when the identifying field is missing', () => {
    expect(buildBriefSignature('meeting_prep', {})).toBeNull()
  })
})

describe('formatPriorBriefBaseline', () => {
  it('summarizes the prior brief with the conclusion and highlights', () => {
    const baseline = formatPriorBriefBaseline(meetingPrepFixture)

    expect(baseline).toContain(`- Generated at: ${meetingPrepFixture.generatedAt}`)
    expect(baseline).toContain(`- Headline: ${meetingPrepFixture.headline}`)
    expect(baseline).toContain(`- Conclusion: ${meetingPrepFixture.answer?.conclusion.text}`)
    expect(baseline).toContain('- Key points:')
  })
})

describe('loadPriorBriefBaseline', () => {
  it('returns the most recent matching prior brief baseline for the same entity', async () => {
    const supabase = makeSupabaseMock([
      {
        request_payload: { accountName: 'OtherCo' },
        synthesis: meetingPrepFixture,
        created_at: '2026-04-21T10:00:00.000Z',
      },
      {
        request_payload: { accountName: 'Northstar Health' },
        synthesis: meetingPrepFixture,
        created_at: '2026-04-20T10:00:00.000Z',
      },
    ])

    const baseline = await loadPriorBriefBaseline({
      supabase,
      userId: 'user-123',
      researchType: 'meeting_prep',
      requestPayload: { accountName: ' northstar   health ' },
    })

    expect(baseline).toContain(meetingPrepFixture.headline)
    expect(baseline).toContain(meetingPrepFixture.answer?.conclusion.text ?? '')
  })

  it('returns null when the matched prior brief payload is invalid', async () => {
    const supabase = makeSupabaseMock([
      {
        request_payload: { accountName: 'Northstar Health' },
        synthesis: { not: 'a brief' },
        created_at: '2026-04-20T10:00:00.000Z',
      },
    ])

    const baseline = await loadPriorBriefBaseline({
      supabase,
      userId: 'user-123',
      researchType: 'meeting_prep',
      requestPayload: { accountName: 'Northstar Health' },
    })

    expect(baseline).toBeNull()
  })
})
