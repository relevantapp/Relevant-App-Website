// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { marketResearchFixture } from '../../../__fixtures__/market-research.fixture'
import MaturityCurve, { getMaturityDotX } from '../MaturityCurve'

afterEach(() => {
  cleanup()
})

describe('MaturityCurve', () => {
  it.each([
    ['innovation-trigger', 66],
    ['peak', 138],
    ['trough', 192],
    ['slope', 282],
    ['plateau', 354],
  ] as const)('places the dot at the expected x-coordinate for %s', (stage, expectedX) => {
    render(
      <MaturityCurve
        data={{
          stage,
          rationale: marketResearchFixture.answer!.whyItMatters,
        }}
        headline="The category is moving from novelty toward practical evaluation."
        asOf={marketResearchFixture.generatedAt}
        sources={marketResearchFixture.sources}
      />,
    )

    expect(getMaturityDotX(stage)).toBe(expectedX)
    expect(screen.getByTestId('maturity-dot')).toHaveAttribute('cx', `${expectedX}`)
  })
})
