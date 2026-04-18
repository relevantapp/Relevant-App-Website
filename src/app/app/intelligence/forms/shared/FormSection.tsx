'use client'

import type { ReactNode } from 'react'

interface FormSectionProps {
  label: string
  required?: boolean
  error?: string
  children: ReactNode
}

export default function FormSection({ label, required, error, children }: FormSectionProps) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label
        style={{
          display: 'block',
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--text-muted)',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.04em',
          marginBottom: 8,
        }}
      >
        {label}
        {required && (
          <span style={{ color: 'var(--accent-coral)', marginLeft: 4 }}>*</span>
        )}
      </label>
      {children}
      {error && (
        <p style={{ fontSize: 12, color: 'var(--accent-coral)', marginTop: 6 }}>
          {error}
        </p>
      )}
    </div>
  )
}
