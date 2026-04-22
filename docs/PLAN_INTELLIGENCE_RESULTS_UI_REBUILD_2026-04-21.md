# Intelligence Results UI Rebuild Plan

Date: 2026-04-21

Owner: Relevant product + coding subagents

Scope: meeting-prep result surface first, then shared result primitives used by the other intelligence modes.

Primary surfaces:

- `src/app/app/intelligence/IntelligenceResults.tsx`
- `src/app/app/intelligence/results/MeetingPrepPanels.tsx`
- `src/app/app/intelligence/results/shared/SourcesStrip.tsx`
- `src/app/app/intelligence/results/shared/StatusBar.tsx`
- `src/app/app/intelligence/results/shared/SearchPlanPanel.tsx`
- `src/lib/intelligence/orchestrators/meeting-prep.ts`
- `src/lib/intelligence/prompts/meeting-prep.v1.ts`
- `src/lib/intelligence/contracts.ts`
- `src/lib/intelligence/evidence/pack.ts`
- `src/lib/intelligence/retrieval/controller.ts`
- `src/app/globals.css`

## Bottom Line

The current intelligence output is getting smarter, but the meeting-prep result page still often feels like raw model output dropped into cards.

The fix is not a cosmetic pass.

The fix is:

1. Reshape the data contract so panels receive structured, bounded content.
2. Rebuild the layout system so timeline, radar, matrix, and sources behave like product UI instead of compressed text buckets.
3. Make the evidence ledger honest about what was found, what was ranked, and what was actually used.

## What We Saw In Real Browser Testing

Observed on the live flagged V2 result flow:

- Company snapshot turned into a long free-text dump instead of a scan-friendly panel.
- Timeline desktop cards were clipped because the layout uses equal-width columns plus short line clamps and hover-only detail.
- Risk radar and competitor matrix looked structurally uneven because text length controls card height.
- Sources rows had poor hierarchy because source IDs and provider labels fight the title for space.
- The source count of `30` is not caused by the UI component. It comes from retrieval budgets, ranking, and dedupe behavior upstream.

## Current Root Causes

### 1. Snapshot content is too loose

Current state:

- `buildMeetingPrepPrompt` injects the full `snapshot` object into synthesis.
- `SnapshotCard` renders `snapshot.description` as one free paragraph.
- No hard character caps exist for the most visually expensive fields.

Root cause:

- The provider fetch is already reasonably structured.
- The dump happens because the prompt and brief assembly allow a giant prose blob to flow through unchanged.

### 2. Timeline layout is fragile

Current state:

- Desktop timeline uses `repeat(events.length, minmax(0, 1fr))`.
- Each event gets equal width regardless of text length.
- The real detail is hidden in a hover card.

Root cause:

- The layout is optimized for symmetry, not readability.

### 3. Radar and competitor blocks are content-driven, not system-driven

Current state:

- Risk metric cards and competitor rows expand based on copy length.
- There are no fixed expectations for max copy, row heights, or fallback behavior.

Root cause:

- The component contracts do not enforce bounded copy.

### 4. Sources are technically correct but visually low-trust

Current state:

- `SourcesStrip` shows source ID first, then title, then tiny metadata.
- Internal IDs dominate the row.
- Provider and source-role meaning are weak.

Root cause:

- The component is rendering a raw source list instead of an evidence ledger.

### 5. The source count is honest but unexplained

What the code is doing now:

- `buildEvidencePack` targets roughly `20-40` ranked evidence items.
- Planner fallback lane budgets are mostly `4-8` results per lane.
- `meeting-prep.ts` ranks to `topN: 24` for synthesis.
- `deduplicateSources` removes repeated URLs.

Conclusion:

- The `30` source count is not a front-end cap.
- It is the result of retrieval budgets, ranking, and source dedupe.
- The UI should explain `found`, `ranked`, and `used`, not only show one number.

### 6. Accent tokens exist, but they are not used semantically enough

