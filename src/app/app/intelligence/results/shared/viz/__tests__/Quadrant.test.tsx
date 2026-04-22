// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import Quadrant, { getQuadrantPoint } from '../Quadrant'

afterEach(() => {
  cleanup()
})

describe('Quadrant', () => {
  it('renders plotted players at the expected coordinates', () => {
    const { container } = render(
      <Quadrant
        players={[
          {
            name: 'Relevant',
            category: 'emerging',
            description: 'Answer-first workflow.',
            estimatedPosition: 'Decision layer wedge.',
            scale: 0.25,
            momentum: 0.75,
            scaleRationale: 'Still earlier in distribution.',
            momentumRationale: 'Strong narrative movement.',
          },
          {
            name: 'AlphaSense',
            category: 'leader',
            description: 'Enterprise platform.',
            estimatedPosition: 'Breadth leader.',
            scale: 0.9,
            momentum: 0.6,
            scaleRationale: 'Large enterprise footprint.',
            momentumRationale: 'Steady but still expanding.',
          },
        ]}
      />,
    )

    const expected = getQuadrantPoint(0.25, 0.75)
    const point = container.querySelector('circle')

    expect(point).toHaveAttribute('cx', `${expected.x}`)
    expect(point).toHaveAttribute('cy', `${expected.y}`)
  })

  it('lists unplotted players with a reason when scores are missing', () => {
    render(
      <Quadrant
        players={[
          {
            name: 'Relevant',
            category: 'emerging',
            description: 'Answer-first workflow.',
            estimatedPosition: 'Decision layer wedge.',
          },
        ]}
      />,
    )

    expect(screen.getByText('Unplotted')).toBeInTheDocument()
    expect(screen.getAllByText('Relevant').length).toBeGreaterThan(0)
    expect(screen.getByText('Missing both scale and momentum scores.')).toBeInTheDocument()
  })
})
