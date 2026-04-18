# Intelligence Flagship — Merged Implementation Plan

> **One-liner**: Turn Relevant into a role-aware deep research engine where the user commissions intelligence — meeting prep, business case analysis, competitive research, account briefs — and gets back a polished, skimmable intelligence dashboard powered by their profile, live search, and LLM synthesis.

> **Built entirely by AI agents. No human engineers. Every instruction must be unambiguous, testable, and self-contained.**

---

## Table of Contents

1. [Product Philosophy](#1-product-philosophy)
2. [Architecture Overview](#2-architecture-overview)
3. [Existing Codebase Inventory](#3-existing-codebase-inventory)
4. [Phase Plan & Dependencies](#4-phase-plan--dependencies)
5. [Phase 1 — Structured Input System](#phase-1--structured-input-system)
6. [Phase 2 — Search Orchestration & Profile Fusion](#phase-2--search-orchestration--profile-fusion)
7. [Phase 3 — LLM Synthesis Engine](#phase-3--llm-synthesis-engine)
8. [Phase 4 — Intelligence Dashboard UI](#phase-4--intelligence-dashboard-ui)
9. [Phase 5 — Follow-Up Chat & Actions](#phase-5--follow-up-chat--actions)
10. [Phase 6 — Persistence & History](#phase-6--persistence--history)
11. [Phase 7 — Polish, Hardening & Monitoring](#phase-7--polish-hardening--monitoring)
12. [Database Schema](#database-schema)
13. [API Contracts](#api-contracts)
14. [Visual Specification](#visual-specification)
15. [Design Anti-Slop Rules](#design-anti-slop-rules)
16. [Cost & Usage Logging](#cost--usage-logging)
17. [Agent Working Protocol](#agent-working-protocol)
18. [Acceptance Criteria (Global)](#acceptance-criteria-global)
19. [Test Plan](#test-plan)
20. [Subagent Delegation Map](#subagent-delegation-map)
21. [Changelog Protocol](#changelog-protocol)

---

## 1. Product Philosophy

### The Job

The user is not asking for more information. The user is asking:

- "Help me walk into this conversation already understanding what matters."
- "Help me make a strong case with proof points."
- "Help me understand this account, company, or market quickly."
- "Help me know what to say, what to ask, what to avoid, and what to do next."

The real job is **preparation and judgment**, not search.

### Why Relevant Wins

Relevant knows the user — their role, company, industry, 20+ influence dimensions, a profile passage, consequence chains, and behavioral signals. No competitor has this depth. When a user commissions intelligence, we:

1. **Capture structured intent** — Ask the right questions per research type (not a blank text box)
2. **Refine intent with AI** — Rewrite raw input into a sharp research brief before dispatching
3. **Dispatch targeted searches** — Exa, Tavily, website extraction — all in parallel, bucketed by evidence type
4. **Fuse with user profile** — Combine search results + profile_passage + dimensions to create *role-aware* synthesis
5. **Deliver a polished dashboard** — Visual, skimmable, with numbers, timelines, images, and citation-linked proof points
6. **Enable follow-up** — Chat on top of the synthesized context, export/share the report

### Core Product Principles

1. **Structure the input for the user.** They should answer simple, guided questions. The system turns that into a strong research brief.
2. **Personalize from user context.** The same meeting produces different framing for a founder vs. a PM vs. a salesperson. Use `profile_passage` and dimensions as a lens.
3. **Search is the foundation.** Quality depends on what searches we dispatch, which sources we trust, how we bucket evidence, and how we keep facts separate from interpretation.
4. **First screen must already be useful.** The result should answer the user's question before they scroll.
5. **The UI must feel premium.** Not a chatbot. Not a wall of text. Not a feed. An intelligence dashboard with crisp hierarchy, strong typography, dense but readable cards, numbers and evidence, obvious actions, low cognitive load. Think Apple, Google, OpenAI — clean, deliberate, restrained.

### What This Is NOT

- Not a generic news feed
- Not a chatbot interface
- Not a single "meeting prep" form
- Not a wall of AI-generated text
- Not decoration with gradient bars and slop colors

---

## 2. Architecture Overview

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
                     POST /api/intelligence/v3 (SSE)
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                  API LAYER (Next.js Route)                   │
│                                                             │
│  1. Auth (JWT) + Rate Limit + Input Validation              │
│  2. Fetch User Profile (profile_passage + dimensions)       │
│  3. AI Intent Refinement (rewrite raw input → sharp brief)  │
│  4. Build Research Plan (per research type, evidence buckets)│
│  5. Dispatch Parallel Searches (Exa + Tavily, bucketed)     │
│  6. Normalize + Deduplicate + Score Evidence                │
│  7. LLM Synthesis (profile-aware, type-specific prompt)     │
│  8. Log cost + usage to pro_ai_usage                        │
│  9. Stream result via SSE                                   │
│  10. Persist to DB (async, non-blocking)                    │
└─────────────────────────────────────────────────────────────┘
```

### Key Architecture Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Where does synthesis run? | Next.js API route (server-side) | Faster iteration, no edge function deploy cycle, direct access to Exa/Tavily/LLM SDKs |
| Where is user profile fetched? | Supabase query from API route using service role key | Full read access; avoids edge function hop |
| LLM provider | Model cascade: Gemini 2.5 Flash → Gemini 2.0 Flash → OpenRouter Gemini 2.5 Flash → OpenRouter Claude Sonnet 4 | Best speed/quality for structured JSON output |
| Persistence | Supabase `intelligence_briefs` table | Enables history, sharing, follow-up chat |
| Real-time progress | Server-Sent Events (SSE) | User sees each search phase completing live |
| Cost logging | Insert to `pro_ai_usage` via Supabase service role | Founder visibility into token spend |
| Monitoring | Log to `intelligence_health_log` + expose in ops-dashboard | Founder sees success/failure rates without code |

---

## 3. Existing Codebase Inventory

**What exists and must be preserved/evolved (not rewritten from scratch):**

| Layer | Files | What It Does | V3 Action |
|-------|-------|-------------|-----------|
| **Orchestrator** | `src/lib/intelligence/index.ts` (195 lines) | Plan → parallel search → normalize → synthesize | **Expand**: add V3 orchestrator function alongside existing `generateIntelligenceBrief` |
| **Types** | `src/lib/intelligence/types.ts` (112 lines) | `IntelligenceRequest`, `IntelligenceBrief`, `BriefBullet`, `BriefSource`, `NormalizedEvidence` | **Expand**: add V3 discriminated union types, keep V2 types for backward compat |
| **Synthesize** | `src/lib/intelligence/synthesize.ts` (200 lines) | Model cascade (Gemini/OpenRouter), JSON parse, bullet extraction | **Expand**: add profile-aware system prompt, per-type user prompts |
| **Research Plan** | `src/lib/intelligence/research-plan.ts` (55 lines) | Builds search tasks for meeting prep | **Expand**: add per-type plan builders |
| **Normalize** | `src/lib/intelligence/normalize.ts` (120 lines) | Exa/Tavily → `BriefSource[]` + `NormalizedEvidence[]` | **Expand**: add image extraction, category tagging, quality scoring |
| **Exa Provider** | `src/lib/intelligence/providers/exa.ts` (155 lines) | Snapshot, news, person, competitor searches | **Expand**: add business case + market research queries |
| **Tavily Provider** | `src/lib/intelligence/providers/tavily.ts` (95 lines) | News search, site extraction | **Expand**: add advanced search modes |
| **API Route** | `src/app/api/intelligence/route.ts` (115 lines) | Auth, rate limit, validate, call orchestrator | **Keep as V2**; create new `v3/route.ts` |
| **Form** | `src/app/app/intelligence/IntelligenceForm.tsx` (233 lines) | Single meeting prep form | **Replace** with research type selector + per-type forms |
| **Results** | `src/app/app/intelligence/IntelligenceResults.tsx` (276 lines) | Bento grid for meeting prep | **Replace** with type-specific dashboard layouts |
| **Sources** | `src/app/app/intelligence/IntelligenceSources.tsx` (60 lines) | Horizontal source cards | **Evolve** into SourceCarousel with richer display |
| **Page** | `src/app/app/intelligence/page.tsx` (196 lines) | Auth check, loading, form → results flow | **Rewrite** for V3 flow with SSE |
| **Supabase Client** | `src/lib/supabase.ts` (75 lines) | Browser client with proxy pattern | **Keep**; add service role client for API routes |

**What does NOT exist yet (must be built from scratch):**

- User profile fetcher (profile_passage + dimensions from Supabase)
- Service role Supabase client for API routes
- SSE streaming infrastructure
- Per-type input forms (Business Case, Competitive Analysis, Market Research)
- Per-type synthesis prompts
- Per-type dashboard layouts
- AI intent refinement endpoint
- Follow-up chat (API + UI)
- Brief persistence (DB tables + API)
- History page
- Public share page
- Cost/usage logging from Website → `pro_ai_usage`
- Intelligence health monitoring

---

## 4. Phase Plan & Dependencies

```
Phase 1 ──▶ Phase 2 ──▶ Phase 3 ──▶ Phase 4 ──▶ Phase 5 ──▶ Phase 6 ──▶ Phase 7
 Input      Search      Synthesis    Dashboard    Chat &      Persist     Polish &
 System     + Profile   Engine       UI           Actions     & History   Monitor
```

| Phase | What Ships | Depends On | Can Parallelize With |
|-------|-----------|------------|---------------------|
| **Phase 1** | Research type selector + 4 structured forms + types + constants + AI refine endpoint | Nothing | — |
| **Phase 2** | Search orchestration + user profile fusion + SSE streaming + evidence bucketing | Phase 1 (input types) | Phase 4 (loading UI skeleton) |
| **Phase 3** | LLM synthesis with type-specific prompts + profile-aware output + cost logging | Phase 2 (evidence pipeline) | Phase 4 (result component shells) |
| **Phase 4** | Intelligence dashboard UI (type-specific layouts, shared components, animations) | Phase 3 (output schema) | Phase 1 (can start layout shells early) |
| **Phase 5** | Follow-up chat + copy/export/share actions | Phase 4 (dashboard rendered) | Phase 6 |
| **Phase 6** | Brief persistence + history page + reload + public share | Phase 3 (brief schema) | Phase 5 |
| **Phase 7** | Error hardening, caching, rate limiting, health monitoring, mobile polish | All phases | — |

### Agent Execution Order

Each phase must be **fully completed and tested** before the next begins. The agent must:

1. Implement the phase
2. Run `npm run build` (must pass)
3. Run `npx tsc --noEmit` (must pass)
4. Open the browser and visually verify the UI
5. Log progress to the changelog
6. Move to the next phase

---

## Phase 1 — Structured Input System

### Goal
Replace the single meeting prep form with a research type selector + per-type structured input forms that guide the user through the right questions.

### 1.1 Research Type Selector

A 2×2 card grid (desktop) / vertical stack (mobile) where the user picks their workflow:

| Card | Icon | Title | Description |
|------|------|-------|-------------|
| 1 | `ClipboardList` (lucide) | Meeting Prep | Prepare for a sales, client, or partner conversation |
| 2 | `BarChart3` (lucide) | Business Case | Build proof points for an initiative or proposal |
| 3 | `Swords` (lucide) | Competitive Intel | Analyze a competitor's latest moves and positioning |
| 4 | `Search` (lucide) | Market Research | Explore a market trend, space, or opportunity |

**Visual spec:**
- Each card: `var(--surface)` background, `1px solid var(--border)` border, `border-radius: 16px`, `padding: 24px`
- Hover: `border-color: var(--accent)`, `transform: translateY(-2px)`, transition `var(--motion-micro)`
- Selected: `border-color: var(--accent)`, `background: rgba(47, 107, 255, 0.06)`, `box-shadow: 0 0 0 1px var(--accent)`
- Icon: 24px, `color: var(--accent)`, `margin-bottom: 12px`
- Title: `font-weight: 600`, `font-size: 16px`, `color: var(--text)`, `margin-bottom: 8px`
- Description: `font-size: 14px`, `color: var(--text-muted)`, `line-height: 1.5`
- Grid gap: `16px`
- Above cards, centered heading: "What would you like to prepare for?" — `font-size: 20px`, `font-weight: 600`, `color: var(--text)`, `margin-bottom: 24px`

### 1.2 Meeting Prep Form

| Field | Component | Required | Validation | Placeholder |
|-------|-----------|----------|------------|-------------|
| Who are you meeting? | `<input type="text">` | Yes | min 2 chars, max 200 | "Company or person name" |
| Meeting type | `<ChipSelector>` | Yes | must select one | — |
| What's your goal? | `<textarea rows={2}>` | Yes | min 10 chars, max 500 | Varies by meeting type (see constants) |
| Their website | `<input type="url">` | No | valid URL or empty | "https://..." |
| Attendees | `<TagInput max={5}>` | No | max 5, each max 100 chars | "Type a name and press Enter" |
| Key topics / context | `<textarea rows={3}>` | No | max 2000 | "Anything else we should know?" |
| Competitors to watch | `<TagInput max={3}>` | No | max 3, each max 100 chars | "Type a competitor name" |

**Meeting type chips:** `Customer` · `Partner` · `Reseller` · `Investor` · `Board` · `Internal` · `Other`

**Goal placeholders by meeting type:**
- Customer: "Close the deal on our enterprise plan"
- Partner: "Explore a co-sell partnership for Q3"
- Investor: "Pitch our Series A story"
- Board: "Present Q1 results and H2 strategy"
- Default: "What do you want to accomplish?"

**AI Refine (Goal field):**
- Small button next to goal textarea: "Refine" with a sparkle icon (✨)
- On click → POST `/api/intelligence/refine-goal` with `{ goal, meetingType, accountName }`
- Returns `{ refined: string }`
- Goal field updates with refined text
- "Undo" link appears to revert to original
- Button shows spinner during request

### 1.3 Business Case Form

| Field | Component | Required | Validation | Placeholder |
|-------|-----------|----------|------------|-------------|
| Initiative name | `<input>` | Yes | min 3, max 200 | "Weekend delivery service" |
| Your hypothesis | `<textarea rows={2}>` | Yes | min 10, max 500 | "What you believe and want to validate" |
| Target market | `<input>` | No | max 200 | "Who would this serve?" |
| Success metrics | `<TagInput max={4}>` | No | — | "Revenue uplift, Customer retention..." |
| Key questions | `<textarea rows={3}>` | No | max 2000 | "What specifically do you need answered?" |
| Comparable companies | `<TagInput max={3}>` | No | — | "Companies that have done similar" |

### 1.4 Competitive Analysis Form

| Field | Component | Required | Validation | Placeholder |
|-------|-----------|----------|------------|-------------|
| Competitor(s) | `<TagInput max={3}>` | Yes | min 1 | "Which competitors to analyze" |
| Your company/product | `<input>` | No | max 200, auto-fill from profile | "Your company name" |
| Focus area | `<ChipSelector>` | Yes | must select one | — |
| Specific questions | `<textarea rows={3}>` | No | max 2000 | "What do you want to know?" |

**Focus area chips:** `Product` · `Pricing` · `Go-to-Market` · `Technology` · `Talent` · `Overall`

### 1.5 Market Research Form

| Field | Component | Required | Validation | Placeholder |
|-------|-----------|----------|------------|-------------|
| Market or trend | `<input>` | Yes | min 3, max 200 | "AI-powered logistics" |
| Scope | `<ChipSelector>` | Yes | must select one | — |
| Key questions | `<textarea rows={3}>` | No | max 2000 | "What do you want answered?" |
| Known players | `<TagInput max={5}>` | No | — | "Companies already on your radar" |
| Time horizon | `<ChipSelector>` | No | — | — |

**Scope chips:** `Global` · `North America` · `Europe` · `APAC` · `Specific Region`
**Time horizon chips:** `Last 30 days` · `Last 90 days` · `Last 6 months` · `Last year`

### 1.6 Shared Form Components

**TagInput** — Reusable tag input with:
- Text input that converts to tag chip on Enter or comma
- Each tag: pill shape, `var(--surface-strong)` background, X button to remove
- Max count enforcement with "Max N" message
- If user pastes a LinkedIn URL, extract display name from path

**ChipSelector** — Reusable single-select chip row:
- Horizontal wrap of pill-shaped chips
- Default: `var(--surface)` background, `var(--border)` border
- Selected: `var(--accent)` background at 12% opacity, `var(--accent)` border, `var(--accent)` text
- `font-size: 13px`, `padding: 6px 14px`, `border-radius: 999px`, `gap: 8px`

**FormSection** — Consistent field layout:
- Label: `font-size: 13px`, `font-weight: 500`, `color: var(--text-muted)`, `text-transform: uppercase`, `letter-spacing: 0.04em`, `margin-bottom: 8px`
- Required indicator: small `*` in `var(--accent-coral)`
- Error state: red border + error text below field

**AIRefineButton** — Goal refinement button (see 1.2)

### 1.7 Submit Button

- Full-width at bottom of form
- Text: "Generate Intelligence"
- Style: `background: var(--accent)`, `color: white`, `border-radius: 12px`, `padding: 14px`, `font-weight: 600`, `font-size: 15px`
- Disabled state when required fields empty: `opacity: 0.4`, `pointer-events: none`
- Loading state: text changes to "Researching..." with spinner

### Type Definitions

```typescript
// src/app/app/intelligence/types.ts (V3 additions)

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

### Files to Create/Modify

```
src/app/app/intelligence/
  ├── page.tsx                        (REWRITE — V3 flow with type selector → form → SSE → dashboard)
  ├── ResearchTypeSelector.tsx        (NEW — 2×2 card grid)
  ├── forms/
  │   ├── MeetingPrepForm.tsx         (NEW — structured meeting prep form)
  │   ├── BusinessCaseForm.tsx        (NEW)
  │   ├── CompetitiveAnalysisForm.tsx (NEW)
  │   ├── MarketResearchForm.tsx      (NEW)
  │   └── shared/
  │       ├── TagInput.tsx            (NEW — reusable tag input)
  │       ├── ChipSelector.tsx        (NEW — reusable chip selector)
  │       ├── AIRefineButton.tsx      (NEW — goal refinement button)
  │       └── FormSection.tsx         (NEW — consistent field layout)
  ├── types.ts                        (EXPAND — add V3 types alongside V2)
  └── constants.ts                    (NEW — meeting type presets, goal placeholders)

src/app/api/intelligence/
  └── refine-goal/route.ts            (NEW — AI goal refinement endpoint)
```

### Acceptance Criteria — Phase 1

| # | Criterion | How Agent Verifies |
|---|-----------|-------------------|
| 1.1 | Research type selector renders 4 cards in 2×2 grid on desktop | Browser screenshot at 1200px width |
| 1.2 | Cards stack vertically at 375px viewport | Browser screenshot at 375px width |
| 1.3 | Clicking a card shows the correct per-type form with animation | Click each card in browser, verify fields |
| 1.4 | Required fields prevent submission when empty | Click submit with empty required → error visible |
| 1.5 | Tag input: add 3 tags, remove 1, verify state | Browser interaction test |
| 1.6 | Chip selector: click chips, only one active | Browser interaction test |
| 1.7 | AI Refine button sends goal to API and updates field | Click refine → verify network request + field update |
| 1.8 | Form state persists when switching research type | Fill form A → switch to B → switch back → A state preserved |
| 1.9 | Submit button disabled when required fields empty | Visual check |
| 1.10 | `npm run build` passes | Terminal |
| 1.11 | `npx tsc --noEmit` passes | Terminal |
| 1.12 | No gradient bars, no AI slop colors, no decorative blobs | Visual check in browser |

---

## Phase 2 — Search Orchestration & Profile Fusion

### Goal
Build a research engine that (a) fetches user profile data for personalization, (b) dispatches targeted searches per research type using evidence buckets, (c) streams progress to the client via SSE, and (d) logs cost/usage.

### 2.1 Service Role Supabase Client

Create a server-side Supabase client using the service role key for API routes:

```typescript
// src/lib/supabase-server.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export function createServiceClient() {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}
```

### 2.2 User Profile Fetcher

Fetch from Supabase on every intelligence request:

```typescript
// src/lib/intelligence/profile-fetcher.ts

interface UserProfileContext {
  profilePassage: string | null       // From user_settings
  role: string | null                 // From users table
  industry: string | null
  companyName: string | null
  location: {
    country: string | null
    region: string | null
    city: string | null
  }
  dimensions: Array<{                // Top 15 from pro_influence_dimensions
    category: string                  // 'company', 'topic', 'regulator', etc.
    value: string                     // 'Tesla', 'AI Regulation', etc.
    weight: number
    consequenceChain: string
    relationship: string              // 'competitor', 'customer', etc.
  }>
}
```

**Query**: Service role client → join `users`, `user_settings`, `pro_influence_dimensions` (top 15 by weight, `is_active = true`).

If profile is empty or user has no dimensions, proceed with empty context — do not block the request.

### 2.3 AI Intent Refinement

After the user fills the structured form, before dispatching searches, the system should refine the raw input into a sharper internal brief. This is the step that makes search quality jump.

```typescript
// Example:
// Raw: "Launch weekend delivery service"
// Refined: "Assess whether a weekend delivery service is commercially and
//  operationally justified, using demand signals, peer examples, customer
//  expectations, logistics constraints, and evidence the user can use in
//  an internal decision conversation."
```

This refinement is stored as `refinedIntent` on the brief and used to build search queries.

### 2.4 Evidence Bucketing (Per Research Type)

Do NOT search with one flat query. Build evidence buckets first, then dispatch one or more searches per bucket.

**Meeting Prep evidence buckets & searches:**

| Bucket | Search | Provider | When | Timeout |
|--------|--------|----------|------|---------|
| Company overview | Company snapshot | Exa | Always | 20s |
| Recent developments | Company news (lookback) | Exa | Always | 10s |
| Real-time news | Current news | Tavily | Always | 10s |
| Official presence | Website extraction | Tavily | If website provided | 10s |
| People context | Person search (per attendee) | Exa | If attendees provided | 10s each |
| Competitive context | Competitor search (per competitor) | Exa | If competitors provided | 10s each |

**Business Case evidence buckets & searches:**

| Bucket | Search | Provider | When | Timeout |
|--------|--------|----------|------|---------|
| Market demand | Initiative/market news | Exa | Always | 10s |
| Validation data | Market validation | Tavily (advanced) | Always | 10s |
| Comparable examples | Comparable company research | Exa | If comparables provided | 10s each |
| Industry trends | Industry trend data | Exa | Always | 10s |
| Metric benchmarks | Success metric benchmarks | Tavily | If metrics provided | 10s |

**Competitive Analysis evidence buckets & searches:**

| Bucket | Search | Provider | When | Timeout |
|--------|--------|----------|------|---------|
| Competitor profile | Competitor snapshot (each) | Exa | Always | 20s each |
| Recent moves | Competitor news (each) | Exa | Always | 10s each |
| Competitor website | Website extract (each) | Tavily | If URL found | 10s each |
| Head-to-head | Comparison news | Tavily | If your company provided | 10s |
| Market context | Industry context | Exa | Always | 10s |

**Market Research evidence buckets & searches:**

| Bucket | Search | Provider | When | Timeout |
|--------|--------|----------|------|---------|
| Market overview | Market overview | Exa | Always | 20s |
| Recent news | Market news | Exa + Tavily | Always | 10s each |
| Player profiles | Known player snapshots | Exa | If players provided | 10s each |
| Analyst data | Research/reports | Tavily (advanced) | Always | 10s |
| Regional data | Scope-specific search | Exa | If scope != global | 10s |

### 2.5 SSE Progress Streaming

Stream search progress in real-time via Server-Sent Events:

```typescript
// Server sends these events:
{ event: 'phase', data: { phase: 'profile', status: 'complete', ms: 120 } }
{ event: 'phase', data: { phase: 'intent_refinement', status: 'complete', ms: 800 } }
{ event: 'phase', data: { phase: 'company_snapshot', status: 'complete', ms: 1200, resultCount: 5 } }
{ event: 'phase', data: { phase: 'news_search', status: 'complete', ms: 900, resultCount: 12 } }
{ event: 'phase', data: { phase: 'attendee_search', status: 'complete', ms: 2100, resultCount: 3 } }
{ event: 'phase', data: { phase: 'synthesis', status: 'running' } }
{ event: 'phase', data: { phase: 'synthesis', status: 'complete', ms: 8500 } }
{ event: 'result', data: { brief: IntelligenceBriefV3 } }
// On error:
{ event: 'error', data: { message: string, code: string } }
```

**SSE implementation**: Use `ReadableStream` with `TextEncoder` to create SSE responses in the Next.js route handler. Set headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`.

### 2.6 Evidence Normalization (Enhanced)

All search results normalized into:

```typescript
interface NormalizedEvidence {
  id: string              // s1, s2, ...
  url: string
  title: string
  text: string            // Extracted content / summary
  domain: string
  publishedAt: string | null
  provider: 'exa' | 'tavily' | 'internal'
  imageUrl?: string       // If available from search result
  category: 'news' | 'company_info' | 'person' | 'market_data' | 'product' | 'financial'
  relevanceScore?: number // 0-1, from provider or heuristic
  bucket: string          // Which evidence bucket this belongs to
}
```

**Source quality scoring:**
- Official/primary sources: score boost +0.2
- High-authority domains (techcrunch, reuters, bloomberg, wsj, etc.): boost +0.15
- Freshness: published within 7 days +0.1, 30 days +0.05
- Duplicate URL penalty: keep highest-scored instance only

### Files to Create/Modify

```
src/lib/
  └── supabase-server.ts              (NEW — service role client)

src/lib/intelligence/
  ├── index.ts                        (EXPAND — add generateIntelligenceBriefV3 with SSE)
  ├── types.ts                        (EXPAND — add V3 types, UserProfileContext, NormalizedEvidence v3)
  ├── profile-fetcher.ts              (NEW — fetch user profile + dimensions)
  ├── research-plan.ts                (EXPAND — add per-type plan builders with evidence buckets)
  ├── intent-refiner.ts               (NEW — AI intent refinement)
  ├── normalize.ts                    (EXPAND — add image extraction, category tagging, quality scoring)
  ├── sse-stream.ts                   (NEW — SSE response builder utilities)
  ├── usage-logger.ts                 (NEW — log to pro_ai_usage table)
  ├── providers/
  │   ├── exa.ts                      (EXPAND — add business case + market + competitive queries)
  │   └── tavily.ts                   (EXPAND — add advanced search modes)

src/app/api/intelligence/
  ├── v3/route.ts                     (NEW — V3 endpoint with SSE)
  └── refine-goal/route.ts            (NEW — AI goal refinement endpoint)
```

### Acceptance Criteria — Phase 2

| # | Criterion | How Agent Verifies |
|---|-----------|-------------------|
| 2.1 | Service role Supabase client can query `users` table | Log query result in dev server |
| 2.2 | User profile (passage + dimensions) fetched for authenticated user | Log profile data → non-empty for test user |
| 2.3 | Meeting prep dispatches ≥3 parallel searches | Check timing: searches run concurrently |
| 2.4 | Business case dispatches market + comparable searches | Submit → log shows correct search queries |
| 2.5 | Competitive analysis dispatches per-competitor snapshot + news | 2 competitors → ≥4 searches dispatched |
| 2.6 | SSE events stream in real-time to frontend | Open DevTools → EventSource shows progressive events |
| 2.7 | Partial search failure doesn't crash request | Kill Tavily API key → Exa results still returned |
| 2.8 | Evidence includes image URLs when available | Check normalized evidence → imageUrl populated |
| 2.9 | Total search phase completes in <15s for meeting prep | Time from request to synthesis start ≤15s |
| 2.10 | User dimensions included in synthesis payload | Log synthesis input → dimensions array present |
| 2.11 | AI intent refinement produces sharper query than raw input | Compare raw vs. refined in logs |
| 2.12 | `npm run build` passes | Terminal |

---

## Phase 3 — LLM Synthesis Engine

### Goal
Build type-specific synthesis prompts that use the full context (search results + user profile + dimensions + refined intent) to produce structured, citation-linked output tailored to each research type. Log all LLM usage for cost tracking.

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

## Refined Research Intent
{refinedIntent}

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

**Shared types:**

```typescript
interface BriefBullet {
  text: string
  sourceIds: string[]
  tag: 'fact' | 'inference'
}

interface CompanySnapshot {
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
}

interface AttendeeProfile {
  name: string
  title: string | null
  company: string | null
  background: string | null
  linkedinUrl: string | null
  sourceUrl: string | null
}
```

**Meeting Prep Output:**

```typescript
interface MeetingPrepSynthesis {
  headline: string                    // "3 things to know before your call with Acme"
  bottomLine: string                  // 1-2 sentence summary
  confidence: 'high' | 'medium' | 'low'

  companyIntel: {
    snapshot: CompanySnapshot
    recentMoves: BriefBullet[]
  }

  attendeeProfiles: AttendeeProfile[]

  sections: {
    talkingPoints: BriefBullet[]      // Specific conversation openers
    landmines: BriefBullet[]          // Topics to avoid or handle carefully
    questionsToAsk: BriefBullet[]     // Smart, specific questions
    opportunitySignals: BriefBullet[] // Potential deal / partnership openings
    competitorContext: BriefBullet[]  // If competitors provided
  }

  relevanceToYou: string             // 2-3 sentences: why this meeting matters given YOUR profile
}
```

**Business Case Output:**

```typescript
interface BusinessCaseSynthesis {
  headline: string
  verdict: 'strong_case' | 'moderate_case' | 'weak_case' | 'insufficient_data'
  confidence: 'high' | 'medium' | 'low'

  sections: {
    marketValidation: BriefBullet[]
    proofPoints: BriefBullet[]
    riskFactors: BriefBullet[]
    comparableCases: BriefBullet[]
    metricsFramework: BriefBullet[]
    recommendedNextSteps: BriefBullet[]
  }

  keyMetrics: Array<{
    label: string         // "TAM Estimate", "Competitor Growth Rate"
    value: string         // "$4.2B", "32% YoY"
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
    positioningGaps: BriefBullet[]
    featureComparison: BriefBullet[]
    marketPerception: BriefBullet[]
    emergingThreats: BriefBullet[]
    yourAdvantages: BriefBullet[]
    recommendedActions: BriefBullet[]
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
    marketOverview: BriefBullet[]
    keyPlayers: BriefBullet[]
    trendEvidence: BriefBullet[]
    opportunities: BriefBullet[]
    risks: BriefBullet[]
    timelineEvents: Array<{
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

**Unified V3 Brief (wraps all types):**

```typescript
interface IntelligenceBriefV3 {
  id: string
  researchType: ResearchType
  generatedAt: string
  request: IntelligenceInput
  refinedIntent: string

  // User context snapshot at generation time
  userProfileSnapshot: {
    role: string | null
    industry: string | null
    companyName: string | null
    dimensionCount: number
  } | null

  // Type-specific synthesis (discriminated by researchType)
  synthesis: MeetingPrepSynthesis | BusinessCaseSynthesis | CompetitiveAnalysisSynthesis | MarketResearchSynthesis

  // All sources
  sources: BriefSource[]

  // Evidence coverage
  evidenceCoverage: {
    official: number      // Count of official/primary sources
    news: number          // Count of news articles
    people: number        // Count of person profiles
    market: number        // Count of market/financial data
    competitors: number   // Count of competitor-related sources
  }

  // Performance & status
  status: {
    degraded: boolean
    reasons: string[]
    searchMs: number
    synthesisMs: number
    totalMs: number
    sourceCount: number
    synthesisModel: string | null
  }
}
```

### 3.3 Model Cascade

```typescript
const MODEL_CANDIDATES = [
  { provider: 'gemini',     model: 'gemini-2.5-flash',       timeout: 60_000 },
  { provider: 'gemini',     model: 'gemini-2.0-flash',       timeout: 45_000 },
  { provider: 'openrouter', model: 'google/gemini-2.5-flash', timeout: 60_000 },
  { provider: 'openrouter', model: 'anthropic/claude-sonnet-4', timeout: 60_000 },
]
```

- Try models in order; skip on auth failure (401/403) or timeout
- Strip markdown fences before `JSON.parse`
- Validate output against expected schema (check required fields exist)
- If all models fail → return degraded brief with empty sections + sources
- **Log every attempt** (success or failure) to `pro_ai_usage`

### 3.4 Cost Logging

Every LLM call (synthesis + intent refinement) must log to `pro_ai_usage`:

```typescript
interface AiUsageLog {
  user_id: string
  function_name: 'intelligence_v3_synthesis' | 'intelligence_v3_refine'
  provider: string          // 'gemini', 'openrouter'
  model: string             // 'gemini-2.5-flash', etc.
  prompt_tokens: number     // Estimated from input length
  completion_tokens: number // Estimated from output length
  total_tokens: number
  estimated_cost_usd: number
  status: 'success' | 'error' | 'timeout'
  latency_ms: number
  metadata: {
    research_type: string
    evidence_count: number
    source_count: number
  }
}
```

**Token estimation** (when provider doesn't return counts): `prompt_tokens ≈ inputChars / 4`, `completion_tokens ≈ outputChars / 4`.

**Cost estimation** (per 1M tokens):
- Gemini 2.5 Flash: input $0.15, output $0.60
- Gemini 2.0 Flash: input $0.10, output $0.40
- Claude Sonnet 4: input $3.00, output $15.00

### Files to Create/Modify

```
src/lib/intelligence/
  ├── synthesize.ts                   (MAJOR EXPAND — per-type prompts, profile-aware, cost logging)
  ├── prompts/
  │   ├── system-prompt.ts            (NEW — shared system prompt builder)
  │   ├── meeting-prep.ts             (NEW — meeting prep user prompt + schema)
  │   ├── business-case.ts            (NEW — business case user prompt + schema)
  │   ├── competitive.ts              (NEW — competitive analysis user prompt + schema)
  │   └── market-research.ts          (NEW — market research user prompt + schema)
  ├── types.ts                        (EXPAND — add V3 output types)
  └── usage-logger.ts                 (NEW — log to pro_ai_usage)
```

### Acceptance Criteria — Phase 3

| # | Criterion | How Agent Verifies |
|---|-----------|-------------------|
| 3.1 | Meeting prep synthesis includes profile_passage in LLM prompt | Log prompt → contains user's passage |
| 3.2 | Synthesis output matches expected schema per research type | Parse response → all required fields present |
| 3.3 | Every bullet has at least one sourceId | Validate all bullets → sourceIds.length ≥ 1 |
| 3.4 | `relevanceToYou` references user's actual dimensions | Read output → mentions user's role/industry |
| 3.5 | Business case returns keyMetrics array with ≥1 metric | Submit business case → keyMetrics populated |
| 3.6 | Competitive analysis returns per-competitor breakdown | 2 competitors → 2 entries in competitors array |
| 3.7 | Market research returns timelineEvents | Submit → timeline has ≥2 events |
| 3.8 | Degraded mode returns sources when synthesis fails | Kill LLM key → still get sources + degraded flag |
| 3.9 | Model fallback works | Block Gemini key → OpenRouter succeeds |
| 3.10 | Synthesis completes in <30s for typical request | Time synthesis phase → ≤30s |
| 3.11 | Cost logged to pro_ai_usage after every LLM call | Check table → row exists with correct metadata |
| 3.12 | `npm run build` passes | Terminal |

---

## Phase 4 — Intelligence Dashboard UI

### Goal
Build a polished, visual, skimmable intelligence dashboard that feels like a premium Apple/Google-quality product. Type-specific layouts. No AI slop.

### 4.1 Dashboard Architecture

The dashboard is composed of shared components assembled into type-specific layouts:

**Shared components:**

| Component | Purpose |
|-----------|---------|
| `DashboardHeader` | Confidence badge + headline + bottom line + timestamp |
| `RelevanceCallout` | "Why this matters to YOU" personalized box |
| `MetricsRow` | Key metrics with trend arrows (business case, market research) |
| `BentoPanel` | Generic section card with icon + title + bullet list |
| `BulletItem` | Individual bullet with source tags + fact/inference badge |
| `CompanyCard` | Company snapshot (structured grid) |
| `PersonCard` | Attendee/person profile card |
| `TimelineStrip` | Vertical timeline with impact-colored dots (market research) |
| `SourceCarousel` | Horizontal scrolling source cards with provider badges |
| `ActionBar` | Copy / Download / Chat buttons |
| `ProgressTracker` | SSE-powered live search progress display |

**Type-specific layouts:**

| Layout | Used By | Unique Elements |
|--------|---------|-----------------|
| `MeetingPrepLayout` | Meeting Prep | CompanyCard, PersonCards, TalkingPoints/Landmines split |
| `BusinessCaseLayout` | Business Case | Verdict badge, MetricsRow, proof/risk split |
| `CompetitiveLayout` | Competitive Analysis | Per-competitor cards, positioning gaps |
| `MarketResearchLayout` | Market Research | Market health badge, MetricsRow, TimelineStrip |

### 4.2 DashboardHeader Visual Spec

```
Background: var(--surface)
Border-radius: 20px
Padding: 32px
Margin-bottom: 24px

┌─────────────────────────────────────────────┐
│  [Confidence Badge]         Generated 2m ago │
│                                              │
│  Headline text (24px, 700 weight)            │
│                                              │
│  Bottom line text (16px, 400 weight,         │
│  color: var(--text-muted))                   │
└──────────────────────────────────────────────┘
```

**Confidence badge:**
- High: `var(--accent-teal)` dot + "HIGH CONFIDENCE" text
- Medium: `var(--accent-amber)` dot + "MEDIUM CONFIDENCE" text  
- Low: `var(--accent-coral)` dot + "LOW CONFIDENCE" text
- Font: `11px`, `font-weight: 600`, `letter-spacing: 0.05em`, uppercase, monospace

**For Business Case:** Replace confidence with Verdict badge:
- Strong case: `var(--accent-teal)` + "STRONG CASE"
- Moderate case: `var(--accent-amber)` + "MODERATE CASE"
- Weak case: `var(--accent-coral)` + "WEAK CASE"

**For Competitive Analysis:** Replace with Threat Level badge.
**For Market Research:** Replace with Market Health badge.

### 4.3 RelevanceCallout Visual Spec

```
Background: rgba(45, 181, 163, 0.06)    // accent-teal at 6%
Border: 1px solid rgba(45, 181, 163, 0.15)
Border-radius: 16px
Padding: 20px 24px

┌─────────────────────────────────────────────┐
│  WHY THIS MATTERS TO YOU                     │
│                                              │
│  As a VP of Sales at LogiTech, Acme's        │
│  expansion aligns with 3 of your active      │
│  influence dimensions...                     │
└──────────────────────────────────────────────┘
```

- Title: `11px`, `font-weight: 600`, uppercase, monospace, `var(--accent-teal)`, `letter-spacing: 0.05em`, `margin-bottom: 12px`
- Body: `14px`, `line-height: 1.6`, `var(--text)`

### 4.4 BentoPanel Visual Spec

```
Background: var(--surface)
Border: 1px solid var(--border)
Border-radius: 16px
Padding: 24px

┌─────────────────────────────────────────────┐
│  [Icon 16px]  SECTION TITLE                  │
│                                              │
│  • Bullet text with [s1] tag  ── fact        │
│  • Another bullet [s2, s3]   ── inference    │
│  • Third bullet [s4]         ── fact         │
└──────────────────────────────────────────────┘
```

- Section title: `13px`, `font-weight: 600`, uppercase, `letter-spacing: 0.04em`, `var(--text-muted)`, `margin-bottom: 16px`
- Icon: `16px`, positioned left of title, colored per section type
- If section has no bullets, do NOT render the panel (hide empty sections)

**Section-specific icon colors:**
- Talking Points: `var(--accent-teal)` — CheckCircle icon
- Landmines: `var(--accent-coral)` — AlertTriangle icon
- Questions to Ask: `var(--accent)` — HelpCircle icon
- Opportunity Signals: `var(--accent-teal)` — Lightbulb icon
- Competitor Context: `var(--accent-amber)` — Swords icon
- Risk Factors: `var(--accent-coral)` — ShieldAlert icon
- Proof Points: `var(--accent-teal)` — BadgeCheck icon
- Market Validation: `var(--accent)` — TrendingUp icon

### 4.5 BulletItem Visual Spec

```
┌─────────────────────────────────────────────┐
│  • Bullet text that describes a finding      │
│    or recommendation based on evidence.      │
│    [s1] [s3]  fact                           │
└──────────────────────────────────────────────┘
```

- Bullet text: `14px`, `line-height: 1.6`, `var(--text)`
- Source tags (`[s1]`, `[s3]`): `11px`, `font-weight: 500`, `var(--accent-teal)`, `cursor: pointer`, underline on hover, click scrolls to source
- Fact/inference badge: `11px`, `font-weight: 500`, `padding: 2px 8px`, `border-radius: 4px`
  - Fact: `background: rgba(45, 181, 163, 0.12)`, `color: var(--accent-teal)`
  - Inference: `background: rgba(202, 194, 255, 0.12)`, `color: var(--accent-violet)`
- Gap between bullets: `12px`
- Bullet marker: `6px` circle, `var(--border-strong)`, `margin-right: 12px`, `margin-top: 8px`

### 4.6 MetricsRow Visual Spec (Business Case, Market Research)

```
┌────────────┐  ┌────────────┐  ┌────────────┐
│   $4.2B    │  │  32% YoY   │  │    78%     │
│   TAM ↗    │  │  Growth ↗  │  │ Retention ↗│
│   [s1]     │  │  [s3]      │  │ [s5]       │
└────────────┘  └────────────┘  └────────────┘
```

- Each metric: `background: var(--surface)`, `border: 1px solid var(--border)`, `border-radius: 12px`, `padding: 16px`, `text-align: center`
- Value: `28px`, `font-weight: 700`, `var(--text-strong)`, `font-family: var(--font-display)`
- Trend arrow: `↗` = `var(--accent-teal)`, `↘` = `var(--accent-coral)`, `→` = `var(--text-muted)`, appended to value
- Label: `12px`, `font-weight: 500`, `var(--text-muted)`, `margin-top: 4px`
- Source: `11px`, `var(--accent-teal)`, `margin-top: 4px`
- Grid: `grid-template-columns: repeat(auto-fit, minmax(140px, 1fr))`, `gap: 12px`
- Mobile (≤375px): stack to single column

### 4.7 CompanyCard Visual Spec

```
┌─────────────────────────────────────────────┐
│  COMPANY INTEL                               │
│                                              │
│  Acme Corp                                   │
│  Industry: Logistics                         │
│  HQ: San Francisco                           │
│  Employees: 450                              │
│  Funding: Series C ($50M)                    │
│  CEO: Jane Smith                             │
│  Latest: Opened Singapore office (Mar 2026)  │
└──────────────────────────────────────────────┘
```

- Uses BentoPanel as container
- Company name: `18px`, `font-weight: 600`, `var(--text-strong)`, `margin-bottom: 16px`
- Each field: `14px`, label in `var(--text-muted)`, value in `var(--text)`, `line-height: 1.8`
- Null fields are omitted (not shown as "N/A")

### 4.8 PersonCard Visual Spec

```
┌────────────────────────────────────┐
│  👤  Jane Smith                    │
│      CEO, Acme Corp               │
│      Ex-Amazon, 15yr supply       │
│      chain experience.            │
└────────────────────────────────────┘
```

- Avatar placeholder: `36px` circle, `var(--surface-strong)`, centered user icon `var(--text-muted)`
- Name: `15px`, `font-weight: 600`, `var(--text)`
- Title: `13px`, `var(--text-muted)`
- Background: `13px`, `var(--text-muted)`, `line-height: 1.5`, `margin-top: 4px`
- Card: `background: var(--surface)`, `border: 1px solid var(--border)`, `border-radius: 12px`, `padding: 16px`

### 4.9 TimelineStrip Visual Spec (Market Research)

```
│  ●── Jan 2026: FedEx acquires AutoRoute ($2B) [s1]
│
│  ●── Mar 2026: EU passes logistics AI regs [s3]
│
│  ●── Apr 2026: Series B wave — 4 startups raise [s5]
```

- Vertical line: `2px`, `var(--border)`, left margin `16px`
- Dots: `10px` circle on the line
  - Positive impact: `var(--accent-teal)`
  - Negative impact: `var(--accent-coral)`
  - Neutral: `var(--text-muted)`
- Date: `12px`, `font-weight: 500`, monospace, `var(--text-muted)`
- Event: `14px`, `var(--text)`, `line-height: 1.5`
- Source tag: `11px`, `var(--accent-teal)`
- Gap between events: `20px`

### 4.10 SourceCarousel Visual Spec

```
┌─ SOURCES (12) ──────────────────────────────────────┐
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ◀── ▶   │
│  │ s1       │  │ s2       │  │ s3       │           │
│  │ TechCrn  │  │ Reuters  │  │ WSJ      │           │
│  │ Mar 2026 │  │ Mar 2026 │  │ Feb 2026 │           │
│  └──────────┘  └──────────┘  └──────────┘           │
└─────────────────────────────────────────────────────┘
```

- Horizontal scroll container, `overflow-x: auto`, `scrollbar-hide`
- Each card: `min-width: 200px`, `background: var(--surface)`, `border: 1px solid var(--border)`, `border-radius: 12px`, `padding: 14px`
- ID badge: `11px`, monospace, `var(--accent-teal)`, `font-weight: 600`
- Domain: `13px`, `font-weight: 500`, `var(--text)`, truncate with ellipsis
- Date: `12px`, `var(--text-muted)`
- Provider badge: tiny chip — Exa in `var(--accent-teal)`, Tavily in `var(--accent-violet)`
- Click: opens source URL in new tab
- Highlighted source (when clicking [s1] from bullet): `border-color: var(--accent)`, `box-shadow: 0 0 0 1px var(--accent)`, smooth scroll into view

### 4.11 ProgressTracker Visual Spec

Shown during SSE streaming, before results:

```
┌─────────────────────────────────────────────┐
│  Preparing your intelligence brief...        │
│                                              │
│  ✓  Loading your profile          120ms      │
│  ✓  Refining research intent      800ms      │
│  ✓  Searching company data        1.2s       │
│  ✓  Finding recent news           900ms      │
│  ◉  Searching attendee profiles...           │
│  ○  Synthesizing intelligence                │
└──────────────────────────────────────────────┘
```

- Container: `background: var(--surface)`, `border-radius: 16px`, `padding: 32px`, centered, `max-width: 480px`
- Title: `18px`, `font-weight: 600`, `var(--text)`, `margin-bottom: 24px`
- Each step: `14px`, `var(--text)`, `line-height: 2.4`
- Completed: `✓` in `var(--accent-teal)`, time in `var(--text-muted)` monospace `11px`
- In progress: `◉` animated pulse in `var(--accent)`, text in `var(--text)`
- Pending: `○` in `var(--border)`, text in `var(--text-muted)`
- Checkmark animation: scale 0→1, `300ms`, spring easing
- Step stagger: each step appears as SSE event arrives

### 4.12 Layout Assembly

**Meeting Prep Layout order:**
1. DashboardHeader (confidence)
2. RelevanceCallout
3. CompanyCard + PersonCards (2-col on desktop, stacked on mobile)
4. BentoPanel: Recent Moves
5. BentoPanel: Talking Points + BentoPanel: Landmines (2-col desktop, stacked mobile)
6. BentoPanel: Questions to Ask
7. BentoPanel: Opportunity Signals
8. BentoPanel: Competitor Context (if non-empty)
9. SourceCarousel
10. ActionBar

**Business Case Layout order:**
1. DashboardHeader (verdict)
2. RelevanceCallout
3. MetricsRow
4. BentoPanel: Market Validation + BentoPanel: Proof Points (2-col)
5. BentoPanel: Risk Factors + BentoPanel: Comparable Cases (2-col)
6. BentoPanel: Metrics Framework
7. BentoPanel: Recommended Next Steps
8. SourceCarousel
9. ActionBar

**Competitive Analysis Layout order:**
1. DashboardHeader (threat level)
2. RelevanceCallout
3. Competitor cards (each: CompanyCard + strengths + weaknesses) in grid
4. BentoPanel: Positioning Gaps + BentoPanel: Your Advantages (2-col)
5. BentoPanel: Feature Comparison
6. BentoPanel: Market Perception
7. BentoPanel: Emerging Threats + BentoPanel: Recommended Actions (2-col)
8. SourceCarousel
9. ActionBar

**Market Research Layout order:**
1. DashboardHeader (market health)
2. RelevanceCallout
3. MetricsRow
4. TimelineStrip
5. BentoPanel: Market Overview + BentoPanel: Key Players (2-col)
6. BentoPanel: Trend Evidence
7. BentoPanel: Opportunities + BentoPanel: Risks (2-col)
8. SourceCarousel
9. ActionBar

### 4.13 Panel Entrance Animation

- Each panel: `fadeInUp` — opacity 0→1, translateY 12px→0, `400ms`, `ease-out`
- Stagger: each panel delayed `+80ms` from previous
- Metric count-up: number counts from 0 to value, `800ms`, `ease-out`
- Source carousel: smooth horizontal scroll, `300ms`

### Files to Create

```
src/app/app/intelligence/
  ├── IntelligenceDashboard.tsx       (NEW — routes to correct layout by research type)
  ├── dashboard/
  │   ├── DashboardHeader.tsx         (NEW)
  │   ├── RelevanceCallout.tsx        (NEW)
  │   ├── MetricsRow.tsx              (NEW)
  │   ├── BentoPanel.tsx              (NEW)
  │   ├── BulletItem.tsx              (NEW)
  │   ├── CompanyCard.tsx             (NEW)
  │   ├── PersonCard.tsx              (NEW)
  │   ├── TimelineStrip.tsx           (NEW)
  │   ├── SourceCarousel.tsx          (NEW — replaces IntelligenceSources)
  │   ├── ActionBar.tsx               (NEW)
  │   └── ProgressTracker.tsx         (NEW)
  ├── layouts/
  │   ├── MeetingPrepLayout.tsx       (NEW)
  │   ├── BusinessCaseLayout.tsx      (NEW)
  │   ├── CompetitiveLayout.tsx       (NEW)
  │   └── MarketResearchLayout.tsx    (NEW)
```

### Acceptance Criteria — Phase 4

| # | Criterion | How Agent Verifies |
|---|-----------|-------------------|
| 4.1 | Meeting prep dashboard shows all expected panels | Browser screenshot, count panels |
| 4.2 | Business case shows key metrics with trend arrows | Visual check in browser |
| 4.3 | Competitive analysis shows per-competitor cards | 2 competitors → 2 cards visible |
| 4.4 | Market research shows timeline with colored dots | Visual check |
| 4.5 | Source citations ([s1]) are clickable, scroll to source | Click interaction test |
| 4.6 | Fact/inference tags render with correct colors | Teal for fact, violet for inference |
| 4.7 | Progress tracker shows live SSE updates during search | Watch during real request |
| 4.8 | Dashboard responsive at 375px (mobile), 768px (tablet), 1200px+ (desktop) | Screenshots at all 3 widths |
| 4.9 | RelevanceCallout mentions user's actual role/industry | Text verification |
| 4.10 | Empty sections are hidden (not shown as empty cards) | Submit with no competitors → no competitor panel |
| 4.11 | Panel entrance animations play with stagger | Visual check |
| 4.12 | No gradient bars, no AI slop, no decorative blobs | Visual audit |
| 4.13 | `npm run build` passes | Terminal |

---

## Phase 5 — Follow-Up Chat & Actions

### Goal
Let the user interact with their synthesized intelligence: ask follow-up questions, copy/share the brief, export it.

### 5.1 Follow-Up Chat

Collapsible chat panel below the dashboard:

- Chat context = full synthesis output + all evidence + user profile
- Uses same model cascade as synthesis
- System prompt: "You are continuing a conversation about this intelligence brief. Answer based only on the evidence provided. Cite sources by ID."
- Max 10 follow-up turns per session
- Each turn: POST `/api/intelligence/chat`
- **Log each chat turn** to `pro_ai_usage` as `function_name: 'intelligence_v3_chat'`

**Visual spec:**
- Container: `background: var(--surface)`, `border: 1px solid var(--border)`, `border-radius: 16px`, `padding: 24px`
- Toggle button: "Ask a follow-up" with MessageSquare icon
- User messages: right-aligned, `background: var(--accent)` at 10%, `border-radius: 12px`, `padding: 12px 16px`
- Assistant messages: left-aligned, `background: var(--surface-strong)`, `border-radius: 12px`, `padding: 12px 16px`
- Source tags in responses: same `[s1]` style as dashboard
- Input: full-width text input at bottom, "Send" button on right
- After 10 turns: "You've reached the conversation limit for this brief."

### 5.2 Action Bar

Fixed at bottom of dashboard (not browser bottom — below content):

| Action | Icon | Implementation |
|--------|------|---------------|
| Copy Brief | `Copy` | Converts dashboard to clean markdown via clipboard API |
| Download | `Download` | Generates markdown file download |
| Share | `Share` | Toggle share + copy URL (requires Phase 6 persistence) |

**Visual spec:**
- Container: `background: var(--bg)`, `border-top: 1px solid var(--border)`, `padding: 16px 24px`, `gap: 12px`, flex row
- Each button: `background: var(--surface)`, `border: 1px solid var(--border)`, `border-radius: 10px`, `padding: 10px 16px`, `font-size: 13px`, `font-weight: 500`
- Icon: `16px`, `margin-right: 8px`
- Copy confirmation: button text changes to "Copied!" with checkmark for 2s

### 5.3 Brief to Markdown Converter

Converts any V3 brief to clean, readable markdown:

```markdown
# Meeting Prep: Acme Corp
**Generated**: April 18, 2026  
**Confidence**: High

## Bottom Line
Acme just closed a $50M Series C and is expanding into APAC...

## Why This Matters to You
As a VP of Sales at LogiTech...

## Talking Points
- Mention their APAC expansion — shows you did homework [s2] _fact_
- Reference A16Z round as vote of confidence [s1] _fact_

## Landmines
...

## Sources
1. [s1] TechCrunch — "Acme raises $50M" (techcrunch.com)
2. [s2] Reuters — "Acme opens Singapore office" (reuters.com)
```

### Files to Create

```
src/app/app/intelligence/
  ├── ChatPanel.tsx                   (NEW)
  ├── dashboard/ActionBar.tsx         (already listed in Phase 4)
  └── utils/
      └── brief-to-markdown.ts        (NEW)

src/app/api/intelligence/
  └── chat/route.ts                   (NEW)
```

### Acceptance Criteria — Phase 5

| # | Criterion | How Agent Verifies |
|---|-----------|-------------------|
| 5.1 | Chat panel opens on "Ask a follow-up" click | Browser interaction |
| 5.2 | Follow-up returns relevant answer with source citations | Ask question → response cites [s1] etc. |
| 5.3 | Chat context includes synthesis + evidence | Log chat prompt → contains brief data |
| 5.4 | Copy Brief puts clean markdown on clipboard | Click Copy → paste → clean formatted text |
| 5.5 | Download generates markdown file | Click Download → file downloads |
| 5.6 | Chat limited to 10 turns | After 10 → limit message shown |
| 5.7 | Chat usage logged to pro_ai_usage | Check table → rows with function_name 'intelligence_v3_chat' |
| 5.8 | `npm run build` passes | Terminal |

---

## Phase 6 — Persistence & History

### Goal
Save intelligence briefs to the database so users can revisit, share, and build on previous research.

### 6.1 Database Migration

See [Database Schema](#database-schema) section for full DDL. Create migration file.

### 6.2 Persistence Flow

After V3 brief generation completes:
1. Insert brief into `intelligence_briefs` table (async, non-blocking — don't delay SSE result)
2. Use service role client
3. Include `user_profile_snapshot` for historical context

### 6.3 History Page (`/app/intelligence/history`)

```
┌─────────────────────────────────────────────┐
│  Your Intelligence Briefs                    │
│                                              │
│  ┌─ Today ───────────────────────────────┐   │
│  │ 📋 Meeting Prep: Acme Corp    10m ago │   │
│  │    Sales call • High confidence        │   │
│  │                                        │   │
│  │ 📊 Business Case: Weekend     2h ago  │   │
│  │    Strong case • 3 proof points        │   │
│  └────────────────────────────────────────┘   │
│                                              │
│  ┌─ Yesterday ───────────────────────────┐   │
│  │ ⚔️ Competitive: Acme vs Beta  1d ago  │   │
│  │    Medium threat • 2 competitors       │   │
│  └────────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

- List from `GET /api/intelligence/history` (user-scoped via RLS)
- Grouped by day
- Each item: research type icon + headline + metadata line (type label, confidence, timestamp)
- Click: navigates to `/app/intelligence/{briefId}` which loads saved brief into dashboard

### 6.4 Brief Reload Page (`/app/intelligence/[briefId]`)

- Fetches brief from `GET /api/intelligence/{briefId}`
- Renders same dashboard layout as live generation (no progress tracker)
- If brief not found or not owned → redirect to `/app/intelligence`

### 6.5 Public Share Page (`/signal/[briefId]`)

- Fetches brief from API using share_slug
- Read-only dashboard layout (no chat, no action bar except Copy)
- No auth required
- If brief not shared or not found → 404 page
- Share toggle on ActionBar: "Make shareable" → POST `/api/intelligence/{briefId}/share`

### Files to Create

```
src/app/app/intelligence/
  ├── history/page.tsx                (NEW — history list)
  └── [briefId]/page.tsx              (NEW — reload saved brief)

src/app/signal/
  └── [briefId]/page.tsx              (NEW — public share view)

src/app/api/intelligence/
  ├── history/route.ts                (NEW — list user's briefs)
  └── [briefId]/
      ├── route.ts                    (NEW — get/update brief)
      └── share/route.ts             (NEW — toggle share)

supabase/migrations/
  └── YYYYMMDDHHMMSS_intelligence_v3_tables.sql  (NEW)
```

### Acceptance Criteria — Phase 6

| # | Criterion | How Agent Verifies |
|---|-----------|-------------------|
| 6.1 | Brief saved to DB after generation | Query intelligence_briefs → row exists |
| 6.2 | History page lists briefs in reverse chronological order | Browser: generate 2 briefs → history shows both |
| 6.3 | Clicking history item loads full dashboard | Click → dashboard renders with saved data |
| 6.4 | Share toggle generates public URL | Toggle → URL appears, copy works |
| 6.5 | Public share URL shows read-only dashboard | Visit /signal/{id} without auth → dashboard renders |
| 6.6 | Briefs are user-scoped (RLS) | User A cannot see User B's briefs |
| 6.7 | `npm run build` passes | Terminal |

---

## Phase 7 — Polish, Hardening & Monitoring

### Goal
Production-ready quality: error handling, caching, rate limiting, health monitoring, cost visibility, and mobile polish.

### 7.1 Error Handling Matrix

| Scenario | Behavior |
|----------|----------|
| Exa API down | Skip Exa, continue with Tavily. Show "Some sources unavailable" badge on dashboard |
| Tavily API down | Skip Tavily, continue with Exa. Show badge |
| Both search APIs down | Show error: "Search is temporarily unavailable. Try again in a few minutes." |
| LLM synthesis fails | Show degraded mode: raw evidence + sources, no synthesis panels. Banner: "AI analysis unavailable — showing raw evidence" |
| LLM returns invalid JSON | Retry once with prompt: "Your previous response was invalid JSON. Return ONLY valid JSON." |
| User not authenticated | Redirect to /login |
| Rate limit exceeded | Show "You've reached the limit. Try again in {seconds}s." with countdown |
| Network timeout | Show "Request timed out. Try again." with retry button |
| Service role key missing | Log error, return 500 with generic message (never expose key details) |

### 7.2 Rate Limiting

| Tier | Limit | Window |
|------|-------|--------|
| Default | 10 briefs/day | 24h rolling |
| API | 10 requests/minute | Per-minute bucket |

Rate limit tracked per user via in-memory map (same pattern as V2 route). For V7+, migrate to Redis or Supabase-backed rate limits.

### 7.3 Caching

| Cache Level | What | TTL | Storage |
|-------------|------|-----|---------|
| Company snapshot | Exa structured data | 24 hours | `intelligence_company_cache` table |
| Full brief | Complete synthesis | Permanent | `intelligence_briefs` table |

Before dispatching Exa company snapshot search, check `intelligence_company_cache` for a fresh entry (< 24h). If cache hit, skip Exa call and use cached data. Report `cached: true` in SSE phase event.

### 7.4 Intelligence Health Monitoring

Create a simple health log table and reporting endpoint:

```sql
CREATE TABLE intelligence_health_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  research_type TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  degraded BOOLEAN NOT NULL DEFAULT FALSE,
  degraded_reasons TEXT[],
  search_ms INT,
  synthesis_ms INT,
  total_ms INT,
  source_count INT,
  synthesis_model TEXT,
  user_id UUID REFERENCES auth.users(id)
);
```

After every brief generation, insert a health log entry. The founder can query:
- Success rate (last 24h)
- Average latency
- Degraded brief rate
- Most common failure reasons
- Model usage distribution

Expose via `GET /api/intelligence/health` (authenticated, admin only).

### 7.5 Mobile Polish

At `375px` viewport:
- All panels stack vertically, full width
- MetricsRow becomes 1-column
- CompanyCard + PersonCards stack
- Two-column panel pairs stack
- SourceCarousel scrolls horizontally (already does)
- ActionBar becomes full-width flex-wrap
- No horizontal overflow on any element

At `768px` viewport:
- Two-column pairs remain two-column
- MetricsRow shows 2-column
- Full functionality

### 7.6 Performance Budget

| Metric | Target |
|--------|--------|
| Total brief generation | <45s (including search + synthesis) |
| Search phase | <15s |
| Synthesis phase | <30s |
| Dashboard render (after data arrives) | <200ms |
| Progress tracker first paint | <100ms after SSE connection |

### Acceptance Criteria — Phase 7

| # | Criterion | How Agent Verifies |
|---|-----------|-------------------|
| 7.1 | Partial search failure shows badge, not crash | Kill Exa key → badge visible, brief still generates |
| 7.2 | Rate limit shows clear message with countdown | Hit limit → message appears |
| 7.3 | Invalid LLM JSON triggers retry | Mock invalid → retry succeeds (check logs) |
| 7.4 | 375px: all panels stack, no horizontal overflow | Browser screenshot at 375px |
| 7.5 | Health log populated after brief generation | Query intelligence_health_log → row exists |
| 7.6 | Company cache prevents duplicate Exa calls | Same company within 24h → SSE shows "cached" |
| 7.7 | Error state shows retry button | Cause error → retry button visible and functional |
| 7.8 | `npm run build` passes | Terminal |
| 7.9 | `npx tsc --noEmit` passes | Terminal |

---

## Database Schema

### Tables to Create

```sql
-- ══════════════════════════════════════════════════════════════
-- Intelligence Briefs — Persisted research results
-- ══════════════════════════════════════════════════════════════

CREATE TABLE intelligence_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Research type discriminator
  research_type TEXT NOT NULL CHECK (research_type IN (
    'meeting_prep', 'business_case', 'competitive_analysis', 'market_research'
  )),

  -- Input (stored for replay/history display)
  request_payload JSONB NOT NULL,
  refined_intent TEXT,

  -- Output
  synthesis JSONB NOT NULL,
  sources JSONB NOT NULL,
  evidence_count INT NOT NULL DEFAULT 0,

  -- User context snapshot at generation time
  user_profile_snapshot JSONB,

  -- Evidence coverage
  evidence_coverage JSONB,

  -- Status
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  is_degraded BOOLEAN NOT NULL DEFAULT FALSE,
  degraded_reasons TEXT[],

  -- Performance
  search_ms INT,
  synthesis_ms INT,
  total_ms INT,
  source_count INT,
  synthesis_model TEXT,

  -- Sharing
  is_shared BOOLEAN NOT NULL DEFAULT FALSE,
  shared_at TIMESTAMPTZ,
  share_slug TEXT UNIQUE,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ib_user_created ON intelligence_briefs (user_id, created_at DESC);
CREATE INDEX idx_ib_share_slug ON intelligence_briefs (share_slug) WHERE share_slug IS NOT NULL;

ALTER TABLE intelligence_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own briefs" ON intelligence_briefs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own briefs" ON intelligence_briefs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own briefs" ON intelligence_briefs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Public read shared briefs" ON intelligence_briefs
  FOR SELECT USING (is_shared = true AND share_slug IS NOT NULL);


-- ══════════════════════════════════════════════════════════════
-- Follow-Up Chat Messages
-- ══════════════════════════════════════════════════════════════

CREATE TABLE intelligence_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID NOT NULL REFERENCES intelligence_briefs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  source_ids TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_icm_brief ON intelligence_chat_messages (brief_id, created_at ASC);

ALTER TABLE intelligence_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own chat" ON intelligence_chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own chat" ON intelligence_chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ══════════════════════════════════════════════════════════════
-- Company Snapshot Cache (24h TTL)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE intelligence_company_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name_normalized TEXT NOT NULL,
  snapshot JSONB NOT NULL,
  source_url TEXT,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  UNIQUE (company_name_normalized)
);

CREATE INDEX idx_icc_lookup ON intelligence_company_cache (company_name_normalized, expires_at);


-- ══════════════════════════════════════════════════════════════
-- Intelligence Health Log (for monitoring)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE intelligence_health_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  research_type TEXT NOT NULL,
  success BOOLEAN NOT NULL,
  degraded BOOLEAN NOT NULL DEFAULT FALSE,
  degraded_reasons TEXT[],
  search_ms INT,
  synthesis_ms INT,
  total_ms INT,
  source_count INT,
  synthesis_model TEXT,
  user_id UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_ihl_created ON intelligence_health_log (created_at DESC);
```

---

## API Contracts

### POST `/api/intelligence/v3`

**Request:** Discriminated union body (one of `MeetingPrepInput | BusinessCaseInput | CompetitiveAnalysisInput | MarketResearchInput`)

**Response:** SSE stream

```typescript
// Phase events (multiple)
{ event: 'phase', data: { phase: string, status: 'running' | 'complete' | 'failed', ms?: number, resultCount?: number } }

// Final result (one)
{ event: 'result', data: IntelligenceBriefV3 }

// Error (one, terminal)
{ event: 'error', data: { message: string, code: string } }
```

### POST `/api/intelligence/refine-goal`

**Request:** `{ goal: string, meetingType: string, accountName: string }`
**Response:** `{ refined: string }`

### POST `/api/intelligence/chat`

**Request:** `{ briefId: string, message: string }`
**Response:** `{ role: 'assistant', content: string, sourceIds: string[] }`

### GET `/api/intelligence/history`

**Response:** `Array<{ id, researchType, headline, confidence, createdAt, primaryEntity }>`

### GET `/api/intelligence/[briefId]`

**Response:** `IntelligenceBriefV3`

### POST `/api/intelligence/[briefId]/share`

**Request:** `{ shared: boolean }`
**Response:** `{ shareUrl: string | null }`

### GET `/api/intelligence/health`

**Response:** `{ successRate, avgLatencyMs, degradedRate, recentFailures, modelDistribution }`

---

## Visual Specification

### Color Usage by Panel Type

| Panel | Background | Border | Icon Color |
|-------|-----------|--------|------------|
| Header / Hero Slab | `var(--surface)` | none | — |
| Relevance Callout | `rgba(45,181,163,0.06)` | `rgba(45,181,163,0.15)` | `var(--accent-teal)` |
| Company Intel | `var(--surface)` | `var(--border)` | `var(--accent)` |
| Key People | `var(--surface)` | `var(--border)` | `var(--accent-violet)` |
| Talking Points | `var(--surface)` | `var(--border)` | `var(--accent-teal)` |
| Landmines | `var(--surface)` | `rgba(255,122,89,0.2)` | `var(--accent-coral)` |
| Questions | `var(--surface)` | `var(--border)` | `var(--accent)` |
| Opportunity Signals | `var(--surface)` | `rgba(45,181,163,0.2)` | `var(--accent-teal)` |
| Competitor Context | `var(--surface)` | `rgba(255,200,87,0.2)` | `var(--accent-amber)` |
| Key Metrics | `var(--surface)` | `var(--border)` | varies by trend |
| Timeline | `var(--surface)` | `var(--border)` | varies by impact |
| Sources | `var(--surface)` | `var(--border)` | `var(--text-muted)` |

### Typography Scale

| Element | Size | Weight | Font | Color |
|---------|------|--------|------|-------|
| Dashboard headline | 24px / 1.3 | 700 | display | `var(--text-strong)` |
| Bottom line | 16px / 1.5 | 400 | sans | `var(--text-muted)` |
| Section title | 13px / 1.2 | 600 | sans | `var(--text-muted)` |
| Bullet text | 14px / 1.6 | 400 | sans | `var(--text)` |
| Source tag | 11px / 1 | 500 | mono | `var(--accent-teal)` |
| Metric value | 28px / 1 | 700 | display | `var(--text-strong)` |
| Metric label | 12px / 1.2 | 500 | sans | `var(--text-muted)` |
| Timeline date | 12px / 1 | 500 | mono | `var(--text-muted)` |
| Timeline event | 14px / 1.4 | 400 | sans | `var(--text)` |
| Confidence badge | 11px / 1 | 600 | mono | varies |
| Card label | 13px / 1.2 | 500 | sans | `var(--text-muted)` |

### Spacing

| Token | Value |
|-------|-------|
| Panel gap | 16px |
| Panel padding | 24px |
| Bullet gap | 12px |
| Section title → content | 16px |
| Metrics gap | 12px |
| Two-column gap | 16px |
| Dashboard max-width | 800px |
| Dashboard horizontal padding | 24px (desktop), 16px (mobile) |

### Breakpoints

| Name | Width | Layout Changes |
|------|-------|---------------|
| Mobile | ≤640px | Single column, stacked panels, 1-col metrics |
| Tablet | 641-1023px | Two-column pairs, 2-col metrics |
| Desktop | ≥1024px | Full two-column pairs, 3-col metrics |

---

## Design Anti-Slop Rules

These rules are **mandatory**. Every UI element the agent builds must pass these checks:

| Rule | What It Means | How to Verify |
|------|---------------|---------------|
| No gradient bars | No colored gradient strips at top/bottom of cards or pages | Visual scan |
| No rainbow accents | Max 1 dominant accent + 1 supporting accent per viewport | Count accents per screen |
| No generic AI purple | Violet is for synthesis/inference tags ONLY, not backgrounds | Check all backgrounds |
| No decorative blobs | No floating circles, waves, or abstract shapes that don't serve grouping | Visual scan |
| No rounded-everything | Radii must vary: 12px for small, 16px for panels, 20px for hero slab | Inspect radii |
| No wall of text | Every section has a clear visual container with padding and border | Visual scan |
| No identical repeated cards | If 3+ sections look the same, break with different layout | Compare panel heights/shapes |
| No busy chrome | Minimal navigation on dashboard, no excessive toolbars | Count UI elements |
| Solid buttons only | No gradient-filled buttons | Visual check |
| Readable body text | `14px` minimum, `1.6` line-height, high contrast | Check font sizes |
| Monospace for metadata only | Timestamps, source IDs, confidence badges — never body text | Check font usage |
| Source tags must be functional | Clicking `[s1]` must scroll to and highlight the source | Click test |

---

## Cost & Usage Logging

### What Gets Logged

Every LLM call in the intelligence pipeline must log to `pro_ai_usage`:

| Call | function_name | When |
|------|--------------|------|
| Intent refinement | `intelligence_v3_refine` | Phase 2 |
| Main synthesis | `intelligence_v3_synthesis` | Phase 3 |
| Follow-up chat | `intelligence_v3_chat` | Phase 5 |
| Goal refinement (form) | `intelligence_v3_refine_goal` | Phase 1 endpoint |

### Log Schema

```typescript
{
  user_id: string
  function_name: string
  provider: string
  model: string
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  estimated_cost_usd: number
  status: 'success' | 'error' | 'timeout'
  latency_ms: number
  metadata: {
    research_type: string
    evidence_count: number
    source_count: number
  }
  created_at: string // auto
}
```

### Cost Estimation Table

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|----------------------|
| gemini-2.5-flash | $0.15 | $0.60 |
| gemini-2.0-flash | $0.10 | $0.40 |
| google/gemini-2.5-flash (OpenRouter) | $0.15 | $0.60 |
| anthropic/claude-sonnet-4 (OpenRouter) | $3.00 | $15.00 |

When the provider returns actual token counts, use those. Otherwise estimate: `tokens ≈ characters / 4`.

---

## Agent Working Protocol

### Execution Rules

1. **Phase-by-phase.** Complete one phase fully before starting the next.
2. **Build → Typecheck → Browser test → Log progress.** Every phase ends with all 4 steps.
3. **Use subagents aggressively.** See Subagent Delegation Map below.
4. **Test in browser.** After every UI phase, open the browser, navigate to `/app/intelligence`, and take screenshots to verify visual quality.
5. **No human steps.** Never leave instructions like "run this command" or "configure this setting" — do it yourself.
6. **Fix forward.** If a typecheck or build fails, fix it before moving on. Never skip errors.
7. **Log to changelog.** After each phase completion, append to `docs/CHANGELOG_INTELLIGENCE_V3.md`.

### File Size Discipline

- Max 400 code lines per file
- Max 150 lines per function/component
- If a file exceeds limits, extract into subcomponents immediately
- Each dashboard component is its own file
- Each form is its own file
- Each layout is its own file

### Import Discipline

- Use `@/` path alias for all imports
- No circular imports
- Types in dedicated `types.ts` files
- Constants in dedicated `constants.ts` files

### Error Handling

- Every `fetch` call must have a timeout via `AbortController`
- Every external API call must have try/catch with graceful degradation
- Never expose API keys, service role keys, or internal errors to the client
- Log errors server-side with enough context to debug

### Security

- Auth on every API route (except public share)
- Rate limiting on all intelligence endpoints
- Input sanitization (max lengths, valid URLs only, no script injection)
- Service role key only used server-side, never exposed to client
- SSRF prevention: validate URLs before passing to search providers

---

## Acceptance Criteria (Global)

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
| G11 | Mobile layout works at 375px with no horizontal overflow |
| G12 | Degraded mode works when LLM fails |
| G13 | Rate limiting prevents abuse |
| G14 | All external API calls have timeouts |
| G15 | Every LLM call logged to pro_ai_usage with cost estimate |
| G16 | Health monitoring logs success/failure/degraded for every brief |
| G17 | No AI slop: no gradient bars, no decorative blobs, no rainbow accents |
| G18 | `npm run build` passes |
| G19 | `npx tsc --noEmit` passes |

---

## Test Plan

### Phase 1 Tests

```
Test 1.1: Research Type Selection
  Given: User lands on /app/intelligence
  When:  Page loads
  Then:  4 research type cards visible in 2×2 grid
  And:   No form visible yet

Test 1.2: Meeting Prep Form Fields
  Given: User selects "Meeting Prep"
  When:  Form appears
  Then:  Fields: accountName, meetingType chips, goal, website, attendees, context, competitors
  And:   accountName and goal have required indicators

Test 1.3: Required Field Validation
  Given: User selects "Meeting Prep"
  When:  Clicks submit without filling required fields
  Then:  Error shown on required fields, form does not submit

Test 1.4: Tag Input (Attendees)
  Given: Meeting prep form visible
  When:  Types "Jane Doe" + Enter → appears as chip
  When:  Clicks X → chip removed
  When:  Adds 5 + tries 6th → "Max 5" message

Test 1.5: AI Refine Goal
  Given: Goal text entered
  When:  Clicks "Refine" button
  Then:  Spinner → refined text replaces goal → "Undo" link visible

Test 1.6: Form State Preservation
  Given: Meeting prep form filled
  When:  Switches to "Business Case" then back to "Meeting Prep"
  Then:  Previous data preserved

Test 1.7: Mobile Layout
  Given: 375px viewport
  Then:  Cards stack vertically, form fields full-width

Test 1.8: Submit Payload Shape
  Given: Meeting prep form filled and submitted
  Then:  Network tab shows correct discriminated union: { researchType: 'meeting_prep', ... }
```

### Phase 2 Tests

```
Test 2.1: Profile Fetched
  Given: Authenticated user with profile data
  When:  Submits meeting prep
  Then:  Logs show profile_passage + ≥1 dimensions

Test 2.2: Parallel Search
  Given: Meeting prep with account + 2 attendees + 1 competitor
  When:  Submitted
  Then:  ≥6 searches in parallel, total time < max(individual) + 2s

Test 2.3: SSE Events
  Given: Submission in progress
  Then:  Frontend receives phase events in order with running → complete transitions

Test 2.4: Partial Failure
  Given: Exa API key invalid
  When:  Submitted
  Then:  Tavily results still returned, degraded_reasons includes "exa_snapshot_failed"

Test 2.5: Intent Refinement
  Given: Raw goal "close the deal"
  When:  Refined
  Then:  Output is more specific and actionable than input
```

### Phase 3 Tests

```
Test 3.1: Meeting Prep Synthesis
  Given: 12 sources + user profile
  Then:  Output has headline, bottomLine, confidence, talkingPoints(≥3), landmines(≥2), questionsToAsk(≥3)
  And:   relevanceToYou mentions user's role and ≥1 dimension

Test 3.2: Business Case Synthesis
  Given: Evidence about "weekend delivery"
  Then:  Output has verdict, keyMetrics(≥1), marketValidation(≥2), proofPoints(≥2)

Test 3.3: Source Citation Integrity
  Given: Synthesis output
  Then:  Every sourceId in every bullet exists in sources array

Test 3.4: Model Fallback
  Given: Primary model returns 401
  Then:  Synthesis succeeds with fallback model

Test 3.5: Degraded Mode
  Given: All LLM models fail
  Then:  is_degraded=true, sections empty, sources populated

Test 3.6: Cost Logged
  Given: Any synthesis call
  Then:  pro_ai_usage has row with model, tokens, cost, latency
```

### Phase 4 Tests

```
Test 4.1: Meeting Prep Dashboard
  Given: Successful meeting prep brief
  Then:  Panels visible: Header, Relevance, Company, People, Talking, Landmines, Questions, Sources

Test 4.2: Business Case Dashboard
  Given: Successful business case
  Then:  MetricsRow with trend arrows, verdict badge with correct color

Test 4.3: Market Research Timeline
  Given: Market research brief
  Then:  TimelineStrip with ≥2 events, colored dots

Test 4.4: Mobile Layout
  Given: 375px viewport
  Then:  All panels stack, no horizontal overflow

Test 4.5: Source Citation Click
  Given: Bullet with [s1]
  When:  Clicks [s1]
  Then:  Source carousel scrolls to s1, s1 highlighted

Test 4.6: Empty Section Hiding
  Given: No competitors provided
  Then:  Competitor context panel not rendered

Test 4.7: Anti-Slop Check
  Given: Dashboard rendered
  Then:  No gradient bars, no decorative blobs, no rainbow accents, buttons are solid
```

### Phase 5 Tests

```
Test 5.1: Chat Opens
  Given: Dashboard rendered
  When:  Clicks "Ask a follow-up"
  Then:  Chat panel slides open

Test 5.2: Chat Response
  Given: Chat open
  When:  Types "What's the biggest risk?"
  Then:  Response references specific evidence, includes sourceIds

Test 5.3: Copy Brief
  Given: Dashboard rendered
  When:  Clicks "Copy Brief"
  Then:  Clipboard contains formatted markdown

Test 5.4: Chat Limit
  Given: 10 messages sent
  Then:  "Limit reached" message shown
```

### Phase 6 Tests

```
Test 6.1: Persistence
  Given: Brief generated
  Then:  Row in intelligence_briefs with correct user_id

Test 6.2: History Page
  Given: 2 saved briefs
  When:  Visits /app/intelligence/history
  Then:  2 items, newest first, correct icons and metadata

Test 6.3: Reload
  Given: Clicks history item
  Then:  Full dashboard from saved data (no re-generation)

Test 6.4: Public Share
  Given: Share toggled on
  Then:  /signal/{slug} shows read-only dashboard without auth

Test 6.5: RLS
  Given: User A's brief
  When:  User B tries to access
  Then:  404 returned
```

### Phase 7 Tests

```
Test 7.1: Rate Limiting
  Given: Exceeded daily limit
  Then:  429 with "Daily limit reached" + cooldown

Test 7.2: Timeout Handling
  Given: Exa >20s
  Then:  That search marked failed, others continue

Test 7.3: Health Log
  Given: Brief generated
  Then:  intelligence_health_log has row with correct metrics

Test 7.4: Cache Hit
  Given: Same company within 24h
  Then:  No Exa call, SSE shows cached phase
```

---

## Subagent Delegation Map

### Phase 1 — 3 Parallel Subagents

```
Subagent A: ResearchTypeSelector + page.tsx routing + types.ts + constants.ts
Subagent B: MeetingPrepForm + BusinessCaseForm + shared components (TagInput, ChipSelector, FormSection)
Subagent C: CompetitiveAnalysisForm + MarketResearchForm + AIRefineButton + refine-goal/route.ts
```

### Phase 2 — 3 Parallel Subagents

```
Subagent A: supabase-server.ts + profile-fetcher.ts + research-plan.ts (all 4 types) + intent-refiner.ts
Subagent B: exa.ts expansions + tavily.ts expansions + normalize.ts (v3 enhancements)
Subagent C: sse-stream.ts + v3/route.ts (full SSE API endpoint) + usage-logger.ts
```

### Phase 3 — 2 Parallel Subagents

```
Subagent A: system-prompt.ts + meeting-prep.ts + business-case.ts prompts
Subagent B: competitive.ts + market-research.ts prompts + synthesize.ts rewrite
```

### Phase 4 — 4 Parallel Subagents

```
Subagent A: DashboardHeader + RelevanceCallout + MetricsRow + BentoPanel + BulletItem
Subagent B: CompanyCard + PersonCard + TimelineStrip + SourceCarousel
Subagent C: MeetingPrepLayout + BusinessCaseLayout + IntelligenceDashboard
Subagent D: CompetitiveLayout + MarketResearchLayout + ProgressTracker
```

### Phase 5 — 2 Parallel Subagents

```
Subagent A: ChatPanel + chat/route.ts API
Subagent B: ActionBar + brief-to-markdown.ts
```

### Phase 6 — 2 Parallel Subagents

```
Subagent A: Migration file + history/route.ts + [briefId]/route.ts + share/route.ts
Subagent B: history/page.tsx + [briefId]/page.tsx + signal/[briefId]/page.tsx
```

### Phase 7 — 1 Subagent (Sequential)

```
Subagent A: Rate limiting + caching + error hardening + health monitoring + mobile polish
```

### Total: ~17 subagent invocations across 7 phases

### Dependency Graph

```
Phase 1 (all) ──▶ Phase 2C (needs input types)
Phase 2 (all) ──▶ Phase 3 (all) (needs evidence pipeline)
Phase 3 (all) ──▶ Phase 4 (all) (needs output schema)
               ──▶ Phase 5 (all) (needs synthesis output)
               ──▶ Phase 6A (needs brief schema)
Phase 4 (all) ──▶ Phase 5A (needs dashboard for chat panel)
Phase 6 (all) ──▶ Phase 7 (needs everything for hardening)
```

---

## Changelog Protocol

After each phase completion, the implementing agent must append to `docs/CHANGELOG_INTELLIGENCE_V3.md`:

```markdown
## Phase N — [Phase Name] — [Date]

**Status**: Complete

**What shipped:**
- [1-3 bullet points]

**Files created/modified:**
- [list]

**Verified:**
- [ ] npm run build passes
- [ ] npx tsc --noEmit passes
- [ ] Browser visual check passed
- [ ] Acceptance criteria met: [list which ones]

**Notes/Issues:**
- [anything relevant for next phase]
```

This file serves as working memory for the agent across sessions.

---

## Migration from V2

1. Keep `/api/intelligence` (V2) working — do not break it
2. Add `/api/intelligence/v3` as the new endpoint
3. The `page.tsx` rewrite replaces the V2 form/results with V3 flow
4. Keep `/app/meeting-prep` (legacy dossier) until V3 meeting prep is confirmed working
5. No data migration needed — V2 briefs are not persisted

---

## Summary

| Dimension | Count |
|-----------|-------|
| New React components | ~25 |
| New API routes | 7 |
| New lib modules | ~15 |
| New database tables | 4 |
| Total phases | 7 |
| Subagent invocations | ~17 |
| Acceptance criteria | 19 global + ~50 per-phase |
| Test scenarios | 32 |
| Design anti-slop rules | 12 |
