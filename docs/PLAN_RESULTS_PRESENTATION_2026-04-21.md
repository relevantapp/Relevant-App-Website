# GetRelevant — Results Presentation Master Plan
_Date: 2026-04-21_
_Scope: how we present the output of the four intelligence workflows (meeting prep, competitive analysis, business case, market research). **Content, structure, and information architecture only** — UI implementation comes after this is aligned._

---

## 0. One-line thesis

> Premium research doesn't feel premium because it has more charts. It feels premium because it's **stratified** (TL;DR → exhibits → appendix), every claim is **cited at the sentence level**, and every visual earns a **declarative headline**. We have the data pipeline to do all three today. What's missing is the presentation grammar.

Today's output is structurally sound (shared `BriefBase`, sourceId citation system, some structured widgets in meeting prep) but presented as **uniform medium-density bullets**. That's the signature of a chatbot, not a $1K/seat product. This plan fixes that.

---

## 1. Current state audit

### What we have (from codebase exploration)

All four flows share:
- **Shared schema**: `headline`, `bottomLine`, `whyItMatters`, `confidence`, plus sourceIds on every bullet, `status` + `sources` arrays
- **Consistent pipeline**: resolveEntity → planSearches → gatherEvidence → rankEvidence → synthesize → assembleBrief
- **Fact / inference tagging** per bullet
- **Clickable source chips** under every section
- **A v2 evidence pack pipeline** (research lanes, intent, prior memory, clusters, contradictions) already scaffolded

### What each flow outputs today

| Flow | Strong structured data | Currently text-flattened |
|---|---|---|
| **Meeting prep** | `momentumScore`, `riskLevel`, `sentiment`, `timelineEvents`, `radarMetrics` (5 categories), `competitorMatrix` (threat × overlap) | 5 bullet sections (whatJustHappened, talkingPoints, landmines, questions, competitorContext); attendee profiles lose their structure when data is missing; radar rendered as small text not bars |
| **Competitive analysis** | 1–5 scored `comparisonMatrix` across dimensions; strengths/weaknesses tag arrays | "Position" cells are free-form prose; recentMoves are undated bullets; no `yourCompany` in the matrix; no positioning visual |
| **Business case** | Categorical `verdict` (strong/moderate/weak/insufficient), comparable outcomes (success/mixed/failure) | `verdictRationale` is prose with no score breakdown; supporting vs. risk factors are unweighted; no financial/waterfall viz; comparables lack weighting |
| **Market research** | `players` categorized as leader/challenger/niche/emerging | `marketOverview`, `estimatedPosition`, opportunities, threats — all prose; no TAM/SAM/SOM, no market map visual, no dated trend curve |

### The structural diagnosis

The meeting-prep flow is already **30% of the way to premium** (timeline, radar, competitor matrix are real widgets). The other three flows are **90% prose**. Across all four, we compute more granularity in the pipeline than we render — quality scores, freshness, domain authority, per-dimension scores — all collapsed into prose bullets.

**The fix is not "more charts."** The fix is three structural moves:

1. **Stratify density**: hero summary → exhibits with declarative headlines → appendix-grade detail
2. **Promote every structured field to its own visual** — if we computed a score, render it as a visual, not a sentence
3. **Make every factual sentence provenanced at the sentence level**, with hover-preview of the source snippet — not just per-bullet source chips

---

## 2. The premium-feel playbook (the four meta-patterns)

These recur across McKinsey, Gartner, Forrester, CB Insights, PitchBook, Bloomberg, AlphaSense, Tegus, Gong, Clari, Crystal, Humantic, People.ai, LinkedIn Sales Navigator, Perplexity, Hebbia, a16z, and Sequoia. Any one of them is worth more than a gallery of new chart types.

### Pattern 1 — Stratified density

Every premium research deliverable has three density layers:

- **Top (low density, high legibility)**: one TL;DR, 3–5 key findings, 1 hero visual, a confidence badge. Everyone reads this.
- **Middle (medium density, self-contained exhibits)**: each exhibit is captioned with a declarative headline; 150–300 words of narrative around it. Readers skim headlines, stop on exhibits that matter.
- **Bottom (high density, appendix)**: full source list, methodology, raw tables, queries executed, evidence pack. Power users and auditors go here.

