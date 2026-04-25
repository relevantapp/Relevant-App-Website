'use client'

import { useState } from 'react'
import { Zap } from 'lucide-react'
import FormSection from './shared/FormSection'
import ChipSelector from './shared/ChipSelector'
import TagInput from './shared/TagInput'
import AIRefineButton from './shared/AIRefineButton'
import IntakeShell from './shared/IntakeShell'
import { Btn } from '../ui/primitives'
import { MEETING_TYPE_OPTIONS_V3, GOAL_PLACEHOLDERS_V3 } from '../constants'
import type { MeetingPrepInput, MeetingTypeV3, RelationshipStage } from '../types'

const RELATIONSHIP_STAGE_OPTIONS: Array<{ value: RelationshipStage; label: string }> = [
  { value: 'first-meeting', label: 'First meeting' },
  { value: 'active-deal', label: 'Active deal' },
  { value: 'renewal', label: 'Renewal' },
  { value: 'exec-review', label: 'Exec review' },
  { value: 'rescue', label: 'Rescue' },
  { value: 'partner', label: 'Partner' },
]

interface MeetingPrepFormProps {
  value: Partial<MeetingPrepInput>
  onChange: (value: Partial<MeetingPrepInput>) => void
  onSubmit: (input: MeetingPrepInput) => void
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

export default function MeetingPrepForm({ value, onChange, onSubmit, loading }: MeetingPrepFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const meetingType = value.meetingType ?? null
  const goalPlaceholder = meetingType ? GOAL_PLACEHOLDERS_V3[meetingType] : 'What do you want to accomplish?'

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!value.accountName || value.accountName.trim().length < 2) {
      errs.accountName = 'Required (min 2 characters)'
    }
    if (!value.meetingType) {
      errs.meetingType = 'Select a meeting type'
    }
    if (!value.goal || value.goal.trim().length < 10) {
      errs.goal = 'Required (min 10 characters)'
    }
    if (value.website && !/^https?:\/\/.+/.test(value.website)) {
      errs.website = 'Must be a valid URL'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    onSubmit({
      researchType: 'meeting_prep',
      accountName: value.accountName!.trim(),
      meetingType: value.meetingType!,
      goal: value.goal!.trim(),
      website: value.website?.trim() || undefined,
      attendees: (value.attendees ?? []).length > 0 ? value.attendees : undefined,
      context: value.context?.trim() || undefined,
      competitors: (value.competitors ?? []).length > 0 ? value.competitors : undefined,
      relationshipStage: value.relationshipStage || undefined,
      whatYoureSelling: value.whatYoureSelling?.trim() || undefined,
      desiredNextStep: value.desiredNextStep?.trim() || undefined,
      painPoints: (value.painPoints ?? []).length > 0 ? value.painPoints : undefined,
    })
  }

  const canSubmit =
    (value.accountName?.trim().length ?? 0) >= 2 &&
    !!value.meetingType &&
    (value.goal?.trim().length ?? 0) >= 10 &&
    !loading
  const meetingTypeLabel = MEETING_TYPE_OPTIONS_V3.find((opt) => opt.value === value.meetingType)?.label ?? 'Unset'

