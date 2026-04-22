// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { businessCaseFixture } from '../../../__fixtures__/business-case.fixture'
import TornadoChart, { getSortedTornadoEntries, getTornadoBarWidths } from '../TornadoChart'

afterEach(() => {
  cleanup()
})

describe('TornadoChart', () => {
  it('sorts assumptions by sensitivity range descending', () => {
    const sorted = getSortedTornadoEntries(businessCaseFixture.tornado ?? [])

    expect(sorted.map((entry) => entry.assumption)).toEqual([
      'Workflow reuse rate',
      'Enterprise conversion lift',
      'Implementation burden',
    ])
  })

  it('scales bar widths proportionally to impact magnitude', () => {
    const widths = getTornadoBarWidths(getSortedTornadoEntries(businessCaseFixture.tornado ?? []))

    expect(widths[0].highWidth).toBeGreaterThan(widths[2].highWidth)
    expect(widths[0].lowWidth).toBeGreaterThan(widths[2].lowWidth)
  })

  it('renders an empty-state message when no sensitivity data exists', () => {
    render(
      <TornadoChart
        data={[]}
        headline="The business case is most sensitive to a few assumptions"
        asOf={businessCaseFixture.generatedAt}
        sources={businessCaseFixture.sources}
      />,
    )

    expect(screen.getByText('No sensitivity data.')).toBeInTheDocument()
  })
})
