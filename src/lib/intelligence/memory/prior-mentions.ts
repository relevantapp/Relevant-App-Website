import type { SupabaseClient } from '@supabase/supabase-js'
import type { PriorMemorySummary, ResearchType } from '../contracts'
import { canonicalEntityName } from './entities'

const EMPTY_PRIOR_MEMORY: PriorMemorySummary = {
  hasPriorCoverage: false,
  totalMentions: 0,
  lastMentionedAt: null,
  lastKnownTakeaway: null,
  changedSinceThen: [],
  recurringThemes: [],
  staleAssumptions: [],
}

export async function getPriorMentions(args: {
  supabase: SupabaseClient
  userId: string
  entity: string
  researchType?: ResearchType
  limit?: number
}): Promise<PriorMemorySummary> {
  const entity = canonicalEntityName(args.entity)
  if (!entity) return EMPTY_PRIOR_MEMORY

  try {
    let query = args.supabase
      .from('intelligence_briefs')
      .select('created_at, synthesis, research_type')
      .eq('user_id', args.userId)
      .order('created_at', { ascending: false })
      .limit(args.limit ?? 10)

    if (args.researchType) query = query.eq('research_type', args.researchType)

    const { data, error } = await query
    if (error || !data?.length) return EMPTY_PRIOR_MEMORY

    const matches = data.filter((row: Record<string, unknown>) => {
      const haystack = JSON.stringify(row.synthesis ?? {}).toLowerCase()
      return haystack.includes(entity)
    })

    if (!matches.length) return EMPTY_PRIOR_MEMORY

    const latest = matches[0] as Record<string, unknown>
    const synthesis = latest.synthesis as Record<string, unknown> | null
    return {
      hasPriorCoverage: true,
      totalMentions: matches.length,
      lastMentionedAt: latest.created_at as string,
      lastKnownTakeaway: (synthesis?.bottomLine as string | undefined) ?? (synthesis?.headline as string | undefined) ?? null,
      changedSinceThen: [],
      recurringThemes: [],
      staleAssumptions: [],
    }
  } catch (err) {
    console.warn('[intel:memory] prior mentions unavailable:', err)
    return EMPTY_PRIOR_MEMORY
  }
}

export { EMPTY_PRIOR_MEMORY }
