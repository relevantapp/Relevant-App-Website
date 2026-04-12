'use client'

import { useCallback, useRef, useState } from 'react'
import { supabase, getValidAccessToken } from '@/lib/supabase'
import type { ProBriefItem, ConsequenceStep, CanvasPayload, MediaLink, GoalPulse } from '@/types/signals'

export type DeepDiveResult = {
  success: boolean
  what_happened_deep: string[]
  why_it_matters_deep: string[]
  what_to_watch: string[]
  error?: string
}

export type ProBriefResult = {
  items: ProBriefItem[]
  hasMore: boolean
  nextCursor: string | null
  error: Error | null
  generating: boolean
}

export type EventUpdate = {
  id: string
  created_at: string
  headline: string | null
  delta_summary: string | null
  sourceCount: number
}

type SignalItemRow = Record<string, unknown>

const SIGNAL_ITEMS_SELECT =
  'event_id, headline, what_happened, why_it_matters, why_showing, synthesis, sources, consequence_steps, image_url, published_at, what_to_watch, canvas, created_at, updated_at, signal_date, source_count, update_count, story_started_at, delta_summary, source_extracts, media_links, thread_name, trajectory, is_developing'

const DEFAULT_FEED_PAGE_SIZE = 30

const HTML_ENTITY_MAP: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  ndash: '–', mdash: '—', hellip: '…', lsquo: '\u2018', rsquo: '\u2019', ldquo: '\u201C', rdquo: '\u201D',
}

function decodeHtmlEntities(value: string): string {
  if (!value || !value.includes('&')) return value
  return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (entity, token: string) => {
    const normalized = token.toLowerCase()
    if (normalized.startsWith('#x')) {
      const cp = Number.parseInt(normalized.slice(2), 16)
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : entity
    }
    if (normalized.startsWith('#')) {
      const cp = Number.parseInt(normalized.slice(1), 10)
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : entity
    }
    return HTML_ENTITY_MAP[normalized] ?? entity
  })
}

function decodeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? decodeHtmlEntities(value) : fallback
}

function decodeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((e): e is string => typeof e === 'string').map(decodeHtmlEntities)
}

function decodeSources(value: unknown): { url: string; label: string }[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((e): e is Record<string, unknown> => !!e && typeof e === 'object')
    .map((e) => ({ url: decodeString(e.url, ''), label: decodeString(e.label, 'Source') }))
}

function deriveDeltaSummary(rowDelta: unknown, briefItem: Record<string, unknown> | null): string | null {
  if (typeof rowDelta === 'string' && rowDelta.trim().length > 0) {
    return decodeHtmlEntities(rowDelta)
  }
  const firstWhatHappened =
    briefItem && Array.isArray(briefItem.what_happened)
      ? briefItem.what_happened.find((entry) => typeof entry === 'string')
      : null
  if (typeof firstWhatHappened !== 'string') return null
  const trimmed = firstWhatHappened.trim()
  if (!trimmed) return null
  return trimmed.toLowerCase().startsWith('update:')
    ? decodeHtmlEntities(trimmed.slice('update:'.length).trim())
    : null
}

