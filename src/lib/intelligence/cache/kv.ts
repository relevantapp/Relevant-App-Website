import type { SupabaseClient } from '@supabase/supabase-js'
import type { IntelligenceBrief, ResearchDepth, ResearchType } from '../contracts'

export async function getCachedBrief(args: {
  supabase: SupabaseClient
  fingerprint: string
}): Promise<IntelligenceBrief | null> {
  try {
    const { data, error } = await args.supabase
      .from('intelligence_cache')
      .select('brief, expires_at')
      .eq('fingerprint', args.fingerprint)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (error || !data) return null
    return data.brief as IntelligenceBrief
  } catch {
    return null
  }
}

export async function setCachedBrief(args: {
  supabase: SupabaseClient
  fingerprint: string
  userId: string
  researchType: ResearchType
  depth: ResearchDepth
  brief: IntelligenceBrief
}): Promise<void> {
  const ttlHours = args.depth === 'fast' ? 1 : args.depth === 'deep' ? 24 : 6
  const expires = new Date(Date.now() + ttlHours * 3_600_000).toISOString()
  try {
    await args.supabase
      .from('intelligence_cache')
      .upsert({
        fingerprint: args.fingerprint,
        user_id: args.userId,
        research_type: args.researchType,
        depth: args.depth,
        brief: args.brief,
        expires_at: expires,
      })
  } catch {
    // Cache is opportunistic.
  }
}
