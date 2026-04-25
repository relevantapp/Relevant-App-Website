'use client'

import { AlertTriangle, ExternalLink, FileSearch2, Globe, RefreshCcw, ShieldAlert, ShieldCheck } from 'lucide-react'
import type { BriefSource, MeetingPrepBrief } from '@/lib/intelligence/contracts'
import {
  deriveMeetingPrepRequestIdentity,
  formatConfidenceLabel,
  type MeetingPrepTrustState,
} from '@/lib/intelligence/meeting-prep-identity'
import { Btn, Pill } from '../ui/primitives'
import ConfidenceBadge from './shared/ConfidenceBadge'

interface MeetingPrepTopSectionProps {
  brief: MeetingPrepBrief
  requestPayload?: unknown
  trustState: MeetingPrepTrustState
  onNewSearch: () => void
  onViewEvidence: () => void
}

const TRUST_TONE: Record<MeetingPrepTrustState['kind'], { color: string; background: string; border: string }> = {
  ready: {
    color: 'var(--accent-teal)',
    background: 'color-mix(in oklch, var(--accent-teal) 10%, transparent)',
    border: 'color-mix(in oklch, var(--accent-teal) 35%, var(--border))',
  },
  needs_review: {
    color: 'var(--accent-amber)',
    background: 'color-mix(in oklch, var(--accent-amber) 12%, transparent)',
    border: 'color-mix(in oklch, var(--accent-amber) 35%, var(--border))',
  },
  low_evidence: {
    color: 'var(--accent-amber)',
    background: 'color-mix(in oklch, var(--accent-amber) 12%, transparent)',
    border: 'color-mix(in oklch, var(--accent-amber) 35%, var(--border))',
  },
  blocked: {
    color: 'var(--accent-coral)',
    background: 'color-mix(in oklch, var(--accent-coral) 12%, transparent)',
    border: 'color-mix(in oklch, var(--accent-coral) 35%, var(--border))',
  },
  failed: {
    color: 'var(--accent-coral)',
    background: 'color-mix(in oklch, var(--accent-coral) 12%, transparent)',
    border: 'color-mix(in oklch, var(--accent-coral) 35%, var(--border))',
  },
}

function formatGeneratedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function formatPublishedAt(iso: string | null): string | null {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return null
  }
}

function formatRole(role?: string): string | null {
  if (!role) return null
  return role.replace(/_/g, ' ')
}

function trimSnippet(snippet: string | null | undefined): string | null {
  if (!snippet) return null
  const normalized = snippet.trim()
  if (!normalized) return null
  if (normalized.length <= 160) return normalized
  return `${normalized.slice(0, 160).trim().replace(/[\s,.;:!?-]+$/, '')}…`
}

function prioritizeSources(brief: MeetingPrepBrief): BriefSource[] {
  const priorityOrder = new Map((brief.trust?.mostImportantSourceIds ?? []).map((id, index) => [id, index]))
  const sourceRoleWeight: Record<string, number> = {
    primary: 40,
    fresh_news: 32,
    people: 26,
    market_data: 18,
    counter_evidence: 14,
    internal_memory: 10,
  }

  return [...brief.sources]
    .sort((left, right) => {
      const priorityDelta = (priorityOrder.has(left.id) ? priorityOrder.get(left.id)! : 99) - (priorityOrder.has(right.id) ? priorityOrder.get(right.id)! : 99)
      if (priorityDelta !== 0) return priorityDelta

      const rightWeight = (right.usedInAnswer ? 50 : 0) + (sourceRoleWeight[right.sourceRole ?? ''] ?? 0)
      const leftWeight = (left.usedInAnswer ? 50 : 0) + (sourceRoleWeight[left.sourceRole ?? ''] ?? 0)
      if (rightWeight !== leftWeight) return rightWeight - leftWeight

      return (right.publishedAt ?? '').localeCompare(left.publishedAt ?? '')
    })
    .slice(0, 3)
}

function buildTrustMessage(brief: MeetingPrepBrief, trustState: MeetingPrepTrustState, companyName: string, offer: string): string {
  const primaryReason = brief.status.reasons[0]

  if (trustState.kind === 'blocked') {
    const offerSuffix = offer !== 'Offer not provided.' ? ` and ${offer}` : ''
    return `The generated draft did not stay anchored to ${companyName}${offerSuffix}. We blocked it because it may be unsafe to use in a live meeting.`
  }

  if (trustState.kind === 'low_evidence') {
    const usedCount = brief.status.sourceCounts?.used ?? brief.status.sourceCount
    return `This brief only has ${usedCount} cited source${usedCount === 1 ? '' : 's'}. Treat it as provisional prep and validate key claims live.`
  }

  return primaryReason ?? trustState.summary
}

