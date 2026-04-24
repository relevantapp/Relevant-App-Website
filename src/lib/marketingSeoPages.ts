export type MarketingSeoPage = {
  slug: string
  title: string
  metaTitle: string
  description: string
  eyebrow: string
  hero: string
  body: string
  primaryCta: string
  secondaryCta: string
  proof: string[]
  sections: Array<{
    title: string
    body: string
  }>
}

export const marketingSeoPages: MarketingSeoPage[] = [
  {
    slug: 'meeting-prep',
    title: 'Meeting Prep',
    metaTitle: 'AI Meeting Prep for Role-Aware Briefs',
    description:
      'Prepare for customer calls, partner meetings, investor conversations, and internal reviews with cited signals ranked for your role.',
    eyebrow: 'Meeting Prep',
    hero: 'Know the move before the room asks.',
    body:
      'Relevant turns outside-world change into a short meeting brief: what changed, why it matters to the conversation, and what to ask next.',
    primaryCta: 'Start a meeting brief',
    secondaryCta: 'See the app',
    proof: ['Account changes', 'Market pressure', 'Competitive moves', 'Questions to ask'],
    sections: [
      {
        title: 'What changed',
        body: 'Relevant scans companies, markets, filings, and trusted publishers for updates tied to the people or business in the room.',
      },
      {
        title: 'Why it matters',
        body: 'The brief connects the change to your role, the meeting context, and the risk or opening that deserves attention.',
      },
      {
        title: 'What to do next',
        body: 'You get sharper questions, watchpoints, and next moves before the conversation starts.',
      },
    ],
  },
  {
    slug: 'competitive-analysis',
    title: 'Competitive Analysis',
    metaTitle: 'AI Competitive Analysis for Market and Product Teams',
    description:
      'Track competitor moves, pricing pressure, launch signals, and market changes with cited intelligence and clear counters.',
    eyebrow: 'Competitive Analysis',
    hero: 'See where they moved, where they are exposed, and how to counter.',
    body:
      'Relevant turns scattered competitor updates into a ranked view of what changed, what it means for your market, and where to respond.',
    primaryCta: 'Start a competitor brief',
    secondaryCta: 'See signals',
    proof: ['Positioning shifts', 'Pricing changes', 'Product launches', 'Watchlist signals'],
    sections: [
      {
        title: 'What changed',
        body: 'Relevant checks trusted sources for moves across product, pricing, partnerships, hiring, regulation, and customer pressure.',
      },
      {
        title: 'Why it matters',
        body: 'Each update is weighed against your company, role, category, and decision window instead of treated like another alert.',
      },
      {
        title: 'What to do next',
        body: 'The output gives counters, risks, watchpoints, and questions your team can use before the market makes the move obvious.',
      },
    ],
  },
  {
    slug: 'market-research',
    title: 'Market Research',
    metaTitle: 'AI Market Research with Cited Signals',
    description:
      'Use Relevant to understand market shifts, demand signals, emerging players, and category pressure without opening dozens of tabs.',
    eyebrow: 'Market Research',
    hero: 'Separate real market movement from noise.',
    body:
      'Relevant ranks the market changes that matter to your role, then explains the consequence and the next thing worth watching.',
    primaryCta: 'Start market research',
    secondaryCta: 'See how it works',
    proof: ['Demand signals', 'Category shifts', 'Emerging players', 'Timing risks'],
    sections: [
      {
        title: 'What changed',
        body: 'Relevant watches trusted publishers, filings, company updates, and reports for evidence that a market is moving.',
      },
      {
        title: 'Why it matters',
        body: 'The system filters broad market noise through your company, role, industry, and location.',
      },
      {
        title: 'What to do next',
        body: 'You get the openings, pressure points, and next bets that deserve attention now.',
      },
    ],
  },
  {
    slug: 'business-case',
    title: 'Business Case',
    metaTitle: 'AI Business Case Research and Decision Briefs',
    description:
      'Build stronger business cases with cited evidence, risk framing, objections, and decision-ready next moves.',
    eyebrow: 'Business Case',
    hero: 'Build the argument before the room pushes back.',
    body:
      'Relevant gives business-case owners the outside evidence, risk context, and objection map needed before a decision hardens.',
    primaryCta: 'Start a business case',
    secondaryCta: 'See intelligence desk',
    proof: ['Proof points', 'Risks', 'Objections', 'Decision frame'],
    sections: [
      {
        title: 'What changed',
        body: 'Relevant pulls together the market, company, and category signals that should shape the case.',
      },
      {
        title: 'Why it matters',
        body: 'The brief explains which evidence supports the decision and which risks need to be addressed before the room asks.',
      },
      {
        title: 'What to do next',
        body: 'You get the watchpoints, objections, and framing needed to make the argument cleaner.',
      },
    ],
  },
  {
    slug: 'role-aware-intelligence',
    title: 'Role-Aware Intelligence',
    metaTitle: 'Role-Aware Intelligence for Work Decisions',
    description:
      'Relevant is a role-aware relevance engine that explains what changed, why it matters to your work, and what to do next.',
    eyebrow: 'Role-Aware Intelligence',
    hero: 'A relevance engine built around your work.',
    body:
      'Relevant does not give every person the same feed. It ranks outside-world change against your role, company, industry, and market.',
    primaryCta: 'Create your role lens',
    secondaryCta: 'Download the app',
    proof: ['Company', 'Role', 'Industry', 'Location'],
    sections: [
      {
        title: 'What changed',
        body: 'Relevant scans the outside world for company, market, source, and topic movement tied to your context.',
      },
      {
        title: 'Why it matters',
        body: 'The system ranks updates by consequence, not recency, so the useful signals rise first.',
      },
      {
        title: 'What to do next',
        body: 'Each signal points to a next move, watchpoint, or question instead of leaving you with another pile of links.',
      },
    ],
  },
]

export function getMarketingSeoPage(slug: string) {
  return marketingSeoPages.find((page) => page.slug === slug)
}

export function requireMarketingSeoPage(slug: string) {
  const page = getMarketingSeoPage(slug)

  if (!page) {
    throw new Error(`Missing marketing SEO page: ${slug}`)
  }

  return page
}
