'use client'

import { useSearchParams } from 'next/navigation'
import IntelligenceResults from '../IntelligenceResults'
import BusinessCaseResults from '../results/BusinessCaseResults'
import CompetitiveResults from '../results/CompetitiveResults'
import MarketResearchResults from '../results/MarketResearchResults'
import { businessCaseFixture } from '../results/__fixtures__/business-case.fixture'
import { competitiveFixture } from '../results/__fixtures__/competitive.fixture'
import { degradedFixtures } from '../results/__fixtures__/degraded.fixture'
import { emptyFixtures } from '../results/__fixtures__/empty.fixture'
import { marketResearchFixture } from '../results/__fixtures__/market-research.fixture'
import { meetingPrepFixture } from '../results/__fixtures__/meeting-prep.fixture'
import type { IntelligenceBrief } from '@/lib/intelligence/contracts'

type FlowKey = 'meeting_prep' | 'competitive_analysis' | 'business_case' | 'market_research'
type FixtureKey = 'full' | 'empty' | 'degraded'

const FLOW_LABELS: Record<FlowKey, string> = {
  meeting_prep: 'Meeting Prep',
  competitive_analysis: 'Competitive Analysis',
  business_case: 'Business Case',
  market_research: 'Market Research',
}

const FIXTURE_LABELS: Record<FixtureKey, string> = {
  full: 'Full',
  empty: 'Empty',
  degraded: 'Degraded',
}

const FIXTURES: Record<FixtureKey, Record<FlowKey, IntelligenceBrief>> = {
  full: {
    meeting_prep: meetingPrepFixture,
    competitive_analysis: competitiveFixture,
    business_case: businessCaseFixture,
    market_research: marketResearchFixture,
  },
  empty: {
    meeting_prep: emptyFixtures.meeting_prep,
    competitive_analysis: emptyFixtures.competitive_analysis,
    business_case: emptyFixtures.business_case,
    market_research: emptyFixtures.market_research,
  },
  degraded: {
    meeting_prep: degradedFixtures.meeting_prep,
    competitive_analysis: degradedFixtures.competitive_analysis,
    business_case: degradedFixtures.business_case,
    market_research: degradedFixtures.market_research,
  },
}

function normalizeFlow(value: string | null): FlowKey {
  return value === 'competitive_analysis'
    || value === 'business_case'
    || value === 'market_research'
    ? value
    : 'meeting_prep'
}

function normalizeFixture(value: string | null): FixtureKey {
  return value === 'empty' || value === 'degraded' ? value : 'full'
}

export default function IntelligenceFixturesPage() {
  const searchParams = useSearchParams()
  const flow = normalizeFlow(searchParams?.get('flow') ?? null)
  const fixture = normalizeFixture(searchParams?.get('fixture') ?? null)
  const selectedBrief = FIXTURES[fixture][flow]

  return (
    <div className="mx-auto max-w-[92rem] px-6 py-8">
      <div className="mb-8 rounded-[28px] border border-[var(--border)] bg-[var(--bg-elevated)] px-6 py-6">
        <p className="kicker text-[var(--accent)]">Fixture preview</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--text)]">
          {FLOW_LABELS[flow]} · {FIXTURE_LABELS[fixture]}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--text-muted)]">
          Use this page for the required manual walkthrough on stable local fixtures. To verify the legacy fallback,
          restart dev with <code className="mx-1 rounded bg-[var(--surface)] px-1.5 py-0.5">NEXT_PUBLIC_INTEL_RESULTS_V2=false</code>.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {(Object.keys(FLOW_LABELS) as FlowKey[]).map((flowKey) => (
            <a
              key={flowKey}
              href={`/app/intelligence/fixtures?flow=${flowKey}&fixture=${fixture}`}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                flowKey === flow
                  ? 'border-[var(--accent)] bg-[color-mix(in_oklch,var(--accent)_14%,transparent)] text-[var(--text)]'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--text)]'
              }`}
            >
              {FLOW_LABELS[flowKey]}
            </a>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(Object.keys(FIXTURE_LABELS) as FixtureKey[]).map((fixtureKey) => (
            <a
              key={fixtureKey}
              href={`/app/intelligence/fixtures?flow=${flow}&fixture=${fixtureKey}`}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                fixtureKey === fixture
                  ? 'border-[var(--accent)] bg-[color-mix(in_oklch,var(--accent)_14%,transparent)] text-[var(--text)]'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--text)]'
              }`}
            >
              {FIXTURE_LABELS[fixtureKey]}
            </a>
          ))}
        </div>
      </div>

      {flow === 'meeting_prep' ? (
        <IntelligenceResults brief={selectedBrief as typeof meetingPrepFixture} onNewSearch={() => undefined} savedBriefId={null} />
      ) : null}
      {flow === 'competitive_analysis' ? (
        <CompetitiveResults brief={selectedBrief as typeof competitiveFixture} onNewSearch={() => undefined} savedBriefId={null} />
      ) : null}
      {flow === 'business_case' ? (
        <BusinessCaseResults brief={selectedBrief as typeof businessCaseFixture} onNewSearch={() => undefined} savedBriefId={null} />
      ) : null}
      {flow === 'market_research' ? (
        <MarketResearchResults brief={selectedBrief as typeof marketResearchFixture} onNewSearch={() => undefined} savedBriefId={null} />
      ) : null}
    </div>
  )
}