function buildExecutiveRead(brief: MeetingPrepBrief, trustState: MeetingPrepTrustState, companyName: string, offer: string) {
  if (trustState.kind === 'blocked') {
    return {
      bottomLine: `The generated draft is unsafe because it drifted away from ${companyName}.`,
      whyItMatters: `A wrong-company or wrong-offer brief can damage the conversation before the meeting starts. Inspect the evidence, then rerun with the target and offer kept explicit.`,
      recommendedNext: `Edit the target details, make the offer explicit${offer !== 'Offer not provided.' ? '' : ', and add the offer'}. Then rerun the brief before using any talking points.`,
      confidenceDriver: brief.status.reasons[0] ?? trustState.summary,
      copyable: undefined,
    }
  }

  return {
    bottomLine: brief.answer?.conclusion.text ?? brief.bottomLine,
    whyItMatters: brief.answer?.whyItMatters.text ?? brief.whyItMatters ?? trustState.summary,
    recommendedNext: brief.answer?.recommendedNext.text ?? 'Review the evidence and tailor your opener before the meeting.',
    confidenceDriver: brief.answer?.confidence.driver ?? brief.methodology?.confidenceDrivers[0] ?? trustState.summary,
    copyable: brief.answer?.recommendedNext.copyable,
  }
}

