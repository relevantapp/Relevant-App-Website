// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import CitedText from '../CitedText'
import ClaimSpotlight from '../ClaimSpotlight'
import { ClaimSpotlightProvider } from '../ClaimSpotlightContext'

afterEach(() => cleanup())

const sources = [
  {
    id: 's1',
    url: 'https://example.com/one',
    title: 'Source one',
    domain: 'example.com',
    publishedAt: '2026-04-18T00:00:00.000Z',
    provider: 'exa' as const,
    snippet: 'Source one snippet.',
  },
  {
    id: 's2',
    url: 'https://example.com/two',
    title: 'Source two',
    domain: 'example.com',
    publishedAt: '2026-04-17T00:00:00.000Z',
    provider: 'tavily' as const,
    snippet: null,
  },
]

describe('CitedText', () => {
  it('renders all span text and dedupes numerals across repeated source ids', () => {
    render(
      <CitedText
        spans={[
          { text: 'Relevant wins on answer quality.', sourceIds: ['s1'], sourceSnippet: 'Answer quality evidence.' },
          { text: 'Breadth still favors the incumbent.', sourceIds: ['s1', 's2'] },
        ]}
        sources={sources}
      />,
    )

    expect(screen.getByText('Relevant wins on answer quality.')).toBeInTheDocument()
    expect(screen.getByText('Breadth still favors the incumbent.')).toBeInTheDocument()
    expect(screen.getAllByText('1')).toHaveLength(2)
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('sets aria-describedby when a source popover is open and renders snippet fallback text', () => {
    render(
      <CitedText
        spans={[{ text: 'Breadth still favors the incumbent.', sourceIds: ['s2'] }]}
        sources={sources}
      />,
    )

    const button = screen.getByRole('button', { name: 'Open source 1' })
    fireEvent.mouseEnter(button)

    const popover = screen.getByRole('tooltip')
    expect(button).toHaveAttribute('aria-describedby', popover.id)
    expect(screen.getByText('snippet unavailable')).toBeInTheDocument()
  })

  it('renders a missing-source tooltip for unavailable source ids', () => {
    render(
      <CitedText
        spans={[{ text: 'One source disappeared.', sourceIds: ['missing-source'] }]}
        sources={sources}
      />,
    )

    const button = screen.getByRole('button', { name: 'Source 1 unavailable' })
    fireEvent.mouseEnter(button)

    expect(screen.getByText('source no longer available.')).toBeInTheDocument()
    expect(button.className).toContain('text-[var(--text-soft)]')
  })

  it('opens the spotlight rail instead of the inline popover when a provider is present', () => {
    render(
      <ClaimSpotlightProvider>
        <CitedText
          spans={[{ text: 'Relevant wins on answer quality.', sourceIds: ['s1', 's2'], sourceSnippet: 'Answer quality evidence.' }]}
          sources={sources}
        />
        <ClaimSpotlight sources={sources} />
      </ClaimSpotlightProvider>,
    )

    const button = screen.getByRole('button', { name: 'Open source 1' })
    fireEvent.focus(button)

    expect(screen.getByRole('dialog', { name: 'Claim spotlight' })).toBeInTheDocument()
    expect(screen.getByText('Source one')).toBeInTheDocument()
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})
