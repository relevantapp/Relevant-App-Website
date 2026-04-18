# Intelligence V2 — Implementation Plan

> Replaces: `IMPLEMENTATION_PLAN_INTELLIGENCE.md`
> Status: Ready to build
> API keys: Both Exa and Tavily provided
> Scope: Prep mode first, Research mode second, Monitor mode later

---

## 1. What This Is

Replace the current generic dossier tool (`/app/meeting-prep`) with a meeting intelligence product that answers: **"What do I need to know before this meeting?"**

The current tool takes a company name and returns a generic summary. The new tool takes a meeting context and returns actionable talking points, landmines, and questions — all grounded in real-time web data from Exa and Tavily.

---

## 2. Architecture Decision

### Where the code lives

**Website repo** (Next.js server-side) — not in Supabase edge functions.

Reasons:
- Faster iteration
- Exa and Tavily are HTTP APIs called server-side — no Deno edge runtime needed
- Easier to debug
- The existing edge function (`pro-entity-dossier`) stays alive for backwards compatibility but is NOT the path forward

### Data flow

```
Browser (client)
  → POST /api/intelligence (Next.js API route)
    → Validate + auth (reuse existing JWT pattern)
    → Build research plan (what to search for)
    → Run parallel searches:
        ├── Exa: company snapshot (structured output)
        ├── Exa: recent news (deep search + highlights)
        ├── Exa: people search (attendee backgrounds)
        ├── Tavily: real-time news grounding
        └── Tavily: extract company website (if provided)
    → Normalize + deduplicate evidence
    → Synthesize via Claude/OpenRouter (existing AI config)
    → Return IntelligenceBrief JSON
  ← Render in existing app shell
```

### Why two providers

| Provider | Strength | Use for |
|----------|----------|---------|
| **Exa** | Neural search, structured company data (70M+ companies), people search, 178ms latency | Company snapshots, people profiles, deep research |
| **Tavily** | Real-time news accuracy (93.3% on SimpleQA), page extraction, 180ms p50 | Recent news grounding, website content extraction |

Together they cover: structured intelligence (Exa) + real-time news (Tavily). Neither alone is enough.

---

## 3. API Keys & Environment

```env
# Already provided — store in Vercel env vars
EXA_API_KEY=3da1fdbb-059f-4cfd-b9e6-4741373fc32e
TAVILY_API_KEY=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

# Feature flags
INTELLIGENCE_V2_ENABLED=true
INTELLIGENCE_TAVILY_ENABLED=true
```

These go in `.env.local` for dev and Vercel environment variables for deploy. **Never expose to client.**

---

## 4. New Input Schema (Prep Mode)

### What the user fills in

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `accountName` | string | Yes | Company or person being met |
| `website` | string | No | Their website — used for Tavily extraction + Exa enrichment |
| `attendees` | string[] | No | Names of people in the room — triggers Exa people search |
| `meetingType` | enum | Yes | Changes the synthesis lens |
| `goal` | string | Yes | One sentence — "Close the deal" / "Explore partnership" |
| `notes` | string | No | Context the user already has |
| `competitors` | string[] | No | Triggers comparison evidence |

### Meeting types (chips)

```ts
type MeetingType =
  | 'client'      // Existing customer meeting
  | 'sales'       // New business / sales call
  | 'partner'     // Partnership discussion
  | 'investor'    // Fundraising / investor meeting
  | 'board'       // Board meeting prep
  | 'hiring'      // Recruiting conversation
  | 'general'     // Catch-all
```

### Request type

```ts
type IntelligenceRequest = {
  accountName: string
  website?: string
  attendees?: string[]
  meetingType: MeetingType
  goal: string
  notes?: string
  competitors?: string[]
  lookbackDays?: number  // default 30
}
```

---

## 5. New Output Schema

### What the user gets back

