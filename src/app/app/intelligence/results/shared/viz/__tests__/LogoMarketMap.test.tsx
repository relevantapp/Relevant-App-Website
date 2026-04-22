// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import React from 'react'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { marketResearchFixture } from '../../../__fixtures__/market-research.fixture'
import LogoMarketMap, { getFaviconUrl } from '../LogoMarketMap'

afterEach(() => {
  cleanup()
})

describe('LogoMarketMap', () => {
  it('renders the segment boxes and tiles from the fixture', () => {
    render(
      <LogoMarketMap
        data={marketResearchFixture.marketMap!}
        headline="The market is fragmenting into a few distinct product shapes, and the wedge is the answer-first layer."
        asOf={marketResearchFixture.generatedAt}
        sources={marketResearchFixture.sources}
      />,
    )

    expect(screen.getAllByText('Monitoring and market intelligence')).toHaveLength(2)
    expect(screen.getByRole('button', { name: /AlphaSense/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Relevant/i })).toBeInTheDocument()
  })

  it('uses the favicon fallback when logoUrl is absent and initials when domain is also absent', () => {
    render(
      <LogoMarketMap
        data={marketResearchFixture.marketMap!}
        headline="The market is fragmenting into a few distinct product shapes, and the wedge is the answer-first layer."
        asOf={marketResearchFixture.generatedAt}
        sources={marketResearchFixture.sources}
      />,
    )

    const cbInsightsTile = screen.getByRole('button', { name: /CB Insights/i })
    const cbInsightsImage = cbInsightsTile.querySelector('img')
    expect(cbInsightsImage).not.toBeNull()
    expect(cbInsightsImage?.getAttribute('src')).toBe(getFaviconUrl('cbinsights.com'))

    expect(screen.getByText('SW')).toBeInTheDocument()
  })

  it('updates the side panel when a tile is clicked', () => {
    render(
      <LogoMarketMap
        data={marketResearchFixture.marketMap!}
        headline="The market is fragmenting into a few distinct product shapes, and the wedge is the answer-first layer."
        asOf={marketResearchFixture.generatedAt}
        sources={marketResearchFixture.sources}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Glean/i }))

    const detailPanel = screen.getByText('Player detail').closest('aside')
    expect(detailPanel).not.toBeNull()
    expect(within(detailPanel as HTMLElement).getByText('Glean')).toBeInTheDocument()
    expect(within(detailPanel as HTMLElement).getByRole('link', { name: 'Open player detail' })).toHaveAttribute('href', 'https://glean.com')
  })
})
