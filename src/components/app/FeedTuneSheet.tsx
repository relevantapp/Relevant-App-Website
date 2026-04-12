'use client'

import { Loader2 } from 'lucide-react'
import FeedBottomSheet from '@/components/app/FeedBottomSheet'

export type FeedTuneOption = {
  id: string
  label: string
  description: string
  active: boolean
  onSelect: () => void
}

type FeedTuneSheetProps = {
  open: boolean
  onClose: () => void
  disabled: boolean
  saving: boolean
  hasChanges: boolean
  onSave: () => void
  summaryTitle: string
  summaryText: string
  sensitivityOptions: FeedTuneOption[]
  styleOptions: FeedTuneOption[]
}

function OptionButton({
  option,
  disabled,
}: {
  option: FeedTuneOption
  disabled: boolean
}) {
  return (
    <button
      type="button"
      onClick={option.onSelect}
      disabled={disabled}
      aria-pressed={option.active}
      className={`rounded-[18px] border px-4 py-3 text-left transition-colors ${
        option.active
          ? 'border-[var(--border-strong)] bg-[var(--bg-elevated)] text-[var(--text)]'
          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text)]'
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{option.label}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">{option.description}</p>
        </div>
        <span
          className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: option.active ? 'var(--accent)' : 'var(--border-strong)' }}
        />
      </div>
    </button>
  )
}

export default function FeedTuneSheet({
  open,
  onClose,
  disabled,
  saving,
  hasChanges,
  onSave,
  summaryTitle,
  summaryText,
  sensitivityOptions,
  styleOptions,
}: FeedTuneSheetProps) {
  return (
    <FeedBottomSheet
      open={open}
      onClose={onClose}
      title="Tune feed"
      description="Adjust how broad the feed casts and how each story reads once it gets through."
      maxWidthClassName="max-w-2xl"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-[var(--text-soft)]">
            {summaryText}
          </p>
          <button
            type="button"
            onClick={onSave}
            disabled={!hasChanges || disabled}
            className="inline-flex min-w-[132px] items-center justify-center gap-2 rounded-full bg-[var(--text)] px-4 py-2.5 text-sm font-semibold text-[var(--bg)] transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : null}
            {saving ? 'Saving' : hasChanges ? 'Save changes' : 'Up to date'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <section className="rounded-[26px] border border-[var(--border-strong)] bg-[var(--bg)] px-5 py-5 sm:px-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-soft)]">
            Current blend
          </p>
          <h3 className="mt-3 font-display text-3xl font-semibold tracking-[-0.05em] text-[var(--text)]">
            {summaryTitle}
          </h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--text-muted)]">
            {summaryText}
          </p>
        </section>

        <section className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-elevated)] p-4 sm:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-soft)]">
            Story volume
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
            Control how selective the feed is before a story ever reaches you.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {sensitivityOptions.map((option) => (
              <OptionButton key={option.id} option={option} disabled={disabled} />
            ))}
          </div>
        </section>

        <section className="rounded-[24px] border border-[var(--border)] bg-[var(--bg-elevated)] p-4 sm:p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-soft)]">
            Writing style
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
            Pick how the final story should sound once it has been selected.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {styleOptions.map((option) => (
              <OptionButton key={option.id} option={option} disabled={disabled} />
            ))}
          </div>
        </section>
      </div>
    </FeedBottomSheet>
  )
}
