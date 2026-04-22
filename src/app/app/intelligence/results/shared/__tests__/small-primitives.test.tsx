// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import AsOfChip from '../AsOfChip'
import ConfidenceBadge from '../ConfidenceBadge'
import PriorityStrip from '../PriorityStrip'

describe('small intelligence results primitives', () => {
  it('renders confidence badges for each level', () => {
    render(
      <div>
        <ConfidenceBadge level="high" driver="Two fresh primary sources." />
        <ConfidenceBadge level="medium" driver="Mixed evidence." />
        <ConfidenceBadge level="low" driver="Single weak source." />
      </div>,
    )

    expect(screen.getByLabelText('High confidence: Two fresh primary sources.')).toBeInTheDocument()
    expect(screen.getByLabelText('Medium confidence: Mixed evidence.')).toBeInTheDocument()
    expect(screen.getByLabelText('Low confidence: Single weak source.')).toBeInTheDocument()
  })

  it('renders priority strips for each tier', () => {
    render(
      <div>
        <PriorityStrip priority="must" />
        <PriorityStrip priority="should" />
        <PriorityStrip priority="fyi" />
      </div>,
    )

    expect(screen.getByLabelText('Priority must')).toBeInTheDocument()
    expect(screen.getByLabelText('Priority should')).toBeInTheDocument()
    expect(screen.getByLabelText('Priority fyi')).toBeInTheDocument()
  })

  it('formats as-of dates relative to now and handles null gracefully', () => {
    const now = new Date('2026-04-21T12:00:00.000Z')
    const { rerender, container } = render(<AsOfChip at="2026-04-20T12:00:00.000Z" now={now} />)

    expect(screen.getByText('updated yesterday')).toBeInTheDocument()

    rerender(<AsOfChip at="2026-03-10T12:00:00.000Z" now={now} />)
    expect(screen.getByText('updated last month')).toBeInTheDocument()

    rerender(<AsOfChip at={null} now={now} />)
    expect(container).toBeEmptyDOMElement()
  })
})
