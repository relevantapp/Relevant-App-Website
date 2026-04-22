import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const createClientMock = vi.fn()
const saveClaimFeedbackMock = vi.fn()
const getUserMock = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}))

vi.mock('@/lib/intelligence/db', () => ({
  saveClaimFeedback: (...args: unknown[]) => saveClaimFeedbackMock(...args),
}))

describe('POST /api/intelligence/feedback', () => {
  beforeEach(() => {
    createClientMock.mockReset()
    saveClaimFeedbackMock.mockReset()
    getUserMock.mockReset()

    getUserMock.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })

    createClientMock.mockReturnValue({
      auth: {
        getUser: getUserMock,
      },
    })
  })

  it('rejects unauthorized requests', async () => {
    const { POST } = await import('../route')
    const request = new NextRequest('http://localhost/api/intelligence/feedback', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request)

    expect(response.status).toBe(401)
  })

  it('validates the payload before saving', async () => {
    const { POST } = await import('../route')
    const request = new NextRequest('http://localhost/api/intelligence/feedback', {
      method: 'POST',
      headers: {
        authorization: 'Bearer token-123',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        briefId: 'not-a-uuid',
        researchType: 'meeting_prep',
        claimKey: 'answer:conclusion',
        claimText: 'Hello',
        sentiment: 'up',
        flags: [],
        sourceIds: [],
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
    expect(saveClaimFeedbackMock).not.toHaveBeenCalled()
  })

  it('persists valid feedback through the db helper', async () => {
    saveClaimFeedbackMock.mockResolvedValue({ id: 'feedback-1', error: null })
    const { POST } = await import('../route')
    const request = new NextRequest('http://localhost/api/intelligence/feedback', {
      method: 'POST',
      headers: {
        authorization: 'Bearer token-123',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        briefId: '11111111-1111-4111-8111-111111111111',
        researchType: 'meeting_prep',
        claimKey: 'answer:conclusion',
        claimText: 'Hello',
        sentiment: 'down',
        flags: ['wrong'],
        sourceIds: ['s1'],
      }),
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(saveClaimFeedbackMock).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      expect.objectContaining({
        claimKey: 'answer:conclusion',
        sentiment: 'down',
        flags: ['wrong'],
      }),
    )
    expect(payload).toEqual({ id: 'feedback-1' })
  })
})
