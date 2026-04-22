// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { BusinessCaseBrief } from '../../types'
import { businessCaseFixture } from '../__fixtures__/business-case.fixture'
import BusinessCaseResults from '../BusinessCaseResults'

afterEach(() => {
  cleanup()
})

describe('BusinessCaseResults factor cards', () => {
  it('renders severity and impact chips when factor tags are present', () => {
    render(<BusinessCaseResults brief={businessCaseFixture} onNewSearch={() => undefined} />)

    expect(screen.getAllByText('S: high').length).toBeGreaterThan(0)
    expect(screen.getAllByText('I: med').length).toBeGreaterThan(0)
  })

  it('renders legacy factors without chips when severity and impact are missing', () => {
    const clonedFixture = structuredClone(businessCaseFixture)
    const legacyBrief: BusinessCaseBrief = {
      ...clonedFixture,
      sections: {
        ...clonedFixture.sections,
        supportingFactors: clonedFixture.sections.supportingFactors.map(({ severity: _severity, impact: _impact, ...item }) => item),
        riskFactors: clonedFixture.sections.riskFactors.map(({ severity: _severity, impact: _impact, ...item }) => item),
      },
    }

    render(<BusinessCaseResults brief={legacyBrief} onNewSearch={() => undefined} />)

    expect(
      screen.getAllByText('Relevant already has multiple workflow entry points where better results presentation can drive immediate perceived value.').length,
    ).toBeGreaterThan(0)
    expect(screen.queryAllByText('S: high')).toHaveLength(0)
    expect(screen.queryAllByText('I: med')).toHaveLength(0)
  })
})
