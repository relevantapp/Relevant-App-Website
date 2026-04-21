import { z } from 'zod'
import type {
  BriefSource,
  NormalizedEvidence,
  ResearchPlan,
  ResearchType,
  SearchTask,
} from './contracts'
import { callOpenRouterPrompt } from './openrouter'
import { DEFAULT_MODEL_PREFERENCE } from './models'
import type { PipelineContext } from './pipeline'
import { normalizeExaResults, normalizeExaSnapshot, normalizeTavilyResults } from './normalize'
import { searchExaQuery, searchExaSnapshot } from './providers/exa'
import { searchTavilyQuery } from './providers/tavily'

const MAX_PLANNED_SEARCHES = 10

const PlannedSearchSchema = z.object({
  provider: z.enum(['exa', 'tavily']),
  type: z.enum(['snapshot', 'news', 'person', 'competitor', 'tavily_news']),
  query: z.string().min(3).max(220),
  purpose: z.string().max(220).optional(),
  lookbackDays: z.number().int().min(1).max(365).optional(),
  category: z.enum(['company', 'research paper', 'news', 'pdf', 'personal site', 'financial report', 'people']).optional(),
  topic: z.enum(['general', 'news', 'finance']).optional(),
  timeRange: z.enum(['day', 'week', 'month', 'year']).optional(),
  includeImages: z.boolean().optional(),
  includeDomains: z.array(z.string()).max(8).optional(),
  excludeDomains: z.array(z.string()).max(8).optional(),
})

const ResearchPlanSchema = z.object({
  summary: z.string().max(600).optional(),
  intent: z.array(z.string().max(160)).max(6).optional(),
  searches: z.array(PlannedSearchSchema).min(3).max(MAX_PLANNED_SEARCHES),
})

const SEARCH_PLANNER_SYSTEM_PROMPT = `You are Relevant's search planner.

Your job is to read a research request holistically, then build the evidence-gathering plan before retrieval.

Rules:
- Return only valid JSON.
- Build 5-8 high-signal searches.
- Queries should usually be 6-18 words and under 180 characters.
- Every query must include named entities, market/category words, or decision terms from the request. Avoid vague queries like "latest news".
- Use Exa for semantic search, company snapshots, research papers, financial reports, and source discovery.
- Use Tavily for fresh news, cross-source validation, and visual evidence. Set includeImages true when images would help the final result.
- Include at least one search for disconfirming evidence, risks, pricing pressure, failed attempts, regulation, or customer objections when relevant.
- Include geography, customer segment, role, and use case when the request supplies them.
- Do not search for private user data.

Schema:
{
  "summary": "One plain-English sentence describing the search strategy",
  "intent": ["Evidence lane 1", "Evidence lane 2"],
  "searches": [
    {
      "provider": "exa|tavily",
      "type": "snapshot|news|person|competitor|tavily_news",
      "query": "specific search query",
      "purpose": "why this search exists",
      "lookbackDays": 30,
      "category": "company|research paper|news|pdf|personal site|financial report|people",
      "topic": "general|news|finance",
      "timeRange": "day|week|month|year",
      "includeImages": true
    }
  ]
}`

function cleanJson(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed.startsWith('```')) return trimmed
  return trimmed.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
}

function countQueryWords(query: string): number {
  return query.trim().split(/\s+/).filter(Boolean).length
}

function normalizeSearchTask(task: SearchTask, source: 'llm' | 'fallback'): SearchTask {
  const query = task.query.trim().replace(/\s+/g, ' ').slice(0, 220)
  return {
    ...task,
    query,
    includeDomains: task.includeDomains?.filter(Boolean).slice(0, 8),
    excludeDomains: task.excludeDomains?.filter(Boolean).slice(0, 8),
    purpose: task.purpose?.trim().slice(0, 220),
    lookbackDays: task.lookbackDays ? Math.min(Math.max(Math.round(task.lookbackDays), 1), 365) : undefined,
    meta: {
      ...(task.meta ?? {}),
      source,
      queryWords: String(countQueryWords(query)),
      queryChars: String(query.length),
    },
  }
}

function normalizePlan(plan: ResearchPlan, source: 'llm' | 'fallback'): ResearchPlan {
  const seen = new Set<string>()
  const searches: SearchTask[] = []

  for (const task of plan.searches) {
    const normalized = normalizeSearchTask(task, source)
    const key = `${normalized.provider}:${normalized.query.toLowerCase()}`
    if (seen.has(key) || normalized.query.length < 3) continue
    seen.add(key)
    searches.push(normalized)
    if (searches.length >= MAX_PLANNED_SEARCHES) break
  }

  return {
    summary: plan.summary?.trim(),
    intent: plan.intent?.map((item) => item.trim()).filter(Boolean).slice(0, 6),
    searches,
  }
}