Our current product is uniformly "medium density bullets" from top to bottom. That's the amateur tell.

### Pattern 2 — Declarative headlines on every exhibit

McKinsey's rule: if a chart's title is descriptive ("Revenue and margin, 2020–2025"), it's amateur. If it's declarative ("Revenue grew 3× but margin compressed 400bps"), it's premium. The chart becomes the *evidence* for the claim.

Practical implication for us: every one of our synthesized visuals needs an LLM-generated *claim headline* plus a *so-what* subhead. We already do this at the top of each brief; we need to do it on every chart, card, and matrix within the brief.

### Pattern 3 — Sentence-level provenance

AlphaSense and Tegus's actual moat. Every factual clause has a superscript numeral that, on hover, previews the exact source sentence + publication + date. Not "this paragraph draws from these 5 sources" — *this sentence came from this sentence in that article*.

Our bullets have `sourceIds[]` but the UI renders a single source chip cluster at the end of the bullet. Premium would be: mark each clause with a superscript, hover shows the snippet.

### Pattern 4 — Visible methodology

Gartner's 40-year moat. Every premium deliverable has a "How we built this" section — data sources, queries run, date range, confidence, exclusions. Making the sausage-making visible is what distinguishes a report from a guess.

We already compute this (status, timings, providers, freshness). We don't surface it as a first-class "Methodology" drawer.

---

## 3. The format archetype gallery (15 that matter)

Drawn from the firm research. Each is scored for complexity (L/M/H) and mapped to the workflows it fits.

| # | Archetype | What it is | Fits | Complexity |
|---|---|---|---|---|
| 1 | **Declarative-headline exhibit** | Any chart with a one-sentence *claim* as title + footnoted source | All 4 | M |
| 2 | **2×2 quadrant / Wave** | Two composite axes, labeled vendor dots, four named quadrants | Competitive (★), Market | M |
| 3 | **Tinted logo-grid market map** | Sub-category boxes filled with mono-tinted logos | Market (★), Competitive | M |
| 4 | **Feature-comparison matrix** | Rows=criteria, cols=vendors, cells=0–5 + justification on hover, **user can re-weight** | Competitive (★), Business Case | M |
| 5 | **TAM/SAM/SOM nested funnel** | Three concentric regions, each labeled with value + the *assumption* that derived it | Market (★), Business Case | L |
| 6 | **Stat-card hero row** | 4–6 big-number cards: metric, delta, sparkline, source | All 4 | L |
| 7 | **Entity card stack** | Per-entity facts card + signals feed | Meeting prep (★), Competitive | L |
| 8 | **Personality one-pager (DISC-style)** | 2×2 traits wheel + do's/don'ts + comms cadence | Meeting prep (★) | M |
| 9 | **Annotated timeline** | Horizontal timeline with typed event dots (funding, exec, product, customer) | Meeting, Competitive, Business Case | M |
| 10 | **Sentence-cited executive summary** | 200–300w TL;DR with per-clause superscript citations + hover snippet | All 4 (★★) | M |
| 11 | **Porter's Five Forces pentagon** | 5-axis radar with rationale per axis | Competitive, Business Case | M |
| 12 | **Financial / driver waterfall** | Baseline → driver → driver → target; each bar labeled with assumption + impact | Business Case (★) | M |
| 13 | **Hebbia-style answer matrix** | Rows=entities, cols=questions, cells=LLM answers + citations | Competitive (★), Meeting (people), Market | M–H |
| 14 | **Sourced quote wall** | Curated pullquotes clustered by theme, each with attribution card | Market (★), Competitive, Meeting | L |
| 15 | **Methodology / sources drawer** | Sticky drawer: providers, queries, freshness, exclusions | All 4 (★★) | L |

(★ = primary; ★★ = universal and table-stakes)

---

## 4. Per-workflow presentation design

For each flow: the **layer stack** (top to bottom), what each section shows, which archetype powers it, and what the pipeline needs to compute.

Every flow shares the same outer shell:

