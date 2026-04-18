'use client'

import { useState, useCallback, useRef, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  max: number
  placeholder?: string
  disabled?: boolean
}

export default function TagInput({ value, onChange, max, placeholder, disabled }: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const addTag = useCallback((raw: string) => {
    const tag = raw.trim()
    if (!tag || value.length >= max) return
    if (value.some((t) => t.toLowerCase() === tag.toLowerCase())) return
    onChange([...value, tag])
    setInputValue('')
  }, [value, max, onChange])

  const removeTag = useCallback((index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }, [value, onChange])

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(inputValue)
    }
    if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value.length - 1)
    }
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
      {value.map((tag, i) => (
        <span
          key={`${tag}-${i}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: 'var(--surface-strong)',
            borderRadius: 999,
            padding: '4px 10px',
            fontSize: 13,
            color: 'var(--text)',
          }}
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(i)}
            disabled={disabled}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              color: 'var(--text-muted)',
            }}
            aria-label={`Remove ${tag}`}
          >
            <X size={12} />
          </button>
        </span>
      ))}
      {value.length < max && (
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (inputValue.trim()) addTag(inputValue) }}
          placeholder={value.length === 0 ? placeholder : undefined}
          disabled={disabled}
          style={{
            flex: 1,
            minWidth: 120,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: 14,
            color: 'var(--text)',
            padding: '4px 0',
          }}
        />
      )}
      {value.length >= max && (
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Max {max}</span>
      )}
    </div>
  )
}
