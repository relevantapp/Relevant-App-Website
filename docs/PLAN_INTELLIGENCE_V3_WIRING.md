# Intelligence V3 — Full Wiring Plan

**Goal:** Wire all 4 research types end-to-end with type-specific search strategies, synthesis prompts, result shapes, and visual results displays. Each type produces a distinct, visually rich brief — not walls of text.

---

## Current State

- **Meeting Prep**: Forms work → maps to V2 API → gets results. Results display is V2 bento grid (text-heavy bullet lists). Works but looks dated.
- **Competitive Analysis**: Form built, submit shows "coming soon." No backend.
- **Business Case**: Form built, submit shows "coming soon." No backend.
- **Market Research**: Form built, submit shows "coming soon." No backend.

---

## Architecture Decision

**One unified API route** (`/api/intelligence`) accepts a `researchType` field. The orchestrator branches internally per type — different search strategies, different synthesis prompts, different response shapes. The frontend renders type-specific result components.

```
Form Input → POST /api/intelligence { researchType, ...fields }
           → route.ts validates per type
           → orchestrator branches by type
           → type-specific searches (parallel)
           → type-specific synthesis prompt
           → type-specific brief shape
           → Frontend renders type-specific results component
```

---

## Phase A — Shared Infrastructure (Build First)

### A1. Extend `lib/intelligence/types.ts` — New response shapes

Add discriminated union for V3 briefs. Each type gets its own sections:

```typescript
// Shared across all types
interface BriefBase {
  researchType: ResearchType
  headline: string
  bottomLine: string
  confidence: 'high' | 'medium' | 'low'
  sources: BriefSource[]
  status: BriefStatus
}

// Meeting Prep (existing, renamed)
interface MeetingPrepBrief extends BriefBase {
  researchType: 'meeting_prep'
  snapshot: CompanySnapshot | null
  attendeeProfiles: AttendeeProfile[]
  sections: {
    whatJustHappened: BriefBullet[]
    talkingPoints: BriefBullet[]
    landmines: BriefBullet[]
    questionsToAsk: BriefBullet[]
    competitorContext: BriefBullet[]
  }
}

// Competitive Analysis
interface CompetitiveAnalysisBrief extends BriefBase {
  researchType: 'competitive_analysis'
  yourCompany: string | null
  competitors: CompetitorProfile[]     // name, description, strengths, weaknesses, recentMoves
  comparisonMatrix: ComparisonRow[]    // dimension, yourPosition, competitorPositions[]
  sections: {
    keyFindings: BriefBullet[]
    strategicImplications: BriefBullet[]
    recommendations: BriefBullet[]
  }
}

// Business Case
interface BusinessCaseBrief extends BriefBase {
  researchType: 'business_case'
  verdict: 'strong' | 'moderate' | 'weak' | 'insufficient_data'
  verdictRationale: string
  comparables: ComparableCompany[]     // name, outcome, relevance, keyTakeaway
  sections: {
    marketEvidence: BriefBullet[]
    supportingFactors: BriefBullet[]
    riskFactors: BriefBullet[]
    openQuestions: BriefBullet[]
  }
}

// Market Research
interface MarketResearchBrief extends BriefBase {
  researchType: 'market_research'
  marketOverview: string               // 2-3 sentence summary of the market
  players: MarketPlayer[]              // name, category, description, estimatedPosition
  sections: {
    trendSignals: BriefBullet[]
    opportunities: BriefBullet[]
    threats: BriefBullet[]
    keyFindings: BriefBullet[]
  }
}

type IntelligenceBriefV3 = MeetingPrepBrief | CompetitiveAnalysisBrief | BusinessCaseBrief | MarketResearchBrief
```

**Supporting types:**

```typescript
interface CompetitorProfile {
  name: string
  description: string
  strengths: string[]       // 2-4 short phrases
  weaknesses: string[]      // 2-4 short phrases
  recentMoves: string[]     // 1-3 recent news items
}

interface ComparisonRow {
  dimension: string         // "Pricing", "Product breadth", "Market share"
  values: { company: string; position: string; score: number }[]  // 1-5 score
}

interface ComparableCompany {
  name: string
  outcome: 'success' | 'mixed' | 'failure'
  relevance: string         // why it's comparable
  keyTakeaway: string
}

interface MarketPlayer {
  name: string
  category: 'leader' | 'challenger' | 'niche' | 'emerging'
  description: string
  estimatedPosition: string // "Dominant", "Growing fast", "Declining"
}
```

