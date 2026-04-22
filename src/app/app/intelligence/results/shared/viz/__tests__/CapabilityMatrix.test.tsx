// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { competitiveFixture } from '../../../__fixtures__/competitive.fixture'
import CapabilityMatrix from '../CapabilityMatrix'

afterEach(() => {
  cleanup()
})

describe('CapabilityMatrix', () => {
  it('renders default totals from the unweighted comparison matrix', () => {
    render(
      <CapabilityMatrix
        data={competitiveFixture.comparisonMatrix}
        headline="Relevant leads when answer speed matters"
        asOf={competitiveFixture.generatedAt}
        sources={competitiveFixture.sources}
        yourCompany={competitiveFixture.yourCompany}
      />,
    )

    expect(screen.getByTestId('capability-total-relevant')).toHaveTextContent('16')
    expect(screen.getByTestId('capability-total-alphasense')).toHaveTextContent('17')
    expect(screen.getByTestId('capability-total-klue')).toHaveTextContent('14')
  })

  it('recomputes totals when a dimension weight changes', () => {
    render(
      <CapabilityMatrix
        data={competitiveFixture.comparisonMatrix}
        headline="Relevant leads when answer speed matters"
        asOf={competitiveFixture.generatedAt}
        sources={competitiveFixture.sources}
        yourCompany={competitiveFixture.yourCompany}
      />,
    )

    fireEvent.change(screen.getByRole('slider', { name: 'Weight for Answer quality' }), {
      target: { value: '5' },
    })

    expect(screen.getByTestId('capability-total-relevant')).toHaveTextContent('19.3')
    expect(screen.getByTestId('capability-total-alphasense')).toHaveTextContent('19.7')
    expect(screen.getByTestId('capability-total-klue')).toHaveTextContent('16')
  })

  it('highlights the your-company column and labels the slider accessibly', () => {
    render(
      <CapabilityMatrix
        data={competitiveFixture.comparisonMatrix}
        headline="Relevant leads when answer speed matters"
        asOf={competitiveFixture.generatedAt}
        sources={competitiveFixture.sources}
        yourCompany={competitiveFixture.yourCompany}
      />,
    )

    expect(screen.getByText('you')).toBeInTheDocument()
    expect(screen.getByTestId('capability-company-relevant')).toHaveStyle({
      background: 'color-mix(in oklch, var(--accent-teal) 12%, var(--bg-elevated))',
    })
    expect(screen.getByRole('slider', { name: 'Weight for Answer quality' })).toBeInTheDocument()
  })
})