```ts
type IntelligenceBrief = {
  // Metadata
  id: string
  mode: 'prep'
  generatedAt: string
  request: IntelligenceRequest

  // Entity snapshot (from Exa structured output)
  snapshot: {
    name: string
    description: string
    website: string | null
    industry: string | null
    headquarters: string | null
    employeeCount: string | null
    fundingStage: string | null
    lastFundingAmount: string | null
    ceo: string | null
    keyPeople: Array<{ name: string; title: string }> | null
    recentMilestone: string | null
    sourceUrl: string | null
  } | null

  // Attendee profiles (from Exa people search)
  attendeeProfiles: Array<{
    name: string
    title: string | null
    company: string | null
    background: string | null
    linkedinUrl: string | null
    sourceUrl: string | null
  }>

  // Brief sections
  summary: {
    headline: string           // One sentence: what's the story
    bottomLine: string         // One paragraph: the meeting answer
    confidence: 'high' | 'medium' | 'low'
  }

  sections: {
    whatJustHappened: BriefBullet[]      // Last 30 days of real events
    talkingPoints: BriefBullet[]         // "Say this in the room"
    landmines: BriefBullet[]             // "Avoid this / be ready for this"
    questionsToAsk: BriefBullet[]        // Smart, specific questions
    competitorContext: BriefBullet[]     // Only if competitors provided
  }

  // Sources
  sources: BriefSource[]

  // Status
  status: {
    degraded: boolean
    reasons: string[]
    exaSearchMs: number
    tavilySearchMs: number
    synthesisMs: number
    totalMs: number
    sourceCount: number
    cached: boolean
  }
}

type BriefBullet = {
  text: string
  sourceIds: string[]         // Maps to sources array
  tag: 'fact' | 'inference'   // Facts have sources; inferences are AI synthesis
}

type BriefSource = {
  id: string
  url: string
  title: string
  domain: string
  publishedAt: string | null
  provider: 'exa' | 'tavily' | 'internal'
  snippet: string | null
}
```

### Section purposes

| Section | What it answers | Data source |
|---------|----------------|-------------|
| **Snapshot** | "Who am I meeting?" | Exa structured output (`outputSchema`) |
| **Attendee Profiles** | "Who's in the room?" | Exa people search |
| **What Just Happened** | "What's new at their company?" | Exa news + Tavily real-time search |
| **Talking Points** | "What should I say?" | AI synthesis from evidence, meeting type, and goal |
| **Landmines** | "What should I avoid?" | AI synthesis — bad press, competitor moves, sensitive topics |
| **Questions to Ask** | "What makes me look smart?" | AI synthesis tied to recent events |
| **Competitor Context** | "How do they compare?" | Exa search on competitor names (only if provided) |

---

## 6. Provider Integration Specs

### 6A. Exa Integration

**SDK:** `exa-js` (npm package)

**Calls made per intelligence request:**

#### Call 1: Company Snapshot (structured output)
```ts
const snapshot = await exa.search(accountName, {
  type: 'deep',
  numResults: 5,
  outputSchema: {
    type: 'object',
    description: 'Company profile information',
    required: ['name', 'description'],
    properties: {
      name: { type: 'string', description: 'Company name' },
      description: { type: 'string', description: 'What the company does in 1-2 sentences' },
      industry: { type: 'string', description: 'Primary industry' },
      headquarters: { type: 'string', description: 'HQ location' },
      employeeCount: { type: 'string', description: 'Approximate employee count' },
      fundingStage: { type: 'string', description: 'Latest funding stage (Seed, Series A, etc.)' },
      lastFundingAmount: { type: 'string', description: 'Most recent funding amount' },
      ceo: { type: 'string', description: 'Current CEO name' },
      recentMilestone: { type: 'string', description: 'Most recent notable milestone or announcement' }
    }
  },
  contents: { highlights: { maxCharacters: 2000 } }
})
```

#### Call 2: Recent News
```ts
const news = await exa.search(`${accountName} recent news announcements`, {
  type: 'auto',
  numResults: 10,
  contents: {
    highlights: { maxCharacters: 4000 },
    summary: { query: `What happened recently at ${accountName}?` }
  }
})
```

#### Call 3: People Search (per attendee, if provided)
```ts
const person = await exa.search(`${attendeeName} ${accountName}`, {
  type: 'auto',
  numResults: 3,
  category: 'people',  // Note: no excludeDomains with category
  contents: { highlights: { maxCharacters: 2000 } }
})
```

#### Call 4: Competitor Search (if competitors provided)
```ts
const compSearch = await exa.search(`${competitorName} vs ${accountName}`, {
  type: 'auto',
  numResults: 5,
  contents: { highlights: { maxCharacters: 3000 } }
})
```

**Important Exa rules (from their docs):**
- `useAutoprompt` is deprecated — do not use
- `highlights` and `text` go inside `contents` on `/search` (not top-level)
- `category: 'people'` does NOT support `excludeDomains` or date filters
- Use `maxCharacters` not `numSentences` for highlights
- Use camelCase in JS SDK
- `outputSchema` max nesting depth 2, max 10 properties

### 6B. Tavily Integration

