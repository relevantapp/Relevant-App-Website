import type { BriefSource, EvidencePack, IntelligenceBrief } from '../contracts'
import type { ClaimMapItem } from './claim-map'
import { extractClaimMap } from './claim-map'

export interface CitationCheckIssue {
  claim: string
  sourceIds: string[]
  reason: 'missing_source' | 'empty_sources'
}

export interface CitationCheckResult {
  ok: boolean
  issues: CitationCheckIssue[]
  claimMap: ClaimMapItem[]
}

function sourceIdsFromBrief(brief: IntelligenceBrief): Set<string> {
  return new Set((brief.sources as BriefSource[]).map((source) => source.id))
}

export function checkBriefCitations(brief: IntelligenceBrief, pack?: EvidencePack): CitationCheckResult {
  const claimMap = extractClaimMap(brief)
  const validIds = pack
    ? new Set(pack.sourceLedger.map((source) => source.sourceId))
    : sourceIdsFromBrief(brief)

  const issues: CitationCheckIssue[] = []
  for (const claim of claimMap) {
    if (claim.sourceIds.length === 0 && !/unknown|uncertain|not clear|not available/i.test(claim.claim)) {
      issues.push({ claim: claim.claim, sourceIds: [], reason: 'empty_sources' })
      continue
    }

    const missing = claim.sourceIds.filter((sourceId) => !validIds.has(sourceId))
    if (missing.length) {
      issues.push({ claim: claim.claim, sourceIds: missing, reason: 'missing_source' })
    }
  }

  return { ok: issues.length === 0, issues, claimMap }
}
