'use client'

import { useState, useCallback, useRef, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  max: number
  placeholder?: string
  disabled?: boolean
  onPendingChange?: (value: string) => void
}

export default function TagInput({
  value,
  onChange,
  max,
  placeholder,
  disabled,
  onPendingChange,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const addTag = useCallback(
    (raw: string) => {
      const tag = raw.trim()
      if (!tag || value.length >= max) return
      if (value.some((t) => t.toLowerCase() === tag.toLowerCase())) return
      onChange([...value, tag])
      setInputValue('')
      onPendingChange?.('')
    },
    [value, max, onChange, onPendingChange],
  )

  const removeTag = useCallback(
    (index: number) => {
      onChange(value.filter((_, i) => i !== index))
    },
    [value, onChange],
  )

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
    <div>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value)
          onPendingChange?.(e.target.value)
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          if (inputValue.trim()) {
            addTag(inputValue)
            return
          }
          onPendingChange?.('')
        }}
        placeholder={value.length >= max ? `Max ${max} reached` : placeholder ?? 'Type and press Enter'}
        disabled={disabled || value.length >= max}
        style={{
          width: '100%',
          background: 'var(--bg-elev)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '11px 14px',
          color: 'var(--ink)',
          fontSize: 14,
          outline: 'none',
          fontFamily: 'inherit',
        }}
      />
      {value.length > 0 && (
        <div className="intel-tag-list">
          {value.map((tag, i) => (
            <span
              key={`${tag}-${i}`}
              className="intel-tag"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(i)}
                disabled={disabled}
                aria-label={`Remove ${tag}`}
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