function mapRows(rows: SignalItemRow[]): { items: ProBriefItem[]; nextCursor: string | null } {
  const seen = new Set<string>()
  const items: ProBriefItem[] = []

  for (const row of rows) {
    const eventId = typeof row.event_id === 'string' ? row.event_id : null
    const headline = typeof row.headline === 'string' ? row.headline : null
    if (!eventId || !headline || seen.has(eventId)) continue
    seen.add(eventId)

    items.push({
      id: eventId,
      headline: decodeHtmlEntities(headline),
      what_happened: decodeStringArray(row.what_happened),
      why_it_matters: decodeStringArray(row.why_it_matters),
      why_showing: decodeString(row.why_showing),
      synthesis: typeof row.synthesis === 'string' ? decodeHtmlEntities(row.synthesis) : null,
      sources: decodeSources(row.sources),
      consequence_steps: Array.isArray(row.consequence_steps) ? (row.consequence_steps as ConsequenceStep[]) : [],
      imageUrl: typeof row.image_url === 'string' ? row.image_url : null,
      publishedAt: typeof row.published_at === 'string' ? row.published_at : null,
      signalDate: typeof row.signal_date === 'string' ? row.signal_date : null,
      deliveredAt: typeof row.created_at === 'string' ? row.created_at : null,
      updatedAt: typeof row.updated_at === 'string' ? row.updated_at : null,
      what_to_watch: decodeStringArray(row.what_to_watch),
      canvas: row.canvas as CanvasPayload | undefined,
      sourceCount: typeof row.source_count === 'number' ? row.source_count : null,
      updateCount: typeof row.update_count === 'number' ? row.update_count : null,
      storyStartedAt: typeof row.story_started_at === 'string' ? row.story_started_at : null,
      deltaSummary: typeof row.delta_summary === 'string' ? decodeHtmlEntities(row.delta_summary) : null,
      sourceExtracts: Array.isArray(row.source_extracts) ? (row.source_extracts as ProBriefItem['sourceExtracts']) : null,
      mediaLinks: Array.isArray(row.media_links) && row.media_links.length > 0 ? (row.media_links as MediaLink[]) : null,
      threadName: typeof row.thread_name === 'string' ? row.thread_name : null,
      trajectory: typeof row.trajectory === 'string' ? row.trajectory : null,
      isDeveloping: row.is_developing === true,
    })
  }

  const lastRow = rows[rows.length - 1]
  const nextCursor = lastRow && typeof lastRow.created_at === 'string' ? (lastRow.created_at as string) : null
  return { items, nextCursor }
}

