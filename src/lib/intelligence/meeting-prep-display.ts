import type {
  AnswerBlock,
  BriefSource,
  CitedSpan,
  CompanySnapshot,
  EvidencePack,
  MeetingPrepSnapshot,
  ResearchPlanV2,
  TrustLayer,
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

const TRUST_IMPORTANT_SOURCE_LIMIT = 3
const TRUST_CONFLICT_LIMIT = 3
const TRUST_UNKNOWN_LIMIT = 4

function normalizePublishedAt(value: string | null | undefined): string | null {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

function buildFreshnessSummary(sources: BriefSource[]): TrustLayer['freshness'] {
  const publishedAt = sources
    .map((source) => normalizePublishedAt(source.publishedAt))
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

  return {
    oldestSourceAt: publishedAt[0] ?? null,
    newestSourceAt: publishedAt[publishedAt.length - 1] ?? null,
  }
}

function sortByDisplayOrder(sourceIds: string[], sources: BriefSource[]): string[] {
  const order = new Map(sources.map((source, index) => [source.id, index]))
  return [...sourceIds].sort((a, b) => (order.get(a) ?? Number.MAX_SAFE_INTEGER) - (order.get(b) ?? Number.MAX_SAFE_INTEGER))
}

function canonicalClaimSourceGroups(args: {
  claimSourceGroups: Array<string[] | undefined>
  sources: BriefSource[]
  sourceIdMap: Map<string, string>
}): string[][] {
  const availableSourceIds = new Set(args.sources.map((source) => source.id))

  return args.claimSourceGroups
    .map((group) =>
      sortByDisplayOrder(
        canonicalizeSourceIds(group, args.sourceIdMap).filter((sourceId) => availableSourceIds.has(sourceId)),
        args.sources,
      ),
    )
    .filter((group) => group.length > 0)
}

function buildMostImportantSourceIds(args: {
  sources: BriefSource[]
  claimSourceGroups: string[][]
}): string[] {
  const availableSourceIds = new Set(args.sources.map((source) => source.id))
  const sourceOrder = new Map(args.sources.map((source, index) => [source.id, index]))
  const counts = new Map<string, number>()

  for (const group of args.claimSourceGroups) {
    for (const sourceId of group) {
      if (!availableSourceIds.has(sourceId)) continue
      counts.set(sourceId, (counts.get(sourceId) ?? 0) + 1)
    }
  }

  const ranked = Array.from(counts.entries())
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1]
      return (sourceOrder.get(a[0]) ?? Number.MAX_SAFE_INTEGER) - (sourceOrder.get(b[0]) ?? Number.MAX_SAFE_INTEGER)
    })
    .map(([sourceId]) => sourceId)

  if (ranked.length > 0) return ranked.slice(0, TRUST_IMPORTANT_SOURCE_LIMIT)
  return args.sources.slice(0, TRUST_IMPORTANT_SOURCE_LIMIT).map((source) => source.id)
}

function buildTrustConflicts(args: {
  pack?: EvidencePack | null
  sources: BriefSource[]
  sourceIdMap: Map<string, string>
}): TrustLayer['conflicts'] {
  if (!args.pack?.contradictions.length) return []

  const availableSourceIds = new Set(args.sources.map((source) => source.id))
  const evidenceOrder = new Map(
    args.pack.evidence.map((item, index) => [args.sourceIdMap.get(item.sourceId) ?? item.sourceId, index]),
  )

  return args.pack.contradictions
    .map((conflict) => {
      const sourceIds = Array.from(
        new Set(
          conflict.evidenceIds
            .map((sourceId) => args.sourceIdMap.get(sourceId) ?? sourceId)
            .filter((sourceId) => availableSourceIds.has(sourceId)),
        ),
      ).sort((a, b) => (evidenceOrder.get(a) ?? Number.MAX_SAFE_INTEGER) - (evidenceOrder.get(b) ?? Number.MAX_SAFE_INTEGER))

      if (sourceIds.length < 2) return null

      return {
        claim: conflict.issue,
        supportingSourceIds: sourceIds.slice(0, sourceIds.length - 1),
        againstSourceIds: sourceIds.slice(sourceIds.length - 1),
      }
    })
    .filter((conflict): conflict is TrustLayer['conflicts'][number] => Boolean(conflict))
    .slice(0, TRUST_CONFLICT_LIMIT)
}

function normalizeUnknownQuestion(question: string): { sourceRole: string | null; question: string } {
  const trimmed = collapseWhitespace(question)
  const match = trimmed.match(/^([a-z_]+)\s*:\s*(.+)$/i)

  if (!match) return { sourceRole: null, question: trimmed }

  return {
    sourceRole: match[1].toLowerCase(),
    question: match[2].trim(),
  }
}

function queriesForUnknown(question: string, plan?: ResearchPlanV2 | null): string[] {
  if (!plan) return []

  const normalized = normalizeUnknownQuestion(question)
  const lane = plan.lanes.find((candidate) => {
    if (normalized.sourceRole && candidate.sourceRole === normalized.sourceRole) return true
    return candidate.questions.some((item) => normalized.question.toLowerCase().includes(item.toLowerCase()))
  })

  return lane?.queryTemplates.slice(0, 3) ?? []
}

function buildKnownUnknowns(args: {
  pack?: EvidencePack | null
  plan?: ResearchPlanV2 | null
}): TrustLayer['knownUnknowns'] {
  if (!args.pack?.unknowns.length) return []

  return args.pack.unknowns
    .map((unknown) => {
      const normalized = normalizeUnknownQuestion(unknown.question)
      return {
        question: normalized.question,
        queriesTried: queriesForUnknown(unknown.question, args.plan),
      }
    })
    .slice(0, TRUST_UNKNOWN_LIMIT)
}

export function buildTrustLayer(args: {
  sources: BriefSource[]
  sourceIdMap: Map<string, string>
  claimSourceGroups: Array<string[] | undefined>
  pack?: EvidencePack | null
  plan?: ResearchPlanV2 | null
}): TrustLayer {
  const claimSourceGroups = canonicalClaimSourceGroups({
    claimSourceGroups: args.claimSourceGroups,
    sources: args.sources,
    sourceIdMap: args.sourceIdMap,
  })

  return {
    sourcedClaimCount: claimSourceGroups.length,
    freshness: buildFreshnessSummary(args.sources),
    mostImportantSourceIds: buildMostImportantSourceIds({
      sources: args.sources,
      claimSourceGroups,
    }),
    conflicts: buildTrustConflicts({
      pack: args.pack,
      sources: args.sources,
      sourceIdMap: args.sourceIdMap,
    }),
    knownUnknowns: buildKnownUnknowns({
      pack: args.pack,
      plan: args.plan,
    }),
  }
}
