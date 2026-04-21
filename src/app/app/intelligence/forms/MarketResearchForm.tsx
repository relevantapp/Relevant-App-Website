'use client'

import { useState } from 'react'
import { Zap } from 'lucide-react'
import FormSection from './shared/FormSection'
import ChipSelector from './shared/ChipSelector'
import TagInput from './shared/TagInput'
import IntakeShell from './shared/IntakeShell'
import { Btn } from '../ui/primitives'
import { SCOPE_OPTIONS, TIME_HORIZON_OPTIONS } from '../constants'
import type {
  MarketResearchInput,
  MarketScope,
  TimeHorizon,
  MarketObjective,
  MarketDepth,
} from '../types'

const OBJECTIVE_OPTIONS: Array<{ value: MarketObjective; label: string }> = [
  { value: 'market-size', label: 'Market size' },
  { value: 'trend-scan', label: 'Trend scan' },
  { value: 'player-map', label: 'Player map' },
  { value: 'whitespace', label: 'Whitespace' },
  { value: 'investment-view', label: 'Investment view' },
]

const DEPTH_OPTIONS: Array<{ value: MarketDepth; label: string }> = [
  { value: 'fast-scan', label: 'Fast scan' },
  { value: 'deep-dive', label: 'Deep dive' },
]

interface MarketResearchFormProps {
  value: Partial<MarketResearchInput>
  onChange: (value: Partial<MarketResearchInput>) => void
  onSubmit: (input: MarketResearchInput) => void
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

export default function MarketResearchForm({ value, onChange, onSubmit, loading }: MarketResearchFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!value.marketOrTrend || value.marketOrTrend.trim().length < 3) {
      errs.marketOrTrend = 'Required (min 3 characters)'
    }
    if (!value.scope) {
      errs.scope = 'Select a scope'
    }
    if (value.scope === 'specific_region' && !value.region?.trim()) {
      errs.region = 'Region is required when scope is Specific region'
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
      objective: value.objective || undefined,
      region: value.scope === 'specific_region' ? value.region?.trim() : undefined,
      customerSegment: value.customerSegment?.trim() || undefined,
      useCase: value.useCase?.trim() || undefined,
      depth: value.depth || undefined,
    })
  }

  const canSubmit =
    (value.marketOrTrend?.trim().length ?? 0) >= 3 &&
    !!value.scope &&
    !loading
  const scopeLabel = SCOPE_OPTIONS.find((opt) => opt.value === value.scope)?.label ?? 'Unset'
  const objectiveLabel = OBJECTIVE_OPTIONS.find((opt) => opt.value === value.objective)?.label ?? 'Standard'

  return (
    <IntakeShell
      workflow="01 / Market Research"
      title="Map a market by motion, not buzzwords."
      lede="Name the space, set the geography, and give the research a practical objective so the brief returns usable signal."
      estimate="~2m 15s · 15–22 sources"
      docket={[
        { label: 'Market', value: value.marketOrTrend?.trim() || 'Unset' },
        { label: 'Scope', value: value.region?.trim() || scopeLabel },
        { label: 'Objective', value: objectiveLabel },
        { label: 'Depth', value: value.depth === 'deep-dive' ? 'Deep dive' : 'Fast scan' },
      ]}
      output={[
        'Market shifts and demand signals',
        'Named players and movement',
        'Risks, barriers, and openings',
      ]}
      footer={
        <>
          <div className="mono intel-sheet-note">Required: market and scope</div>
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
          label="Market or trend"
          hint="What are you trying to understand?"
          required
          error={errors.marketOrTrend}
        >
          <input
            type="text"
            value={value.marketOrTrend ?? ''}
            onChange={(e) => onChange({ ...value, marketOrTrend: e.target.value })}
            placeholder="Agent payments · infra category"
            maxLength={200}
            disabled={loading}
            style={inputStyle}
          />
        </FormSection>

        <FormSection index="02" label="Scope" hint="Geography the research should cover." required error={errors.scope}>
          <ChipSelector
            options={SCOPE_OPTIONS}
            value={value.scope ?? null}
            onChange={(v: MarketScope) => onChange({ ...value, scope: v })}
            disabled={loading}
          />
        </FormSection>

        {value.scope === 'specific_region' && (
          <FormSection index="03" label="Region" hint="Which region specifically?" required error={errors.region}>
            <input
              type="text"
              value={value.region ?? ''}
              onChange={(e) => onChange({ ...value, region: e.target.value })}
              placeholder="e.g. Southeast Asia, DACH, Nordics"
              maxLength={100}
              disabled={loading}
              style={inputStyle}
            />
          </FormSection>
        )}

        <FormSection index={value.scope === 'specific_region' ? '04' : '03'} label="Objective" hint="What shape should the output take?">
          <ChipSelector
            options={OBJECTIVE_OPTIONS}
            value={value.objective ?? null}
            onChange={(v: MarketObjective) => onChange({ ...value, objective: v })}
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
            <FormSection index="A1" label="Research depth">
              <ChipSelector
                options={DEPTH_OPTIONS}
                value={value.depth ?? null}
                onChange={(v: MarketDepth) => onChange({ ...value, depth: v })}
                disabled={loading}
              />
            </FormSection>

            <FormSection index="A2" label="Customer segment">
              <input
                type="text"
                value={value.customerSegment ?? ''}
                onChange={(e) => onChange({ ...value, customerSegment: e.target.value })}
                placeholder="e.g. Enterprise CFOs, SMB retailers"
                maxLength={200}
                disabled={loading}
                style={inputStyle}
              />
            </FormSection>

            <FormSection index="A3" label="Use case">
              <input
                type="text"
                value={value.useCase ?? ''}
                onChange={(e) => onChange({ ...value, useCase: e.target.value })}
                placeholder="e.g. Demand forecasting, last-mile delivery"
                maxLength={200}
                disabled={loading}
                style={inputStyle}
              />
            </FormSection>

            <FormSection index="A4" label="Key questions">
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

            <FormSection index="A5" label="Known players" hint="Companies already on your radar.">
              <TagInput
                value={value.knownPlayers ?? []}
                onChange={(tags) => onChange({ ...value, knownPlayers: tags })}
                max={5}
                placeholder="Type a company and press Enter"
                disabled={loading}
              />
            </FormSection>

            <FormSection index="A6" label="Time horizon">
              <ChipSelector
                options={TIME_HORIZON_OPTIONS}
                value={value.timeHorizon ?? null}
                onChange={(v: TimeHorizon) => onChange({ ...value, timeHorizon: v })}
                disabled={loading}
              />
            </FormSection>
          </div>
        )}
    </IntakeShell>
  )
}
