/**
 * diffBriefs — pure delta between two briefs of the same flow.
 *
 * Stable: running `diffBriefs(b, b)` always returns `{ count: 0, groups: [] }`.
 * Ignores timestamps and source IDs so shuffles of evidence never register as
 * drift. Accepts untyped inputs so callers can pass historical briefs without
 * reparsing through Zod — we narrow locally and fall back gracefully when a
 * field is missing.
 *
 * The function is deterministic for identical inputs: list comparisons are
 * performed as multiset membership (Set difference) plus ordered top-N where
 * ordering matters (signal cards, driver branches, etc).
 */

import type {
  BusinessCaseBrief,
  CompetitiveAnalysisBrief,
  IntelligenceBrief,
  MarketResearchBrief,
  MeetingPrepBrief,
  ResearchType,
} from './contracts'

/* ── Public types ─────────────────────────────────────────────── */

export type BriefDiffGroupKind =
  | 'verdict'
  | 'confidence'
  | 'signalCards'
  | 'radarMetrics'
  | 'competitorMatrix'
  | 'people'
  | 'capabilityMatrix'
  | 'recentMoves'
  | 'whitespace'
  | 'recommendedPosture'
  | 'trendSignals'
  | 'marketMap'
  | 'maturity'
  | 'driverTree'
  | 'scenarioBands'
  | 'assumptions'

export interface BriefDiffChange {
  /** Short human label like "added" / "removed" / "changed". */
  kind: 'added' | 'removed' | 'changed'
  /** Sentence a user can read without extra context. */
  label: string
  /** Previous value when meaningful. */
  from?: string | null
  /** New value when meaningful. */
  to?: string | null
  /** Source ids tied to the new value, when available. */
  sourceIds?: string[]
}

export interface BriefDiffGroup {
  kind: BriefDiffGroupKind
  /** Display title like "Signal cards" / "Driver tree". */
  title: string
  changes: BriefDiffChange[]
}

export interface BriefDiff {
  flow: ResearchType
  count: number
  groups: BriefDiffGroup[]
}

/* ── Entry point ──────────────────────────────────────────────── */

export function diffBriefs(
  prev: IntelligenceBrief | null | undefined,
  next: IntelligenceBrief | null | undefined,
  flow: ResearchType,
): BriefDiff {
  if (!prev || !next) return empty(flow)
  if (prev.researchType !== flow || next.researchType !== flow) return empty(flow)

  switch (flow) {
    case 'meeting_prep':
      return finalize(flow, diffMeetingPrep(prev as MeetingPrepBrief, next as MeetingPrepBrief))
    case 'competitive_analysis':
      return finalize(
        flow,
        diffCompetitive(prev as CompetitiveAnalysisBrief, next as CompetitiveAnalysisBrief),
      )
    case 'market_research':
      return finalize(flow, diffMarket(prev as MarketResearchBrief, next as MarketResearchBrief))
    case 'business_case':
      return finalize(
        flow,
        diffBusinessCase(prev as BusinessCaseBrief, next as BusinessCaseBrief),
      )
    default:
      return empty(flow)
  }
}

function empty(flow: ResearchType): BriefDiff {
  return { flow, count: 0, groups: [] }
}

function finalize(flow: ResearchType, groups: BriefDiffGroup[]): BriefDiff {
  const live = groups.filter((g) => g.changes.length > 0)
  const count = live.reduce((n, g) => n + g.changes.length, 0)
  return { flow, count, groups: live }
}

/* ── Meeting prep ─────────────────────────────────────────────── */

