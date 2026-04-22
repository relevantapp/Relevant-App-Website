import type { SupabaseClient } from '@supabase/supabase-js'
import type { EvidenceItem, EvidencePack, ResearchDepth, ResearchIntentPacket, ResearchType } from '../contracts'

const MAX_RUN_JSON_BYTES = 256 * 1024

function isRunStoreEnabledByConfig(): boolean {
  const explicit = process.env.INTELLIGENCE_RUN_STORE_ENABLED
  if (explicit === '1' || explicit?.toLowerCase() === 'true') return true
  if (explicit === '0' || explicit?.toLowerCase() === 'false') return false
  return process.env.NODE_ENV !== 'production'
}

let runStoreState: 'unknown' | 'available' | 'unavailable' = isRunStoreEnabledByConfig() ? 'unknown' : 'unavailable'
let runStoreUnavailableReason: string | null = isRunStoreEnabledByConfig()
  ? null
  : 'Run-store integration disabled by configuration'

function trimJson<T>(value: T): T {
  const raw = JSON.stringify(value)
  if (raw.length <= MAX_RUN_JSON_BYTES) return value
  return { __truncated__: true, bytes: raw.length } as T
}

function safeLog(label: string, error: unknown): void {
  console.warn(`[intel:runs] ${label}:`, error)
}

function extractErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message
  }
  return String(error)
}

function isRunStoreUnavailableError(error: unknown): boolean {
  const message = extractErrorMessage(error).toLowerCase()
  return (
    message.includes("could not find the table 'public.intelligence_runs'") ||
    message.includes('relation "intelligence_runs" does not exist') ||
    message.includes('relation "intelligence_evidence_items" does not exist') ||
    message.includes('relation "intelligence_provider_events" does not exist') ||
    message.includes('relation "intelligence_claims" does not exist') ||
    message.includes('relation "intelligence_cache" does not exist')
  )
}

function markRunStoreUnavailable(error: unknown): void {
  const reason = extractErrorMessage(error)
  if (runStoreState === 'unavailable' && runStoreUnavailableReason === reason) return

  runStoreState = 'unavailable'
  runStoreUnavailableReason = reason
  console.warn('[intel:runs] disabling run-store integration:', reason)
}

function markRunStoreAvailable(): void {
  runStoreState = 'available'
  runStoreUnavailableReason = null
}

export async function createRun(args: {
  supabase: SupabaseClient
  userId: string
  researchType: ResearchType
  depth?: ResearchDepth
  intentPacket?: ResearchIntentPacket
}): Promise<string> {
  const id = args.intentPacket?.runId ?? crypto.randomUUID()
  if (runStoreState === 'unavailable') return id

  try {
    const { error } = await args.supabase.from('intelligence_runs').insert({
      id,
      user_id: args.userId,
      research_type: args.researchType,
      depth: args.depth ?? args.intentPacket?.depth ?? 'standard',
      intent_packet: args.intentPacket ?? { runId: id, researchType: args.researchType },
      status: 'ok',
      plan_version: 'v2',
    })
    if (error) {
      if (isRunStoreUnavailableError(error.message)) {
        markRunStoreUnavailable(error.message)
        return id
      }
      safeLog('createRun failed', error.message)
      return id
    }
    markRunStoreAvailable()
  } catch (err) {
    if (isRunStoreUnavailableError(err)) {
      markRunStoreUnavailable(err)
      return id
    }
    safeLog('createRun unavailable', err)
  }
  return id
}

export async function patchRun(args: {
  supabase: SupabaseClient
  runId: string
  fields: Record<string, unknown>
}): Promise<void> {
  if (runStoreState === 'unavailable') return

  try {
    const { error } = await args.supabase
      .from('intelligence_runs')
      .update(trimJson(args.fields))
      .eq('id', args.runId)
    if (error) {
      if (isRunStoreUnavailableError(error.message)) {
        markRunStoreUnavailable(error.message)
        return
      }
      safeLog('patchRun failed', error.message)
      return
    }
    markRunStoreAvailable()
  } catch (err) {
    if (isRunStoreUnavailableError(err)) {
      markRunStoreUnavailable(err)
      return
    }
    safeLog('patchRun unavailable', err)
  }
}

export function patchRunAsync(args: {
  supabase: SupabaseClient
  runId: string
  fields: Record<string, unknown>
}): void {
  void patchRun(args)
}