### A2. Update API route — Accept `researchType` + per-type validation

Extend `POST /api/intelligence`:

- Accept `researchType` field (default: `'meeting_prep'` for backward compat)
- Validate required fields per type:
  - `meeting_prep`: accountName, meetingType, goal (existing)
  - `competitive_analysis`: competitors[] (≥1), focusArea
  - `business_case`: initiativeName, hypothesis
  - `market_research`: marketOrTrend, scope
- Route to type-specific orchestrator

### A3. Orchestrator dispatcher — `lib/intelligence/index.ts`

Add a dispatcher that routes by type:

```typescript
export async function generateBrief(input: V3Request): Promise<IntelligenceBriefV3> {
  switch (input.researchType) {
    case 'meeting_prep': return generateMeetingPrepBrief(input)
    case 'competitive_analysis': return generateCompetitiveAnalysisBrief(input)
    case 'business_case': return generateBusinessCaseBrief(input)
    case 'market_research': return generateMarketResearchBrief(input)
  }
}
```

Each type-specific function lives in its own file under `lib/intelligence/types/`.

---

## Phase B — Competitive Analysis (Full Wire)

### B1. Search strategy: `lib/intelligence/types/competitive-analysis.ts`

**Searches to run (parallel):**
1. For each competitor (up to 3): Exa snapshot search → company profile
2. For each competitor: Exa news search → recent moves
3. If yourCompany provided: Exa snapshot → your profile
4. Cross-comparison search: `"[competitor1] vs [competitor2]"` → head-to-head evidence
5. Focus-area specific search: e.g. `"[competitor] pricing model"` if focusArea = 'pricing'

**Synthesis prompt:**
- System: "You are a competitive intelligence analyst. Produce a structured competitive comparison."
- Output schema: competitorProfiles[], comparisonMatrix[], keyFindings, strategicImplications, recommendations
- Rules: Every claim sourced. Score each dimension 1-5. Be brutally honest about your company's weaknesses too.

### B2. Results component: `CompetitiveResults.tsx`

**Visual layout (less text, more structure):**

1. **Hero card** — Headline + bottom line + confidence badge
2. **Competitor cards** (horizontal scroll or grid) — Each card:
   - Company name + 1-line description
   - Strengths as green pills
   - Weaknesses as red pills
   - Recent moves as compact timeline dots
3. **Comparison matrix** (table/grid) — 
   - Rows = dimensions (Product, Pricing, GTM, etc.)
   - Columns = companies
   - Each cell = colored dot or bar (1-5 score) + short text
   - Color: green (4-5), amber (3), red (1-2)
4. **Key Findings** — icon + short text cards (not bullet lists)
5. **Strategic Implications** — numbered action cards
6. **Recommendations** — highlighted action cards with priority pills
7. **Sources strip** — reuse existing horizontal scroll

---

## Phase C — Business Case Validation (Full Wire)

### C1. Search strategy: `lib/intelligence/types/business-case.ts`

**Searches to run (parallel):**
1. Market research: Exa search for `"[targetMarket] market size trends"` → market evidence
2. Hypothesis validation: Tavily search for `"[hypothesis] evidence"` → supporting/counter evidence
3. For each comparable company (up to 3): Exa search → outcome + story
4. Risk search: Exa search for `"[initiativeName] risks challenges failures"` → risk factors
5. If successMetrics provided: search for benchmark data

**Synthesis prompt:**
- System: "You are a strategy analyst evaluating a business case. Produce a go/no-go assessment."
- Output schema: verdict (strong/moderate/weak/insufficient_data), verdictRationale, comparables[], marketEvidence, supportingFactors, riskFactors, openQuestions
- Rules: Be balanced. If evidence is thin, say verdict is `insufficient_data`. Don't fabricate market sizing.

### C2. Results component: `BusinessCaseResults.tsx`

**Visual layout:**

1. **Verdict card** (full width, prominent) —
   - Large verdict badge: "Strong Case" (green), "Moderate" (amber), "Weak" (red), "Need More Data" (gray)
   - 2-3 sentence rationale beneath
   - Confidence badge