Current state:

- The system already has good tokens in `globals.css`.
- The problem is not missing accent colors.
- The problem is that color meaning is inconsistent and sometimes decorative.

Desired outcome:

- Accent should signal meaning, not just activity.

## Product Decisions

These decisions should be treated as locked for this implementation:

1. Meeting prep is the first-class rebuild target.
2. Shared primitives should only be extracted after the meeting-prep version is proven.
3. We do not redesign the whole intelligence product in one pass.
4. We do not change the existing visual direction away from the current dark editorial system.
5. We do not ship more accent everywhere. We ship clearer semantic color usage.

## Implementation Order

### Phase 0 — Baseline and Contract Freeze

Agent: A

Goal:

- Freeze the current failures in code and browser fixtures so we are improving a measured target, not arguing from screenshots.

Files:

- `src/app/app/intelligence/results/MeetingPrepPanels.tsx`
- `src/app/app/intelligence/results/shared/SourcesStrip.tsx`
- `src/lib/intelligence/contracts.ts`
- `src/lib/intelligence/orchestrators/meeting-prep.ts`
- `docs/PLAN_INTELLIGENCE_RESULTS_UI_REBUILD_2026-04-21.md`

Steps:

1. Add a compact UI contract section to `contracts.ts` for meeting-prep display-safe fields.
2. Add one or two fixture briefs that represent:
   - strong-data company
   - weak-data company
3. Record current display counts for:
   - `sources found`
   - `sources ranked`
   - `sources cited in answer`
4. Confirm which panels are meeting-prep specific and which can later become shared.

Acceptance criteria:

- [ ] Fixture briefs exist for strong-data and weak-data paths.
- [ ] The team can inspect exact counts for found, ranked, and used sources.
- [ ] Meeting-prep-specific components are clearly separated from reusable result primitives.

Agent prompt:

```text
Implement Phase 0 of PLAN_INTELLIGENCE_RESULTS_UI_REBUILD_2026-04-21.md.
Do not redesign components yet. Add fixture coverage, establish display-safe
contract notes, and surface the current found/ranked/used source accounting so
the rebuild has measurable before/after acceptance.
```

### Phase 1 — Snapshot Content Reshape

Agent: B

Goal:

- Turn the company snapshot from a prose dump into a bounded scan panel.

Files:

- `src/lib/intelligence/contracts.ts`
- `src/lib/intelligence/providers/exa.ts`
- `src/lib/intelligence/orchestrators/meeting-prep.ts`
- `src/lib/intelligence/prompts/meeting-prep.v1.ts`
- `src/app/app/intelligence/results/MeetingPrepPanels.tsx`

Steps:

1. Replace the current snapshot display contract with a compact structure:
   - `summary`
   - `whatTheyDo`
   - `industry`
   - `headquarters`
   - `employeeRange`
   - `funding`
   - `ceo`
   - `website`
   - `recentMilestone`
   - `knownUnknowns`
2. Add hard field caps in orchestrator assembly:
   - summary: max 220 chars
   - milestone: max 140 chars
   - unknown item: max 80 chars
3. Stop passing raw full snapshot JSON into synthesis.
4. Build a compact prompt block for snapshot facts instead.
5. Update the `SnapshotCard` to render:
   - summary strip
   - two-column facts grid
   - milestone rail
   - missing-data rail when needed

Acceptance criteria:

- [ ] No meeting-prep snapshot can render as a long multi-paragraph dump.
- [ ] Snapshot description no longer contains markdown-style headings or provider junk.
- [ ] The card can be understood in under 10 seconds on desktop and mobile.
- [ ] Strong-data and weak-data fixtures both render cleanly.

Tests:

- Unit test for snapshot sanitization and field caps.
- Component test for the snapshot card on strong-data and weak-data fixtures.

Agent prompt:

```text
Implement Phase 1 of PLAN_INTELLIGENCE_RESULTS_UI_REBUILD_2026-04-21.md.
Fix the data shape first. Do not just clamp text in CSS. Reshape the meeting-
prep snapshot contract, compact the prompt payload, sanitize the assembled
snapshot fields, and update SnapshotCard to render a bounded scan view.
```

### Phase 2 — Timeline Rebuild

Agent: C

Goal:

- Make the timeline readable without hover and resilient at real desktop widths.

Files:

- `src/app/app/intelligence/results/MeetingPrepPanels.tsx`
- `src/app/app/intelligence/IntelligenceResults.tsx`
- `src/app/globals.css`

Steps:

1. Replace equal-width timeline columns with a rail model:
   - fixed-width cards on desktop
   - stacked cards on mobile
2. Make event text readable in the default state.
3. Keep hover/focus detail, but use it as expansion, not as the only readable state.
4. Normalize event date, event type, and source-chip placement.
5. Ensure the timeline container scrolls or wraps intentionally instead of compressing cards into unreadable widths.

Acceptance criteria:

- [ ] Six timeline events render cleanly at 1280px, 1440px, and 1728px.
- [ ] No event card is cut off or reduced to unreadable fragments.
- [ ] Mobile timeline remains stacked and readable.
- [ ] Hover is optional, not required.

Tests:

- Component or browser test for six-event timeline at desktop widths.
- Browser check for 390px and 430px mobile widths.

Agent prompt:

```text
Implement Phase 2 of PLAN_INTELLIGENCE_RESULTS_UI_REBUILD_2026-04-21.md.
Rebuild the meeting-prep timeline as a readable rail. Prioritize actual
legibility over symmetry. The user must be able to scan the event story
without hover.
```

### Phase 3 — Risk Radar and Competitor Matrix Normalization

Agent: D

Goal:

- Make these panels structurally consistent and stop copy length from breaking the grid.

Files:

- `src/app/app/intelligence/results/MeetingPrepPanels.tsx`
- `src/lib/intelligence/contracts.ts`
- `src/lib/intelligence/prompts/meeting-prep.v1.ts`

Steps:

1. Add field caps for:
   - radar detail text
   - competitor advantage text
   - competitor tags count
2. Refactor radar panel into:
   - chart block
   - fixed metric list or equal-height metric cards
3. Refactor competitor matrix rows into a stable grid:
   - identity
   - threat
   - overlap
   - advantage
4. Ensure empty states match the same visual rhythm as populated states.
5. Keep the current meaning, but remove vertical chaos.

Acceptance criteria:

- [ ] Radar metric cards appear balanced even with different evidence richness.
- [ ] Competitor rows line up like a real comparison tool.
- [ ] Empty state and populated state occupy the panel cleanly.
- [ ] No card tower effect at common desktop widths.

Tests:

- Component test for max-length radar content.
- Component test for long competitor names and long advantage text.

Agent prompt:

```text
Implement Phase 3 of PLAN_INTELLIGENCE_RESULTS_UI_REBUILD_2026-04-21.md.
Normalize the risk radar and competitor matrix so the layout is system-driven
instead of text-driven. Bound the content contract and then rebuild the panel
grid around those bounds.
```

### Phase 4 — Sources Ledger Redesign

Agent: E

Goal:

- Turn the raw source list into a decision-grade evidence ledger.

Files:

- `src/app/app/intelligence/results/shared/SourcesStrip.tsx`
- `src/app/app/intelligence/results/shared/StatusBar.tsx`
- `src/app/app/intelligence/results/shared/SearchPlanPanel.tsx`
- `src/lib/intelligence/contracts.ts`

Steps:

1. Redesign the sources section into grouped states:
   - used in answer
   - supporting but unused
   - internal memory
2. Change row hierarchy to:
   - title first
   - domain and date second
   - badges third
   - source ID as secondary metadata only
3. Add badges for:
   - `Internal`
   - `Primary`
   - `Fresh`
   - `Counterpoint`
   - `Used`