**SDK:** `@tavily/core` (npm) or direct HTTP

**Calls made per intelligence request:**

#### Call 1: Real-time News
```ts
const tavilyNews = await fetch('https://api.tavily.com/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    api_key: TAVILY_API_KEY,
    query: `${accountName} latest news`,
    search_depth: 'advanced',
    max_results: 10,
    include_answer: true,
    include_raw_content: false,
    include_domains: [],
    exclude_domains: []
  })
})
```

#### Call 2: Website Extraction (if website provided)
```ts
const siteContent = await fetch('https://api.tavily.com/extract', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    api_key: TAVILY_API_KEY,
    urls: [website]
  })
})
```

### 6C. Parallel Execution Strategy

All provider calls should run in parallel using `Promise.allSettled`:

```ts
const [
  exaSnapshot,
  exaNews,
  tavilyNews,
  siteExtract,
  ...attendeeSearches
] = await Promise.allSettled([
  searchExaSnapshot(accountName),
  searchExaNews(accountName, lookbackDays),
  searchTavilyNews(accountName),
  website ? extractTavilySite(website) : Promise.resolve(null),
  ...attendees.map(name => searchExaPerson(name, accountName))
])
```

Each provider call should have its own timeout (10s for Exa auto, 20s for Exa deep, 10s for Tavily). If one fails, the others still contribute.

---

## 7. Synthesis Prompt

The normalized evidence feeds into a single LLM call (Claude via existing AI config).

### System prompt

```
You are a meeting intelligence analyst for a professional preparing for a business meeting.

Your job is to analyze evidence about a company/person and produce a concise, actionable briefing.

Rules:
- Every claim must reference a source by its ID
- Separate facts (sourced) from inferences (your analysis)
- Be specific — reference real events, real names, real numbers
- Talking points should reference specific recent events the user can mention
- Landmines should be things that could go wrong or topics to avoid
- Questions should be smart and specific, not generic
- If evidence is thin, say so — never fabricate
- Write for someone who has 10 minutes to prepare
```

### User prompt (constructed per request)

```
## Meeting Context
- Account: {accountName}
- Meeting type: {meetingType}
- Goal: {goal}
- Notes: {notes}
- Attendees: {attendees}
- Competitors: {competitors}

## Company Snapshot
{snapshot JSON}

## Recent Evidence
{normalized evidence items with source IDs}

## Attendee Backgrounds
{attendee profile summaries}

## Instructions
Produce a JSON response matching this schema:
{
  "headline": "One sentence summary of what matters most",
  "bottomLine": "2-3 sentence meeting answer tailored to the goal",
  "confidence": "high|medium|low based on evidence quality",
  "whatJustHappened": [{"text": "...", "sourceIds": ["s1"], "tag": "fact"}],
  "talkingPoints": [{"text": "...", "sourceIds": ["s1"], "tag": "inference"}],
  "landmines": [{"text": "...", "sourceIds": ["s2"], "tag": "fact"}],
  "questionsToAsk": [{"text": "...", "sourceIds": ["s3"], "tag": "inference"}],
  "competitorContext": [{"text": "...", "sourceIds": ["s4"], "tag": "fact"}]
}

Return 3-5 bullets per section. Tag each as "fact" (directly sourced) or "inference" (your analysis based on evidence).
Every bullet must have at least one sourceId. Do not invent sources.
If a section has no evidence, return an empty array — do not fill with generic advice.
```

---

## 8. File Map

### New files to create

```
src/lib/intelligence/
  types.ts                  # All TypeScript types (request, response, internal)
  providers/
    exa.ts                  # Exa API wrapper (snapshot, news, people, competitor)
    tavily.ts               # Tavily API wrapper (news, extract)
  research-plan.ts          # Builds the query plan based on request fields
  normalize.ts              # Normalizes Exa + Tavily results into unified evidence
  synthesize.ts             # Builds LLM prompt + calls AI + parses response
  index.ts                  # Orchestrator: plan → search → normalize → synthesize

src/app/api/intelligence/
  route.ts                  # Next.js API route (auth, validate, call orchestrator)

src/app/app/intelligence/
  page.tsx                  # New Prep form + results page
  IntelligenceForm.tsx      # Structured input form component
  IntelligenceResults.tsx   # Results display component
  IntelligenceSources.tsx   # Source wall component
  types.ts                  # Frontend-specific types + constants
```

### Files to modify

```
src/components/app/AppLayout.tsx    # Rename nav "Research" → "Intelligence"
src/app/app/meeting-prep/page.tsx   # Convert to redirect → /app/intelligence
```

