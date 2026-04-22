// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import React from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import IntelligenceResults from '../../IntelligenceResults'
import { businessCaseFixture } from '../__fixtures__/business-case.fixture'
import { competitiveFixture } from '../__fixtures__/competitive.fixture'
import { marketResearchFixture } from '../__fixtures__/market-research.fixture'
import { meetingPrepFixture } from '../__fixtures__/meeting-prep.fixture'
import BusinessCaseResults from '../BusinessCaseResults'
import CompetitiveResults from '../CompetitiveResults'
import MarketResearchResults from '../MarketResearchResults'

afterEach(() => cleanup())

describe('results pages mount the universal chrome in v2', () => {
  it('renders meeting prep with answer block and methodology trigger', () => {
    render(<IntelligenceResults brief={meetingPrepFixture} onNewSearch={() => undefined} />)

    expect(screen.getByRole('button', { name: 'Methodology' })).toBeInTheDocument()
    expect(screen.getByText('Conclusion')).toBeInTheDocument()
  })

  it('renders competitive analysis with answer block and methodology trigger', () => {
    render(<CompetitiveResults brief={competitiveFixture} onNewSearch={() => undefined} />)

    expect(screen.getByRole('button', { name: 'Methodology' })).toBeInTheDocument()
    expect(screen.getByText('Conclusion')).toBeInTheDocument()
  })

  it('renders business case with answer block and methodology trigger', () => {
    render(<BusinessCaseResults brief={businessCaseFixture} onNewSearch={() => undefined} />)

    expect(screen.getByRole('button', { name: 'Methodology' })).toBeInTheDocument()
    expect(screen.getByText('Conclusion')).toBeInTheDocument()
  })

  it('renders market research with answer block and methodology trigger', () => {
    render(<MarketResearchResults brief={marketResearchFixture} onNewSearch={() => undefined} />)

    expect(screen.getByRole('button', { name: 'Methodology' })).toBeInTheDocument()
    expect(screen.getByText('Conclusion')).toBeInTheDocument()
  })
})
