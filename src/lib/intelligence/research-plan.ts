/* ── Research Plan — Decides which searches to run ──────────── */

import type { IntelligenceRequest, ResearchPlan, SearchTask } from './types'

export function buildResearchPlan(request: IntelligenceRequest): ResearchPlan {
  const searches: SearchTask[] = []

  // Always: company/entity snapshot
  searches.push({
    type: 'snapshot',
    query: request.accountName,
    provider: 'exa',
  })

  // Always: recent news from both providers
  searches.push({
    type: 'news',
    query: request.accountName,
    provider: 'exa',
  })

  searches.push({
    type: 'tavily_news',
    query: request.accountName,
    provider: 'tavily',
  })

  // If website provided: extract site content
  if (request.website) {
    searches.push({
      type: 'tavily_extract',
      query: request.website,
      provider: 'tavily',
    })
  }

  // If attendees provided: search each person
  if (request.attendees?.length) {
    for (const name of request.attendees.slice(0, 5)) {
      searches.push({
        type: 'person',
        query: name,
        provider: 'exa',
        meta: { personName: name, company: request.accountName },
      })
    }
  }

  // If competitors provided: search each competitor
  if (request.competitors?.length) {
    for (const competitor of request.competitors.slice(0, 3)) {
      searches.push({
        type: 'competitor',
        query: competitor,
        provider: 'exa',
        meta: { competitor, accountName: request.accountName },
      })
    }
  }

  return { searches }
}
