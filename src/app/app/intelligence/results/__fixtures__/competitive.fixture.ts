import type { BriefSource, BriefStatus, CompetitiveAnalysisBrief } from '@/lib/intelligence/contracts'

const sources: BriefSource[] = [
  {
    id: 'ca-1',
    url: 'https://www.g2.com/reports/competitive-intelligence-spring-2026',
    title: 'Spring 2026 competitive intelligence report',
    domain: 'g2.com',
    publishedAt: '2026-04-08T12:00:00.000Z',
    provider: 'exa',
    snippet: 'Buyers rated Relevant highest for actionability and analyst-style synthesis among mid-market teams.',
    sourceRole: 'market_data',
    usedInAnswer: true,
  },
  {
    id: 'ca-2',
    url: 'https://www.alphasense.com/product-updates/q1-2026',
    title: 'AlphaSense Q1 2026 product update',
    domain: 'alphasense.com',
    publishedAt: '2026-03-28T10:00:00.000Z',
    provider: 'tavily',
    snippet: 'AlphaSense expanded monitoring, transcript, and market-intel workflows for larger research teams.',
    sourceRole: 'primary',
    usedInAnswer: true,
  },
  {
    id: 'ca-3',
    url: 'https://www.klue.com/blog/competitive-enablement-2026',
    title: 'Klue doubles down on enablement workflows',
    domain: 'klue.com',
    publishedAt: '2026-04-04T09:15:00.000Z',
    provider: 'exa',
    snippet: 'Klue is leaning into enablement and battlecards rather than research-heavy executive workflows.',
    sourceRole: 'primary',
    usedInAnswer: true,
  },
  {
    id: 'ca-4',
    url: 'https://www.crayon.co/customers/health-enterprise',
    title: 'Crayon customer story: healthcare enterprise launch',
    domain: 'crayon.co',
    publishedAt: '2026-02-19T16:20:00.000Z',
    provider: 'exa',
    snippet: 'Crayon positions itself around market monitoring breadth and competitive alerting at scale.',
    sourceRole: 'primary',
    usedInAnswer: true,
  },
  {
    id: 'ca-5',
    url: 'internal://research/field-notes/enterprise-win-loss-q2',
    title: 'Internal win-loss summary for enterprise evaluations',
    domain: 'internal',
    publishedAt: null,
    provider: 'internal',
    snippet: 'Relevant wins when stakeholders need a single answer surface, but loses when the buyer wants a pure monitoring platform.',
    sourceRole: 'internal_memory',
    usedInAnswer: true,
  },
]

const status: BriefStatus = {
  degraded: false,
  reasons: [],
  internalMs: 95,
  plannerMs: 125,
  exaMs: 990,
  tavilyMs: 580,
  verifierMs: 0,
  exaSearchMs: 990,
  tavilySearchMs: 580,
  synthesisMs: 1760,
  totalMs: 3550,
  sourceCount: 5,
  sourceCounts: {
    found: 16,
    ranked: 8,
    used: 5,
  },
  cached: false,
  synthesisModel: 'openai/gpt-5.4',
}

