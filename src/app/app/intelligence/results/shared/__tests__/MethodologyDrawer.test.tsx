// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { BriefStatus, TrustLayer } from '@/lib/intelligence/contracts'
import MethodologyDrawer from '../MethodologyDrawer'

afterEach(() => cleanup())

const status: BriefStatus = {
  degraded: false,
  reasons: [],
  internalMs: 80,
  plannerMs: 120,
  exaMs: 600,
  tavilyMs: 300,
  verifierMs: 0,
  exaSearchMs: 600,
  tavilySearchMs: 300,
  synthesisMs: 1100,
  totalMs: 2100,
  sourceCount: 5,
  sourceCounts: {
    found: 8,
    ranked: 5,
    used: 4,
  },
  cached: false,
  synthesisModel: 'openai/gpt-5.4',
}

const trust: TrustLayer = {
  sourcedClaimCount: 4,
  freshness: {
    oldestSourceAt: '2026-04-10T00:00:00.000Z',
    newestSourceAt: '2026-04-20T00:00:00.000Z',
  },
  mostImportantSourceIds: ['s1'],
  conflicts: [],
  knownUnknowns: [
    {
      question: 'Who approves the final purchase?',
      queriesTried: ['final purchase approver'],
    },
  ],
}

describe('MethodologyDrawer', () => {
  it('renders all four sections when methodology data is present', () => {
    render(
      <MethodologyDrawer
        status={status}
        trust={trust}
        methodology={{
          providers: [
            {
              name: 'Exa',
              queriesRun: ['query one'],
              docsReturned: 5,
            },
          ],
          freshnessRange: {
            oldest: '2026-04-10T00:00:00.000Z',
            newest: '2026-04-20T00:00:00.000Z',
          },
          confidenceDrivers: ['Multiple aligned sources.'],
          excluded: [
            {
              sourceId: 's2',
              reason: 'Duplicate.',
            },
          ],
        }}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Methodology' }))

    expect(screen.getByText('Inputs')).toBeInTheDocument()
    expect(screen.getByText('Sources queried')).toBeInTheDocument()
    expect(screen.getByText('What we found vs. excluded')).toBeInTheDocument()
    expect(screen.getByText('Confidence drivers')).toBeInTheDocument()
  })

  it('falls back to status-driven provider detail when methodology is missing', () => {
    render(<MethodologyDrawer status={status} trust={trust} />)

    fireEvent.click(screen.getByRole('button', { name: 'Methodology' }))

    expect(screen.getByText('Internal')).toBeInTheDocument()
    expect(screen.getByText('Exa')).toBeInTheDocument()
    expect(screen.getByText('Tavily')).toBeInTheDocument()
  })

  it('traps focus inside the drawer', () => {
    render(<MethodologyDrawer status={status} trust={trust} />)

    fireEvent.click(screen.getByRole('button', { name: 'Methodology' }))

    const drawer = screen.getByRole('dialog', { name: 'Methodology' })
    const closeButton = screen.getByRole('button', { name: 'Close methodology' })
    const refreshButton = screen.getByRole('button', { name: 'Refresh' })

    expect(document.activeElement).toBe(closeButton)

    fireEvent.keyDown(drawer, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(refreshButton)

    fireEvent.keyDown(drawer, { key: 'Tab' })
    expect(document.activeElement).toBe(closeButton)
  })
})
