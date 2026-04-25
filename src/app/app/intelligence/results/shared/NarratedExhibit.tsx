'use client'

/**
 * NarratedExhibit — positioning overlay that adds numbered story annotations
 * on top of any existing visualization.
 *
 * Behavior:
 *   - Children render normally. Annotations render absolutely-positioned
 *     inside a containment wrapper.
 *   - Coordinate annotations use `x`/`y` percentages of the exhibit bounding
 *     box. Anchor annotations pin to a child element tagged with
 *     `data-narrated-anchor="<id>"` and re-measure on resize.
 *   - Desktop: numbered focusable dots; hover/focus reveals a tooltip with
 *     the narrative sentence and citation chips.
 *   - Mobile: dots still render, and annotations collapse into a numbered
 *     list below the exhibit; tapping scrolls the exhibit into view and
 *     highlights the dot.
 *   - Respects `prefers-reduced-motion` — dots render instantly, no pulse.
 *
 * This wrapper does not require any modification to the wrapped viz —
 * workflow agents can wrap `CapabilityMatrix`, `DriverTree`, etc. directly.
 */

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import {
  isAnchorAnnotation,
  isCoordAnnotation,
  type ExhibitAnnotation,
} from '@/lib/intelligence/exhibit-annotations'

interface NarratedExhibitProps {
  annotations: ExhibitAnnotation[]
  children: ReactNode
  /** Optional declarative headline rendered above the exhibit. */
  title?: string
  /** Force static presentation regardless of OS preference. */
  reduceMotion?: boolean
  onAnnotationFocus?: (id: string) => void
}

interface ResolvedPosition {
  left: number
  top: number
}

const MOBILE_BREAKPOINT = 768

function usePrefersReducedMotion(force?: boolean) {
  const [prefers, setPrefers] = useState<boolean>(() => force ?? false)

  useEffect(() => {
    if (force) {
      setPrefers(true)
      return
    }
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefers(query.matches)
    const listener = (event: MediaQueryListEvent) => setPrefers(event.matches)
    query.addEventListener?.('change', listener)
    return () => query.removeEventListener?.('change', listener)
  }, [force])

  return prefers
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const query = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    setIsMobile(query.matches)
    const listener = (event: MediaQueryListEvent) => setIsMobile(event.matches)
    query.addEventListener?.('change', listener)
    return () => query.removeEventListener?.('change', listener)
  }, [])

  return isMobile
}

/**
 * Measure anchor-mode annotations into `{ left, top }` percentages.
 * Coordinate-mode annotations are passed through unchanged.
 */
function useResolvedPositions(
  annotations: ExhibitAnnotation[],
  containerRef: React.RefObject<HTMLDivElement>,
) {
  const [positions, setPositions] = useState<Record<string, ResolvedPosition>>({})

  const measure = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const next: Record<string, ResolvedPosition> = {}
    const hasAnchors = annotations.some(isAnchorAnnotation)
    const containerRect = hasAnchors ? container.getBoundingClientRect() : null
    const canMeasureAnchors = Boolean(containerRect?.width && containerRect?.height)

    for (const annotation of annotations) {
      if (isCoordAnnotation(annotation)) {
        next[annotation.id] = { left: annotation.x, top: annotation.y }
      } else if (isAnchorAnnotation(annotation) && canMeasureAnchors && containerRect) {
        const anchor = container.querySelector<HTMLElement>(
          `[data-narrated-anchor="${CSS.escape(annotation.anchorId)}"]`,
        )
        if (!anchor) continue
        const rect = anchor.getBoundingClientRect()
        const left = ((rect.left + rect.width / 2 - containerRect.left) / containerRect.width) * 100
        const top = ((rect.top + rect.height / 2 - containerRect.top) / containerRect.height) * 100
        next[annotation.id] = { left, top }
      }
    }

    setPositions((previous) => {
      const sameKeys =
        Object.keys(previous).length === Object.keys(next).length &&
        Object.keys(next).every((key) => {
          const prior = previous[key]
          const current = next[key]
          return prior && Math.abs(prior.left - current.left) < 0.1 && Math.abs(prior.top - current.top) < 0.1
        })
      return sameKeys ? previous : next
    })
  }, [annotations, containerRef])

  useLayoutEffect(() => {
    measure()
  }, [measure])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const container = containerRef.current
    if (!container) return

    const hasAnchors = annotations.some(isAnchorAnnotation)
    if (!hasAnchors) return

    let observer: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => measure())
      observer.observe(container)
      container.querySelectorAll<HTMLElement>('[data-narrated-anchor]').forEach((el) => {
        observer?.observe(el)
      })
    }

    window.addEventListener('resize', measure)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [annotations, containerRef, measure])

  return positions
}

