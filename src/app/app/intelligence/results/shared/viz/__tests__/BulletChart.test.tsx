// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import BulletChart from '../BulletChart'

const targetBands = [
  { label: 'weak', from: 0, to: 40 },
  { label: 'watch', from: 40, to: 70 },
  { label: 'warm', from: 70, to: 100 },
]

describe('BulletChart', () => {
  it('marks the correct band for 0, 50, and 100', () => {
    const { rerender } = render(<BulletChart value={0} targetBands={targetBands} label="Account state" />)
    expect(screen.getByText('weak').parentElement).toHaveAttribute('data-active', 'true')

    rerender(<BulletChart value={50} targetBands={targetBands} label="Account state" />)
    expect(screen.getByText('watch').parentElement).toHaveAttribute('data-active', 'true')

    rerender(<BulletChart value={100} targetBands={targetBands} label="Account state" />)
    expect(screen.getByText('warm').parentElement).toHaveAttribute('data-active', 'true')
  })

  it('renders an accessible label', () => {
    render(<BulletChart value={74} targetBands={targetBands} label="Account state" />)

    expect(screen.getByRole('img', { name: 'Account state: 74 in warm band' })).toBeInTheDocument()
  })
})
