// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ShareButton from '../ShareButton'

const getValidAccessToken = vi.fn()

vi.mock('@/lib/supabase', () => ({
  getValidAccessToken: () => getValidAccessToken(),
}))

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('ShareButton', () => {
  beforeEach(() => {
    getValidAccessToken.mockResolvedValue('token-123')
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(),
      },
    })
  })

  it('shares the brief and copies the public link', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ slug: 'abc123' }),
    }))
    vi.stubGlobal('fetch', fetchMock)

    render(<ShareButton briefId="brief-1" />)
    fireEvent.click(screen.getByRole('button', { name: /share/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/intelligence/briefs', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ action: 'share', briefId: 'brief-1', share: true }),
      }))
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://www.getrelevantapp.com/intelligence/share/abc123')
      expect(screen.getByText('Link copied')).toBeInTheDocument()
    })
  })

  it('shows an error state when sharing fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })))

    render(<ShareButton briefId="brief-1" />)
    fireEvent.click(screen.getByRole('button', { name: /share/i }))

    await waitFor(() => {
      expect(screen.getByText('Share failed')).toBeInTheDocument()
    })
  })
})
