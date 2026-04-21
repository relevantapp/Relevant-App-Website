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
    <div className="intel-chip-group">
      {options.map((opt) => {
        const selected = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            disabled={disabled}
            className="intel-chip"
            data-selected={selected ? 'true' : 'false'}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
