// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { meetingPrepFixture } from '../../../__fixtures__/meeting-prep.fixture'
import StakeholderMatrix from '../StakeholderMatrix'

afterEach(() => {
  cleanup()
})

describe('StakeholderMatrix', () => {
  it('renders an accessible table with all core columns', () => {
    render(
      <StakeholderMatrix
        rows={meetingPrepFixture.stakeholders ?? []}
        sources={meetingPrepFixture.sources}
        asOf={meetingPrepFixture.generatedAt}
      />,
    )

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Likely agenda')).toBeInTheDocument()
    expect(screen.getByText('Shorten evaluation cycles without creating more analyst overhead.')).toBeInTheDocument()
  })

  it('renders explicit unknown fields for null stakeholder cells', () => {
    render(
      <StakeholderMatrix
        rows={meetingPrepFixture.stakeholders ?? []}
        sources={meetingPrepFixture.sources}
        asOf={meetingPrepFixture.generatedAt}
      />,
    )

    expect(screen.getAllByTestId('stakeholder-unknown').length).toBeGreaterThan(0)
  })

  it('keeps the existing attendee cards when the v2 flag is disabled', async () => {
    const previousEnv = { ...process.env }

    process.env = {
      ...previousEnv,
      NODE_ENV: 'production',
      NEXT_PUBLIC_INTEL_RESULTS_V2: 'false',
    }
    vi.resetModules()

    const { PeopleCard } = await import('../../../MeetingPrepPanels')

    render(
      <PeopleCard
        profiles={meetingPrepFixture.attendeeProfiles}
        stakeholders={meetingPrepFixture.stakeholders}
        sources={meetingPrepFixture.sources}
        generatedAt={meetingPrepFixture.generatedAt}
      />,
    )

    expect(screen.getByText('Key people')).toBeInTheDocument()
    expect(screen.getByText('Built RevOps systems at two multi-product SaaS companies before joining Northstar.')).toBeInTheDocument()

    process.env = previousEnv
    vi.resetModules()
  })
})
