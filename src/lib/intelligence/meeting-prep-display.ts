import type {
  AnswerBlock,
  BriefSource,
  CitedSpan,
  CompanySnapshot,
  MeetingPrepSnapshot,
} from './contracts'

export const SNAPSHOT_SUMMARY_MAX = 220
export const SNAPSHOT_MILESTONE_MAX = 140
export const SNAPSHOT_UNKNOWN_MAX = 80
export const RADAR_DETAIL_MAX = 140
export const COMPETITOR_ADVANTAGE_MAX = 140
export const COMPETITOR_TAG_LIMIT = 3
export const TIMELINE_EVENT_TEXT_MAX = 132

function collapseWhitespace(value: string): string {
  return value.replace(/\r/g, '\n').replace(/\s+/g, ' ').trim()
}

function stripMarkdownArtifacts(value: string): string {
  return value
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*_~]/g, '')
}

export function clampDisplayText(value: string, maxChars: number): string {
  const cleaned = collapseWhitespace(value)
  if (cleaned.length <= maxChars) return cleaned

  const buffer = cleaned.slice(0, maxChars + 1)
  const breakpoint = Math.max(
    buffer.lastIndexOf('. '),
    buffer.lastIndexOf('; '),
    buffer.lastIndexOf(', '),
    buffer.lastIndexOf(' '),
  )
  const safeCutoff = breakpoint > Math.floor(maxChars * 0.6) ? breakpoint : maxChars

  return `${buffer.slice(0, safeCutoff).trim().replace(/[\s,.;:!?-]+$/, '')}…`
}

export function sanitizeMeetingPrepText(value: string | null | undefined, maxChars?: number): string | null {
  if (!value) return null

  let sanitized = stripMarkdownArtifacts(value)
  sanitized = collapseWhitespace(sanitized)
  sanitized = sanitized.replace(/^(company\s+)?(overview|summary|description|about|what they do)\s*[:\-]\s*/i, '')

  if (!sanitized) return null
  return typeof maxChars === 'number' ? clampDisplayText(sanitized, maxChars) : sanitized
}

function firstSentence(value: string): string {
  const [sentence] = value.split(/(?<=[.!?])\s+/)
  return sentence?.trim() || value
}

function compactFunding(snapshot: CompanySnapshot): string | null {
  const parts = [snapshot.fundingStage, snapshot.lastFundingAmount].filter(Boolean)
  if (!parts.length) return null
  return parts.join(' · ')
}

export function buildMeetingPrepSnapshot(
  snapshot: CompanySnapshot | null,
  requestedWebsite?: string | null,
): MeetingPrepSnapshot | null {
  if (!snapshot) return null

  const cleanedDescription = sanitizeMeetingPrepText(snapshot.description, SNAPSHOT_SUMMARY_MAX)
  const summary = cleanedDescription || `${snapshot.name} does not have a reliable summary yet.`
  const whatTheyDo = cleanedDescription ? sanitizeMeetingPrepText(firstSentence(cleanedDescription), 120) : null
  const recentMilestone = sanitizeMeetingPrepText(snapshot.recentMilestone, SNAPSHOT_MILESTONE_MAX)
  const funding = sanitizeMeetingPrepText(compactFunding(snapshot))

  const knownUnknowns = [
    !snapshot.industry ? 'Industry not verified.' : null,
    !snapshot.headquarters ? 'Headquarters not verified.' : null,
    !snapshot.employeeCount ? 'Employee range not verified.' : null,
    !funding ? 'Funding status not verified.' : null,
    !snapshot.ceo ? 'CEO not verified.' : null,
    !recentMilestone ? 'No recent milestone confirmed.' : null,
  ]
    .filter(Boolean)
    .map((item) => clampDisplayText(item as string, SNAPSHOT_UNKNOWN_MAX))
    .slice(0, 4)

  return {
    name: snapshot.name,
    summary,
    website: snapshot.website || requestedWebsite || null,
    whatTheyDo: whatTheyDo && whatTheyDo !== summary ? whatTheyDo : null,
    industry: sanitizeMeetingPrepText(snapshot.industry),
    headquarters: sanitizeMeetingPrepText(snapshot.headquarters),
    employeeRange: sanitizeMeetingPrepText(snapshot.employeeCount),
    funding,
    ceo: sanitizeMeetingPrepText(snapshot.ceo),
    recentMilestone,
    knownUnknowns,
    sourceUrl: snapshot.sourceUrl,
  }
}

