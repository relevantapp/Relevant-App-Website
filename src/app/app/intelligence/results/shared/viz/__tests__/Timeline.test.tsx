// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { competitiveFixture } from '../../../__fixtures__/competitive.fixture'
import Timeline from '../Timeline'

afterEach(() => {
  cleanup()
})

describe('Timeline', () => {
  it('filters events by type', () => {
    render(
      <Timeline
        competitors={competitiveFixture.competitors}
        headline="Competitor moves are clustering around workflow packaging"
        asOf={competitiveFixture.generatedAt}
        sources={competitiveFixture.sources}
      />,
    )

    expect(screen.getAllByTestId('timeline-event')).toHaveLength(6)

    fireEvent.click(screen.getByRole('button', { name: 'market' }))

    expect(screen.getAllByTestId('timeline-event')).toHaveLength(4)
  })

  it('toggles between merged and per-competitor layouts', () => {
    render(
      <Timeline
        competitors={competitiveFixture.competitors}
        headline="Competitor moves are clustering around workflow packaging"
        asOf={competitiveFixture.generatedAt}
        sources={competitiveFixture.sources}
      />,
    )

    expect(screen.getByTestId('timeline-layout-merged')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Per competitor' }))

    expect(screen.getByTestId('timeline-layout-split')).toBeInTheDocument()
  })

  it('falls back to prose recent moves when typed events are absent', () => {
    render(
      <Timeline
        competitors={competitiveFixture.competitors.map(({ recentMovesTyped: _recentMovesTyped, ...competitor }) => competitor)}
        headline="Competitor moves are clustering around workflow packaging"
        asOf={competitiveFixture.generatedAt}
        sources={competitiveFixture.sources}
      />,
    )

    expect(screen.getByText(/Expanded transcript workflows for research teams/)).toBeInTheDocument()
    expect(screen.queryByTestId('timeline-layout-merged')).not.toBeInTheDocument()
  })
})
