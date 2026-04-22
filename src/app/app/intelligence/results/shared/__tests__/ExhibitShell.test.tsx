// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ExhibitShell from '../ExhibitShell'

const toPngMock = vi.fn().mockResolvedValue('data:image/png;base64,test')

vi.mock('html-to-image', () => ({
  toPng: (...args: unknown[]) => toPngMock(...args),
}))

afterEach(() => cleanup())

describe('ExhibitShell', () => {
  beforeEach(() => {
    toPngMock.mockClear()
  })

  const sources = [
    {
      id: 's1',
      url: 'https://example.com/article',
      title: 'Example article',
      domain: 'example.com',
      publishedAt: '2026-04-21T00:00:00.000Z',
      provider: 'exa' as const,
      snippet: 'Example snippet',
    },
  ]

  it('passes children through and renders the headline prominently', () => {
    render(
      <ExhibitShell headline="Vendor X leads on capability" subhead="Mid-market is the wedge" asOf="2026-04-21T00:00:00.000Z" sources={sources}>
        <div>Inner viz</div>
      </ExhibitShell>,
    )

    expect(screen.getByText('Vendor X leads on capability')).toBeInTheDocument()
    expect(screen.getByText('Inner viz')).toBeInTheDocument()
    expect(screen.getByText('Mid-market is the wedge')).toBeInTheDocument()
  })

  it('calls html-to-image when the screenshot button is pressed', async () => {
    render(
      <ExhibitShell headline="Vendor X leads on capability" asOf="2026-04-21T00:00:00.000Z" sources={sources}>
        <div>Inner viz</div>
      </ExhibitShell>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Screenshot' }))

    expect(toPngMock).toHaveBeenCalledTimes(1)
  })

  it('warns when the headline is descriptive instead of declarative', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    render(
      <ExhibitShell headline="Competitor scores by capability" sources={sources}>
        <div>Inner viz</div>
      </ExhibitShell>,
    )

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('DeclarativeHeadline'))
    warnSpy.mockRestore()
  })
})
