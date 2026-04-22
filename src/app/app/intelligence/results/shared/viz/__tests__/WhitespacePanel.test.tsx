// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { competitiveFixture } from '../../../__fixtures__/competitive.fixture'
import WhitespacePanel from '../WhitespacePanel'

afterEach(() => {
  cleanup()
})

describe('WhitespacePanel', () => {
  it('always renders the four whitespace pockets and empty states for missing kinds', () => {
    render(
      <WhitespacePanel
        data={competitiveFixture.whitespace ?? []}
        headline="Relevant still has open pockets to win"
        asOf={competitiveFixture.generatedAt}
        sources={competitiveFixture.sources}
      />,
    )

    expect(screen.getByText('Segment gap')).toBeInTheDocument()
    expect(screen.getByText('Flank move')).toBeInTheDocument()
    expect(screen.getByText('Pricing gap')).toBeInTheDocument()
    expect(screen.getByText('Capability gap')).toBeInTheDocument()
    expect(screen.getByText('No clear gap identified here.')).toBeInTheDocument()
  })

  it('renders cited evidence for populated whitespace pockets', () => {
    render(
      <WhitespacePanel
        data={competitiveFixture.whitespace ?? []}
        headline="Relevant still has open pockets to win"
        asOf={competitiveFixture.generatedAt}
        sources={competitiveFixture.sources}
      />,
    )

    expect(screen.getByText(/Mid-market strategy and revenue teams still want a decision-ready layer/i)).toBeInTheDocument()
  })
})
