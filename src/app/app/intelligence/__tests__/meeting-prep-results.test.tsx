// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SnapshotCard, VisualTimeline } from '../results/MeetingPrepPanels'
import SourcesStrip from '../results/shared/SourcesStrip'
import StatusBar from '../results/shared/StatusBar'
import type { BriefSource, BriefStatus, CompanySnapshot, MeetingPrepSnapshot, TimelineEvent } from '@/lib/intelligence/contracts'

const snapshot: MeetingPrepSnapshot = {
  name: 'Acme AI',
  summary: 'Acme AI gives revenue teams a role-aware research workspace for enterprise account planning.',
  website: 'https://acme.example.com',
  whatTheyDo: 'Research workspace for enterprise account planning.',
  industry: 'B2B software',
  headquarters: 'New York, NY',
  employeeRange: '201-500',
  funding: 'Series B · $45M',
  ceo: 'Alex Founder',
  recentMilestone: 'Opened a new EMEA sales office in March 2026.',
  knownUnknowns: ['Customer concentration not verified.'],
  sourceUrl: 'https://acme.example.com',
}

const timelineEvents: TimelineEvent[] = [
  { date: 'Jan 2026', type: 'product', impact: 'positive', text: 'Launched a new enterprise workflow module.', sourceIds: ['s1'] },
  { date: 'Feb 2026', type: 'customer', impact: 'positive', text: 'Won a marquee financial-services customer.', sourceIds: ['s2'] },
  { date: 'Mar 2026', type: 'leadership', impact: 'mixed', text: 'Hired a new CRO after a long search.', sourceIds: ['s3'] },
  { date: 'Apr 2026', type: 'market', impact: 'mixed', text: 'Faced a slower buying cycle in Europe.', sourceIds: ['s4'] },
  { date: 'May 2026', type: 'partnership', impact: 'positive', text: 'Expanded an implementation partnership.', sourceIds: ['s5'] },
  { date: 'Jun 2026', type: 'risk', impact: 'negative', text: 'Security review delays are still showing up in public references.', sourceIds: ['s6'] },
]

const ledgerSources: BriefSource[] = [
  {
    id: 's1',
    url: 'https://example.com/used',
    title: 'Used source',
    domain: 'example.com',
    publishedAt: '2026-04-20T00:00:00.000Z',
    provider: 'exa',
    snippet: 'Used source snippet that appears in the answer.',
    sourceRole: 'primary',
    usedInAnswer: true,
  },
  {
    id: 's2',
    url: 'https://example.com/supporting',
    title: 'Supporting source',
    domain: 'example.com',
    publishedAt: '2026-03-01T00:00:00.000Z',
    provider: 'tavily',
    snippet: 'Supporting source snippet that was gathered but not cited.',
    sourceRole: 'counter_evidence',
    usedInAnswer: false,
  },
  {
    id: 's3',
    url: 'internal://memory-1',
    title: 'Internal memory note',
    domain: 'internal',
    publishedAt: null,
    provider: 'internal',
    snippet: 'Internal memory snippet.',
    sourceRole: 'internal_memory',
    usedInAnswer: false,
  },
]

const status: BriefStatus = {
  degraded: false,
  reasons: [],
  internalMs: 120,
  plannerMs: 85,
  exaMs: 740,
  tavilyMs: 410,
  verifierMs: 0,
  exaSearchMs: 740,
  tavilySearchMs: 410,
  synthesisMs: 1580,
  totalMs: 2935,
  sourceCount: 3,
  sourceCounts: {
    found: 3,
    ranked: 2,
    used: 1,
  },
  cached: false,
  synthesisModel: 'openai/gpt-5.4',
}

const legacySnapshot: CompanySnapshot = {
  name: 'Legacy Co',
  description: 'Legacy Co provides a compliance workflow product for regulated finance teams.',
  website: 'https://legacy.example.com',
  industry: 'Fintech',
  headquarters: 'London, UK',
  employeeCount: '51-200',
  fundingStage: 'Series A',
  lastFundingAmount: '$12M',
  ceo: 'Jordan Legacy',
  keyPeople: null,
  recentMilestone: 'Opened a new compliance operations hub.',
  sourceUrl: 'https://legacy.example.com',
}

describe('meeting prep results UI', () => {
  it('renders the bounded snapshot card', () => {
    render(React.createElement(SnapshotCard, { snapshot }))

    expect(screen.getByText('Company snapshot')).toBeInTheDocument()
    expect(screen.getByText(snapshot.summary)).toBeInTheDocument()
    expect(screen.getByText('Known unknowns')).toBeInTheDocument()
    expect(screen.getByText('Series B · $45M')).toBeInTheDocument()
  })

  it('renders legacy saved-brief snapshot payloads without crashing', () => {
    render(React.createElement(SnapshotCard, { snapshot: legacySnapshot }))

    expect(screen.getByText('Legacy Co provides a compliance workflow product for regulated finance teams.')).toBeInTheDocument()
    expect(screen.getByText('Series A · $12M')).toBeInTheDocument()
  })

  it('renders six desktop timeline cards without relying on hover-only content', () => {
    const { container } = render(React.createElement(VisualTimeline, { events: timelineEvents, onSourceClick: vi.fn() }))

    expect(container.querySelectorAll('article')).toHaveLength(6)
    expect(screen.getAllByText('Launched a new enterprise workflow module.').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Security review delays are still showing up in public references.').length).toBeGreaterThan(0)
  })

  it('groups sources into a collapsed evidence ledger with role filters', () => {
    render(React.createElement(SourcesStrip, { sources: ledgerSources }))

    expect(screen.getByText('Evidence ledger · 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cited in answer · 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Counter-evidence · 1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Internal memory · 1' })).toBeInTheDocument()
    expect(screen.queryByText('Used source')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cited in answer · 1' }))
    expect(screen.getByText('Used source')).toBeInTheDocument()
    expect(screen.getAllByText('cited').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: 'Internal memory · 1' }))
    expect(screen.getByText('Internal memory note')).toBeInTheDocument()
    expect(screen.getAllByText('internal').length).toBeGreaterThan(0)
  })

  it('shows found, ranked, and used counts in the status bar', () => {
    render(React.createElement(StatusBar, { status }))

    expect(screen.getByText('FOUND')).toBeInTheDocument()
    expect(screen.getByText('RANKED')).toBeInTheDocument()
    expect(screen.getByText('USED')).toBeInTheDocument()
    expect(screen.getByText('2.9s')).toBeInTheDocument()
  })
})
