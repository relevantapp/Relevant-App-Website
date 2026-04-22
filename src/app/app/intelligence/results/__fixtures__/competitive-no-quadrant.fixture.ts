import type { CompetitiveAnalysisBrief } from '@/lib/intelligence/contracts'
import { competitiveFixture } from './competitive.fixture'

export const competitiveNoQuadrantFixture: CompetitiveAnalysisBrief = {
  ...competitiveFixture,
  id: 'fixture-competitive-no-quadrant',
  compositeQuadrant: {
    rendered: false,
    reason: "Axes were not distinct enough to justify a quadrant. The capability matrix is the safer read for this brief.",
  },
}