interface DotProps {
  annotation: ExhibitAnnotation
  index: number
  tooltipId: string
  position: ResolvedPosition | undefined
  isOpen: boolean
  isHighlighted: boolean
  reduceMotion: boolean
  onOpen: () => void
  onClose: () => void
  onToggle: () => void
  onFocus: () => void
  registerRef: (el: HTMLButtonElement | null) => void
}

function AnnotationDot({
  annotation,
  index,
  tooltipId,
  position,
  isOpen,
  isHighlighted,
  reduceMotion,
  onOpen,
  onClose,
  onToggle,
  onFocus,
  registerRef,
}: DotProps) {
  if (!position) return null

  const clampedLeft = Math.max(0, Math.min(100, position.left))
  const clampedTop = Math.max(0, Math.min(100, position.top))

  return (
    <div
      className="pointer-events-none absolute"
      style={{ left: `${clampedLeft}%`, top: `${clampedTop}%`, transform: 'translate(-50%, -50%)' }}
      data-testid={`narrated-dot-wrapper-${annotation.id}`}
    >
      <button
        ref={registerRef}
        type="button"
        className={[
          'pointer-events-auto relative flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold shadow-[0_6px_18px_rgba(0,0,0,0.35)]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-elevated)]',
          !reduceMotion ? 'transition-transform duration-150 hover:scale-110' : '',
          isHighlighted
            ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)]'
            : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text)] hover:border-[var(--accent)]',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-describedby={tooltipId}
        aria-expanded={isOpen}
        aria-label={`Annotation ${index + 1}: ${annotation.title}`}
        data-narrated-dot={annotation.id}
        onMouseEnter={onOpen}
        onMouseLeave={onClose}
        onFocus={() => {
          onOpen()
          onFocus()
        }}
        onBlur={onClose}
        onClick={onToggle}
      >
        {index + 1}
      </button>

      <div
        id={tooltipId}
        role="tooltip"
        hidden={!isOpen}
        className="absolute left-1/2 top-[calc(100%+0.5rem)] z-20 w-64 -translate-x-1/2 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3 text-left shadow-[0_18px_50px_rgba(0,0,0,0.18)]"
      >
        <p className="text-sm font-medium leading-snug text-[var(--text)]">{annotation.title}</p>
        {annotation.sourceIds.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {annotation.sourceIds.map((sourceId) => (
              <span
                key={sourceId}
                className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[11px] text-[var(--text-muted)]"
              >
                {sourceId}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function NarratedExhibit({
  annotations,
  children,
  title,
  reduceMotion,
  onAnnotationFocus,
}: NarratedExhibitProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const exhibitRef = useRef<HTMLDivElement>(null)
  const dotRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  const systemReducedMotion = usePrefersReducedMotion(reduceMotion)
  const reducedMotion = reduceMotion ?? systemReducedMotion
  const isMobile = useIsMobile()

  const [openId, setOpenId] = useState<string | null>(null)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)

  const positions = useResolvedPositions(annotations, exhibitRef)

  const tooltipIdPrefix = useId()
  const tooltipIds = useMemo(() => {
    const map = new Map<string, string>()
    annotations.forEach((annotation) => {
      map.set(annotation.id, `${tooltipIdPrefix}-${annotation.id}`)
    })
    return map
  }, [annotations, tooltipIdPrefix])

  const handleOpen = useCallback((id: string) => {
    setOpenId(id)
  }, [])

  const handleClose = useCallback((id: string) => {
    setOpenId((current) => (current === id ? null : current))
  }, [])

  const handleToggle = useCallback((id: string) => {
    setOpenId((current) => (current === id ? null : id))
  }, [])

  const handleFocus = useCallback(
    (id: string) => {
      setHighlightedId(id)
      onAnnotationFocus?.(id)
    },
    [onAnnotationFocus],
  )

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape' && openId) {
        setOpenId(null)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [openId])

  const handleListKeyDown = (event: KeyboardEvent<HTMLButtonElement>, annotationId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      focusAnnotation(annotationId)
    }
  }

  const focusAnnotation = useCallback(
    (annotationId: string) => {
      const dot = dotRefs.current.get(annotationId)
      if (!dot) return
      setHighlightedId(annotationId)
      setOpenId(annotationId)
      onAnnotationFocus?.(annotationId)
      const exhibit = exhibitRef.current
      if (exhibit && typeof exhibit.scrollIntoView === 'function') {
        exhibit.scrollIntoView({
          behavior: reducedMotion ? 'auto' : 'smooth',
          block: 'nearest',
        })
      }
      dot.focus()
    },
    [onAnnotationFocus, reducedMotion],
  )

  const registerRef = (id: string) => (el: HTMLButtonElement | null) => {
    if (el) dotRefs.current.set(id, el)
    else dotRefs.current.delete(id)
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-4">
      {title && (
        <h3 className="text-base font-semibold tracking-tight text-[var(--text)] sm:text-lg">
          {title}
        </h3>
      )}

      <div ref={exhibitRef} className="relative">
        {children}

        {annotations.length > 0 && (
          <div className="pointer-events-none absolute inset-0" aria-hidden={isMobile ? 'false' : undefined}>
            {annotations.map((annotation, index) => (
              <AnnotationDot
                key={annotation.id}
                annotation={annotation}
                index={index}
                tooltipId={tooltipIds.get(annotation.id) ?? `${tooltipIdPrefix}-${annotation.id}`}
                position={positions[annotation.id]}
                isOpen={openId === annotation.id}
                isHighlighted={highlightedId === annotation.id}
                reduceMotion={reducedMotion}
                onOpen={() => handleOpen(annotation.id)}
                onClose={() => handleClose(annotation.id)}
                onToggle={() => handleToggle(annotation.id)}
                onFocus={() => handleFocus(annotation.id)}
                registerRef={registerRef(annotation.id)}
              />
            ))}
          </div>
        )}
      </div>

      {annotations.length > 0 && isMobile && (
        <ol
          className="flex flex-col gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3"
          data-testid="narrated-mobile-list"
        >
          {annotations.map((annotation, index) => {
            const active = highlightedId === annotation.id
            return (
              <li key={annotation.id}>
                <button
                  type="button"
                  onClick={() => focusAnnotation(annotation.id)}
                  onKeyDown={(event) => handleListKeyDown(event, annotation.id)}
                  className={[
                    'flex w-full items-start gap-3 rounded-xl border px-3 py-2 text-left',
                    'focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--surface)]',
                    active
                      ? 'border-[var(--accent)] bg-[var(--bg-elevated)]'
                      : 'border-transparent bg-transparent hover:border-[var(--border)]',
                  ].join(' ')}
                  aria-describedby={tooltipIds.get(annotation.id)}
                >
                  <span
                    className={[
                      'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                      active
                        ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)]'
                        : 'border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text)]',
                    ].join(' ')}
                  >
                    {index + 1}
                  </span>
                  <span className="flex-1 text-sm leading-snug text-[var(--text)]">
                    {annotation.title}
                    {annotation.sourceIds.length > 0 && (
                      <span className="mt-1 flex flex-wrap gap-1">
                        {annotation.sourceIds.map((sourceId) => (
                          <span
                            key={sourceId}
                            className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 text-[11px] text-[var(--text-muted)]"
                          >
                            {sourceId}
                          </span>
                        ))}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
