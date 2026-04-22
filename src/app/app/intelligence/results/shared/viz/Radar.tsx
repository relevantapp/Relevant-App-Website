'use client'

import { useId } from 'react'

export interface RadarValue {
  value?: number | null
  detail?: string | null
  sourceIds?: string[]
}

interface RadarProps {
  categories: string[]
  values: Array<number | null | undefined>
  max: number
  label?: string
  activeIndex?: number
  onActiveIndexChange?: (index: number) => void
}

const VIEWBOX_SIZE = 240
const CENTER = VIEWBOX_SIZE / 2
const MAX_RADIUS = 74

function toAngle(index: number, total: number) {
  return -Math.PI / 2 + (index * Math.PI * 2) / total
}

function polarToCartesian(radius: number, angle: number) {
  return {
    x: CENTER + radius * Math.cos(angle),
    y: CENTER + radius * Math.sin(angle),
  }
}

function clampValue(value: number | null | undefined, max: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0
  return Math.max(0, Math.min(max, value))
}

export function buildRadarPolygonPoints(values: Array<number | null | undefined>, max: number, total: number) {
  return Array.from({ length: total }, (_, index) => {
    const point = polarToCartesian((clampValue(values[index], max) / max) * MAX_RADIUS, toAngle(index, total))
    return `${point.x},${point.y}`
  }).join(' ')
}

function buildAriaLabel(categories: string[], values: Array<number | null | undefined>, max: number, label?: string) {
  const summary = categories
    .map((category, index) => {
      if (typeof values[index] !== 'number') return `${category}: unknown`
      return `${category}: ${clampValue(values[index], max)} of ${max}`
    })
    .join(', ')

  return label ? `${label}: ${summary}` : summary
}

export default function Radar({ categories, values, max, label = 'Radar chart', activeIndex, onActiveIndexChange }: RadarProps) {
  const total = categories.length
  const polygonPoints = buildRadarPolygonPoints(values, max, total)
  const labelId = useId()

  return (
    <div className="relative mx-auto w-full max-w-[260px]">
      <svg
        viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
        className="w-full"
        role="img"
        aria-labelledby={labelId}
        aria-label={buildAriaLabel(categories, values, max, label)}
      >
        <title id={labelId}>{label}</title>

        {Array.from({ length: max }, (_, index) => {
          const radius = ((index + 1) / max) * MAX_RADIUS
          const ringPoints = Array.from({ length: total }, (_, pointIndex) => {
            const point = polarToCartesian(radius, toAngle(pointIndex, total))
            return `${point.x},${point.y}`
          }).join(' ')

          return <polygon key={radius} points={ringPoints} fill="none" stroke="var(--border)" strokeWidth="1" />
        })}

        {categories.map((category, index) => {
          const axisEnd = polarToCartesian(MAX_RADIUS, toAngle(index, total))

          return (
            <line
              key={category}
              x1={CENTER}
              y1={CENTER}
              x2={axisEnd.x}
              y2={axisEnd.y}
              stroke={activeIndex === index ? 'var(--accent-coral)' : 'var(--border)'}
              strokeWidth={activeIndex === index ? '1.5' : '1'}
            />
          )
        })}

        <polygon
          points={polygonPoints}
          fill="color-mix(in oklch, var(--accent-coral) 22%, transparent)"
          stroke="var(--accent-coral)"
          strokeWidth="2"
        />

        {categories.map((category, index) => {
          const point = polarToCartesian((clampValue(values[index], max) / max) * MAX_RADIUS, toAngle(index, total))
          return <circle key={`${category}-point`} cx={point.x} cy={point.y} r="4" fill="var(--accent-coral)" />
        })}

        {categories.map((category, index) => {
          const point = polarToCartesian(MAX_RADIUS + 22, toAngle(index, total))
          return (
            <text
              key={`${category}-label`}
              x={point.x}
              y={point.y}
              textAnchor="middle"
              className="mono"
              style={{ fontSize: 10, fill: activeIndex === index ? 'var(--text)' : 'var(--text-soft)' }}
            >
              {category}
            </text>
          )
        })}
      </svg>

      {categories.map((category, index) => {
        const labelPoint = polarToCartesian(MAX_RADIUS + 22, toAngle(index, total))
        const missingValue = typeof values[index] !== 'number'

        return (
          <button
            key={`${category}-button`}
            type="button"
            data-unknown={missingValue}
            className="absolute h-8 min-w-[52px] -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            style={{ left: `${(labelPoint.x / VIEWBOX_SIZE) * 100}%`, top: `${(labelPoint.y / VIEWBOX_SIZE) * 100}%` }}
            aria-label={
              missingValue
                ? `${category} axis, unknown`
                : `${category} axis, ${clampValue(values[index], max)} of ${max}`
            }
            onMouseEnter={() => onActiveIndexChange?.(index)}
            onFocus={() => onActiveIndexChange?.(index)}
            onClick={() => onActiveIndexChange?.(index)}
          >
            <span className="sr-only">{category}</span>
            {missingValue && <span className="sr-only">unknown</span>}
          </button>
        )
      })}
    </div>
  )
}