function diffMeetingPrep(prev: MeetingPrepBrief, next: MeetingPrepBrief): BriefDiffGroup[] {
  const groups: BriefDiffGroup[] = []

  // Conclusion
  const prevConclusion = prev.answer?.conclusion.text ?? prev.bottomLine
  const nextConclusion = next.answer?.conclusion.text ?? next.bottomLine
  groups.push({
    kind: 'verdict',
    title: 'Conclusion',
    changes: scalarChange(
      'Conclusion rewritten',
      prevConclusion,
      nextConclusion,
      next.answer?.conclusion.sourceIds,
    ),
  })

  // Confidence
  groups.push({
    kind: 'confidence',
    title: 'Confidence',
    changes: scalarChange('Confidence', prev.confidence, next.confidence),
  })

  // Top 3 signal cards (ordered, compared by headline)
  const prevSignals = (prev.signalCards ?? []).slice(0, 3).map((c) => c.headline)
  const nextSignals = (next.signalCards ?? []).slice(0, 3).map((c) => c.headline)
  groups.push({
    kind: 'signalCards',
    title: 'Top signals',
    changes: listChanges(prevSignals, nextSignals, 'signal'),
  })

  // Radar metrics: compare by category + severity delta
  const prevRadar = new Map((prev.radarMetrics ?? []).map((m) => [m.category, m]))
  const nextRadar = new Map((next.radarMetrics ?? []).map((m) => [m.category, m]))
  const radarChanges: BriefDiffChange[] = []
  nextRadar.forEach((nextMetric, cat) => {
    const prevMetric = prevRadar.get(cat)
    if (!prevMetric) {
      radarChanges.push({
        kind: 'added',
        label: `${cat} radar appeared (severity ${nextMetric.severity})`,
        to: String(nextMetric.severity),
        sourceIds: nextMetric.sourceIds,
      })
    } else if (prevMetric.severity !== nextMetric.severity) {
      radarChanges.push({
        kind: 'changed',
        label: `${cat} radar severity moved`,
        from: String(prevMetric.severity),
        to: String(nextMetric.severity),
        sourceIds: nextMetric.sourceIds,
      })
    }
  })
  prevRadar.forEach((prevMetric, cat) => {
    if (!nextRadar.has(cat)) {
      radarChanges.push({
        kind: 'removed',
        label: `${cat} radar cleared`,
        from: String(prevMetric.severity),
      })
    }
  })
  groups.push({ kind: 'radarMetrics', title: 'Risk radar', changes: radarChanges })

  // Competitor matrix membership (by name)
  const prevCompetitors = new Set((prev.competitorMatrix ?? []).map((r) => r.name))
  const nextCompetitors = new Set((next.competitorMatrix ?? []).map((r) => r.name))
  groups.push({
    kind: 'competitorMatrix',
    title: 'Competitors tracked',
    changes: setMembership(prevCompetitors, nextCompetitors, 'competitor'),
  })

  // People (stakeholders + attendee profiles — union set)
  const prevPeople = collectPeople(prev)
  const nextPeople = collectPeople(next)
  groups.push({
    kind: 'people',
    title: 'People in the room',
    changes: setMembership(prevPeople, nextPeople, 'person'),
  })

  return groups
}

function collectPeople(brief: MeetingPrepBrief): Set<string> {
  const names = new Set<string>()
  for (const s of brief.stakeholders ?? []) if (s.name) names.add(s.name)
  for (const a of brief.attendeeProfiles ?? []) if (a.name) names.add(a.name)
  return names
}

/* ── Competitive ──────────────────────────────────────────────── */

function diffCompetitive(
  prev: CompetitiveAnalysisBrief,
  next: CompetitiveAnalysisBrief,
): BriefDiffGroup[] {
  const groups: BriefDiffGroup[] = []

  // Capability matrix cell changes: keyed by `${dimension}::${company}`.
  const prevCells = flattenMatrix(prev.comparisonMatrix ?? [])
  const nextCells = flattenMatrix(next.comparisonMatrix ?? [])
  const cellChanges: BriefDiffChange[] = []
  nextCells.forEach((nextVal, key) => {
    const prevVal = prevCells.get(key)
    const [dim, company] = key.split('::')
    if (!prevVal) {
      cellChanges.push({
        kind: 'added',
        label: `${company} now scored on "${dim}"`,
        to: `${nextVal.position} (${nextVal.score})`,
      })
    } else if (
      prevVal.score !== nextVal.score ||
      prevVal.position !== nextVal.position
    ) {
      cellChanges.push({
        kind: 'changed',
        label: `${company} on "${dim}"`,
        from: `${prevVal.position} (${prevVal.score})`,
        to: `${nextVal.position} (${nextVal.score})`,
      })
    }
  })
  prevCells.forEach((prevVal, key) => {
    if (!nextCells.has(key)) {
      const [dim, company] = key.split('::')
      cellChanges.push({
        kind: 'removed',
        label: `${company} dropped from "${dim}"`,
        from: `${prevVal.position} (${prevVal.score})`,
      })
    }
  })
  groups.push({ kind: 'capabilityMatrix', title: 'Capability matrix', changes: cellChanges })

  // Recent moves added — compared per-competitor via string membership.
  const prevMoves = collectMoves(prev)
  const nextMoves = collectMoves(next)
  const addedMoves = difference(nextMoves, prevMoves)
  const movesChanges: BriefDiffChange[] = Array.from(addedMoves).map((m) => ({
    kind: 'added' as const,
    label: m,
  }))
  groups.push({ kind: 'recentMoves', title: 'Recent moves', changes: movesChanges })

  // Whitespace items (by headline)
  const prevWhitespace = new Set((prev.whitespace ?? []).map((w) => w.headline))
  const nextWhitespace = new Set((next.whitespace ?? []).map((w) => w.headline))
  groups.push({
    kind: 'whitespace',
    title: 'Whitespace',
    changes: setMembership(prevWhitespace, nextWhitespace, 'whitespace'),
  })

  // Recommended posture per competitor — derived from the first recommendation
  // bullet mentioning the competitor name. Falls back to overall recommendation #1.
  const postureChanges = recommendedPostureChanges(prev, next)
  groups.push({
    kind: 'recommendedPosture',
    title: 'Recommended posture',
    changes: postureChanges,
  })

  return groups
}

