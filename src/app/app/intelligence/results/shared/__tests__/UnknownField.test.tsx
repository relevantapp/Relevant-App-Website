// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import UnknownField from '../UnknownField'

afterEach(() => cleanup())

describe('UnknownField', () => {
  it('never renders as an empty value', () => {
    render(<UnknownField label="Tenure" queriesTried={['John Doe tenure Acme', 'John Doe employment history']} />)

    expect(screen.getByRole('button', { name: /Tenure:/i })).toHaveTextContent("unknown - we couldn't verify")
  })

  it('shows attempted queries on click', () => {
    render(<UnknownField label="Tenure" queriesTried={['John Doe tenure Acme', 'John Doe employment history']} />)

    fireEvent.click(screen.getByRole('button', { name: /Tenure:/i }))

    expect(screen.getByText('John Doe tenure Acme')).toBeInTheDocument()
    expect(screen.getByText('John Doe employment history')).toBeInTheDocument()
  })

  it('falls back to no queries recorded when none are provided', () => {
    render(<UnknownField label="Tenure" />)

    fireEvent.click(screen.getByRole('button', { name: /Tenure:/i }))

    expect(screen.getByText('no queries recorded.')).toBeInTheDocument()
  })
})
