// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import React from 'react'
import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { marketResearchFixture } from '../../../__fixtures__/market-research.fixture'
import WatchList from '../WatchList'

afterEach(() => {
  cleanup()
})

describe('WatchList', () => {
  it('renders the watch items in order', () => {
    render(
      <WatchList
        data={marketResearchFixture.watchList ?? []}
        headline="A short list of signals could still change the category next quarter."
        asOf={marketResearchFixture.generatedAt}
        sources={marketResearchFixture.sources}
      />,
    )

    const items = screen.getAllByTestId('watch-item')
    expect(items).toHaveLength(marketResearchFixture.watchList?.length ?? 0)
    expect(within(items[0]).getByText(marketResearchFixture.watchList?.[0]?.signal ?? '')).toBeInTheDocument()
    expect(within(items[1]).getByText(marketResearchFixture.watchList?.[1]?.signal ?? '')).toBeInTheDocument()
  })

  it('formats next-check dates for future and past cases', () => {
    render(
      <WatchList
        data={[
          {
            signal: 'Future check',
            whyItMatters: 'A future date should render in relative form.',
            nextCheckBy: '2026-04-24T12:00:00.000Z',
            sources: ['mr-1'],
          },
          {
            signal: 'Past check',
            whyItMatters: 'A past date should also render in relative form.',
            nextCheckBy: '2026-04-18T12:00:00.000Z',
            sources: ['mr-2'],
          },
        ]}
        headline="A short list of signals could still change the category next quarter."
        asOf={marketResearchFixture.generatedAt}
        sources={marketResearchFixture.sources}
        now={new Date('2026-04-21T12:00:00.000Z')}
      />,
    )

    expect(screen.getByText('next check in 3 days')).toBeInTheDocument()
    expect(screen.getByText('next check 3 days ago')).toBeInTheDocument()
  })
})
