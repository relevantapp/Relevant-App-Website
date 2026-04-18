'use client'

import { useState } from 'react'
import FormSection from './shared/FormSection'
import ChipSelector from './shared/ChipSelector'
import TagInput from './shared/TagInput'
import AIRefineButton from './shared/AIRefineButton'
import { MEETING_TYPE_OPTIONS_V3, GOAL_PLACEHOLDERS_V3 } from '../constants'
import type { MeetingPrepInput, MeetingTypeV3, RelationshipStage } from '../types'

const RELATIONSHIP_STAGE_OPTIONS: Array<{ value: RelationshipStage; label: string }> = [
  { value: 'first-meeting', label: 'First Meeting' },
  { value: 'active-deal', label: 'Active Deal' },
  { value: 'renewal', label: 'Renewal' },
  { value: 'exec-review', label: 'Exec Review' },
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

export default function MeetingPrepForm({ value, onChange, onSubmit, loading }: MeetingPrepFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

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

  return (
    <div>
      <FormSection label="Who are you meeting?" required error={errors.accountName}>
        <input
          type="text"
          value={value.accountName ?? ''}
          onChange={(e) => onChange({ ...value, accountName: e.target.value })}
          placeholder="Company or person name"
          maxLength={200}
          disabled={loading}
          style={inputStyle}
        />
      </FormSection>

      <FormSection label="Meeting type" required error={errors.meetingType}>
        <ChipSelector
          options={MEETING_TYPE_OPTIONS_V3}
          value={meetingType}
          onChange={(v: MeetingTypeV3) => onChange({ ...value, meetingType: v })}
          disabled={loading}
        />
      </FormSection>

      <FormSection label="Relationship stage">
        <ChipSelector
          options={RELATIONSHIP_STAGE_OPTIONS}
          value={value.relationshipStage ?? null}
          onChange={(v: RelationshipStage) => onChange({ ...value, relationshipStage: v })}
          disabled={loading}
        />
      </FormSection>

      <FormSection label="What are you selling?">
        <input
          type="text"
          value={value.whatYoureSelling ?? ''}
          onChange={(e) => onChange({ ...value, whatYoureSelling: e.target.value })}
          placeholder="e.g., Enterprise SaaS platform, consulting retainer"
          maxLength={200}
          disabled={loading}
          style={inputStyle}
        />
      </FormSection>

      <FormSection label="Desired next step">
        <input
          type="text"
          value={value.desiredNextStep ?? ''}
          onChange={(e) => onChange({ ...value, desiredNextStep: e.target.value })}
          placeholder="e.g., Schedule a pilot, get budget approval"
          maxLength={200}
          disabled={loading}
          style={inputStyle}
        />
      </FormSection>

      <FormSection label="What's your goal?" required error={errors.goal}>
        <textarea
          rows={2}
          value={value.goal ?? ''}
          onChange={(e) => onChange({ ...value, goal: e.target.value })}
          placeholder={goalPlaceholder}
          maxLength={500}
          disabled={loading}
          style={textareaStyle}
        />
        <AIRefineButton
          goal={value.goal ?? ''}
          meetingType={value.meetingType ?? ''}
          accountName={value.accountName ?? ''}
          onRefine={(refined) => onChange({ ...value, goal: refined })}
          disabled={loading}
        />
      </FormSection>

      <FormSection label="Their website" error={errors.website}>
        <input
          type="url"
          value={value.website ?? ''}
          onChange={(e) => onChange({ ...value, website: e.target.value })}
          placeholder="https://..."
          disabled={loading}
          style={inputStyle}
        />
      </FormSection>

      <FormSection label="Attendees">
        <TagInput
          value={(value.attendees ?? []).map((a) => a.name)}
          onChange={(tags) =>
            onChange({ ...value, attendees: tags.map((name) => ({ name })) })
          }
          max={5}
          placeholder="Type a name and press Enter"
          disabled={loading}
        />
      </FormSection>

      <FormSection label="Key topics / context">
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

      <FormSection label="Pain points to explore">
        <TagInput
          value={value.painPoints ?? []}
          onChange={(tags) => onChange({ ...value, painPoints: tags })}
          max={5}
          placeholder="Type a pain point and press Enter"
          disabled={loading}
        />
      </FormSection>

      <FormSection label="Competitors to watch">
        <TagInput
          value={value.competitors ?? []}
          onChange={(tags) => onChange({ ...value, competitors: tags })}
          max={3}
          placeholder="Type a competitor name"
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
