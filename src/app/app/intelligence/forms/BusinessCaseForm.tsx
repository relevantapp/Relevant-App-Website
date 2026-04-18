'use client'

import { useState } from 'react'
import FormSection from './shared/FormSection'
import TagInput from './shared/TagInput'
import type { BusinessCaseInput } from '../types'

interface BusinessCaseFormProps {
  value: Partial<BusinessCaseInput>
  onChange: (value: Partial<BusinessCaseInput>) => void
  onSubmit: (input: BusinessCaseInput) => void
  loading: boolean
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  fontSize: 14,
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  color: 'var(--text)',
  outline: 'none',
}

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: 'vertical' as const,
  fontFamily: 'inherit',
}

export default function BusinessCaseForm({ value, onChange, onSubmit, loading }: BusinessCaseFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!value.initiativeName || value.initiativeName.trim().length < 3) {
      errs.initiativeName = 'Required (min 3 characters)'
    }
    if (!value.hypothesis || value.hypothesis.trim().length < 10) {
      errs.hypothesis = 'Required (min 10 characters)'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    onSubmit({
      researchType: 'business_case',
      initiativeName: value.initiativeName!.trim(),
      hypothesis: value.hypothesis!.trim(),
      targetMarket: value.targetMarket?.trim() || undefined,
      successMetrics: (value.successMetrics ?? []).length > 0 ? value.successMetrics : undefined,
      keyQuestions: value.keyQuestions?.trim() || undefined,
      comparableCompanies: (value.comparableCompanies ?? []).length > 0 ? value.comparableCompanies : undefined,
    })
  }

  const canSubmit =
    (value.initiativeName?.trim().length ?? 0) >= 3 &&
    (value.hypothesis?.trim().length ?? 0) >= 10 &&
    !loading

  return (
    <div>
      <FormSection label="Initiative name" required error={errors.initiativeName}>
        <input
          type="text"
          value={value.initiativeName ?? ''}
          onChange={(e) => onChange({ ...value, initiativeName: e.target.value })}
          placeholder="Weekend delivery service"
          maxLength={200}
          disabled={loading}
          style={inputStyle}
        />
      </FormSection>

      <FormSection label="Your hypothesis" required error={errors.hypothesis}>
        <textarea
          rows={2}
          value={value.hypothesis ?? ''}
          onChange={(e) => onChange({ ...value, hypothesis: e.target.value })}
          placeholder="What you believe and want to validate"
          maxLength={500}
          disabled={loading}
          style={textareaStyle}
        />
      </FormSection>

      <FormSection label="Target market">
        <input
          type="text"
          value={value.targetMarket ?? ''}
          onChange={(e) => onChange({ ...value, targetMarket: e.target.value })}
          placeholder="Who would this serve?"
          maxLength={200}
          disabled={loading}
          style={inputStyle}
        />
      </FormSection>

      <FormSection label="Success metrics">
        <TagInput
          value={value.successMetrics ?? []}
          onChange={(tags) => onChange({ ...value, successMetrics: tags })}
          max={4}
          placeholder="Revenue uplift, Customer retention..."
          disabled={loading}
        />
      </FormSection>

      <FormSection label="Key questions">
        <textarea
          rows={3}
          value={value.keyQuestions ?? ''}
          onChange={(e) => onChange({ ...value, keyQuestions: e.target.value })}
          placeholder="What specifically do you need answered?"
          maxLength={2000}
          disabled={loading}
          style={textareaStyle}
        />
      </FormSection>

      <FormSection label="Comparable companies">
        <TagInput
          value={value.comparableCompanies ?? []}
          onChange={(tags) => onChange({ ...value, comparableCompanies: tags })}
          max={3}
          placeholder="Companies that have done similar"
          disabled={loading}
        />
      </FormSection>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        style={{
          width: '100%',
          padding: 14,
          borderRadius: 12,
          fontSize: 15,
          fontWeight: 600,
          border: 'none',
          cursor: canSubmit ? 'pointer' : 'default',
          background: 'var(--accent)',
          color: 'white',
          opacity: canSubmit ? 1 : 0.4,
          transition: 'opacity var(--motion-micro) var(--ease-out)',
          marginTop: 8,
        }}
      >
        {loading ? 'Researching...' : 'Generate Intelligence'}
      </button>
    </div>
  )
}