```
[Sticky header: title, last-refreshed, confidence, share/export]
[Hero: declarative headline + sentence-cited TL;DR + stat-card row]
[Exhibits: flow-specific, declarative-headline captioned]
[Details: tables, long-form, drilldowns]
[Methodology drawer: providers, queries, freshness, excluded items]
```

---

### 4.1 Meeting Prep

**Metaphor**: a briefing sheet a chief-of-staff hands you 5 minutes before a call. Must be readable in 2 minutes, printable to one page, scannable on mobile.

**Ordering logic** (mirrors how a sharp SDR actually preps): *when → who → what's new → what changed → background → tactics.*

| Layer | Section | Archetype | Notes |
|---|---|---|---|
| Hero | **Meeting context strip** (sticky) | custom | Time-to-meeting, avatar cluster, restated objective, "2 min read" marker |
| Hero | **The 3 Things** | #10 sentence-cited summary + bold-first-phrase bullets | Replaces today's `bottomLine`. Hard-capped at 3. Each bullet has a color-coded priority strip (must / should / FYI) — Axios-style |
| Exhibit | **Who you're meeting** | #7 entity card row, with #8 personality chip inline | One card per attendee. Card shows: photo, name, title, tenure, 1-line comms-style ("Direct — lead with numbers"), 1 recent personal signal. Personality as a small DISC dot; full wheel on hover. Data we don't have is **marked "unknown" explicitly**, not blank (defuses "hallucinated" complaint) |
| Exhibit | **Signal cards** (what just happened) | #6 stat-card variant + #9 timeline | Grid of 3–5 dated cards. Each: date chip (green <7d, amber <30d, gray older), 1-line headline, "why it matters for this meeting," copyable suggested-opener pill. Sortable by recency vs. relevance. This replaces today's `whatJustHappened` bullet list |
| Exhibit | **What changed since last touch** | custom delta panel | Only shown if prior relationship data exists. Explicit before→after framing. Gong's signature move |
| Exhibit | **Momentum & risk radar** (existing) | #11 pentagon variant | Already have `radarMetrics` (5 categories). Render as real radar (not text). Keep severity 0–5 but show rationale on hover, not inline |
| Exhibit | **Competitor context** | #13 Hebbia answer matrix (mini) | Today's `competitorMatrix` becomes an answer grid: rows=competitors, cols=(threat, overlap, our advantage). Short. Links out to full competitive-analysis flow for the same account |
| Detail | **Talking points & objection prep** | two-column collapsed | Left: 3 discovery questions tailored to objective. Right: "If they say X → Y" matrix for 2 likeliest objections given stage/persona. Currently `talkingPoints` + `landmines` bullets — promote `landmines` into a proper "if they say X" matrix |
| Detail | **Company at a glance** | #7 collapsed | Headcount, ARR/funding, stack, 3 recent news. Collapsed because it's "nice to know" |
| Detail | **Relationship graph** | small node diagram | "3 of yours ↔ 2 of theirs." Only if we have connection data; otherwise hide |
| Footer | **Methodology drawer** | #15 | Providers queried, docs returned, freshness, sources excluded |

**Pipeline additions needed**
- Priority tier (must/should/FYI) per bullet — tiny LLM pass
- Copyable "suggested opener" string per signal card
- Explicit "unknown" markers on attendee fields with no evidence
- Personality inference pass (optional, gated behind LinkedIn signal availability)
- Delta detector: diff against a prior brief for the same account

**Mobile / print rules**
- Mobile default collapses to layers 1–3 (context, The 3 Things, attendees)
- Print export is a one-page PDF: hero + signal cards + talking points only

---

### 4.2 Competitive Analysis

**Metaphor**: a Gartner-grade vendor landscape + a Forrester scorecard + a battlecard — in one page. This is the most **exhibit-rich** of the four.