### Files NOT touched (backwards compat)

```
src/app/api/dossier/route.ts        # Keep for any legacy callers
pro-entity-dossier/*                # Edge function stays for mobile app
```

---

## 9. Build Phases

### Phase 1: Provider Layer + API Route (Backend)

**Goal:** Hit Exa and Tavily from a Next.js API route and return raw results.

**Steps:**
1. Install `exa-js` package in Website repo
2. Create `src/lib/intelligence/types.ts` — all types from Section 5 above
3. Create `src/lib/intelligence/providers/exa.ts`:
   - `searchExaSnapshot(accountName)` — structured output call
   - `searchExaNews(accountName, lookbackDays)` — auto search with highlights
   - `searchExaPerson(name, company)` — people category search
   - `searchExaCompetitor(competitor, accountName)` — comparison search
4. Create `src/lib/intelligence/providers/tavily.ts`:
   - `searchTavilyNews(accountName)` — advanced search
   - `extractTavilySite(url)` — page extraction
5. Create `src/app/api/intelligence/route.ts`:
   - Reuse auth pattern from `/api/dossier/route.ts`
   - Validate `IntelligenceRequest`
   - Call providers in parallel
   - Return raw combined results (for testing)
6. Add env vars to `.env.local`

**Test:** `curl -X POST http://localhost:3000/api/intelligence` with a valid token and `{"accountName": "Stripe", "meetingType": "sales", "goal": "Sell analytics integration"}` — should return raw Exa + Tavily results.

**Subagent delegation:**
- Use `Explore` subagent to find the existing auth pattern in `/api/dossier/route.ts`
- Use `execution_subagent` to install npm packages and run tests

---

### Phase 2: Normalization + Synthesis (Backend)

**Goal:** Turn raw provider results into a synthesized `IntelligenceBrief`.

**Steps:**
1. Create `src/lib/intelligence/normalize.ts`:
   - `normalizeExaResults(results)` → `BriefSource[]`
   - `normalizeTavilyResults(results)` → `BriefSource[]`
   - `deduplicateSources(sources)` — merge by URL
   - `buildEvidenceText(sources)` — format for LLM prompt
2. Create `src/lib/intelligence/research-plan.ts`:
   - `buildResearchPlan(request)` — decides which searches to run based on what fields are filled
3. Create `src/lib/intelligence/synthesize.ts`:
   - `synthesizeBrief(evidence, snapshot, request)` — builds prompt, calls LLM, parses JSON response
   - Use existing AI config pattern or direct Anthropic/OpenRouter call
   - JSON mode response with the schema from Section 7
4. Create `src/lib/intelligence/index.ts`:
   - `generateIntelligenceBrief(request)` — full orchestrator
   - plan → parallel search → normalize → dedupe → synthesize → return
5. Update API route to use orchestrator instead of raw results

**Test:** Same curl, but now returns a full `IntelligenceBrief` with snapshot, sections, and sources.

**Subagent delegation:**
- Use `Explore` subagent to find the existing AI config and LLM call patterns in the Relevant repo
- Use `execution_subagent` to run the API and test with real queries

---

### Phase 3: Frontend — Intelligence Form (UI)

**Goal:** Replace the current meeting-prep input with the new structured form.

**Steps:**
1. Create `src/app/app/intelligence/page.tsx`:
   - Mode: Prep (only mode for now)
   - Import and render `IntelligenceForm` and `IntelligenceResults`
   - Manage form state → loading → results flow
2. Create `src/app/app/intelligence/IntelligenceForm.tsx`:
   - Account name input (required, with autocomplete-style placeholder)
   - Website input (optional)
   - Attendees multi-add (pill chips, add by Enter)
   - Meeting type chip selector (client/sales/partner/investor/board/hiring)
   - Goal input (required, one line, strong placeholder)
   - Notes textarea (optional, collapsible)
   - Competitors multi-add (optional, collapsible)
   - Submit button
3. Create `src/app/app/intelligence/types.ts`:
   - Frontend-specific types and constants (meeting type labels, chip configs)
4. Update nav: rename "Research" → "Intelligence" in `AppLayout.tsx`
5. Convert `/app/meeting-prep/page.tsx` to redirect to `/app/intelligence`

**Design rules (from existing app):**
- Reuse current card, pill, input, button styles
- Dark theme matching existing app shell
- No new design system — use existing Tailwind classes
- Mobile-responsive

