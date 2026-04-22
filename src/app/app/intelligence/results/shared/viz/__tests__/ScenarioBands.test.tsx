// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { businessCaseFixture } from '../../../__fixtures__/business-case.fixture'
import ScenarioBands, { getScenarioDotOffset } from '../ScenarioBands'

afterEach(() => {
  cleanup()
})

describe('ScenarioBands', () => {
  it('places the base dot proportionally between downside and upside', () => {
    expect(getScenarioDotOffset(10, 20, 40)).toBeCloseTo(1 / 3, 3)
  })

  it('appends units to all rendered values', () => {
    render(
      <ScenarioBands
        data={businessCaseFixture.scenarios!}
        headline="The base case sits inside a realistic range"
        asOf={businessCaseFixture.generatedAt}
        sources={businessCaseFixture.sources}
      />,
    )

    expect(screen.getByText('80%')).toBeInTheDocument()
    expect(screen.getByText('120%')).toBeInTheDocument()
    expect(screen.getByText('150%')).toBeInTheDocument()
  })

  it('warns and still renders when the range is inverted', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    render(
      <ScenarioBands
        data={{
          metric: 'Payback period',
          unit: 'mo',
          downside: { value: 20, triggers: ['Budget freeze'] },
          base: { value: 14, drivers: ['Current plan'] },
          upside: { value: 10, triggers: ['Fast rollout'] },
        }}
        headline="The base case still renders when the range is messy"
        asOf={businessCaseFixture.generatedAt}
        sources={businessCaseFixture.sources}
      />,
    )

    expect(warn).toHaveBeenCalled()
    expect(screen.getByText('Payback period')).toBeInTheDocument()

    warn.mockRestore()
  })
})
