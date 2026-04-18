/* ── Pipeline Framework — Step-level execution with timing + logging ── */

import { z, type ZodSchema } from 'zod'
import type { SSEEmitter } from './sse-emitter'

/* ── Step context (passed through pipeline) ────────────────── */

export interface PipelineContext {
  emitter?: SSEEmitter
  signal?: AbortSignal
}

/* ── Step result ───────────────────────────────────────────── */

export interface StepResult<T> {
  ok: boolean
  data: T | null
  error: string | null
  timings: { startMs: number; endMs: number; durationMs: number }
}

export type StepName = 'resolveEntity' | 'gatherEvidence' | 'rankEvidence' | 'synthesize' | 'assembleBrief'

/* ── Logging ───────────────────────────────────────────────── */

export interface StepLog {
  step: StepName
  ok: boolean
  durationMs: number
  error?: string
  meta?: Record<string, string | number | boolean>
}

const logPrefix = (researchType: string, step: StepName) =>
  `[intel:${researchType}:${step}]`

export function logStep(researchType: string, log: StepLog): void {
  const prefix = logPrefix(researchType, log.step)
  if (log.ok) {
    console.log(prefix, `OK in ${log.durationMs}ms`, log.meta ? JSON.stringify(log.meta) : '')
  } else {
    console.error(prefix, `FAIL in ${log.durationMs}ms`, log.error, log.meta ? JSON.stringify(log.meta) : '')
  }
}

const STEP_LABELS: Record<StepName, string> = {
  resolveEntity: 'Identifying company',
  gatherEvidence: 'Gathering evidence',
  rankEvidence: 'Ranking sources',
  synthesize: 'Analyzing with AI',
  assembleBrief: 'Assembling brief',
}

/* ── Step runner ───────────────────────────────────────────── */

export async function runStep<T>(
  researchType: string,
  step: StepName,
  fn: () => Promise<T>,
  meta?: Record<string, string | number | boolean>,
  ctx?: PipelineContext
): Promise<StepResult<T>> {
  ctx?.emitter?.send({ type: 'step_start', step, label: STEP_LABELS[step] || step })

  const startMs = performance.now()
  try {
    if (ctx?.signal?.aborted) throw new Error('Aborted')
    const data = await fn()
    const endMs = performance.now()
    const durationMs = Math.round(endMs - startMs)
    logStep(researchType, { step, ok: true, durationMs, meta })
    ctx?.emitter?.send({ type: 'step_done', step, summary: meta?.summary as string || `Completed in ${(durationMs / 1000).toFixed(1)}s` })
    return { ok: true, data, error: null, timings: { startMs, endMs, durationMs } }
  } catch (err) {
    const endMs = performance.now()
    const durationMs = Math.round(endMs - startMs)
    const errorMsg = err instanceof Error ? err.message : String(err)
    logStep(researchType, { step, ok: false, durationMs, error: errorMsg, meta })
    ctx?.emitter?.send({ type: 'step_error', step, reason: errorMsg })
    return { ok: false, data: null, error: errorMsg, timings: { startMs, endMs, durationMs } }
  }
}

/* ── Schema validation + repair ────────────────────────────── */

export interface ParseResult<T> {
  ok: boolean
  data: T | null
  issues: string | null
}

export function validateSchema<T>(schema: ZodSchema<T>, raw: unknown): ParseResult<T> {
  const result = schema.safeParse(raw)
  if (result.success) {
    return { ok: true, data: result.data, issues: null }
  }
  const issues = result.error.issues
    .map((i) => `${i.path.join('.')}: ${i.message}`)
    .join('; ')
  return { ok: false, data: null, issues }
}

export function generateRepairPrompt(issues: string, originalSchema: string): string {
  return `The previous output didn't match the required schema. Errors: ${issues}

Return ONLY valid JSON matching this schema exactly:
${originalSchema}

Fix all validation errors and return the corrected JSON. No markdown fences, no commentary.`
}

/* ── ID generator ──────────────────────────────────────────── */

export function generateBriefId(): string {
  return `ib_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}
