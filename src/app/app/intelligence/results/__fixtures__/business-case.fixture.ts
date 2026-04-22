import type { BriefSource, BriefStatus, BusinessCaseBrief } from '@/lib/intelligence/contracts'

const sources: BriefSource[] = [
  {
    id: 'bc-1',
    url: 'https://www.mckinsey.com/industries/software/our-insights/research-ops-automation-2026',
    title: 'Research operations automation outlook 2026',
    domain: 'mckinsey.com',
    publishedAt: '2026-03-05T08:00:00.000Z',
    provider: 'exa',
    snippet: 'Teams that reduce manual synthesis time free up senior operators for higher-value decisions and customer work.',
    sourceRole: 'market_data',
    usedInAnswer: true,
  },
  {
    id: 'bc-2',
    url: 'https://www.bvp.com/atlas/research-workflows-buyer-trends',
    title: 'Buyer trends in research workflow tooling',
    domain: 'bvp.com',
    publishedAt: '2026-02-17T10:30:00.000Z',
    provider: 'tavily',
    snippet: 'The strongest demand is in teams that need structured output tied to active revenue or strategy decisions.',
    sourceRole: 'market_data',
    usedInAnswer: true,
  },
  {
    id: 'bc-3',
    url: 'https://www.notioncapital.com/portfolio-cases/research-automation',
    title: 'Portfolio case study: research automation reduced analyst load by 38%',
    domain: 'notioncapital.com',
    publishedAt: '2026-01-29T12:15:00.000Z',
    provider: 'exa',
    snippet: 'One portfolio company cut manual research effort by 38 percent after switching to a structured workflow.',
    sourceRole: 'primary',
    usedInAnswer: true,
  },
  {
    id: 'bc-4',
    url: 'https://www.forentrepreneurs.com/software-buyer-fatigue',
    title: 'Enterprise software buyer fatigue is real',
    domain: 'forentrepreneurs.com',
    publishedAt: '2026-04-02T09:20:00.000Z',
    provider: 'exa',
    snippet: 'New tools now need sharper ROI proof because finance teams are consolidating spend across GTM systems.',
    sourceRole: 'counter_evidence',
    usedInAnswer: true,
  },
  {
    id: 'bc-5',
    url: 'internal://finance/relevant/enterprise-evals-q1',
    title: 'Internal note: enterprise evals stall when proof is abstract',
    domain: 'internal',
    publishedAt: null,
    provider: 'internal',
    snippet: 'Buyers respond well when ROI is tied to specific meeting prep, competitive, or strategy use cases.',
    sourceRole: 'internal_memory',
    usedInAnswer: true,
  },
]

const status: BriefStatus = {
  degraded: false,
  reasons: [],
  internalMs: 130,
  plannerMs: 150,
  exaMs: 840,
  tavilyMs: 520,
  verifierMs: 0,
  exaSearchMs: 840,
  tavilySearchMs: 520,
  synthesisMs: 1700,
  totalMs: 3340,
  sourceCount: 5,
  sourceCounts: {
    found: 14,
    ranked: 7,
    used: 5,
  },
  cached: false,
  synthesisModel: 'openai/gpt-5.4',
}

export const businessCaseFixture: BusinessCaseBrief = {
  id: 'fixture-business-case-full',
  researchType: 'business_case',
  generatedAt: '2026-04-21T15:40:00.000Z',
  headline: 'There is a strong case to invest if Relevant stays tied to active revenue and strategy workflows.',
  bottomLine: 'Demand is real and comparable outcomes are encouraging, but the plan gets weaker fast if ROI is framed as generic “AI productivity.”',
  whyItMatters: 'This decision is really about whether the product creates budget-worthy operating leverage, not just another research feature set.',
  confidence: 'medium',
  sources,
  status,
  researchPlan: {
    summary: 'Assess whether investment in intelligence results presentation should be treated as a defensible product bet.',
    intent: ['go/no-go decision support', 'surface upside and execution risk'],
    searches: [
      {
        type: 'news',
        query: 'research workflow automation ROI demand enterprise teams 2026',
        provider: 'exa',
        purpose: 'Find current demand and efficiency signals.',
        lookbackDays: 180,
        sourceRole: 'market_data',
      },
      {
        type: 'snapshot',
        query: 'enterprise software buyer fatigue ROI proof 2026',
        provider: 'tavily',
        purpose: 'Stress-test whether the investment case could fail on budget scrutiny.',
        sourceRole: 'counter_evidence',
      },
    ],
  },
  contextUsed: {
    profileKind: 'founder',
    industry: 'SaaS',
    role: 'CEO',
    company: 'Relevant',
    country: 'United States',
    contextNote: 'Decision memo for a product investment conversation.',
  },
  verdict: 'strong',
  verdictRationale: 'The demand signal is strong when the product is attached to live revenue and strategy decisions, and comparable cases show real analyst time savings. The main risk is buyer fatigue if the ROI story stays abstract.',
  comparables: [
    {
      name: 'Tegus',
      outcome: 'success',
      relevance: 'Proved that high-value research workflows can support premium spend.',
      keyTakeaway: 'Teams pay when insight quality shortens real decisions.',
    },
    {
      name: 'Gong',
      outcome: 'success',
      relevance: 'Turned workflow intelligence into a system teams revisit daily.',
      keyTakeaway: 'Operational use cases create durable product pull.',
    },
    {
      name: 'Generic AI note-taker',
      outcome: 'mixed',
      relevance: 'Shows how fast value erodes when the output is generic and hard to defend.',
      keyTakeaway: 'Positioning must stay specific and tied to a decision job.',
    },
  ],
  sections: {
    marketEvidence: [
      {
        text: 'Operators are increasingly willing to pay for tools that convert noisy inputs into decision-ready output.',
        sourceIds: ['bc-1', 'bc-2'],
        tag: 'fact',
      },
      {
        text: 'Comparable companies win when they remove senior-team research overhead, not when they just summarize content.',
        sourceIds: ['bc-1', 'bc-3'],
        tag: 'fact',
      },
    ],
    supportingFactors: [
      {
        text: 'Relevant already has multiple workflow entry points where better results presentation can drive immediate perceived value.',
        sourceIds: ['bc-5'],
        tag: 'inference',
      },
      {
        text: 'The product’s role-aware framing is differentiated from generic AI productivity tools.',
        sourceIds: ['bc-2', 'bc-5'],
        tag: 'inference',
      },
    ],
    riskFactors: [
      {
        text: 'Finance scrutiny is rising, so an abstract ROI pitch will likely underperform.',
        sourceIds: ['bc-4'],
        tag: 'fact',
      },
      {
        text: 'The business case weakens if the team broadens scope before proving one high-frequency workflow.',
        sourceIds: ['bc-5'],
        tag: 'inference',
      },
    ],
    openQuestions: [
      {
        text: 'What is the cleanest single workflow where the upgraded results pages can prove weekly value?',
        sourceIds: ['bc-5'],
        tag: 'inference',
      },
      {
        text: 'How much enterprise willingness-to-pay changes once the result is exportable and more defensible is still not directly quantified.',
        sourceIds: ['bc-2', 'bc-4'],
        tag: 'fact',
      },
    ],
  },
}