function flattenMatrix(
  rows: CompetitiveAnalysisBrief['comparisonMatrix'],
): Map<string, { score: number; position: string }> {
  const out = new Map<string, { score: number; position: string }>()
  for (const row of rows) {
    for (const v of row.values) {
      out.set(`${row.dimension}::${v.company}`, { score: v.score, position: v.position })
    }
  }
  return out
}

function collectMoves(brief: CompetitiveAnalysisBrief): Set<string> {
  const set = new Set<string>()
  for (const c of brief.competitors ?? []) {
    for (const m of c.recentMoves ?? []) set.add(`${c.name}: ${m}`)
  }
  return set
}

function recommendedPostureChanges(
  prev: CompetitiveAnalysisBrief,
  next: CompetitiveAnalysisBrief,
): BriefDiffChange[] {
  const changes: BriefDiffChange[] = []
  const competitors = new Set<string>([
    ...((prev.competitors ?? []).map((c) => c.name)),
    ...((next.competitors ?? []).map((c) => c.name)),
  ])
  Array.from(competitors).forEach((name) => {
    const prevRec = findRecommendationFor(prev, name)
    const nextRec = findRecommendationFor(next, name)
    if (prevRec !== nextRec) {
      changes.push({
        kind: prevRec == null ? 'added' : nextRec == null ? 'removed' : 'changed',
        label: `Posture vs ${name}`,
        from: prevRec,
        to: nextRec,
      })
    }
  })
  return changes
}

function findRecommendationFor(
  brief: CompetitiveAnalysisBrief,
  competitorName: string,
): string | null {
  const recs = brief.sections?.recommendations ?? []
  const match = recs.find((r) => r.text.toLowerCase().includes(competitorName.toLowerCase()))
  return match ? match.text : null
}

/* ── Market ───────────────────────────────────────────────────── */

function diffMarket(prev: MarketResearchBrief, next: MarketResearchBrief): BriefDiffGroup[] {
  const groups: BriefDiffGroup[] = []

  // Trend signals (by text)
  const prevTrends = new Set((prev.sections?.trendSignals ?? []).map((r) => r.text))
  const nextTrends = new Set((next.sections?.trendSignals ?? []).map((r) => r.text))
  groups.push({
    kind: 'trendSignals',
    title: 'Trend signals',
    changes: setMembership(prevTrends, nextTrends, 'trend signal'),
  })

  // Market map membership — union of tile names across segments.
  const prevMap = collectMarketPlayers(prev)
  const nextMap = collectMarketPlayers(next)
  groups.push({
    kind: 'marketMap',
    title: 'Market map',
    changes: setMembership(prevMap, nextMap, 'player'),
  })

  // Maturity curve stage
  const prevStage = prev.maturity?.stage ?? null
  const nextStage = next.maturity?.stage ?? null
  if (prevStage !== nextStage) {
    groups.push({
      kind: 'maturity',
      title: 'Maturity curve',
      changes: [
        {
          kind: prevStage == null ? 'added' : nextStage == null ? 'removed' : 'changed',
          label: 'Maturity stage',
          from: prevStage,
          to: nextStage,
          sourceIds: next.maturity?.rationale.sourceIds,
        },
      ],
    })
  } else {
    groups.push({ kind: 'maturity', title: 'Maturity curve', changes: [] })
  }

  return groups
}

function collectMarketPlayers(brief: MarketResearchBrief): Set<string> {
  const set = new Set<string>()
  for (const seg of brief.marketMap?.segments ?? []) {
    for (const p of seg.players ?? []) if (p.name) set.add(p.name)
  }
  for (const p of brief.players ?? []) if (p.name) set.add(p.name)
  return set
}

/* ── Business case ────────────────────────────────────────────── */

