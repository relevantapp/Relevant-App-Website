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
  answer: {
    conclusion: {
      text: 'Relevant wins when the buyer wants an answer-first workflow, while AlphaSense still wins on breadth and enterprise comfort.',
      sourceIds: ['ca-1', 'ca-2', 'ca-5'],
      sourceSnippet: 'Buyer evidence and internal win-loss notes both point to actionability as the wedge and breadth as the current gap.',
    },
    whyItMatters: {
      text: 'This is the practical positioning line for sales and product strategy: do not fight the breadth war first, fight for decision quality.',
      sourceIds: ['ca-1', 'ca-3', 'ca-5'],
      sourceSnippet: 'The alternatives split between enablement-heavy and monitoring-heavy products, leaving room for a decisive answer layer.',
    },
    whatChanged: {
      text: 'The market is getting sharper about workflow fit, which helps Relevant, but enterprise incumbents are also expanding their surrounding bundles.',
      sourceIds: ['ca-2', 'ca-3', 'ca-4'],
      sourceSnippet: 'Recent competitor updates show more packaging depth, not less, even as workflow specialization becomes clearer.',
    },
    confidence: {
      level: 'high',
      driver: 'Third-party review data plus competitor updates plus internal win-loss evidence all point to the same wedge.',
    },
    recommendedNext: {
      text: 'Position Relevant as the decision layer on top of noisy competitive inputs.',
      action: 'Anchor on answer quality',
      copyable: 'We should stop trying to look like the broadest monitoring platform. The stronger story is that Relevant gives the team a conclusion they can act on and defend, while the incumbents still make the user do more synthesis work.',
    },
  },
  trust: {
    sourcedClaimCount: 7,
    freshness: {
      oldestSourceAt: '2026-02-19T16:20:00.000Z',
      newestSourceAt: '2026-04-08T12:00:00.000Z',
    },
    mostImportantSourceIds: ['ca-1', 'ca-2', 'ca-5'],
    conflicts: [
      {
        claim: 'Breadth is still the major enterprise gap even though workflow fit is improving for specialized tools.',
        againstSourceIds: ['ca-1'],
        supportingSourceIds: ['ca-2', 'ca-4'],
      },
    ],
    knownUnknowns: [
      {
        question: 'How much enterprise willingness-to-switch is driven by price versus workflow fit?',
        queriesTried: ['enterprise intelligence platform switching cost price survey', 'AlphaSense replacement reasons 2026'],
      },
    ],
  },
  methodology: {
    providers: [
      {
        name: 'Exa',
        queriesRun: ['AlphaSense Klue Crayon competitive intelligence product updates 2026'],
        docsReturned: 11,
      },
      {
        name: 'Tavily',
        queriesRun: ['competitive intelligence software buyer reviews actionability 2026'],
        docsReturned: 5,
      },
      {
        name: 'Internal',
        queriesRun: ['Enterprise win-loss notes for competitive intelligence evaluations'],
        docsReturned: 1,
      },
    ],
    freshnessRange: {
      oldest: '2026-02-19T16:20:00.000Z',
      newest: '2026-04-08T12:00:00.000Z',
    },
    confidenceDrivers: [
      'External buyer evidence aligns with internal win-loss patterns.',
      'Competitor updates are recent enough to support a current positioning read.',
    ],
    excluded: [
      {
        sourceId: 'ca-4',
        reason: 'Useful for market monitoring posture, but weaker evidence on answer-quality differentiation.',
      },
    ],
  },
  yourCompany: 'Relevant',
  competitors: [
    {
      name: 'AlphaSense',
      description: 'Enterprise market-intelligence platform with broad monitoring, document, and transcript coverage.',
      strengths: ['breadth of content', 'enterprise procurement comfort', 'monitoring depth'],
      weaknesses: ['less guided output', 'heavier workflow', 'higher cost perception'],
      recentMoves: ['Expanded transcript workflows for research teams', 'Pushed deeper enterprise monitoring bundles'],
      recentMovesTyped: [
        {
          date: '2026-03-28',
          type: 'product',
          impact: 'positive',
          text: 'Expanded transcript workflows for research teams.',
          sourceIds: ['ca-2'],
        },
        {
          date: '2026-04-08',
          type: 'market',
          impact: 'positive',
          text: 'Bundled deeper monitoring coverage into the enterprise pitch.',
          sourceIds: ['ca-2'],
        },
      ],
    },
    {
      name: 'Klue',
      description: 'Competitive enablement platform focused on battlecards, field alignment, and seller adoption.',
      strengths: ['battlecards', 'enablement adoption', 'seller workflow'],
      weaknesses: ['shallower research synthesis', 'less analyst-style output'],
      recentMoves: ['Refreshed enablement templates', 'Added more field-facing launch workflows'],
      recentMovesTyped: [
        {
          date: '2026-02-22',
          type: 'leadership',
          impact: 'neutral',
          text: 'Refreshed enablement templates for launch managers and seller workflows.',
          sourceIds: ['ca-3'],
        },
        {
          date: '2026-04-04',
          type: 'product',
          impact: 'positive',
          text: 'Added more field-facing launch workflows for revenue enablement teams.',
          sourceIds: ['ca-3'],
        },
      ],
    },
    {
      name: 'Crayon',
      description: 'Monitoring-oriented platform with broad alerting and market change tracking.',
      strengths: ['monitoring breadth', 'alerts', 'competitive change tracking'],
      weaknesses: ['less decisive answer layer', 'more analyst lift required'],
      recentMoves: ['Published more market monitoring customer stories', 'Leaned into larger enterprise monitoring programs'],
      recentMovesTyped: [
        {
          date: '2026-02-19',
          type: 'customer',
          impact: 'positive',
          text: 'Published a new enterprise customer story centered on monitoring depth.',
          sourceIds: ['ca-4'],
        },
        {
          date: '2026-03-12',
          type: 'market',
          impact: 'mixed',
          text: 'Leaned harder into larger monitoring programs instead of a more decisive answer layer.',
          sourceIds: ['ca-4', 'ca-5'],
        },
      ],
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
  compositeQuadrant: {
    rendered: true,
    xAxis: {
      name: 'Market breadth',
      description: 'How broad and enterprise-ready the platform feels across content, coverage, and procurement expectations.',
      rationale: {
        text: 'Breadth is driven by content depth, workflow coverage, and enterprise comfort signals across the evaluated set.',
        sourceIds: ['ca-2', 'ca-4'],
      },
    },
    yAxis: {
      name: 'Decision velocity',
      description: 'How quickly an operator gets to an answer they can act on and defend.',
      rationale: {
        text: 'Decision velocity is based on how much synthesis work still falls back to the user after the product returns results.',
        sourceIds: ['ca-1', 'ca-3', 'ca-5'],
      },
    },
    points: [
      {
        entity: 'Relevant',
        x: 0.42,
        y: 0.84,
        rationale: {
          text: 'Relevant sits highest on workflow decisiveness even though it is still narrower than the biggest enterprise platforms.',
          sourceIds: ['ca-1', 'ca-5'],
        },
      },
      {
        entity: 'AlphaSense',
        x: 0.92,
        y: 0.63,
        rationale: {
          text: 'AlphaSense is the breadth leader, but the workflow still asks the user to do more of the final synthesis.',
          sourceIds: ['ca-2', 'ca-5'],
        },
      },
      {
        entity: 'Klue',
        x: 0.58,
        y: 0.56,
        rationale: {
          text: 'Klue stays competitive on field usability, but its center of gravity is enablement rather than executive synthesis.',
          sourceIds: ['ca-3'],
        },
      },
      {
        entity: 'Crayon',
        x: 0.71,
        y: 0.45,
        rationale: {
          text: 'Crayon has respectable breadth for monitoring buyers, but it lands lower on decision velocity than an answer-first workflow.',
          sourceIds: ['ca-4', 'ca-5'],
        },
      },
    ],
  },
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
