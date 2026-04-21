/* Intelligence v4 — shared UI primitives.
   Scoped to [data-intel="v4"] via globals.css. */
'use client'

import type { CSSProperties, ReactNode, ButtonHTMLAttributes } from 'react'

export function Kicker({
  children,
  color,
  style,
}: {
  children: ReactNode
  color?: string
  style?: CSSProperties
}) {
  return (
    <div
      className="kicker"
      style={{ color: color ?? 'var(--ink-muted)', ...style }}
    >
      {children}
    </div>
  )
}

export function Pill({
  children,
  color,
  bg,
  border,
  size = 'sm',
  style,
}: {
  children: ReactNode
  color?: string
  bg?: string
  border?: string
  size?: 'sm' | 'md'
  style?: CSSProperties
}) {
  return (
    <span
      className="mono"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: size === 'sm' ? 20 : 24,
        padding: size === 'sm' ? '0 7px' : '0 9px',
        fontSize: size === 'sm' ? 10 : 11,
        fontWeight: 500,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: color ?? 'var(--ink-dim)',
        background: bg ?? 'var(--surface)',
        border: `1px solid ${border ?? 'var(--border)'}`,
        borderRadius: 4,
        ...style,
      }}
    >
      {children}
    </span>
  )
}

export function Dot({
  color,
  size = 6,
  pulse,
}: {
  color: string
  size?: number
  pulse?: boolean
}) {
  return (
    <span
      className={pulse ? 'intel-live-dot' : undefined}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
      }}
    />
  )
}

type BtnVariant = 'primary' | 'amber' | 'ghost' | 'solid' | 'link'
type BtnSize = 'sm' | 'md' | 'lg'

export function Btn({
  children,
  variant = 'ghost',
  size = 'md',
  icon,
  iconRight,
  style,
  ...rest
}: {
  children?: ReactNode
  variant?: BtnVariant
  size?: BtnSize
  icon?: ReactNode
  iconRight?: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    height: size === 'sm' ? 28 : size === 'lg' ? 42 : 34,
    padding: size === 'sm' ? '0 10px' : size === 'lg' ? '0 18px' : '0 12px',
    borderRadius: 8,
    fontSize: size === 'sm' ? 12 : 13,
    fontWeight: 500,
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
    cursor: rest.disabled ? 'not-allowed' : 'pointer',
    opacity: rest.disabled ? 0.5 : 1,
    fontFamily: 'inherit',
  }
  const variants: Record<BtnVariant, CSSProperties> = {
    primary: {
      background: 'var(--ink)',
      color: 'var(--bg)',
      border: '1px solid var(--ink)',
    },
    amber: {
      background: 'var(--amber)',
      color: '#0a0a0a',
      border: '1px solid var(--amber)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--ink-dim)',
      border: '1px solid var(--border)',
    },
    solid: {
      background: 'var(--surface)',
      color: 'var(--ink)',
      border: '1px solid var(--border)',
    },
    link: {
      background: 'transparent',
      color: 'var(--ink-dim)',
      border: '0',
      padding: 0,
      height: 'auto',
    },
  }
  return (
    <button {...rest} style={{ ...base, ...variants[variant], ...style }}>
      {icon}
      {children}
      {iconRight}
    </button>
  )
}

export function Card({
  children,
  style,
  bg = 'var(--bg-elev)',
  pad = 20,
  rounded = 12,
}: {
  children: ReactNode
  style?: CSSProperties
  bg?: string
  pad?: number
  rounded?: number
}) {
  return (
    <div
      style={{
        background: bg,
        border: '1px solid var(--border)',
        borderRadius: rounded,
        padding: pad,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function EvTag({
  type,
  sources,
  onSourceClick,
}: {
  type: 'fact' | 'inference' | string
  sources?: Array<number | string>
  onSourceClick?: (id: string) => void
}) {
  const isFact = type === 'fact'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
      <span className={`ev-tag mono ${isFact ? 'ev-tag--fact' : 'ev-tag--infer'}`}
        style={{
          fontSize: 9,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          padding: '1px 5px',
        }}
      >
        {isFact ? 'FACT' : 'INFER'}
      </span>
      {sources?.map((s) => (
        <button
          key={String(s)}
          type="button"
          onClick={() => onSourceClick?.(String(s))}
          className="source-chip mono"
          style={{ cursor: onSourceClick ? 'pointer' : 'default' }}
        >
          [{s}]
        </button>
      ))}
    </span>
  )
}

export function Meter({
  value = 0.8,
  label,
  color = 'var(--green)',
  w = 120,
}: {
  value?: number
  label?: string
  color?: string
  w?: number
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {label && (
        <span
          className="mono"
          style={{
            fontSize: 10,
            color: 'var(--ink-muted)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
      )}
      <div
        style={{
          width: w,
          height: 4,
          background: 'var(--surface-2)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, height: '100%', background: color }} />
      </div>
      <span className="mono tnum" style={{ fontSize: 10, color: 'var(--ink-dim)' }}>
        {Math.round(value * 100)}
      </span>
    </div>
  )
}

export function LogoChip({
  name,
  color = 'var(--amber)',
  size = 28,
}: {
  name: string
  color?: string
  size?: number
}) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        background: `color-mix(in oklch, ${color}, transparent 70%)`,
        border: `1px solid color-mix(in oklch, ${color}, transparent 40%)`,
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-mono), ui-monospace, monospace',
        fontSize: Math.round(size * 0.38),
        fontWeight: 600,
        letterSpacing: 0,
      }}
    >
      {initials || '—'}
    </div>
  )
}
