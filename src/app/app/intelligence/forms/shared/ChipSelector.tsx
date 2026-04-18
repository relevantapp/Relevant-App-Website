'use client'

interface ChipOption<T extends string> {
  value: T
  label: string
}

interface ChipSelectorProps<T extends string> {
  options: ChipOption<T>[]
  value: T | null
  onChange: (value: T) => void
  disabled?: boolean
}

export default function ChipSelector<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: ChipSelectorProps<T>) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map((opt) => {
        const selected = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            disabled={disabled}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 500,
              cursor: disabled ? 'default' : 'pointer',
              border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
              background: selected ? 'rgba(47, 107, 255, 0.12)' : 'var(--surface)',
              color: selected ? 'var(--accent)' : 'var(--text)',
              transition: 'all var(--motion-micro) var(--ease-out)',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
