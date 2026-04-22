# GetRelevant — Intelligence Results **Implementation Plan**
_Date: 2026-04-21_
_Scope: build the four intelligence results pages per `PLAN_RESULTS_PRESENTATION_MASTER_2026-04-21.md`._
_Audience: an autonomous agent + its sub-agents. This doc is their complete brief._

---

# PART 0 — KICKOFF: START HERE

This is the first thing you read. Don't skip ahead.

## 0.1 What you're building
The intelligence-results presentation upgrade described in `docs/PLAN_RESULTS_PRESENTATION_MASTER_2026-04-21.md`. Four flows (meeting prep, competitive analysis, business case, market research). Six phases (0–5). Roughly 60 tasks total.

## 0.2 What "done" means
Every task in Parts 4–9 is complete, every test is green, every phase report is written, the final report exists, and the human has been pinged. Until then you keep working.

## 0.3 Your first 30 minutes (do these in order)
1. **Read the master plan** `docs/PLAN_RESULTS_PRESENTATION_MASTER_2026-04-21.md` end-to-end. That's the *why*. This doc is the *how*. You need both.
2. **Read Parts 1–3 of this doc** (operating contract, pre-flight, global conventions). These set the rules you'll work under for the entire engagement.
3. **Run Part 2 pre-flight** verbatim. If anything fails: see Part 13 escalation.
4. **Create the feature branch** `feat/intel-results-master` (Part 2.3).
5. **Snapshot the existing UI** by running `npm run dev` and walking the four result pages. Save notes — you'll compare against these later.
6. **Start P0-01** (Part 4). One task. After it's committed and green, move to Phase 1.

## 0.4 How to proceed through phases
- Strict ordering: Phase 0 → 1 → 2 → 3 → 4 → 5. Don't start a phase until the prior is reported done.
- Within a phase, parallelize per the delegation map (Part 12). Don't parallelize across phases.
- After every task: run the verify commands listed in the card. If they don't pass, the task isn't done.
- After every phase: run the manual walkthrough (§10.4), write the phase report (§11.2), and only then move on.

## 0.5 Status reporting cadence
- After every task: a single commit with the task ID in the message. That's the status signal.
- After every phase: a phase report file at `docs/REPORTS/PHASE_<N>_REPORT.md` (template in §16).
- After Phase 5: a final report (template in §16) and a single message to the human pointing at the branch + the report. Do not push, do not open a PR — the human will.

## 0.6 The 5 things you must never do
1. Add a new dependency to `package.json` (use SVG, see §3.2).
2. Touch anything under guardrails (§1.2): providers, openrouter wrapper, existing migrations, auth/billing/marketing, intake forms.
3. Push to remote, force-push, or open a PR.
4. Skip tests, skip typecheck, skip lint, skip build at a task boundary.
5. Loop on a failing task more than 3 times — escalate per Part 13.

## 0.7 If you get stuck
The decision tree:
- **Test failing on your code?** Fix it. Not a blocker.
- **Test failing on unrelated code?** Stop. Escalate (Part 13.1).
- **Acceptance criterion ambiguous?** Pick the option closer to the master plan; note in commit body. Not a blocker.
- **Acceptance criterion impossible?** Stop. Escalate (Part 13.2) with two concrete options.
- **Same task failing 3rd time?** Stop. Escalate (Part 13.3).
- **Need to touch a guardrail file?** Stop. Escalate (Part 13.4).

Everything else: figure it out yourself, document the decision in the commit body, keep going.

---

# PART 1 — OPERATING CONTRACT

## 1.1 Working agreement

- You (the agent) are responsible for shipping every task in Parts 4–6 **and verifying it works** before declaring done.
- Do not come back to the human until the Definition of Done (Part 7) is satisfied, or one of the escalation rules (Part 9) is triggered.
- Ship work in phases. Phase 1 must be green before Phase 2 starts. Within a phase, tasks can parallelize per the delegation map (Part 8).
- Keep changes tight to the task. Do not refactor unrelated code. Do not "clean up" tests. Do not add abstractions "for future use."

## 1.2 Guardrails — do not touch

- `src/lib/intelligence/orchestrators/*` **pipeline logic** — only change synthesis prompts + output schema when a task says so. Don't rework evidence gathering, ranking, or search planning.
- `src/lib/intelligence/providers/*` — off limits unless a task explicitly touches it.
- `src/lib/intelligence/openrouter.ts` — off limits; it's the model client wrapper.
- Migration SQL under `src/lib/intelligence/migration_*.sql` — do not modify. If schema needs DB changes, write a **new** migration file.
- Auth, billing, marketing pages, intake form flows — out of scope. If a task seems to require touching them, stop and escalate (Part 9).
- `package.json` dependencies — do not add new deps unless a task explicitly authorizes it. See §3.2 for the chart-library decision (already made: no new lib).

## 1.3 Testing discipline

Every task has required tests. A task is **not done** until:
1. All required tests pass locally (`npm run test`).
2. `npm run typecheck` passes.
3. `npm run lint` passes.
4. `npm run build` passes.
5. For UI tasks: the relevant page renders in `npm run dev` without console errors and matches the acceptance criteria when exercised manually (see §5.4).

No red tests, no type errors, no lint errors, no build failures at task boundary. If any of these break because of something outside your task, stop and escalate.

## 1.4 Commit discipline

- One task = one commit. Commit message format: `feat(intel-results): <TASK_ID> <one-line>`.
- If a task needs a prep commit (e.g., scaffolding), prefix with `chore(intel-results): ...`.
- Never amend a commit after a hook failure. Fix, re-stage, new commit.
- Do not push to remote. Do not open a PR. The human handles that at the end.

## 1.5 When the human is not around

- Treat ambiguity as "pick the option closer to the master plan and the acceptance criteria, and note it in the commit message body."
- If two options both satisfy acceptance criteria, pick the simpler / less-code-churny one.
- If you hit a contract ambiguity (e.g., schema says X but acceptance criterion says Y), trust the acceptance criterion; update the schema.

---

# PART 2 — PRE-FLIGHT

Before any phase-1 task, run these in order. Every one must be green.

## 2.1 Environment sanity

```bash
node --version   # expect v20+
npm --version
git status       # confirm on a clean branch dedicated to this work
git rev-parse --abbrev-ref HEAD
```

## 2.2 Baseline green

```bash
npm install
npm run typecheck
npm run lint
npm run test
npm run build
```

All four must pass on the current branch **before you start editing**. If any fail pre-edit, escalate (Part 9) — don't "fix unrelated breakage" as a first move.

## 2.3 Branch strategy

Create a feature branch off `main` the first time you run pre-flight:

```bash
git checkout -b feat/intel-results-master
```

All tasks commit to this branch. Do not rebase. Do not merge to main — the human will.

## 2.4 Snapshot existing UI

Run `npm run dev` and manually open all four result pages against recorded fixture briefs (see §3.6). Take note of current behaviour so you can tell what regresses later.

Capture:
- The meeting-prep gauge (will be replaced in P2-01)
- The radar (stays; rendering changes in P2-02)
- Comparison matrix (competitive) — will gain a `yourCompany` column in P2-03
- Business-case two-column pros/cons (will become severity-tagged in P2-04)
- Market-research four-column player grid (will gain a 2×2 in P2-05)

---

# PART 3 — GLOBAL CONVENTIONS

## 3.1 File layout

| Kind | Location |
|---|---|
| Shared UI primitives (CitedSpan, ExhibitShell, ConfidenceBadge, PriorityStrip, etc.) | `src/app/app/intelligence/results/shared/` |
| Flow-specific panels | `src/app/app/intelligence/results/<flow>/` — e.g. `meeting-prep/`, `competitive/`, `business-case/`, `market-research/` |
| Visualization primitives (BulletChart, Radar, Timeline, Waterfall, etc.) | `src/app/app/intelligence/results/shared/viz/` |
| Contracts (Zod + TS types) | `src/lib/intelligence/contracts.ts` |
| Synthesis prompts | `src/lib/intelligence/prompts/` |
| Orchestrators | `src/lib/intelligence/orchestrators/` |
| Tests | `__tests__/` directory next to the file under test |

## 3.2 Chart library decision — **no new dependency**

The codebase already rolls custom SVG for the meeting-prep radar. Keep that pattern. All visualizations (bullet chart, sparkline, waterfall, tornado, scenario bands, slope chart, timeline, quadrant, radar, logo grid) are to be **small React + SVG components** with no external chart lib. Rationale: bundle size, consistency with existing code, and these viz are simple enough that a charting framework is overkill.

If you hit a case where custom SVG is genuinely impractical (unlikely), escalate — don't silently add `recharts` or `d3`.

## 3.3 Naming

- Files: kebab-case (`bullet-chart.tsx`).
- Components: PascalCase (`BulletChart`).
- Zod schemas: `FooSchema`, inferred types: `type Foo = z.infer<typeof FooSchema>`.
- New intelligence schema fields additive, never rename existing ones — the DB has persisted briefs.

## 3.4 Accessibility

