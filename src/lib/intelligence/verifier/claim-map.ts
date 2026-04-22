import type { BriefBullet, IntelligenceBrief } from '../contracts'

export interface ClaimMapItem {
  claim: string
  sourceIds: string[]
  category: string
}

function bulletsFromBrief(brief: IntelligenceBrief): Array<{ category: string; bullet: BriefBullet }> {
  const sections = brief.sections as Record<string, BriefBullet[]>
  return Object.entries(sections).flatMap(([category, bullets]) =>
    (bullets ?? []).map((bullet) => ({ category, bullet })),
  )
}

export function extractClaimMap(brief: IntelligenceBrief): ClaimMapItem[] {
  return bulletsFromBrief(brief).map(({ category, bullet }) => ({
    claim: bullet.text,
    sourceIds: bullet.sourceIds,
    category,
  }))
}