export const competitiveFixture: CompetitiveAnalysisBrief = {
  id: 'fixture-competitive-full',
  researchType: 'competitive_analysis',
  generatedAt: '2026-04-21T15:35:00.000Z',
  headline: 'Relevant wins on answer quality, while AlphaSense still leads on breadth and enterprise reach.',
  bottomLine: 'The practical wedge is actionability for revenue and strategy teams that need a conclusion, not just monitoring exhaust.',
  whyItMatters: 'You need a field-usable positioning story that explains where Relevant should lean in and where enterprise breadth competitors still outgun it.',
  confidence: 'high',
  sources,
  status,
  researchPlan: {
    summary: 'Compare Relevant against established competitive-intelligence platforms for strategy and field use cases.',
    intent: ['positioning refresh', 'field messaging', 'capability gap review'],
    searches: [
      {
        type: 'competitor',
        query: 'AlphaSense Klue Crayon competitive intelligence product updates 2026',
        provider: 'exa',
        purpose: 'Collect current public capability and positioning evidence.',
        lookbackDays: 180,
        sourceRole: 'primary',
      },
      {
        type: 'snapshot',
        query: 'competitive intelligence software buyer reviews actionability 2026',
        provider: 'tavily',
        purpose: 'Find third-party evidence on buyer-perceived strengths and weaknesses.',
        sourceRole: 'market_data',
      },
    ],
  },
  contextUsed: {
    profileKind: 'founder',
    industry: 'SaaS',
    role: 'CEO',
    company: 'Relevant',
    country: 'United States',
    contextNote: 'Positioning review for a product and GTM strategy discussion.',
  },
  yourCompany: 'Relevant',
  competitors: [
    {
      name: 'AlphaSense',
      description: 'Enterprise market-intelligence platform with broad monitoring, document, and transcript coverage.',
      strengths: ['breadth of content', 'enterprise procurement comfort', 'monitoring depth'],
      weaknesses: ['less guided output', 'heavier workflow', 'higher cost perception'],
      recentMoves: ['Expanded transcript workflows for research teams', 'Pushed deeper enterprise monitoring bundles'],
    },
    {
      name: 'Klue',
      description: 'Competitive enablement platform focused on battlecards, field alignment, and seller adoption.',
      strengths: ['battlecards', 'enablement adoption', 'seller workflow'],
      weaknesses: ['shallower research synthesis', 'less analyst-style output'],
      recentMoves: ['Refreshed enablement templates', 'Added more field-facing launch workflows'],
    },
    {
      name: 'Crayon',
      description: 'Monitoring-oriented platform with broad alerting and market change tracking.',
      strengths: ['monitoring breadth', 'alerts', 'competitive change tracking'],
      weaknesses: ['less decisive answer layer', 'more analyst lift required'],
      recentMoves: ['Published more market monitoring customer stories', 'Leaned into larger enterprise monitoring programs'],
    },
  ],
  comparisonMatrix: [
    {
      dimension: 'Answer quality',
      values: [
        { company: 'Relevant', position: 'Most decisive answer-first workflow', score: 5 },
        { company: 'AlphaSense', position: 'Strong evidence base, weaker direct conclusion', score: 4 },
        { company: 'Klue', position: 'Useful for battlecards, less strong for executive research', score: 3 },
        { company: 'Crayon', position: 'Monitoring heavy, answer layer is thinner', score: 3 },
      ],
    },
    {
      dimension: 'Research breadth',
      values: [
        { company: 'Relevant', position: 'Focused but narrower', score: 3 },
        { company: 'AlphaSense', position: 'Clear leader on breadth', score: 5 },
        { company: 'Klue', position: 'Moderate breadth', score: 3 },
        { company: 'Crayon', position: 'Broad monitoring coverage', score: 4 },
      ],
    },
    {
      dimension: 'Field usability',
      values: [
        { company: 'Relevant', position: 'Best fit for fast operator use', score: 5 },
        { company: 'AlphaSense', position: 'Powerful but heavier', score: 3 },
        { company: 'Klue', position: 'Very strong for sellers', score: 4 },
        { company: 'Crayon', position: 'Good for monitoring teams, weaker for direct use', score: 3 },
      ],
    },
    {
      dimension: 'Enterprise comfort',
      values: [
        { company: 'Relevant', position: 'Improving, still earlier-stage', score: 3 },
        { company: 'AlphaSense', position: 'Clear leader with large-enterprise proof', score: 5 },
        { company: 'Klue', position: 'Solid commercial comfort', score: 4 },
        { company: 'Crayon', position: 'Established enough for larger evaluations', score: 4 },
      ],
    },
  ],
  sections: {
    keyFindings: [
      {
        text: 'Relevant is strongest when the buyer needs a direct recommendation rather than a monitoring feed.',
        sourceIds: ['ca-1', 'ca-5'],
        tag: 'fact',
      },
      {
        text: 'AlphaSense remains the toughest enterprise comparison because it owns breadth and procurement comfort.',
        sourceIds: ['ca-2'],
        tag: 'fact',
      },
      {
        text: 'Klue and Crayon are clearer alternatives for enablement and monitoring buyers than for executive synthesis buyers.',
        sourceIds: ['ca-3', 'ca-4'],
        tag: 'inference',
      },
    ],
    strategicImplications: [
      {
        text: 'Relevant should frame itself as the decision layer on top of noisy competitive inputs.',
        sourceIds: ['ca-1', 'ca-5'],
        tag: 'inference',
      },
      {
        text: 'The enterprise gap is credibility and breadth, not raw usefulness.',
        sourceIds: ['ca-2', 'ca-5'],
        tag: 'inference',
      },
    ],
    recommendations: [
      {
        text: 'Lead with role-aware answer quality in sales and strategy conversations.',
        sourceIds: ['ca-1', 'ca-5'],
        tag: 'fact',
      },
      {
        text: 'Prepare an explicit response for “why not AlphaSense?” focused on decision speed and usability.',
        sourceIds: ['ca-2', 'ca-5'],
        tag: 'inference',
      },
    ],
  },
}
