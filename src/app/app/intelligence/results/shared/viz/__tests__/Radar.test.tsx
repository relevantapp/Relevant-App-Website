// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Radar, { buildRadarPolygonPoints } from '../Radar'

const categories = ['budget', 'tech', 'competitor', 'champion', 'setup']

describe('Radar', () => {
  it('builds the expected polygon for max values', () => {
    const points = buildRadarPolygonPoints([5, 5, 5, 5, 5], 5, 5)
      .split(' ')
      .map((pair) => pair.split(',').map(Number))

    expect(points).toHaveLength(5)
    expect(points[0][0]).toBeCloseTo(120, 5)
    expect(points[0][1]).toBeCloseTo(46, 5)
    expect(points[1][0]).toBeCloseTo(190.38, 2)
    expect(points[1][1]).toBeCloseTo(97.13, 2)
    expect(points[2][0]).toBeCloseTo(163.5, 2)
    expect(points[2][1]).toBeCloseTo(179.87, 2)
  })

  it('renders five labeled axes and an accessible image role', () => {
    render(<Radar categories={categories} values={[3, 2, 4, 1, 3]} max={5} label="Meeting risk radar" />)

    expect(screen.getByRole('img', { name: /meeting risk radar/i })).toBeInTheDocument()
    categories.forEach((category) => {
      expect(screen.getByRole('button', { name: new RegExp(category, 'i') })).toBeInTheDocument()
    })
  })

  it('fills missing values with zero and marks them unknown', () => {
    const onActiveIndexChange = vi.fn()

    render(
      <Radar
        categories={categories}
        values={[5, undefined, 2, null, 4]}
        max={5}
        label="Meeting risk radar"
        onActiveIndexChange={onActiveIndexChange}
      />,
    )

    expect(screen.getByRole('button', { name: /tech axis, unknown/i })).toHaveAttribute('data-unknown', 'true')
    expect(screen.getByRole('button', { name: /champion axis, unknown/i })).toHaveAttribute('data-unknown', 'true')

    screen.getByRole('button', { name: /tech axis, unknown/i }).focus()
    expect(onActiveIndexChange).toHaveBeenCalledWith(1)
  })
})