**Test:** Navigate to `/app/intelligence`, fill in form, submit — should show loading state and return results.

**Subagent delegation:**
- Use `Explore` subagent to find existing form patterns and component styles in the app
- Use `SWE` subagent to implement the form component in parallel with results component

---

### Phase 4: Frontend — Results Display (UI)

**Goal:** Render `IntelligenceBrief` in a useful, scannable layout.

**Steps:**
1. Create `src/app/app/intelligence/IntelligenceResults.tsx`:
   - **Company snapshot card** (top) — name, description, key facts, logo-style header
   - **Attendee chips** (if any) — name, title, expandable
   - **Bottom line box** (highlighted, first thing user reads)
   - **What Just Happened** — collapsible, fact-tagged bullets with source chips
   - **Talking Points** — collapsible, inference-tagged bullets
   - **Landmines** — collapsible, with warning styling
   - **Questions to Ask** — collapsible, quoted format
   - **Competitor Context** — collapsible, only shown if data exists
   - **Source wall** (bottom) — all sources with domain, date, link
2. Create `src/app/app/intelligence/IntelligenceSources.tsx`:
   - Source list with domain favicons, published dates, snippets
   - Clickable source IDs in bullets scroll/highlight the matching source
3. Add toolbar: New Search, Copy Brief, Refresh
4. Add confidence badge (high/medium/low)
5. Add timing display ("Generated in X seconds, Y sources")

**Design:**
- Reuse `CollapsibleSection` pattern from existing `DossierHelpers.tsx`
- Reuse badge/chip patterns from existing `DossierResults.tsx`
- Keep the existing dark theme
- Mobile: single column, all sections stacked

**Test:** Complete flow — form → submit → loading → results with real Stripe data.

**Subagent delegation:**
- Use `SWE` subagent to build the results component
- Use `execution_subagent` to run lint + typecheck

---

### Phase 5: Polish + Edge Cases

**Goal:** Handle degraded states, errors, and mobile.

**Steps:**
1. Add loading state with progress steps (like current dossier):
   - "Researching {accountName}..."
   - "Analyzing {sourceCount} sources..."
   - "Building your briefing..."
2. Handle provider failures:
   - If Exa fails → Tavily-only mode (lower confidence)
   - If Tavily fails → Exa-only mode (still good)
   - If both fail → error state with retry
   - If snapshot empty → skip snapshot card, lower confidence
3. Handle thin evidence:
   - Confidence = 'low', show "Limited evidence" badge
   - Sections that are empty get hidden, not shown with "No data"
4. Mobile QA:
   - Test all sections collapse/expand properly
   - Test form is usable on small screens
   - Test source links are tappable
5. Copy brief:
   - Markdown export of the full brief
   - Structured: headline → bottom line → sections → sources

**Test:** Try edge cases: made-up company name, person only, no website, no attendees, competitors only.

**Subagent delegation:**
- Use `execution_subagent` to run the full app and test edge cases
- Use `Reviewer` subagent for final code review

---

## 10. Test Scenarios

### Scenario 1: Sales Meeting with Stripe
```json
{
  "accountName": "Stripe",
  "website": "stripe.com",
  "attendees": ["Patrick Collison"],
  "meetingType": "sales",
  "goal": "Sell our analytics integration",
  "competitors": ["Adyen"]
}
```
**Expected:** Company snapshot with funding/size, recent Stripe news, talking points about recent product launches, Patrick Collison profile, Adyen comparison context.

### Scenario 2: Investor Meeting (No Website)
```json
{
  "accountName": "Sequoia Capital",
  "meetingType": "investor",
  "goal": "Raise Series A",
  "attendees": ["Roelof Botha"]
}
```
**Expected:** Sequoia snapshot, Roelof Botha profile, recent Sequoia portfolio activity, talking points about portfolio fit, questions about investment thesis.

### Scenario 3: Client Meeting (Minimal Input)
```json
{
  "accountName": "Shopify",
  "meetingType": "client",
  "goal": "Quarterly business review"
}
```
**Expected:** Shopify snapshot, recent Shopify news, talking points relevant to client relationship, no competitor or attendee sections.

### Scenario 4: Unknown Company
```json
{
  "accountName": "Acme Widget Corp XYZ",
  "meetingType": "general",
  "goal": "Exploratory call"
}
```
**Expected:** Low confidence, thin evidence notice, whatever Exa/Tavily can find, no fabricated data.

