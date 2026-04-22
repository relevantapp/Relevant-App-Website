import type { ResearchLane, ResearchPlanV2, SourceRole } from '../contracts'
import type { CoverageScore } from '../retrieval/controller'

export function buildGapFillLane(plan: ResearchPlanV2, coverage: CoverageScore): ResearchLane | null {
  if (coverage.enoughToSynthesize || coverage.missingQuestions.length === 0) return null

  const weakRole = coverage.weakSourceRoles[0] ?? 'gap_fill'
  const role: SourceRole = weakRole === 'internal_memory' ? 'gap_fill' : weakRole

  return {
    id: 'gap_fill',
    purpose: 'Fill evidence gaps that remain after the initial lanes.',
    providerPreference: ['tavily', 'exa'],
    sourceRole: role,
    questions: coverage.missingQuestions.slice(0, 4),
    queryTemplates: coverage.missingQuestions.slice(0, 4),
    required: false,
    budget: {
      maxQueries: 2,
      maxResults: 6,
      maxContentChars: 12_000,
    },
  }
}

export function appendGapFillLane(plan: ResearchPlanV2, coverage: CoverageScore): ResearchPlanV2 {
  const lane = buildGapFillLane(plan, coverage)
  if (!lane) return plan
  if (plan.lanes.some((item) => item.id === lane.id)) return plan
  return { ...plan, lanes: [...plan.lanes, lane] }
}
