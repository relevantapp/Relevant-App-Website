// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import React from 'react'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { businessCaseFixture } from '../../../__fixtures__/business-case.fixture'
import AssumptionsRegister from '../AssumptionsRegister'

afterEach(() => {
  cleanup()
})

describe('AssumptionsRegister', () => {
  it('renders rows from the fixture', () => {
    render(
      <AssumptionsRegister
        data={businessCaseFixture.assumptions ?? []}
        headline="A small set of assumptions still decides the outcome"
        asOf={businessCaseFixture.generatedAt}
        sources={businessCaseFixture.sources}
      />,
    )

    expect(screen.getAllByRole('row')).toHaveLength((businessCaseFixture.assumptions?.length ?? 0) + 1)
  })

  it('reorders rows when the confidence header is clicked', () => {
    render(
      <AssumptionsRegister
        data={businessCaseFixture.assumptions ?? []}
        headline="A small set of assumptions still decides the outcome"
        asOf={businessCaseFixture.generatedAt}
        sources={businessCaseFixture.sources}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Confidence' }))

    const rows = screen.getAllByRole('row').slice(1)
    expect(within(rows[0]).getByText('Adoption must become weekly, not occasional.')).toBeInTheDocument()
  })

  it('renders an empty state when no assumptions exist', () => {
    render(
      <AssumptionsRegister
        data={[]}
        headline="A small set of assumptions still decides the outcome"
        asOf={businessCaseFixture.generatedAt}
        sources={businessCaseFixture.sources}
      />,
    )

    expect(screen.getByText('No assumptions surfaced yet.')).toBeInTheDocument()
  })
})
