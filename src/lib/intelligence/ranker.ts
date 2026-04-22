/* ── Evidence Ranker — Score, rank, and trim evidence ─────── */

import type { NormalizedEvidence } from './contracts'
import { rankNormalizedEvidence } from './evidence/score'

interface RankOptions {
  topN: number
  queryTerms: string[]
  recencyWeight?: number
  authorityWeight?: number
  matchWeight?: number
}

export function rankEvidence(
  evidence: NormalizedEvidence[],
  options: RankOptions
): NormalizedEvidence[] {
  const {
    topN,
    queryTerms,
  } = options

  return rankNormalizedEvidence(evidence, { topN, queryTerms })
}

export function extractQueryTerms(text: string): string[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'shall', 'this', 'that', 'these',
    'those', 'it', 'its', 'what', 'which', 'who', 'whom', 'how', 'vs',
  ])
  return text
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w))
    .slice(0, 20)
}