function canonicalizeSourceUrl(url: string): string {
  return url.replace(/\/$/, '').toLowerCase()
}

export function buildCanonicalSourceIdMap(sources: BriefSource[]): Map<string, string> {
  const canonicalByUrl = new Map<string, string>()
  const canonicalById = new Map<string, string>()

  for (const source of sources) {
    const key = canonicalizeSourceUrl(source.url)
    const canonicalId = canonicalByUrl.get(key) ?? source.id
    if (!canonicalByUrl.has(key)) canonicalByUrl.set(key, canonicalId)
    canonicalById.set(source.id, canonicalId)
  }

  return canonicalById
}

export function canonicalizeSourceIds(sourceIds: string[] | undefined, sourceIdMap: Map<string, string>): string[] {
  return Array.from(
    new Set(
      (sourceIds ?? [])
        .map((id) => sourceIdMap.get(id) ?? id)
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  )
}

export function normalizeCitedSpan(
  span: CitedSpan | null | undefined,
  sourceIdMap: Map<string, string>,
): CitedSpan | null {
  if (!span) return null

  const text = collapseWhitespace(stripMarkdownArtifacts(span.text))
  if (!text) return null

  const sourceSnippet = span.sourceSnippet
    ? collapseWhitespace(stripMarkdownArtifacts(span.sourceSnippet))
    : span.sourceSnippet ?? undefined

  return {
    text,
    sourceIds: canonicalizeSourceIds(span.sourceIds, sourceIdMap),
    sourceSnippet: sourceSnippet || sourceSnippet === null ? sourceSnippet : undefined,
  }
}

export function normalizeAnswerBlock(
  answer: AnswerBlock | undefined,
  sourceIdMap: Map<string, string>,
): AnswerBlock | undefined {
  if (!answer) return undefined

  const conclusion = normalizeCitedSpan(answer.conclusion, sourceIdMap)
  const whyItMatters = normalizeCitedSpan(answer.whyItMatters, sourceIdMap)
  if (!conclusion || !whyItMatters) return undefined

  const confidenceDriver = collapseWhitespace(stripMarkdownArtifacts(answer.confidence.driver))
  const recommendedText = collapseWhitespace(stripMarkdownArtifacts(answer.recommendedNext.text))
  if (!confidenceDriver || !recommendedText) return undefined

  const recommendedAction = answer.recommendedNext.action
    ? collapseWhitespace(stripMarkdownArtifacts(answer.recommendedNext.action))
    : undefined
  const recommendedCopyable = answer.recommendedNext.copyable
    ? collapseWhitespace(stripMarkdownArtifacts(answer.recommendedNext.copyable))
    : undefined

  return {
    conclusion,
    whyItMatters,
    whatChanged: normalizeCitedSpan(answer.whatChanged, sourceIdMap),
    confidence: {
      level: answer.confidence.level,
      driver: confidenceDriver,
    },
    recommendedNext: {
      text: recommendedText,
      ...(recommendedAction ? { action: recommendedAction } : {}),
      ...(recommendedCopyable ? { copyable: recommendedCopyable } : {}),
    },
  }
}

export function collectAnswerSourceIds(answer: AnswerBlock | undefined): string[] {
  if (!answer) return []

  return Array.from(
    new Set([
      ...answer.conclusion.sourceIds,
      ...answer.whyItMatters.sourceIds,
      ...(answer.whatChanged?.sourceIds ?? []),
    ]),
  )
}

export function markSourcesUsedInAnswer(sources: BriefSource[], usedSourceIds: string[]): BriefSource[] {
  const usedSet = new Set(usedSourceIds)
  return sources.map((source) => ({
    ...source,
    usedInAnswer: usedSet.has(source.id),
  }))
}

export function deriveSourceCounts(args: {
  sources: BriefSource[]
  rankedSourceIds: string[]
  usedSourceIds: string[]
}): { found: number; ranked: number; used: number } {
  const sourceIds = new Set(args.sources.map((source) => source.id))
  const ranked = new Set(args.rankedSourceIds.filter((id) => sourceIds.has(id)))
  const used = new Set(args.usedSourceIds.filter((id) => sourceIds.has(id)))

  return {
    found: args.sources.length,
    ranked: ranked.size,
    used: used.size,
  }
}
