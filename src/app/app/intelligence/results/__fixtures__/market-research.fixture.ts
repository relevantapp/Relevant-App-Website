import type { BriefSource, BriefStatus, MarketResearchBrief } from '@/lib/intelligence/contracts'

const sources: BriefSource[] = [
  {
    id: 'mr-1',
    url: 'https://www.cbinsights.com/research/market-maps/ai-research-workflows',
    title: 'AI research workflow market map',
    domain: 'cbinsights.com',
    publishedAt: '2026-04-06T11:10:00.000Z',
    provider: 'exa',
    snippet: 'The market is fragmenting into monitoring platforms, workflow copilots, and analyst-style answer products.',
    sourceRole: 'market_data',
    usedInAnswer: true,
  },
  {
    id: 'mr-2',
    url: 'https://www.morningconsult.com/2026/03/21/knowledge-worker-ai-tracker',
    title: 'Knowledge worker AI tracker, March 2026',
    domain: 'morningconsult.com',
    publishedAt: '2026-03-21T09:30:00.000Z',
    provider: 'tavily',
    snippet: 'Decision-support use cases outperformed generic summarization in repeat weekly usage.',
    sourceRole: 'market_data',
    usedInAnswer: true,
  },
  {
    id: 'mr-3',
    url: 'https://www.gartner.com/en/articles/hype-cycle-decision-intelligence-2026',
    title: 'Hype cycle for decision intelligence, 2026',
    domain: 'gartner.com',
    publishedAt: '2026-02-13T14:00:00.000Z',
    provider: 'exa',
    snippet: 'Decision-intelligence tooling is moving out of early hype and into practical evaluation for repeatable workflows.',
    sourceRole: 'primary',
    usedInAnswer: true,
  },
  {
    id: 'mr-4',
    url: 'https://www.bessemer.com/cloud-index/ai-workflows',
    title: 'AI workflows cloud index update',
    domain: 'bessemer.com',
    publishedAt: '2026-04-01T08:45:00.000Z',
    provider: 'exa',
    snippet: 'Markets are rewarding verticalized workflow tools that show measurable operator lift.',
    sourceRole: 'market_data',
    usedInAnswer: true,
  },
  {
    id: 'mr-5',
    url: 'internal://signals/market/research-workflows-q2',
    title: 'Internal market signal summary for research workflows',
    domain: 'internal',
    publishedAt: null,
    provider: 'internal',
    snippet: 'Founder conversations consistently distinguish “answer-first” tools from monitoring systems.',
    sourceRole: 'internal_memory',
    usedInAnswer: true,
  },
]

const status: BriefStatus = {
  degraded: false,
  reasons: [],
  internalMs: 105,
  plannerMs: 145,
  exaMs: 970,
  tavilyMs: 610,
  verifierMs: 0,
  exaSearchMs: 970,
  tavilySearchMs: 610,
  synthesisMs: 1810,
  totalMs: 3640,
  sourceCount: 5,
  sourceCounts: {
    found: 20,
    ranked: 9,
    used: 5,
  },
  cached: false,
  synthesisModel: 'openai/gpt-5.4',
}

export const marketResearchFixture: MarketResearchBrief = {
  id: 'fixture-market-research-full',
  researchType: 'market_research',
  generatedAt: '2026-04-21T15:45:00.000Z',
  headline: 'The market is opening for answer-first research products, but monitoring incumbents still own awareness.',
  bottomLine: 'The strongest wedge is workflow-specific decision support for teams that need a conclusion they can defend, not another dashboard.',
  whyItMatters: 'This market is crowded at the surface level, so the useful question is where a retrieval-plus-answer product can feel category-defining instead of interchangeable.',
  confidence: 'medium',
  sources,
  status,
  researchPlan: {
    summary: 'Map the research workflow market and identify where answer-first products can stand out.',
    intent: ['market landscape', 'category direction', 'whitespace scan'],
    searches: [
      {
        type: 'news',
        query: 'AI research workflow market map decision support 2026',
        provider: 'exa',
        purpose: 'Capture current category framing and player movement.',
        lookbackDays: 180,
        sourceRole: 'market_data',
      },
      {
        type: 'snapshot',
        query: 'knowledge worker AI tracker decision support repeat usage 2026',
        provider: 'tavily',
        purpose: 'Validate whether repeat usage favors answer-first workflows.',
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
    contextNote: 'Market scan for an answer-first research workflow product.',
  },
  marketOverview: 'The market is splitting between broad monitoring platforms, workflow copilots, and narrower answer-first products. Buyers increasingly reward tools that tie output to a repeated decision motion instead of generic summarization.',
  players: [
    {
      name: 'AlphaSense',
      category: 'leader',
      description: 'Enterprise market-intelligence platform with strong breadth and procurement comfort.',
      estimatedPosition: 'Dominates breadth-heavy enterprise evaluations.',
    },
    {
      name: 'Glean',
      category: 'challenger',
      description: 'Horizontal enterprise knowledge product with strong retrieval and search positioning.',
      estimatedPosition: 'Useful for broad knowledge access but less specialized for competitive or market workflows.',
    },
    {
      name: 'Relevant',
      category: 'emerging',
      description: 'Answer-first research workflow product built around role-aware relevance and next-step guidance.',
      estimatedPosition: 'Best wedge is decisive output for revenue and strategy teams.',
    },
    {
      name: 'Klue',
      category: 'niche',
      description: 'Enablement-focused competitor intelligence workflow for sellers and PMM teams.',
      estimatedPosition: 'Strong in battlecards, narrower outside GTM workflows.',
    },
  ],
  sections: {
    trendSignals: [
      {
        text: 'Repeat usage is shifting toward tools that turn research into a recommendation, not just a search result.',
        sourceIds: ['mr-2', 'mr-5'],
        tag: 'fact',
      },
      {
        text: 'Verticalized workflows are gaining credibility over generic AI workspaces.',
        sourceIds: ['mr-1', 'mr-4'],
        tag: 'fact',
      },
    ],
    opportunities: [
      {
        text: 'Own the “answer plus proof” layer for teams doing live revenue and strategy work.',
        sourceIds: ['mr-1', 'mr-5'],
        tag: 'inference',
      },
      {
        text: 'Build trust through methodology, citations, and explicit unknowns where generic copilots stay fuzzy.',
        sourceIds: ['mr-3', 'mr-5'],
        tag: 'inference',
      },
    ],
    threats: [
      {
        text: 'Monitoring incumbents still have stronger category awareness and larger content moats.',
        sourceIds: ['mr-1', 'mr-3'],
        tag: 'fact',
      },
      {
        text: 'Horizontal enterprise search products can absorb simpler research jobs before niche tools win adoption.',
        sourceIds: ['mr-4'],
        tag: 'inference',
      },
    ],
    keyFindings: [
      {
        text: 'The market is mature enough for clearer segmentation, but early enough for a strong answer-first category position to emerge.',
        sourceIds: ['mr-1', 'mr-3', 'mr-4'],
        tag: 'inference',
      },
      {
        text: 'The most defensible products are the ones buyers can slot into a weekly operating rhythm.',
        sourceIds: ['mr-2', 'mr-5'],
        tag: 'fact',
      },
    ],
  },
}
