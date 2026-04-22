// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { meetingPrepFixture } from '../../../__fixtures__/meeting-prep.fixture'
import SignalCardGrid from '../SignalCardGrid'

describe('SignalCardGrid', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-21T12:00:00Z'))
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(),
      },
    })
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('renders signal cards with correct age-bucket chips', () => {
    const { container } = render(
      <SignalCardGrid cards={meetingPrepFixture.signalCards} asOf={meetingPrepFixture.generatedAt} sources={meetingPrepFixture.sources} />,
    )

    expect(screen.getAllByRole('article')).toHaveLength(4)
    expect(container.querySelectorAll('[data-tone="fresh"]')).toHaveLength(2)
    expect(container.querySelectorAll('[data-tone="recent"]')).toHaveLength(1)
    expect(container.querySelectorAll('[data-tone="stale"]')).toHaveLength(1)
  })

  it('copies the suggested opener when the copy button is clicked', () => {
    render(
      <SignalCardGrid cards={meetingPrepFixture.signalCards} asOf={meetingPrepFixture.generatedAt} sources={meetingPrepFixture.sources} />,
    )

    fireEvent.click(screen.getAllByRole('button', { name: /copy opener/i })[0])
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      'How much has EU residency changed the deals you can actually move now?',
    )
  })

  it('omits the copy button when a card has no suggested opener', () => {
    render(
      <SignalCardGrid cards={meetingPrepFixture.signalCards} asOf={meetingPrepFixture.generatedAt} sources={meetingPrepFixture.sources} />,
    )

    expect(screen.getAllByRole('button', { name: /copy opener/i })).toHaveLength(3)
  })

  it('renders prose fallback when the v2 path is disabled', () => {
    render(
      <SignalCardGrid
        cards={meetingPrepFixture.signalCards}
        fallbackBullets={meetingPrepFixture.sections.whatJustHappened}
        asOf={meetingPrepFixture.generatedAt}
        sources={meetingPrepFixture.sources}
        flagEnabled={false}
      />,
    )

    expect(screen.getByTestId('signal-card-fallback')).toBeInTheDocument()
    expect(screen.getByText('Northstar just launched EU data residency, which removes a blocker for larger regulated buyers.')).toBeInTheDocument()
  })
})
