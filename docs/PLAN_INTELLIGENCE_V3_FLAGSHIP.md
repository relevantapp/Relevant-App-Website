# Intelligence V3 — Flagship Deep Research

> **One-liner**: Turn Relevant into a role-aware deep research engine where the user commissions intelligence — meeting prep, business case analysis, competitive research — and gets back a polished, skimmable intelligence dashboard powered by their profile, live search, and LLM synthesis.

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [User Personas & Research Types](#2-user-personas--research-types)
3. [Architecture Overview](#3-architecture-overview)
4. [Phase Plan](#4-phase-plan)
5. [Phase 1 — Structured Input System](#phase-1--structured-input-system)
6. [Phase 2 — Search Orchestration](#phase-2--search-orchestration)
7. [Phase 3 — LLM Synthesis Engine](#phase-3--llm-synthesis-engine)
8. [Phase 4 — Intelligence Dashboard UI](#phase-4--intelligence-dashboard-ui)
9. [Phase 5 — Follow-Up Chat & Actions](#phase-5--follow-up-chat--actions)
10. [Phase 6 — Persistence & History](#phase-6--persistence--history)
11. [Phase 7 — Polish & Hardening](#phase-7--polish--hardening)
12. [Database Schema](#database-schema)
13. [API Contracts](#api-contracts)
14. [Visual Specification](#visual-specification)
15. [Acceptance Criteria](#acceptance-criteria)
16. [Test Plan](#test-plan)
17. [Subagent Delegation Map](#subagent-delegation-map)

---

## 1. Product Vision

### The Problem
Professionals spend 30–60 minutes preparing for important meetings, competitive analyses, and business cases. They tab between Google, LinkedIn, company blogs, and news sites, manually stitching context together. The output is messy, incomplete, and doesn't reflect what matters *to them specifically*.

### The Solution
Relevant knows the user — their role, company, industry, dimensions, consequence chains. When a user commissions intelligence, we:

1. **Capture structured intent** — Ask the right questions per research type (not a blank text box)
2. **Dispatch targeted searches** — Exa, Tavily, website extraction, LinkedIn enrichment — all in parallel
3. **Fuse with user profile** — Combine search results + profile_passage + dimensions to create *role-aware* synthesis
4. **Deliver a polished dashboard** — Visual, skimmable, with numbers, timelines, images, and citation-linked proof points
5. **Enable follow-up** — Chat on top of the synthesized context, export/share the report

### What Makes This Different
- **User understanding**: We have 20+ influence dimensions, a profile passage, consequence chains, and behavioral signals. No competitor has this depth.
- **Structured input**: We don't ask "what do you want to research?" — we ask the right questions for each research type.
- **Visual output**: Not a wall of text. An intelligence dashboard with panels, metrics, timelines, and images.

---

## 2. User Personas & Research Types

### Research Types (V1 Ship)

| Type | ID | Who Uses It | Input Shape | Output Shape |
|------|----|-------------|-------------|--------------|
| **Meeting Prep** | `meeting_prep` | Sales, BD, Partnerships, Account Mgmt | Who, meeting type, goal, website, attendees, context | Company intel, attendee profiles, talking points, landmines, questions |
| **Business Case** | `business_case` | Product Managers, Strategy, Ops | Initiative name, hypothesis, target market, success metrics | Market validation, proof points, risk analysis, comparable cases, ROI framework |
| **Competitive Analysis** | `competitive_analysis` | Product, Marketing, Strategy | Target competitor(s), your positioning, focus area | Feature comparison, positioning gaps, recent moves, customer sentiment, threat assessment |
| **Market Research** | `market_research` | Founders, Strategy, Product | Market/trend to research, scope, key questions | Market size signals, key players, trend evidence, emerging threats, opportunities |

### Research Types (V2 Stretch)

| Type | ID | Who Uses It |
|------|----|-------------|
| **Investor Prep** | `investor_prep` | Founders raising capital |
| **Partnership Evaluation** | `partnership_eval` | BD, Corp Dev |
| **Customer Deep Dive** | `customer_deep_dive` | Customer Success, Account Mgmt |

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                        │
│                                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────────┐  │
│  │ Research Type │──▶│  Structured  │──▶│   Commission   │  │
│  │   Selector   │   │  Input Form  │   │    Button      │  │
│  └──────────────┘   └──────────────┘   └───────┬────────┘  │
│                                                 │           │
│  ┌──────────────────────────────────────────────▼────────┐  │
│  │              Intelligence Dashboard                    │  │
│  │  ┌─────────┐ ┌───────────┐ ┌──────────┐ ┌──────────┐ │  │
│  │  │ Company │ │ Attendees │ │ Analysis │ │ Actions  │ │  │
│  │  │ Panel   │ │ Panel     │ │ Panels   │ │ Panel    │ │  │
│  │  └─────────┘ └───────────┘ └──────────┘ └──────────┘ │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │         Follow-up Chat (on synthesis context)    │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                     POST /api/intelligence/v3
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                  API LAYER (Next.js Route)                   │
│                                                             │
│  1. Auth + Rate Limit + Validate                            │
│  2. Fetch User Profile (profile_passage + dimensions)       │
│  3. Build Research Plan (per research type)                  │
│  4. Dispatch Parallel Searches                              │
│     ├── Exa (company snapshot, news, people, competitors)   │
│     ├── Tavily (real-time news, site extraction)            │
│     └── LinkedIn proxy (attendee enrichment — V2)           │
│  5. Normalize + Deduplicate Evidence                        │
│  6. LLM Synthesis (profile-aware, type-specific prompt)     │
│  7. Return IntelligenceBrief V3                             │
│  8. Persist to DB (async, non-blocking)                     │
└─────────────────────────────────────────────────────────────┘
```

### Key Architecture Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Where does synthesis run? | Next.js API route (server-side) | Faster iteration, no edge function deploy cycle, direct access to Exa/Tavily/LLM SDKs |
| Where is user profile fetched? | Supabase query from API route using service role key | Service role key has full read access; avoids another edge function hop |
| LLM provider | Gemini 2.5 Flash (primary), Claude 4 Sonnet via OpenRouter (fallback) | Best speed/quality for structured JSON output |
| Persistence | Supabase `intelligence_briefs` table | Enables history, sharing, and follow-up chat |
| Real-time progress | Server-Sent Events (SSE) | User sees each search phase completing live |

---

## 4. Phase Plan

```
Phase 1 ──▶ Phase 2 ──▶ Phase 3 ──▶ Phase 4 ──▶ Phase 5 ──▶ Phase 6 ──▶ Phase 7
 Input      Search      Synthesis    Dashboard    Chat &      Persist     Polish
 System     Engine      Engine       UI           Actions     & History   & Harden
```

| Phase | What Ships | Depends On | Parallelizable With |
|-------|-----------|------------|---------------------|
| **Phase 1** | Research type selector + structured forms (4 types) | Nothing | — |
| **Phase 2** | Search orchestration + user profile fusion + SSE progress | Phase 1 (input schema) | Phase 4 (loading UI) |
| **Phase 3** | LLM synthesis with type-specific prompts + profile-aware output | Phase 2 (evidence pipeline) | Phase 4 (result components) |
| **Phase 4** | Intelligence dashboard UI (panels, metrics, timeline, images) | Phase 3 (output schema) | Phase 1 (can start layout early) |
| **Phase 5** | Follow-up chat + export/share/download actions | Phase 4 (dashboard) | Phase 6 |
| **Phase 6** | Brief persistence + history page + reload | Phase 3 (brief schema) | Phase 5 |
| **Phase 7** | Error hardening, rate limiting, caching, mobile prep | All phases | — |

---

## Phase 1 — Structured Input System

### Goal
Replace the current one-size-fits-all form with a research type selector + per-type structured input forms that guide the user through the right questions.

### Components to Build

#### 1.1 Research Type Selector
```
┌────────────────────────────────────────────────────────┐
│          What would you like to prepare for?            │
│                                                        │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │  📋 Meeting  │  │  📊 Business │                    │
│  │    Prep      │  │    Case      │                    │
│  │              │  │              │                    │
│  │ Prepare for  │  │ Build proof  │                    │
│  │ a sales,     │  │ points for   │                    │
│  │ client, or   │  │ an initiative│                    │
│  │ partner call │  │ or proposal  │                    │
│  └──────────────┘  └──────────────┘                    │
│                                                        │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │  ⚔️ Competi- │  │  🔍 Market   │                    │
│  │  tive Intel  │  │  Research    │                    │
│  │              │  │              │                    │
│  │ Analyze a    │  │ Explore a    │                    │
│  │ competitor's │  │ market trend │                    │
│  │ latest moves │  │ or space     │                    │
│  └──────────────┘  └──────────────┘                    │
└────────────────────────────────────────────────────────┘
```

- 2×2 card grid on desktop, vertical stack on mobile
- Each card: icon + title + 2-line description
- Selected state: accent border + subtle scale
- Clicking a card slides in the per-type form below

#### 1.2 Meeting Prep Form

| Field | Type | Required | AI Assist | Details |
|-------|------|----------|-----------|---------|
| **Who are you meeting?** | Text input | ✅ | — | Company or person name |
| **Meeting type** | Chip selector | ✅ | — | Presets: `Customer` · `Partner` · `Reseller` · `Investor` · `Board` · `Internal` · `Other` |
| **What's your goal?** | Text area (2 lines) | ✅ | ✅ Refine | Free text. AI refine button rewrites for clarity. Placeholder varies by meeting type |
| **Their website** | URL input | ❌ | — | Optional. Auto-detected from company name when possible |
| **Attendees** | Tag input (max 5) | ❌ | ✅ Enrich | Name entry. If LinkedIn URL pasted, extract name. V2: profile card preview |
| **Key topics / context** | Text area (3 lines) | ❌ | — | "Anything else we should know?" |
| **Competitors to watch** | Tag input (max 3) | ❌ | — | Optional competitor names for comparison |

**AI Refine (Goal field)**:
- Small "✨ Refine" button next to textarea
- On click: sends `{ goal: rawText, meetingType, accountName }` to `/api/intelligence/refine-goal`
- Returns polished 1-2 sentence goal statement
- User can accept or revert

**Attendee Enrichment (V1)**:
- User types name or pastes LinkedIn URL
- Display as tag chip: `Jane Doe` or `Jane Doe (linkedin.com/in/jane)`
- Backend searches Exa for person + company context

#### 1.3 Business Case Form

| Field | Type | Required | Details |
|-------|------|----------|---------|
| **Initiative name** | Text input | ✅ | e.g., "Weekend delivery service" |
| **Your hypothesis** | Text area (2 lines) | ✅ | What you believe and want to validate |
| **Target market** | Text input | ❌ | Who would this serve? |
| **Success metrics** | Tag input (max 4) | ❌ | e.g., "Revenue uplift", "Customer retention" |
| **Key questions** | Text area (3 lines) | ❌ | What specifically do you need answered? |
| **Comparable companies** | Tag input (max 3) | ❌ | Companies that have done something similar |

#### 1.4 Competitive Analysis Form

| Field | Type | Required | Details |
|-------|------|----------|---------|
| **Competitor(s)** | Tag input (max 3) | ✅ | Which competitors to analyze |
| **Your company/product** | Text input | ❌ | Auto-filled from user profile if available |
| **Focus area** | Chip selector | ✅ | `Product` · `Pricing` · `Go-to-Market` · `Technology` · `Talent` · `Overall` |
| **Specific questions** | Text area (3 lines) | ❌ | What do you want to know? |

#### 1.5 Market Research Form

| Field | Type | Required | Details |
|-------|------|----------|---------|
| **Market or trend** | Text input | ✅ | e.g., "AI-powered logistics" |
| **Scope** | Chip selector | ✅ | `Global` · `North America` · `Europe` · `APAC` · `Specific Region` |
| **Key questions** | Text area (3 lines) | ❌ | What specifically do you want answered? |
| **Known players** | Tag input (max 5) | ❌ | Companies already on your radar |
| **Time horizon** | Chip selector | ❌ | `Last 30 days` · `Last 90 days` · `Last 6 months` · `Last year` |

### Implementation Details

**Files to create/modify:**
```
src/app/app/intelligence/
  ├── page.tsx                    (modify — add type selector routing)
  ├── ResearchTypeSelector.tsx    (NEW — 2x2 card grid)
  ├── forms/
  │   ├── MeetingPrepForm.tsx     (NEW — replaces old IntelligenceForm)
  │   ├── BusinessCaseForm.tsx    (NEW)
  │   ├── CompetitiveAnalysisForm.tsx (NEW)
  │   ├── MarketResearchForm.tsx  (NEW)
  │   └── shared/
  │       ├── TagInput.tsx        (NEW — reusable tag input component)
  │       ├── ChipSelector.tsx    (NEW — reusable chip selector)
  │       ├── AIRefineButton.tsx  (NEW — goal refinement button)
  │       └── FormSection.tsx     (NEW — consistent field layout)
  ├── types.ts                   (modify — add research types + per-type request schemas)
  └── constants.ts               (NEW — presets, placeholders, meeting types)
```

**Type Definitions:**
```typescript
type ResearchType = 'meeting_prep' | 'business_case' | 'competitive_analysis' | 'market_research'

interface MeetingPrepInput {
  researchType: 'meeting_prep'
  accountName: string
  meetingType: 'customer' | 'partner' | 'reseller' | 'investor' | 'board' | 'internal' | 'other'
  goal: string
  website?: string
  attendees?: AttendeeInput[]
  context?: string
  competitors?: string[]
}

interface AttendeeInput {
  name: string
  linkedinUrl?: string
}

interface BusinessCaseInput {
  researchType: 'business_case'
  initiativeName: string
  hypothesis: string
  targetMarket?: string
  successMetrics?: string[]
  keyQuestions?: string
  comparableCompanies?: string[]
}

interface CompetitiveAnalysisInput {
  researchType: 'competitive_analysis'
  competitors: string[]
  yourCompany?: string
  focusArea: 'product' | 'pricing' | 'gtm' | 'technology' | 'talent' | 'overall'
  specificQuestions?: string
}

interface MarketResearchInput {
  researchType: 'market_research'
  marketOrTrend: string
  scope: 'global' | 'north_america' | 'europe' | 'apac' | 'specific_region'
  keyQuestions?: string
  knownPlayers?: string[]
  timeHorizon?: '30d' | '90d' | '6m' | '1y'
}

type IntelligenceInput = MeetingPrepInput | BusinessCaseInput | CompetitiveAnalysisInput | MarketResearchInput
```

### Acceptance Criteria — Phase 1

| # | Criterion | Test |
|---|-----------|------|
| 1.1 | Research type selector renders 4 cards | Visual: all 4 types visible |
| 1.2 | Clicking a card shows the correct per-type form | Click each card → correct fields appear |
| 1.3 | Required fields prevent submission when empty | Try submit with blank required → error shown |
| 1.4 | Tag input allows add/remove (attendees, competitors, metrics) | Add 3 tags, remove 1, verify state |
| 1.5 | Chip selector allows single selection | Click chips, verify only one active |
| 1.6 | AI Refine button sends goal to API and updates field | Click refine → loading → refined text appears |
| 1.7 | Form state persists when switching research type | Fill form A, switch to B, switch back → A state preserved |
| 1.8 | Mobile layout stacks correctly | Viewport 375px → forms stack vertically |
| 1.9 | LinkedIn URL in attendee field extracts name display | Paste LinkedIn URL → shows extracted name |
| 1.10 | Submit sends correct payload shape per research type | Check network tab → correct discriminated union |

---

## Phase 2 — Search Orchestration

### Goal
Build a research engine that dispatches targeted searches per research type, fuses results with user profile data, and streams progress to the client via SSE.

### 2.1 User Profile Fetcher

Fetch from Supabase on every intelligence request:

```typescript
interface UserProfileContext {
  // From user_settings
  profilePassage: string | null
  
  // From users table
  industry: string | null
  role: string | null
  companyName: string | null
  
  // Top 15 influence dimensions (sorted by weight)
  dimensions: Array<{
    category: string      // 'company', 'topic', 'regulator', etc.
    value: string         // 'Tesla', 'AI Regulation', etc.
    weight: number
    consequenceChain: string
    relationship: string  // 'competitor', 'customer', etc.
  }>
  
  // User location (for regional context)
  location: {
    country: string | null
    region: string | null
    city: string | null
  }
}
```

**Query**: Service role Supabase client → join `users`, `user_settings`, `pro_influence_dimensions` (top 15 by weight, is_active=true).

### 2.2 Research Plan Builder (Per Type)

Each research type generates different search plans:

**Meeting Prep searches:**
| Search | Provider | When | Timeout |
|--------|----------|------|---------|
| Company snapshot | Exa | Always | 20s |
| Company news (lookback) | Exa | Always | 10s |
| Real-time news | Tavily | Always | 10s |
| Website extraction | Tavily | If website provided | 10s |
| Person search (per attendee) | Exa | If attendees provided | 10s each |
| Competitor search (per competitor) | Exa | If competitors provided | 10s each |

**Business Case searches:**
| Search | Provider | When | Timeout |
|--------|----------|------|---------|
| Initiative/market news | Exa | Always | 10s |
| Market validation data | Tavily (advanced) | Always | 10s |
| Comparable company research | Exa | If comparables provided | 10s each |
| Industry trend data | Exa | Always | 10s |
| Success metric benchmarks | Tavily | If metrics provided | 10s |

**Competitive Analysis searches:**
| Search | Provider | When | Timeout |
|--------|----------|------|---------|
| Competitor snapshot (each) | Exa | Always | 20s each |
| Competitor recent news (each) | Exa | Always | 10s each |
| Competitor website extract (each) | Tavily | If URL found in snapshot | 10s each |
| Head-to-head comparison news | Tavily | If your company provided | 10s |
| Industry/market context | Exa | Always | 10s |

**Market Research searches:**
| Search | Provider | When | Timeout |
|--------|----------|------|---------|
| Market overview | Exa | Always | 20s |
| Recent market news | Exa + Tavily | Always | 10s each |
| Known player snapshots | Exa | If players provided | 10s each |
| Analyst reports / research | Tavily (advanced) | Always | 10s |
| Regional/scope-specific data | Exa | If scope != global | 10s |

### 2.3 SSE Progress Streaming

Instead of a loading spinner, stream search progress in real-time:

```typescript
// API sends events:
{ event: 'phase', data: { phase: 'profile', status: 'complete', ms: 120 } }
{ event: 'phase', data: { phase: 'company_snapshot', status: 'complete', ms: 850 } }
{ event: 'phase', data: { phase: 'news_search', status: 'complete', ms: 1200, resultCount: 12 } }
{ event: 'phase', data: { phase: 'attendee_search', status: 'complete', ms: 2100, resultCount: 3 } }
{ event: 'phase', data: { phase: 'synthesis', status: 'running' } }
{ event: 'phase', data: { phase: 'synthesis', status: 'complete', ms: 8500 } }
{ event: 'result', data: { brief: IntelligenceBriefV3 } }
```

Frontend shows a vertical progress tracker with live checkmarks.

### 2.4 Evidence Normalization

All search results normalized into:

```typescript
interface NormalizedEvidence {
  id: string           // s1, s2, ...
  url: string
  title: string
  text: string         // Extracted content / summary
  domain: string
  publishedAt: string | null
  provider: 'exa' | 'tavily' | 'internal'
  imageUrl?: string    // If available from search result
  category: 'news' | 'company_info' | 'person' | 'market_data' | 'product' | 'financial'
  relevanceScore?: number
}
```

### Implementation Details

**Files to create/modify:**
```
src/lib/intelligence/
  ├── index.ts                (modify — add V3 orchestrator with SSE)
  ├── types.ts                (modify — add V3 types, UserProfileContext)
  ├── profile-fetcher.ts      (NEW — fetch user profile + dimensions from Supabase)
  ├── research-plan.ts        (modify — add per-type plan builders)
  ├── normalize.ts            (modify — add image extraction, category tagging)
  ├── providers/
  │   ├── exa.ts              (modify — add business case + market searches)
  │   └── tavily.ts           (modify — add advanced search modes)
  └── sse-stream.ts           (NEW — SSE response builder)

src/app/api/intelligence/
  ├── v3/route.ts             (NEW — V3 endpoint with SSE support)
  └── refine-goal/route.ts    (NEW — AI goal refinement endpoint)
```

### Acceptance Criteria — Phase 2

| # | Criterion | Test |
|---|-----------|------|
| 2.1 | User profile (passage + dimensions) fetched for authenticated user | Log profile data for test user → non-empty |
| 2.2 | Meeting prep dispatches ≥3 parallel searches | Check timing: searches run concurrently, not sequentially |
| 2.3 | Business case dispatches market + comparable searches | Submit business case → log shows correct search queries |
| 2.4 | Competitive analysis dispatches per-competitor snapshot + news | 2 competitors → ≥4 searches dispatched |
| 2.5 | SSE events stream in real-time to frontend | Open DevTools → EventSource shows progressive events |
| 2.6 | Partial search failure doesn't crash request | Kill Tavily API key → Exa results still returned |
| 2.7 | Evidence includes image URLs when available | Check normalized evidence → imageUrl populated for news items |
| 2.8 | Total search phase completes in <15s for meeting prep | Time from request to synthesis start ≤15s |
| 2.9 | User dimensions included in synthesis payload | Log synthesis input → dimensions array present |
| 2.10 | Profile passage included in synthesis payload | Log synthesis input → profilePassage string present |

---

## Phase 3 — LLM Synthesis Engine

### Goal
Build type-specific synthesis prompts that use the full context (search results + user profile + dimensions) to produce structured, citation-linked output tailored to each research type.

### 3.1 Profile-Aware System Prompt

```
You are an intelligence analyst at Relevant, preparing a {researchType} brief for a professional.

## About the User
{profilePassage}

## User's Influence Dimensions (ranked by importance)
{dimensions.map(d => `- ${d.value} (${d.category}, ${d.relationship}): ${d.consequenceChain}`)}

## User's Context
- Role: {role}
- Industry: {industry}
- Company: {companyName}
- Location: {location}

## Instructions
Synthesize the evidence into a structured intelligence brief.
Tailor your analysis to this specific user — what matters to a {role} in {industry} is different from what matters to others.
Connect findings to the user's known dimensions and consequence chains where relevant.
Every claim must cite a source by ID (e.g., s1, s2).
Tag each bullet as 'fact' (directly from source) or 'inference' (your analysis).
If evidence is thin, say so. Never fabricate.
Return ONLY valid JSON matching the schema below.
```

### 3.2 Per-Type Output Schemas

**Meeting Prep Output:**
```typescript
interface MeetingPrepSynthesis {
  headline: string              // "3 things to know before your call with Acme"
  bottomLine: string            // 1-2 sentence summary
  confidence: 'high' | 'medium' | 'low'
  
  companyIntel: {
    snapshot: CompanySnapshot   // Structured company data
    recentMoves: BriefBullet[]  // What they've been doing lately
  }
  
  attendeeProfiles: AttendeeProfile[]  // Per-person context
  
  sections: {
    talkingPoints: BriefBullet[]       // Specific conversation openers
    landmines: BriefBullet[]           // Topics to avoid or handle carefully
    questionsToAsk: BriefBullet[]      // Smart, specific questions
    opportunitySignals: BriefBullet[]  // Potential deal / partnership openings
    competitorContext: BriefBullet[]   // If competitors provided
  }
  
  relevanceToYou: string  // 2-3 sentences: why this meeting matters given YOUR profile
}
```

**Business Case Output:**
```typescript
interface BusinessCaseSynthesis {
  headline: string
  verdict: 'strong_case' | 'moderate_case' | 'weak_case' | 'insufficient_data'
  confidence: 'high' | 'medium' | 'low'
  
  sections: {
    marketValidation: BriefBullet[]      // Evidence the market exists/wants this
    proofPoints: BriefBullet[]           // Data points supporting the hypothesis
    riskFactors: BriefBullet[]           // What could go wrong
    comparableCases: BriefBullet[]       // What similar initiatives looked like
    metricsFramework: BriefBullet[]      // How to measure success
    recommendedNextSteps: BriefBullet[]  // What to do with this research
  }
  
  keyMetrics: Array<{
    label: string       // "TAM Estimate", "Competitor Growth Rate"
    value: string       // "$4.2B", "32% YoY"
    sourceId: string
    trend?: 'up' | 'down' | 'stable'
  }>
  
  relevanceToYou: string
}
```

**Competitive Analysis Output:**
```typescript
interface CompetitiveAnalysisSynthesis {
  headline: string
  threatLevel: 'high' | 'medium' | 'low'
  confidence: 'high' | 'medium' | 'low'
  
  competitors: Array<{
    name: string
    snapshot: CompanySnapshot
    recentMoves: BriefBullet[]
    strengths: BriefBullet[]
    weaknesses: BriefBullet[]
  }>
  
  sections: {
    positioningGaps: BriefBullet[]       // Where you differ
    featureComparison: BriefBullet[]     // Product feature gaps/leads
    marketPerception: BriefBullet[]      // Customer sentiment / reviews
    emergingThreats: BriefBullet[]       // New entrants, pivots
    yourAdvantages: BriefBullet[]        // Where you win
    recommendedActions: BriefBullet[]    // What to do
  }
  
  relevanceToYou: string
}
```

**Market Research Output:**
```typescript
interface MarketResearchSynthesis {
  headline: string
  marketHealth: 'growing' | 'stable' | 'declining' | 'emerging'
  confidence: 'high' | 'medium' | 'low'
  
  sections: {
    marketOverview: BriefBullet[]        // What this market is
    keyPlayers: BriefBullet[]            // Who's in it
    trendEvidence: BriefBullet[]         // What's changing
    opportunities: BriefBullet[]         // Where to play
    risks: BriefBullet[]                 // What to watch out for
    timelineEvents: Array<{             // Timeline of key events
      date: string
      event: string
      sourceId: string
      impact: 'positive' | 'negative' | 'neutral'
    }>
  }
  
  keyMetrics: Array<{
    label: string
    value: string
    sourceId: string
    trend?: 'up' | 'down' | 'stable'
  }>
  
  relevanceToYou: string
}
```

### 3.3 LLM Configuration

```typescript
const MODEL_CANDIDATES = [
  { provider: 'gemini',     model: 'gemini-2.5-flash',     timeout: 60_000 },
  { provider: 'gemini',     model: 'gemini-2.0-flash',     timeout: 45_000 },
  { provider: 'openrouter', model: 'google/gemini-2.5-flash', timeout: 60_000 },
  { provider: 'openrouter', model: 'anthropic/claude-sonnet-4', timeout: 60_000 },
]
```

- Try models in order; skip on auth failure (401/403)
- Strip markdown fences before JSON.parse
- Validate output against expected schema
- If all models fail → return degraded brief with empty sections + sources

### Implementation Details

**Files to create/modify:**
```
src/lib/intelligence/
  ├── synthesize.ts             (major rewrite — per-type prompts, profile-aware)
  ├── prompts/
  │   ├── system-prompt.ts      (NEW — shared system prompt builder)
  │   ├── meeting-prep.ts       (NEW — meeting prep user prompt + schema)
  │   ├── business-case.ts      (NEW — business case user prompt + schema)
  │   ├── competitive.ts        (NEW — competitive analysis user prompt + schema)
  │   └── market-research.ts    (NEW — market research user prompt + schema)
  └── types.ts                  (modify — add V3 output types)
```

### Acceptance Criteria — Phase 3

| # | Criterion | Test |
|---|-----------|------|
| 3.1 | Meeting prep synthesis includes profile_passage in LLM prompt | Log prompt → contains user's passage |
| 3.2 | Synthesis output matches expected schema per research type | Parse response → all required fields present |
| 3.3 | Every bullet has at least one sourceId | Validate all bullets → sourceIds.length ≥ 1 |
| 3.4 | `relevanceToYou` references user's actual dimensions | Read output → mentions user's role/industry/dimensions |
| 3.5 | Business case returns keyMetrics array with ≥1 metric | Submit business case → keyMetrics populated |
| 3.6 | Competitive analysis returns per-competitor breakdown | 2 competitors → 2 entries in competitors array |
| 3.7 | Market research returns timelineEvents | Submit market research → timeline has ≥2 events |
| 3.8 | Degraded mode returns sources even when synthesis fails | Kill LLM key → still get sources + degraded flag |
| 3.9 | Model fallback works: fail primary → succeed on secondary | Block Gemini key → OpenRouter succeeds |
| 3.10 | Synthesis completes in <30s for typical request | Time synthesis phase → ≤30s |

---

## Phase 4 — Intelligence Dashboard UI

### Goal
Build a polished, visual, skimmable intelligence dashboard that feels like a premium product — not a wall of text.

### 4.1 Dashboard Layout (Meeting Prep)

```
┌─────────────────────────────────────────────────────────────┐
│  🟢 HIGH CONFIDENCE                    Generated 2m ago     │
│                                                             │
│  ╔═══════════════════════════════════════════════════════╗  │
│  ║  3 things to know before your call with Acme Corp    ║  │
│  ║                                                       ║  │
│  ║  Acme just closed a $50M Series C and is expanding   ║  │
│  ║  into APAC — your logistics platform solves their    ║  │
│  ║  #1 scaling bottleneck.                              ║  │
│  ╚═══════════════════════════════════════════════════════╝  │
│                                                             │
│  ┌──────── WHY THIS MATTERS TO YOU ────────┐               │
│  │ As a VP of Sales at LogiTech, Acme's     │               │
│  │ expansion aligns with 3 of your active   │               │
│  │ influence dimensions: APAC logistics,    │               │
│  │ enterprise SaaS, supply chain automation. │               │
│  └──────────────────────────────────────────┘               │
│                                                             │
│  ┌─── COMPANY INTEL ───┐  ┌──── KEY PEOPLE ─────┐         │
│  │ Acme Corp            │  │ 👤 Jane Smith        │         │
│  │ Industry: Logistics  │  │   CEO, Acme Corp     │         │
│  │ HQ: San Francisco    │  │   Ex-Amazon, 15yr    │         │
│  │ Employees: 450       │  │   supply chain exp.  │         │
│  │ Funding: $80M total  │  │                      │         │
│  │ CEO: Jane Smith      │  │ 👤 Bob Chen          │         │
│  │ Latest: Series C     │  │   VP Eng, Acme Corp  │         │
│  │   closed Mar 2026    │  │   Built infra at     │         │
│  └──────────────────────┘  │   Stripe + Uber      │         │
│                            └──────────────────────┘         │
│                                                             │
│  ┌────────────── RECENT MOVES ──────────────┐              │
│  │ 🟢 Closed $50M Series C led by A16Z [s1] │              │
│  │ 🟢 Opened Singapore office [s2]           │              │
│  │ 🟡 Key engineer departure to rival [s4]   │              │
│  └───────────────────────────────────────────┘              │
│                                                             │
│  ┌─── TALKING POINTS ──┐  ┌──── LANDMINES ──────┐         │
│  │ • Mention their APAC│  │ ⚠️ Their VP Eng left │         │
│  │   expansion — shows │  │   2 weeks ago. Don't │         │
│  │   you did homework  │  │   bring up team      │         │
│  │   [s2] fact         │  │   stability. [s4]    │         │
│  │                     │  │                      │         │
│  │ • Reference A16Z    │  │ ⚠️ They're evaluating│         │
│  │   round as vote of  │  │   a competitor. Don't│         │
│  │   confidence [s1]   │  │   badmouth. [s5]     │         │
│  └─────────────────────┘  └──────────────────────┘         │
│                                                             │
│  ┌────────── QUESTIONS TO ASK ──────────────┐              │
│  │ ? "How is the APAC rollout affecting     │              │
│  │    your logistics stack decisions?" [s2]  │              │
│  │                                          │              │
│  │ ? "With Series C closed, what's the      │              │
│  │    #1 infrastructure bet this quarter?"  │              │
│  │    [s1] inference                        │              │
│  └──────────────────────────────────────────┘              │
│                                                             │
│  ┌───────── OPPORTUNITY SIGNALS ────────────┐              │
│  │ 💡 Their APAC expansion = $2-5M deal     │              │
│  │    potential for logistics automation     │              │
│  │    [s2, s3] inference                    │              │
│  └──────────────────────────────────────────┘              │
│                                                             │
│  ┌──────────── SOURCES (12) ────────────────┐              │
│  │ [s1] TechCrunch  [s2] Reuters  [s3] ...  │  ◀──── ▶    │
│  └──────────────────────────────────────────┘              │
│                                                             │
│  ┌────────────── ACTIONS ───────────────────┐              │
│  │  📋 Copy Brief  │  📥 Download  │  💬 Chat│              │
│  └──────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Dashboard Layout (Business Case)

```
┌─────────────────────────────────────────────────────────────┐
│  VERDICT: STRONG CASE 🟢          Generated 5m ago          │
│                                                             │
│  ╔══════════════════════════════════════════════════════╗   │
│  ║  Weekend delivery shows strong market signals with   ║   │
│  ║  3 comparable successes and growing consumer demand  ║   │
│  ╚══════════════════════════════════════════════════════╝   │
│                                                             │
│  ┌──── KEY METRICS ─────────────────────────────────┐      │
│  │  $4.2B          32% YoY         78%              │      │
│  │  TAM ↗          Growth ↗        Retention ↗      │      │
│  │  [s1]           [s3]            [s5]             │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│  ┌─ MARKET VALIDATION ─┐  ┌── PROOF POINTS ────────┐      │
│  │ ...                  │  │ ...                     │      │
│  └──────────────────────┘  └─────────────────────────┘      │
│                                                             │
│  ┌── RISK FACTORS ─────┐  ┌── COMPARABLE CASES ────┐      │
│  │ ...                  │  │ ...                     │      │
│  └──────────────────────┘  └─────────────────────────┘      │
│                                                             │
│  ┌─── RECOMMENDED NEXT STEPS ──────────────────────┐      │
│  │ ...                                              │      │
│  └──────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Dashboard Layout (Competitive Analysis)

```
┌─────────────────────────────────────────────────────────────┐
│  THREAT LEVEL: MEDIUM 🟡           Generated 3m ago         │
│                                                             │
│  ╔══════════════════════════════════════════════════════╗   │
│  ║  Competitor X is gaining in mid-market but your     ║   │
│  ║  enterprise moat remains strong                     ║   │
│  ╚══════════════════════════════════════════════════════╝   │
│                                                             │
│  ┌──── COMPETITOR: Acme ────┐  ┌── COMPETITOR: Beta ──┐   │
│  │ Industry: SaaS           │  │ Industry: SaaS        │   │
│  │ Employees: 200           │  │ Employees: 80         │   │
│  │ Recent: Launched V2      │  │ Recent: Raised $10M   │   │
│  │                          │  │                       │   │
│  │ Strengths:               │  │ Strengths:            │   │
│  │ • Better onboarding [s1] │  │ • Lower price [s4]    │   │
│  │                          │  │                       │   │
│  │ Weaknesses:              │  │ Weaknesses:           │   │
│  │ • No enterprise SSO [s2] │  │ • Scaling issues [s5] │   │
│  └──────────────────────────┘  └───────────────────────┘   │
│                                                             │
│  ┌─ POSITIONING GAPS ──┐  ┌── YOUR ADVANTAGES ─────┐      │
│  │ ...                  │  │ ...                     │      │
│  └──────────────────────┘  └─────────────────────────┘      │
│                                                             │
│  ┌── EMERGING THREATS ─┐  ┌── RECOMMENDED ACTIONS ──┐     │
│  │ ...                  │  │ ...                      │     │
│  └──────────────────────┘  └──────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### 4.4 Dashboard Layout (Market Research)

```
┌─────────────────────────────────────────────────────────────┐
│  MARKET: GROWING 📈                Generated 4m ago         │
│                                                             │
│  ╔══════════════════════════════════════════════════════╗   │
│  ║  AI-powered logistics is a $12B market growing 40%  ║   │
│  ║  YoY with consolidation expected in 18 months       ║   │
│  ╚══════════════════════════════════════════════════════╝   │
│                                                             │
│  ┌──── KEY METRICS ─────────────────────────────────┐      │
│  │  $12B           40% YoY         23              │      │
│  │  Market Size ↗  Growth ↗        Key Players     │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│  ┌────────────── TIMELINE ──────────────────────────┐      │
│  │  ●── Jan 2026: FedEx acquires AutoRoute ($2B)    │      │
│  │  │                                               │      │
│  │  ●── Mar 2026: EU passes logistics AI regs       │      │
│  │  │                                               │      │
│  │  ●── Apr 2026: Series B wave — 4 startups raise  │      │
│  └──────────────────────────────────────────────────┘      │
│                                                             │
│  ┌─ KEY PLAYERS ───────┐  ┌── TREND EVIDENCE ──────┐      │
│  │ ...                  │  │ ...                     │      │
│  └──────────────────────┘  └─────────────────────────┘      │
│                                                             │
│  ┌── OPPORTUNITIES ────┐  ┌── RISKS ───────────────┐      │
│  │ ...                  │  │ ...                     │      │
│  └──────────────────────┘  └─────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 4.5 Shared UI Components

| Component | Purpose | Visual |
|-----------|---------|--------|
| `DashboardHeader` | Confidence badge + headline + bottom line + timestamp | Hero slab (DESIGN.md) |
| `RelevanceCallout` | "Why this matters to YOU" personalized box | Accent-teal carved well |
| `MetricsRow` | Key metrics with trend arrows | Stat islands (bold number + label + trend) |
| `BentoPanel` | Reusable section card with icon + title + bullet list | Carved well with icon |
| `BulletItem` | Individual bullet with source tags + fact/inference badge | Inline teal/violet chips |
| `CompanyCard` | Company snapshot (structured grid) | Two-column grid in carved well |
| `PersonCard` | Attendee/person profile | Avatar placeholder + name + title + background |
| `TimelineStrip` | Vertical timeline with impact-colored dots | Green/red/gray dots on vertical line |
| `SourceCarousel` | Horizontal scrolling source cards | Cards with domain favicon + title + date |
| `ActionBar` | Copy / Download / Chat / Share buttons | Bottom fixed bar |
| `ProgressTracker` | SSE-powered live search progress | Vertical checklist with animated checks |

### 4.6 Design Tokens (from DESIGN.md)

```css
/* Panel types */
.hero-slab       { border-radius: 20px; padding: 32px; background: var(--surface-strong); }
.carved-well     { border-radius: 16px; padding: 24px; background: var(--surface); border: 1px solid var(--border); }
.stat-island     { border-radius: 12px; padding: 16px; background: var(--surface); text-align: center; }

/* Bullet tags */
.tag-fact        { background: var(--accent-teal); color: var(--bg); border-radius: 4px; padding: 2px 6px; }
.tag-inference   { background: var(--accent-violet); color: var(--bg); border-radius: 4px; padding: 2px 6px; }
.tag-warning     { background: var(--accent-coral); color: var(--bg); border-radius: 4px; padding: 2px 6px; }

/* Confidence badges */
.confidence-high   { color: var(--accent-teal); }
.confidence-medium { color: var(--accent-amber); }
.confidence-low    { color: var(--accent-coral); }

/* Trend arrows */
.trend-up    { color: var(--accent-teal); }
.trend-down  { color: var(--accent-coral); }
.trend-stable{ color: var(--text-muted); }
```

### Implementation Details

**Files to create/modify:**
```
src/app/app/intelligence/
  ├── page.tsx                        (modify — route to V3 dashboard)
  ├── IntelligenceDashboard.tsx       (NEW — main dashboard container)
  ├── dashboard/
  │   ├── DashboardHeader.tsx         (NEW)
  │   ├── RelevanceCallout.tsx        (NEW)
  │   ├── MetricsRow.tsx              (NEW)
  │   ├── BentoPanel.tsx              (NEW — generic section panel)
  │   ├── BulletItem.tsx              (NEW)
  │   ├── CompanyCard.tsx             (NEW)
  │   ├── PersonCard.tsx              (NEW)
  │   ├── TimelineStrip.tsx           (NEW)
  │   ├── SourceCarousel.tsx          (NEW — replaces IntelligenceSources)
  │   ├── ActionBar.tsx               (NEW)
  │   └── ProgressTracker.tsx         (NEW — SSE progress display)
  ├── layouts/
  │   ├── MeetingPrepLayout.tsx       (NEW — meeting prep result layout)
  │   ├── BusinessCaseLayout.tsx      (NEW)
  │   ├── CompetitiveLayout.tsx       (NEW)
  │   └── MarketResearchLayout.tsx    (NEW)
  └── styles/
      └── dashboard.module.css        (NEW — dashboard-specific styles)
```

### Acceptance Criteria — Phase 4

| # | Criterion | Test |
|---|-----------|------|
| 4.1 | Meeting prep dashboard shows all 7 panels (header, relevance, company, people, talking, landmines, questions) | Visual check: all panels render with real data |
| 4.2 | Business case dashboard shows key metrics with trend arrows | Verify metrics row renders ≥1 metric with trend icon |
| 4.3 | Competitive analysis shows per-competitor cards | 2 competitors → 2 competitor cards with strengths/weaknesses |
| 4.4 | Market research shows timeline with colored dots | Timeline renders ≥2 events with correct impact colors |
| 4.5 | Source citations are clickable and link to correct source | Click [s1] → opens correct URL |
| 4.6 | Fact/inference tags render with correct colors | Teal for facts, violet for inferences |
| 4.7 | Progress tracker shows live SSE updates | During search: checkmarks appear as phases complete |
| 4.8 | Dashboard is responsive (mobile: 375px, tablet: 768px, desktop: 1200px+) | All 3 breakpoints render correctly |
| 4.9 | RelevanceCallout mentions user's actual role/industry | Text references user's profile data |
| 4.10 | Images from search results display when available | If evidence has imageUrl → image renders in panel |
| 4.11 | Empty sections are hidden (not shown as empty cards) | If no competitorContext → that panel doesn't render |
| 4.12 | Degraded mode shows alert banner + raw sources | Kill LLM → banner appears + sources visible |

---

## Phase 5 — Follow-Up Chat & Actions

### Goal
Let the user interact with their synthesized intelligence: ask follow-up questions, copy/share the brief, and download it.

### 5.1 Follow-Up Chat

After the dashboard renders, a collapsible chat panel at the bottom:

```
┌────────────────────────────────────────────────────┐
│  💬 Ask a follow-up question about this brief      │
│  ┌──────────────────────────────────────────────┐  │
│  │ "What's the biggest risk if I don't mention  │  │
│  │  the Series C in our call?"                  │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  The biggest risk is appearing uninformed. Acme's  │
│  Series C [s1] was widely covered — their team     │
│  will expect you to know about it. Not mentioning  │
│  it signals low preparation effort.                │
│                                                    │
│  ┌──────────────────────────────────────── Send ┐  │
│  │ Type your question...                        │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

**Implementation:**
- Chat context = full synthesis output + all evidence + user profile
- Uses same LLM (Gemini/OpenRouter) with system prompt: "You are continuing a conversation about this intelligence brief. Answer based only on the evidence provided. Cite sources."
- Max 10 follow-up turns per session
- Each turn sent to `/api/intelligence/chat`

### 5.2 Action Bar

| Action | Implementation | Details |
|--------|---------------|---------|
| **Copy Brief** | Clipboard API | Converts dashboard to clean markdown (headline + bullets + sources) |
| **Download PDF** | html2canvas + jsPDF (or server-side) | Renders dashboard to PDF with proper formatting |
| **Share Link** | Generates shareable URL | Requires persistence (Phase 6). URL: `/signal/{briefId}` |
| **Email to Team** | Mailto link with pre-populated body | Subject: "Intel Brief: {accountName}" + markdown body |

### Implementation Details

**Files to create:**
```
src/app/app/intelligence/
  ├── ChatPanel.tsx               (NEW — follow-up chat component)
  ├── dashboard/ActionBar.tsx     (NEW — action buttons)
  └── utils/
      ├── brief-to-markdown.ts    (NEW — converts brief to copyable markdown)
      └── brief-to-pdf.ts         (NEW — PDF generation)

src/app/api/intelligence/
  └── chat/route.ts               (NEW — follow-up chat API)
```

### Acceptance Criteria — Phase 5

| # | Criterion | Test |
|---|-----------|------|
| 5.1 | Chat panel opens on click | Click "Chat" → panel slides open |
| 5.2 | Follow-up question returns relevant answer with citations | Ask question → response cites [s1] etc. |
| 5.3 | Chat context includes full synthesis + evidence | Log chat prompt → contains all brief data |
| 5.4 | Copy Brief puts clean markdown on clipboard | Click Copy → paste elsewhere → clean formatted text |
| 5.5 | Download PDF generates readable document | Click Download → PDF opens with all sections |
| 5.6 | Email to Team opens mailto with pre-populated content | Click Email → mail client opens with subject + body |
| 5.7 | Chat limited to 10 turns | After 10 messages → "limit reached" message |

---

## Phase 6 — Persistence & History

### Goal
Save intelligence briefs to the database so users can revisit, share, and build on previous research.

### 6.1 Database Tables

See [Database Schema](#database-schema) section below for full DDL.

### 6.2 History Page

```
┌─────────────────────────────────────────────────────┐
│  Your Intelligence Briefs                           │
│                                                     │
│  ┌─ Today ──────────────────────────────────────┐   │
│  │ 📋 Meeting Prep: Acme Corp          10m ago  │   │
│  │    Sales call • High confidence               │   │
│  │                                               │   │
│  │ 📊 Business Case: Weekend Delivery   2h ago  │   │
│  │    Strong case • 3 proof points               │   │
│  └───────────────────────────────────────────────┘   │
│                                                     │
│  ┌─ Yesterday ──────────────────────────────────┐   │
│  │ ⚔️ Competitive: Acme vs Beta         1d ago  │   │
│  │    Medium threat • 2 competitors              │   │
│  └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 6.3 Brief Sharing

- Public share URL: `/signal/{briefId}` (read-only, no auth required)
- Share toggle on ActionBar: "Make shareable" → generates public link
- Shared view: same dashboard layout, no chat, no actions except copy

### Implementation Details

**Files to create:**
```
src/app/app/intelligence/
  ├── history/page.tsx            (NEW — history list page)
  └── [briefId]/page.tsx          (NEW — reload saved brief)

src/app/signal/
  └── [briefId]/page.tsx          (NEW — public share view)

src/app/api/intelligence/
  ├── history/route.ts            (NEW — list user's briefs)
  └── [briefId]/
      ├── route.ts                (NEW — get/update brief)
      └── share/route.ts          (NEW — toggle share, get public link)

supabase/migrations/
  └── YYYYMMDDHHMMSS_intelligence_briefs.sql  (NEW — tables)
```

### Acceptance Criteria — Phase 6

| # | Criterion | Test |
|---|-----------|------|
| 6.1 | Brief saved to DB after generation | Check `intelligence_briefs` table → row exists |
| 6.2 | History page lists user's briefs in reverse chronological order | Generate 2 briefs → history shows both, newest first |
| 6.3 | Clicking a history item loads the full dashboard | Click item → dashboard renders with saved data |
| 6.4 | Share toggle generates public URL | Toggle share → URL appears, copy works |
| 6.5 | Public share URL shows read-only dashboard | Visit `/signal/{id}` without auth → dashboard renders |
| 6.6 | Briefs are user-scoped (RLS) | User A cannot see User B's briefs |
| 6.7 | Deleted brief returns 404 | Delete brief → URL returns 404 |

---

## Phase 7 — Polish & Hardening

### Goal
Production-ready quality: error handling, caching, rate limiting, monitoring, and mobile responsiveness.

### 7.1 Error Handling

| Scenario | Behavior |
|----------|----------|
| Exa API down | Skip Exa results, continue with Tavily. Show "Some sources unavailable" badge |
| Tavily API down | Skip Tavily, continue with Exa. Show badge |
| Both search APIs down | Show error: "Search is temporarily unavailable. Try again in a few minutes." |
| LLM synthesis fails | Show degraded mode: raw evidence + sources, no synthesis panels |
| LLM returns invalid JSON | Retry once with "Your previous response was invalid JSON. Return ONLY valid JSON." |
| User not authenticated | Redirect to login |
| Rate limit exceeded | Show "You've reached the limit. Try again in {seconds}s." |
| Network timeout | Show "Request timed out. Try again." with retry button |

### 7.2 Caching

| Cache Level | What | TTL | Storage |
|-------------|------|-----|---------|
| Company snapshot | Exa structured data | 24 hours | Supabase table |
| Search results | Exa + Tavily results | 1 hour | In-memory (per-process) |
| Full brief | Complete synthesis | Permanent | Supabase table |

### 7.3 Rate Limiting

| Tier | Limit | Window |
|------|-------|--------|
| Free | 5 briefs/day | 24h rolling |
| Pro | 30 briefs/day | 24h rolling |
| API | 60 requests/min | Per-minute bucket |

### 7.4 Monitoring

- Log all intelligence requests to `pro_ai_usage` table (model, tokens, latency)
- Track degraded briefs rate
- Alert if degraded rate > 20% in 15-minute window

### 7.5 Mobile Responsiveness

All dashboard panels stack vertically on mobile. Metrics row becomes 1-column. Source carousel scrolls horizontally. Action bar becomes full-width fixed bottom.

### Acceptance Criteria — Phase 7

| # | Criterion | Test |
|---|-----------|------|
| 7.1 | Partial search failure shows badge, not crash | Kill Exa key → Tavily results still show + badge |
| 7.2 | Rate limit shows clear message with cooldown timer | Hit limit → message with countdown appears |
| 7.3 | Invalid LLM JSON triggers retry | Mock invalid response → retry succeeds |
| 7.4 | All panels stack correctly on 375px viewport | Resize to mobile → no horizontal overflow |
| 7.5 | Usage logged to pro_ai_usage | Generate brief → row appears in pro_ai_usage |
| 7.6 | Company snapshot cache prevents duplicate Exa calls | Same company within 24h → no Exa call (cache hit) |
| 7.7 | Error state shows retry button | Cause error → retry button visible and functional |

---

## Database Schema

### New Tables

```sql
-- Intelligence briefs (persisted results)
CREATE TABLE intelligence_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Research type discriminator
  research_type TEXT NOT NULL CHECK (research_type IN (
    'meeting_prep', 'business_case', 'competitive_analysis', 'market_research'
  )),
  
  -- Input (stored for replay/history)
  request_payload JSONB NOT NULL,  -- The full typed input
  
  -- Output
  synthesis JSONB NOT NULL,         -- Full synthesis output (per-type schema)
  sources JSONB NOT NULL,           -- BriefSource[] array
  evidence_count INT NOT NULL DEFAULT 0,
  
  -- User context at generation time (snapshot)
  user_profile_snapshot JSONB,      -- profile_passage + dimensions at generation time
  
  -- Status
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  is_degraded BOOLEAN NOT NULL DEFAULT FALSE,
  degraded_reasons TEXT[],
  
  -- Performance
  search_ms INT,
  synthesis_ms INT,
  total_ms INT,
  synthesis_model TEXT,
  
  -- Sharing
  is_shared BOOLEAN NOT NULL DEFAULT FALSE,
  shared_at TIMESTAMPTZ,
  share_slug TEXT UNIQUE,  -- Short unique slug for public URL
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for user history queries
CREATE INDEX idx_intelligence_briefs_user_created 
  ON intelligence_briefs (user_id, created_at DESC);

-- Index for public share lookups
CREATE INDEX idx_intelligence_briefs_share_slug 
  ON intelligence_briefs (share_slug) WHERE share_slug IS NOT NULL;

-- RLS: Users can only see their own briefs
ALTER TABLE intelligence_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own briefs"
  ON intelligence_briefs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own briefs"
  ON intelligence_briefs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own briefs"
  ON intelligence_briefs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Public can read shared briefs"
  ON intelligence_briefs FOR SELECT
  USING (is_shared = true AND share_slug IS NOT NULL);

-- Follow-up chat messages
CREATE TABLE intelligence_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID NOT NULL REFERENCES intelligence_briefs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  source_ids TEXT[],  -- Which sources were cited in this message
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_intelligence_chat_brief 
  ON intelligence_chat_messages (brief_id, created_at ASC);

ALTER TABLE intelligence_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own chat messages"
  ON intelligence_chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
  ON intelligence_chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Company snapshot cache
CREATE TABLE intelligence_company_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name_normalized TEXT NOT NULL,
  snapshot JSONB NOT NULL,
  source_url TEXT,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  UNIQUE (company_name_normalized)
);

CREATE INDEX idx_intelligence_company_cache_lookup
  ON intelligence_company_cache (company_name_normalized, expires_at);
```

---

## API Contracts

### POST `/api/intelligence/v3`

**Request:**
```typescript
// Discriminated union — one of:
MeetingPrepInput | BusinessCaseInput | CompetitiveAnalysisInput | MarketResearchInput
```

**Response (SSE stream):**
```typescript
// Phase events
{ event: 'phase', data: { phase: string, status: 'running' | 'complete' | 'failed', ms?: number, resultCount?: number } }

// Final result
{ event: 'result', data: IntelligenceBriefV3 }

// Error
{ event: 'error', data: { message: string, code: string } }
```

### POST `/api/intelligence/refine-goal`

**Request:**
```typescript
{ goal: string, meetingType: string, accountName: string }
```

**Response:**
```typescript
{ refined: string }
```

### POST `/api/intelligence/chat`

**Request:**
```typescript
{ briefId: string, message: string }
```

**Response:**
```typescript
{ role: 'assistant', content: string, sourceIds: string[] }
```

### GET `/api/intelligence/history`

**Response:**
```typescript
Array<{
  id: string
  researchType: ResearchType
  headline: string
  confidence: string
  createdAt: string
  accountName: string  // Extracted from request_payload
}>
```

### GET `/api/intelligence/{briefId}`

**Response:**
```typescript
IntelligenceBriefV3
```

### POST `/api/intelligence/{briefId}/share`

**Request:**
```typescript
{ shared: boolean }
```

**Response:**
```typescript
{ shareUrl: string | null }
```

---

## Visual Specification

### Color Usage by Panel Type

| Panel | Background | Border | Icon Color |
|-------|-----------|--------|------------|
| Header / Hero Slab | `--surface-strong` | none | `--accent` |
| Relevance Callout | `--accent-teal` at 8% opacity | `--accent-teal` at 20% | `--accent-teal` |
| Company Intel | `--surface` | `--border` | `--accent` |
| Key People | `--surface` | `--border` | `--accent-violet` |
| Talking Points | `--surface` | `--border` | `--accent-teal` |
| Landmines | `--surface` | `--accent-coral` at 30% | `--accent-coral` |
| Questions | `--surface` | `--border` | `--accent` |
| Opportunity Signals | `--surface` | `--accent-teal` at 30% | `--accent-teal` |
| Competitor Context | `--surface` | `--accent-amber` at 30% | `--accent-amber` |
| Key Metrics | `--surface-strong` | none | varies by trend |
| Timeline | `--surface` | `--border` | varies by impact |
| Sources | `--surface` | `--border` | `--text-muted` |

### Typography

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Headline | 24px / 1.3 | 700 | `--text` |
| Bottom Line | 16px / 1.5 | 400 | `--text-muted` |
| Section Title | 14px / 1.2 | 600 | `--text` |
| Bullet Text | 14px / 1.6 | 400 | `--text` |
| Source Tag | 11px / 1 | 500 | `--accent-teal` or `--accent-violet` |
| Metric Value | 28px / 1 | 700 | `--text` |
| Metric Label | 12px / 1.2 | 500 | `--text-muted` |
| Timeline Date | 12px / 1 | 500 | `--text-muted` |
| Timeline Event | 14px / 1.4 | 400 | `--text` |

### Spacing

| Token | Value |
|-------|-------|
| Panel gap | 16px |
| Panel padding | 24px |
| Bullet gap | 12px |
| Section title → content | 16px |
| Metrics gap | 24px |
| Source card width | 240px |

### Animations

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Panel entrance | fadeInUp (opacity 0→1, translateY 12→0) | 400ms | ease-out |
| Panel stagger | Each panel delayed +80ms | — | — |
| Progress checkmark | scale 0→1 + opacity 0→1 | 300ms | spring |
| Metric count-up | Number counts from 0 to value | 800ms | ease-out |
| Source carousel scroll | Smooth scroll | 300ms | ease-in-out |
| Chat panel expand | height 0→auto | 300ms | ease-out |

---

## Acceptance Criteria

### Global Acceptance Criteria

| # | Criterion |
|---|-----------|
| G1 | User can select a research type and fill the structured form |
| G2 | Submitting a form dispatches parallel searches and streams progress via SSE |
| G3 | User profile (passage + dimensions) is included in synthesis context |
| G4 | Synthesis output is type-specific and follows the correct schema |
| G5 | Dashboard renders the correct layout per research type |
| G6 | Every bullet has clickable source citations |
| G7 | "Relevance to you" section references user's actual profile data |
| G8 | Follow-up chat works and cites sources |
| G9 | Brief is saved to DB and appears in history |
| G10 | Public share URL works without authentication |
| G11 | Mobile layout works at 375px |
| G12 | Degraded mode works when LLM fails |
| G13 | Rate limiting prevents abuse |
| G14 | All external API calls have timeouts |

---

## Test Plan

### Phase 1 Tests

```
Test 1.1: Research Type Selection
  Given: User lands on /app/intelligence
  When:  Page loads
  Then:  4 research type cards are visible
  And:   No form is visible yet

Test 1.2: Meeting Prep Form Fields
  Given: User selects "Meeting Prep"
  When:  Form appears
  Then:  Fields visible: accountName, meetingType chips, goal, website, attendees, context, competitors
  And:   accountName and goal have required indicators
  And:   meetingType defaults to no selection

Test 1.3: Required Field Validation
  Given: User selects "Meeting Prep"
  When:  User clicks submit without filling required fields
  Then:  Error shown on accountName and goal fields
  And:   Form does not submit

Test 1.4: Tag Input (Attendees)
  Given: Meeting prep form is visible
  When:  User types "Jane Doe" and presses Enter
  Then:  "Jane Doe" appears as a tag chip
  When:  User clicks X on the tag
  Then:  Tag is removed
  When:  User adds 5 attendees and tries to add a 6th
  Then:  Input is disabled with "Max 5 attendees" message

Test 1.5: AI Refine Goal
  Given: User has typed a goal
  When:  User clicks "✨ Refine"
  Then:  Loading spinner on button
  And:   Goal text is replaced with refined version
  And:   "Undo" link appears to revert

Test 1.6: Business Case Form
  Given: User selects "Business Case"
  When:  Form appears
  Then:  Fields visible: initiativeName, hypothesis, targetMarket, successMetrics, keyQuestions, comparableCompanies
  And:   initiativeName and hypothesis are required

Test 1.7: Form State Preservation
  Given: User fills meeting prep form
  When:  User switches to "Business Case" and back to "Meeting Prep"
  Then:  Previous form data is still populated
```

### Phase 2 Tests

```
Test 2.1: Profile Fetched
  Given: Authenticated user with profile_passage and dimensions
  When:  User submits a meeting prep request
  Then:  API logs show profile_passage + ≥5 dimensions fetched

Test 2.2: Parallel Search Dispatch
  Given: Meeting prep with accountName + 2 attendees + 1 competitor
  When:  Request is submitted
  Then:  ≥6 searches dispatched in parallel (snapshot, news×2, person×2, competitor×1)
  And:   Total search time < max(individual search times) + 2s

Test 2.3: SSE Progress Events
  Given: User submits request
  When:  Searches are running
  Then:  Frontend receives phase events in order
  And:   Each phase shows running → complete transition

Test 2.4: Partial Search Failure
  Given: Exa API key is invalid
  When:  User submits request
  Then:  Tavily results still returned
  And:   Response includes degraded_reasons: ["exa_snapshot_failed"]

Test 2.5: Business Case Searches
  Given: User submits business case with 2 comparable companies
  When:  Searches dispatch
  Then:  Market search + 2 comparable searches + industry trend search fire
```

### Phase 3 Tests

```
Test 3.1: Meeting Prep Synthesis
  Given: Evidence from 12 sources + user profile
  When:  LLM synthesis runs
  Then:  Output has: headline, bottomLine, confidence, talkingPoints (≥3), landmines (≥2), questionsToAsk (≥3)
  And:   relevanceToYou mentions user's role and ≥1 dimension

Test 3.2: Business Case Synthesis
  Given: Evidence about "weekend delivery service"
  When:  LLM synthesis runs
  Then:  Output has: verdict, keyMetrics (≥1), marketValidation (≥2), proofPoints (≥2)

Test 3.3: Source Citation Integrity
  Given: Synthesis output
  When:  Checking all bullets
  Then:  Every sourceId in every bullet exists in the sources array
  And:   No sourceId references a non-existent source

Test 3.4: Model Fallback
  Given: Primary model returns 401
  When:  Fallback model is tried
  Then:  Synthesis succeeds with fallback model
  And:   status.synthesisModel shows fallback model name

Test 3.5: Degraded Mode
  Given: All LLM models fail
  When:  Synthesis returns
  Then:  is_degraded = true
  And:   All section arrays are empty
  And:   sources array is populated
```

### Phase 4 Tests

```
Test 4.1: Meeting Prep Dashboard
  Given: Successful meeting prep brief
  When:  Dashboard renders
  Then:  Visible panels: Header, RelevanceCallout, CompanyCard, PersonCard, TalkingPoints, Landmines, QuestionsToAsk, Sources
  And:   Panels animate in with stagger

Test 4.2: Business Case Dashboard
  Given: Successful business case brief with keyMetrics
  When:  Dashboard renders
  Then:  MetricsRow shows metrics with trend arrows
  And:   Verdict badge shows correct color (green for strong_case)

Test 4.3: Market Research Timeline
  Given: Market research brief with timelineEvents
  When:  Dashboard renders
  Then:  TimelineStrip shows events with colored dots
  And:   Dates are formatted correctly

Test 4.4: Mobile Layout
  Given: Dashboard rendered at 375px viewport
  When:  Checking layout
  Then:  All panels stack vertically
  And:   No horizontal overflow
  And:   Metrics show 1 per row

Test 4.5: Source Citation Interaction
  Given: Bullet with sourceIds: ["s1", "s3"]
  When:  User clicks [s1]
  Then:  Source URL opens in new tab
```

### Phase 5 Tests

```
Test 5.1: Follow-Up Chat
  Given: Dashboard with synthesis results
  When:  User opens chat and types "What's the biggest risk?"
  Then:  Response references specific evidence from the brief
  And:   Response includes sourceIds

Test 5.2: Copy Brief
  Given: Dashboard rendered
  When:  User clicks "Copy Brief"
  Then:  Clipboard contains markdown with headline, bullets, and sources
  And:   Toast shows "Copied to clipboard"

Test 5.3: Download PDF
  Given: Dashboard rendered
  When:  User clicks "Download"
  Then:  PDF file downloads with brief content
  And:   PDF is readable and properly formatted
```

### Phase 6 Tests

```
Test 6.1: Brief Persistence
  Given: User generates a brief
  When:  Brief completes
  Then:  Row exists in intelligence_briefs with correct user_id

Test 6.2: History Page
  Given: User has 3 saved briefs
  When:  User visits /app/intelligence/history
  Then:  3 items listed in reverse chronological order
  And:   Each shows research type icon, headline, confidence, timestamp

Test 6.3: Brief Reload
  Given: User clicks a history item
  When:  Page loads
  Then:  Full dashboard renders from saved data (no re-generation)

Test 6.4: Public Share
  Given: User toggles "Share" on a brief
  When:  Share URL is generated
  Then:  Visiting URL without auth shows read-only dashboard
  And:   No chat or edit actions visible

Test 6.5: RLS Isolation
  Given: User A has a brief
  When:  User B tries to access it via API
  Then:  404 returned (not 403, to avoid enumeration)
```

### Phase 7 Tests

```
Test 7.1: Rate Limiting
  Given: User has made 5 requests today (free tier)
  When:  User tries request #6
  Then:  429 response with "Daily limit reached" message
  And:   Cooldown timer shown in UI

Test 7.2: Timeout Handling
  Given: Exa API takes >20s
  When:  Timeout fires
  Then:  That search is marked failed
  And:   Other searches continue
  And:   Brief generated with partial data

Test 7.3: Invalid JSON Retry
  Given: LLM returns markdown-wrapped JSON
  When:  First parse fails
  Then:  Retry with "return ONLY valid JSON" instruction
  And:   Second attempt succeeds

Test 7.4: Full Error State
  Given: Both search APIs and LLM are down
  When:  User submits request
  Then:  Clear error message: "Intelligence is temporarily unavailable"
  And:   Retry button visible
  And:   No partial/broken UI shown
```

---

## Subagent Delegation Map

This section tells coding agents how to parallelize the build.

### Phase 1 (Input System) — 3 Parallel Subagents

```
Subagent A: ResearchTypeSelector + page.tsx routing
Subagent B: MeetingPrepForm + BusinessCaseForm + shared components (TagInput, ChipSelector)
Subagent C: CompetitiveAnalysisForm + MarketResearchForm + types.ts + constants.ts
```

### Phase 2 (Search Engine) — 3 Parallel Subagents

```
Subagent A: profile-fetcher.ts + research-plan.ts (per-type plan builders)
Subagent B: Provider enhancements (exa.ts business case/market searches, tavily.ts advanced modes)
Subagent C: sse-stream.ts + v3/route.ts (API endpoint with SSE) + refine-goal/route.ts
```

### Phase 3 (Synthesis) — 2 Parallel Subagents

```
Subagent A: system-prompt.ts + meeting-prep.ts + business-case.ts prompts
Subagent B: competitive.ts + market-research.ts prompts + synthesize.ts rewrite
```

### Phase 4 (Dashboard UI) — 4 Parallel Subagents

```
Subagent A: DashboardHeader + RelevanceCallout + MetricsRow + BentoPanel + BulletItem (shared components)
Subagent B: CompanyCard + PersonCard + TimelineStrip + SourceCarousel (data display components)
Subagent C: MeetingPrepLayout + BusinessCaseLayout (meeting + business case layouts)
Subagent D: CompetitiveLayout + MarketResearchLayout + ProgressTracker + dashboard.module.css
```

### Phase 5 (Chat & Actions) — 2 Parallel Subagents

```
Subagent A: ChatPanel + chat/route.ts API
Subagent B: ActionBar + brief-to-markdown.ts + brief-to-pdf.ts
```

### Phase 6 (Persistence) — 2 Parallel Subagents

```
Subagent A: Migration file + history/route.ts + [briefId]/route.ts + share/route.ts
Subagent B: History page UI + [briefId] page + share page
```

### Phase 7 (Hardening) — 1 Subagent (Sequential)

```
Subagent A: Rate limiting upgrade + caching + error handling + mobile responsiveness + monitoring
```

### Total Subagent Invocations: ~17 across 7 phases

### Dependencies Between Subagents

```
Phase 1A ─┐
Phase 1B ─┼─▶ Phase 2C (needs input types)
Phase 1C ─┘
              Phase 2A ─┐
              Phase 2B ─┼─▶ Phase 3A, 3B (needs evidence pipeline)
              Phase 2C ─┘
                            Phase 3A ─┐
                            Phase 3B ─┼─▶ Phase 4A-D (needs output schema)
                                      │
                                      ├─▶ Phase 5A-B (needs synthesis output)
                                      └─▶ Phase 6A-B (needs brief schema)
                                              │
                                              └─▶ Phase 7A (needs everything)
```

---

## Migration from V2

### Backwards Compatibility

1. Keep `/api/intelligence` (V2) working during transition
2. Add `/api/intelligence/v3` as new endpoint
3. Feature flag `INTELLIGENCE_V3_ENABLED` controls which UI shows
4. Once V3 is stable, redirect V2 → V3 and deprecate old endpoint
5. Keep `/app/meeting-prep` (legacy dossier) until V3 meeting prep is confirmed working

### Data Migration

None required — V2 briefs are not persisted. Clean start with V3 persistence.

---

## Summary

| What | Count |
|------|-------|
| New React components | ~25 |
| New API routes | 6 |
| New lib modules | ~12 |
| New database tables | 3 |
| Total phases | 7 |
| Parallel subagent tracks | 17 |
| Acceptance criteria | 58 |
| Test scenarios | 32 |
