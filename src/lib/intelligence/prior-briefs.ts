import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { IntelligenceBriefSchema, type ResearchType } from './contracts'
import type { SavedBrief } from './db'

const PRIOR_BRIEF_LOOKBACK = 50
type ParsedIntelligenceBrief = z.infer<typeof IntelligenceBriefSchema>

function normalizeToken(value: unknown): string {
  return typeof value === 'string'
    ? value.trim().replace(/\s+/g, ' ').toLowerCase()
    : ''
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  return Array.from(new Set(
    value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim().replace(/\s+/g, ' ').toLowerCase())
      .filter(Boolean),
  )).sort()
}

export function buildBriefSignature(
  researchType: ResearchType,
  requestPayload: object,
): string | null {
  const payload = requestPayload as Record<string, unknown>

  switch (researchType) {
    case 'meeting_prep': {
      const accountName = normalizeToken(payload.accountName)
      return accountName ? `${researchType}:${accountName}` : null
    }
    case 'competitive_analysis': {
      const yourCompany = normalizeToken(payload.yourCompany)
      const competitors = normalizeStringArray(payload.competitors)
      const focusArea = normalizeToken(payload.focusArea)
      const signature = [yourCompany, competitors.join(','), focusArea].filter(Boolean).join('|')
      return signature ? `${researchType}:${signature}` : null
    }
    case 'business_case': {
      const initiativeName = normalizeToken(payload.initiativeName)
      return initiativeName ? `${researchType}:${initiativeName}` : null
    }
    case 'market_research': {
      const marketOrTrend = normalizeToken(payload.marketOrTrend)
      const scope = normalizeToken(payload.scope)
      const region = normalizeToken(payload.region)
      const signature = [marketOrTrend, scope, region].filter(Boolean).join('|')
      return signature ? `${researchType}:${signature}` : null
    }
    default:
      return null
  }
}

function collectFlowHighlights(brief: ParsedIntelligenceBrief): string[] {
  switch (brief.researchType) {
    case 'meeting_prep':
      return [
        ...brief.sections.whatJustHappened.slice(0, 2).map((item) => item.text),
        ...brief.sections.talkingPoints.slice(0, 2).map((item) => item.text),
      ]
    case 'competitive_analysis':
      return [
        ...brief.sections.keyFindings.slice(0, 2).map((item) => item.text),
        ...brief.sections.recommendations.slice(0, 2).map((item) => item.text),
      ]
    case 'business_case':
      return [
        ...brief.sections.marketEvidence.slice(0, 2).map((item) => item.text),
        ...brief.sections.riskFactors.slice(0, 2).map((item) => item.text),
      ]
    case 'market_research':
      return [
        ...brief.sections.trendSignals.slice(0, 2).map((item) => item.text),
        ...brief.sections.keyFindings.slice(0, 2).map((item) => item.text),
      ]
    default:
      return []
  }
}

export function formatPriorBriefBaseline(
  brief: ParsedIntelligenceBrief,
  savedAt?: string | null,
): string {
  const highlights = collectFlowHighlights(brief)
  const generatedAt = brief.generatedAt ?? savedAt ?? null

  return [
    generatedAt ? `- Generated at: ${generatedAt}` : null,
    brief.headline ? `- Headline: ${brief.headline}` : null,
    brief.answer?.conclusion?.text ? `- Conclusion: ${brief.answer.conclusion.text}` : null,
    brief.bottomLine ? `- Bottom line: ${brief.bottomLine}` : null,
    highlights.length ? `- Key points: ${highlights.join(' | ')}` : null,
  ]
    .filter(Boolean)
    .join('\n')
}

export async function loadPriorBriefBaseline(args: {
  supabase?: SupabaseClient
  userId?: string
  researchType: ResearchType
  requestPayload: object
}): Promise<string | null> {
  if (!args.supabase || !args.userId) return null

  const signature = buildBriefSignature(args.researchType, args.requestPayload)
  if (!signature) return null

  const { data, error } = await args.supabase
    .from('intelligence_briefs')
    .select('request_payload, synthesis, created_at')
    .eq('user_id', args.userId)
    .eq('research_type', args.researchType)
    .order('created_at', { ascending: false })
    .limit(PRIOR_BRIEF_LOOKBACK)

  if (error || !data?.length) return null

  const match = (data as Array<Pick<SavedBrief, 'request_payload' | 'synthesis' | 'created_at'>>).find((row) => {
    const payload = row.request_payload as Record<string, unknown>
    return buildBriefSignature(args.researchType, payload) === signature
  })

  if (!match?.synthesis) return null

  const parsedBrief = IntelligenceBriefSchema.safeParse(match.synthesis)
  if (!parsedBrief.success) return null

  return formatPriorBriefBaseline(parsedBrief.data, match.created_at)
}
