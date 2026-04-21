'use client'

import { useState } from 'react'
import { Zap } from 'lucide-react'
import FormSection from './shared/FormSection'
import ChipSelector from './shared/ChipSelector'
import TagInput from './shared/TagInput'
import IntakeShell from './shared/IntakeShell'
import { Btn } from '../ui/primitives'
import { FOCUS_AREA_OPTIONS } from '../constants'
import type { CompetitiveAnalysisInput, CompetitiveFocusArea, CompetitiveUseCase } from '../types'

const USE_CASE_OPTIONS: Array<{ value: CompetitiveUseCase; label: string }> = [
  { value: 'sales-battlecard', label: 'Sales battlecard' },
  { value: 'product-strategy', label: 'Product strategy' },
  { value: 'pricing-review', label: 'Pricing review' },
  { value: 'board-update', label: 'Board update' },
]

interface CompetitiveAnalysisFormProps {
  value: Partial<CompetitiveAnalysisInput>
  onChange: (value: Partial<CompetitiveAnalysisInput>) => void
  onSubmit: (input: CompetitiveAnalysisInput) => void
  loading: boolean
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-elev)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '11px 14px',
  color: 'var(--ink)',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
}

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  resize: 'vertical',
}

export default function CompetitiveAnalysisForm({ value, onChange, onSubmit, loading }: CompetitiveAnalysisFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pendingCompetitor, setPendingCompetitor] = useState('')
  const [advancedOpen, setAdvancedOpen] = useState(false)

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
  const focusLabel = FOCUS_AREA_OPTIONS.find((opt) => opt.value === value.focusArea)?.label ?? 'Unset'
  const useCaseLabel = USE_CASE_OPTIONS.find((opt) => opt.value === value.useCasePreset)?.label ?? 'Standard'

  return (
    <IntakeShell
      workflow="01 / Competitive Analysis"
      title="Size the competitors by the move you need to make."
      lede="Give the comparison set and the dimension that matters. Relevant will separate market noise from useful competitive signal."
      estimate="~2m 10s · 12–18 sources"
      docket={[
        { label: 'Against', value: value.yourCompany?.trim() || 'Unset' },
        { label: 'Set', value: competitors.length ? competitors.join(', ') : 'Unset' },
        { label: 'Focus', value: focusLabel },
        { label: 'Output', value: useCaseLabel },
      ]}
      output={[
        'Where each player wins or leaks',
        'Recent moves and proof points',
        'Positioning and counter-moves',
      ]}
      footer={
        <>
          <div className="mono intel-sheet-note">Required: competitor, your company, focus area</div>
          <Btn
            variant="amber"
            size="lg"
            onClick={handleSubmit}
            disabled={!canSubmit}
            icon={<Zap size={15} strokeWidth={2} />}
          >
            {loading ? 'Researching…' : 'Refine intent →'}
          </Btn>
        </>
      }
    >
        <FormSection
          index="01"
          label="Competitors"
          hint="Up to 3. Press Enter, comma, or click outside to add."
          required
          error={errors.competitors}
        >
          <TagInput
            value={value.competitors ?? []}
            onChange={(tags) => onChange({ ...value, competitors: tags })}
            max={3}
            placeholder="e.g. Cursor, Copilot"
            disabled={loading}
            onPendingChange={setPendingCompetitor}
          />
        </FormSection>

        <FormSection
          index="02"
          label="Your company or product"
          hint="What they&rsquo;ll be compared against."
          required
          error={errors.yourCompany}
        >
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

        <FormSection index="03" label="Focus area" hint="What dimension should the analysis lean on?" required error={errors.focusArea}>
          <ChipSelector
            options={FOCUS_AREA_OPTIONS}
            value={value.focusArea ?? null}
            onChange={(v: CompetitiveFocusArea) => onChange({ ...value, focusArea: v })}
            disabled={loading}
          />
        </FormSection>

        <button
          type="button"
          onClick={() => setAdvancedOpen((v) => !v)}
          className="intel-context-toggle"
        >
          {advancedOpen ? '− Less context' : '+ More context'}
        </button>

        {advancedOpen && (
          <div className="intel-advanced-panel">
            <FormSection index="A1" label="Use case" hint="Preset for the output shape.">
              <ChipSelector
                options={USE_CASE_OPTIONS}
                value={value.useCasePreset ?? null}
                onChange={(v: CompetitiveUseCase) => onChange({ ...value, useCasePreset: v })}
                disabled={loading}
              />
            </FormSection>

            <FormSection index="A2" label="Market segment">
              <input
                type="text"
                value={value.marketSegment ?? ''}
                onChange={(e) => onChange({ ...value, marketSegment: e.target.value })}
                placeholder="e.g. Enterprise SaaS, SMB fintech"
                maxLength={200}
                disabled={loading}
                style={inputStyle}
              />
            </FormSection>

            <FormSection index="A3" label="Geography">
              <input
                type="text"
                value={value.geography ?? ''}
                onChange={(e) => onChange({ ...value, geography: e.target.value })}
                placeholder="e.g. North America, EMEA"
                maxLength={100}
                disabled={loading}
                style={inputStyle}
              />
            </FormSection>

            <FormSection index="A4" label="Customer type">
              <input
                type="text"
                value={value.customerType ?? ''}
                onChange={(e) => onChange({ ...value, customerType: e.target.value })}
                placeholder="e.g. Mid-market, Fortune 500"
                maxLength={200}
                disabled={loading}
                style={inputStyle}
              />
            </FormSection>

            <FormSection index="A5" label="Specific questions" hint="Narrow the lens further.">
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
          </div>
        )}
    </IntakeShell>
  )
}