### Scenario 5: Person-Focused (Hiring)
```json
{
  "accountName": "Jane Smith",
  "meetingType": "hiring",
  "goal": "Evaluate for VP Engineering role"
}
```
**Expected:** Person-focused results, background info, recent mentions, interview-relevant questions.

---

## 11. Acceptance Criteria

### Product

- [ ] User can generate a prep brief in under 20 seconds
- [ ] Brief contains real, sourced information (not AI hallucination)
- [ ] Every bullet links to at least one source
- [ ] Facts and inferences are visually distinguishable
- [ ] Company snapshot shows real structured data
- [ ] Talking points reference specific recent events
- [ ] Landmines section surfaces real risks/sensitive topics
- [ ] Questions are specific to the company, not generic
- [ ] Thin evidence is clearly labeled, not hidden
- [ ] Brief is useful enough that someone would actually read it before a meeting

### Experience

- [ ] Form is completable in under 30 seconds
- [ ] Loading state shows meaningful progress
- [ ] Results page is scannable in 60 seconds
- [ ] Mobile layout works without horizontal scroll
- [ ] Copy exports clean markdown
- [ ] New search clears previous results

### Engineering

- [ ] API keys never exposed to client
- [ ] Provider failures don't crash the page
- [ ] Parallel searches have individual timeouts
- [ ] Rate limiting prevents abuse (10 req/min per user)
- [ ] No TypeScript `any` types
- [ ] All files under 400 lines
- [ ] Lint and typecheck pass

### Security

- [ ] JWT auth required for API route
- [ ] Input sanitized (accountName, website URL validated)
- [ ] No SSRF via website extraction (validate URL scheme)
- [ ] API keys stored in env vars only

---

## 12. Agent Execution Instructions

### Who builds this

A coding agent (SWE) with subagent delegation.

### Mandatory workflow

1. **Phase 1 (Backend providers):** Build and test Exa + Tavily providers independently
2. **Phase 2 (Backend synthesis):** Build normalization + synthesis + orchestrator
3. **Phase 3 (Frontend form):** Build the intelligence form
4. **Phase 4 (Frontend results):** Build the results display
5. **Phase 5 (Polish):** Edge cases, mobile, copy, errors

### Subagent usage (mandatory)

- **Start every phase** with an `Explore` subagent to find relevant patterns in the existing codebase
- **Use `SWE` subagent** to build independent components in parallel (e.g., form + results simultaneously)
- **Use `execution_subagent`** for all terminal operations: install packages, run dev server, run lint, run typecheck
- **Use `Reviewer` subagent** once at the end of Phase 5 for final review — not after every phase
- **Never chain 3+ manual search or terminal calls** — delegate to subagents

### Rules the agent must follow

1. Read the target file before editing it
2. Small, surgical edits (under 20 lines each)
3. No file over 400 lines
4. No `any` types without justification
5. Reuse existing patterns (auth, UI components, styling)
6. Delete dead code in every file touched
7. Run lint + typecheck after each phase
8. Test with real API calls (not mocks) — the keys are live
9. Do not modify the existing `pro-entity-dossier` edge function
10. Do not modify the existing `/api/dossier` route

### Order of operations for the coding agent

```
1. Read this plan fully
2. Read existing patterns:
   - /api/dossier/route.ts (auth pattern)
   - meeting-prep/page.tsx (form pattern)
   - DossierResults.tsx (results pattern)
   - DossierHelpers.tsx (CollapsibleSection)
3. Install exa-js: npm install exa-js
4. Build Phase 1 (providers + API route)
5. Test Phase 1 with curl
6. Build Phase 2 (normalize + synthesize)
7. Test Phase 2 with curl
8. Build Phase 3 (form UI)
9. Build Phase 4 (results UI)
10. Test full flow in browser
11. Build Phase 5 (polish + edge cases)
12. Run lint + typecheck
13. Run Reviewer once
14. Report results
```

---

## 13. What Success Looks Like

A user opens `/app/intelligence`, types "Stripe", picks "Sales call", types "Sell our analytics", and hits submit.

15 seconds later they see:
- Stripe is a $95B payments company, 8000 employees, CEO Patrick Collison
- Last month they launched Billing v3, hired a new VP Partnerships, expanded to Brazil
- Talking point: "Your new billing platform could benefit from deeper analytics — we already serve similar payment companies"
- Landmine: They posted 3 analytics engineering job openings — might be building in-house
- Question: "How is the partnerships team evaluating analytics integrations post-Billing v3?"
- 12 sources, all clickable

That's a tool someone opens before every meeting. The current one is not.
