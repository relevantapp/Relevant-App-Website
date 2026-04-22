// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import React from 'react'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { marketResearchFixture } from '../../../__fixtures__/market-research.fixture'
import LogoMarketMap, { getFaviconUrl } from '../LogoMarketMap'

afterEach(() => {
  window.history.replaceState({}, '', '/')
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
        playerDetails={marketResearchFixture.players}
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
        playerDetails={marketResearchFixture.players}
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
        playerDetails={marketResearchFixture.players}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Glean/i }))

    const detailPanel = screen.getByText('Player detail').closest('aside')
    expect(detailPanel).not.toBeNull()
    expect(within(detailPanel as HTMLElement).getByText('Glean')).toBeInTheDocument()
    expect(within(detailPanel as HTMLElement).getByRole('link', { name: 'Open player detail' })).toHaveAttribute('href', 'https://glean.com')
  })

  it('hydrates filters from the URL query params', () => {
    window.history.replaceState({}, '', '/app/intelligence?mrSegment=Answer-first%20workflow%20tools&mrStage=emerging&mrGeo=North%20America')

    render(
      <LogoMarketMap
        data={marketResearchFixture.marketMap!}
        headline="The market is fragmenting into a few distinct product shapes, and the wedge is the answer-first layer."
        asOf={marketResearchFixture.generatedAt}
        sources={marketResearchFixture.sources}
        playerDetails={marketResearchFixture.players}
      />,
    )

    expect(screen.getByRole('combobox', { name: 'Segment' })).toHaveValue('Answer-first workflow tools')
    expect(screen.getByRole('combobox', { name: 'Stage' })).toHaveValue('emerging')
    expect(screen.getByRole('combobox', { name: 'Geography' })).toHaveValue('North America')
    expect(screen.getByRole('button', { name: /Relevant/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /AlphaSense/i })).not.toBeInTheDocument()
  })

  it('updates the URL query params when a filter changes', () => {
    render(
      <LogoMarketMap
        data={marketResearchFixture.marketMap!}
        headline="The market is fragmenting into a few distinct product shapes, and the wedge is the answer-first layer."
        asOf={marketResearchFixture.generatedAt}
        sources={marketResearchFixture.sources}
        playerDetails={marketResearchFixture.players}
      />,
    )

    fireEvent.change(screen.getByRole('combobox', { name: 'Stage' }), {
      target: { value: 'leader' },
    })

    expect(window.location.search).toContain('mrStage=leader')
    expect(screen.getByRole('button', { name: /AlphaSense/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Relevant/i })).not.toBeInTheDocument()
  })
})
