import type { BriefStatus, Confidence, MeetingPrepBrief, MeetingType } from './contracts'

export interface MeetingPrepRequestContext {
  accountName: string | null
  website: string | null
  meetingType: string | null
  goal: string | null
  whatYoureSelling: string | null
  desiredNextStep: string | null
  attendees: string[]
}

export interface MeetingPrepRequestIdentity {
  companyName: string
  website: string | null
  meetingTypeLabel: string
  goal: string | null
  offer: string
  desiredNextStep: string | null
  attendees: string[]
  sourceCount: number
}

export type MeetingPrepTrustStateKind = 'ready' | 'needs_review' | 'low_evidence' | 'blocked' | 'failed'

export interface MeetingPrepTrustState {
  kind: MeetingPrepTrustStateKind
  label: string
  title: string
  summary: string
}

const MEETING_TYPE_LABELS: Record<string, string> = {
  sales: 'Sales call',
  client: 'Client meeting',
  partner: 'Partner meeting',
  investor: 'Investor meeting',
  board: 'Board meeting',
  hiring: 'Hiring meeting',
  general: 'General meeting',
  customer: 'Customer meeting',
  reseller: 'Reseller meeting',
  internal: 'Internal meeting',
  other: 'General meeting',
}

const BLOCKED_REASON_MATCHERS = [
  'drifted away from requested account',
  'drifted away from what the user is selling',
  'placeholder company',
  'unsafe synthesis drift',
]

const LOW_EVIDENCE_REASON_MATCHERS = [
  'limited evidence',
  'insufficient evidence',
  'no sources',
  'no usable',
  'incomplete coverage',
  'attendee evidence',
]

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function asAttendeeList(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  return value
    .map((entry) => {
      if (typeof entry === 'string') return asNonEmptyString(entry)
      if (entry && typeof entry === 'object' && 'name' in entry) {
        return asNonEmptyString((entry as { name?: unknown }).name)
      }
      return null
    })
    .filter((entry): entry is string => Boolean(entry))
}

function normalizeReasons(reasons: string[]): string[] {
  return reasons.map((reason) => reason.toLowerCase())
}

export function parseMeetingPrepRequestContext(payload: unknown): MeetingPrepRequestContext | null {
  if (!payload || typeof payload !== 'object') return null

  const record = payload as Record<string, unknown>
  return {
    accountName: asNonEmptyString(record.accountName),
    website: asNonEmptyString(record.website),
    meetingType: asNonEmptyString(record.meetingType),
    goal: asNonEmptyString(record.goal),
    whatYoureSelling: asNonEmptyString(record.whatYoureSelling),
    desiredNextStep: asNonEmptyString(record.desiredNextStep),
    attendees: asAttendeeList(record.attendees),
  }
}

export function formatMeetingTypeLabel(meetingType: string | null | undefined): string {
  if (!meetingType) return 'Meeting prep'
  return MEETING_TYPE_LABELS[meetingType] ?? 'Meeting prep'
}

export function deriveMeetingPrepRequestIdentity(
  brief: Pick<MeetingPrepBrief, 'snapshot' | 'status'>,
  requestPayload?: unknown,
): MeetingPrepRequestIdentity {
  const request = parseMeetingPrepRequestContext(requestPayload)
  const companyName = request?.accountName ?? brief.snapshot?.name ?? 'Company not confirmed'
  const website = request?.website ?? brief.snapshot?.website ?? null
  const attendees = request?.attendees ?? []
  const sourceCount = brief.status.sourceCounts?.used ?? brief.status.sourceCount

  return {
    companyName,
    website,
    meetingTypeLabel: formatMeetingTypeLabel(request?.meetingType),
    goal: request?.goal ?? null,
    offer: request?.whatYoureSelling ?? 'Offer not provided.',
    desiredNextStep: request?.desiredNextStep ?? null,
    attendees,
    sourceCount,
  }
}

export function mapMeetingPrepTrustState(args: {
  status: Pick<BriefStatus, 'degraded' | 'reasons' | 'sourceCount' | 'sourceCounts'>
  confidence: Confidence
}): MeetingPrepTrustState {
  const reasons = normalizeReasons(args.status.reasons)
  const sourceCount = args.status.sourceCounts?.used ?? args.status.sourceCount
  const blocked = reasons.some((reason) => BLOCKED_REASON_MATCHERS.some((matcher) => reason.includes(matcher)))
  const lowEvidence = reasons.some((reason) => LOW_EVIDENCE_REASON_MATCHERS.some((matcher) => reason.includes(matcher)))

  if (blocked) {
    return {
      kind: 'blocked',
      label: 'Blocked',
      title: 'Brief blocked',
      summary: 'The generated draft drifted away from the requested company or offer, so it should not be used as meeting prep.',
    }
  }

  if (args.status.degraded && sourceCount === 0) {
    return {
      kind: 'failed',
      label: 'Failed',
      title: 'Brief failed',
      summary: 'The run did not produce usable evidence. Treat this as a failed brief and rerun with clearer inputs.',
    }
  }

  if (lowEvidence || args.confidence === 'low' || sourceCount < 3) {
    return {
      kind: 'low_evidence',
      label: 'Low evidence',
      title: 'Low evidence',
      summary: 'The brief is based on thin support. Use it only as provisional prep and verify claims live.',
    }
  }

  if (args.status.degraded || reasons.length > 0) {
    return {
      kind: 'needs_review',
      label: 'Needs review',
      title: 'Needs review',
      summary: 'The run stayed mostly on topic, but parts of the output need a manual review before you use it in a meeting.',
    }
  }

  return {
    kind: 'ready',
    label: 'Ready',
    title: 'Brief ready',
    summary: 'The brief stayed anchored to the requested company and has enough evidence to use as meeting prep.',
  }
}

export function formatConfidenceLabel(confidence: Confidence): Capitalize<Confidence> {
  return `${confidence.charAt(0).toUpperCase()}${confidence.slice(1)}` as Capitalize<Confidence>
}

export function isMeetingType(value: string): value is MeetingType {
  return value in MEETING_TYPE_LABELS
}