function IdentityField({ label, value, emphasized = false }: { label: string; value: string; emphasized?: boolean }) {
  return (
    <div className="bg-[var(--surface)] px-4 py-4">
      <p className="kicker text-[var(--text-soft)]">{label}</p>
      <p className={`mt-2 text-sm leading-relaxed ${emphasized ? 'font-medium text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>
        {value}
      </p>
    </div>
  )
}

function ExecutiveCard({ label, value, accent, action }: { label: string; value: string; accent?: string; action?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <p className="kicker" style={accent ? { color: accent } : undefined}>{label}</p>
        {action}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-[var(--text)]">{value}</p>
    </section>
  )
}

function EvidencePreviewCard({ source }: { source: BriefSource }) {
  const publishedAt = formatPublishedAt(source.publishedAt)
  const snippet = trimSnippet(source.snippet)
  const roleLabel = formatRole(source.sourceRole)

  return (
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium leading-relaxed text-[var(--text)]">{source.title}</p>
          <p className="mono mt-1 text-[10px] uppercase tracking-[0.16em] text-[var(--text-soft)]">
            {source.domain}
            {publishedAt ? ` · ${publishedAt}` : ''}
          </p>
        </div>
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[var(--border)] px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-[var(--accent)] transition-colors hover:border-[var(--accent)]"
        >
          Open
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {source.usedInAnswer && (
          <span className="rounded-full border border-[var(--accent-teal)]/35 bg-[color-mix(in_oklch,var(--accent-teal)_12%,transparent)] px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-[var(--accent-teal)]">
            Used in answer
          </span>
        )}
        {roleLabel && (
          <span className="rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-[var(--text-soft)]">
            {roleLabel}
          </span>
        )}
      </div>

      {snippet && <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">{snippet}</p>}
    </article>
  )
}

export default function MeetingPrepTopSection({
  brief,
  requestPayload,
  trustState,
  onNewSearch,
  onViewEvidence,
}: MeetingPrepTopSectionProps) {
  const identity = deriveMeetingPrepRequestIdentity(brief, requestPayload)
  const topSources = prioritizeSources(brief)
  const trustTone = TRUST_TONE[trustState.kind]
  const trustMessage = buildTrustMessage(brief, trustState, identity.companyName, identity.offer)
  const executiveRead = buildExecutiveRead(brief, trustState, identity.companyName, identity.offer)
  const generatedAt = formatGeneratedAt(brief.generatedAt)
  const showEditCompany = trustState.kind === 'blocked'
  const showEditOffer = trustState.kind === 'blocked' || identity.offer === 'Offer not provided.'
  const showAddWebsite = !identity.website

  const handleRerun = () => {
    window.dispatchEvent(new CustomEvent('intel:refresh'))
  }

  const handleCopy = async () => {
    if (!executiveRead.copyable || !navigator.clipboard?.writeText) return
    await navigator.clipboard.writeText(executiveRead.copyable)
  }

  return (
    <section className="overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[0_18px_40px_rgba(0,0,0,0.08)]">
      <div className="border-b border-[var(--border)] px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <Pill color="var(--accent-teal)" bg="color-mix(in oklch, var(--accent-teal) 10%, transparent)" border="color-mix(in oklch, var(--accent-teal) 35%, var(--border))">
                Meeting prep
              </Pill>
              <Pill>{identity.meetingTypeLabel}</Pill>
              <Pill color={trustTone.color} bg={trustTone.background} border={trustTone.border}>{trustState.label}</Pill>
            </div>
            <h1 className="mt-4 text-3xl font-medium leading-tight tracking-tight text-[var(--text)] sm:text-4xl">{identity.companyName}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--text-muted)]">
              Who this brief is about, what you are selling, and whether the result is safe to use should be obvious before any generated analysis.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Pill>Generated {generatedAt}</Pill>
            <Pill>{identity.sourceCount} source{identity.sourceCount === 1 ? '' : 's'}</Pill>
            <ConfidenceBadge level={brief.confidence} />
          </div>
        </div>
      </div>

      <div className="grid gap-px bg-[var(--border)] sm:grid-cols-2 xl:grid-cols-3">
        <IdentityField label="Selling" value={identity.offer} emphasized />
        <IdentityField label="Goal" value={identity.goal ?? 'Goal not provided.'} />
        <IdentityField label="Desired next step" value={identity.desiredNextStep ?? 'Desired next step not provided.'} />
        <IdentityField label="Website" value={identity.website ?? 'Website not provided.'} />
        <IdentityField label="Attendees" value={identity.attendees.length ? identity.attendees.join(', ') : 'No attendees provided.'} />
        <IdentityField label="Confidence" value={`${formatConfidenceLabel(brief.confidence)} · ${trustState.label}`} />
      </div>

      <div className="px-5 py-5 sm:px-6">
        <div
          className="rounded-2xl border px-4 py-4"
          style={{
            borderColor: trustTone.border,
            background: trustTone.background,
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2">
                {trustState.kind === 'ready' ? (
                  <ShieldCheck className="h-4 w-4" style={{ color: trustTone.color }} aria-hidden="true" />
                ) : trustState.kind === 'blocked' || trustState.kind === 'failed' ? (
                  <ShieldAlert className="h-4 w-4" style={{ color: trustTone.color }} aria-hidden="true" />
                ) : (
                  <AlertTriangle className="h-4 w-4" style={{ color: trustTone.color }} aria-hidden="true" />
                )}
                <p className="kicker" style={{ color: trustTone.color }}>{trustState.title}</p>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text)]">{trustMessage}</p>
              {brief.status.reasons.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {brief.status.reasons.slice(0, 3).map((reason) => (
                    <span
                      key={reason}
                      className="rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em]"
                      style={{
                        color: trustTone.color,
                        borderColor: trustTone.border,
                        background: 'transparent',
                      }}
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Btn variant="amber" size="sm" onClick={handleRerun} icon={<RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" />}>
                Rerun brief
              </Btn>
              {showEditCompany && (
                <Btn variant="ghost" size="sm" onClick={onNewSearch}>
                  Edit company
                </Btn>
              )}
              {showEditOffer && (
                <Btn variant="ghost" size="sm" onClick={onNewSearch}>
                  Edit offer
                </Btn>
              )}
              {showAddWebsite && (
                <Btn variant="ghost" size="sm" onClick={onNewSearch} icon={<Globe className="h-3.5 w-3.5" aria-hidden="true" />}>
                  Add website
                </Btn>
              )}
              <Btn variant="ghost" size="sm" onClick={onViewEvidence} icon={<FileSearch2 className="h-3.5 w-3.5" aria-hidden="true" />}>
                View evidence
              </Btn>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <ExecutiveCard label="Bottom line" value={executiveRead.bottomLine} accent="var(--accent)" />
          <ExecutiveCard label="Why it matters" value={executiveRead.whyItMatters} accent="var(--accent-amber)" />
          <ExecutiveCard
            label="Recommended next"
            value={executiveRead.recommendedNext}
            accent="var(--accent-teal)"
            action={executiveRead.copyable ? (
              <button
                type="button"
                onClick={() => void handleCopy()}
                className="rounded-full border border-[var(--border)] px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text)]"
              >
                Copy
              </button>
            ) : undefined}
          />
          <ExecutiveCard label="Confidence driver" value={executiveRead.confidenceDriver} accent="var(--accent-violet)" />
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-4">
            <div>
              <p className="kicker">Evidence preview</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                Inspect the sources most likely to support or break the meeting strategy before you use the brief.
              </p>
            </div>
            <Btn variant="ghost" size="sm" onClick={onViewEvidence}>Open evidence room</Btn>
          </div>

          <div className="px-4 py-4">
            {topSources.length > 0 ? (
              <div className="grid gap-3 xl:grid-cols-3">
                {topSources.map((source) => (
                  <EvidencePreviewCard key={source.id} source={source} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-5">
                <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                  No sources were available for this brief. Treat it as low-confidence prep only.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}