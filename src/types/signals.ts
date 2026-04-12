// Types ported from React Native app — these match Supabase schema exactly

export type ProBriefSource = {
  url: string
  label: string
}

export type ConsequenceStep = {
  dimension: string
  category: string
  type: string
  weight: number
  chain: string
  fullChain: string
  articleChain?: string
  relationship?: string
  consequence_types?: string[]
  confidence?: 'grounded' | 'partially_grounded' | 'ungrounded'
  keyAssumption?: string | null
  evidenceRefs?: string[]
  uiHints?: {
    emphasis?: 'none' | 'highlight' | 'circle'
    emphasisReason?: string
    showReasoningMap?: boolean
  }
  branches?: {
    scenario: string
    likelihood: 'likely' | 'possible' | 'unlikely_but_severe'
    detail: string
  }[]
}

export type MetricShiftPayload = {
  mode: 'metric_shift'
  metric_name: string
  metric_value: string
  delta: string
  delta_direction: 'up' | 'down' | 'flat'
  unit?: string
  context?: string
}

export type TimelinePayload = {
  mode: 'timeline'
  events: {
    date: string
    event: string
    significance?: string
  }[]
}

export type CanvasPayload = MetricShiftPayload | TimelinePayload

export type MediaLink = {
  type: 'youtube_video' | 'youtube_short' | 'spotify_episode'
  url: string
  embed_url: string
  title: string
  thumbnail: string
  channel_or_show: string
  duration_seconds: number | null
  published_at: string | null
}

export type ProBriefItem = {
  id: string
  headline: string
  what_happened: string[]
  why_it_matters: string[]
  why_showing: string
  synthesis?: string | null
  sources: ProBriefSource[]
  consequence_steps?: ConsequenceStep[]
  imageUrl?: string | null
  publishedAt?: string | null
  signalDate?: string | null
  deliveredAt?: string | null
  updatedAt?: string | null
  what_to_watch?: string[]
  canvas?: CanvasPayload
  deep_dive?: {
    what_happened_deep: string[]
    why_it_matters_deep: string[]
    what_to_watch: string[]
  }
  sourceCount?: number | null
  updateCount?: number | null
  storyStartedAt?: string | null
  deltaSummary?: string | null
  sourceExtracts?: {
    quote: string
    source_name: string
    source_url: string
    published_at: string
  }[] | null
  mediaLinks?: MediaLink[] | null
  threadName?: string | null
  trajectory?: string | null
  isDeveloping?: boolean
}

export type GoalPulse = {
  goal_type: string
  week_number: number
  sections: {
    what_happened: string
    consequence: string
    action: string
  }
  referenced_signal_ids: string[]
  generated_at: string
}

export type ProfileKind = 'general' | 'executive' | 'investor' | 'operator' | 'analyst'

export type ProBriefStats = {
  cached_age_minutes: number | null
  evidence_count: number | null
  candidates_count: number | null
  selected_count: number | null
  articles_indexed_total: number | null
  articles_scanned_candidates: number | null
  articles_semantic_matched: number | null
  articles_sent_to_llm: number | null
  articles_ingested_last_24h: number | null
  dimensions_count: number | null
  signals_by_day: { day: string; signals: number }[]
  profile: {
    kind: ProfileKind
    role: string | null
    industry: string | null
    company: string | null
    country: string | null
  }
}

export type ProBrief = {
  title: string
  days: number
  generatedAt: string
  items: ProBriefItem[]
  coach_note: string | null
  goal_pulse: GoalPulse | null
  message: string | null
  cached: boolean
  generating: boolean
  stats: ProBriefStats | null
}

export type AuthUser = {
  id: string
  name: string
  email: string
}

export type AuthNotice = {
  kind: 'success' | 'info' | 'error'
  message: string
}
