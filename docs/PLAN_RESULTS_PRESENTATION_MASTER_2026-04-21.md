# GetRelevant — Results Presentation **Master Plan**
_Date: 2026-04-21_
_Supersedes: `PLAN_RESULTS_PRESENTATION_2026-04-21.md` and the second research synthesis. Fuses the best of both._

---

## 0. The one thesis

> **UI is downstream of schema. Schema is downstream of decision structure.**
> Premium research products don't win by having more charts — they win by giving the user the **answer first, the proof next, the exploration last**, grounded in structured, cited, traceable data. That framing is what makes output feel like analyst work instead of "LLM text in beautiful containers."

Four workflows. Four different *work products*. One shared trust layer underneath.

---

## 1. The canonical three-layer model

Every brief GetRelevant produces follows the same three-layer shape. This is the governing frame for everything below.

### Layer A — **The Answer** (top of every page)

Must answer all five of these before the user scrolls:

1. **What's the conclusion?** — one declarative sentence
2. **Why should I care?** — in the context of *my* role and *my* intake
3. **What changed?** — the delta vs. last time / vs. the default assumption
4. **How sure are you?** — confidence with a one-line driver ("2 independent primary sources, 8 days old")
5. **What should I do next?** — the recommended action, not a menu of options

If any of these is missing from the first viewport, the brief has failed.

### Layer B — **The Proof** (middle of every page)

- 3–5 drivers behind the answer (not a bag of bullets)
- One **dominant exhibit** per brief (not a grid of equal-weight cards)
- Every factual clause is linked to the source **sentence**, not just the document
- Counter-evidence and known unknowns are surfaced, not buried

### Layer C — **The Exploration** (lower / drill-down)

- Workflow-specific deep dives: timelines, matrices, maps, scenarios
- Evidence ledger: what was searched, what was found, what was used, what was excluded
- Export, share, and follow-up prompts

> **Test**: If a user reads only Layer A and acts, they should be directionally right. If they need to defend the recommendation, Layer B arms them. If they want to dig, Layer C is there. Most users never leave A.

---

## 2. Current state — honest audit

### What's good today
- Shared `BriefBase` schema (headline, bottomLine, whyItMatters, confidence, sourceIds)
- Consistent pipeline: resolveEntity → planSearches → gatherEvidence → rankEvidence → synthesize → assembleBrief
- Fact / inference tagging on bullets
- Meeting prep is ~30% of the way there: has `momentumScore`, `radarMetrics`, `competitorMatrix`, `timelineEvents` computed
- V2 evidence pipeline scaffolded (lanes, intent, clusters, contradictions)

### What's broken
- **Uniform medium-density bullets top to bottom.** The amateur tell.
- **Structured data collapsed to prose.** We compute 0–5 scores, freshness, domain authority, dimension scores — then render them as sentences.
- **Citations at bullet level, not sentence level.** Trust ceiling capped.
- **Methodology is invisible.** We know what we searched, what we excluded, what was thin — the user never sees it.
- **Meeting-prep gauge is a decorative semicircle.** Should be a bullet chart.
- **Radar is rendered as text lines with severity words.** Should be a real radar — and only if the rubric is explicit.
- **Competitive analysis matrix excludes your own company.** You score only the competitors against each other.
- **Market research has no tracker — only snapshots.** Markets move; one-time snapshots feel stale by week two.
- **Business case has no scenarios, no driver tree, no assumptions register.** The thing that makes a business case defensible is precisely the thing we don't structure.

### The diagnosis
The fix is not "more charts." The fix is five moves:

1. **Promote every structured field we already compute into its own visual.**
2. **Add the missing structured fields** (scenarios, driver trees, assumptions, trackers, counter-evidence, unknowns).
3. **Cite at sentence level** with hover-preview of the source snippet.
4. **Make methodology a first-class drawer.**
5. **Pick the *right* format per decision** — account brief, strategy exhibit, decision memo, market map + tracker. Not one template with four tabs.

---

## 3. Meta-patterns that signal "premium"

Six patterns recur across AlphaSense, CB Insights, Gartner, Forrester, Morning Consult, McKinsey, BCG, Bloomberg, Tegus, Gong, Clari, Crystal, Humantic, People.ai, Perplexity, Hebbia, a16z, Sequoia.

