/* ── Intelligence Frontend Types + Constants ───────────────── */

import type { MeetingType } from '@/lib/intelligence/types'

export type { IntelligenceBrief, MeetingType, BriefBullet, BriefSource, CompanySnapshot, AttendeeProfile } from '@/lib/intelligence/types'

export const MEETING_TYPE_OPTIONS: Array<{ value: MeetingType; label: string; icon: string }> = [
  { value: 'sales', label: 'Sales Call', icon: '💰' },
  { value: 'client', label: 'Client Meeting', icon: '🤝' },
  { value: 'partner', label: 'Partnership', icon: '🔗' },
  { value: 'investor', label: 'Investor Meeting', icon: '📈' },
  { value: 'board', label: 'Board Meeting', icon: '🏛️' },
  { value: 'hiring', label: 'Recruiting', icon: '👤' },
  { value: 'general', label: 'General', icon: '📋' },
]

export const LOADING_STEPS = [
  'Researching {account}...',
  'Analyzing {count} sources...',
  'Building your briefing...',
]
