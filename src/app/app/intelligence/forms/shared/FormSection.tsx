'use client'

import type { ReactNode } from 'react'

interface FormSectionProps {
  label: string
  hint?: string
  index?: string
  required?: boolean
  error?: string
  children: ReactNode
}

export default function FormSection({ label, hint, index, required, error, children }: FormSectionProps) {
  return (
    <div className="intel-field-row">
      <div className="intel-field-copy">
        {index && <span className="mono intel-field-index">{index}</span>}
        <label>
          {label}
          {required && <span>*</span>}
        </label>
        {hint && <p>{hint}</p>}
      </div>
      <div className="intel-field-control">
        {children}
        {error && (
          <p className="intel-field-error">{error}</p>
        )}
      </div>
    </div>
  )
}