2. **Evidence balance** — Simple visual:
   - Left side: Supporting factors (green-tinted cards)
   - Right side: Risk factors (red-tinted cards)
   - Visual weight shows which side is stronger
3. **Comparable companies** (card grid) —
   - Each card: company name, outcome pill (success/mixed/failure), relevance, key takeaway
   - Color-coded by outcome
4. **Market evidence** — Key findings as compact stat cards where possible
5. **Open questions** — Highlighted as "still unanswered" items
6. **Sources strip**

---

## Phase D — Market Research (Full Wire)

### D1. Search strategy: `lib/intelligence/types/market-research.ts`

**Searches to run (parallel):**
1. Market overview: Exa search `"[marketOrTrend] market overview 2024 2025"` → market context
2. Trend signals: Tavily search `"[marketOrTrend] trends growth"` → recent trends
3. For each known player (up to 5): Exa snapshot → player profile
4. If scope is regional: add region to search queries
5. Market dynamics: Exa search `"[marketOrTrend] challenges opportunities threats"` → forces
6. Time-horizon adjusted: Use lookback period from timeHorizon setting

**Synthesis prompt:**
- System: "You are a market research analyst. Produce a comprehensive market landscape assessment."
- Output schema: marketOverview, players[], trendSignals, opportunities, threats, keyFindings
- Rules: Categorize players as leader/challenger/niche/emerging. Reference real numbers when available. Separate current state from forward-looking predictions.

### D2. Results component: `MarketResearchResults.tsx`

**Visual layout:**

1. **Market overview card** (full width) — 2-3 sentence market summary + confidence
2. **Player landscape** (card grid, 2-3 columns) —
   - Each card: company name, category pill (leader=blue, challenger=green, niche=amber, emerging=violet), short description, position indicator
   - Sorted: leaders first, then challengers, etc.
3. **Trend signals** — Timeline-style cards with trend direction indicators (↑ ↓ →)
4. **Opportunities vs Threats** — Side-by-side layout:
   - Left: Opportunity cards (green-tinted)
   - Right: Threat cards (red-tinted)
5. **Key findings** — Numbered insight cards
6. **Sources strip**

---

## Phase E — Meeting Prep Results Refresh

### E1. Visual improvements to `IntelligenceResults.tsx`

The existing meeting prep results work but are text-heavy. Improvements:

1. **Snapshot card** — Add company logo fetch attempt (favicon from domain), make facts more visual with icon per fact type
2. **People cards** — Add avatar placeholder circles with initials, make LinkedIn more prominent
3. **Bullet sections** — Replace plain `<ul>` with:
   - Icon + bold key phrase + supporting text (instead of one long paragraph)
   - Source badges more subtle (inline, not separate row)
   - Fact/inference tag integrated into the text flow, not separate badge
4. **Talking points** — Show as "conversation starter" cards with a leading hook phrase highlighted
5. **Landmines** — More visual danger treatment: red left-border accent, warning icon prominent
6. **Competitor context** — If ≥2 competitors, show as comparison mini-cards instead of bullets

---

## Phase F — Shared Visual Components

Build these once, reuse across all 4 result types:

1. **`ResultsHero`** — Headline + bottom line + confidence + "New Search" + Copy. Gradient background varies by research type.
2. **`InsightCard`** — Single finding card: icon + key phrase (bold) + detail text + source refs. Replaces bullet lists everywhere.
3. **`ScoreBar`** — Horizontal bar showing 1-5 score with color gradient. For comparison matrices.
4. **`VerdictBadge`** — Large status indicator (Strong/Moderate/Weak/Insufficient). For business case.
5. **`PlayerCard`** — Company card with category pill, description, position. For market research + competitive.
6. **`BalanceView`** — Two-column pros/cons or opportunities/threats layout with visual weight indication.
7. **`CompactTimeline`** — Vertical or horizontal timeline dots for recent events. For competitor moves + trend signals.

---

## Phase G — Page Controller Update

Update `page.tsx` to:

1. Pass `researchType` in all API calls
2. Render type-specific results component based on `brief.researchType`:
   - `meeting_prep` → `MeetingPrepResults` (refactored from `IntelligenceResults`)
   - `competitive_analysis` → `CompetitiveResults`
   - `business_case` → `BusinessCaseResults`
   - `market_research` → `MarketResearchResults`
