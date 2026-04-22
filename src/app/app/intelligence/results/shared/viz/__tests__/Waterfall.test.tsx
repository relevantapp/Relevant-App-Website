// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { businessCaseFixture } from '../../../__fixtures__/business-case.fixture'
import Waterfall, { calculateWaterfallBars } from '../Waterfall'

afterEach(() => {
  cleanup()
})

describe('Waterfall', () => {
  it('computes the running total correctly from baseline through total', () => {
    const bars = calculateWaterfallBars(businessCaseFixture.waterfall ?? [])

    expect(bars.map((bar) => bar.end)).toEqual([100, 112, 122, 119, 119])
  })

  it('colors baseline and total bars gray and driver bars by sign', () => {
    render(
      <Waterfall
        data={businessCaseFixture.waterfall ?? []}
        headline="A few drivers build the case from baseline to target"
        asOf={businessCaseFixture.generatedAt}
        sources={businessCaseFixture.sources}
      />,
    )

    expect(screen.getByTestId('waterfall-rect-0')).toHaveAttribute('fill', 'var(--text-soft)')
    expect(screen.getByTestId('waterfall-rect-1')).toHaveAttribute('fill', 'var(--accent-teal)')
    expect(screen.getByTestId('waterfall-rect-3')).toHaveAttribute('fill', 'var(--accent-coral)')
    expect(screen.getByTestId('waterfall-rect-4')).toHaveAttribute('fill', 'var(--text-soft)')
  })

  it('shows cited assumption detail when a bar is hovered', () => {
    render(
      <Waterfall
        data={businessCaseFixture.waterfall ?? []}
        headline="A few drivers build the case from baseline to target"
        asOf={businessCaseFixture.generatedAt}
        sources={businessCaseFixture.sources}
      />,
    )

    fireEvent.mouseEnter(screen.getAllByTestId('waterfall-bar')[1])

    expect(screen.getByText(/Higher weekly reuse lifts the outcome materially/i)).toBeInTheDocument()
  })
})
