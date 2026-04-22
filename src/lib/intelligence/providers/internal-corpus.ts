import type { SupabaseClient } from '@supabase/supabase-js'
import type { EvidenceItem, ResearchType, SourceRole } from '../contracts'

const INTERNAL_TIMEOUT_MS = 2_000

type ProviderEventSink = (event: { provider: 'internal'; kind: string; details?: Record<string, unknown> }) => void

interface InternalCorpusOptions {
  supabase: SupabaseClient
  userId?: string
  emitEvent?: ProviderEventSink
}

interface SearchOptions {
  queries?: string[]
  entities?: string[]
  topicKeys?: string[]
  freshnessDays?: number
  limit?: number
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function rowId(row: Record<string, unknown>): string {
  return asText(row.id) || asText(row.article_id) || asText(row.signal_id) || crypto.randomUUID()
}

function domainFrom(url: string | null): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
}

function includesAny(row: Record<string, unknown>, terms: string[]): boolean {
  if (!terms.length) return true
  const haystack = JSON.stringify(row).toLowerCase()
  return terms.some((term) => haystack.includes(term.toLowerCase()))
}

function extractFacts(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 30)
    .slice(0, 3)
}

function toEvidenceItem(args: {
  table: string
  row: Record<string, unknown>
  laneId: string
  sourceRole?: SourceRole
}): EvidenceItem {
  const url = asText(args.row.url) || asText(args.row.canonical_url) || asText(args.row.source_url) || null
  const title = asText(args.row.title) || asText(args.row.headline) || asText(args.row.name) || args.table
  const excerpt = (
    asText(args.row.delta_summary) ||
    asText(args.row.summary) ||
    asText(args.row.description) ||
    asText(args.row.excerpt) ||
    asText(args.row.content) ||
    asText(args.row.raw_content) ||
    title
  ).slice(0, 1600)
  const id = rowId(args.row)

  return {
    id: `internal:${args.table}:${id}`,
    sourceId: `internal:${args.table}:${id}`,
    provider: 'internal',
    laneId: args.laneId,
    sourceRole: args.sourceRole ?? 'internal_memory',
    title,
    url,
    domain: domainFrom(url),
    publishedAt: asText(args.row.published_at) || asText(args.row.updated_at) || asText(args.row.created_at) || null,
    capturedAt: new Date().toISOString(),
    excerpt,
    facts: extractFacts(excerpt),
    entities: [],
    topicKeys: [],
    quality: {
      authority: 0.75,
      freshness: 0.7,
      relevance: 0.7,
      independence: 0.7,
      primarySource: false,
    },
    payload: {
      table: args.table,
      source_id: args.row.source_id ?? null,
      endpoint_id: args.row.endpoint_id ?? null,
      supply_lane: args.row.supply_lane ?? args.row.lane ?? null,
      row_id: id,
    },
  }
}

async function withTimeout<T>(promise: PromiseLike<T>, fallback: T): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<T>((resolve) => {
        timeout = setTimeout(() => resolve(fallback), INTERNAL_TIMEOUT_MS)
      }),
    ])
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}

export class InternalCorpusProvider {
  constructor(private readonly options: InternalCorpusOptions) {}

  private degraded(kind: string, details?: Record<string, unknown>): EvidenceItem[] {
    this.options.emitEvent?.({ provider: 'internal', kind, details })
    return []
  }

  async searchArticles(options: SearchOptions): Promise<EvidenceItem[]> {
    try {
      const terms = [...(options.queries ?? []), ...(options.entities ?? [])].filter(Boolean)
      const { data, error } = await withTimeout(
        this.options.supabase
          .from('pro_articles')
          .select('*')
          .order('published_at', { ascending: false })
          .limit(Math.max((options.limit ?? 8) * 3, 12)),
        { data: [], error: null } as any,
      )
      if (error) return this.degraded('degraded_internal', { table: 'pro_articles', error: error.message })

      return ((data ?? []) as Record<string, unknown>[])
        .filter((row) => includesAny(row, terms))
        .slice(0, options.limit ?? 8)
        .map((row) => toEvidenceItem({ table: 'pro_articles', row, laneId: 'internal_memory' }))
    } catch (err) {
      return this.degraded('degraded_internal', { table: 'pro_articles', error: String(err) })
    }
  }

  async searchLivingSignals(options: SearchOptions): Promise<EvidenceItem[]> {
    try {
      const terms = [...(options.entities ?? []), ...(options.topicKeys ?? [])].filter(Boolean)
      let query = this.options.supabase
        .from('signal_items')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(Math.max((options.limit ?? 8) * 3, 12))

      if (this.options.userId) query = query.eq('user_id', this.options.userId)

      const { data, error } = await withTimeout(query, { data: [], error: null } as any)
      if (error) return this.degraded('degraded_internal', { table: 'signal_items', error: error.message })

      return ((data ?? []) as Record<string, unknown>[])
        .filter((row) => includesAny(row, terms))
        .slice(0, options.limit ?? 8)
        .map((row) => toEvidenceItem({ table: 'signal_items', row, laneId: 'internal_memory' }))
    } catch (err) {
      return this.degraded('degraded_internal', { table: 'signal_items', error: String(err) })
    }
  }

  async searchEntityDossier(entity: string, limit = 8): Promise<EvidenceItem[]> {
    try {
      const { data, error } = await withTimeout(
        this.options.supabase.rpc('search_entity_dossier_evidence', {
          query: entity,
          match_count: limit,
        }),
        { data: [], error: null } as any,
      )
      if (error) return this.degraded('degraded_internal', { rpc: 'search_entity_dossier_evidence', error: error.message })

      return ((data ?? []) as Record<string, unknown>[])
        .slice(0, limit)
        .map((row) => toEvidenceItem({ table: 'pro_entity_research_index', row, laneId: 'internal_memory' }))
    } catch (err) {
      return this.degraded('degraded_internal', { rpc: 'search_entity_dossier_evidence', error: String(err) })
    }
  }

  async searchPriorBriefs(options: {
    entity: string
    researchType?: ResearchType
    since?: string
    limit?: number
  }): Promise<EvidenceItem[]> {
    if (!this.options.userId) return []

    try {
      let query = this.options.supabase
        .from('intelligence_briefs')
        .select('id, created_at, research_type, synthesis, sources')
        .eq('user_id', this.options.userId)
        .order('created_at', { ascending: false })
        .limit(options.limit ?? 8)

      if (options.researchType) query = query.eq('research_type', options.researchType)
      if (options.since) query = query.gte('created_at', options.since)

      const { data, error } = await withTimeout(query, { data: [], error: null } as any)
      if (error) return this.degraded('degraded_internal', { table: 'intelligence_briefs', error: error.message })

      return ((data ?? []) as Record<string, unknown>[])
        .filter((row) => includesAny(row, [options.entity]))
        .map((row) => toEvidenceItem({ table: 'intelligence_briefs', row, laneId: 'internal_memory' }))
    } catch (err) {
      return this.degraded('degraded_internal', { table: 'intelligence_briefs', error: String(err) })
    }
  }
}