export async function recordRetrievalTask(args: {
  supabase: SupabaseClient
  runId: string
  laneId: string
  provider: string
  request: Record<string, unknown>
  responseSummary?: Record<string, unknown>
  resultCount?: number
  latencyMs?: number
  error?: string
}): Promise<void> {
  if (runStoreState === 'unavailable') return

  try {
    const { error } = await args.supabase.from('intelligence_retrieval_tasks').insert({
      id: crypto.randomUUID(),
      run_id: args.runId,
      lane_id: args.laneId,
      provider: args.provider,
      request: args.request,
      response_summary: args.responseSummary ?? null,
      result_count: args.resultCount ?? null,
      latency_ms: args.latencyMs ?? null,
      error: args.error ?? null,
    })
    if (error) {
      if (isRunStoreUnavailableError(error.message)) {
        markRunStoreUnavailable(error.message)
        return
      }
      safeLog('recordRetrievalTask failed', error.message)
    }
  } catch (err) {
    if (isRunStoreUnavailableError(err)) {
      markRunStoreUnavailable(err)
      return
    }
    safeLog('recordRetrievalTask unavailable', err)
  }
}

export async function recordEvidence(args: {
  supabase: SupabaseClient
  runId: string
  evidence: EvidenceItem[]
}): Promise<void> {
  if (runStoreState === 'unavailable') return
  if (!args.evidence.length) return
  try {
    const { error } = await args.supabase.from('intelligence_evidence_items').insert(
      args.evidence.map((item) => ({
        id: crypto.randomUUID(),
        run_id: args.runId,
        source_id: item.sourceId,
        payload: trimJson(item),
      })),
    )
    if (error) {
      if (isRunStoreUnavailableError(error.message)) {
        markRunStoreUnavailable(error.message)
        return
      }
      safeLog('recordEvidence failed', error.message)
    }
  } catch (err) {
    if (isRunStoreUnavailableError(err)) {
      markRunStoreUnavailable(err)
      return
    }
    safeLog('recordEvidence unavailable', err)
  }
}

export async function recordEvidencePack(args: {
  supabase: SupabaseClient
  runId: string
  pack: EvidencePack
}): Promise<void> {
  await Promise.all([
    patchRun({
      supabase: args.supabase,
      runId: args.runId,
      fields: {
        evidence_pack: trimJson({
          ...args.pack,
          evidence: args.pack.evidence.map((item) => ({ ...item, excerpt: item.excerpt.slice(0, 1200) })),
        }),
      },
    }),
    recordEvidence({ supabase: args.supabase, runId: args.runId, evidence: args.pack.evidence }),
  ])
}

export async function recordClaimMap(args: {
  supabase: SupabaseClient
  runId: string
  claims: Array<{ claim: string; supported: boolean; sourceIds: string[] }>
}): Promise<void> {
  if (runStoreState === 'unavailable') return

  try {
    const { error } = await args.supabase.from('intelligence_claims').insert(
      args.claims.map((claim) => ({
        id: crypto.randomUUID(),
        run_id: args.runId,
        claim: claim.claim,
        supported: claim.supported,
        source_ids: claim.sourceIds,
      })),
    )
    if (error) {
      if (isRunStoreUnavailableError(error.message)) {
        markRunStoreUnavailable(error.message)
        return
      }
      safeLog('recordClaimMap failed', error.message)
      return
    }
    await patchRun({
      supabase: args.supabase,
      runId: args.runId,
      fields: { claim_map: args.claims },
    })
  } catch (err) {
    if (isRunStoreUnavailableError(err)) {
      markRunStoreUnavailable(err)
      return
    }
    safeLog('recordClaimMap unavailable', err)
  }
}

export async function recordProviderEvent(args: {
  supabase: SupabaseClient
  runId: string
  provider: string
  kind: string
  details?: Record<string, unknown>
}): Promise<void> {
  if (runStoreState === 'unavailable') return

  try {
    const { error } = await args.supabase.from('intelligence_provider_events').insert({
      id: crypto.randomUUID(),
      run_id: args.runId,
      provider: args.provider,
      kind: args.kind,
      details: args.details ?? {},
    })
    if (error) {
      if (isRunStoreUnavailableError(error.message)) {
        markRunStoreUnavailable(error.message)
        return
      }
      safeLog('recordProviderEvent failed', error.message)
    }
  } catch (err) {
    if (isRunStoreUnavailableError(err)) {
      markRunStoreUnavailable(err)
      return
    }
    safeLog('recordProviderEvent unavailable', err)
  }
}