4. Clamp snippets to 2-3 lines with expand.
5. Handle internal source IDs without letting them dominate the row.
6. Improve row spacing, line heights, and link affordances.

Acceptance criteria:

- [ ] The first 10 source rows are scannable without expansion.
- [ ] Internal IDs no longer visually overpower the title.
- [ ] A user can tell what was used in the answer versus only gathered.
- [ ] No row collisions or crushed text at desktop or mobile widths.

Tests:

- Component tests for grouped source rendering.
- Browser QA for long internal source IDs.

Agent prompt:

```text
Implement Phase 4 of PLAN_INTELLIGENCE_RESULTS_UI_REBUILD_2026-04-21.md.
Treat the sources section like an evidence ledger, not a raw array dump.
Prioritize scanability, truthful source-state badges, and clean hierarchy.
```

### Phase 5 — Honest Source Accounting

Agent: F

Goal:

- Explain the source count honestly and remove the confusion around `30`.

Files:

- `src/lib/intelligence/orchestrators/meeting-prep.ts`
- `src/lib/intelligence/evidence/pack.ts`
- `src/lib/intelligence/retrieval/controller.ts`
- `src/lib/intelligence/contracts.ts`
- `src/app/app/intelligence/results/shared/StatusBar.tsx`
- `src/app/app/intelligence/results/shared/SourcesStrip.tsx`

Steps:

1. Track three display counts in the result status payload:
   - found
   - ranked for synthesis
   - cited or used in answer
2. Update the UI to show all three.
3. Keep the current retrieval budgets unless product explicitly wants more source volume.
4. Document that `30` is current retrieval output, not a UI cap.
5. Add a tooltip or support copy in the sources header explaining the count logic.

Acceptance criteria:

- [ ] The user can see why `30` sources does not mean all 30 drove the answer.
- [ ] Count math is stable for strong-data and weak-data briefs.
- [ ] Source counts shown in UI match actual underlying arrays.

Tests:

- Unit test for count derivation.
- Browser test for status and source header count alignment.

Agent prompt:

```text
Implement Phase 5 of PLAN_INTELLIGENCE_RESULTS_UI_REBUILD_2026-04-21.md.
Do not increase source volume yet. First make the source accounting honest by
tracking found, ranked, and used counts and surfacing them clearly in the UI.
```

### Phase 6 — Accent Semantics and Visual Polish

Agent: G

Goal:

- Make color carry meaning instead of just intensity.

Files:

- `src/app/globals.css`
- `src/app/app/intelligence/results/MeetingPrepPanels.tsx`
- `src/app/app/intelligence/results/shared/SourcesStrip.tsx`
- `src/app/app/intelligence/results/shared/StatusBar.tsx`

Steps:

1. Normalize semantic color usage:
   - internal memory = green or lime
   - primary evidence = amber
   - counter-evidence and risk = coral
   - unknowns and questions = violet
   - chrome and secondary metadata = neutral
2. Remove decorative accent from dense body text.
3. Use accent on badges, rails, key metrics, and states only.
4. Ensure populated and empty states both respect the same color rules.

Acceptance criteria:

- [ ] Color meaning is consistent across the rebuilt panels.
- [ ] Dense reading areas remain calm and readable.
- [ ] The UI feels more intentional without becoming louder.

Tests:

- Manual visual QA across dark and light themes if light mode is enabled on this surface.

Agent prompt:

```text
Implement Phase 6 of PLAN_INTELLIGENCE_RESULTS_UI_REBUILD_2026-04-21.md.
Use the existing token system, but apply it semantically. Do not add more
color for its own sake. Make color mean source type, risk, uncertainty, or
status.
```

### Phase 7 — Browser QA and Shared Primitive Extraction

Agent: H

Goal:

- Validate the meeting-prep rebuild in the browser, then extract only the proven pieces into shared result primitives.

