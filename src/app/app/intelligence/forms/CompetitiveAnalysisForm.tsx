'use client'

import { useState } from 'react'
import FormSection from './shared/FormSection'
import ChipSelector from './shared/ChipSelector'
import TagInput from './shared/TagInput'
import { FOCUS_AREA_OPTIONS } from '../constants'
import type { CompetitiveAnalysisInput, CompetitiveFocusArea } from '../types'

interface CompetitiveAnalysisFormProps {
  value: Partial<CompetitiveAnalysisInput>
  onChange: (value: Partial<CompetitiveAnalysisInput>) => void
  onSubmit: (input: CompetitiveAnalysisInput) => void
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

export default function CompetitiveAnalysisForm({ value, onChange, onSubmit, loading }: CompetitiveAnalysisFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!value.competitors || value.competitors.length < 1) {
      errs.competitors = 'Add at least one competitor'
    }
    if (!value.focusArea) {
      errs.focusArea = 'Select a focus area'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    onSubmit({
      researchType: 'competitive_analysis',
      competitors: value.competitors!,
      yourCompany: value.yourCompany?.trim() || undefined,
      focusArea: value.focusArea!,
      specificQuestions: value.specificQuestions?.trim() || undefined,
    })
  }

  const canSubmit =
    (value.competitors ?? []).length >= 1 &&
    !!value.focusArea &&
    !loading

  return (
    <div>
      <FormSection label="Competitor(s)" required error={errors.competitors}>
        <TagInput
          value={value.competitors ?? []}
          onChange={(tags) => onChange({ ...value, competitors: tags })}
          max={3}
          placeholder="Which competitors to analyze"
          disabled={loading}
        />
      </FormSection>

      <FormSection label="Your company / product">
        <input
          type="text"
          value={value.yourCompany ?? ''}
          onChange={(e) => onChange({ ...value, yourCompany: e.target.value })}
          placeholder="Your company name"
          maxLength={200}
          disabled={loading}
          style={inputStyle}
        />
      </FormSection>

      <FormSection label="Focus area" required error={errors.focusArea}>
        <ChipSelector
          options={FOCUS_AREA_OPTIONS}
          value={value.focusArea ?? null}
          onChange={(v: CompetitiveFocusArea) => onChange({ ...value, focusArea: v })}
          disabled={loading}
        />
      </FormSection>

      <FormSection label="Specific questions">
        <textarea
          rows={3}
          value={value.specificQuestions ?? ''}
          onChange={(e) => onChange({ ...value, specificQuestions: e.target.value })}
          placeholder="What do you want to know?"
          maxLength={2000}
          disabled={loading}
          style={textareaStyle}
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
