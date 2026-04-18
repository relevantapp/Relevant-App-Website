/* ── Intelligence Briefs DB operations ───────────────────── */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { IntelligenceBrief } from './contracts'

export interface SavedBrief {
  id: string
  user_id: string
  research_type: string
  request_payload: Record<string, unknown>
  synthesis: Record<string, unknown>
  sources: Record<string, unknown>[]
  evidence_count: number
  confidence: string | null
  is_degraded: boolean
  is_shared: boolean
  share_slug: string | null
  created_at: string
  updated_at: string
}

export interface BriefListItem {
  id: string
  research_type: string
  confidence: string | null
  is_degraded: boolean
  created_at: string
  headline: string
  is_shared: boolean
  share_slug: string | null
}

function generateShareSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let slug = ''
  const arr = new Uint8Array(8)
  crypto.getRandomValues(arr)
  for (let i = 0; i < arr.length; i++) {
    slug += chars[arr[i] % chars.length]
  }
  return slug
}

export async function saveBrief(
  supabase: SupabaseClient,
  userId: string,
  researchType: string,
  requestPayload: Record<string, unknown>,
  brief: IntelligenceBrief,
): Promise<{ id: string; error: string | null }> {
  const { data, error } = await supabase
    .from('intelligence_briefs')
    .insert({
      user_id: userId,
      research_type: researchType,
      request_payload: requestPayload,
      synthesis: brief,
      sources: brief.sources,
      evidence_count: brief.sources.length,
      confidence: brief.confidence,
      is_degraded: brief.status.degraded,
      degraded_reasons: brief.status.reasons,
      search_ms: brief.status.exaSearchMs + brief.status.tavilySearchMs,
      synthesis_ms: brief.status.synthesisMs,
      total_ms: brief.status.totalMs,
      synthesis_model: brief.status.synthesisModel,
    })
    .select('id')
    .single()

  if (error) return { id: '', error: error.message }
  return { id: data.id, error: null }
}

export async function listBriefs(
  supabase: SupabaseClient,
  userId: string,
  limit = 50,
  offset = 0,
): Promise<{ data: BriefListItem[]; error: string | null }> {
  const { data, error } = await supabase
    .from('intelligence_briefs')
    .select('id, research_type, confidence, is_degraded, created_at, synthesis, is_shared, share_slug')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return { data: [], error: error.message }

  const items: BriefListItem[] = (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    research_type: row.research_type as string,
    confidence: row.confidence as string | null,
    is_degraded: row.is_degraded as boolean,
    created_at: row.created_at as string,
    headline: (row.synthesis as Record<string, unknown>)?.headline as string ?? 'Untitled',
    is_shared: row.is_shared as boolean,
    share_slug: row.share_slug as string | null,
  }))

  return { data: items, error: null }
}

export async function getBrief(
  supabase: SupabaseClient,
  briefId: string,
): Promise<{ data: SavedBrief | null; error: string | null }> {
  const { data, error } = await supabase
    .from('intelligence_briefs')
    .select('*')
    .eq('id', briefId)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as SavedBrief, error: null }
}

export async function getBriefBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<{ data: SavedBrief | null; error: string | null }> {
  const { data, error } = await supabase
    .from('intelligence_briefs')
    .select('*')
    .eq('share_slug', slug)
    .eq('is_shared', true)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as SavedBrief, error: null }
}

export async function toggleShare(
  supabase: SupabaseClient,
  briefId: string,
  userId: string,
  share: boolean,
): Promise<{ slug: string | null; error: string | null }> {
  if (share) {
    const slug = generateShareSlug()
    const { error } = await supabase
      .from('intelligence_briefs')
      .update({ is_shared: true, shared_at: new Date().toISOString(), share_slug: slug })
      .eq('id', briefId)
      .eq('user_id', userId)

    if (error) return { slug: null, error: error.message }
    return { slug, error: null }
  }

  const { error } = await supabase
    .from('intelligence_briefs')
    .update({ is_shared: false, shared_at: null, share_slug: null })
    .eq('id', briefId)
    .eq('user_id', userId)

  if (error) return { slug: null, error: error.message }
  return { slug: null, error: null }
}
