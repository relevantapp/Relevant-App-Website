import type { BriefBullet, IntelligenceBrief } from '../contracts'
import { checkBriefCitations, type CitationCheckResult } from './citation-check'

function repairBullets(bullets: BriefBullet[] | undefined, validIds: Set<string>): BriefBullet[] {
  return (bullets ?? []).map((bullet) => ({
    ...bullet,
    sourceIds: bullet.sourceIds.filter((sourceId) => validIds.has(sourceId)),
  }))
}

export function repairUnsupportedCitations(brief: IntelligenceBrief): {
  brief: IntelligenceBrief
  verifierResult: CitationCheckResult
} {
  const validIds = new Set(brief.sources.map((source) => source.id))
  const sections = brief.sections as Record<string, BriefBullet[]>
  const repairedSections: Record<string, BriefBullet[]> = {}

  for (const [key, bullets] of Object.entries(sections)) {
    repairedSections[key] = repairBullets(bullets, validIds)
  }

  const repaired = {
    ...brief,
    sections: repairedSections,
  } as IntelligenceBrief

  return {
    brief: repaired,
    verifierResult: checkBriefCitations(repaired),
  }
}