export function useProBrief() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const requestIdRef = useRef(0)

  const fetchProBrief = useCallback(async (maxItems?: number): Promise<ProBriefResult> => {
    const reqId = ++requestIdRef.current
    setIsLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.id) {
        const err = new Error('Authentication required')
        if (reqId === requestIdRef.current) setError(err)
        return { items: [], hasMore: false, nextCursor: null, error: err, generating: false }
      }

      const pageSize = Math.max(10, Math.min(maxItems ?? DEFAULT_FEED_PAGE_SIZE, 80))
      const { data: rows, error: queryError } = await supabase
        .from('signal_items')
        .select(SIGNAL_ITEMS_SELECT)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(pageSize + 1)

      if (queryError) {
        const err = new Error(queryError.message)
        if (reqId === requestIdRef.current) setError(err)
        return { items: [], hasMore: false, nextCursor: null, error: err, generating: false }
      }

      if (!rows || rows.length === 0) {
        return { items: [], hasMore: false, nextCursor: null, error: null, generating: false }
      }

      const hasMore = rows.length > pageSize
      const pageRows = hasMore ? rows.slice(0, pageSize) : rows
      const mapped = mapRows(pageRows as SignalItemRow[])

      return { items: mapped.items, hasMore, nextCursor: mapped.nextCursor, error: null, generating: false }
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to fetch brief')
      if (reqId === requestIdRef.current) setError(err)
      return { items: [], hasMore: false, nextCursor: null, error: err, generating: false }
    } finally {
      if (reqId === requestIdRef.current) setIsLoading(false)
    }
  }, [])

  const fetchOlderSignals = useCallback(async (beforeCreatedAt: string, maxItems?: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.id) return { items: [] as ProBriefItem[], hasMore: false, nextCursor: null as string | null }

      const pageSize = Math.max(10, Math.min(maxItems ?? DEFAULT_FEED_PAGE_SIZE, 80))
      const { data: rows, error: queryError } = await supabase
        .from('signal_items')
        .select(SIGNAL_ITEMS_SELECT)
        .eq('user_id', user.id)
        .lt('created_at', beforeCreatedAt)
        .order('created_at', { ascending: false })
        .limit(pageSize + 1)

      if (queryError || !rows || rows.length === 0) return { items: [] as ProBriefItem[], hasMore: false, nextCursor: null as string | null }

      const hasMore = rows.length > pageSize
      const pageRows = hasMore ? rows.slice(0, pageSize) : rows
      const mapped = mapRows(pageRows as SignalItemRow[])
      return { items: mapped.items, hasMore, nextCursor: mapped.nextCursor }
    } catch {
      return { items: [] as ProBriefItem[], hasMore: false, nextCursor: null as string | null }
    }
  }, [])

  const fetchDeepDive = useCallback(async (item: ProBriefItem): Promise<DeepDiveResult> => {
    if (item.deep_dive) {
      return {
        success: true,
        what_happened_deep: item.deep_dive.what_happened_deep || [],
        why_it_matters_deep: item.deep_dive.why_it_matters_deep || [],
        what_to_watch: item.deep_dive.what_to_watch || [],
      }
    }

    try {
      const token = await getValidAccessToken(180)
      if (!token) return { success: false, what_happened_deep: [], why_it_matters_deep: [], what_to_watch: [], error: 'Authentication required' }

      const { data, error: invokeError } = await supabase.functions.invoke('pro-brief-generate', {
        body: {
          deep_dive: {
            headline: item.headline,
            what_happened: item.what_happened,
            why_it_matters: item.why_it_matters,
            source_urls: item.sources.map((s) => s.url),
          },
        },
        headers: { Authorization: `Bearer ${token}` },
      })

      if (invokeError) return { success: false, what_happened_deep: [], why_it_matters_deep: [], what_to_watch: [], error: invokeError.message }
      const typed = data as DeepDiveResult | null
      if (!typed?.success) return { success: false, what_happened_deep: [], why_it_matters_deep: [], what_to_watch: [], error: typed?.error || 'No content' }
      return typed
    } catch (e) {
      return { success: false, what_happened_deep: [], why_it_matters_deep: [], what_to_watch: [], error: e instanceof Error ? e.message : 'Failed' }
    }
  }, [])

  const fetchBriefItemById = useCallback(async (itemId: string): Promise<ProBriefItem | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.id) return null

      const { data: row, error: queryError } = await supabase
        .from('signal_items')
        .select(SIGNAL_ITEMS_SELECT)
        .eq('user_id', user.id)
        .eq('event_id', itemId)
        .maybeSingle()

      if (queryError || !row) return null

      const eventId = typeof row.event_id === 'string' ? row.event_id : null
      const headline = typeof row.headline === 'string' ? row.headline : null
      if (!eventId || !headline) return null

      const mapped = mapRows([row as SignalItemRow])
      return mapped.items[0] || null
    } catch {
      return null
    }
  }, [])

  const fetchEventTimeline = useCallback(async (eventId: string): Promise<EventUpdate[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.id) return []

      const { data, error: queryError } = await supabase
        .from('pro_signal_event_updates')
        .select('id, created_at, article_ids, brief_item, delta_summary')
        .eq('user_id', user.id)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (queryError || !data) return []

      return data.map((row) => {
        const briefItem = row.brief_item as Record<string, unknown> | null
        const headline = briefItem && typeof briefItem.headline === 'string'
          ? decodeHtmlEntities(briefItem.headline) : null
        const sourceCount = briefItem && Array.isArray(briefItem.sources)
          ? briefItem.sources.length
          : Array.isArray(row.article_ids)
            ? row.article_ids.length
            : 0
        return {
          id: row.id as string,
          created_at: row.created_at as string,
          headline,
          delta_summary: deriveDeltaSummary(row.delta_summary, briefItem),
          sourceCount,
        }
      })
    } catch {
      return []
    }
  }, [])

  const subscribeToBriefUpdates = useCallback((userId: string, onUpdate: () => void) => {
    const channel = supabase
      .channel(`feed_updates_${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'signal_items',
        filter: `user_id=eq.${userId}`,
      }, () => {
        onUpdate()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return { fetchProBrief, fetchOlderSignals, fetchDeepDive, fetchBriefItemById, fetchEventTimeline, subscribeToBriefUpdates, isLoading, error }
}