- Every interactive element has a visible focus ring (use existing Tailwind utilities in the repo).
- Every chart has a text fallback (`aria-label` summarizing the chart's claim headline + key data points).
- Color is never the only signal — use color + icon + text (e.g. confidence badge = icon + color + word).
- Contrast: AA minimum. If unsure, use `npx pa11y` on the rendered page (spot check, not gated).

## 3.5 Component pattern

Every exhibit component takes `{ data, headline, subhead?, asOf, sources, onCitationHover?, className? }` and wraps itself in `ExhibitShell` (built in P1-06). The shell handles the declarative-headline caption, as-of marker, source chips footer, and "screenshot export" button. Component authors focus on the inner viz.

## 3.6 Test fixtures

Create `src/app/app/intelligence/results/__fixtures__/` with:
- `meeting-prep.fixture.ts` — a full `MeetingPrepBrief` sample
- `competitive.fixture.ts`, `business-case.fixture.ts`, `market-research.fixture.ts`
- `empty.fixture.ts` — a brief with every optional field missing/empty (used for "explicit unknown" tests)
- `degraded.fixture.ts` — `status.degraded=true`, sparse sources

These are imported by component tests. Keep them hand-written and stable — do not regenerate from the live pipeline.

## 3.7 Performance budgets

- No new dependency (§3.2). Budget already respected.
- Results page initial render < 200ms after data available on a mid-tier laptop (spot-check with the React Profiler).
- No JSON blob > 200KB in the network payload at component load. If an exhibit pulls huge data, lazy-load.

## 3.8 Feature flag

Wrap all new universal-chrome + hero-exhibit work behind a single runtime flag in `src/lib/intelligence/feature-flags.ts`: `INTEL_RESULTS_V2`. Default on in dev, default off in prod until Phase 3 lands. This lets the human turn it off if something breaks post-merge.

```ts
// src/lib/intelligence/feature-flags.ts (file already exists — add this flag)
export const INTEL_RESULTS_V2 =
  process.env.NEXT_PUBLIC_INTEL_RESULTS_V2 === 'true' || process.env.NODE_ENV !== 'production'
```

Every component with both a v1 and a v2 rendering path reads this flag and falls back to v1 when off.

---

# PART 4 — PHASE 0: SCAFFOLDING

## P0-01 — Fixtures, feature flag, and primitive directory

**Purpose**: make Phase 1 possible by putting the scaffolding in place once.

**Files**
- `src/app/app/intelligence/results/__fixtures__/*.fixture.ts` (5 files — see §3.6)
- `src/app/app/intelligence/results/shared/viz/index.ts` (barrel; empty for now)
- `src/lib/intelligence/feature-flags.ts` (add `INTEL_RESULTS_V2` per §3.8)

**Steps**
1. Read current brief shapes from `src/lib/intelligence/contracts.ts`.
2. Author the five fixture files by hand with realistic, stable data. Include all optional fields in the main fixtures; strip them in `empty.fixture.ts`.
3. Add the feature flag. Wire nothing to it yet.

**Acceptance criteria**
- `npm run typecheck` passes with the new fixtures typed against `IntelligenceBrief`.
- Fixtures conform to the existing Zod schemas when parsed.
- `INTEL_RESULTS_V2` is `true` in dev, `false` in prod.

**Tests**
- `__tests__/fixtures.test.ts`: iterate each fixture, parse it through its Zod schema, assert parse succeeds.

**Verify**
```bash
npm run typecheck && npm run test -- fixtures
```

---

# PART 5 — PHASE 1: UNIVERSAL CHROME

Goal of phase: every brief type looks and feels premium even *before* any per-workflow viz changes. This is the highest-leverage phase.

Tasks can be parallelized per the delegation map (§8.2). Dependencies noted per task.

## P1-01 — Schema extensions for the universal layer

**Purpose**: add the structured fields the chrome renders.

**Dependencies**: P0-01.

**Files**
- `src/lib/intelligence/contracts.ts`

**Steps**
Add to `contracts.ts` (additive only):

```ts
export const CitedSpanSchema = z.object({
  text: z.string(),
  sourceIds: z.array(z.string()),
  sourceSnippet: z.string().nullable().optional(),
})
export type CitedSpan = z.infer<typeof CitedSpanSchema>

export const AnswerBlockSchema = z.object({
  conclusion: CitedSpanSchema,
  whyItMatters: CitedSpanSchema,
  whatChanged: CitedSpanSchema.nullable(),
  confidence: z.object({
    level: ConfidenceSchema,
    driver: z.string(),
  }),
  recommendedNext: z.object({
    text: z.string(),
    action: z.string().optional(),
    copyable: z.string().optional(),
  }),
})
export type AnswerBlock = z.infer<typeof AnswerBlockSchema>

export const TrustLayerSchema = z.object({
  sourcedClaimCount: z.number().int().nonnegative(),
  freshness: z.object({
    oldestSourceAt: z.string().nullable(),
    newestSourceAt: z.string().nullable(),
  }),
  mostImportantSourceIds: z.array(z.string()),
  conflicts: z.array(z.object({
    claim: z.string(),
    againstSourceIds: z.array(z.string()),
    supportingSourceIds: z.array(z.string()),
  })),
  knownUnknowns: z.array(z.object({
    question: z.string(),
    queriesTried: z.array(z.string()),
  })),
})
export type TrustLayer = z.infer<typeof TrustLayerSchema>

export const MethodologySchema = z.object({
  providers: z.array(z.object({
    name: z.string(),
    queriesRun: z.array(z.string()),
    docsReturned: z.number().int().nonnegative(),
  })),
  freshnessRange: z.object({
    oldest: z.string().nullable(),
    newest: z.string().nullable(),
  }),
  confidenceDrivers: z.array(z.string()),
  excluded: z.array(z.object({
    sourceId: z.string(),
    reason: z.string(),
  })),
})
export type Methodology = z.infer<typeof MethodologySchema>

export const PrioritySchema = z.enum(['must', 'should', 'fyi'])
export type Priority = z.infer<typeof PrioritySchema>

export const RichBulletSchema = BriefBulletSchema.extend({
  priority: PrioritySchema.optional(),
  confidence: ConfidenceSchema.optional(),
  confidenceDriver: z.string().optional(),
  spans: z.array(CitedSpanSchema).optional(), // sentence-level breakdown when present
})
export type RichBullet = z.infer<typeof RichBulletSchema>
```

Extend `BriefBase`:

```ts
export interface BriefBase {
  // ...existing fields...
  answer?: AnswerBlock
  trust?: TrustLayer
  methodology?: Methodology
}
```

All new fields **optional** — existing persisted briefs must still parse.

**Acceptance criteria**
- Existing tests in `src/lib/intelligence/__tests__/contracts.test.ts` still pass unchanged.
- New schemas round-trip (parse → stringify → parse) on the fixtures.

**Tests**
Add to `contracts.test.ts`:
- CitedSpan parses with and without `sourceSnippet`.
- AnswerBlock requires all fields except `whatChanged` (nullable).
- RichBullet is backward-compatible with existing BriefBullet data (no priority/confidence).
- A fully-populated `BriefBase` object with `answer`, `trust`, `methodology` parses.

**Verify**
```bash
npm run typecheck && npm run test -- contracts
```

---

## P1-02 — `CitedText` + `SourcePopover` primitives

**Purpose**: render any `CitedSpan[]` as prose with per-clause superscripts + hover preview.

**Dependencies**: P1-01.

**Files (new)**
- `src/app/app/intelligence/results/shared/CitedText.tsx`
- `src/app/app/intelligence/results/shared/SourcePopover.tsx`
- `src/app/app/intelligence/results/shared/__tests__/CitedText.test.tsx`

**Component contract**
```tsx
<CitedText spans={spans} sources={brief.sources} />
```
Renders each span's text inline, followed by a small superscript numeral (1-indexed, deduped per brief so the same `sourceId` always gets the same number). Hovering the superscript opens `SourcePopover` showing: source title, domain, publish date, the `sourceSnippet` if present, and a link to the URL.

**Steps**
1. Implement `CitedText` as a pure render of `CitedSpan[]` + `BriefSource[]`.
2. Build `SourcePopover` as a tooltip-like floating card. Use existing Tailwind utilities; no new lib.
3. Keyboard accessible: Tab focuses the superscript, Enter/Space opens the popover, Escape closes.

**Acceptance criteria**
- Hovering a superscript shows title / domain / date / snippet / link.
- Two spans citing the same `sourceId` render the same superscript number.
- Missing snippet renders "snippet unavailable" (not empty).
- Works keyboard-only.

**Tests**
- Renders all span text.
- Dedupes numerals across repeated `sourceIds`.
- `aria-describedby` on the superscript points to the popover when open.
- Missing source (id not in `sources[]`) renders a grayed-out superscript with tooltip "source no longer available."

**Verify**
```bash
npm run test -- CitedText && npm run typecheck
```

---

## P1-03 — `AnswerBlock` component

**Purpose**: the sticky five-question block at the top of every result page.

**Dependencies**: P1-01, P1-02.

**Files (new)**
- `src/app/app/intelligence/results/shared/AnswerBlock.tsx`
- `src/app/app/intelligence/results/shared/__tests__/AnswerBlock.test.tsx`

**Contract**
```tsx
<AnswerBlock
  answer={brief.answer}
  fallback={{ headline: brief.headline, bottomLine: brief.bottomLine, confidence: brief.confidence, whyItMatters: brief.whyItMatters }}
  sources={brief.sources}
/>
```

**Rules**
- Renders 5 slots in order: conclusion, whyItMatters, whatChanged (if not null), confidence badge, recommendedNext.
- If `answer` is absent, degrade gracefully to existing `headline`/`bottomLine`/`whyItMatters`/`confidence` — exists so Phase 1 doesn't require the pipeline change from P4-01.
- Total rendered word count is soft-capped: if `answer.conclusion.text + whyItMatters.text + whatChanged?.text` exceeds 120 words, show a "this brief is wordier than usual" dev-mode warning in console.
- Confidence is a chip: `high` green, `medium` amber, `low` gray. Driver text appears on hover.
- "Recommended next" has a copy button if `copyable` is set.
- Conclusion + whyItMatters + whatChanged render via `<CitedText>` so hover citations work.

**Acceptance criteria**
- Block renders on all 5 fixtures (full, empty, degraded, v1, v2).
- No `answer`? → fallback renders with a lighter-weight layout.
- Copy button copies `copyable` text to clipboard (use `navigator.clipboard.writeText`).
- Sticky at top of scroll container (Tailwind `sticky top-0`).

**Tests**
- Renders 5 slots from a complete `AnswerBlock`.
- Renders fallback when `answer` absent.
- Confidence chip has accessible label describing level + driver.
- `whatChanged === null` → the slot is not rendered (no "N/A" stub).

**Verify**
```bash
npm run test -- AnswerBlock
```

---

## P1-04 — `ConfidenceBadge`, `PriorityStrip`, `AsOfChip`

**Purpose**: the three small primitives used everywhere.

**Dependencies**: P1-01.

**Files (new)**
- `src/app/app/intelligence/results/shared/ConfidenceBadge.tsx`
- `src/app/app/intelligence/results/shared/PriorityStrip.tsx`
- `src/app/app/intelligence/results/shared/AsOfChip.tsx`
- `src/app/app/intelligence/results/shared/__tests__/small-primitives.test.tsx`

**Rules**
- `ConfidenceBadge`: props `{ level: Confidence, driver?: string }`. Colors: green/amber/gray. Icon + label. Title attr = driver.
- `PriorityStrip`: props `{ priority: Priority }`. Left-edge 4px strip. Colors: red (must), amber (should), gray (fyi).
- `AsOfChip`: props `{ at: string }`. Renders "updated Nov 12" relative-to-now (yesterday / 3 days ago / last month).

**Acceptance criteria**
- Snapshots for each (simple string assertions — no visual snapshot library).
- `AsOfChip` handles nullable input gracefully (returns null).

**Verify**
```bash
npm run test -- small-primitives
```

---

## P1-05 — `MethodologyDrawer`

**Purpose**: the Gartner-style "how we built this" drawer.

**Dependencies**: P1-01.

**Files (new)**
- `src/app/app/intelligence/results/shared/MethodologyDrawer.tsx`
- `src/app/app/intelligence/results/shared/__tests__/MethodologyDrawer.test.tsx`

**Contract**
```tsx
<MethodologyDrawer methodology={brief.methodology} trust={brief.trust} status={brief.status} />
```

**Rules**
- Rendered as a right-side slide-out drawer. Closed by default. Trigger is a small "Methodology" pill in the top-right of the page.
- Four sections: **Inputs** (echoes the user intake — hydrate from the query the user submitted), **Sources queried** (per provider with doc counts, from `methodology.providers` or `status.sourceCounts`), **What we found vs. excluded** (from `methodology.excluded`), **Confidence drivers** (from `methodology.confidenceDrivers`).
- A **Refresh** button placeholder — dispatches a `CustomEvent('intel:refresh')`. Wiring the handler is P5-05; leave the placeholder.

**Graceful fallback**
- If `methodology` is absent, synthesize a minimal view from `status` (providers + counts) + sources array.

**Acceptance criteria**
- Opens/closes smoothly; trap focus when open; Escape closes.
- Renders without crashing on `empty.fixture.ts`.

**Tests**
- All four sections render when data is present.
- Falls back on missing `methodology`.
- Focus trap works (first element focused on open, tab wraps).

**Verify**
```bash
npm run test -- MethodologyDrawer
```

---

## P1-06 — `ExhibitShell` + `DeclarativeHeadline`

**Purpose**: the standard wrapper every exhibit uses — enforces declarative-headline discipline.

**Dependencies**: P1-01.

**Files (new)**
- `src/app/app/intelligence/results/shared/ExhibitShell.tsx`
- `src/app/app/intelligence/results/shared/DeclarativeHeadline.tsx`
- `src/app/app/intelligence/results/shared/__tests__/ExhibitShell.test.tsx`

**Contract**
```tsx
<ExhibitShell headline="Vendor X leads on capability..." subhead="Mid-market is the wedge" asOf="2026-04-18" sources={[...]}>
  {/* viz goes here */}
</ExhibitShell>
```
- `headline` is required and passed through a runtime check: if it starts with a noun phrase that looks descriptive ("Market size", "Competitor scores", "Player landscape"), log a dev-mode warning. Heuristic: headline must contain a verb. Soft — does not throw.
- Renders: headline → subhead → child viz → source chips footer → as-of chip → screenshot button.
- Screenshot button uses `html-to-image` (already installed) to export the shell as PNG.

**Tests**
- Passes children through.
- Renders the headline prominently.
- Screenshot button calls `html-to-image` (mock it).
- Warning is logged when headline is descriptive (use a simple regex like `/\b(is|was|are|grew|leads|lags|doubled|fell|rose|sits|shifts)\b/i` — absence triggers the warning).

**Verify**
```bash
npm run test -- ExhibitShell
```

---

## P1-07 — "Unknown" rendering helper

**Purpose**: make explicit "we couldn't verify" first-class.

**Dependencies**: P1-01.

**Files (new)**
- `src/app/app/intelligence/results/shared/UnknownField.tsx`
- `src/app/app/intelligence/results/shared/__tests__/UnknownField.test.tsx`

**Contract**
```tsx
<UnknownField label="Tenure" queriesTried={['John Doe tenure acme.com', 'John Doe employment history']} />
```
- Renders "unknown — we couldn't verify"; on hover/click shows the queries that were tried.

**Acceptance**
- Never renders empty.
- No PII hardcoded; queriesTried is optional; if missing, hover shows "no queries recorded."

**Verify**
```bash
npm run test -- UnknownField
```

---

## P1-08 — Wire universal chrome into all four result pages

**Purpose**: end-user-visible P1 milestone. All four flows get the AnswerBlock, MethodologyDrawer, ExhibitShell on their existing exhibits, PriorityStrip/Confidence/AsOf chips, explicit "unknown" rendering.

**Dependencies**: P1-01 through P1-07.

**Files (edit)**
- `src/app/app/intelligence/IntelligenceResults.tsx`
- `src/app/app/intelligence/results/MeetingPrepPanels.tsx`
- `src/app/app/intelligence/results/<flow>/*.tsx` (whatever is there for the other three flows — audit via `git grep`)
- `src/app/app/intelligence/results/shared/StatusBar.tsx`

**Steps**
1. Behind `INTEL_RESULTS_V2`, prepend `<AnswerBlock>` to each flow's page.
2. Add the `<MethodologyDrawer>` trigger to the top-right of the page container.
3. Wrap existing exhibits (the radar, the timeline, the comparison matrix, the player grid, the verdict card) in `<ExhibitShell>` with a **generated declarative headline**. Until P4-01 lands, synthesize the headline client-side from the existing `brief.headline` + section name (acceptable temporary).
4. Apply `<PriorityStrip>` to each bullet list item. Until P4-02 populates `priority`, pick a deterministic default (`'must'` for top 2, `'should'` for next 2, `'fyi'` for the rest).
5. Replace empty-string fields in attendee profiles (meeting prep) with `<UnknownField>`.

**Acceptance criteria**
- All four pages render without console errors on the 5 fixtures.
- Disabling `INTEL_RESULTS_V2` still renders the pre-v2 layout unchanged.
- No new deps added. `npm run build` passes.

**Tests**
- Smoke test per flow: render with fixture, assert `AnswerBlock` is on screen, assert `MethodologyDrawer` trigger is on screen.

**Verify**
```bash
npm run typecheck && npm run lint && npm run test && npm run build
```
Then `npm run dev` and manually click through all four pages with fixtures. Take screenshots. No regressions vs. the pre-flight snapshots except the additions.

---

# PART 6 — PHASE 2: PROMOTE STRUCTURED DATA WE ALREADY COMPUTE

Every task here exposes data the orchestrators already produce.

## P2-01 — Kill the meeting-prep gauge, add `BulletChart`

**Purpose**: replace the decorative semicircle with a bullet chart driven by `momentumScore`.

**Dependencies**: P1-06.

**Files**
- `src/app/app/intelligence/results/shared/viz/BulletChart.tsx` (new)
- `src/app/app/intelligence/results/shared/viz/__tests__/BulletChart.test.tsx` (new)
- `src/app/app/intelligence/results/MeetingPrepPanels.tsx` (edit: remove gauge, use BulletChart)

**Contract**
```tsx
<BulletChart value={74} targetBands={[{ label: 'weak', from: 0, to: 40 }, { label: 'watch', from: 40, to: 70 }, { label: 'warm', from: 70, to: 100 }]} label="Account state" />
```
- SVG bar with labeled bands and a tick at `value`.
- Accessible: `role="img"` with an `aria-label` describing value + band.

**Acceptance**
- `momentumScore=74` renders "warm" band.
- Removing the gauge deletes its file / commented-out code. No zombie code.
- `radarMetrics` rendering is unaffected.

**Tests**
- Snapshot-free unit: for `value=0,50,100`, correct band is marked.
- `role="img"` present.

**Verify**
```bash
npm run test -- BulletChart && npm run build
```

---

## P2-02 — Real radar rendering (meeting prep)

**Purpose**: today's `radarMetrics` (already 5 fixed categories) renders as a real radar.

**Dependencies**: P1-06.

**Files**
- `src/app/app/intelligence/results/shared/viz/Radar.tsx` (new)
- `src/app/app/intelligence/results/shared/viz/__tests__/Radar.test.tsx`
- `MeetingPrepPanels.tsx` (edit)

**Contract**
```tsx
<Radar categories={['budget','tech','competitor','champion','setup']} values={[3,2,4,1,3]} max={5} />
```
- Pure SVG pentagon. Each category axis labeled.
- On hover/click an axis, show the `details` + cited sources for that metric.

**Acceptance**
- Renders 5 axes at 0°, 72°, 144°, 216°, 288°.
- All 5 categories labeled.
- Values of 0 render at the origin without degenerating the polygon.

**Tests**
- Polygon points correct for value=max everywhere.
- Renders with any number of the 5 optional values missing (fills with 0 + marks "unknown").

---

## P2-03 — `yourCompany` column in the comparison matrix

**Purpose**: the competitive capability matrix must include your company.

**Dependencies**: pipeline change.

**Files**
- `src/lib/intelligence/orchestrators/competitive-analysis.ts`
- `src/lib/intelligence/prompts/` (find the competitive prompt)
- `src/lib/intelligence/contracts.ts` (no change needed — `ComparisonRow.values[]` is already an array of `{company, position, score}`)
- `src/app/app/intelligence/results/<flow>/...` UI — tweak grid template

**Steps**
1. Update the competitive synthesis prompt so the LLM scores `yourCompany` on every dimension alongside competitors. Handle the case where `yourCompany` is absent in intake (user didn't provide one) — then no change.
2. In the UI, when `brief.yourCompany` is present, render its column with a visual "you" tag (lightly highlighted background).

**Acceptance**
- On a fixture where `yourCompany === "Relevant"`, every dimension row has a "Relevant" cell with score + position.
- When `yourCompany` is absent, matrix is unchanged from today.

**Tests**
- Schema test already covers row shape.
- Integration test: run the competitive orchestrator on a mock evidence pack with yourCompany set, assert `yourCompany` appears in every `values[]`.

---

## P2-04 — Severity × impact tags on business-case factors

**Purpose**: supporting/risk factors become weighted cards.

**Dependencies**: schema extension.

**Files**
- `src/lib/intelligence/contracts.ts`
- business-case synthesis prompt
- `src/lib/intelligence/orchestrators/business-case.ts`
- UI pros/cons panel

**Schema addition** (additive):

```ts
export const FactorSeveritySchema = z.enum(['high', 'med', 'low'])
export type FactorSeverity = z.infer<typeof FactorSeveritySchema>

export const FactorImpactSchema = z.enum(['high', 'med', 'low'])
export type FactorImpact = z.infer<typeof FactorImpactSchema>

export const FactorCardSchema = BriefBulletSchema.extend({
  severity: FactorSeveritySchema.optional(),
  impact: FactorImpactSchema.optional(),
})
export type FactorCard = z.infer<typeof FactorCardSchema>
```

Extend `BusinessCaseBrief.sections.supportingFactors` + `riskFactors` to accept `FactorCard[]`. Since `FactorCard extends BriefBullet`, backward compatible.

**Prompt update**: ask the LLM to tag each factor with severity + impact.

**UI**: factors render as cards with two small chips (S: high, I: med). Optionally render a 2×2 heatmap when both dimensions are present on ≥ 6 factors.

**Acceptance**
- Old factors without tags render unchanged.
- New factors render with visible severity + impact chips.

---

## P2-05 — Scale × momentum 2×2 for market players

**Purpose**: market players already have 4 categories; add a real positioning.

**Dependencies**: schema extension.

**Files**
- `src/lib/intelligence/contracts.ts`
- market-research prompt
- `src/lib/intelligence/orchestrators/market-research.ts`
- UI

**Schema addition** (additive):

```ts
// extend MarketPlayer
export const MarketPlayerSchema = z.object({
  name: z.string(),
  category: z.enum(['leader', 'challenger', 'niche', 'emerging']),
  description: z.string(),
  estimatedPosition: z.string(),
  scale: z.number().min(0).max(1).optional(),     // new
  momentum: z.number().min(0).max(1).optional(),  // new
  scaleRationale: z.string().optional(),
  momentumRationale: z.string().optional(),
})
```

**Prompt update**: when players are listed, score scale (size/reach) and momentum (growth/news intensity) 0–1 with a one-line rationale each.

**UI**: new exhibit `PlayerQuadrant` (SVG 2×2) alongside the existing category grid. Tooltips show rationales.

**Files (new)**
- `src/app/app/intelligence/results/shared/viz/Quadrant.tsx`
- `src/app/app/intelligence/results/shared/viz/__tests__/Quadrant.test.tsx`

**Acceptance**
- Fixture with all players scored → quadrant renders them at correct coordinates.
- Missing scores → players are listed below the quadrant as "unplotted" with a reason.

---

# PART 7 — PHASE 3: HERO EXHIBITS PER WORKFLOW

17 task cards across 4 flows. Each adds schema + UI; Phase 4 then fills the schema from the pipeline. Meeting-prep (3 cards), Competitive (4), Business Case (5), Market Research (5).

> **Phase-3 rule**: UI components render against schema, with fixture-driven tests. Pipeline hookup is Phase 4. If a schema field isn't populated yet, fall back gracefully — never crash.

---

## P3-MP — Meeting Prep hero (3 tasks)

### P3-MP-01 — `SignalCardGrid`

**Purpose**: replace prose `whatJustHappened` bullets with 3–5 dated signal cards that each have a copyable suggested opener.

**Dependencies**: P1-01 (CitedSpan), P1-06 (ExhibitShell).

**Files (new)**
- `src/app/app/intelligence/results/shared/viz/SignalCardGrid.tsx`
- `src/app/app/intelligence/results/shared/viz/__tests__/SignalCardGrid.test.tsx`

**Files (edit)**
- `src/lib/intelligence/contracts.ts` (schema delta below)
- `src/app/app/intelligence/results/MeetingPrepPanels.tsx` (mount the new grid behind `INTEL_RESULTS_V2`)

**Schema delta** (additive):
```ts
export const SignalCardSchema = z.object({
  date: z.string(),
  headline: z.string(),
  whyItMatters: z.string(),
  suggestedOpener: z.string().optional(),
  sources: z.array(z.string()).min(1),
})
export type SignalCard = z.infer<typeof SignalCardSchema>

// Extend MeetingPrepBrief:
//   signalCards?: SignalCard[]
```

**Steps**
1. Add `SignalCardSchema` + `signalCards?` to `MeetingPrepBrief` in contracts.ts.
2. Build `SignalCardGrid` as a responsive CSS-grid (1 / 2 / 3 cols per viewport).
3. Each card shows: date chip (green <7d, amber <30d, gray older), bold headline, one-line "why it matters," copy pill if `suggestedOpener` is present.
4. Wrap in `<ExhibitShell>` with headline "Here's what just moved" (placeholder — Phase 4 replaces with LLM-generated declarative headline).
5. In `MeetingPrepPanels.tsx`, render `SignalCardGrid` when `brief.signalCards?.length`, otherwise fall back to existing `whatJustHappened` bullets.
6. Update `__fixtures__/meeting-prep.fixture.ts` to include 4 `signalCards` (one <7d, one <30d, one older; one without `suggestedOpener`).

**Acceptance criteria**
- Grid renders 3–5 cards from the fixture.
- Copy button copies `suggestedOpener` to clipboard (mocked `navigator.clipboard.writeText` is called with the correct text).
- Cards without `suggestedOpener` render without a copy pill (no empty button).
- Date chip color matches age bucket on the fixture's three date spans.
- With `INTEL_RESULTS_V2=false`, the existing prose bullets render unchanged.
- When `signalCards` is absent, no empty grid renders.

**Tests**
- Unit: render fixture cards, assert count, assert date-chip coloring for each age bucket.
- Unit: click copy button → clipboard mock called with correct text.
- Unit: fixture without `suggestedOpener` → no copy pill in DOM.
- Unit: flag-off path renders prose fallback.

**Verify**
```bash
npm run typecheck && npm run lint && npm run test -- SignalCardGrid && npm run test -- contracts
```

---

### P3-MP-02 — `StakeholderMatrix`

**Purpose**: a table across attendees with role / likely agenda / pressure / leverage / unknowns columns. Replaces the current free-form attendee snapshot list.

**Dependencies**: P1-01 (CitedSpan), P1-02 (CitedText), P1-07 (UnknownField), P1-06 (ExhibitShell).

**Files (new)**
- `src/app/app/intelligence/results/shared/viz/StakeholderMatrix.tsx`
- `src/app/app/intelligence/results/shared/viz/__tests__/StakeholderMatrix.test.tsx`

**Files (edit)**
- `src/lib/intelligence/contracts.ts`
- `src/app/app/intelligence/results/MeetingPrepPanels.tsx`

**Schema delta** (additive):
```ts
export const StakeholderRowSchema = z.object({
  name: z.string(),
  title: z.string().nullable(),
  likelyAgenda: CitedSpanSchema.nullable(),
  pressure: CitedSpanSchema.nullable(),
  leverage: CitedSpanSchema.nullable(),
  unknowns: z.array(z.string()),
  commsStyleTag: z.string().optional(),
  disc: z
    .object({ d: z.number().min(0).max(100), i: z.number().min(0).max(100), s: z.number().min(0).max(100), c: z.number().min(0).max(100) })
    .optional(),
})
export type StakeholderRow = z.infer<typeof StakeholderRowSchema>

// Extend MeetingPrepBrief:
//   stakeholders?: StakeholderRow[]
```

**Steps**
1. Extend `contracts.ts` with `StakeholderRowSchema` and `stakeholders?: StakeholderRow[]` on `MeetingPrepBrief`.
2. Build `StakeholderMatrix` as a sticky-header HTML table. Columns: Name, Title, Likely agenda, Pressure, Leverage, Unknowns.
3. Render any `null` cell via `<UnknownField label="…" queriesTried={[]} />`.
4. Render `likelyAgenda` / `pressure` / `leverage` via `<CitedText spans={[value]} sources={brief.sources} />`.
5. `unknowns` column renders as a short bullet list.
6. Mount behind `INTEL_RESULTS_V2` in `MeetingPrepPanels.tsx`; fall back to existing attendee-profile cards when `stakeholders` is absent.
7. Update meeting-prep fixture with 3 stakeholder rows (one with all fields, one with some nulls, one with only name + unknowns).

**Acceptance criteria**
- Renders an accessible `<table>` with correct headers.
- Null cells render `UnknownField`, never blank.
- Citations inside cells hover-preview (inherits from `CitedText`).
- Works on fixture with minimal rows (only name + unknowns).
- Fallback path unchanged.

**Tests**
- Unit: all columns render for a fully-populated row.
- Unit: null cells render `UnknownField` component (assert by role or test-id).
- Unit: flag-off → existing attendee cards still in DOM.

**Verify**
```bash
npm run typecheck && npm run test -- StakeholderMatrix && npm run test -- contracts
```

---

### P3-MP-03 — `DiscChip`

**Purpose**: a compact visual hint of comms style per attendee. Click to expand into do/don't bullets.

**Dependencies**: P3-MP-02 (stakeholder schema), P1-04 (chip primitives).

**Files (new)**
- `src/app/app/intelligence/results/shared/viz/DiscChip.tsx`
- `src/app/app/intelligence/results/shared/viz/__tests__/DiscChip.test.tsx`

**Files (edit)**
- `src/app/app/intelligence/results/shared/viz/StakeholderMatrix.tsx` (render inline next to name when `disc` present)

**Behaviour**
- Small 16×16 SVG: four-quadrant square with the dominant axis highlighted by fill intensity. No text label inside the chip.
- Accessible: `role="img"` with `aria-label="Comms style: Dominant-Influence-Steady-Conscientious — dominant axis: D"`.
- On click (or Enter / Space), opens a popover with:
  - DISC scores as four small bars
  - "Do" bullets (static strings tuned to the dominant axis — 3 bullets)
  - "Don't" bullets (3 bullets)
- Only rendered when `disc` is present on the stakeholder row.

**Acceptance criteria**
- Chip renders inline; passes axe contrast check at small size.
- Keyboard-operable (tab focus, Enter opens popover).
- Hidden entirely when `disc` is absent.

**Tests**
- Unit: chip renders for row with `disc`, not for row without.
- Unit: dominant axis calculated correctly (largest of d/i/s/c wins; ties break alphabetically).
- Unit: popover opens via keyboard.

**Verify**
```bash
npm run typecheck && npm run test -- DiscChip
```

---

## P3-CA — Competitive Analysis hero (4 tasks)

### P3-CA-01 — `CapabilityMatrix` (re-weightable)

**Purpose**: Forrester-Wave-style matrix where the user can re-weight dimensions and watch totals recompute. `yourCompany` is a first-class column (from P2-03).

**Dependencies**: P2-03 (yourCompany in matrix), P1-02 (CitedText), P1-06 (ExhibitShell).

**Files (new)**
- `src/app/app/intelligence/results/shared/viz/CapabilityMatrix.tsx`
- `src/app/app/intelligence/results/shared/viz/__tests__/CapabilityMatrix.test.tsx`

**Files (edit)**
- `src/app/app/intelligence/results/competitive/CompetitivePanels.tsx` (or equivalent — locate with `git grep keyFindings`)

**Behaviour**
- Rows: dimensions (from `brief.comparisonMatrix[]`). Columns: each company (from `row.values[].company`, with yourCompany styled distinctly).
- Each row has a weight slider (0–5, default 3), persisted in component state (localStorage wiring is P5-01; not here).
- Cells: horizontal score bar (0–5) with numeric score label on hover + one-line position text.
- Footer row: weighted total per company = `Σ(score × weight)` across dimensions.
- Sticky header row and sticky total footer.

**Acceptance criteria**
- Renders all dimensions × all companies from the fixture's `comparisonMatrix`.
- Changing a weight slider recomputes the footer totals immediately.
- `yourCompany` column has a distinct background color and a "you" label.
- Default weights = 3 → totals equal un-weighted sums.
- Accessible: slider is keyboard-operable and announces value.

**Tests**
- Unit: totals recompute when slider changes (fire input event, assert new totals).
- Unit: yourCompany column present with correct styling when `brief.yourCompany` set.
- Unit: default weights produce correct totals.
- Unit: slider has `aria-label` naming the dimension.

**Verify**
```bash
npm run typecheck && npm run test -- CapabilityMatrix
```

---

### P3-CA-02 — `CompositeQuadrant` (gated)

**Purpose**: the 2×2 Gartner-style quadrant, **only rendered when axes are defensible**. Explicit "not rendered + reason" path prevents vibes-based quadrants.

**Dependencies**: P1-02, P1-06.

**Files (new)**
- `src/app/app/intelligence/results/shared/viz/CompositeQuadrant.tsx`
- `src/app/app/intelligence/results/shared/viz/__tests__/CompositeQuadrant.test.tsx`

**Files (edit)**
- `src/lib/intelligence/contracts.ts`
- `src/app/app/intelligence/results/competitive/CompetitivePanels.tsx`

**Schema delta**:
```ts
export const QuadrantAxisSchema = z.object({
  name: z.string(),
  description: z.string(),
  rationale: CitedSpanSchema,
})
export const CompositeQuadrantSchema = z.union([
  z.object({
    rendered: z.literal(true),
    xAxis: QuadrantAxisSchema,
    yAxis: QuadrantAxisSchema,
    points: z.array(
      z.object({
        entity: z.string(),
        x: z.number().min(0).max(1),
        y: z.number().min(0).max(1),
        rationale: CitedSpanSchema,
      })
    ),
  }),
  z.object({ rendered: z.literal(false), reason: z.string() }),
])
export type CompositeQuadrant = z.infer<typeof CompositeQuadrantSchema>

// Extend CompetitiveAnalysisBrief:
//   compositeQuadrant?: CompositeQuadrant
```

**Steps**
1. Add schema + optional field.
2. Build the viz: 400×400 SVG with labeled axes (x at bottom, y on left), quadrant divider lines at 50%, and dots at each point.
3. Hover a dot → floating card with entity name, rationale (via `CitedText`).
4. When `rendered=false`, render a muted panel with the reason (e.g. "Axes weren't distinct enough — shown as capability matrix instead").
5. Axis names clickable to show their rationale.
6. Fixture: competitive fixture gets a rendered-true version; add a second fixture `competitive-no-quadrant.fixture.ts` with `rendered: false`.

**Acceptance criteria**
- Renders dots at correct normalized coordinates.
- When `rendered=false`, no quadrant SVG is rendered — only the reason panel.
- Dot positions are within the SVG viewBox for `x,y ∈ [0,1]`.
- Label placement doesn't overflow the SVG.

**Tests**
- Unit: `rendered=true` fixture renders N dots.
- Unit: `rendered=false` fixture renders reason panel, no `<svg>`.
- Unit: hover a dot → assert rationale popover is queryable in DOM.

**Verify**
```bash
npm run typecheck && npm run test -- CompositeQuadrant
```

---

### P3-CA-03 — `RecentMovesTimeline`

**Purpose**: convert today's undated `recentMoves` strings to dated typed events rendered on a timeline. Reuses the meeting-prep `TimelineEvent` schema.

**Dependencies**: P2-02 is separate (that's the radar); this builds on existing `TimelineEventSchema` already in contracts.

**Files (new)**
- `src/app/app/intelligence/results/shared/viz/Timeline.tsx`
- `src/app/app/intelligence/results/shared/viz/__tests__/Timeline.test.tsx`

**Files (edit)**
- `src/lib/intelligence/contracts.ts` — extend `CompetitorProfile` with `recentMovesTyped?: TimelineEvent[]`
- `src/app/app/intelligence/results/competitive/CompetitivePanels.tsx`

**Schema delta**:
```ts
export const CompetitorProfileSchema = z.object({
  name: z.string(),
  description: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  recentMoves: z.array(z.string()),
  recentMovesTyped: z.array(TimelineEventSchema).optional(), // new
})
```

**Behaviour**
- Horizontal timeline (SVG), x-axis = time (oldest ← newest), y-axis implicit.
- Each event is a dot colored by `impact` (positive=green, neutral=gray, negative=red, mixed=amber).
- Event-type filter chips at the top (funding, leadership, product, customer, partnership, competition, risk, market).
- Hover a dot → popover with text + source chips.
- Per-competitor mode (one timeline per competitor) vs. merged mode (all on one, colored by competitor) — toggle button.

**Acceptance criteria**
- Renders all events from fixture.
- Chips filter events in-place (hidden dots).
- Hover opens popover.
- Merged mode distinguishes competitors by marker shape or color legend.
- Falls back to prose `recentMoves` when `recentMovesTyped` is absent.

**Tests**
- Unit: filter chip click hides events of other types.
- Unit: merged/per-competitor toggle swaps layouts.
- Unit: fallback path renders prose when `recentMovesTyped` absent.

**Verify**
```bash
npm run typecheck && npm run test -- Timeline
```

---

### P3-CA-04 — `WhitespacePanel`

**Purpose**: four-pocket whitespace exhibit: segment / flank / pricing / capability gaps where the user can win.

**Dependencies**: P1-02, P1-06.

**Files (new)**
- `src/app/app/intelligence/results/shared/viz/WhitespacePanel.tsx`
- `src/app/app/intelligence/results/shared/viz/__tests__/WhitespacePanel.test.tsx`

**Files (edit)**
- `src/lib/intelligence/contracts.ts`
- `src/app/app/intelligence/results/competitive/CompetitivePanels.tsx`

**Schema delta**:
```ts
export const WhitespacePocketSchema = z.object({
  kind: z.enum(['segment', 'flank', 'pricing', 'capability']),
  headline: z.string(),
  evidence: CitedSpanSchema,
})
export type WhitespacePocket = z.infer<typeof WhitespacePocketSchema>

// Extend CompetitiveAnalysisBrief:
//   whitespace?: WhitespacePocket[]
```

**Behaviour**
- Four slim cards in a 2×2 arrangement, one per `kind`.
- Each card: kind icon, declarative headline (large), evidence paragraph via `<CitedText>`.
- If a kind has no pocket in the fixture, render an empty card with "no clear gap identified here" (not hidden).

**Acceptance criteria**
- Four cards always rendered (empty states included).
- Headline is visually dominant.
- Evidence has hover-citation.

**Tests**
- Unit: render with 2 pockets → 2 cards populated, 2 empty.
- Unit: render with 4 pockets → all populated.
- Unit: render with 0 → 4 empty cards.

**Verify**
```bash
npm run typecheck && npm run test -- WhitespacePanel
```

---

## P3-BC — Business Case hero (5 tasks)

### P3-BC-01 — `DriverTree`

**Purpose**: show the four canonical business-case branches (demand, economics, strategic fit, execution risk) as scored cards, expandable to evidence children.

**Dependencies**: P1-02, P1-06.

**Files (new)**
- `src/app/app/intelligence/results/shared/viz/DriverTree.tsx`
- `src/app/app/intelligence/results/shared/viz/__tests__/DriverTree.test.tsx`

**Files (edit)**
- `src/lib/intelligence/contracts.ts`
- `src/app/app/intelligence/results/business-case/BusinessCasePanels.tsx`

**Schema delta**:
```ts
export const DriverBranchNameSchema = z.enum(['demand', 'economics', 'strategic-fit', 'execution-risk'])
export const DriverBranchSchema = z.object({
  name: DriverBranchNameSchema,
  score: z.number().min(0).max(5),
  confidence: z.enum(['high', 'med', 'low']),
  children: z.array(z.object({ label: z.string(), evidence: CitedSpanSchema })),
})
export const DriverTreeSchema = z.object({ branches: z.array(DriverBranchSchema) })
export type DriverTree = z.infer<typeof DriverTreeSchema>

// Extend BusinessCaseBrief:
//   driverTree?: DriverTree
```

**Behaviour**
- Four branch cards in a 2×2 grid. Each card has branch name, score (0–5 bar), confidence chip, and a collapsed children list.
- Click a card to expand children as bullets with `<CitedText>`.
- Branch names rendered with human labels ("Demand," "Unit economics," "Strategic fit," "Execution risk").

**Acceptance criteria**
- 4 cards always in the same order.
- Expansion toggles without layout jump.
- Keyboard-operable (Enter on focused card expands).

**Tests**
- Unit: renders 4 branches from fixture, in canonical order (even if fixture order differs).
- Unit: click expand → children visible.
- Unit: missing branch in fixture → render placeholder "not assessed" card.

**Verify**
```bash
npm run typecheck && npm run test -- DriverTree
```

---

### P3-BC-02 — `ScenarioBands`

**Purpose**: visualize base / upside / downside as a horizontal band with triggers annotated.

**Dependencies**: P1-06.

**Files (new)**
- `src/app/app/intelligence/results/shared/viz/ScenarioBands.tsx`
- `src/app/app/intelligence/results/shared/viz/__tests__/ScenarioBands.test.tsx`

**Files (edit)**
- `src/lib/intelligence/contracts.ts`
- `src/app/app/intelligence/results/business-case/BusinessCasePanels.tsx`

**Schema delta**:
```ts
export const ScenarioBandsSchema = z.object({
  metric: z.string(),
  unit: z.string().optional(),
  base: z.object({ value: z.number(), drivers: z.array(z.string()) }),
  upside: z.object({ value: z.number(), triggers: z.array(z.string()) }),
  downside: z.object({ value: z.number(), triggers: z.array(z.string()) }),
})
export type ScenarioBands = z.infer<typeof ScenarioBandsSchema>

// Extend BusinessCaseBrief:
//   scenarios?: ScenarioBands
```

**Behaviour**
- SVG horizontal axis from `downside.value` to `upside.value`, with a shaded band between them and a bold dot at `base.value`.
- Labels above the band: `downside value → base value → upside value` with unit suffix.
- Below the band: two small columns — "Upside triggers" and "Downside triggers" — bulleted.
- Above the band: metric name as section title.

**Acceptance criteria**
- Base dot placed exactly proportional between downside and upside.
- Triggers rendered in the correct columns.
- Units appended to all three values.
- Gracefully degrades if `upside.value ≤ base.value ≤ downside.value` is violated (log warning, still render).

**Tests**
- Unit: dot position math correct for known values (downside=10, base=20, upside=40 → dot at 33%).
- Unit: units appended.
- Unit: inverted fixture (`downside > upside`) still renders without crash.

**Verify**
```bash
npm run typecheck && npm run test -- ScenarioBands
```

---

### P3-BC-03 — `TornadoChart`

**Purpose**: rank assumptions by sensitivity, centered around base.

**Dependencies**: P1-06.

**Files (new)**
- `src/app/app/intelligence/results/shared/viz/TornadoChart.tsx`
- `src/app/app/intelligence/results/shared/viz/__tests__/TornadoChart.test.tsx`

**Files (edit)**
- `src/lib/intelligence/contracts.ts`
- `src/app/app/intelligence/results/business-case/BusinessCasePanels.tsx`

**Schema delta**:
```ts
export const TornadoEntrySchema = z.object({
  assumption: z.string(),
  lowImpact: z.number(),
  highImpact: z.number(),
})
export type TornadoEntry = z.infer<typeof TornadoEntrySchema>

// Extend BusinessCaseBrief:
//   tornado?: TornadoEntry[]
```

**Behaviour**
- Horizontal bars, one per assumption, centered at zero. Bars extend left for `lowImpact` and right for `highImpact`.
- Sorted top-to-bottom by `|highImpact - lowImpact|` descending (most sensitive first).
- Assumption label on the left, numeric impact labels on each bar end.

**Acceptance criteria**
- Sorting is correct on a fixture with mixed magnitudes.
- Zero-crossing line is visible.
- Bars scale consistently across entries.

**Tests**
- Unit: sort correctness on permuted fixture.
- Unit: bar width proportional to impact magnitude.
- Unit: empty array → renders "no sensitivity data" message.

**Verify**
```bash
npm run typecheck && npm run test -- TornadoChart
```

---

### P3-BC-04 — `Waterfall`

**Purpose**: show value build-up from baseline → drivers → target.

**Dependencies**: P1-02, P1-06.

**Files (new)**
- `src/app/app/intelligence/results/shared/viz/Waterfall.tsx`
- `src/app/app/intelligence/results/shared/viz/__tests__/Waterfall.test.tsx`

**Files (edit)**
- `src/lib/intelligence/contracts.ts`
- `src/app/app/intelligence/results/business-case/BusinessCasePanels.tsx`

**Schema delta**:
```ts
export const WaterfallStepSchema = z.object({
  label: z.string(),
  delta: z.number(),            // + or -; first step is baseline (absolute)
  kind: z.enum(['baseline', 'driver', 'subtotal', 'total']),
  assumption: CitedSpanSchema,
})
export type WaterfallStep = z.infer<typeof WaterfallStepSchema>

// Extend BusinessCaseBrief:
//   waterfall?: WaterfallStep[]
```

**Behaviour**
- Classic waterfall: each bar starts where the previous ended. Baselines + totals are full-height bars; drivers are floating bars.
- Color rules: positive driver=green, negative=red, baseline/total=gray.
- Each bar has `label` above, `delta` value inside, and (on hover) the assumption `CitedSpan`.

**Acceptance criteria**
- Running total computed correctly.
- Positive/negative coloring correct.
- Baseline + total bars span full 0→value height.
- Hover reveals assumption via `CitedText`.

**Tests**
- Unit: running total math correct for [+5, +10, -3, total] starting from baseline 100.
- Unit: color by kind+sign.
- Unit: hover triggers citation popover.

**Verify**
```bash
npm run typecheck && npm run test -- Waterfall
```

---

### P3-BC-05 — `AssumptionsRegister`

**Purpose**: the explicit list of "what must be true for this to work."

**Dependencies**: P1-02, P1-04 (ConfidenceBadge).

**Files (new)**
- `src/app/app/intelligence/results/shared/viz/AssumptionsRegister.tsx`
- `src/app/app/intelligence/results/shared/viz/__tests__/AssumptionsRegister.test.tsx`

**Files (edit)**
- `src/lib/intelligence/contracts.ts`
- `src/app/app/intelligence/results/business-case/BusinessCasePanels.tsx`

**Schema delta**:
```ts
export const AssumptionSchema = z.object({
  text: z.string(),
  mustBeTrueBecause: z.string(),
  confidence: z.enum(['high', 'med', 'low']),
  evidence: z.array(CitedSpanSchema),
})
export type Assumption = z.infer<typeof AssumptionSchema>

// Extend BusinessCaseBrief:
//   assumptions?: Assumption[]
```

**Behaviour**
- HTML table: Assumption / Why it matters / Confidence / Evidence.
- Evidence column is a small cluster of source chips with hover-preview.
- Confidence column uses `<ConfidenceBadge>`.
- Sortable by confidence (click header).

**Acceptance criteria**
- All four columns rendered.
- Confidence badge colors match level.
- Sort by confidence works (low → high or reverse).

**Tests**
- Unit: renders N rows from fixture.
- Unit: click confidence header → rows reorder.
- Unit: empty fixture → "no assumptions surfaced yet" empty state.

**Verify**
```bash
npm run typecheck && npm run test -- AssumptionsRegister
```

---

## P3-MR — Market Research hero (5 tasks)

### P3-MR-01 — `LogoMarketMap`

**Purpose**: CB Insights-style tinted logo market map as the hero for market research.

**Dependencies**: P1-06.

**Files (new)**
- `src/app/app/intelligence/results/shared/viz/LogoMarketMap.tsx`
- `src/app/app/intelligence/results/shared/viz/__tests__/LogoMarketMap.test.tsx`

**Files (edit)**
- `src/lib/intelligence/contracts.ts`
- `src/app/app/intelligence/results/market-research/MarketResearchPanels.tsx`

**Schema delta**:
```ts
export const MarketPlayerTileSchema = z.object({
  name: z.string(),
  logoUrl: z.string().nullable(),
  domain: z.string().nullable(),
})
export const MarketSegmentSchema = z.object({
  name: z.string(),
  rationale: z.string(),
  players: z.array(MarketPlayerTileSchema),
})
export const MarketMapSchema = z.object({ segments: z.array(MarketSegmentSchema) })
export type MarketMap = z.infer<typeof MarketMapSchema>

// Extend MarketResearchBrief:
//   marketMap?: MarketMap
```

**Behaviour**
- Grid of segment boxes. Each box has a segment name, a small "why this segment" tooltip, and a sub-grid of logo tiles.
- Logos rendered as `<img>` with a CSS `filter: grayscale(1) sepia(0.3)` to mono-tint them. If `logoUrl` absent, fall back to a Google favicon URL `https://www.google.com/s2/favicons?domain={domain}&sz=64`; if `domain` absent too, render an initials badge.
- Click a tile → side panel with the player name + link to detail.

**Acceptance criteria**
- All segments render.
- Logo tinting consistent across all tiles.
- Fallbacks work (no `logoUrl` → favicon; no `domain` → initials).
- No broken-image icons ever visible.

**Tests**
- Unit: render segments + tiles from fixture.
- Unit: fallback chain (logoUrl=null → favicon URL computed; domain=null → initials).
- Unit: click tile → side-panel state updates.

**Verify**
```bash
npm run typecheck && npm run test -- LogoMarketMap
```

---

### P3-MR-02 — `TrendTracker`

**Purpose**: line chart(s) of market signals over time — the Morning Consult tracker move.

**Dependencies**: P1-06.

**Files (new)**
- `src/app/app/intelligence/results/shared/viz/TrendTracker.tsx`
- `src/app/app/intelligence/results/shared/viz/__tests__/TrendTracker.test.tsx`

**Files (edit)**
- `src/lib/intelligence/contracts.ts`
- `src/app/app/intelligence/results/market-research/MarketResearchPanels.tsx`

**Schema delta**:
```ts
export const TrackedSignalSchema = z.object({
  metric: z.string(),
  headline: z.string(),
  unit: z.string().optional(),
  points: z.array(z.object({ t: z.string(), value: z.number() })).min(2),
})
export type TrackedSignal = z.infer<typeof TrackedSignalSchema>

// Extend MarketResearchBrief:
//   trackedSignals?: TrackedSignal[]
```

**Behaviour**
- One line chart per signal, stacked vertically. Each has a declarative headline as the ExhibitShell title.
- SVG-only. X-axis = time labels from `t`. Y-axis auto-scaled.
- Render nothing (not even an empty state) when `trackedSignals` is absent or empty.
- If any signal has < 2 points, skip that signal only.

**Acceptance criteria**
- N signals → N charts, in the order given.
- Y-axis rescales when values span large ranges.
- Missing `trackedSignals` → the entire section is absent (not a "no data" card).

**Tests**
- Unit: 3 signals → 3 charts.
- Unit: 0 signals → no DOM output for this exhibit.
- Unit: signal with 1 point → skipped silently.

**Verify**
```bash
npm run typecheck && npm run test -- TrendTracker
```

---

### P3-MR-03 — `MaturityCurve`

**Purpose**: Gartner-style S-curve with a dot at the category's current stage.

**Dependencies**: P1-02, P1-06.

**Files (new)**
- `src/app/app/intelligence/results/shared/viz/MaturityCurve.tsx`
- `src/app/app/intelligence/results/shared/viz/__tests__/MaturityCurve.test.tsx`

**Files (edit)**
- `src/lib/intelligence/contracts.ts`
- `src/app/app/intelligence/results/market-research/MarketResearchPanels.tsx`

**Schema delta**:
```ts
export const MaturityStageSchema = z.enum(['innovation-trigger', 'peak', 'trough', 'slope', 'plateau'])
export const MaturityPositionSchema = z.object({
  stage: MaturityStageSchema,
  rationale: CitedSpanSchema,
})
export type MaturityPosition = z.infer<typeof MaturityPositionSchema>

// Extend MarketResearchBrief:
//   maturity?: MaturityPosition
```

**Behaviour**
- SVG path approximating the classic Gartner hype cycle (steep rise → peak → trough → plateau).
- Dot placed at normalized x-position per stage: innovation-trigger=0.1, peak=0.3, trough=0.45, slope=0.7, plateau=0.9.
- Stage labels below the curve. Current stage highlighted.
- Rationale below in `<CitedText>`.

**Acceptance criteria**
- Dot placed correctly per stage.
- Stage label highlighted.
- Citation hover works.

**Tests**
- Unit: each of the 5 stages places the dot at the expected x-coordinate.

**Verify**
```bash
npm run typecheck && npm run test -- MaturityCurve
```

---

### P3-MR-04 — `QuoteWall`

**Purpose**: pullquotes from primary sources, clustered by theme.

**Dependencies**: P1-06.

**Files (new)**
- `src/app/app/intelligence/results/shared/viz/QuoteWall.tsx`
- `src/app/app/intelligence/results/shared/viz/__tests__/QuoteWall.test.tsx`

**Files (edit)**
- `src/lib/intelligence/contracts.ts`
- `src/app/app/intelligence/results/market-research/MarketResearchPanels.tsx`

**Schema delta**:
```ts
export const PullQuoteSchema = z.object({
  quote: z.string(),
  attribution: z.object({
    name: z.string(),
    role: z.string().optional(),
    source: z.string(),
    date: z.string(),
  }),
  theme: z.string(),
})
export type PullQuote = z.infer<typeof PullQuoteSchema>

// Extend MarketResearchBrief:
//   quotes?: PullQuote[]
```

**Behaviour**
- Theme filter chips at the top (unique set of `theme` values).
- Quotes rendered as cards in a masonry-like flex layout. Each card: large quote text, attribution block (name, role, source + date).
- Click a theme chip → filter to that theme. Second click resets.

**Acceptance criteria**
- All unique themes appear as chips.
- Filter narrows cards to the selected theme.
- "All" chip resets the filter.

**Tests**
- Unit: unique themes extracted correctly.
- Unit: chip click filters cards.
- Unit: empty quotes → no chips, empty-state message.

**Verify**
```bash
npm run typecheck && npm run test -- QuoteWall
```

---

### P3-MR-05 — `WatchList`

**Purpose**: 2–3 signals to watch next quarter — the "what would change the market" shortlist.

**Dependencies**: P1-04 (AsOfChip).

**Files (new)**
- `src/app/app/intelligence/results/shared/viz/WatchList.tsx`
- `src/app/app/intelligence/results/shared/viz/__tests__/WatchList.test.tsx`

**Files (edit)**
- `src/lib/intelligence/contracts.ts`
- `src/app/app/intelligence/results/market-research/MarketResearchPanels.tsx`

**Schema delta**:
```ts
export const WatchItemSchema = z.object({
  signal: z.string(),
  whyItMatters: z.string(),
  nextCheckBy: z.string(), // ISO date
  sources: z.array(z.string()),
})
export type WatchItem = z.infer<typeof WatchItemSchema>

// Extend MarketResearchBrief:
//   watchList?: WatchItem[]
```

**Behaviour**
- List of 2–3 items, each with: signal (bold), "why it matters" (body), a `nextCheckBy` date chip, and source chips.
- Date chip uses existing `<AsOfChip>` but labeled "next check."

**Acceptance criteria**
- Renders 2–3 items from fixture.
- Date chip renders relative format.
- Source chips resolve to `brief.sources`.

**Tests**
- Unit: renders N items in order.
- Unit: date formatting for past/future dates handled.

**Verify**
```bash
npm run typecheck && npm run test -- WatchList
```

---

# PART 8 — PHASE 4: PIPELINE ADDITIONS

Each pipeline task is: update the synthesis prompt + expand the Zod output schema + wire the orchestrator to emit the new fields.

Tasks:

| ID | Adds |
|---|---|
| P4-01 | `answer` block for all 4 flows (declarative headlines + 5-question synthesis) |
| P4-02 | `priority` tag on every bullet (must/should/fyi classification) |
| P4-03 | `trust` layer (freshness summary, most-important sourceIds, contradictions from v2 clusters, known unknowns from v2 `unknowns`) |
| P4-04 | `methodology` block from pipeline telemetry |
| P4-05 | `signalCards` for meeting prep |
| P4-06 | `stakeholders[]` for meeting prep |
| P4-07 | DISC inference for meeting prep (gated on LinkedIn-style evidence) |
| P4-08 | `compositeQuadrant` for competitive (with "render=false + reason" path) |
| P4-09 | `whitespace` for competitive |
| P4-10 | `driverTree`, `scenarios`, `tornado`, `waterfall`, `assumptions` for business case |
| P4-11 | `marketMap`, `trackedSignals`, `maturity`, `quotes`, `watchList` for market research |
| P4-12 | Delta detector — compares current brief with the most recent prior brief for same entity (if any) and populates `answer.whatChanged` |

Per task, the spec is:
1. Extend the relevant Zod synthesis schema (`MeetingPrepSynthesisSchema`, etc.) with the new optional fields.
2. Update the prompt in `src/lib/intelligence/prompts/` to request the new fields + provide good examples.
3. In the orchestrator, map LLM output into the brief shape.
4. Add unit tests for the prompt transformations (mocked LLM response → brief assertions).
5. Add a contract test: a brief with all P4 fields populated parses and round-trips.

**Acceptance for the phase**
- Running each flow against a known evidence pack produces briefs with the new fields populated.
- The UI built in P1–P3 now sees real data (not synthesized client-side defaults).
- Briefs **without** the new fields (old persisted briefs) still render — fallbacks from P1/P2 remain.

**Testing**
- A new integration test per flow in `src/lib/intelligence/__tests__/` that runs the orchestrator with a stubbed LLM returning a fixture response and validates the final brief shape.

---

# PART 9 — PHASE 5: INTERACTION & POWER-USER

## P5-01 — Re-weightable capability matrix
Wire the weight sliders in `CapabilityMatrix` to persist (localStorage, per brief id).

## P5-02 — Market map filters
Filter the `LogoMarketMap` by segment / stage / geography. Filter state in URL query params.

## P5-03 — One-page PDF export per flow
Using `html-to-image` + browser `window.print()` with a print stylesheet. Print view = Answer block + top 2 exhibits only.

## P5-04 — Feedback loop
Thumbs up/down + "wrong / stale / generic" flag on every AI-generated claim. POST to a new endpoint `src/app/api/intelligence/feedback/route.ts`; persist via existing Supabase wiring (see `src/lib/intelligence/db.ts`). New table migration (write a new SQL file; do not modify existing ones).

## P5-05 — Refresh button wiring
Listen for `CustomEvent('intel:refresh')` from the `MethodologyDrawer` (placeholder from P1-05); re-hit the existing `/api/intelligence` route.

---

# PART 10 — TESTING STRATEGY

## 10.1 Test pyramid

- **Unit** (majority): every new component + every synthesis transformation. Colocated in `__tests__/`.
- **Integration**: per-flow orchestrator test with stubbed LLM + stubbed providers. In `src/lib/intelligence/__tests__/`.
- **Contract**: schema round-trip tests; all fixtures parse.
- **Render smoke**: one test per results page that mounts it with a fixture and asserts the Answer block + methodology trigger are present.
- **Visual / manual**: you (the agent) must run `npm run dev` and walk through each of the four flows against each fixture before declaring the phase done. Capture notes in the final report.

## 10.2 Tooling

- **Vitest** is the runner. Config is already at `vitest.config.ts`.
- **@testing-library/react** for component tests.
- **jsdom** environment for DOM APIs.
- **No snapshot tests.** They're brittle and hide regressions behind "looks different." Use explicit assertions.
- **No e2e framework** added. Manual walkthrough is the agent's job at phase boundaries.

## 10.3 Coverage expectations

- Every new component has at least one test.
- Every new schema has at least one parse test.
- Every new orchestrator output field has an integration assertion.
- We do not enforce a % coverage threshold. Read the acceptance criteria; they are the real bar.

## 10.4 Manual walkthrough script (runs at end of every phase)

```
1. npm run dev
2. Navigate to each of the four results pages with each of the 5 fixtures
   (full / empty / degraded / v1 / v2). 20 total views.
3. For each view, verify:
   - Answer block visible, 5 slots populated or gracefully fallen-back
   - Methodology drawer opens, closes, has all sections
   - No console errors
   - At least one exhibit has a declarative headline
   - Priority strips visible on bullets
   - Unknown fields render explicit placeholders, never empty
4. Toggle INTEL_RESULTS_V2 off — existing pre-v2 layout must still work.
```

Agent records pass/fail for each view in the phase-done report.

---

# PART 11 — DEFINITION OF DONE

## 11.1 Per-task

1. Acceptance criteria met.
2. Tests pass: `npm run test -- <task-scope>`.
3. `npm run typecheck` green.
4. `npm run lint` green.
5. Committed with `feat(intel-results): <ID> ...`.

## 11.2 Per-phase

All tasks in the phase done, plus:

6. `npm run build` green.
7. `npm run test` (full suite) green.
8. Manual walkthrough (§10.4) pass on all 20 views.
9. Agent writes a phase report at `docs/REPORTS/PHASE_<N>_REPORT.md` with:
   - Completed tasks + commit SHAs
   - Screenshots of each flow
   - Any deviations from this plan + reasons
   - Any open questions (if any; empty is good)

## 11.3 Overall (end of Phase 5)

Everything above, plus:
- No TODOs left in committed code that reference this plan.
- `feature-flags.ts` still has `INTEL_RESULTS_V2`, but it's no longer gating anything net-new (kept for rollback).
- Final report at `docs/REPORTS/INTEL_RESULTS_FINAL_REPORT.md` summarizing the whole engagement.

**Only when all of the above are green do you report back to the human.** Not before.

---

# PART 12 — SUB-AGENT DELEGATION MAP

## 12.1 When to use a sub-agent

Use a sub-agent when a task is **self-contained and parallel-safe** and the main agent is working on something else. Do **not** use sub-agents for anything that needs cross-file invariants the main agent is establishing in the same session (e.g., schema extensions — do those yourself).

## 12.2 Parallel-safe task groups

| Phase | Can parallelize |
|---|---|
| P0 | — (serial) |
| P1 | P1-02, P1-03, P1-04, P1-05, P1-06, P1-07 can all run in parallel after P1-01 lands. P1-08 is serial, goes last. |
| P2 | P2-01, P2-02, P2-03, P2-04, P2-05 are independent. All parallel. |
| P3 | MP, CA, BC, MR are independent tracks — each track's tasks are serial within, but tracks parallel. |
| P4 | P4-01…P4-11 parallel after P4-01 and P4-02 (which affect the universal layer) land. P4-12 last. |
| P5 | All independent. All parallel. |

## 12.3 Sub-agent prompt template

When spinning off a sub-agent, use this template verbatim, filling in the task ID:

```
Execute task <TASK_ID> from docs/IMPLEMENTATION_PLAN_INTELLIGENCE_RESULTS_2026-04-21.md.

Operating contract: Part 1 of that doc. Do not deviate.
Pre-flight: assume green (main agent already verified).
Files: as listed in the task card.
Acceptance criteria: as listed in the task card.
Tests required: as listed.
Verify commands: as listed.
You must run the verify commands and report their output.

Do not start other tasks. Do not refactor unrelated files. Do not add dependencies.
Report back a concise summary: commit SHA, acceptance checklist (each item ✓ or with a reason), verify output, any deviations.
```

## 12.4 What the main agent does with sub-agent output

- If a sub-agent reports success: the main agent re-runs the full `npm run test && npm run typecheck && npm run lint && npm run build` locally before trusting it. An agent's self-report is not proof.
- If a sub-agent reports failure: the main agent reads the failure, decides whether to retry with clarification or to take the task on itself.
- Never ship work only a sub-agent verified. Always re-verify.

---

# PART 13 — ESCALATION RULES

Stop work and escalate to the human **only** under these conditions:

1. **Pre-flight fails** on the current branch and is not caused by your uncommitted work.
2. **Acceptance criterion is impossible to meet** because the contract contradicts itself or the data pipeline truly cannot produce the required field. In this case, propose 2 options.
3. **Third failed attempt** at the same task. Do not loop indefinitely.
4. **Out-of-scope change required**: a task genuinely cannot be done without touching guardrail-protected code (Part 1.2). Do not bypass.
5. **Destructive operation needed**: never run `git push --force`, `git reset --hard` outside a clean work-in-progress recovery, delete someone else's branch, drop a DB table, etc. If you think it's needed, stop and ask.
6. **Dependency addition proposal** (§3.2): stop and ask; never add.

When escalating, include:
- The task you're on
- What you tried (list of commands + failure messages)
- What the blocker is (one paragraph)
- Two concrete options and which you'd recommend

Do **not** escalate for:
- Ambiguity where you can pick the option closer to the plan (see §1.5)
- Test failures that are on your own code (fix them)
- Typechecking errors (fix them)
- Lint errors (fix them)
- Cosmetic decisions (pick the simpler)

---

# PART 14 — QUICK REFERENCE

## 14.1 Commands you'll run constantly

```bash
npm run typecheck    # tsc --noEmit
npm run lint         # next lint
npm run test         # vitest run
npm run test -- <name>   # one suite
npm run build        # next build
npm run dev          # local server
```

## 14.2 Files you'll touch constantly

- `src/lib/intelligence/contracts.ts` (schema)
- `src/lib/intelligence/orchestrators/<flow>.ts`
- `src/lib/intelligence/prompts/<flow>.*.ts`
- `src/app/app/intelligence/results/shared/*` (primitives)
- `src/app/app/intelligence/results/<flow>/*` (flow panels)
- `src/app/app/intelligence/IntelligenceResults.tsx` (top-level composer)

## 14.3 File you'll NOT touch

- Anything under guardrails §1.2.

## 14.4 When you finish a task

```bash
npm run typecheck && npm run lint && npm run test && git diff --stat
git add <files>
git commit -m "feat(intel-results): P<phase>-<n> <one line>"
```

## 14.5 When you finish a phase

- Run §10.4 manual walkthrough.
- Write `docs/REPORTS/PHASE_<N>_REPORT.md`.
- Run the full test + build.
- Commit the report.
- Start the next phase.

## 14.6 When you finish Phase 5

- Final report at `docs/REPORTS/INTEL_RESULTS_FINAL_REPORT.md`.
- Report back to the human: phases completed, commits ahead of `main`, any notes on follow-ups.
- **Then** stop.
