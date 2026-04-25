// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SignalCard from '../SignalCard'
import type { ProBriefItem } from '@/types/signals'

type MockAuthUser = { id: string } | null

const supabaseMocks = vi.hoisted(() => ({
  getUser: vi.fn<() => Promise<{ data: { user: MockAuthUser } }>>(async () => ({ data: { user: null } })),
  from: vi.fn(),
  invoke: vi.fn(async () => ({ data: null, error: null })),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: supabaseMocks.getUser,
    },
    from: supabaseMocks.from,
    functions: {
      invoke: supabaseMocks.invoke,
    },
  },
}))

afterEach(() => cleanup())

describe('SignalCard', () => {
  const signal: ProBriefItem = {
    id: 'signal-1',
    headline: 'Competitor changes pricing',
    what_happened: ['Pricing moved.'],
    why_it_matters: ['This changes the enterprise sales motion.'],
    why_showing: 'Matches your role.',
    synthesis: 'A competitor moved pricing in a way that changes the deal story.',
    sources: [{ label: 'Example', url: 'https://example.com' }],
    sourceCount: 1,
    consequence_steps: [],
  }

  beforeEach(() => {
    supabaseMocks.getUser.mockReset()
    supabaseMocks.getUser.mockResolvedValue({ data: { user: null } })
    supabaseMocks.from.mockReset()
    supabaseMocks.invoke.mockReset()
    supabaseMocks.invoke.mockResolvedValue({ data: null, error: null })

    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(),
      },
    })
  })

  it('opens the signal when the card itself is clicked', () => {
    const onClick = vi.fn()
    render(<SignalCard signal={signal} onClick={onClick} />)

    fireEvent.click(screen.getByRole('link', { name: /open signal/i }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('opens from the keyboard when the card is focused', () => {
    const onClick = vi.fn()
    render(<SignalCard signal={signal} onClick={onClick} />)

    fireEvent.keyDown(screen.getByRole('link', { name: /open signal/i }), { key: 'Enter' })

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('keeps secondary actions from opening the card', () => {
    const onClick = vi.fn()
    render(<SignalCard signal={signal} onClick={onClick} />)

    fireEvent.click(screen.getByRole('button', { name: /share signal/i }))

    expect(onClick).not.toHaveBeenCalled()
  })

  it('saves feed signals into the live notes table used by the app', async () => {
    const insert = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(async () => ({ data: { id: 'note-1' }, error: null })),
      })),
    }))
    supabaseMocks.from.mockReturnValue({ insert })
    supabaseMocks.getUser
      .mockResolvedValueOnce({ data: { user: null } })
      .mockResolvedValueOnce({ data: { user: { id: 'user-1' } } })

    render(<SignalCard signal={signal} onClick={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /save signal/i }))

    await waitFor(() => {
      expect(supabaseMocks.from).toHaveBeenCalledWith('notes_entries')
    })
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'user-1',
      entry_type: 'freeform',
      content: 'Saved',
      source_ref: 'signal-1',
      source_headline: 'Competitor changes pricing',
      origin: 'feed_save',
    }))
    expect(supabaseMocks.invoke).toHaveBeenCalledWith('pro-note-polish', { body: { note_id: 'note-1' } })
    expect(supabaseMocks.invoke).toHaveBeenCalledWith('pro-note-tags', { body: { note_id: 'note-1' } })
  })
})
