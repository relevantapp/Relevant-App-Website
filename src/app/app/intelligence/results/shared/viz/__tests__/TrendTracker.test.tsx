// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { marketResearchFixture } from '../../../__fixtures__/market-research.fixture'
import TrendTracker from '../TrendTracker'

afterEach(() => {
  cleanup()
})

describe('TrendTracker', () => {
  it('renders one chart per tracked signal in the given order', () => {
    render(
      <TrendTracker
        data={marketResearchFixture.trackedSignals}
        asOf={marketResearchFixture.generatedAt}
        sources={marketResearchFixture.sources}
      />,
    )

    expect(screen.getAllByTestId('trend-chart')).toHaveLength(3)
    expect(screen.getByText('Search interest is rising faster than general awareness of the category.')).toBeInTheDocument()
    expect(screen.getByText('Workflow-specific funding is still small, but it is moving upward.')).toBeInTheDocument()
    expect(screen.getByText('Earnings-call mentions are rising as the market becomes more concrete.')).toBeInTheDocument()
  })

  it('renders nothing when no tracked signals are present', () => {
    const { container } = render(
      <TrendTracker
        data={[]}
        asOf={marketResearchFixture.generatedAt}
        sources={marketResearchFixture.sources}
      />,
    )

    expect(container.firstChild).toBeNull()
  })

  it('silently skips signals with fewer than two points', () => {
    render(
      <TrendTracker
        data={[
          {
            metric: 'Search interest',
            headline: 'Search interest is rising faster than general awareness of the category.',
            unit: ' pts',
            points: [
              { t: 'Q4', value: 18 },
              { t: 'Q1', value: 31 },
            ],
          },
          {
            metric: 'Broken series',
            headline: 'This should not render.',
            points: [{ t: 'Q1', value: 3 }],
          } as never,
        ]}
        asOf={marketResearchFixture.generatedAt}
        sources={marketResearchFixture.sources}
      />,
    )

    expect(screen.getAllByTestId('trend-chart')).toHaveLength(1)
    expect(screen.queryByText('This should not render.')).not.toBeInTheDocument()
  })
})
