// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { marketResearchFixture } from '../../../__fixtures__/market-research.fixture'
import QuoteWall, { getQuoteThemes } from '../QuoteWall'

afterEach(() => {
  cleanup()
})

describe('QuoteWall', () => {
  it('extracts unique themes correctly', () => {
    expect(getQuoteThemes(marketResearchFixture.quotes ?? [])).toEqual([
      'Workflow proof',
      'Procurement comfort',
      'Buyer expectation',
    ])
  })

  it('filters cards when a theme chip is clicked and resets on All', () => {
    render(
      <QuoteWall
        data={marketResearchFixture.quotes ?? []}
        headline="The market is telling us that proof and workflow clarity matter more than generic AI posture."
        asOf={marketResearchFixture.generatedAt}
        sources={marketResearchFixture.sources}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Workflow proof' }))
    expect(screen.getAllByTestId('quote-card')).toHaveLength(1)
    expect(screen.getByText(/Teams keep asking whether the system gets them to a conclusion they can defend/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'All' }))
    expect(screen.getAllByTestId('quote-card')).toHaveLength(marketResearchFixture.quotes?.length ?? 0)
  })

  it('renders an empty-state message when no quotes exist', () => {
    render(
      <QuoteWall
        data={[]}
        headline="The market is telling us that proof and workflow clarity matter more than generic AI posture."
        asOf={marketResearchFixture.generatedAt}
        sources={marketResearchFixture.sources}
      />,
    )

    expect(screen.queryByRole('button', { name: 'All' })).not.toBeInTheDocument()
    expect(screen.getByText('No quotes captured yet.')).toBeInTheDocument()
  })
})
