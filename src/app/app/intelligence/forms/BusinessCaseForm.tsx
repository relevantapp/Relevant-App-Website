'use client'

import { useState } from 'react'
import FormSection from './shared/FormSection'
import ChipSelector from './shared/ChipSelector'
import TagInput from './shared/TagInput'
import type {
  BusinessCaseInput,
  DecisionType,
  DecisionAudience,
  TimeHorizon,
  InvestmentLevel,
  ROIFrame,
} from '../types'

const DECISION_TYPE_OPTIONS: Array<{ value: DecisionType; label: string }> = [
  { value: 'launch', label: 'Launch' },
  { value: 'expansion', label: 'Expansion' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'internal-investment', label: 'Internal Investment' },
]

const DECISION_AUDIENCE_OPTIONS: Array<{ value: DecisionAudience; label: string }> = [
  { value: 'ceo', label: 'CEO' },
  { value: 'board', label: 'Board' },
  { value: 'exec-team', label: 'Exec Team' },
  { value: 'finance', label: 'Finance' },
  { value: 'product', label: 'Product' },
]

const TIME_HORIZON_OPTIONS: Array<{ value: TimeHorizon; label: string }> = [
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '6m', label: '6 Months' },
  { value: '1y', label: '1 Year+' },
]

const INVESTMENT_OPTIONS: Array<{ value: InvestmentLevel; label: string }> = [
  { value: '<50k', label: '<$50K' },
  { value: '50k-500k', label: '$50K–500K' },
  { value: '500k-5M', label: '$500K–5M' },
  { value: '>5M', label: '>$5M' },
]

const ROI_FRAME_OPTIONS: Array<{ value: ROIFrame; label: string }> = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'cost-savings', label: 'Cost Savings' },
  { value: 'speed', label: 'Speed' },
  { value: 'retention', label: 'Retention' },
  { value: 'risk-reduction', label: 'Risk Reduction' },
]

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
      decisionType: value.decisionType || undefined,
      decisionAudience: value.decisionAudience || undefined,
      timeHorizon: value.timeHorizon || undefined,
      investmentLevel: value.investmentLevel || undefined,
      roiFrame: (value.roiFrame ?? []).length > 0 ? value.roiFrame : undefined,
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

      <FormSection label="Your claim" required error={errors.hypothesis}>
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

      <FormSection label="Decision type">
        <ChipSelector
          options={DECISION_TYPE_OPTIONS}
          value={value.decisionType ?? null}
          onChange={(v: DecisionType) => onChange({ ...value, decisionType: v })}
          disabled={loading}
        />
      </FormSection>

      <FormSection label="Decision audience">
        <ChipSelector
          options={DECISION_AUDIENCE_OPTIONS}
          value={value.decisionAudience ?? null}
          onChange={(v: DecisionAudience) => onChange({ ...value, decisionAudience: v })}
          disabled={loading}
        />
      </FormSection>

      <FormSection label="Time horizon">
        <ChipSelector
          options={TIME_HORIZON_OPTIONS}
          value={value.timeHorizon ?? null}
          onChange={(v: TimeHorizon) => onChange({ ...value, timeHorizon: v })}
          disabled={loading}
        />
      </FormSection>

      <FormSection label="Investment level">
        <ChipSelector
          options={INVESTMENT_OPTIONS}
          value={value.investmentLevel ?? null}
          onChange={(v: InvestmentLevel) => onChange({ ...value, investmentLevel: v })}
          disabled={loading}
        />
      </FormSection>

      <FormSection label="ROI framing">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {ROI_FRAME_OPTIONS.map((opt) => {
            const selected = (value.roiFrame ?? []).includes(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  const current = value.roiFrame ?? []
                  const next = selected ? current.filter((v) => v !== opt.value) : [...current, opt.value]
                  onChange({ ...value, roiFrame: next })
                }}
                disabled={loading}
                style={{
                  padding: '6px 14px',
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: loading ? 'default' : 'pointer',
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