3. Type-specific loading states (different skeleton layouts per type)
4. Remove "coming soon" fallbacks

---

## Build Order

| Step | What | Files touched | Risk |
|------|------|---------------|------|
| 1 | Shared types (A1) | `lib/intelligence/types.ts` | Low — additive |
| 2 | Shared visual components (F) | `components/intelligence/` (new) | Low — new files |
| 3 | API route extension (A2) | `api/intelligence/route.ts` | Medium — touches working code |
| 4 | Orchestrator dispatcher (A3) | `lib/intelligence/index.ts` | Medium — touches working code |
| 5 | Competitive backend + results (B) | New files | Low — new code |
| 6 | Business case backend + results (C) | New files | Low — new code |
| 7 | Market research backend + results (D) | New files | Low — new code |
| 8 | Meeting prep results refresh (E) | `IntelligenceResults.tsx` | Medium — rewrite |
| 9 | Page controller update (G) | `page.tsx` | Medium — integration |
| 10 | Typecheck + test all 4 flows | — | Verification |

---

## File Structure After Build

```
src/lib/intelligence/
  types.ts                    # Extended with V3 types
  index.ts                    # Dispatcher + meeting prep orchestrator
  synthesize.ts               # Meeting prep synthesis (existing)
  research-plan.ts            # Meeting prep plan (existing)
  normalize.ts                # Shared normalization (existing)
  providers/
    exa.ts                    # Extended with new search functions
    tavily.ts                 # Extended with new search functions
  types/
    competitive-analysis.ts   # Search strategy + synthesis for competitive
    business-case.ts          # Search strategy + synthesis for business case
    market-research.ts        # Search strategy + synthesis for market research

src/app/app/intelligence/
  page.tsx                    # Updated controller
  types.ts                    # Frontend types (already done)
  constants.ts                # Constants (already done)
  ResearchTypeSelector.tsx    # Type picker (already done)
  forms/                      # Input forms (already done)
    shared/
    MeetingPrepForm.tsx
    BusinessCaseForm.tsx
    CompetitiveAnalysisForm.tsx
    MarketResearchForm.tsx
  results/
    shared/                   # Shared visual components (Phase F)
      ResultsHero.tsx
      InsightCard.tsx
      ScoreBar.tsx
      VerdictBadge.tsx
      PlayerCard.tsx
      BalanceView.tsx
      SourcesStrip.tsx        # Extracted from IntelligenceSources
    MeetingPrepResults.tsx    # Refactored from IntelligenceResults
    CompetitiveResults.tsx    # New
    BusinessCaseResults.tsx   # New
    MarketResearchResults.tsx # New
```

---

## Visual Philosophy

**Less text, more structure.** Every result type follows these rules:

1. **Hero first** — One headline, one bottom line. No paragraph.
2. **Cards over bullets** — Each finding is a card with: icon + bold key phrase + 1 sentence detail + source ref. Never a plain `<li>`.
3. **Visual scoring** — Use color bars, pills, and badges instead of writing "this is strong" or "this is weak."
4. **Comparison as grids** — When comparing things, use tables/matrices. Never write "Company A is better at X while Company B excels at Y" as prose.
5. **Color coding** — Green = positive/strong, amber = neutral/moderate, red = risk/weak, violet = questions/unknowns, teal = data/facts.
6. **Whitespace** — Cards have generous padding. Sections have clear separation. Nothing feels crammed.
7. **Source references** — Inline, subtle. Small `[s1]` superscript or hover tooltip. Not a separate row per bullet.

---

## Success Criteria

- [ ] All 4 research types submit successfully and return results
- [ ] Each type has a visually distinct results layout (not just different bullet lists)
- [ ] Competitive analysis shows comparison matrix with visual scores
- [ ] Business case shows clear go/no-go verdict with evidence balance
- [ ] Market research shows player landscape cards + trend direction indicators
- [ ] Meeting prep looks refreshed with less text density
- [ ] Zero TypeScript errors
- [ ] Results render well on mobile (single-column responsive)
- [ ] Each brief generates in <45 seconds
- [ ] Sources are clickable and reference real URLs
