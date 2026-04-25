/**
 * Exhibit annotation contracts + derivation helpers for NarratedExhibit.
 *
 * The wrapper (`NarratedExhibit`) is purely a positioning layer. This module
 * owns the annotation data shape plus a derivation helper so workflow agents
 * can wrap any existing visualization without providing explicit annotation
 * coordinates — they can pass in the top drivers and get a sensible numbered
 * overlay for free.
 */

import type { Priority, RichBullet } from './contracts'

/* ── Types ──────────────────────────────────────────────────── */

/**
 * Coordinate mode: position is a percentage (0–100) of the exhibit's bounding
 * box. (0, 0) is top-left; (100, 100) is bottom-right.
 */
export interface AnnotationCoord {
  x: number
  y: number
}

/**
 * Anchor mode: the annotation dot attaches to a named data point the exhibit
 * child exposes via `data-narrated-anchor="<id>"`. The wrapper uses a
 * ResizeObserver + bounding box math to position the dot over the anchor.
 */
export interface AnnotationAnchor {
  anchorId: string
}

export type ExhibitAnnotation = {
  id: string
  title: string
  sourceIds: string[]
  priority?: Priority
} & (AnnotationCoord | AnnotationAnchor)

export function isAnchorAnnotation(
  annotation: ExhibitAnnotation,
): annotation is ExhibitAnnotation & AnnotationAnchor {
  return typeof (annotation as AnnotationAnchor).anchorId === 'string'
}

export function isCoordAnnotation(
  annotation: ExhibitAnnotation,
): annotation is ExhibitAnnotation & AnnotationCoord {
  const coord = annotation as AnnotationCoord
  return typeof coord.x === 'number' && typeof coord.y === 'number'
}

/* ── Derivation helper ──────────────────────────────────────── */

export interface DeriveAnnotationsOptions {
  /** Maximum number of annotations to emit (defaults to 3). */
  max?: number
  /**
   * Optional anchor ids to pair 1:1 with drivers. When provided, annotations
   * render in anchor mode; otherwise they fall back to a simple horizontal
   * grid layout so the wrapper still renders numbered dots over the exhibit.
   */
  anchorIds?: string[]
  /** Optional prefix for generated annotation ids (defaults to `driver`). */
  idPrefix?: string
}

/**
 * Shape-light driver record. Accepts either a `RichBullet`-like record from the
 * contracts module or any ad-hoc shape with `text` + `sourceIds` + optional
 * `priority`. Workflow agents can feed proof-strip drivers in directly.
 */
export type DriverLike =
  | RichBullet
  | {
      text: string
      sourceIds?: string[]
      priority?: Priority
      title?: string
    }

const DEFAULT_MAX = 3

function normalizeDriver(driver: DriverLike, index: number) {
  const rawTitle =
    ('title' in driver && typeof driver.title === 'string' && driver.title.trim()) ||
    (typeof driver.text === 'string' && driver.text.trim()) ||
    `Driver ${index + 1}`

  // Shorten long driver sentences to an annotation-friendly phrase.
  const trimmed = rawTitle.replace(/\s+/g, ' ').trim()
  const title = trimmed.length > 96 ? `${trimmed.slice(0, 93).trimEnd()}…` : trimmed

  const sourceIds = Array.isArray(driver.sourceIds) ? driver.sourceIds.filter(Boolean) : []
  const priority: Priority | undefined =
    'priority' in driver && driver.priority ? driver.priority : undefined

  return { title, sourceIds, priority }
}

function gridPosition(count: number, index: number): AnnotationCoord {
  // Lay dots out along a single horizontal band near the top edge so they
  // read as callouts without obscuring the chart body.
  if (count <= 1) return { x: 50, y: 18 }
  const spread = 80 // percentage span
  const left = 50 - spread / 2
  const x = left + (spread * index) / (count - 1)
  return { x, y: 18 }
}

/**
 * Build a set of `ExhibitAnnotation`s from the top drivers of a brief.
 *
 * When `options.anchorIds` is supplied, annotations attach to those anchors
 * (anchor mode). Otherwise we emit a simple grid layout so wrapping works
 * even when the underlying exhibit hasn't exposed any anchors.
 */
export function deriveAnnotationsFromDrivers(
  drivers: DriverLike[] | null | undefined,
  options: DeriveAnnotationsOptions = {},
): ExhibitAnnotation[] {
  if (!Array.isArray(drivers) || drivers.length === 0) return []

  const max = Math.max(1, Math.min(options.max ?? DEFAULT_MAX, drivers.length))
  const idPrefix = options.idPrefix ?? 'driver'
  const anchors = options.anchorIds ?? []

  const picked = drivers.slice(0, max)

  return picked.map((driver, index) => {
    const { title, sourceIds, priority } = normalizeDriver(driver, index)
    const id = `${idPrefix}-${index + 1}`
    const anchorId = anchors[index]

    const base = { id, title, sourceIds, priority }

    if (anchorId) {
      return { ...base, anchorId }
    }

    return { ...base, ...gridPosition(picked.length, index) }
  })
}
