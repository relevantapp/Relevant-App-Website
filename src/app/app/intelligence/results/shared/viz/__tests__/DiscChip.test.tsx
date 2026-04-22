// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { meetingPrepFixture } from '../../../__fixtures__/meeting-prep.fixture'
import DiscChip, { getDominantDiscAxis } from '../DiscChip'
import StakeholderMatrix from '../StakeholderMatrix'

afterEach(() => {
  cleanup()
})

describe('DiscChip', () => {
  it('renders for stakeholders with disc data and stays hidden when disc is absent', () => {
    render(
      <StakeholderMatrix
        rows={meetingPrepFixture.stakeholders ?? []}
        sources={meetingPrepFixture.sources}
        asOf={meetingPrepFixture.generatedAt}
      />,
    )

    expect(screen.getByRole('button', { name: /Maya Chen: Comms style/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Devon Patel: Comms style/i })).not.toBeInTheDocument()
  })

  it('calculates the dominant axis and breaks ties alphabetically', () => {
    expect(getDominantDiscAxis({ d: 81, i: 58, s: 47, c: 64 })).toBe('d')
    expect(getDominantDiscAxis({ d: 72, i: 72, s: 52, c: 72 })).toBe('c')
  })

  it('opens the guidance popover via keyboard', () => {
    render(<DiscChip disc={{ d: 81, i: 58, s: 47, c: 64 }} personName="Maya Chen" commsStyleTag="decisive operator" />)

    const button = screen.getByRole('button', { name: /Maya Chen: Comms style/i })
    fireEvent.keyDown(button, { key: 'Enter' })

    expect(screen.getByRole('dialog', { name: 'Maya Chen communication style' })).toBeInTheDocument()
    expect(screen.getByText('Do')).toBeInTheDocument()
    expect(screen.getByText('Do not')).toBeInTheDocument()
  })
})