  return (
    <IntakeShell
      workflow="01 / Meeting Prep"
      title="Tell the engine what room you are walking into."
      lede="Aim the research around the account, the meeting goal, and the relationship context that changes what matters."
      estimate="~1m 45s · 8–12 sources"
      docket={[
        { label: 'Subject', value: value.accountName?.trim() || 'Unset' },
        { label: 'Offer', value: value.whatYoureSelling?.trim() || 'Unset' },
        { label: 'Lens', value: meetingTypeLabel },
        { label: 'Goal', value: value.goal?.trim() ? 'Drafted' : 'Unset' },
      ]}
      output={[
        'What changed recently',
        'People, motives, and landmines',
        'Specific talking points and questions',
      ]}
      footer={
        <>
          <div className="mono intel-sheet-note">Required: subject, goal, meeting type. Recommended: offer, website.</div>
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
          label="Who are you meeting?"
          hint="Company or person. We'll pull public profile, news, and people."
          required
          error={errors.accountName}
        >
          <input
            type="text"
            value={value.accountName ?? ''}
            onChange={(e) => onChange({ ...value, accountName: e.target.value })}
            placeholder="Anthropic"
            maxLength={200}
            disabled={loading}
            style={inputStyle}
          />
        </FormSection>

        <FormSection
          index="02"
          label="What's your goal?"
          hint="This shapes what gets prioritized. Be specific."
          required
          error={errors.goal}
        >
          <textarea
            rows={2}
            value={value.goal ?? ''}
            onChange={(e) => onChange({ ...value, goal: e.target.value })}
            placeholder={goalPlaceholder}
            maxLength={500}
            disabled={loading}
            style={textareaStyle}
          />
          <div style={{ marginTop: 8 }}>
            <AIRefineButton
              goal={value.goal ?? ''}
              meetingType={value.meetingType ?? ''}
              accountName={value.accountName ?? ''}
              onRefine={(refined) => onChange({ ...value, goal: refined })}
              disabled={loading}
            />
          </div>
        </FormSection>

        <FormSection
          index="03"
          label="What are you selling or proposing?"
          hint="Put the offer in plain words. We use this to catch offer drift in the final brief."
        >
          <input
            type="text"
            value={value.whatYoureSelling ?? ''}
            onChange={(e) => onChange({ ...value, whatYoureSelling: e.target.value })}
            placeholder="Arrow workforce solutions staffing services"
            maxLength={200}
            disabled={loading}
            style={inputStyle}
          />
        </FormSection>

        <FormSection
          index="04"
          label="Meeting type"
          hint="Adjusts the analysis lens."
          required
          error={errors.meetingType}
        >
          <ChipSelector
            options={MEETING_TYPE_OPTIONS_V3}
            value={meetingType}
            onChange={(v: MeetingTypeV3) => onChange({ ...value, meetingType: v })}
            disabled={loading}
          />
        </FormSection>

        <FormSection
          index="05"
          label="Their website"
          hint="Optional. We scrape recent content directly."
          error={errors.website}
        >
          <input
            type="url"
            value={value.website ?? ''}
            onChange={(e) => onChange({ ...value, website: e.target.value })}
            placeholder="https://anthropic.com"
            disabled={loading}
            style={inputStyle}
          />
          {!value.website?.trim() && (
            <p className="mt-2 text-xs leading-relaxed text-[var(--accent-amber)]">
              Adding a website improves company matching.
            </p>
          )}
        </FormSection>

        <FormSection index="06" label="Attendees" hint="Up to 5. We search LinkedIn + public profiles.">
          <TagInput
            value={(value.attendees ?? []).map((a) => a.name)}
            onChange={(tags) => onChange({ ...value, attendees: tags.map((name) => ({ name })) })}
            max={5}
            placeholder="Name, then Enter"
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
            <FormSection index="A1" label="Relationship stage" hint="Where are you in the arc?">
              <ChipSelector
                options={RELATIONSHIP_STAGE_OPTIONS}
                value={value.relationshipStage ?? null}
                onChange={(v: RelationshipStage) => onChange({ ...value, relationshipStage: v })}
                disabled={loading}
              />
            </FormSection>

            <FormSection index="A2" label="Desired next step">
              <input
                type="text"
                value={value.desiredNextStep ?? ''}
                onChange={(e) => onChange({ ...value, desiredNextStep: e.target.value })}
                placeholder="e.g. Schedule a pilot, get budget approval"
                maxLength={200}
                disabled={loading}
                style={inputStyle}
              />
            </FormSection>

            <FormSection index="A3" label="Key topics or context">
              <textarea
                rows={3}
                value={value.context ?? ''}
                onChange={(e) => onChange({ ...value, context: e.target.value })}
                placeholder="Anything else we should know?"
                maxLength={2000}
                disabled={loading}
                style={textareaStyle}
              />
            </FormSection>

            <FormSection index="A4" label="Pain points to explore">
              <TagInput
                value={value.painPoints ?? []}
                onChange={(tags) => onChange({ ...value, painPoints: tags })}
                max={5}
                placeholder="Type a pain point and press Enter"
                disabled={loading}
              />
            </FormSection>

            <FormSection index="A5" label="Competitors to watch">
              <TagInput
                value={value.competitors ?? []}
                onChange={(tags) => onChange({ ...value, competitors: tags })}
                max={3}
                placeholder="Type a competitor name"
                disabled={loading}
              />
            </FormSection>
          </div>
        )}
    </IntakeShell>
  )
}