| Layer | Section | Archetype | Notes |
|---|---|---|---|
| Hero | **Headline + bottom line** | #10 | e.g. "Vendor X leads on capability, Y leads on momentum — your sweet spot is the underserved mid-market" |
| Hero | **Stat-card row** | #6 | Funding raised, employees, growth rate, last move — 4 cards per competitor summed, or 4 cross-competitor stats |
| Exhibit | **The Quadrant** | #2 magic-quadrant-style 2×2 | Two synthesized axes (e.g. Execution × Vision, or Breadth × Depth). Your company + competitors as dots. Click a dot → side panel with the vendor's scorecard. **This replaces today's "which companies are leaders" prose.** |
| Exhibit | **Capability matrix** | #4 | Rows = dimensions from today's `comparisonMatrix`. Cols = competitors **plus `yourCompany`** (today the matrix excludes us — fix). Cells = 0–5 bar + position text on hover. Weight sliders let the user re-rank |
| Exhibit | **Landscape map** | #3 tinted logo grid | If we have logos, render a mono-tinted market map by segment. Optional — falls back to a named-list grid |
| Exhibit | **Competitive intensity** | #11 Porter's Five Forces pentagon | Synthesized 5 scores + rationale per axis. Feels MBA-premium |
| Exhibit | **Recent moves timeline** | #9 | Today's `recentMoves` are undated prose. Make them dated typed events (funding/product/exec/customer/partnership) on a horizontal timeline per competitor or merged |
| Exhibit | **Strengths × weaknesses grid** | #13 Hebbia matrix | Rows = competitors. Cols = ("Biggest strength", "Biggest weakness", "How to counter-position"). Each cell is a cited answer, not a tag |
| Detail | **Strategic implications** | declarative-headline bullets | Today's `strategicImplications` — keep, but promote top 3 to cards with decision-oriented framing |
| Detail | **Recommendations** | checklist | Today's `recommendations`, but as a literal checklist with owner/timeframe fields the user can fill in |
| Footer | **Methodology drawer** | #15 | |

