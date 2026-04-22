// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import React from 'react'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { competitiveFixture } from '../../../__fixtures__/competitive.fixture'
import { competitiveNoQuadrantFixture } from '../../../__fixtures__/competitive-no-quadrant.fixture'
import CompositeQuadrant, { getCompositeQuadrantPoint } from '../CompositeQuadrant'

afterEach(() => {
  cleanup()
})

describe('CompositeQuadrant', () => {
  it('renders all plotted points from the fixture', () => {
    render(
      <CompositeQuadrant
        data={competitiveFixture.compositeQuadrant!}
        headline="Relevant and AlphaSense split the category in different ways"
        asOf={competitiveFixture.generatedAt}
        sources={competitiveFixture.sources}
      />,
    )

    expect(screen.getAllByRole('button', { name: /Relevant|AlphaSense|Klue|Crayon/ })).toHaveLength(4)
  })

  it('renders only the reason panel when the quadrant is gated off', () => {
    render(
      <CompositeQuadrant
        data={competitiveNoQuadrantFixture.compositeQuadrant!}
        headline="The axis evidence is too soft for a quadrant"
        asOf={competitiveNoQuadrantFixture.generatedAt}
        sources={competitiveNoQuadrantFixture.sources}
      />,
    )

    expect(screen.getByText(/axes were not distinct enough/i)).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('shows the rationale popover when a point is hovered', () => {
    render(
      <CompositeQuadrant
        data={competitiveFixture.compositeQuadrant!}
        headline="Relevant and AlphaSense split the category in different ways"
        asOf={competitiveFixture.generatedAt}
        sources={competitiveFixture.sources}
      />,
    )

    fireEvent.mouseEnter(screen.getByTestId('composite-point-relevant'))

    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toBeInTheDocument()
    expect(within(tooltip).getByText('Relevant')).toBeInTheDocument()
    expect(within(tooltip).getByText(/Relevant sits highest on workflow decisiveness/i)).toBeInTheDocument()
  })

  it('keeps plotted points inside the view box', () => {
    const plotted = competitiveFixture.compositeQuadrant
    if (!plotted || !plotted.rendered) throw new Error('Fixture should render a quadrant')

    for (const point of plotted.points) {
      const position = getCompositeQuadrantPoint(point.x, point.y)
      expect(position.x).toBeGreaterThanOrEqual(72)
      expect(position.x).toBeLessThanOrEqual(344)
      expect(position.y).toBeGreaterThanOrEqual(40)
      expect(position.y).toBeLessThanOrEqual(320)
    }
  })
})