function mergeWithFallback(plan: ResearchPlan, fallback: ResearchPlan): ResearchPlan {
  const seen = new Set(plan.searches.map((task) => `${task.provider}:${task.query.toLowerCase()}`))
  const searches = [...plan.searches]

  for (const task of fallback.searches) {
    const normalized = normalizeSearchTask(task, 'fallback')
    const key = `${normalized.provider}:${normalized.query.toLowerCase()}`
    if (seen.has(key)) continue
    searches.push(normalized)
    seen.add(key)
    if (searches.length >= MAX_PLANNED_SEARCHES) break
  }

  return {
    summary: plan.summary || fallback.summary,
    intent: plan.intent?.length ? plan.intent : fallback.intent,
    searches,
  }
}

export async function buildResearchSearchPlan(
  researchType: ResearchType,
  request: unknown,
  fallbackSearches: SearchTask[],
  ctx?: PipelineContext,
): Promise<ResearchPlan> {
  const fallback = normalizePlan({
    summary: 'Use targeted company, market, fresh-news, and risk searches based on the request fields.',
    intent: ['Find recent changes', 'Validate with independent sources', 'Look for risks and counter-evidence'],
    searches: fallbackSearches,
  }, 'fallback')

  if (!process.env.OPENROUTER_API_KEY) return fallback

  try {
    const userPrompt = `Research type: ${researchType}

Request JSON:
${JSON.stringify(request, null, 2)}

Fallback searches already available:
${JSON.stringify(fallback.searches.map(({ provider, type, query, purpose }) => ({ provider, type, query, purpose })), null, 2)}

Build a better search plan. Keep the strongest fallback searches only if they are useful.`

    const response = await callOpenRouterPrompt(
      SEARCH_PLANNER_SYSTEM_PROMPT,
      userPrompt,
      ctx?.preferredModel ?? DEFAULT_MODEL_PREFERENCE,
      ctx?.signal ?? new AbortController().signal,
      {
        maxTokens: 4096,
        temperature: 0.1,
        responseFormat: { type: 'json_object' },
        reasoning: { effort: 'medium', exclude: true },
      },
    )

    const parsed = JSON.parse(cleanJson(response.content))
    const validation = ResearchPlanSchema.safeParse(parsed)
    if (!validation.success) return fallback

    const planned = normalizePlan(validation.data, 'llm')
    const merged = mergeWithFallback(planned, fallback)
    ctx?.emitter?.send({
      type: 'discovery',
      kind: 'insight',
      text: merged.summary || `Built ${merged.searches.length} planned searches`,
    })
    return merged
  } catch (err) {
    console.warn(`[intel:${researchType}:planSearches] Falling back to deterministic search plan:`, err)
    return fallback
  }
}

export async function executeSearchPlan(
  plan: ResearchPlan,
): Promise<{ sources: BriefSource[]; evidence: NormalizedEvidence[] }> {
  const jobs = plan.searches.map(async (task) => {
    if (task.provider === 'exa') {
      if (task.type === 'snapshot') {
        const snapshot = await searchExaSnapshot(task.query)
        const { source, evidence } = normalizeExaSnapshot(snapshot)
        return {
          sources: source ? [source] : [],
          evidence: evidence ? [evidence] : [],
        }
      }

      const results = await searchExaQuery(task.query, {
        lookbackDays: task.lookbackDays ?? 90,
        numResults: 8,
        category: task.category,
        includeDomains: task.includeDomains,
        excludeDomains: task.excludeDomains,
        summaryQuery: task.purpose
          ? `Extract evidence for this research purpose: ${task.purpose}`
          : `Extract decision-relevant evidence for: ${task.query}`,
      })
      return normalizeExaResults(results)
    }

    const tavily = await searchTavilyQuery(task.query, {
      topic: task.topic ?? (task.type === 'tavily_news' || task.type === 'news' ? 'news' : 'general'),
      timeRange: task.timeRange,
      maxResults: 8,
      includeImages: task.includeImages ?? true,
      includeDomains: task.includeDomains,
      excludeDomains: task.excludeDomains,
    })
    return normalizeTavilyResults(tavily.results)
  })

  const settled = await Promise.allSettled(jobs)
  const sources: BriefSource[] = []
  const evidence: NormalizedEvidence[] = []

  for (const result of settled) {
    if (result.status !== 'fulfilled') continue
    sources.push(...result.value.sources)
    evidence.push(...result.value.evidence)
  }

  return { sources, evidence }
}
