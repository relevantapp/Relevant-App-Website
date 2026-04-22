// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ClaimFeedback from '../ClaimFeedback'
import { ClaimFeedbackProvider } from '../ClaimFeedbackContext'

vi.mock('@/lib/supabase', () => ({
  getValidAccessToken: vi.fn().mockResolvedValue('token-123'),
}))

afterEach(() => cleanup())

describe('ClaimFeedback', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'feedback-1' }),
    }))
  })

  it('posts helpful feedback through the shared provider', async () => {
    render(
      <ClaimFeedbackProvider briefId="11111111-1111-4111-8111-111111111111" researchType="meeting_prep">
        <ClaimFeedback claimKey="answer:conclusion" claimText="The buyer is leaning in." sourceIds={['s1']} />
      </ClaimFeedbackProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Mark claim helpful' }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/intelligence/feedback', expect.objectContaining({
        method: 'POST',
      }))
    })

    const [, options] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(options.headers).toMatchObject({
      Authorization: 'Bearer token-123',
      'Content-Type': 'application/json',
    })
    expect(JSON.parse(options.body as string)).toMatchObject({
      briefId: '11111111-1111-4111-8111-111111111111',
      researchType: 'meeting_prep',
      claimKey: 'answer:conclusion',
      claimText: 'The buyer is leaning in.',
      sentiment: 'up',
      flags: [],
      sourceIds: ['s1'],
    })
  })

  it('reveals negative flags and submits the chosen reason', async () => {
    render(
      <ClaimFeedbackProvider briefId="11111111-1111-4111-8111-111111111111" researchType="meeting_prep">
        <ClaimFeedback claimKey="answer:conclusion" claimText="The buyer is leaning in." sourceIds={['s1']} />
      </ClaimFeedbackProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Flag claim' }))
    fireEvent.click(screen.getByRole('button', { name: 'Flag claim as wrong' }))

    await waitFor(() => expect(fetch).toHaveBeenCalled())

    const [, options] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(JSON.parse(options.body as string)).toMatchObject({
      sentiment: 'down',
      flags: ['wrong'],
    })
  })

  it('stays hidden when no saved brief id is available', () => {
    render(
      <ClaimFeedbackProvider briefId={null} researchType="meeting_prep">
        <ClaimFeedback claimKey="answer:conclusion" claimText="The buyer is leaning in." />
      </ClaimFeedbackProvider>,
    )

    expect(screen.queryByTestId('claim-feedback')).not.toBeInTheDocument()
  })
})
