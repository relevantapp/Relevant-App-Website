// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { businessCaseFixture } from '../../../__fixtures__/business-case.fixture'
import DriverTree from '../DriverTree'

afterEach(() => {
  cleanup()
})

describe('DriverTree', () => {
  it('renders branches in canonical order even when fixture order differs', () => {
    render(
      <DriverTree
        data={businessCaseFixture.driverTree!}
        headline="The business case rests on four decision branches"
        asOf={businessCaseFixture.generatedAt}
        sources={businessCaseFixture.sources}
      />,
    )

    expect(screen.getAllByTestId('driver-branch-title').map((node) => node.textContent)).toEqual([
      'Demand',
      'Unit economics',
      'Strategic fit',
      'Execution risk',
    ])
  })

  it('expands children when a branch card is opened', () => {
    render(
      <DriverTree
        data={businessCaseFixture.driverTree!}
        headline="The business case rests on four decision branches"
        asOf={businessCaseFixture.generatedAt}
        sources={businessCaseFixture.sources}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /Demand/i }))

    expect(screen.getByText(/Workflow-specific demand is strongest/i)).toBeInTheDocument()
  })

  it('renders a placeholder card for missing branches', () => {
    render(
      <DriverTree
        data={{ branches: businessCaseFixture.driverTree!.branches.filter((branch) => branch.name !== 'economics') }}
        headline="The business case rests on four decision branches"
        asOf={businessCaseFixture.generatedAt}
        sources={businessCaseFixture.sources}
      />,
    )

    expect(screen.getByText('Unit economics')).toBeInTheDocument()
    expect(screen.getByText('Not assessed.')).toBeInTheDocument()
  })
})