1. **Answer → Proof → Exploration layering** (§1)
2. **Conclusion-led exhibits with declarative headlines.** Every chart's title is a *claim* ("Adoption doubled but margin compressed 400bps"), not a description ("Adoption and margin, 2020–2025"). The chart is the evidence for the claim.
3. **Sentence-level provenance.** Every factual clause has a superscript; hover shows the exact source sentence + publisher + date. AlphaSense's real moat.
4. **Visible methodology.** Gartner's 40-year moat. Sources queried, queries run, what was excluded, freshness, confidence drivers — all surfaced in a drawer.
5. **Repeated measures (tracker logic) beats one-shot.** Morning Consult's insight: research feels alive when the same questions are re-measured. Relevant for market research especially, but applicable everywhere — "what changed since your last brief on this" is load-bearing.
6. **Schema-first, UI-second.** The best products emit structured objects (ranked entities, scored dimensions, typed timelines, drivers, assumptions, scenario ranges, known unknowns). The UI is the rendering layer, not the brain.

---

## 4. Universal chrome — shipped once, used four times

These apply to every workflow. Together, this is Phase 1 (§9).

### 4.1 The five-question answer block
- Sticky at top of every brief
- Includes: conclusion sentence, why-it-matters line (mirrors the user's role/context), what-changed delta, confidence badge (with one-line driver), recommended-next-move
- Hard-capped word count: ~60 words total. Forces precision.

### 4.2 Sentence-level citation system
- Every factual clause carries a trailing superscript → `sourceId`
- Hover shows: source title, domain, publish date, **the exact sentence** from the source
- Requires LLM synthesis to return citation *spans*, not just `sourceIds[]` per bullet — schema change + prompt change

### 4.3 Trust layer
Per brief, expose:
- Which claims are sourced (visible via §4.2)
- **Freshness** of each claim (days old)
- **Most important** evidence items (ranker's top-weighted)
- **Conflicting** evidence (contradiction cluster from v2 pipeline — already computed, not rendered)
- **Known unknowns** — questions we tried to answer and couldn't

### 4.4 Methodology drawer
Collapsed right-side drawer, available on every brief:
- **Inputs** echoed back
- **Providers** used + docs returned from each
- **Queries run** (the literal search strings from the v2 plan)
- **Freshness range** (oldest / newest evidence)
- **Confidence drivers** (named reasons for high/med/low)
- **Excluded items** + why (quality, duplicate, stale, off-topic)
- **Refresh** button — re-run with fresh data

### 4.5 Priority tiers on every item
Three tiers, left-edge color strip or icon leader:
- **Must-read** (red)
- **Should-read** (amber)
- **FYI** (gray)
Let the user filter "must-read only" to compress the brief.

### 4.6 Per-claim confidence
Extend today's top-level `confidence` to per-section and per-claim where it matters. Each gets a small badge ("high — 2 primary sources <14d" / "low — single blog post").

### 4.7 Explicit "unknown"
Fields without evidence render "unknown — we couldn't verify" with the queries that returned empty. Never blank, never hallucinated. This is the single biggest defuser of "the AI made it up" complaints.

### 4.8 Declarative headlines on every exhibit
A tiny LLM pass per exhibit that takes the underlying structured data and returns one claim sentence. Bad: "Competitor scores by capability." Good: "Vendor X leads on capability, Vendor Y leads on momentum — mid-market is the wedge."

### 4.9 Feedback loop
Thumbs-up/thumbs-down + "this is wrong / outdated / generic" on every AI-generated claim. Visibly retrains future briefs for the same user. Sales teams repeatedly cite this as the trust-vs-no-trust dividing line in tool reviews.

### 4.10 Export / share
- **One-page PDF** (Layer A + top Layer-B exhibits only) — printable, reps actually use this before calls
- **Full interactive share link** — the live Layer A–C dashboard

---

## 5. Chart rules — the prescriptive menu

Use this as a canon. When in doubt, default to the simpler one.

| Intent | Use | Don't |
|---|---|---|
| Change over time | **Line chart** (with declarative headline) | Pie |
| Movement between two points | **Slope chart** | Grouped bar |
| One value vs. a target | **Bullet chart** | Gauge / semicircle dial |
| Many-to-many comparison | **Table / heatmap** | Radar (unless rubric is fixed & public) |
| Sequence / causality | **Typed timeline** | Prose paragraph |
| Uncertainty / scenarios | **Scenario bands** (line + shaded low/high) | Single point estimate |
| Sensitivity of drivers | **Tornado chart** | Bullet list |
| Value build-up | **Waterfall** | Stacked bar |
| Competitive positioning | **Ranked matrix** by default; **2×2 quadrant only** if the two axes are real, stable, explainable | Fuzzy LLM-vibes quadrant |
| Market segmentation | **Tinted logo-grid market map** | Generic company cards |
| Geographic distribution | **Map** only when geography changes the decision | Decorative map |
| Relationships / ecosystems | **Sparse network graph** | Dense hairball |
| Part-of-whole composition | Table with shares + bars | Pie (unless composition is literally the question) |

**Universal rule for every visual:** declarative-claim headline + footnoted sources + "as of [date]" marker. No exceptions.

---

## 6. Per-workflow design

Each workflow is its **own work product**. They share the universal chrome but diverge in layout and archetypes.

### 6.1 Meeting Prep — the *account brief*

**Metaphor:** a chief-of-staff briefing sheet 5 minutes before a call. Readable in 2 minutes, printable to one page.

**Answer layer (the 5 questions)**
- **Meeting angle** (conclusion): one-sentence recommended approach
- **Account state**: warm / watch / risk + the 3 reasons driving that call (bullet chart, not gauge)
- **What changed** since last touch (delta panel)
- **Confidence** with driver
- **Recommended opening move** (copyable)

**Proof layer**
- **Attendee snapshots row** — one card per attendee: photo, name, title, tenure, 1-line comms-style tag ("Direct — lead with numbers"), 1 recent personal signal. Personality represented as a small DISC chip (not a full wheel) — expand on hover. Data we don't have is explicitly "unknown" with the failed query named
- **Signal cards** (3–5) — each: date chip (green <7d / amber <30d / gray older), 1-sentence headline, "why it matters for *this* meeting," copyable suggested opener
- **Stakeholder matrix** — table across attendees: role, likely agenda, pressure, leverage, unknowns. (Upgrade from today's free-form attendee background.)
- **Risk radar** — *only if* the 5 categories are a fixed, named rubric (budget / tech / competitor / champion / setup — they are). Render as a real radar with severity 0–5 and rationale on hover. Otherwise demote to a bullet-list.

**Exploration layer**
- **Company at a glance** (collapsed) — headcount, ARR/funding, tech stack, 3 recent news
- **Competitor context** — compact answer grid: rows = competitors, columns = (threat, overlap, our advantage). Links out to full competitive analysis for this account
- **Talking points & objection prep** — left: 3 discovery questions tailored to the meeting objective; right: "if they say X → respond Y" matrix for the 2 likeliest objections given stage + persona
- **Relationship graph** — if we have shared-connection data; small node diagram. Hide if empty

**Explicitly avoid**
- Large prose company snapshot
- Semicircle gauge as the main signal (**kill the current gauge, replace with bullet chart**)
- Radar without a fixed rubric

**Pipeline additions**
- Priority tier (must/should/FYI) per bullet
- Copyable "suggested opener" per signal card
- Explicit "unknown" markers on attendee fields with no evidence
- Personality inference (gated on LinkedIn signal availability)
- Delta detector: diff against prior brief for same account
- Stakeholder matrix synthesis (new LLM pass)

---

### 6.2 Competitive Analysis — the *strategy exhibit*

**Metaphor:** a Gartner/Forrester-grade vendor landscape fused with a field-ready battlecard. Exhibit-dense.

**Answer layer (the 5 questions)**
- **Position verdict** — strengthening / weakening / exposed, with one-sentence rationale
- **Why it matters** in the context of the user's GTM focus
- **What changed** in the competitive set in the last 90 days
- **Confidence** with driver
- **Recommended posture** — defend / attack / partner / ignore, by competitor

**Proof layer**
- **Capability matrix** (dominant exhibit) — rows = dimensions (from today's `comparisonMatrix`), columns = competitors **including your company**. Cells = 0–5 bar + position text on hover. User-reweightable (Forrester's re-weightable Excel move, in-browser). *Default to this, not a quadrant.*
- **2×2 positioning** — *only if* we can name two defensible synthesized axes with a written rationale shown beside the plot. Else hide. This is the Gartner discipline: no vibes-based quadrants.
- **Recent moves timeline** — dated, typed events (funding / product / exec / customer / partnership / risk), one row per competitor (or merged, filterable)
- **Slope chart of share / momentum** — if we have any time-series signals (search interest, headcount growth, funding pace), plot competitor movement Q-over-Q

**Exploration layer**
- **Strengths × weaknesses answer grid** (Hebbia-style) — rows = competitors, columns = ("biggest strength," "biggest weakness," "how to counter-position"). Each cell cited, not tagged.
- **Whitespace panel** — underserved segment, weak flank, pricing gap, capability gap. One declarative headline + evidence per pocket.
- **Strategic implications** — top 3 promoted to decision-oriented cards (defend / attack / partner / ignore)
- **Recommendations** — real checklist: action, owner (user fills), timeframe (user fills)
- **Landscape logo map** (optional) — tinted monochrome logo grid by segment. Context, not load-bearing.

**Explicitly avoid**
- Competitor profile cards as the main artifact
- Pure SWOT output
- 2×2 quadrant built on fuzzy LLM vibes

**Pipeline additions**
- Include `yourCompany` in the capability matrix
- Two synthesized composite axes for the quadrant + explicit rationale strings (so we only render the quadrant when the axes have earned their place)
- Date-type extraction on recent moves (we already do this for meeting prep; port it)
- Slope-chart time-series pull (when data allows)
- Whitespace pass (new LLM task)

---

### 6.3 Business Case — the *decision memo*

**Metaphor:** a board memo, not a feed. Narrative-spare at the top, exhibit-dense in the middle, assumptions-visible at the bottom.

**Answer layer (the 5 questions)**
- **Verdict** — go / conditional go / no-go / insufficient evidence (keep today's 4-way, but rigorous — not a pill with a prose rationale; a scored gauge-equivalent *and* text rationale)
- **Rationale** — one paragraph
- **What changed** since the hypothesis was framed (if any)
- **Confidence** with driver
- **Recommended next step** — validate / pilot / fund / pause, with the single next action

**Proof layer**
- **Driver tree** — demand, economics, strategic fit, execution risk. Each branch scored + its own confidence. This is the memo's skeleton.
- **Scenario bands** (dominant exhibit) — base / upside / downside, with the key drivers that move you between them
- **Tornado chart** of sensitivity — which assumption matters most? Premium finance move.
- **Waterfall** for value build-up — baseline → drivers → target, each bar labeled with its assumption (and `CitedSpan` grounding)
- **TAM/SAM/SOM funnel** with **named assumptions inline** ("SAM = 18% of TAM, US + EU only") — gated: hide with "Unable to size — here's why" if confidence is low; never hallucinate a number

**Exploration layer**
- **Comparables table** — weighted by relevance, not prose blobs; columns: company, outcome (success/mixed/failure), relevance score, 1-line takeaway, source
- **Assumptions register** — explicit list of "what must be true for this to work"; each assumption gets a confidence tag and evidence link
- **Risk × supporting factors** — two columns, but tagged with **severity × impact**, not unweighted bullets. Optional 2×2 heatmap if we have enough tagged factors.
- **Open questions** — answer grid: rows = questions, columns = (current evidence, confidence, suggested next step)

**Explicitly avoid**
- A simple pros-and-cons split as the core output
- Verdict without assumptions
- Point-estimate numbers without confidence bands

**Pipeline additions**
- Driver tree synthesis (4 branches × confidence)
- Scenario band synthesis (base / upside / downside with trigger conditions)
- Tornado sensitivity pass
- Severity × impact tags on supporting/risk factors
- Assumptions register extraction
- Market-size pass with explicit assumptions (gated by confidence threshold)

---

### 6.4 Market Research — the *market map + tracker*

**Metaphor:** CB Insights market map fused with a Morning Consult tracker. Not a one-shot snapshot — repeated measurement is the premium signal.

**Answer layer (the 5 questions)**
- **Market state** — growing / consolidating / fragmenting / stagnating, with a rate where numeric
- **Why this matters** in the user's context (region, segment, use case from intake)
- **What changed** this quarter — the tracker move
- **Confidence** with driver
- **Watch list** — top 2–3 signals likely to change the market in the next quarter

**Proof layer**
- **Tinted logo market map** (dominant exhibit) — segments by a synthesized taxonomy; logos mono-tinted so none dominates; click a logo → side panel
- **Trend tracker** — line chart(s) of the market's key tracked signals over time (search interest, funding pace, headcount across players, earnings mentions). **Repeated measures, not a snapshot.** This is the Morning Consult move we've been missing.
- **Maturity curve** — hype cycle / S-curve positioning for the category, with named stage
- **Stat-card hero row** — market size, growth rate, # of players, last major move date (sparklines on each)

**Exploration layer**
- **Player landscape** — 2×2 on scale × momentum (or breadth × focus); plus the leader / challenger / niche / emerging taxonomy we already compute. Both, because both are useful.
- **TAM/SAM/SOM with assumptions** (gated; hide if low confidence)
- **Opportunity × threat 2×2** — tagged with probability × impact. Not a flat bullet split.
- **Voice of the market (quote wall)** — pullquotes clustered by theme, each with attribution card (source, role, date). Primary-source texture today's output lacks entirely.
- **Trend timeline** — category-level events: major fundings, product launches, regulations, new entrants. Typed and dated.
- **Geographic heat map** — *only if* geography changes the decision (explicit from intake). Otherwise skip.

**Explicitly avoid**
- One long market overview paragraph at the top
- Random company cards without segmentation
- Generic opportunity/threat split with no time dimension

**Pipeline additions**
- Segmentation taxonomy generation for the market map
- Time-series extraction from evidence pack
- Tracker state — persist prior briefs' signals so "what changed this quarter" is real
- Pullquote extraction with theme tagging
- 2-axis positioning scores (beyond the 4-category bucket)
- Market-size pass with assumptions (gated)
- Watch-list synthesis — "what signals would flip this?"

---

## 7. Archetype gallery (reference menu)

Use this as the visual vocabulary. Each archetype is tagged with complexity (L / M / H).

| # | Archetype | Fits | Complexity |
|---|---|---|---|
| 1 | **Declarative-headline exhibit** (any chart, claim as title) | All | M |
| 2 | **Ranked comparison matrix** (re-weightable) | Competitive, Business Case | M |
| 3 | **2×2 quadrant** — *only with defensible named axes + rationale* | Competitive, Market | M |
| 4 | **Tinted logo-grid market map** | Market, Competitive | M |
| 5 | **TAM/SAM/SOM nested funnel with named assumptions** | Market, Business Case | L |
| 6 | **Stat-card hero row** (metric + delta + sparkline) | All | L |
| 7 | **Entity card stack** (facts + signals) | Meeting prep | L |
| 8 | **DISC personality chip / one-pager** | Meeting prep | M |
| 9 | **Typed annotated timeline** | Meeting, Competitive, Market, Business Case | M |
| 10 | **Sentence-cited exec summary** | All (universal chrome) | M |
| 11 | **Bullet chart** (replaces gauges) | All | L |
| 12 | **Slope chart** (movement over time) | Competitive, Market | L |
| 13 | **Tornado sensitivity chart** | Business Case | M |
| 14 | **Scenario bands** (base / upside / downside) | Business Case | M |
| 15 | **Waterfall** | Business Case, Market | M |
| 16 | **Hebbia-style answer matrix** | Competitive, Meeting (people), Market | M–H |
| 17 | **Sourced quote wall** (clustered by theme) | Market, Competitive | L |
| 18 | **Trend tracker** (repeated-measures line, Morning-Consult-style) | Market | M |
| 19 | **Maturity / hype curve** | Market | M |
| 20 | **Driver tree** (scored branches with confidence) | Business Case | M |
| 21 | **Stakeholder matrix** | Meeting prep | L |
| 22 | **Relationship graph** (sparse) | Meeting prep | M |
| 23 | **Risk × severity 2×2** | Business Case, Market, Competitive | L |
| 24 | **Radar** — *only with a fixed named rubric* | Meeting prep (momentum), Competitive (Porter's) | M |
| 25 | **Methodology drawer** | All (universal chrome) | L |

---

## 8. Schema contract (extended)

The output schema drives the UI; it must emit structured objects, not prose arrays. Drafted — not frozen.

```ts
// ─── Universal ─────────────────────────────────────────────
type CitedSpan = {
  text: string;
  sourceIds: string[];
  sourceSnippet?: string; // the exact source sentence, for hover preview
};

type Claim = {
  headline: string;
  body: CitedSpan[];
  priority: 'must' | 'should' | 'fyi';
  confidence: 'high' | 'med' | 'low';
  confidenceDriver?: string;
};

type AnswerBlock = {
  conclusion: CitedSpan;
  whyItMatters: CitedSpan;
  whatChanged: CitedSpan | null; // null = no prior baseline
  confidence: { level: 'high' | 'med' | 'low'; driver: string };
  recommendedNext: { text: string; action?: string; copyable?: string };
};

type TrustLayer = {
  sourcedClaimCount: number;
  freshness: { oldest: string; newest: string };
  mostImportant: string[]; // sourceIds the ranker weighted highest
  conflicts: Array<{ claim: string; against: string[]; supporting: string[] }>;
  knownUnknowns: Array<{ question: string; queriesTried: string[] }>;
};

type Methodology = {
  providers: Array<{ name: string; queriesRun: string[]; docsReturned: number }>;
  freshnessRange: { oldest: string; newest: string };
  confidenceDrivers: string[];
  excluded: Array<{ sourceId: string; reason: string }>;
};

type Exhibit<T> = {
  headline: string;      // declarative claim
  subhead?: string;      // "so what"
  data: T;
  asOf: string;
  sources: string[];
  note?: string;
};

// ─── Meeting Prep ──────────────────────────────────────────
type AccountState = {
  state: 'warm' | 'watch' | 'risk';
  drivers: CitedSpan[]; // 3 reasons
};

type SignalCard = {
  date: string;
  headline: string;
  whyItMatters: string;
  suggestedOpener?: string;
  sources: string[];
};

type StakeholderRow = {
  name: string;
  title: string | 'unknown';
  likelyAgenda: CitedSpan | null;
  pressure: CitedSpan | null;
  leverage: CitedSpan | null;
  unknowns: string[];
  commsStyle?: { tag: string; disc?: { d: number; i: number; s: number; c: number } };
  recentSignal?: { text: string; date: string; source: string };
};

// ─── Competitive ───────────────────────────────────────────
type CapabilityMatrix = {
  dimensions: string[];
  entities: string[]; // includes yourCompany
  cells: Record<string, Record<string, { score: number; position: CitedSpan }>>;
};

type QuadrantDef = {
  xAxis: { name: string; description: string; rationale: CitedSpan };
  yAxis: { name: string; description: string; rationale: CitedSpan };
  points: Array<{ entity: string; x: number; y: number; rationale: CitedSpan }>;
} | { notRendered: { reason: string } };

type TypedEvent = {
  date: string;
  type: 'funding' | 'product' | 'exec' | 'customer' | 'partnership' | 'risk' | 'regulation' | 'market';
  impact: 'positive' | 'neutral' | 'negative' | 'mixed';
  text: string;
  entity?: string;
  sources: string[];
};

type WhitespacePocket = {
  kind: 'segment' | 'flank' | 'pricing' | 'capability';
  headline: string;
  evidence: CitedSpan;
};

type Recommendation = {
  posture: 'defend' | 'attack' | 'partner' | 'ignore';
  target: string; // competitor or segment
  action: CitedSpan;
};

// ─── Business Case ─────────────────────────────────────────
type DriverTree = {
  branches: Array<{
    name: 'demand' | 'economics' | 'strategic-fit' | 'execution-risk';
    score: number;
    confidence: 'high' | 'med' | 'low';
    children: Array<{ label: string; evidence: CitedSpan }>;
  }>;
};

type ScenarioBands = {
  metric: string;
  base: { value: number; drivers: string[] };
  upside: { value: number; triggers: string[] };
  downside: { value: number; triggers: string[] };
};

type Tornado = Array<{ assumption: string; lowImpact: number; highImpact: number }>;

type Waterfall = Array<{ label: string; delta: number; assumption: CitedSpan }>;

type Comparable = {
  name: string;
  outcome: 'success' | 'mixed' | 'failure';
  relevance: number; // 0-1
  takeaway: CitedSpan;
};

type Assumption = {
  text: string;
  mustBeTrueBecause: string;
  confidence: 'high' | 'med' | 'low';
  evidence: CitedSpan[];
};

type TAMSAMSOM =
  | {
      tam: { value: number; assumption: CitedSpan };
      sam: { value: number; assumption: CitedSpan };
      som: { value: number; assumption: CitedSpan };
    }
  | { unableToSize: { reason: string } };

// ─── Market Research ───────────────────────────────────────
type MarketState = {
  direction: 'growing' | 'consolidating' | 'fragmenting' | 'stagnating';
  rate?: number; // e.g. YoY %
  drivers: CitedSpan[];
};

type MarketMap = {
  segments: Array<{
    name: string;
    rationale: string;
    players: Array<{ name: string; logoUrl?: string; position?: 'leader' | 'challenger' | 'niche' | 'emerging' }>;
  }>;
};

type TrendSeries = {
  metric: string;
  points: Array<{ t: string; value: number }>;
  headline: string; // declarative claim
};

type MaturityPosition = {
  stage: 'innovation-trigger' | 'peak' | 'trough' | 'slope' | 'plateau';
  rationale: CitedSpan;
};

type WatchItem = {
  signal: string;
  whyItMatters: string;
  nextCheckBy: string; // date
  sources: string[];
};

type PullQuote = {
  quote: string;
  attribution: { name: string; role?: string; source: string; date: string };
  theme: string;
};

type OpportunityThreat = {
  kind: 'opportunity' | 'threat';
  text: string;
  probability: 'high' | 'med' | 'low';
  impact: 'high' | 'med' | 'low';
  timeHorizon: '30d' | '90d' | '6m' | '1y+';
  sources: string[];
};
```

---

## 9. Phasing

Each phase ships independently. Pick them off one at a time; don't mix.

### Phase 1 — Universal premium layer (highest leverage, lowest scope)
1. **The five-question Answer block** at the top of every brief (§4.1)
2. **Sentence-level citations** with hover snippets across all four flows (§4.2)
3. **Trust layer** — freshness, most-important, conflicts, known-unknowns (§4.3)
4. **Methodology drawer** (§4.4)
5. **Priority tiers** on every item (§4.5)
6. **Explicit "unknown"** rendering (§4.7)
7. **Declarative-headline pass** on every exhibit (§4.8)

**Impact**: this alone transforms perceived quality — no new workflows, no new viz.

### Phase 2 — Promote structured data we already compute
8. **Meeting prep**: kill the gauge, replace with bullet chart for account state; render `radarMetrics` as a real radar (rubric is fixed — budget/tech/competitor/champion/setup); render `timelineEvents` as a real typed timeline; render `competitorMatrix` as a compact answer grid
9. **Competitive**: add `yourCompany` into the capability matrix; date-type the `recentMoves`
10. **Business case**: convert supporting/risk bullets to severity × impact cards; upgrade verdict to a scored display, not a pill
11. **Market research**: sort players onto a 2×2 (scale × momentum) alongside the current 4-category bucket

### Phase 3 — Hero exhibits per workflow
12. **Meeting prep**: Answer block, signal cards, attendee cards with DISC chips, stakeholder matrix
13. **Competitive**: capability matrix (dominant), whitespace panel, strategic posture (defend/attack/partner/ignore), slope chart if data allows, quadrant *only if* axes are defensible
14. **Business case**: driver tree, scenario bands, tornado, waterfall, comparables table, assumptions register
15. **Market research**: tinted logo market map (dominant), trend tracker (Morning Consult-style), maturity curve, quote wall, watch list

### Phase 4 — Signature pipeline additions
16. Personality inference (meeting prep)
17. Composite axis synthesis + rationale (competitive quadrant gate)
18. Driver tree + scenario + tornado pass (business case)
19. Market sizing with assumptions (gated)
20. Pullquote extraction with theme tagging
21. Time-series extraction + tracker persistence
22. Whitespace pass (competitive)
23. Watch-list synthesis (market)
24. Stakeholder matrix synthesis (meeting)
25. Delta detector — diff against prior brief (all flows)

### Phase 5 — Interaction & power-user
26. Re-weightable comparison matrices (Forrester move)
27. Filterable market maps
28. One-page PDF export per flow (reps actually use this)
29. Feedback loop — thumbs / wrong-flag on every claim (§4.9)
30. Refresh button in methodology drawer

---

## 10. What we're deliberately *not* doing

- Real-time collaboration, auto-refresh schedules, white-label branding — defer
- Long-form AI chat over the brief — we have `chat` already; integrate, don't redesign
- Video / audio summaries — not where premium lives
- Gauges, speedometers, decorative animations — specifically banned (premium products are *still*, not animated)
- Quadrants without defensible axes, radars without a rubric, pros/cons splits, profile-cards-as-main-artifact, decorative gauges, generic "ask about their growth plans" talking points — all on the kill list

---

## 11. Success tests

A brief ships when it passes all of:

1. **The 2-minute test** — user gets the answer, why it matters, what changed, confidence, and next step in under 2 minutes
2. **The forward test** — any single exhibit, screenshotted and forwarded without context, still makes sense (declarative headline carries it)
3. **The hover test** — every factual clause reveals a source sentence on hover
4. **The methodology test** — user can answer "how was this made?" in one click
5. **The delta test** — "what changed since last brief" is visible, not buried
6. **The avoid test** — no gauge, no radar-without-rubric, no fuzzy quadrant, no pros/cons split, no profile-cards-as-main-artifact
7. **The schema test** — every visual is backed by a structured object, not an LLM prose blob

---

## 12. Reference gallery — products to study

**Premium exhibits & density stratification**
- mckinsey.com/quarterly — declarative headlines, exhibit-per-250-words
- bcg.com/publications
- gartner.com/en/research/methodologies/magic-quadrants-research — the original defensible 2×2
- forrester.com/research/the-forrester-wave — re-weightable criteria
- cbinsights.com/research — tinted logo grids, ESP matrix
- a16z.com/big-ideas, sequoiacap.com/article — market maps, long-scroll exhibit essays

**Sentence citation & evidence**
- alpha-sense.com — sentence-level superscripts with snippet preview
- tegus.com — topic-tagged expert call smart synopsis
- perplexity.ai Pages — inline citation pills
- hebbia.ai — the answer matrix

**Trackers (Morning Consult logic)**
- morningconsult.com — repeated measurement presentation

**Meeting prep & sales intel**
- gong.io/product/deal-execution — delta framing, deal warnings
- clari.com/products/revenue-execution — scorecard brief
- people.ai/product/account-planning — relationship map
- crystalknows.com / humanticai.com — DISC one-pager
- business.linkedin.com/sales-solutions/sales-navigator
- avoma.com/ai-meeting-assistant — calendar-invite agenda
- momentum.io — 5-bullet punchy pre-call format
- axioshq.com — "time to read" marker + bold-first-phrase

**Benchmark dashboards**
- similarweb.com — share / rank / trend presentation
- bloomberg.com/professional/solution/bloomberg-terminal — density as premium signal

---

## 13. TL;DR for yourself in a month

- **Answer first. Proof next. Exploration last.** Five questions on Layer A before the user scrolls.
- **Cite at the sentence level**, hover reveals the source sentence.
- **Methodology drawer** is first-class, not a footnote.
- **Kill gauges. Use bullet charts.** Radars only with a fixed rubric. Quadrants only with defensible axes.
- **Market research needs a tracker, not a snapshot.** Repeated measures is the Morning Consult move.
- **Business case needs a driver tree, scenario bands, tornado, and assumptions register** — otherwise it's pros/cons.
- **Competitive analysis defaults to a ranked capability matrix** (with `yourCompany` in it). Quadrant is optional.
- **Meeting prep is an account brief**, not a dashboard. Stakeholder matrix > gauge.
- **Schema-first.** If the model doesn't emit it as a structured object, the UI can't render it as one.
- **Phase 1 first** — universal chrome is the biggest leap per dollar of scope. Do it before any new viz.