Files:

- `src/app/app/intelligence/results/MeetingPrepPanels.tsx`
- `src/app/app/intelligence/results/shared/*`
- any new shared result primitive files created during implementation

Steps:

1. Run browser QA on:
   - one strong-data account
   - one weak-data account
2. Check widths:
   - 390px
   - 430px
   - 1280px
   - 1440px
   - 1728px
3. Extract only reusable patterns after the meeting-prep implementation is visually proven.
4. Do not generalize broken assumptions into the other result types.

Acceptance criteria:

- [ ] Meeting prep is visually clean in browser-tested scenarios.
- [ ] Shared result primitives are extracted only after proof, not before.
- [ ] Competitive, business-case, and market-research follow-up work has a clean template to adopt.

Tests:

- Browser smoke script or manual QA checklist committed with the plan follow-through.

Agent prompt:

```text
Implement Phase 7 of PLAN_INTELLIGENCE_RESULTS_UI_REBUILD_2026-04-21.md.
Validate the rebuilt meeting-prep result surface in a real browser at multiple
widths, then extract only the parts that are clearly reusable by the other
intelligence result modes.
```

## Subagent Workstreams

| Agent | Phase | Primary ownership |
|------|-------|-------------------|
| A | 0 | Baseline, fixtures, count instrumentation |
| B | 1 | Snapshot contract and scan card |
| C | 2 | Timeline rail rebuild |
| D | 3 | Risk radar and competitor matrix normalization |
| E | 4 | Sources ledger redesign |
| F | 5 | Found/ranked/used source accounting |
| G | 6 | Accent semantics and visual polish |
| H | 7 | Browser QA and shared primitive extraction |

## Build Sequence

Recommended delivery order:

1. Phase 0 and Phase 1
2. Phase 2 and Phase 3
3. Phase 4 and Phase 5
4. Phase 6
5. Phase 7

Reason:

- Content contract problems must be fixed before layout polish.
- Source honesty must land with the ledger redesign, not later.
- Shared extraction should happen after the meeting-prep version is proven, not before.

## Definition of Done

This work is done only when all of the following are true:

- [ ] Company snapshot is a bounded scan panel, not a prose dump.
- [ ] Timeline is readable without hover and does not clip at real desktop widths.
- [ ] Risk radar and competitor matrix appear structurally balanced.
- [ ] Sources section reads like an evidence ledger.
- [ ] Status and sources explain found, ranked, and used counts clearly.
- [ ] Accent colors carry consistent semantic meaning.
- [ ] Browser QA passes on strong-data and weak-data briefs.
- [ ] Lint and typecheck pass after implementation.

## QA Checklist

Use this checklist when implementation starts:

### Content

- [ ] Snapshot contains no raw markdown or provider dump artifacts.
- [ ] Radar details are concise.
- [ ] Competitor advantages are concise.
- [ ] Source snippets are readable and expandable.

### Layout

- [ ] No cut-off timeline cards on desktop.
- [ ] No oversize card columns in radar or competitor matrix.
- [ ] No source-row collisions.
- [ ] No horizontal overflow on 390px and 430px widths.

### Evidence honesty

- [ ] Found/ranked/used counts are visible.
- [ ] Used sources are correctly marked.
- [ ] Internal sources are visually distinct but not dominant.

### Visual system

- [ ] Accent usage is semantic.
- [ ] Dense reading surfaces are calm and readable.
- [ ] Empty states match populated states structurally.

## Final Recommendation

Treat this as a product-surface rebuild of the meeting-prep result view, not a styling pass.

The highest leverage sequence is:

1. Fix the snapshot contract.
2. Rebuild the timeline.
3. Normalize radar and competitor panels.
4. Redesign the sources ledger.
5. Make source accounting honest.
6. Apply semantic color polish.
7. Validate in the browser.

If the team starts by tweaking CSS alone, the page will still feel wrong because the underlying content contract is still wrong.