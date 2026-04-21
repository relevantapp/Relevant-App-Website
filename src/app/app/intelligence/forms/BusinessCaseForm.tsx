'use client'

import { useState } from 'react'
import { Zap } from 'lucide-react'
import FormSection from './shared/FormSection'
import ChipSelector from './shared/ChipSelector'
import TagInput from './shared/TagInput'
import IntakeShell from './shared/IntakeShell'
import { Btn } from '../ui/primitives'
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
  { value: 'internal-investment', label: 'Internal investment' },
]

const DECISION_AUDIENCE_OPTIONS: Array<{ value: DecisionAudience; label: string }> = [
  { value: 'ceo', label: 'CEO' },
  { value: 'board', label: 'Board' },
  { value: 'exec-team', label: 'Exec team' },
  { value: 'finance', label: 'Finance' },
  { value: 'product', label: 'Product' },
]

const TIME_HORIZON_OPTIONS: Array<{ value: TimeHorizon; label: string }> = [
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '6m', label: '6 months' },
  { value: '1y', label: '1 year+' },
]

const INVESTMENT_OPTIONS: Array<{ value: InvestmentLevel; label: string }> = [
  { value: '<50k', label: '<$50K' },
  { value: '50k-500k', label: '$50K–500K' },
  { value: '500k-5M', label: '$500K–5M' },
  { value: '>5M', label: '>$5M' },
]

const ROI_FRAME_OPTIONS: Array<{ value: ROIFrame; label: string }> = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'cost-savings', label: 'Cost savings' },
  { value: 'speed', label: 'Speed' },
  { value: 'retention', label: 'Retention' },
  { value: 'risk-reduction', label: 'Risk reduction' },
]

interface BusinessCaseFormProps {
  value: Partial<BusinessCaseInput>
  onChange: (value: Partial<BusinessCaseInput>) => void
  onSubmit: (input: BusinessCaseInput) => void
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

export default function BusinessCaseForm({ value, onChange, onSubmit, loading }: BusinessCaseFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [advancedOpen, setAdvancedOpen] = useState(false)

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
  const decisionTypeLabel = DECISION_TYPE_OPTIONS.find((opt) => opt.value === value.decisionType)?.label ?? 'Unset'
  const audienceLabel = DECISION_AUDIENCE_OPTIONS.find((opt) => opt.value === value.decisionAudience)?.label ?? 'Unset'

  return (
    <IntakeShell
      workflow="01 / Business Case"
      title="Turn a claim into a decision brief."
      lede="State the initiative and the belief behind it. Relevant looks for proof, objections, comparable outcomes, and what has to be true."
      estimate="~2m 30s · 14–20 sources"
      docket={[
        { label: 'Initiative', value: value.initiativeName?.trim() || 'Unset' },
        { label: 'Move type', value: decisionTypeLabel },
        { label: 'Audience', value: audienceLabel },
        { label: 'Claim', value: value.hypothesis?.trim() ? 'Drafted' : 'Unset' },
      ]}
      output={[
        'Evidence for and against the claim',
        'Comparable companies and outcomes',
        'Risks, objections, and decision criteria',
      ]}
      footer={
        <>
          <div className="mono intel-sheet-note">Required: initiative and claim</div>
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
        <FormSection index="01" label="Initiative name" hint="A short, memorable handle." required error={errors.initiativeName}>
          <input
            type="text"
            value={value.initiativeName ?? ''}
            onChange={(e) => onChange({ ...value, initiativeName: e.target.value })}
            placeholder="Weekend delivery · East Coast"
            maxLength={200}
            disabled={loading}
            style={inputStyle}
          />
        </FormSection>

        <FormSection
          index="02"
          label="Your claim"
          hint="What you believe and want to validate. Be specific."
          required
          error={errors.hypothesis}
        >
          <textarea
            rows={3}
            value={value.hypothesis ?? ''}
            onChange={(e) => onChange({ ...value, hypothesis: e.target.value })}
            placeholder="Launching weekend delivery in the Northeast will lift repeat order rate by 15% within two quarters."
            maxLength={500}
            disabled={loading}
            style={textareaStyle}
          />
        </FormSection>

        <FormSection index="03" label="Decision type" hint="What kind of move is this?">
          <ChipSelector
            options={DECISION_TYPE_OPTIONS}
            value={value.decisionType ?? null}
            onChange={(v: DecisionType) => onChange({ ...value, decisionType: v })}
            disabled={loading}
          />
        </FormSection>

        <FormSection index="04" label="Who is the audience?" hint="Shapes how the brief is framed.">
          <ChipSelector
            options={DECISION_AUDIENCE_OPTIONS}
            value={value.decisionAudience ?? null}
            onChange={(v: DecisionAudience) => onChange({ ...value, decisionAudience: v })}
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
            <FormSection index="A1" label="Time horizon">
              <ChipSelector
                options={TIME_HORIZON_OPTIONS}
                value={value.timeHorizon ?? null}
                onChange={(v: TimeHorizon) => onChange({ ...value, timeHorizon: v })}
                disabled={loading}
              />
            </FormSection>

            <FormSection index="A2" label="Investment level">
              <ChipSelector
                options={INVESTMENT_OPTIONS}
                value={value.investmentLevel ?? null}
                onChange={(v: InvestmentLevel) => onChange({ ...value, investmentLevel: v })}
                disabled={loading}
              />
            </FormSection>

            <FormSection index="A3" label="ROI framing" hint="Pick one or more.">
              <div className="intel-chip-group">
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
                      className="intel-chip"
                      data-selected={selected ? 'true' : 'false'}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </FormSection>

            <FormSection index="A4" label="Target market">
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

            <FormSection index="A5" label="Success metrics">
              <TagInput
                value={value.successMetrics ?? []}
                onChange={(tags) => onChange({ ...value, successMetrics: tags })}
                max={4}
                placeholder="Revenue uplift, retention…"
                disabled={loading}
              />
            </FormSection>

            <FormSection index="A6" label="Key questions" hint="What specifically do you need answered?">
              <textarea
                rows={3}
                value={value.keyQuestions ?? ''}
                onChange={(e) => onChange({ ...value, keyQuestions: e.target.value })}
                placeholder="What does the evidence need to show for this to be greenlit?"
                maxLength={2000}
                disabled={loading}
                style={textareaStyle}
              />
            </FormSection>

            <FormSection index="A7" label="Comparable companies" hint="Who else has tried something similar?">
              <TagInput
                value={value.comparableCompanies ?? []}
                onChange={(tags) => onChange({ ...value, comparableCompanies: tags })}
                max={3}
                placeholder="Company name"
                disabled={loading}
              />
            </FormSection>
          </div>
        )}
    </IntakeShell>
  )
}
