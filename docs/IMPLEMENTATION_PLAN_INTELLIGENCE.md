# Intelligence / Account Intelligence - Detailed Implementation Plan

> Scope: Post-sign-in web app experience, not the marketing landing page.
> Goal: Replace the current generic meeting-prep dossier with a role-aware Intelligence product that helps users prepare for meetings, research accounts, and monitor what changed.

---

## Table of Contents

1. [Product Decision](#product-decision)
2. [What We Need From the Founder Before Coding Starts](#what-we-need-from-the-founder-before-coding-starts)
3. [Non-Negotiable Product Rules](#non-negotiable-product-rules)
4. [Target UX](#target-ux)
5. [Architecture Overview](#architecture-overview)
6. [Workstream A: Information Architecture + Routing](#workstream-a-information-architecture--routing)
7. [Workstream B: Intelligence Input Flow](#workstream-b-intelligence-input-flow)
8. [Workstream C: Live Research Provider Layer](#workstream-c-live-research-provider-layer)
9. [Workstream D: Brief Synthesis + Output Schema](#workstream-d-brief-synthesis--output-schema)
10. [Workstream E: Intelligence Results UI](#workstream-e-intelligence-results-ui)
11. [Workstream F: Save, Refresh, Feedback, and Usage Analytics](#workstream-f-save-refresh-feedback-and-usage-analytics)
12. [Workstream G: Monitor Mode](#workstream-g-monitor-mode)
13. [Workstream H: Hardening, QA, and Launch Readiness](#workstream-h-hardening-qa-and-launch-readiness)
14. [4-Week Delivery Plan](#4-week-delivery-plan)
15. [Environment Variables](#environment-variables)
16. [Suggested File Map](#suggested-file-map)
17. [Definition of Done](#definition-of-done)

---

## Product Decision

### Decision

Build one product surface called `Intelligence`.

Inside `Intelligence`, ship three modes:

1. `Prep`
2. `Research`
3. `Monitor`

`Prep` is the first wedge and the first thing that must feel great.

### Why

The current `/app/meeting-prep` flow is a generic dossier generator:

- one entity query
- optional context
- one output shape

That is useful for broad research, but weak for an actual work problem.

The stronger product is:

`Help me walk into this meeting knowing what changed, why it matters, and what to do next.`

### Product positioning

Do not position this as a general news feed.

Position it as:

`A role-aware relevance engine for account and market intelligence.`

### Primary user jobs

- Founders: prepare for client, partner, investor, or hiring conversations
- Sales and partnerships: understand account context before outreach or meetings
- Investors and operators: get a quick but evidence-backed read on a company or person

---

## What We Need From the Founder Before Coding Starts

This is the minimum input the coding agent needs before building the live version.

### Required

1. `EXA_API_KEY`
   - Exa should be the primary live-web provider.
   - The coding agent should use the Exa Dashboard onboarding flow first, because Exa explicitly recommends that path for new integrations.

2. Exa onboarding snippet
   - Go to the Exa dashboard onboarding.
   - Choose the real stack: `Next.js`, `TypeScript`, server-side integration.
   - Choose the closest use case: company research / web search / structured research.
   - Copy the generated snippet and hand it to the coding agent.
   - This avoids bad first-pass integration mistakes.

3. Three real use cases
   - Example: "Prep me for a meeting with Stripe partnerships."
   - Example: "Research Ramp before a customer pitch."
   - Example: "Track what changed at OpenAI before an investor call."
   - These should be real enough to test whether the feature actually helps.

4. One live deployment target
   - Confirm whether the coding agent should deploy to:
   - local dev only
   - Vercel preview
   - production

### Strongly recommended

1. `TAVILY_API_KEY`
   - Optional for v1.
   - Useful as a fallback provider or later extraction/crawl layer.

2. One test user account
   - A real app login the agent can use for live end-to-end testing.

3. A decision on monitor cadence
   - Daily
   - Weekdays only
   - Manual refresh only for first release

### X account setup: only needed if you want X in scope

X is not required for the core Intelligence v1.

If you want X in scope, choose one of these:

#### Option A: X as a source

Use this only if you want company or executive posts to influence briefs.

Need from you:

- X Developer account
- App with API access
- Bearer token
- API key
- API key secret
- If user-context endpoints are needed later: access token + access token secret

Recommendation:

- Do not make X a required source in v1.
- Add it only after the web + official-site + news flow is working.

#### Option B: Share brief to X

Use this only if you want users to post a summary to X.

Need from you:

- X app with read/write permissions
- OAuth client ID
- OAuth client secret
- Redirect URIs for local and production
- Allowed callback domains

Recommended local callback:

- `http://localhost:3000/api/auth/x/callback`

Recommended production callback:

- `https://www.getrelevantapp.com/api/auth/x/callback`

Recommendation:

- Keep this out of the first Intelligence release unless distribution on X is a clear priority.

---

## Non-Negotiable Product Rules

These rules should constrain the coding agent.

### Product rules

- Keep the existing app visual language.
- Reuse current shell, cards, pills, collapsible sections, badges, and toolbar patterns.
- Do not introduce a brand new design system.
- Do not make the page look like a generic chatbot.
- Do not lead with a timeline. Lead with the meeting answer.
- Every important claim should be backed by a source.
- Separate `facts` from `inference`.
- If evidence is weak, the UI must say so.

### Interaction rules

- The page should feel interactive without becoming noisy.
- Use clicks that reveal value:
- switch mode
- pick quick actions
- show citations
- expand "why this matters"
- refresh brief
- compare competitors
- save brief

### Performance rules

- First useful result should appear fast.
- Long-running research should stream or reveal progress in stages.
- Cached refreshes should be meaningfully faster than first runs.

### Naming rules

- Replace `Research` in nav with `Intelligence`.
- Keep `/app/meeting-prep` as a redirect for backwards compatibility.
- New canonical route should be `/app/intelligence`.

---

## Target UX

### Entry point

Nav label:

- `Intelligence`

Modes:

- `Prep`
- `Research`
- `Monitor`

### Prep mode input

Inputs:

- Account or company name
- Optional website/domain
- People in the meeting
- Meeting type
- Meeting goal
- Notes / context
- Optional competitors

Meeting type examples:

- Client meeting
- Sales call
- Partnership call
- Investor meeting
- Board prep
- Hiring / recruiting

### Research mode input

Inputs:

- Company, person, market, or topic
- Lens
- What the user wants to understand
- Optional compare-against entities

### Monitor mode input

Inputs:

- Entity to follow
- What to watch for
- Cadence
- Optional competitor set

### Prep mode output

Show in this order:

1. `Bottom line`
2. `What changed recently`
3. `Why it matters to them`
4. `Why it matters to you`
5. `What to say in the room`
6. `Questions to ask`
7. `Likely objections or tensions`
8. `Sources`

### Research mode output

Show in this order:

1. `Bottom line`
2. `What changed`
3. `Market read`
4. `Risks and opportunities`
5. `Questions worth answering next`
6. `Sources`

### Monitor mode output

Show in this order:

1. `What changed since last time`
2. `Why this matters now`
3. `Triggers hit`
4. `Open follow-ups`
5. `Sources`

---

## Architecture Overview

### Current state

Current flow:

- UI page at `/app/meeting-prep`
- Next API route at `/api/dossier`
- Route proxies to a Supabase edge function named `pro-entity-dossier`

### Recommended state

Introduce a new server-side orchestration layer for Intelligence:

1. Client submits structured input
2. Next API route validates request
3. Server research layer gathers live evidence from Exa
4. Optional fallback or extraction layer uses Tavily
5. Synthesis layer converts evidence into a strict structured brief
6. Brief is cached and optionally persisted
7. Client renders the brief in the existing app shell

### Recommended backend split

Preferred:

- Keep the orchestration in the website repo first, inside Next server routes or server libs.
- Only move pieces to Supabase edge functions if there is a clear deployment or latency reason.

Reason:

- Faster iteration tonight
- Easier to debug
- Fewer moving parts for v1

### Core server modules

- `src/lib/intelligence/providers/exa.ts`
- `src/lib/intelligence/providers/tavily.ts`
- `src/lib/intelligence/research-plan.ts`
- `src/lib/intelligence/normalize.ts`
- `src/lib/intelligence/synthesize.ts`
- `src/lib/intelligence/cache.ts`
- `src/lib/intelligence/types.ts`

### Request flow

`Prep` request:

1. validate input
2. build query plan
3. run parallel searches
4. normalize sources
5. dedupe evidence
6. synthesize into schema
7. cache + persist
8. return brief

### Query plan for Prep mode

Parallel searches should include:

- company recent news
- official company site
- product / launch pages
- leadership pages
- hiring / careers signals
- funding / investor / financial signals
- competitor mentions if provided
- attendee names if they are given

### Query plan for Research mode

Parallel searches should include:

- core entity search
- recent updates
- official sources
- high-authority third-party sources
- optional comparison entities

### Query plan for Monitor mode

Parallel or scheduled searches should include:

- last-run delta query
- source freshness checks
- tracked trigger terms

---

## Workstream A: Information Architecture + Routing

### A1: Rename the product surface

**Problem**: The current product surface is called `Research`, but the underlying use case is broader and more action-oriented.

**Decision**:

- Rename nav label from `Research` to `Intelligence`
- Introduce canonical route `/app/intelligence`
- Redirect `/app/meeting-prep` to `/app/intelligence`

**Files to Change**:

- `src/components/app/AppLayout.tsx`
- new route files under `src/app/app/intelligence`
- redirect or compatibility layer from `src/app/app/meeting-prep`

**Implementation Steps**:

1. Add new route folder `src/app/app/intelligence`
2. Move or wrap current page logic there
3. Update nav item label and href
4. Preserve old route for compatibility

**Acceptance Criteria**:

- [ ] Nav shows `Intelligence`, not `Research`
- [ ] `/app/intelligence` is the primary route
- [ ] `/app/meeting-prep` redirects cleanly
- [ ] No broken internal links remain

---

### A2: Add mode tabs

**Problem**: One input surface cannot serve Prep, Research, and Monitor equally well.

**Decision**:

- Add top-level mode tabs inside Intelligence:
- `Prep`
- `Research`
- `Monitor`

**Implementation Steps**:

1. Reuse existing pill / segmented-control styling
2. Persist active mode in URL query or local state
3. Keep the three modes visually related

**Acceptance Criteria**:

- [ ] Mode switch is obvious on desktop and mobile
- [ ] Switching mode updates the form cleanly
- [ ] Result page clearly reflects the active mode

---

## Workstream B: Intelligence Input Flow

### B1: Replace the generic one-box query

**Problem**: The current one-box flow is too generic and does not collect the context needed to produce a useful meeting brief.

**Decision**:

For `Prep` mode, collect structured context in a compact form.

**Prep fields**:

- account name
- website or domain
- people in the room
- meeting type
- goal
- notes
- competitors

**Implementation Steps**:

1. Reuse current page shell and card layout
2. Replace current entity-only form with grouped fields
3. Keep advanced fields collapsible
4. Add strong placeholders and examples

**Interaction requirements**:

- Quick-pick meeting type chips
- Add-person interaction
- Compare-against optional chip input
- Inline helper text for goal field

**Acceptance Criteria**:

- [ ] User can submit a Prep brief without typing a perfect search query
- [ ] Goal is required
- [ ] Notes are optional but encouraged
- [ ] Mobile layout remains clean and compact

---

### B2: Keep Research mode lightweight

**Decision**:

Research mode should keep a simpler input:

- primary entity
- entity type
- user objective
- optional comparison

**Acceptance Criteria**:

- [ ] Research mode remains faster than Prep mode
- [ ] User does not feel forced into meeting framing when they are just exploring

---

### B3: Monitor mode setup flow

**Decision**:

Monitor mode should start simple:

- entity
- watch prompt
- cadence

Do not overbuild automation controls in the first pass.

**Acceptance Criteria**:

- [ ] Monitor setup can be completed in under one minute
- [ ] User can see what exactly will be monitored

---

## Workstream C: Live Research Provider Layer

### C1: Introduce provider abstraction

**Problem**: The current dossier path is a black box from the website's point of view.

**Decision**:

Create an explicit provider layer so Intelligence can:

- use Exa first
- optionally use Tavily second
- swap providers without rewriting UI

**Implementation Steps**:

1. Define provider interface:
   - search
   - fetch contents
   - enrich entity
   - optional monitor support
2. Implement Exa adapter
3. Implement Tavily adapter behind feature flag or fallback

**Acceptance Criteria**:

- [ ] Intelligence can run with Exa only
- [ ] Tavily can be enabled without changing the UI contract
- [ ] Provider failures surface clearly in logs and in degraded-state UI

---

### C2: Exa integration

**Decision**:

Use Exa as the primary provider for:

- live web search
- structured company or people research
- grounded answers / structured output
- future monitor support

**Implementation notes**:

- Start with the Exa onboarding-generated snippet.
- Do not hand-roll the first integration if a generated server snippet is available.
- Wrap the generated snippet inside the local provider adapter.

**Recommended use in v1**:

- fast search for broad source discovery
- deeper search for the final meeting brief
- contents only when full-page context is needed

**Acceptance Criteria**:

- [ ] Exa requests run server-side only
- [ ] API key never leaks to the client
- [ ] Search + source extraction work for real company queries

---

### C3: Tavily integration

**Decision**:

Keep Tavily optional in v1.

Use cases where it may help:

- targeted extraction
- site crawl or map
- fallback when Exa result quality is thin

**Acceptance Criteria**:

- [ ] Tavily is not a hard dependency for launch
- [ ] If enabled, it can improve thin-result cases

---

### C4: Evidence normalization

**Problem**: Different providers return different structures.

**Decision**:

Normalize all evidence into a shared internal shape.

**Normalized fields**:

- source id
- title
- url
- domain
- published at
- content snippet
- content highlights
- source type
- authority tier
- evidence tags

**Acceptance Criteria**:

- [ ] All result rendering works off normalized evidence
- [ ] Duplicate links are merged
- [ ] Source freshness is preserved

---

## Workstream D: Brief Synthesis + Output Schema

### D1: Replace the dossier schema

**Problem**: The current schema is generic and does not capture meeting utility directly.

**Decision**:

Create a new Intelligence schema with strict sections.

### Proposed response schema

```ts
type IntelligenceBrief = {
  mode: 'prep' | 'research' | 'monitor'
  entity: {
    primaryName: string
    entityType: 'company' | 'person' | 'topic' | 'market'
    website?: string | null
  }
  request: {
    goal: string
    meetingType?: string | null
    notes?: string | null
    competitors?: string[]
    attendees?: string[]
  }
  summary: {
    headline: string
    bottomLine: string
    confidence: 'high' | 'medium' | 'low'
    freshnessLabel: string
  }
  sections: {
    whatChanged: SectionBullet[]
    whyItMattersToThem: SectionBullet[]
    whyItMattersToYou: SectionBullet[]
    whatToSay: SectionBullet[]
    questionsToAsk: SectionBullet[]
    likelyObjections: SectionBullet[]
    risksAndOpportunities: SectionBullet[]
  }
  sources: IntelligenceSource[]
  status: {
    degraded: boolean
    reasons: string[]
    cached: boolean
  }
}
```

`SectionBullet` should contain:

- text
- sourceIds
- confidence
- tag: `fact` or `inference`

**Acceptance Criteria**:

- [ ] Every visible section can trace back to source ids
- [ ] Facts and inferences are distinguishable
- [ ] Empty sections are omitted or clearly marked

---

### D2: Role-aware synthesis

**Problem**: Generic summaries are exactly why the current feature feels weak.

**Decision**:

The synthesizer must use:

- mode
- meeting goal
- meeting type
- role / lens
- competitor context

It must not write a generic blog-summary answer.

**Implementation Steps**:

1. Reuse tone and structure lessons from existing signal/feed outputs
2. Favor short, decision-oriented bullets
3. Keep citations attached to the most important claims

**Acceptance Criteria**:

- [ ] Prep output feels tailored to the meeting goal
- [ ] Research output feels broader and exploratory
- [ ] Monitor output emphasizes deltas, not full re-briefing

---

### D3: Confidence and degraded mode

**Problem**: The product must know when it does not know enough.

**Decision**:

Add explicit degraded behavior.

Examples:

- not enough recent coverage
- weak attendee match
- only low-authority sources found
- stale results

**Acceptance Criteria**:

- [ ] Thin evidence leads to lower-confidence labels
- [ ] UI explains when the brief is partial
- [ ] Product never pretends weak evidence is certain

---

## Workstream E: Intelligence Results UI

### E1: Rework the result page

**Problem**: The current result page leads with headline + timeline, which is backwards for Prep mode.

**Decision**:

Keep the current visual style, but change the hierarchy.

**Desired order for Prep mode**:

1. Brief header
2. Bottom line
3. What changed
4. Why it matters to them
5. Why it matters to you
6. What to say
7. Questions to ask
8. Likely objections
9. Sources
10. Timeline

**Implementation Steps**:

1. Reuse `CollapsibleSection`
2. Reuse current card and badge styles
3. Move timeline lower
4. Add source chips on bullets

**Acceptance Criteria**:

- [ ] The first screen answers the meeting question
- [ ] The user can inspect citations without leaving the page
- [ ] Timeline is still available but no longer dominates

---

### E2: Add interactive quick actions

These are the interaction hooks that make the feature feel alive.

Add:

- `Refresh brief`
- `Compare competitor`
- `Show citations`
- `Copy brief`
- `Save`
- `Why this section?`
- `Turn into follow-up`

Do not add all-new button styles. Reuse the current toolbar and chip patterns.

**Acceptance Criteria**:

- [ ] Quick actions are visible and useful
- [ ] Actions trigger immediate response or progress states
- [ ] Mobile interactions remain simple

---

### E3: Add "Source-backed" feel

**Decision**:

At least one of these should be visible beside major sections:

- citation count
- source chip
- freshness chip
- confidence label

**Acceptance Criteria**:

- [ ] The output feels grounded
- [ ] Users can tell where the insight came from

---

## Workstream F: Save, Refresh, Feedback, and Usage Analytics

### F1: Save briefs

**Decision**:

Users should be able to save useful briefs.

This can be lightweight in v1:

- save metadata
- save request
- save rendered response
- save source references

**Suggested persistence objects**:

- `intelligence_briefs`
- `intelligence_brief_sources`

If DB schema changes cannot happen quickly, temporary server cache is acceptable for first pass, but persistence is preferred.

**Acceptance Criteria**:

- [ ] User can save a brief
- [ ] Saved brief can be reopened

---

### F2: Refresh and recency

**Decision**:

Add explicit refresh behavior.

Support:

- cached result
- manual refresh
- visible freshness label

**Acceptance Criteria**:

- [ ] User can tell whether the brief is cached
- [ ] Manual refresh returns newer evidence when available

---

### F3: Feedback capture

**Decision**:

Keep the current thumbs-up / thumbs-down pattern, but attach metadata:

- mode
- entity
- goal
- confidence
- whether user copied or saved

**Acceptance Criteria**:

- [ ] Feedback events are logged
- [ ] Future quality review can segment by mode and request type

---

## Workstream G: Monitor Mode

### G1: Define monitor MVP

**Decision**:

Monitor mode is the retention layer, but it should stay simple in the first release.

MVP monitor features:

- create monitor
- list monitors
- run now
- show what changed since last run
- link to latest brief

### G2: Monitoring implementation strategy

Preferred order:

1. manual run now
2. scheduled daily or weekday monitors
3. richer triggers later

If Exa monitor integration is ready and stable, use it.
If not, use your own scheduled job plus the same research pipeline.

**Acceptance Criteria**:

- [ ] User can create a monitor on a company or topic
- [ ] User can run it on demand
- [ ] Monitor result emphasizes delta since last run

---

## Workstream H: Hardening, QA, and Launch Readiness

### H1: Error handling

Handle:

- missing API keys
- provider timeout
- partial research result
- empty evidence set
- invalid URLs
- long-running request cancellation

**Acceptance Criteria**:

- [ ] All common failures lead to useful UI states
- [ ] Logs identify provider, query plan, and failure reason

---

### H2: Observability

Log:

- request id
- user id
- mode
- provider usage
- latency per provider call
- cache hit or miss
- degraded reasons

**Acceptance Criteria**:

- [ ] Debugging a failed or weak brief is practical

---

### H3: Rollout strategy

Rollout order:

1. internal test user
2. founder test user
3. 2-3 real scenarios
4. broader launch

Feature flags:

- `INTELLIGENCE_ENABLED`
- `INTELLIGENCE_MONITORS_ENABLED`
- `INTELLIGENCE_TAVILY_ENABLED`
- `INTELLIGENCE_SHARE_TO_X_ENABLED`

**Acceptance Criteria**:

- [ ] Core Intelligence can launch without Monitor or X
- [ ] Risky features can be disabled cleanly

---

## 4-Week Delivery Plan

### Week 1: Foundations

Deliver:

- route and nav rename
- Intelligence shell
- mode tabs
- Prep form
- initial API contract
- Exa integration
- first real response on live data

Exit criteria:

- user can create a Prep brief with live sources
- result is source-backed
- app route and naming are stable

### Week 2: Better intelligence

Deliver:

- improved query planning
- synthesis schema
- confidence labels
- citations on sections
- reworked result hierarchy
- save + refresh

Exit criteria:

- brief is meaningfully better than the current dossier
- meeting value is obvious in the first screen

### Week 3: Interaction and polish

Deliver:

- compare competitor
- attendee-aware prompts
- better empty states
- feedback capture
- follow-up draft action
- copy/save/share polish

Exit criteria:

- page feels interactive and useful
- common user paths work smoothly on desktop and mobile

### Week 4: Monitor and hardening

Deliver:

- monitor setup
- run-now or scheduled monitors
- delta-focused monitor result
- full QA pass
- deployment hardening

Exit criteria:

- full end-to-end workflow is stable
- founder can test with real scenarios

---

## Environment Variables

Add to `.env.example` and deployment env:

```env
# Primary live-web provider
EXA_API_KEY=

# Optional fallback provider
TAVILY_API_KEY=

# Intelligence feature flags
INTELLIGENCE_ENABLED=true
INTELLIGENCE_MONITORS_ENABLED=false
INTELLIGENCE_TAVILY_ENABLED=false
INTELLIGENCE_SHARE_TO_X_ENABLED=false

# Optional X integration
X_API_KEY=
X_API_KEY_SECRET=
X_BEARER_TOKEN=
X_CLIENT_ID=
X_CLIENT_SECRET=
```

---

## Suggested File Map

This is the recommended implementation shape for the coding agent.

### Frontend

- `src/components/app/AppLayout.tsx`
- `src/app/app/intelligence/page.tsx`
- `src/app/app/intelligence/IntelligenceForm.tsx`
- `src/app/app/intelligence/IntelligenceResults.tsx`
- `src/app/app/intelligence/IntelligenceSidebar.tsx`
- `src/app/app/intelligence/IntelligenceHelpers.tsx`
- `src/app/app/intelligence/types.ts`

### Compatibility

- `src/app/app/meeting-prep/page.tsx`
  - convert to redirect or wrapper

### API

- `src/app/api/intelligence/route.ts`
- keep `src/app/api/dossier/route.ts` only if compatibility is needed temporarily

### Server intelligence layer

- `src/lib/intelligence/types.ts`
- `src/lib/intelligence/providers/exa.ts`
- `src/lib/intelligence/providers/tavily.ts`
- `src/lib/intelligence/research-plan.ts`
- `src/lib/intelligence/normalize.ts`
- `src/lib/intelligence/synthesize.ts`
- `src/lib/intelligence/cache.ts`
- `src/lib/intelligence/featureFlags.ts`

### Optional persistence

- DB tables or server storage for briefs and monitors

---

## Definition of Done

The first release is done when all of the following are true:

- [ ] The product surface is named `Intelligence`
- [ ] Prep mode works on real live company queries
- [ ] Output is clearly better than the old dossier for meeting use cases
- [ ] Important claims are source-backed
- [ ] Confidence and degraded states are visible
- [ ] Result page uses the existing app visual language
- [ ] Manual refresh works
- [ ] Save works
- [ ] Mobile and desktop both work cleanly
- [ ] The coding agent has run the live test checklist and passed it
- [ ] Deployment env is configured correctly
- [ ] Founder can test three real scenarios without hand-holding