**Pipeline additions**
- Two synthesized composite axes for the quadrant (with written rationale for the axis choice — this is the Gartner move)
- Your company in the comparison matrix (we already collect `yourCompany`; we just don't score it)
- Porter's five scores + rationale (new LLM pass)
- Logo fetching (Clearbit / domain favicon) — fallbacks to initials
- Typed event extraction for recent moves (date, type, impact) — we do this for meeting prep already; extend to competitive

---

### 4.3 Business Case

**Metaphor**: a McKinsey-style "should we do this" exhibit deck. Narrative-heavy at top, dense exhibits in the middle, sources at the bottom.

| Layer | Section | Archetype | Notes |
|---|---|---|---|
| Hero | **Verdict badge + declarative headline** | custom + #10 | Keep the verdict (strong / moderate / weak / insufficient) but render it as a *scored* gauge, not just a pill. Headline states the decision in one sentence with sentence-level citation |
| Hero | **Scorecard** | #6 stat-cards | 4 numbers: evidence pro/con count, comparable success rate, time horizon, investment level. Makes the verdict *defensible* |
| Exhibit | **Market opportunity** | #5 TAM/SAM/SOM funnel | Three numbers **with named assumptions shown inline** ("SAM = 18% of TAM, US + EU only"). If we can't size it, show "Unable to size — here's why" explicitly |
| Exhibit | **Path to value** | #12 waterfall | Baseline → key drivers → target, each bar labeled with the assumption. If quantitative evidence is thin, qualitative waterfall (baseline → proof point → proof point → conclusion) |
| Exhibit | **Comparables** | #7 + weighted | Each comparable company: name, outcome chip (success/mixed/failure), relevance score (not today's prose), 1-line takeaway, source. Sorted by relevance. Today's comparables are prose blobs — weight them |
| Exhibit | **Supporting vs. risk factors** | balanced matrix with severity | Keep two-column layout but add **severity × impact** tags per factor ("high impact, medium certainty"). Today's columns are unweighted bullets |
| Exhibit | **Open questions** | #13 answer-matrix mini | Rows = open questions from intake + inferred. Cols = (current evidence, confidence, suggested next step). Today's `openQuestions` are bullets — promote to an actionable grid |
| Detail | **Framework alignment** | optional | For the decision-type presets (launch/expansion/pricing/etc.), render against a relevant framework (AARRR for growth, Ansoff for expansion, etc.). Opt-in, not forced |
| Footer | **Methodology drawer** | #15 | |

**Pipeline additions**
- Evidence pro/con count (we already have supporting/risk factors — count them)
- Weighted relevance score on comparables
- Severity × impact tags on supporting/risk factors (new LLM pass)
- TAM/SAM/SOM estimation pass with assumptions — gated; hide widget if low confidence rather than hallucinate
- Waterfall driver extraction

---

### 4.4 Market Research

**Metaphor**: a CB Insights / Sequoia market map + a Bloomberg stat dashboard + an a16z "State of" essay — fused.

| Layer | Section | Archetype | Notes |
|---|---|---|---|
| Hero | **Market one-liner + stat row** | #10 + #6 | Headline: "The X market is growing 32% YoY, led by Y, but adoption is concentrated in Z." Stat row: market size, growth rate, # of players, last major move date |
| Exhibit | **The market map** | #3 tinted logo grid | Categorized by the segmentation we synthesize (e.g. by function, by customer, by stack layer). **This is the hero visual for market research.** Each logo is clickable → player side-panel |
| Exhibit | **TAM/SAM/SOM with assumptions** | #5 | Only rendered if we have numbers; shown with assumption strings inline. Otherwise collapsed with an "Unable to size" note + the reason |
| Exhibit | **Player positioning** | #2 quadrant (lightweight) | Use today's `leader/challenger/niche/emerging` categorization but plot on a 2×2 (scale × momentum, or breadth × focus). More visual than the current 4-column grid |
| Exhibit | **Growth / adoption curve** | #1 declarative-headline line chart | If series data available (funding by quarter, search interest, headcount growth across players) — render a line chart with a declarative claim as title. If not, collapse |
| Exhibit | **Trend timeline** | #9 | Category-level events: major fundings, product launches, regulatory changes, new entrants. Typed and dated |
| Exhibit | **Opportunities vs. threats** | balanced matrix with probability × impact | Today's opportunities / threats are prose bullets. Add probability (high/med/low) and impact (high/med/low), render as a 2×2 if we have enough |
| Exhibit | **Voice of the market** | #14 quote wall | Pullquotes from analyst reports, earnings calls, customer posts, clustered by theme. Adds a primary-source texture today's output totally lacks |
| Detail | **Key findings narrative** | #10 | Long-form section — the a16z-style essay layer. Sentence-cited. |
| Footer | **Methodology drawer** | #15 | |

**Pipeline additions**
- 2-axis positioning for players (beyond the existing 4-category bucket)
- Market-size estimation pass with assumptions (same gate as business case)
- Pullquote extraction with theme tagging
- Time-series extraction from evidence pack (dated events with type)
- Segmentation taxonomy generation for the market map

---

## 5. Universal system — the chrome around every brief

These apply to all four workflows; ship them once, use them four times.

### 5.1 The sentence-citation system (archetype #10)

- Every factual clause in prose output carries a trailing superscript linking to a `sourceId`.
- Hovering the superscript shows a floating card: source title, domain, publish date, and the *quoted sentence* from the source that grounded the claim.
- Today we have `sourceIds[]` per bullet. We need the LLM synthesis pass to return *sentence-level* citation spans. This is a single prompt change + a small schema extension.
- This one change is the biggest single trust upgrade available to us.

### 5.2 The methodology drawer (archetype #15)

A persistent right-side drawer, collapsed by default. Contents:
- **Inputs**: what the user provided (echoed back)
- **Sources queried**: Exa / Tavily / RSS / internal — with counts
- **Queries run**: the actual search strings (from v2 search plan) — this is pure transparency
- **Freshness**: oldest / newest evidence dates
- **Confidence drivers**: why confidence is high/medium/low — named
- **Excluded**: items the ranker dropped and why (quality, duplicate, off-topic)
- **Refresh**: one-click "re-run with fresh data" button

We compute all of this already. Surfacing it is the work.

### 5.3 Declarative headlines everywhere

A small LLM pass per exhibit that takes the underlying structured data and returns *one claim sentence*. Applied to: stat rows, matrices, timelines, quadrants, maps. This is cheap and transformative.

### 5.4 Priority tiering

A three-tier system that any item (bullet, card, signal) can be tagged with:
- **Must-read** (red strip)
- **Should-read** (amber)
- **FYI** (gray)

Lets us stratify without forcing the user to manually dig. Applied in the synthesis step; surfaces as left-edge color strips + optional "must-read only" filter toggle.

### 5.5 Confidence per claim, not just per brief

Today we have a top-level `confidence`. Extend to per-section, maybe per-claim: "high / medium / low" with a one-line reason ("2 independent sources within 14 days" vs. "single source, not primary"). Surfaces as a small badge next to the claim.

### 5.6 Explicit "unknown"

Fields we didn't find data for should render as "unknown — we couldn't verify" not as empty space, not as a made-up placeholder. This is the single biggest defuser of "it hallucinated" complaints we found in the sales-intel research.

### 5.7 Export / share

Two flavors per brief:
- **One-page PDF** — hero + top exhibits only. Printable. This is what reps actually use before a call.
- **Full interactive share link** — the live dashboard.

We already have a `ShareButton` component. Extend it to offer both.

### 5.8 Feedback loop

Thumbs-up / thumbs-down + "this is wrong / outdated / generic" on every AI-generated claim. Visible. Retrains future briefs for the same user. Rep reviewers repeatedly cite this as the difference between tools they trust and tools they don't.

---

## 6. What we're deliberately **not** doing (yet)

- **Real-time collaboration** on briefs — nice, but not a format issue
- **Auto-refresh on a schedule** — out of scope for presentation
- **Custom report branding / white-label** — enterprise feature, later
- **Long-form AI chat over the brief** — we have `chat` already; we'll integrate, not redesign, here
- **Video / audio summaries** — not where the premium signal lives; defer
- **Gauges, speedometers, gratuitous animations** — specifically rejected; premium products are *still*, not animated

---

## 7. Phasing — what to build in what order

We're doing research and planning in this doc, but to make the plan actionable, here's how the work sequences. Each phase is independently shippable.

### Phase 1 — The universal premium layer (highest leverage, lowest scope)

1. **Sentence-level citations** across all four flows (§5.1)
2. **Declarative headlines on every exhibit** (§5.3)
3. **Methodology drawer** (§5.2)
4. **Explicit "unknown" rendering** (§5.6)
5. **Priority tiering** on bullets (§5.4)

This alone transforms the perceived quality of the existing product — no new workflows, no new viz types.

### Phase 2 — Promote structured data already computed

6. **Meeting prep**: render `radarMetrics` as a real radar, `competitorMatrix` as an answer grid, `timelineEvents` as a real timeline
7. **Competitive**: add `yourCompany` to the capability matrix; date-type the `recentMoves`
8. **Business case**: convert supporting/risk bullets to severity-tagged cards; render the verdict as a scored gauge

These are "we already have the data, we're just not showing it."

### Phase 3 — Hero exhibits per workflow

9. **Meeting prep**: The 3 Things hero, signal cards, attendee cards with personality chips
10. **Competitive**: the 2×2 quadrant, tinted logo market map
11. **Business case**: TAM/SAM/SOM funnel, comparables scored grid, driver waterfall
12. **Market research**: tinted logo market map, positioning 2×2, quote wall

### Phase 4 — Signature pipeline additions

13. Personality inference (meeting prep)
14. Composite axis synthesis + rationale (competitive quadrant)
15. Market sizing with assumptions (market research + business case)
16. Pullquote extraction with theme tagging (market research, competitive)
17. Time-series extraction from evidence pack (market research)
18. Porter's Five Forces synthesis (competitive)

### Phase 5 — Interaction & power-user

19. Re-weightable comparison matrices
20. Filterable market maps
21. Delta / "what changed since last brief"
22. One-page PDF export per flow
23. Feedback loop on claims (§5.8)

---

## 8. The schema contract sketch

To make the pipeline additions concrete. Drafted, not frozen — this is what the LLM synthesis pass needs to start returning.

```ts
// Universal additions (all briefs)
type CitedSpan = { text: string; sourceIds: string[]; sourceSnippet?: string };
type Claim = { headline: string; body: CitedSpan[]; priority: 'must' | 'should' | 'fyi'; confidence: 'high' | 'med' | 'low' };

type Methodology = {
  providers: Array<{ name: string; queriesRun: string[]; docsReturned: number }>;
  freshness: { oldest: string; newest: string };
  confidenceDrivers: string[];
  excluded: Array<{ sourceId: string; reason: string }>;
};

// Per-exhibit
type Exhibit<T> = { headline: string; subhead?: string; data: T; note?: string; sources: string[] };

// Meeting prep
type SignalCard = { date: string; headline: string; whyItMatters: string; suggestedOpener?: string; sources: string[] };
type AttendeeSnapshot = {
  name: string; title: string | 'unknown'; tenure?: string;
  commsStyle?: { tag: string; wheel?: { d: number; i: number; s: number; c: number } };
  recentSignal?: { text: string; date: string; source: string };
};

// Competitive
type QuadrantPoint = { entity: string; x: number; y: number; rationale: CitedSpan };
type AxisDefinition = { name: string; description: string; rationale: CitedSpan };
type AnswerMatrixCell = { text: string; sources: string[]; confidence: 'high' | 'med' | 'low' };

// Business case
type Waterfall = Array<{ label: string; delta: number; assumption: CitedSpan }>;
type FactorCard = { text: string; severity: 'high' | 'med' | 'low'; impact: 'high' | 'med' | 'low'; sources: string[] };
type SizedComparable = { name: string; outcome: 'success' | 'mixed' | 'failure'; relevance: number; takeaway: CitedSpan };

// Market research
type TamSamSom = { tam: { value: number; assumption: CitedSpan }; sam: { value: number; assumption: CitedSpan }; som: { value: number; assumption: CitedSpan } } | { unableToSize: { reason: string } };
type PullQuote = { quote: string; attribution: { name: string; role?: string; source: string; date: string }; theme: string };
type MarketMap = { segments: Array<{ name: string; rationale: string; players: Array<{ name: string; logoUrl?: string }> }> };
```

---

## 9. What this plan is **not**

- It's not a UI implementation plan. Visual design (color, type, spacing, component library choices) comes next.
- It's not a business pricing plan. But the format upgrades *enable* premium pricing — they are the "why it's worth $X" answer.
- It's not exhaustive. There are ~30 more archetypes (geographic heatmaps, Sankey flows, cohort retention) that may prove useful; the 15 here are the highest-value starting set.

---

## 10. Examples to steal from (bookmark these)

**Premium exhibits & stratified density**
- mckinsey.com/quarterly — declarative headlines, 1 exhibit per ~250 words
- bcg.com/publications — exhibit style
- a16z.com/big-ideas, sequoiacap.com/article — market maps, long-scroll essay format
- gartner.com/en/research/methodologies/magic-quadrants-research — the original 2×2
- forrester.com/research/the-forrester-wave — re-weightable Excel scorecards
- cbinsights.com/research — tinted logo grids, ESP matrix
- pitchbook.com/news — landscape reports

**Sentence citation & evidence**
- alpha-sense.com — sentence-level inline superscripts
- tegus.com — topic-tagged expert call smart synopsis
- perplexity.ai (Pages) — inline citation pills
- hebbia.ai — the answer matrix

**Meeting prep & sales intel**
- gong.io/product/deal-execution — delta framing, deal warnings
- clari.com/products/revenue-execution — scorecard briefs
- people.ai/product/account-planning — relationship map
- crystalknows.com / humanticai.com — DISC personality one-pager
- business.linkedin.com/sales-solutions/sales-navigator — entity card stack
- avoma.com/ai-meeting-assistant — calendar-invite injected agenda
- momentum.io — pre-call punchy 5-bullet format
- axioshq.com — "time to read" marker + bold-first-phrase

---

## 11. TL;DR for yourself if you re-read this in a month

- Stratify density (TL;DR / exhibits / appendix), not uniform prose.
- Cite at the sentence level, with hover snippets.
- Every visual earns a declarative headline.
- Surface methodology as a first-class drawer.
- Promote every structured field we already compute into its own visual.
- Explicit "unknown" beats empty space.
- Per-workflow: quadrant for competitive, market map for market, waterfall + TAM/SAM/SOM for business case, signal cards + personality chips for meeting prep.
- Ship Phase 1 (universal premium layer) first. It's the biggest leap for the least scope.
