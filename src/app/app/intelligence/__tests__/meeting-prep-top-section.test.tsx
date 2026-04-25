// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import IntelligenceResults from '../IntelligenceResults'
import { meetingPrepFixture } from '../results/__fixtures__/meeting-prep.fixture'

describe('meeting prep top section', () => {
  it('renders request identity from request payload before generated content', () => {
    render(
      <IntelligenceResults
        brief={meetingPrepFixture}
        onNewSearch={() => undefined}
        requestPayload={{
          accountName: 'Graham Company',
          meetingType: 'client',
          goal: 'Prepare for a staffing services sales meeting',
          website: 'https://graham.example.com',
          whatYoureSelling: 'Arrow workforce solutions staffing services',
          desiredNextStep: 'Book an operations review',
          attendees: ['Mia Graham', 'Riley Ops'],
        }}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Graham Company' })).toBeInTheDocument()
    expect(screen.getByText('Arrow workforce solutions staffing services')).toBeInTheDocument()
    expect(screen.getByText('Prepare for a staffing services sales meeting')).toBeInTheDocument()
    expect(screen.getByText('Book an operations review')).toBeInTheDocument()
    expect(screen.getByText('Client meeting')).toBeInTheDocument()
    expect(screen.getByText('Evidence preview')).toBeInTheDocument()
  })

  it('shows blocked state and hides the answer block when the brief drifts off target', () => {
    render(
      <IntelligenceResults
        brief={{
          ...meetingPrepFixture,
          headline: 'Acme Corp is ready for an automation sale.',
          answer: {
            ...meetingPrepFixture.answer!,
            conclusion: {
              ...meetingPrepFixture.answer!.conclusion,
              text: 'Pitch Acme Corp on AI automation.',
            },
          },
          status: {
            ...meetingPrepFixture.status,
            degraded: true,
            reasons: [
              'AI synthesis drifted away from requested account (Graham Company)',
              'AI synthesis drifted away from what the user is selling',
            ],
          },
          confidence: 'low',
        }}
        onNewSearch={() => undefined}
        requestPayload={{
          accountName: 'Graham Company',
          meetingType: 'client',
          goal: 'Prepare for a staffing services sales meeting',
          whatYoureSelling: 'Arrow workforce solutions staffing services',
        }}
      />,
    )

    expect(screen.getByText('Brief blocked')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Rerun brief' }).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Edit company' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit offer' })).toBeInTheDocument()
    expect(screen.queryByText('Pitch Acme Corp on AI automation.')).not.toBeInTheDocument()
    expect(screen.queryByText('Acme Corp is ready for an automation sale.')).not.toBeInTheDocument()
  })

  it('shows low-evidence messaging when support is thin', () => {
    render(
      <IntelligenceResults
        brief={{
          ...meetingPrepFixture,
          status: {
            ...meetingPrepFixture.status,
            sourceCount: 2,
            sourceCounts: {
              found: 2,
              ranked: 2,
              used: 1,
            },
          },
          confidence: 'low',
        }}
        onNewSearch={() => undefined}
      />,
    )

    expect(screen.getAllByText('Low evidence').length).toBeGreaterThan(0)
    expect(screen.getByText(/Treat it as provisional prep/i)).toBeInTheDocument()
  })
})