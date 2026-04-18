'use client'

import { useState } from 'react'
import FormSection from './shared/FormSection'
import ChipSelector from './shared/ChipSelector'
import TagInput from './shared/TagInput'
import { SCOPE_OPTIONS, TIME_HORIZON_OPTIONS } from '../constants'
import type { MarketResearchInput, MarketScope, TimeHorizon } from '../types'

interface MarketResearchFormProps {
  value: Partial<MarketResearchInput>
  onChange: (value: Partial<MarketResearchInput>) => void
  onSubmit: (input: MarketResearchInput) => void
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

export default function MarketResearchForm({ value, onChange, onSubmit, loading }: MarketResearchFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!value.marketOrTrend || value.marketOrTrend.trim().length < 3) {
      errs.marketOrTrend = 'Required (min 3 characters)'
    }
    if (!value.scope) {
      errs.scope = 'Select a scope'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    onSubmit({
      researchType: 'market_research',
      marketOrTrend: value.marketOrTrend!.trim(),
      scope: value.scope!,
      keyQuestions: value.keyQuestions?.trim() || undefined,
      knownPlayers: (value.knownPlayers ?? []).length > 0 ? value.knownPlayers : undefined,
      timeHorizon: value.timeHorizon ?? undefined,
    })
  }

  const canSubmit =
    (value.marketOrTrend?.trim().length ?? 0) >= 3 &&
    !!value.scope &&
    !loading

  return (
    <div>
      <FormSection label="Market or trend" required error={errors.marketOrTrend}>
        <input
          type="text"
          value={value.marketOrTrend ?? ''}
          onChange={(e) => onChange({ ...value, marketOrTrend: e.target.value })}
          placeholder="AI-powered logistics"
          maxLength={200}
          disabled={loading}
          style={inputStyle}
        />
      </FormSection>

      <FormSection label="Scope" required error={errors.scope}>
        <ChipSelector
          options={SCOPE_OPTIONS}
          value={value.scope ?? null}
          onChange={(v: MarketScope) => onChange({ ...value, scope: v })}
          disabled={loading}
        />
      </FormSection>

      <FormSection label="Key questions">
        <textarea
          rows={3}
          value={value.keyQuestions ?? ''}
          onChange={(e) => onChange({ ...value, keyQuestions: e.target.value })}
          placeholder="What do you want answered?"
          maxLength={2000}
          disabled={loading}
          style={textareaStyle}
        />
      </FormSection>

      <FormSection label="Known players">
        <TagInput
          value={value.knownPlayers ?? []}
          onChange={(tags) => onChange({ ...value, knownPlayers: tags })}
          max={5}
          placeholder="Companies already on your radar"
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
