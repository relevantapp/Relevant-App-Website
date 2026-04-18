'use client'

import { useState } from 'react'
import FormSection from './shared/FormSection'
import ChipSelector from './shared/ChipSelector'
import TagInput from './shared/TagInput'
import { FOCUS_AREA_OPTIONS } from '../constants'
import type { CompetitiveAnalysisInput, CompetitiveFocusArea, CompetitiveUseCase } from '../types'

const USE_CASE_OPTIONS: Array<{ value: CompetitiveUseCase; label: string }> = [
  { value: 'sales-battlecard', label: 'Sales Battlecard' },
  { value: 'product-strategy', label: 'Product Strategy' },
  { value: 'pricing-review', label: 'Pricing Review' },
  { value: 'board-update', label: 'Board Update' },
]

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
  const [pendingCompetitor, setPendingCompetitor] = useState('')

  const competitors = (() => {
    const current = value.competitors ?? []
    const pending = pendingCompetitor.trim()
    if (!pending) return current
    if (current.some((item) => item.toLowerCase() === pending.toLowerCase())) return current
    return [...current, pending]
  })()

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (competitors.length < 1) {
      errs.competitors = 'Add at least one competitor'
    }
    if (!value.yourCompany || value.yourCompany.trim().length < 2) {
      errs.yourCompany = 'Required (min 2 characters)'
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
      competitors,
      yourCompany: value.yourCompany!.trim(),
      focusArea: value.focusArea!,
      specificQuestions: value.specificQuestions?.trim() || undefined,
      marketSegment: value.marketSegment?.trim() || undefined,
      geography: value.geography?.trim() || undefined,
      customerType: value.customerType?.trim() || undefined,
      useCasePreset: value.useCasePreset || undefined,
    })
  }

  const canSubmit =
    competitors.length >= 1 &&
    (value.yourCompany?.trim().length ?? 0) >= 2 &&
    !!value.focusArea &&
    !loading

  return (
    <div>
      <FormSection label="Competitor(s)" required error={errors.competitors}>
        <TagInput
          value={value.competitors ?? []}
          onChange={(tags) => onChange({ ...value, competitors: tags })}
          max={3}
          placeholder="Type a competitor and press Enter"
          disabled={loading}
          onPendingChange={setPendingCompetitor}
        />
        <p style={{ marginTop: 6, fontSize: 12, color: 'var(--text-soft)' }}>
          Use Enter, comma, or click outside the field to add each competitor.
        </p>
      </FormSection>

      <FormSection label="Your company / product" required error={errors.yourCompany}>
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

      <FormSection label="Use case">
        <ChipSelector
          options={USE_CASE_OPTIONS}
          value={value.useCasePreset ?? null}
          onChange={(v: CompetitiveUseCase) => onChange({ ...value, useCasePreset: v })}
          disabled={loading}
        />
      </FormSection>

      <FormSection label="Market segment">
        <input
          type="text"
          value={value.marketSegment ?? ''}
          onChange={(e) => onChange({ ...value, marketSegment: e.target.value })}
          placeholder="e.g., Enterprise SaaS, SMB fintech"
          maxLength={200}
          disabled={loading}
          style={inputStyle}
        />
      </FormSection>

      <FormSection label="Geography">
        <input
          type="text"
          value={value.geography ?? ''}
          onChange={(e) => onChange({ ...value, geography: e.target.value })}
          placeholder="e.g., North America, EMEA"
          maxLength={100}
          disabled={loading}
          style={inputStyle}
        />
      </FormSection>

      <FormSection label="Customer type">
        <input
          type="text"
          value={value.customerType ?? ''}
          onChange={(e) => onChange({ ...value, customerType: e.target.value })}
          placeholder="e.g., Mid-market, Fortune 500"
          maxLength={200}
          disabled={loading}
          style={inputStyle}
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
