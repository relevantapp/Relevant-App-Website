import { z } from 'zod'
import type { ResearchIntentPacket, ResearchPlanV2, UserLens } from '../contracts'
import { DEFAULT_MODEL_PREFERENCE } from '../models'
import { callOpenRouterPrompt } from '../openrouter'
import { intelligenceFlags } from '../feature-flags'
import { buildFallbackPlanV2 } from './fallbacks'
import { PLANNER_V2_SYSTEM_PROMPT } from './prompts'

const LaneSchema = z.object({
  id: z.string().min(1).max(60),
  purpose: z.string().min(1).max(300),
  providerPreference: z.array(z.enum(['internal', 'exa', 'tavily', 'perplexity', 'proxycurl', 'reddit', 'youtube'])).min(1),
  sourceRole: z.enum(['internal_memory', 'primary', 'fresh_news', 'financial', 'people', 'customer_voice', 'market_data', 'counter_evidence', 'gap_fill']),
  questions: z.array(z.string().min(1).max(220)).min(1).max(6),
  queryTemplates: z.array(z.string().min(1).max(260)).min(1).max(6),
  freshnessDays: z.number().int().min(1).max(3650).optional(),
  required: z.boolean(),
  budget: z.object({
    maxQueries: z.number().int().min(1).max(8),
    maxResults: z.number().int().min(1).max(20),
    maxContentChars: z.number().int().min(1000).max(100000),
  }),
})

const PlanSchema = z.object({
  intentSummary: z.string().min(1).max(600),
  lanes: z.array(LaneSchema).min(2).max(10),
  expectedSourceMix: z.object({
    internal: z.number().int().min(0).max(40),
    primary: z.number().int().min(0).max(40),
    freshWeb: z.number().int().min(0).max(40),
    semanticWeb: z.number().int().min(0).max(40),
    counterEvidence: z.number().int().min(0).max(20),
  }),
  stopRules: z.object({
    enoughEvidenceScore: z.number().min(0).max(1),
    maxExternalSearches: z.number().int().min(0).max(40),
    maxProviderMs: z.number().int().min(1000).max(300000),
  }),
})

function cleanJson(raw: string): string {
  const value = raw.trim()
  if (!value.startsWith('```')) return value
  return value.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
}

function normalizePlan(plan: ResearchPlanV2): ResearchPlanV2 {
  const seen = new Set<string>()
  const lanes = plan.lanes.filter((lane) => {
    const key = `${lane.sourceRole}:${lane.id}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return {
    ...plan,
    lanes,
    stopRules: {
      ...plan.stopRules,
      maxProviderMs: Math.min(plan.stopRules.maxProviderMs, plan.lanes.length > 6 ? 180_000 : 75_000),
    },
  }
}

export async function planLanes(args: {
  intent: ResearchIntentPacket
  userLens: UserLens
  signal?: AbortSignal
  preferredModel?: string
}): Promise<ResearchPlanV2> {
  const fallback = buildFallbackPlanV2(args.intent)
  if (!intelligenceFlags.plannerV2() || !process.env.OPENROUTER_API_KEY) return fallback

  try {
    const response = await callOpenRouterPrompt(
      PLANNER_V2_SYSTEM_PROMPT,
      JSON.stringify({ intent: args.intent, userLens: args.userLens, fallback }, null, 2),
      args.preferredModel ?? DEFAULT_MODEL_PREFERENCE,
      args.signal ?? new AbortController().signal,
      {
        maxTokens: 4096,
        temperature: 0.1,
        responseFormat: { type: 'json_object' },
        reasoning: { effort: 'medium', exclude: true },
      },
    )

    const parsed = PlanSchema.safeParse(JSON.parse(cleanJson(response.content)))
    if (!parsed.success) return fallback

    return normalizePlan({ ...parsed.data, planId: crypto.randomUUID() })
  } catch (err) {
    console.warn('[intel:planner:v2] Falling back to deterministic lanes:', err)
    return fallback
  }
}