function diffBusinessCase(prev: BusinessCaseBrief, next: BusinessCaseBrief): BriefDiffGroup[] {
  const groups: BriefDiffGroup[] = []

  // Verdict
  groups.push({
    kind: 'verdict',
    title: 'Verdict',
    changes: scalarChange('Verdict', prev.verdict, next.verdict),
  })

  // Confidence
  groups.push({
    kind: 'confidence',
    title: 'Confidence',
    changes: scalarChange('Confidence', prev.confidence, next.confidence),
  })

  // Driver tree top nodes (branch names + score)
  const prevBranches = new Map(
    (prev.driverTree?.branches ?? []).map((b) => [b.name, b.score]),
  )
  const nextBranches = new Map(
    (next.driverTree?.branches ?? []).map((b) => [b.name, b.score]),
  )
  const driverChanges: BriefDiffChange[] = []
  nextBranches.forEach((nextScore, name) => {
    const prevScore = prevBranches.get(name)
    if (prevScore === undefined) {
      driverChanges.push({
        kind: 'added',
        label: `${name} driver added`,
        to: String(nextScore),
      })
    } else if (prevScore !== nextScore) {
      driverChanges.push({
        kind: 'changed',
        label: `${name} driver score`,
        from: String(prevScore),
        to: String(nextScore),
      })
    }
  })
  prevBranches.forEach((prevScore, name) => {
    if (!nextBranches.has(name)) {
      driverChanges.push({
        kind: 'removed',
        label: `${name} driver removed`,
        from: String(prevScore),
      })
    }
  })
  groups.push({ kind: 'driverTree', title: 'Driver tree', changes: driverChanges })

  // Scenario bands — compare centre (base) value
  const prevBase = prev.scenarios?.base.value ?? null
  const nextBase = next.scenarios?.base.value ?? null
  if (prevBase !== nextBase) {
    groups.push({
      kind: 'scenarioBands',
      title: 'Scenario bands',
      changes: [
        {
          kind: prevBase == null ? 'added' : nextBase == null ? 'removed' : 'changed',
          label: `${next.scenarios?.metric ?? prev.scenarios?.metric ?? 'Base case'} centre`,
          from: prevBase != null ? String(prevBase) : null,
          to: nextBase != null ? String(nextBase) : null,
        },
      ],
    })
  } else {
    groups.push({ kind: 'scenarioBands', title: 'Scenario bands', changes: [] })
  }

  // Assumptions (by text)
  const prevAssumptions = new Set((prev.assumptions ?? []).map((a) => a.text))
  const nextAssumptions = new Set((next.assumptions ?? []).map((a) => a.text))
  groups.push({
    kind: 'assumptions',
    title: 'Assumptions',
    changes: setMembership(prevAssumptions, nextAssumptions, 'assumption'),
  })

  return groups
}

/* ── Helpers ──────────────────────────────────────────────────── */

function scalarChange<T>(
  label: string,
  prev: T | null | undefined,
  next: T | null | undefined,
  sourceIds?: string[],
): BriefDiffChange[] {
  if (prev === next) return []
  if (prev == null && next == null) return []
  return [
    {
      kind: prev == null ? 'added' : next == null ? 'removed' : 'changed',
      label,
      from: prev != null ? String(prev) : null,
      to: next != null ? String(next) : null,
      sourceIds,
    },
  ]
}

function listChanges(prev: string[], next: string[], noun: string): BriefDiffChange[] {
  const changes: BriefDiffChange[] = []
  const max = Math.max(prev.length, next.length)
  for (let i = 0; i < max; i += 1) {
    const p = prev[i]
    const n = next[i]
    if (p === n) continue
    if (p == null) {
      changes.push({ kind: 'added', label: `New ${noun} at #${i + 1}`, to: n ?? null })
    } else if (n == null) {
      changes.push({ kind: 'removed', label: `${noun} removed at #${i + 1}`, from: p })
    } else {
      changes.push({ kind: 'changed', label: `${noun} #${i + 1}`, from: p, to: n })
    }
  }
  return changes
}

function setMembership(prev: Set<string>, next: Set<string>, noun: string): BriefDiffChange[] {
  const changes: BriefDiffChange[] = []
  Array.from(next).forEach((item) => {
    if (!prev.has(item)) changes.push({ kind: 'added', label: `New ${noun}: ${item}`, to: item })
  })
  Array.from(prev).forEach((item) => {
    if (!next.has(item)) changes.push({ kind: 'removed', label: `${noun} dropped: ${item}`, from: item })
  })
  return changes
}

function difference<T>(a: Set<T>, b: Set<T>): Set<T> {
  const out = new Set<T>()
  Array.from(a).forEach((value) => {
    if (!b.has(value)) out.add(value)
  })
  return out
}
