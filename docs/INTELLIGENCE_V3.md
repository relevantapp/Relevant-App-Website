# Intelligence V3 — Changelog

## What Changed

Intelligence is now a fully-streamed, multi-research-type engine with rich structured outputs, persistent storage, and public share links.

### Phase 1: Foundation

- **Contracts** (`src/lib/intelligence/contracts.ts`): Zod schemas for all 4 brief types — meeting prep, competitive analysis, business case, market research. `BriefBullet`, `BriefSource`, `BriefStatus`, `NormalizedEvidence`, and per-type synthesis schemas.
- **Pipeline** (`src/lib/intelligence/pipeline.ts`): `PipelineContext` with SSE emitter + abort signal. `runStep` wraps each pipeline stage with timing, SSE events, and error handling.
- **Models** (`src/lib/intelligence/models.ts`): Claude → Gemini 2.0 Flash → OpenRouter → Gemini 1.5 Flash cascade with Zod repair loop.
- **Ranker** (`src/lib/intelligence/ranker.ts`): `rankEvidence()` with recency/authority/match scoring, domain dedup, configurable weights.
- **Prompts** (`src/lib/intelligence/prompts/`): 4 versioned prompt files — `meeting-prep.v1.ts`, `competitive.v1.ts`, `business-case.v1.ts`, `market-research.v1.ts`.
- **Orchestrators** (`src/lib/intelligence/orchestrators/`): 4 orchestrators that compose search → rank → synthesize pipelines. All thread `PipelineContext` through every step.

### Phase 2: SSE + Enhanced Forms

- **SSE types** (`src/lib/intelligence/sse-types.ts`): Event types, `StreamState`, `streamReducer`, `INITIAL_STREAM_STATE`.
- **SSE emitter** (`src/lib/intelligence/sse-emitter.ts`): `createSSEEmitter()` → ReadableStream with proper encoding.
- **useIntelligenceStream** (`src/hooks/useIntelligenceStream.ts`): Client hook using `useReducer(streamReducer)`. EventSource parsing, abort support.
- **ActivityRail** (`src/app/app/intelligence/ActivityRail.tsx`): Timeline with animated step icons + discovery feed.
- **API route** (`src/app/api/intelligence/route.ts`): SSE via Accept header check + JSON fallback. Rate limiting, input sanitization.
- **Enhanced forms**: All 4 form components updated with new optional fields — relationship stage, pain points, decision audience, market segment, use case, etc.

### Phase 3: Output Redesign

- **CopyModePicker** (`results/shared/CopyModePicker.tsx`): 5 copy formats (founder/sales/memo/linkedin/slack) + export-to-image via html-to-image.
- **DegradedBanner** (`results/shared/DegradedBanner.tsx`): Unified partial-success banner with reasons list.
- **ResultsHero** updated: Optional toolbar props, inline ConfidenceBadge.
- **MeetingPrepPanels** extracted: BentoSection, SnapshotCard, PeopleCard.
- **IntelligenceResults** rewritten from 461→116 lines.
- **All 4 result components** restructured: CopyModePicker + exportRef + DegradedBanner.

### Phase 4: Persistence & Sharing

- **Migration** (`src/lib/intelligence/migration_intelligence_briefs.sql`): `intelligence_briefs` + `intelligence_chat_messages` tables with RLS.
- **DB layer** (`src/lib/intelligence/db.ts`): `saveBrief`, `listBriefs`, `getBrief`, `getBriefBySlug`, `toggleShare`.
- **Briefs API** (`src/app/api/intelligence/briefs/route.ts`): POST endpoint for save/list/share actions.
- **Share page** (`src/app/intelligence/share/[slug]/`): Server-rendered public page with OG metadata.
- **History page** (`src/app/app/intelligence/history/page.tsx`): Filterable, paginated list of past briefs with share toggles.
- **Auto-save**: Briefs are saved to DB on generation (fire-and-forget in streaming handler).

### Cross-Cutting

- **Unit tests**: 34 tests across 3 suites (ranker, contracts, stream-reducer). Vitest configured.
- **All files under 400 lines**.
- **Zero TODO/FIXME/XXX markers**.
- **tsc, lint, test, build all clean**.

## New Dependencies

- `html-to-image@1.11.13` — PNG export for CopyModePicker
- `vitest` (dev) — unit testing
- `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` (dev) — test support

## File Inventory

| Area | Files | Total Lines |
|------|-------|-------------|
| Contracts & schemas | 1 | ~200 |
| Pipeline & models | 3 | ~350 |
| Prompts | 4 | ~400 |
| Orchestrators | 4 | ~600 |
| SSE layer | 3 | ~250 |
| API routes | 2 | ~400 |
| Result components | 8 | ~900 |
| DB layer | 2 | ~150 |
| Pages | 3 | ~300 |
| Tests | 3 | ~300 |
| **Total** | **33** | **~3,850** |
