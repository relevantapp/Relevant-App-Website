// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest'
import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import NarratedExhibit from '../NarratedExhibit'
import {
  deriveAnnotationsFromDrivers,
  type ExhibitAnnotation,
} from '@/lib/intelligence/exhibit-annotations'

afterEach(() => cleanup())

const matchMediaMock = (matchQueries: (query: string) => boolean) =>
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: matchQueries(query),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  })

describe('NarratedExhibit', () => {
  beforeEach(() => {
    matchMediaMock(() => false)
    // Polyfill ResizeObserver for jsdom.
    ;(globalThis as unknown as { ResizeObserver?: unknown }).ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  })

  const coordAnnotations: ExhibitAnnotation[] = [
    { id: 'a', title: 'Where you lose speed', sourceIds: ['s1'], x: 20, y: 30 },
    { id: 'b', title: 'Your leverage point', sourceIds: ['s2', 's3'], x: 60, y: 40 },
  ]

  it('renders children, numbered dots and tooltips for each annotation', () => {
    render(
      <NarratedExhibit annotations={coordAnnotations} title="Capability edges">
        <div data-testid="child">inner viz</div>
      </NarratedExhibit>,
    )

    expect(screen.getByText('Capability edges')).toBeInTheDocument()
    expect(screen.getByTestId('child')).toBeInTheDocument()

    const dots = screen.getAllByRole('button')
    expect(dots).toHaveLength(2)
    expect(dots[0]).toHaveTextContent('1')
    expect(dots[1]).toHaveTextContent('2')

    expect(dots[0]).toHaveAttribute('aria-describedby')
    expect(screen.getByText('Where you lose speed')).toBeInTheDocument()
    expect(screen.getByText('Your leverage point')).toBeInTheDocument()
  })

  it('opens tooltip on focus and closes on Escape (keyboard navigation)', () => {
    render(
      <NarratedExhibit annotations={coordAnnotations}>
        <div>inner</div>
      </NarratedExhibit>,
    )

    const [firstDot] = screen.getAllByRole('button')
    fireEvent.focus(firstDot)
    expect(firstDot).toHaveAttribute('aria-expanded', 'true')

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(firstDot).toHaveAttribute('aria-expanded', 'false')
  })

  it('toggles tooltip open/closed on click', () => {
    render(
      <NarratedExhibit annotations={coordAnnotations}>
        <div>inner</div>
      </NarratedExhibit>,
    )

    const [firstDot] = screen.getAllByRole('button')
    fireEvent.click(firstDot)
    expect(firstDot).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(firstDot)
    expect(firstDot).toHaveAttribute('aria-expanded', 'false')
  })

  it('honors forced reduceMotion by skipping hover-scale transitions', () => {
    render(
      <NarratedExhibit annotations={coordAnnotations} reduceMotion>
        <div>inner</div>
      </NarratedExhibit>,
    )

    const [firstDot] = screen.getAllByRole('button')
    expect(firstDot.className).not.toContain('transition-transform')
  })

  it('calls onAnnotationFocus when a dot receives focus', () => {
    const onFocus = vi.fn()
    render(
      <NarratedExhibit annotations={coordAnnotations} onAnnotationFocus={onFocus}>
        <div>inner</div>
      </NarratedExhibit>,
    )

    const [firstDot] = screen.getAllByRole('button')
    fireEvent.focus(firstDot)
    expect(onFocus).toHaveBeenCalledWith('a')
  })

  it('renders a mobile list below the exhibit on narrow viewports', () => {
    matchMediaMock((query) => query.includes('max-width'))

    render(
      <NarratedExhibit annotations={coordAnnotations}>
        <div>inner</div>
      </NarratedExhibit>,
    )

    expect(screen.getByTestId('narrated-mobile-list')).toBeInTheDocument()
    const listItems = screen
      .getByTestId('narrated-mobile-list')
      .querySelectorAll('button')
    expect(listItems.length).toBe(2)
  })

  it('renders an empty dot layer when no annotations are provided', () => {
    render(
      <NarratedExhibit annotations={[]}>
        <div>inner</div>
      </NarratedExhibit>,
    )

    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })
})

describe('deriveAnnotationsFromDrivers', () => {
  it('returns an empty array for missing or empty input', () => {
    expect(deriveAnnotationsFromDrivers(null)).toEqual([])
    expect(deriveAnnotationsFromDrivers([])).toEqual([])
  })

  it('produces a grid layout when no anchors are supplied', () => {
    const annotations = deriveAnnotationsFromDrivers([
      { text: 'Speed advantage', sourceIds: ['s1'], priority: 'must' },
      { text: 'Pricing leverage', sourceIds: ['s2'] },
      { text: 'Known risk', sourceIds: ['s3'], priority: 'should' },
    ])

    expect(annotations).toHaveLength(3)
    annotations.forEach((annotation) => {
      expect('x' in annotation && 'y' in annotation).toBe(true)
    })
    expect(annotations[0].title).toBe('Speed advantage')
    expect(annotations[0].sourceIds).toEqual(['s1'])
    expect(annotations[0].priority).toBe('must')
  })

  it('produces anchor-mode annotations when anchorIds are provided', () => {
    const annotations = deriveAnnotationsFromDrivers(
      [{ text: 'A', sourceIds: [] }, { text: 'B', sourceIds: [] }],
      { anchorIds: ['node-a', 'node-b'] },
    )

    expect(annotations[0]).toMatchObject({ anchorId: 'node-a' })
    expect(annotations[1]).toMatchObject({ anchorId: 'node-b' })
  })

  it('caps output at the requested maximum', () => {
    const annotations = deriveAnnotationsFromDrivers(
      Array.from({ length: 6 }, (_, index) => ({ text: `driver-${index}`, sourceIds: [] })),
      { max: 2 },
    )

    expect(annotations).toHaveLength(2)
  })
})
