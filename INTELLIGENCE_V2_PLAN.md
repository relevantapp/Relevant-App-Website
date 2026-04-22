# Intelligence Core Engine — Upgrade Plan (V2, Final)

**Date:** 2026-04-21
**Scope:** Intelligence pipeline in `src/lib/intelligence` and `src/app/api/intelligence` + minimal UI data wiring. UI/visual direction stays intact.
**Goal:** Turn Relevant intelligence into a **role-aware relevance engine** that starts from the user's decision context, uses internal Relevant memory first, calls external providers only for gaps, and produces cited, decision-ready output that feels effortless.

This plan merges two drafts: an architecture-first plan grounded in the adjacent Relevant backend (internal corpus, living stories, entity dossier, observable run store) and an API-capability-first plan (specific Exa/Tavily parameter upgrades, new providers, tiered depth, streaming synthesis, request cache). Every phase below is a self-contained subagent workstream with explicit acceptance criteria.

---

## Bottom Line

The current intelligence system has a clean skeleton but behaves like a search-and-summarize pipeline. V2 behaves like a **research operator** that already understands the user's role, **remembers prior coverage** (living stories, prior briefs, entity dossier), knows which sources matter, fills evidence gaps deliberately with external providers, and **proves every material claim** via a post-synthesis citation verifier.

The three biggest wins, by impact:
1. **Internal corpus as the first retrieval hop** — Relevant already owns `pro_articles`, `pro_entity_research_index`, `signal_items`, `pro_signal_event_updates`, and the `pro-entity-dossier` service. Intelligence currently ignores them. Using them first is the unfair advantage that GPT/Perplexity cannot copy.
2. **Lane-based retrieval with source roles** — replace flat search tasks with lanes (internal_memory, primary, fresh_news, financial, people, customer_voice, counter_evidence, gap_fill). Each lane has budgets and quality targets.
3. **Claim verifier after synthesis** — separate pass that confirms every material claim cites a source that was actually in the evidence pack. Hallucinations and fabricated citations can no longer ship.

---

## 1. Current System Map

### 1.1 User Input
Files: [page.tsx](src/app/app/intelligence/page.tsx), [ResearchTypeSelector.tsx](src/app/app/intelligence/ResearchTypeSelector.tsx), [forms/*](src/app/app/intelligence/forms/), [ResearchConfirmation.tsx](src/app/app/intelligence/ResearchConfirmation.tsx).

Flow: pick mode → fill form → confirmation shows a *static* evidence plan → `useIntelligenceStream` POSTs to `/api/intelligence`.

**Gaps:** the confirmation's evidence plan is not the real server plan; only meeting prep has AI refine today; form intent is never converted to a durable research-intent packet.

### 1.2 API Entry
File: [route.ts](src/app/api/intelligence/route.ts).

Auth, rate limit, sanitize, load small user context, route to orchestrator, stream SSE.

**Gap:** only a thin user context is loaded; no dimensions, past briefs, chat history, entity dossier hits, or living story state is pulled — despite all of it being available in the adjacent Relevant backend.

### 1.3 Orchestration
Files: [orchestrators/meeting-prep.ts](src/lib/intelligence/orchestrators/meeting-prep.ts), [competitive-analysis.ts](src/lib/intelligence/orchestrators/competitive-analysis.ts), [business-case.ts](src/lib/intelligence/orchestrators/business-case.ts), [market-research.ts](src/lib/intelligence/orchestrators/market-research.ts).

Stages: resolveEntity → planSearches → executeSearches → normalize → rank → synthesize → assemble.

**Gap:** stages are linear. No loop that asks *"what's missing?"* or *"what changed since last time?"* No memory of prior runs.

### 1.4 Search Planning
File: [search-planner.ts](src/lib/intelligence/search-planner.ts).

An LLM plans up to 10 flat search tasks; deterministic fallback exists.

**Gap:** queries are provider-string-shaped, not research-question-shaped. No retrieval lanes, no source-role budget, no internal-memory lane, no counter-evidence lane, no gap-fill pass.

### 1.5 Provider Use
Files: [providers/exa.ts](src/lib/intelligence/providers/exa.ts), [providers/tavily.ts](src/lib/intelligence/providers/tavily.ts).

**Exa (underused):** only `exa.search()` is called. Missing: `useAutoprompt`, `livecrawl`, `contents.text`, `subpages` + `subpageTarget`, `outputSchema`, `includeText`/`excludeText`, `findSimilar`, `/answer`, `/research`, Monitors, Websets. Request timeouts exist but aren't clearly plumbed through the SDK call path. Snapshot results influencing synthesis are sometimes not converted into citable evidence.

**Tavily (underused):** only `/search` and a small `/extract`. Missing: `search_depth: 'fast'` for low-risk checks, `include_raw_content: 'markdown'` for high-value results, `extract_depth: 'advanced'`, `/map`, `/crawl`, `/research`, image descriptions, `start_date`/`end_date` precision. Tavily's advanced `answer` is requested but not carried into normalized evidence.

Capability references: Exa [search](https://exa.ai/docs/reference/search-api-guide-for-coding-agents) / [contents](https://exa.ai/docs/reference/contents-api-guide) / [answer](https://exa.ai/docs/reference/answer) / [monitors](https://exa.ai/docs/reference/monitors-api-guide-for-coding-agents); Tavily [search](https://docs.tavily.com/documentation/api-reference/endpoint/search) / [extract](https://docs.tavily.com/documentation/api-reference/endpoint/extract) / [crawl](https://docs.tavily.com/documentation/api-reference/endpoint/crawl) / [map](https://docs.tavily.com/documentation/api-reference/endpoint/map) / [research](https://docs.tavily.com/documentation/api-reference/endpoint/research).

### 1.6 Normalization and Ranking
Files: [normalize.ts](src/lib/intelligence/normalize.ts), [ranker.ts](src/lib/intelligence/ranker.ts).

URL dedupe by exact normalized URL; score by recency + authority + query-term overlap; **keeps one item per domain**; only **top 8** evidence items reach synthesis.

**Gaps:** top-8 is too narrow for serious research; one-per-domain dropping drops valid primary pages / filings / product pages; no story clustering; no source-role distinction; no durable evidence IDs; no claim map; the UI can show sources the LLM never saw.

### 1.7 LLM Synthesis
Files: [openrouter.ts](src/lib/intelligence/openrouter.ts), [prompts/*.ts](src/lib/intelligence/prompts/).

Uses `response_format: { type: 'json_object' }` (not strict `json_schema`), runs one repair attempt. Prompts are strong on "what happened / why it matters / what to do next."

**Gaps:** no strict JSON-schema mode; no provider `require_parameters` when strict support is needed; no separate citation verifier; no claim map; contradictions, unknowns, and "what changed since last time" are not explicitly surfaced. OpenRouter references: [structured outputs](https://openrouter.ai/docs/features/structured-outputs), [provider routing](https://openrouter.ai/docs/features/provider-routing), [reasoning tokens](https://openrouter.ai/docs/guides/best-practices/reasoning-tokens).

### 1.8 Persistence, History, Share, Chat
Files: [briefs/route.ts](src/app/api/intelligence/briefs/route.ts), [db.ts](src/lib/intelligence/db.ts), [chat/route.ts](src/app/api/intelligence/chat/route.ts), [history/page.tsx](src/app/app/intelligence/history/page.tsx), [ShareButton.tsx](src/app/app/intelligence/results/shared/ShareButton.tsx), [FollowUpChat.tsx](src/app/app/intelligence/results/shared/FollowUpChat.tsx).

Client auto-saves after generation; chat answers against saved synthesis + first 10 sources.

**Gaps (trust breaks):** generation is NOT server-saved (if client save fails, the brief is lost); history links `/app/intelligence?brief=...` are not handled by `page.tsx`; share URL `/share/intelligence/...` does not match the actual public route; chat loads oldest messages first when history exceeds the limit; chat cannot retrieve fresh or full evidence; the DB stores the final brief and source list but **not** the raw plan, provider requests, evidence items, clusters, claim map, verifier result, or LLM usage.

### 1.9 Adjacent System: Internal Source-Platform Corpus (the moat)
Location: `/Users/akshitsama/Desktop/Relevant` (confirmed).

Existing assets to leverage from the Website app:
- `pro_sources`, `pro_source_endpoints`, `pro_source_supply_plan`, `pro_source_poll_events` — source-platform intake.
- `pro_articles` — parsed articles with provenance (source id, endpoint id, supply lane).
- `pro_entity_research_index` + RPC `search_entity_dossier_evidence` — entity-level retrieval.
- `signal_items` — role-aware living stories with source count, update count, delta summary, accumulated sources, source extracts.
- `pro_signal_event_updates` — evolving story updates.
- `pro-entity-dossier` service — already does internal-first retrieval with live-search fallback, timeline grouping, dossier synthesis, usage logging, caching.

Intelligence today never calls any of this.

---

## 2. Target Architecture

New and changed modules, all under `src/lib/intelligence/`:

```
src/lib/intelligence/
├── context/
│   ├── intent-packet.ts         # NEW — ResearchIntentPacket builder
│   └── user-lens.ts             # NEW — UserLens builder (role, past mentions, signals)
├── memory/
│   ├── prior-mentions.ts        # NEW — "we've seen this before" summary
│   ├── entities.ts              # NEW — canonical entity cache (7d companies, 30d people)
│   └── delta.ts                 # NEW — what changed since last brief
├── providers/
│   ├── internal-corpus.ts       # NEW — first-class provider over Relevant backend
│   ├── exa.ts                   # EXTEND — full capability, lane-aware options
│   ├── tavily.ts                # EXTEND — search/extract/map/crawl/research wrappers
│   ├── perplexity.ts            # NEW (Phase 9) — grounded one-liners
│   ├── proxycurl.ts             # NEW (Phase 9) — verified LinkedIn people
│   ├── reddit.ts                # NEW (Phase 9) — customer voice
│   └── youtube.ts               # NEW (Phase 9) — transcripts (deep tier only)
├── planner/
│   ├── plan.ts                  # NEW — initial lane plan
│   ├── fallbacks.ts             # NEW — deterministic lane fallbacks per mode
│   ├── adapt.ts                 # NEW — bounded re-plan on surprise / thin evidence
│   └── prompts.ts               # NEW — planner system prompts
├── retrieval/
│   └── controller.ts            # NEW — executes lanes, coverage scoring, gap-fill
├── evidence/
│   ├── canonicalize.ts          # NEW — canonical URL + content fingerprint dedupe
│   ├── cluster.ts               # NEW — story/event clustering
│   ├── score.ts                 # NEW — multi-role scoring (authority, freshness, relevance, independence, primary)
│   ├── pack.ts                  # NEW — build EvidencePack with lanes, clusters, contradictions, unknowns
│   └── validate.ts              # NEW — evidence pack invariants + token budget
├── verifier/
│   ├── claim-map.ts             # NEW — extract material claims + their citations
│   ├── citation-check.ts        # NEW — confirm every cited sourceId exists in ledger
│   └── repair.ts                # NEW — one repair pass on failed verification
├── synthesis/
│   ├── compose.ts               # NEW — orchestrates section-parallel streaming synthesis
│   └── sections.ts              # NEW — per-section Zod schemas
├── cache/
│   ├── kv.ts                    # NEW — Supabase/Redis KV
│   └── fingerprint.ts           # NEW — stable request hash
├── runs/
│   └── store.ts                 # NEW — persist full run (plan, evidence, claim map, usage, status)
└── (existing files extended)
```

### Core contracts (new)

```ts
// Research intent
type ResearchIntentPacket = {
  runId: string;
  researchType: 'meeting_prep' | 'competitive' | 'business_case' | 'market';
  user: { id: string; role: string|null; industry: string|null; company: string|null; country: string|null; seniority?: string|null; function?: string|null };
  decision: {
    statedGoal: string;
    impliedDecision: string;
    timeHorizon: 'today'|'week'|'quarter'|'year'|'strategic';
    audience: string[];
    desiredOutput: string[];
  };
  entities: { primary: EntityRef[]; competitors: EntityRef[]; people: EntityRef[]; marketTerms: string[] };
  constraints: { steering: string|null; mustInclude: string[]; mustAvoid: string[]; geography: string[] };
  qualityTargets: {
    minPrimarySources: number;
    minIndependentSources: number;
    minCounterEvidence: number;
    freshnessRequired: boolean;
    internalMemoryRequired: boolean;
  };
  depth: 'fast' | 'standard' | 'deep';   // added from tiered-depth
};

// User lens
type UserLens = {
  roleFrame: string;
  likelyConcerns: string[];
  companyContext: string | null;
  industryFrame: string | null;
  pastMentions: Array<{ topic:string; entity:string; count:number; lastSeenAt:string; lastTakeaway:string }>;
  recentRelevantSignals: Array<{ signalId:string; title:string; deltaSummary:string|null; sourceCount:number; updatedAt:string }>;
};

// Prior memory summary
type PriorMemorySummary = {
  hasPriorCoverage: boolean;
  totalMentions: number;
  lastMentionedAt: string | null;
  lastKnownTakeaway: string | null;
  changedSinceThen: string[];
  recurringThemes: string[];
  staleAssumptions: string[];
};

// Plan
type ResearchPlanV2 = {
  planId: string;
  intentSummary: string;
  lanes: ResearchLane[];
  expectedSourceMix: { internal: number; primary: number; freshWeb: number; semanticWeb: number; counterEvidence: number };
  stopRules: { enoughEvidenceScore: number; maxExternalSearches: number; maxProviderMs: number };
};
type ResearchLane = {
  id: string;
  purpose: string;
  providerPreference: Array<'internal'|'exa'|'tavily'|'perplexity'|'proxycurl'|'reddit'|'youtube'>;
  sourceRole: 'internal_memory'|'primary'|'fresh_news'|'financial'|'people'|'customer_voice'|'market_data'|'counter_evidence'|'gap_fill';
  questions: string[];
  queryTemplates: string[];
  freshnessDays?: number;
  required: boolean;
  budget: { maxQueries: number; maxResults: number; maxContentChars: number };
};

// Evidence
type SourceRole = ResearchLane['sourceRole'];
type EvidenceItem = {
  id: string;
  sourceId: string;
  provider: 'internal'|'exa'|'tavily'|'perplexity'|'proxycurl'|'reddit'|'youtube';
  laneId: string;
  sourceRole: SourceRole;
  title: string;
  url: string | null;
  domain: string | null;
  publishedAt: string | null;
  capturedAt: string;
  excerpt: string;
  facts: string[];
  entities: string[];
  topicKeys: string[];
  quality: { authority:number; freshness:number; relevance:number; independence:number; primarySource:boolean };
  clusterId?: string;
};

// Pack
type EvidencePack = {
  run: { runId:string; researchType:string; generatedAt:string };
  intent: ResearchIntentPacket;
  userLens: UserLens;
  priorMemory: PriorMemorySummary;
  planSummary: { lanesRun:string[]; lanesSkipped:string[]; knownGaps:string[] };
  sourceLedger: Array<{ sourceId:string; role:SourceRole; title:string; domain:string|null; url:string|null; provider:string; qualityLabel:'primary'|'strong'|'useful'|'weak' }>;
  evidence: EvidenceItem[];
  clusters: Array<{ clusterId:string; label:string; whatChanged:string; evidenceIds:string[] }>;
  contradictions: Array<{ issue:string; evidenceIds:string[] }>;
  unknowns: Array<{ question:string; reasonMissing:string }>;
};
```

### Database additions (one migration, `intelligence_v2_runs.sql`)

```sql
CREATE TABLE intelligence_runs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  research_type TEXT NOT NULL,
  depth TEXT NOT NULL,
  intent_packet JSONB NOT NULL,
  user_lens JSONB,
  plan JSONB,
  plan_version TEXT,
  evidence_pack JSONB,         -- redacted/size-limited
  claim_map JSONB,
  verifier_result JSONB,
  model TEXT, provider TEXT, prompt_tokens INT, completion_tokens INT,
  timings JSONB,               -- per-stage, per-provider
  status TEXT NOT NULL,        -- ok | degraded | failed
  degraded_reasons TEXT[],
  brief_id UUID REFERENCES intelligence_briefs(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ON intelligence_runs (user_id, created_at DESC);

CREATE TABLE intelligence_retrieval_tasks (
  id UUID PRIMARY KEY,
  run_id UUID REFERENCES intelligence_runs(id) ON DELETE CASCADE,
  lane_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  request JSONB NOT NULL,
  response_summary JSONB,
  result_count INT, latency_ms INT,
  error TEXT
);
CREATE TABLE intelligence_evidence_items (
  id UUID PRIMARY KEY,
  run_id UUID REFERENCES intelligence_runs(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL,
  payload JSONB NOT NULL
);
CREATE TABLE intelligence_evidence_clusters (
  id UUID PRIMARY KEY,
  run_id UUID REFERENCES intelligence_runs(id) ON DELETE CASCADE,
  label TEXT, what_changed TEXT, evidence_ids TEXT[]
);
CREATE TABLE intelligence_claims (
  id UUID PRIMARY KEY,
  run_id UUID REFERENCES intelligence_runs(id) ON DELETE CASCADE,
  claim TEXT NOT NULL,
  supported BOOLEAN NOT NULL,
  source_ids TEXT[]
);
CREATE TABLE intelligence_provider_events (
  id UUID PRIMARY KEY,
  run_id UUID REFERENCES intelligence_runs(id) ON DELETE CASCADE,
  provider TEXT, kind TEXT, at TIMESTAMPTZ DEFAULT now(), details JSONB
);

-- entity cache
CREATE TABLE intelligence_entities (
  id UUID PRIMARY KEY,
  kind TEXT NOT NULL,                -- 'company' | 'person'
  canonical_name TEXT NOT NULL,
  canonical_url TEXT,
  snapshot JSONB NOT NULL,
  sources JSONB,
  refreshed_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE (kind, canonical_name)
);

-- request-level cache (Phase 8)
CREATE TABLE intelligence_cache (
  fingerprint TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  research_type TEXT NOT NULL,
  depth TEXT NOT NULL,
  brief JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### New env vars
```
OPENAI_API_KEY          # embeddings for optional internal-corpus augment + fact clustering
PERPLEXITY_API_KEY      # Phase 9, optional
PROXYCURL_API_KEY       # Phase 9, optional (or Apollo / Clay — see §Risks)
REDDIT_API_KEY          # Phase 9, optional
INNGEST_SIGNING_KEY     # Phase 8, for deep-tier background runs
```

### Feature flags (all off by default)
```
INTELLIGENCE_ENGINE_V2_ENABLED
INTELLIGENCE_INTERNAL_CORPUS_ENABLED
INTELLIGENCE_PLANNER_V2_ENABLED
INTELLIGENCE_EVIDENCE_PACK_ENABLED
INTELLIGENCE_VERIFIER_ENABLED
INTELLIGENCE_PROVIDER_DEEP_SEARCH_ENABLED
INTELLIGENCE_TAVILY_CRAWL_ENABLED
INTELLIGENCE_STREAMING_SECTIONS_ENABLED
INTELLIGENCE_DEPTH_TIERS_ENABLED
INTELLIGENCE_NEW_PROVIDERS_ENABLED
```

---

## 3. Phased Roadmap

Phases are ordered by dependency. Agents A–I own them. Every phase: **Goal → Files → Steps → Acceptance Criteria → Tests → Agent Prompt**.

Minimum "will it sell" slice: **Phase 0 + 1 + 2 + 3 + 4 + 5 + 6**. Phase 7–11 follow.

---

### Phase 0 — Trust Repairs (Agent A)

**Goal:** Remove visible brokenness before building deeper. Nothing else matters if basics are untrusted.

**Files:**
- [src/app/app/intelligence/page.tsx](src/app/app/intelligence/page.tsx)
- [src/app/app/intelligence/history/page.tsx](src/app/app/intelligence/history/page.tsx)
- [src/app/app/intelligence/results/shared/ShareButton.tsx](src/app/app/intelligence/results/shared/ShareButton.tsx)
- [src/app/api/intelligence/chat/route.ts](src/app/api/intelligence/chat/route.ts)
- [src/app/api/intelligence/route.ts](src/app/api/intelligence/route.ts)
- [src/app/api/intelligence/briefs/route.ts](src/app/api/intelligence/briefs/route.ts)
- [src/lib/intelligence/db.ts](src/lib/intelligence/db.ts)
- Any share route (confirm actual path — grep for `/share/`).

**Steps:**
1. **Server-side durable save.** At the end of the orchestrator pipeline, before streaming `brief_ready`, write the brief to `intelligence_briefs` server-side. Return a `briefId` to the client. Remove reliance on client auto-save.
2. **History → brief deep-link.** `page.tsx` reads `searchParams.brief`; if present, fetch that saved brief and render immediately (skip form). Add redirect from stale URL formats.
3. **Share URL fix.** Locate the actual share route in the app; update `ShareButton` to produce that exact URL. Add a Playwright/browser smoke test.
4. **Chat ordering.** In `chat/route.ts`, select `ORDER BY created_at DESC LIMIT N` then reverse in memory before rendering. Verify with ≥ 15 messages.
5. **Timing labels.** In orchestrators, separate and record: `internalMs`, `exaMs`, `tavilyMs`, `plannerMs`, `synthesisMs`, `verifierMs`, `totalMs`. Update `BriefStatus` schema. Remove any label collision.
6. **Snapshot evidence normalization.** Any `CompanySnapshot` or attendee snapshot that contributes to synthesis must be converted to a `BriefSource` with a stable sourceId, added to the source ledger, and visible in the UI.

**Acceptance criteria:**
- [ ] Refreshing the intelligence page after a brief completes still shows that brief (server-saved).
- [ ] `/app/intelligence?brief={id}` opens the saved brief directly.
- [ ] Clicking Share copies a URL that opens a public page rendering the brief.
- [ ] Chat with > 10 prior messages shows the most recent, not the oldest, in the correct order.
- [ ] `BriefStatus` has discrete timing fields for internal/exa/tavily/planner/synthesis/verifier.
- [ ] Every source that influenced synthesis is present in `brief.sources` (no hidden snapshots).

**Tests:** component test for page brief-param hydration; route tests for chat ordering; snapshot test for BriefStatus shape.

**Agent prompt:**
```
Implement Phase 0 (Trust Repairs) of INTELLIGENCE_V2_PLAN.md. Do not change
synthesis or retrieval logic — only the six repair items. Before starting,
grep the repo for the real share route path and report it back. Add a
regression test per repair and ensure npm test passes.
```

---

### Phase 1 — Run Store & Observability (Agent A)

**Goal:** Every run is durable, inspectable, and replayable without re-running providers.

**Files:**
- NEW migration `supabase/migrations/YYYYMMDDHHMMSS_intelligence_v2_runs.sql` (schema in §2).
- NEW [src/lib/intelligence/runs/store.ts](src/lib/intelligence/runs/store.ts).
- Every orchestrator: after assemble, call `saveRun(...)`.
- [src/app/api/intelligence/route.ts](src/app/api/intelligence/route.ts) — create `run_id` up front; thread into orchestrators.

**Steps:**
1. Apply migration.
2. `runs/store.ts`: `createRun(initial) → runId`, `patchRun(runId, fields)`, `recordRetrievalTask(...)`, `recordEvidence(...)`, `recordClusters(...)`, `recordClaimMap(...)`, `recordProviderEvent(...)`.
3. Orchestrators call the patch helpers at every stage transition. Keep saves non-blocking (fire-and-forget with error log) so they don't add latency.
4. Size-limit JSON blobs: evidence_pack max 256 KB, raw content excluded; link to `intelligence_evidence_items` row for full text.
5. Redact raw HTML / full article bodies before writing.

**Acceptance criteria:**
- [ ] Every POST `/api/intelligence` creates a row in `intelligence_runs` even on failure.
- [ ] Failed runs keep enough metadata to debug: plan, provider events, last stage completed, error class.
- [ ] A run's retrieval tasks + evidence items + claim map can be reconstructed into the EvidencePack deterministically.
- [ ] No PII leak: raw article bodies are not stored in `intelligence_runs.evidence_pack`.
- [ ] Existing brief save/list behavior continues unchanged.

**Agent prompt:**
```
Implement Phase 1 (Run Store & Observability) of INTELLIGENCE_V2_PLAN.md.
Write the migration, the runs/store.ts module, and non-blocking save
calls in every orchestrator. Do not change pipeline behavior. Tests
required.
```

---

### Phase 2 — Internal Corpus Provider (Agent B)

**Goal:** Make Relevant's backend the first retrieval hop. Every brief starts from what we already know.

**Files:**
- NEW [src/lib/intelligence/providers/internal-corpus.ts](src/lib/intelligence/providers/internal-corpus.ts)
- [src/lib/intelligence/normalize.ts](src/lib/intelligence/normalize.ts) — handle `provider: 'internal'` rows
- [src/lib/intelligence/contracts.ts](src/lib/intelligence/contracts.ts) — add `provider: 'internal'` + internal source-platform provenance fields
- [src/lib/intelligence/db.ts](src/lib/intelligence/db.ts) — Supabase RPC wrappers

**Steps:**
1. **Confirm the Supabase project** the Website app uses matches the one hosting `pro_articles`, `pro_entity_research_index`, `signal_items`, `pro_signal_event_updates`. If they are separate projects, wire a second Supabase client with server-only credentials.
2. Implement provider methods:
   - `searchArticles({ queries, entities, freshnessDays, limit })` → `EvidenceItem[]` from `pro_articles` joined with `pro_source_endpoints` / `pro_sources` for provenance.
   - `searchLivingSignals({ entities, topicKeys, userId })` → from `signal_items` (role-aware) + `pro_signal_event_updates` for delta.
   - `searchEntityDossier({ entity })` → call `search_entity_dossier_evidence` RPC.
   - `searchPriorBriefs({ userId, entity, researchType, since })` → from `intelligence_briefs` + `intelligence_chat_messages`.
3. Normalize every result into `EvidenceItem` with `provider: 'internal'`, stable `sourceId` = `internal:{table}:{row_id}`, preserved source-platform provenance in `payload`.
4. Implement **every** public method with a graceful-degradation path: if the underlying table/RPC is missing or errors, return `[]` and emit a `provider_event` of kind `degraded_internal`.
5. Add timeouts (internal queries capped at 2 s total per lane).

**Acceptance criteria:**
- [ ] Given an entity with existing `signal_items` coverage, `searchLivingSignals` returns ≥ 1 item with non-null `deltaSummary`.
- [ ] Given an entity with no prior coverage, all methods return `[]` without errors.
- [ ] An integration test can drive a meeting-prep run to synthesis using ONLY internal evidence (external providers mocked out), proving the internal path is fully wired.
- [ ] Internal provenance (source_id, endpoint_id, supply lane) is visible in the saved EvidencePack.
- [ ] RLS is respected — one user cannot read another user's briefs via prior-brief retrieval.

**Tests:**
- Unit: each method against a seeded fixture Supabase schema (use `supabase-local` or mocked client).
- Integration: end-to-end run with external providers nocked and only internal data present; brief must still produce with ≥ 3 sources.

**Agent prompt:**
```
Implement Phase 2 (Internal Corpus Provider) of INTELLIGENCE_V2_PLAN.md.
Before writing code: confirm which Supabase project hosts pro_articles,
pro_entity_research_index, signal_items, pro_signal_event_updates. If
separate from the Website Supabase, wire a second server-only client.
Implement all four methods with graceful degradation and full evidence
normalization. Tests required including one integration test that proves
internal-only synthesis works.
```

---

### Phase 3 — Intent Packet + User Lens + Planner V2 (Agent C)

**Goal:** Replace one-shot flat search plans with lane-based plans driven by an explicit intent packet and user lens.

**Files:**
- NEW [src/lib/intelligence/context/intent-packet.ts](src/lib/intelligence/context/intent-packet.ts)
- NEW [src/lib/intelligence/context/user-lens.ts](src/lib/intelligence/context/user-lens.ts)
- NEW [src/lib/intelligence/planner/plan.ts](src/lib/intelligence/planner/plan.ts), [fallbacks.ts](src/lib/intelligence/planner/fallbacks.ts), [prompts.ts](src/lib/intelligence/planner/prompts.ts)
- NEW [src/lib/intelligence/retrieval/controller.ts](src/lib/intelligence/retrieval/controller.ts)
- Every orchestrator: replace `resolveEntity + planSearches + gatherEvidence` with `buildIntent → buildUserLens → planLanes → runRetrieval`. Keep behind `INTELLIGENCE_PLANNER_V2_ENABLED`.

**Steps:**
1. **Intent packet builder** — deterministic for given input + user profile. No LLM needed (keeps things fast and auditable).
2. **User lens builder** — pulls past mentions from `prior-mentions.ts` (Phase 7 — stub returns empty for Phase 3), recent `signal_items`, user profile. Token-budgeted (≤ 600 tokens).
3. **Planner V2 LLM prompt** — system prompt outlines lanes, source roles, budgets, stop rules. User prompt = intent packet + user lens + adjacent-provider capabilities.
4. **Fallback planner** — deterministic lanes per research type so planning cannot fail:
   - All types: `internal_memory` lane (required), `fresh_news` lane.
   - meeting_prep: + `primary` (company site), `people` (attendees), `counter_evidence`.
   - competitive: + `primary` (competitor sites), `counter_evidence`, `customer_voice`.
   - business_case: + `primary`/`financial`, `counter_evidence`, `market_data`, `customer_voice`.
   - market_research: + `market_data`, `primary` (known players), `counter_evidence`.
5. **Retrieval controller** — executes lanes in order: internal → score coverage → external (Exa + Tavily in parallel) → score → gap-fill pass if coverage < threshold → up to **1 adaptive re-plan** if evidence still weak AND time budget remains.
6. Coverage scoring returns `{enoughToSynthesize, missingQuestions, weakSourceRoles, needsFreshness, needsCounterEvidence}`.
7. Budget guard: total retrieval wall-clock ≤ 45 s (standard) / 15 s (fast) / 180 s (deep).

**Acceptance criteria:**
- [ ] All four research types produce a valid `ResearchPlanV2` with required lanes present.
- [ ] Fallback plan is valid JSON without the LLM planner.
- [ ] If internal evidence covers ≥ 70% of lane questions, external search budget for that lane drops by ≥ 50%.
- [ ] Adaptive round fires only when coverage < threshold AND time budget remains. Hard cap: 1 adaptive round.
- [ ] Plan is persisted to `intelligence_runs.plan`.
- [ ] Old planner still works behind the old flag for one full rollout cycle.

**Tests:** lane-requirement test per research type; adaptive-skip test when coverage is strong; adaptive-fire test when thin.

**Agent prompt:**
```
Implement Phase 3 (Intent Packet + User Lens + Planner V2) of
INTELLIGENCE_V2_PLAN.md. Build intent-packet, user-lens, planner, fallback,
controller. Wire behind INTELLIGENCE_PLANNER_V2_ENABLED; leave V1 callable.
Tests required for lane requirements and adaptive-loop gating.
```

---

### Phase 4 — Provider Capability Upgrade (Agent D)

**Goal:** Use Exa / Tavily / OpenRouter deliberately by lane, not uniformly per request. Close specific known capability gaps.

**Files:**
- [src/lib/intelligence/providers/exa.ts](src/lib/intelligence/providers/exa.ts)
- [src/lib/intelligence/providers/tavily.ts](src/lib/intelligence/providers/tavily.ts)
- [src/lib/intelligence/openrouter.ts](src/lib/intelligence/openrouter.ts)
- [src/lib/intelligence/model-selection.ts](src/lib/intelligence/model-selection.ts)
- Planner schema (new optional fields).

**Steps — Exa (lane-aware):**
1. `searchExaQuery` / `searchExaNews`: pass `useAutoprompt: true` by default; for news pass `type:'neural'`, `category:'news'`, explicit `endPublishedDate` and `startPublishedDate`, and `livecrawl:'preferred'`. Allow `includeText` / `excludeText` from the planner.
2. `searchExaSnapshot`: request `contents.text: { maxCharacters: 4000 }`, `contents.subpages: 3`, `subpageTarget: ['about','pricing','customers','team']`, and `outputSchema` returning typed fields (name, hqCity, hqCountry, foundedYear, employeeRange, ceoName, lastFundingRound, lastFundingAmount, lastFundingDate). Plumb the structured result into `CompanySnapshot` — stop parsing prose.
3. Add `exaFindSimilar(url, { numResults, excludeDomains:[selfDomain] })` for the competitor lane.
4. Add optional `exaAnswer(question, { includeText })` for very specific verification questions in the verifier loop (Phase 6).
5. Add `exaResearch(request)` for Deep tier (Phase 8) — replaces the snapshot+news fan-out.
6. Enforce real request timeouts (AbortController in fetch, not SDK-default).
7. **Not every feature on every call** — capability by lane, per the planner.

**Steps — Tavily (lane-aware):**
1. `tavilySearch`: expose `search_depth: 'fast' | 'advanced'`, `chunks_per_source: up to 5`, `start_date`/`end_date` precise filters, `include_raw_content: 'markdown'` (only for top 1–2 results per lane), `include_images` controlled by lane.
2. Capture `answer` from Tavily advanced response into an `EvidenceItem` with `provider:'tavily'`, `sourceRole:'gap_fill'`, `qualityLabel:'useful'`, clearly labeled as provider synthesis (not primary).
3. Add `tavilyExtract(urls, { extract_depth:'advanced', format:'markdown', include_images })`; drop the 5000-char truncation; cap at 20 k chars per URL post-call.
4. Add `tavilyMap(url, { instructions? })` to enumerate company site paths cheaply.
5. Add `tavilyCrawl(url, { instructions, maxDepth, maxBreadth, extract_depth:'advanced' })` for first-party deep research. Budget-gated.
6. Add `tavilyResearch(request)` for Deep tier (Phase 8). Long-running, tolerate higher latency.

**Steps — OpenRouter:**
1. Switch synthesis to `response_format: { type:'json_schema', json_schema: {...} }` when the selected model supports it (check catalog's `supported_parameters`).
2. Set provider `require_parameters: true` for strict mode.
3. Intentional fallback chain: strict-schema model → json_object model → repair model. Log which rung was used in `intelligence_runs`.
4. Keep `reasoning: { effort:'medium', exclude:true }` on models that support it.
5. Record `model`, `provider`, `prompt_tokens`, `completion_tokens`, `latency_ms`, `fallback_reason` per call.

**Acceptance criteria:**
- [ ] Exa snapshot on Stripe returns structured `{ceoName:'Patrick Collison', ...}` from `outputSchema`; no LLM parse required.
- [ ] News lane returns ≥ 1 article published within the last 24 h on a company with recent news; `livecrawl` is set.
- [ ] `exaFindSimilar('https://stripe.com')` returns ≥ 5 real peer companies; zero blog-post / SEO noise.
- [ ] Tavily `extract` on a blog URL returns ≥ 2× character count vs. pre-change baseline.
- [ ] `tavilyCrawl` is behind `INTELLIGENCE_TAVILY_CRAWL_ENABLED` and respects lane budget; a meeting-prep run on a known SaaS company replaces serial `/extract` with a single crawl.
- [ ] Tavily's `answer` appears in the evidence pack as a distinct `sourceRole:'gap_fill'` item, not as a primary source.
- [ ] OpenRouter strict JSON-schema mode works end-to-end; when model doesn't support strict, system falls back to json_object and still validates via Zod.
- [ ] `model`, `provider`, token counts, and fallback reason are saved to `intelligence_runs`.
- [ ] Exa timeout is actually enforced (kill a slow mocked fetch → request aborts at timeout).

**Tests:** provider adapters with msw/nock; per-lane option-sanitization tests; OpenRouter strict-schema payload snapshot.

**Agent prompt:**
```
Implement Phase 4 (Provider Capability Upgrade) of INTELLIGENCE_V2_PLAN.md.
Extend Exa + Tavily adapters with lane-aware options (details listed in the
Steps). Add findSimilar, answer, research, map, crawl, advanced extract.
Add OpenRouter strict JSON-schema path with graceful fallback. Keep feature
flags for crawl and deep search. Provider tests must not require live keys.
```

---

### Phase 5 — Evidence Graph & Pack (Agent E)

**Goal:** Stop losing important evidence before synthesis. Cluster. Allow multi-page per domain when roles differ.

**Files:**
- NEW [src/lib/intelligence/evidence/canonicalize.ts](src/lib/intelligence/evidence/canonicalize.ts), [cluster.ts](src/lib/intelligence/evidence/cluster.ts), [score.ts](src/lib/intelligence/evidence/score.ts), [pack.ts](src/lib/intelligence/evidence/pack.ts), [validate.ts](src/lib/intelligence/evidence/validate.ts)
- [src/lib/intelligence/ranker.ts](src/lib/intelligence/ranker.ts) — delegates to evidence/score.ts; no longer hard-drops one-per-domain.
- [src/lib/intelligence/normalize.ts](src/lib/intelligence/normalize.ts) — outputs new `EvidenceItem` shape.

**Steps:**
1. **Canonicalize URLs:** strip `utm_*`, `fbclid`, `ref`, trailing slashes; lowercase host; collapse `amp.` and `m.` subdomains.
2. **Content fingerprint:** sha256 of first 2 k chars after whitespace normalize. Dedupe on identical fingerprint across domains (catches syndication).
3. **Clustering:** group by (entity + event + 3-day window). Use heuristic first (shared named entities + fuzzy title similarity). Optional embedding augmentation behind `INTELLIGENCE_EMBEDDING_CLUSTER_ENABLED` (OpenAI text-embedding-3-small, cosine ≥ 0.82).
4. **Multi-role preservation:** when items from the same domain have different `sourceRole`s (e.g., `primary` home page vs `primary` pricing vs `fresh_news` press release), keep them all.
5. **Scoring dimensions:**
   - `authority` (existing domain list, adjusted)
   - `freshness` (date or capture)
   - `relevance` (query-term overlap + entity match + lane question match)
   - `independence` (distinct of parent domain family)
   - `primarySource` boolean (company.com, SEC, gov, direct-quote from exec)
6. **Evidence pack budgeting:** target 20–40 items, soft token cap 12 k tokens (per lane minimums respected). Deterministic truncation by (role priority, cluster dedup, score).
7. **Contradictions + unknowns:** detect conflicting dated facts within the same cluster (headcount, funding round, CEO, product launch date); surface as `contradictions[]`. Mark lane questions with no covering evidence as `unknowns[]`.
8. **Invariants:** every claim-worthy brief assertion must cite a `sourceId` present in `sourceLedger`; enforced by `validate.ts`.

**Acceptance criteria:**
- [ ] Feeding 3 near-duplicate press releases about one funding round → 1 cluster, `evidenceIds.length === 3`.
- [ ] Two `pro_articles` rows from different domains with conflicting headcount → 1 `contradictions[]` entry.
- [ ] Meeting prep on a SaaS company allows 3 items from `stripe.com` if roles are `primary-home`, `primary-pricing`, `primary-customers`.
- [ ] Evidence pack builds a `sourceLedger` where every `sourceId` in `evidence[]` is listed exactly once.
- [ ] Token-budget truncation is deterministic for the same input (same run → same pack).
- [ ] No item from outside the retrieved set can appear in the pack.

**Tests:** canonicalize/fingerprint edge cases; cluster with 3 syndicated stories; contradiction fixture; truncation determinism.

**Agent prompt:**
```
Implement Phase 5 (Evidence Graph & Pack) of INTELLIGENCE_V2_PLAN.md. Build
canonicalize, cluster, score, pack, validate. Replace the top-8 one-per-
domain ranker with the new pipeline (preserve one-per-domain only for
pure duplicates; multi-role same-domain items are kept). Add contradictions
and unknowns. Tests required for clustering, contradictions, truncation.
```

---

### Phase 6 — Synthesis with Strict Schema + Streaming Sections + Claim Verifier (Agent F)

**Goal:** Decision-grade briefs with verified citations, rendered progressively.

**Files:**
- [src/lib/intelligence/prompts/*.ts](src/lib/intelligence/prompts/) — rewrite to consume `EvidencePack`
- NEW [src/lib/intelligence/synthesis/compose.ts](src/lib/intelligence/synthesis/compose.ts), [sections.ts](src/lib/intelligence/synthesis/sections.ts)
- NEW [src/lib/intelligence/verifier/claim-map.ts](src/lib/intelligence/verifier/claim-map.ts), [citation-check.ts](src/lib/intelligence/verifier/citation-check.ts), [repair.ts](src/lib/intelligence/verifier/repair.ts)
- [src/lib/intelligence/openrouter.ts](src/lib/intelligence/openrouter.ts) — streaming support
- [src/lib/intelligence/sse-emitter.ts](src/lib/intelligence/sse-emitter.ts), [sse-types.ts](src/lib/intelligence/sse-types.ts) — new events
- [src/hooks/useIntelligenceStream.ts](src/hooks/useIntelligenceStream.ts) — new reducer cases

**Steps:**
1. **Prompts consume EvidencePack only.** Rewrite each prompt to receive `sourceLedger`, `evidence`, `clusters`, `contradictions`, `unknowns`, `userLens`, `priorMemory`. Forbid the LLM from citing `sourceId`s not in the ledger.
2. **Per-section schemas.** Split each research-type brief into 6–8 sections with independent Zod schemas (example for meeting_prep: `overview` [headline+bottomLine+confidence+whyItMatters], `snapshot`, `newSinceLastTime`, `timeline`, `radarMetrics`, `talkingPoints`, `landmines`, `questionsToAsk`, `competitorContext`).
3. **Streaming section synthesis** (behind `INTELLIGENCE_STREAMING_SECTIONS_ENABLED`). Fan out section calls in parallel; stream deltas via SSE events `section_start`, `section_delta`, `section_done`. The full-schema validation runs once at the end as a sanity pass.
4. **Claim map** — after final assembly, run a cheap-model extractor that returns `{ claim, sourceIds[], category }[]` over the brief text.
5. **Citation check** — for each claim, verify: (a) every `sourceId` exists in ledger, (b) content at those sources actually supports the claim (lightweight LLM check against excerpt + full text if available). Flag unsupported, unreferenced, or hallucinated citations.
6. **Repair pass** — single retry that feeds the flagged claims back with "rewrite these specific sentences using only supported sources; if unsupported, drop or mark as uncertain." On second failure, mark `status.degraded = true`, `reasons:['verifier_failed']`, keep the repaired brief.
7. **UI hooks** — briefs render section-by-section as they arrive. Verification badge (verified / partial / degraded) shows next to each claim when available.

**Acceptance criteria:**
- [ ] First visible section (headline) appears within 3 s of synthesis start on a warm run.
- [ ] Section schemas validate independently; a broken section does not kill the brief.
- [ ] Claim verifier catches a seeded hallucinated citation in a fixture and triggers repair.
- [ ] Post-repair briefs cite only `sourceId`s in the ledger; unsupported claims are removed or marked uncertain.
- [ ] No source shown as "used in answer" in the UI is absent from the claim map.
- [ ] Briefs continue to follow the "what happened / why it matters for this user / what to do next" structure.

**Tests:** per-section schema; streaming partial delivery; hallucinated-citation fixture; unsupported-metric fixture; repair-success and repair-fail branches.

**Agent prompt:**
```
Implement Phase 6 (Synthesis + Streaming Sections + Claim Verifier) of
INTELLIGENCE_V2_PLAN.md. Rewrite prompts to consume EvidencePack only.
Split each schema into independent sections. Add streaming section synthesis
behind INTELLIGENCE_STREAMING_SECTIONS_ENABLED. Add claim-map extractor,
citation check, single repair pass, and degraded marking. Update SSE events
and the stream reducer. Result components must render progressively. Tests
for hallucinated-citation repair and streaming partial render.
```

---

### Phase 7 — Prior Memory + Follow-up Chat (Agent G)

**Goal:** Make Relevant feel like it remembers. Follow-ups pull fresh evidence when needed.

**Files:**
- NEW [src/lib/intelligence/memory/prior-mentions.ts](src/lib/intelligence/memory/prior-mentions.ts), [entities.ts](src/lib/intelligence/memory/entities.ts), [delta.ts](src/lib/intelligence/memory/delta.ts)
- [src/app/api/intelligence/chat/route.ts](src/app/api/intelligence/chat/route.ts)
- [src/app/api/intelligence/route.ts](src/app/api/intelligence/route.ts) — pre-flight `/history-check`
- UI: [ResearchConfirmation.tsx](src/app/app/intelligence/ResearchConfirmation.tsx), [results/shared/](src/app/app/intelligence/results/shared/) — new `NewSinceLastTime` panel

**Steps:**
1. **Entity canonicalization** — strip `Inc|Ltd|LLC|,` normalize case; cache lookups with 7-day TTL companies, 30-day people.
2. **Prior mentions service** — pulls from `signal_items` (accumulated + living story count), `pro_signal_event_updates`, `intelligence_briefs`, `intelligence_chat_messages`. Returns `PriorMemorySummary`.
3. **Delta generator** — given prior brief + fresh evidence pack, produces `changedSinceThen[]`, `recurringThemes[]`, `staleAssumptions[]`. Backed only by dated evidence strictly newer than `lastMentionedAt`.
4. **Synthesis hook** — when `priorMemory.hasPriorCoverage === true`, prompt instructs the LLM to dedicate a `newSinceLastTime` section and separate "already known" from "new."
5. **Confirmation banner** — small `/api/intelligence/history-check` endpoint returns summary count + `lastMentionedAt` so the UI can show "You've researched Acme 3 times — building a delta brief." No blocking call; degrade silently if slow.
6. **Chat upgrade** — classify follow-up question {answerable_from_pack, needs_fresh}. If fresh, run a narrow retrieval pass (≤ 2 lanes, 15 s cap) and merge new sources into chat reply + persisted brief sources. Store `source_ids` on chat messages.
7. **Suggested follow-ups** — derived from `unknowns[]` + `weakSourceRoles[]` surfaced by Phase 5.

**Acceptance criteria:**
- [ ] Running a brief twice on the same entity surfaces `priorMemory.hasPriorCoverage === true` on the second run and a non-empty `changedSinceThen` when fresh news exists between runs.
- [ ] Memory claims appear only when backed by stored records (no invented counts).
- [ ] Follow-up asking for info not in the brief triggers a time-budgeted micro-search and returns a cited answer. New sources are persisted on the chat message.
- [ ] Follow-up answerable from the existing pack stays on the fast path (< 5 s).
- [ ] `/history-check` returns in < 200 ms on warm cache; degrades silently on miss.
- [ ] No cross-user prior-memory leak (RLS enforced).

**Agent prompt:**
```
Implement Phase 7 (Prior Memory + Follow-up Chat) of INTELLIGENCE_V2_PLAN.md.
Build prior-mentions, entity cache, delta generator. Wire into synthesis
and a /history-check endpoint. Upgrade chat with classify + optional
micro-search path. Tests required including RLS isolation.
```

---

### Phase 8 — Tiered Depth + Request Cache + Vercel Timeout Plan (Agent D + A)

**Goal:** User-visible speed dial. Instant re-runs. Deep tier does not hit Vercel's 60 s limit.

**Files:**
- NEW [src/lib/intelligence/cache/kv.ts](src/lib/intelligence/cache/kv.ts), [fingerprint.ts](src/lib/intelligence/cache/fingerprint.ts)
- Migration (already in §2) for `intelligence_cache`
- Every orchestrator: accept `depth`; Fast disables adaptive loop, skips claim verifier, disables streaming sections, limits to internal-only + 1 Tavily lane; Deep enables `exaResearch`, `tavilyResearch`, `tavilyCrawl`, YouTube, 2 adaptive rounds, highest-capability model.
- [src/app/api/intelligence/route.ts](src/app/api/intelligence/route.ts) — cache lookup at top; deep-tier requests go through **Inngest** background worker; status polled via SSE reconnect.
- UI: depth selector in `ResearchConfirmation.tsx`; defaults per type (meeting_prep → standard, market_research → deep).

**Depth targets:**
- Fast: ≤ 20 s wall-clock. Internal + one fresh lane. No verifier. No sections streaming.
- Standard: ≤ 75 s. Current + Phases 2–7.
- Deep: 2–5 min, runs via Inngest. Exa `/research` replaces snapshot fan-out; Tavily `/research` + `/crawl` enabled; YouTube transcripts on; 2 adaptive rounds; strictest model.

**Steps:**
1. Add `depth` to `ResearchIntentPacket`.
2. Add fingerprint = sha256 over normalized intent packet + depth.
3. Cache lookup: on hit, return `brief` with `status.cached = true` in ≤ 500 ms. TTL: fast 1 h, standard 6 h, deep 24 h. Accept `?force=1` bypass.
4. **Inngest integration** for deep tier: API returns `runId` immediately, SSE stream is backed by Inngest step events. Client reconnects with `runId` to resume stream.
5. Default-depth selection per research type.

**Acceptance criteria:**
- [ ] Fast tier p95 ≤ 20 s; Standard ≤ 75 s; Deep mean 120–180 s (end-to-end via Inngest, not through Vercel).
- [ ] Deep-tier runs do NOT hit Vercel's 60 s handler limit; Inngest step completes asynchronously.
- [ ] Cache hit returns < 500 ms with `status.cached = true`.
- [ ] Fingerprint stable across whitespace/case/array-order differences in request.
- [ ] `?force=1` bypasses cache.
- [ ] UI shows 3-way depth toggle with per-type default.

**Agent prompt:**
```
Implement Phase 8 (Depth Tiers + Cache + Inngest) of INTELLIGENCE_V2_PLAN.md.
Add the cache module + migration, the fingerprint hasher, and the depth
selector. Integrate Inngest for Deep tier. Thread depth through every
orchestrator with the specified per-tier feature gates. Tests required for
cache stability and depth gating; include a manual QA checklist for Inngest.
```

---

### Phase 9 — New Providers: Perplexity, Proxycurl, Reddit, YouTube (Agent I)

**Goal:** Close specific blind spots that pure Exa/Tavily leave. All optional. All feature-flagged.

**Files:**
- NEW [src/lib/intelligence/providers/perplexity.ts](src/lib/intelligence/providers/perplexity.ts), [proxycurl.ts](src/lib/intelligence/providers/proxycurl.ts), [reddit.ts](src/lib/intelligence/providers/reddit.ts), [youtube.ts](src/lib/intelligence/providers/youtube.ts)
- Planner: extend provider enum + decision table.

**Per-provider usage:**
- **Perplexity Sonar (`sonar-pro`):** grounded one-liners for TL;DR cross-check or single-fact disambiguation. Max 2 calls per brief. Normalized as `provider:'perplexity', qualityLabel:'useful', sourceRole:'gap_fill'`.
- **Proxycurl** (or Apollo/ScrapIn/Clay — decision pending, §Risks): verified LinkedIn titles, tenure, prior companies for meeting-prep attendees. Results cached 30 days in `intelligence_entities`.
- **Reddit:** `/search.json` with subreddit allowlist (`r/sales`, `r/startups`, `r/saas`, `r/programming`, plus product-specific). Feed to `customer_voice` lane for competitive / market research. Max 3 calls.
- **YouTube transcripts** (Supadata or `yt-dlp + whisper` self-hosted): earnings calls, founder interviews, conference talks. **Deep tier only.** Max 2 transcripts per brief. Transcripts chunked into evidence items; source URL = canonical video URL.

**Planner decision table (added to planner system prompt):**
- People question → Proxycurl → Exa people (as fallback).
- TL;DR cross-check → Perplexity (deep tier only).
- Customer voice → Reddit (gated behind `INTELLIGENCE_NEW_PROVIDERS_ENABLED`).
- Earnings / interview → YouTube (deep tier only).

**Graceful degradation:** missing API key → planner skips that provider silently; brief still produces.

**Acceptance criteria:**
- [ ] Meeting-prep with attendees produces profiles with Proxycurl-verified title/tenure (when key present); falls back cleanly to Exa when not.
- [ ] Competitive analysis on a consumer product surfaces ≥ 3 Reddit items as `customer_voice` evidence.
- [ ] Deep-tier run on a public company includes ≥ 1 YouTube transcript excerpt as evidence.
- [ ] Perplexity cross-check writes a `contradictions[]` entry if its grounded answer disagrees with synthesized TL;DR.
- [ ] Missing key for any provider → zero errors; pipeline completes.

**Agent prompt:**
```
Implement Phase 9 (New Providers) of INTELLIGENCE_V2_PLAN.md. Add four
provider modules. Extend planner decision table. Enforce per-brief call
caps and graceful key-missing degradation. YouTube stays behind deep tier.
Unit tests for each provider with mocked responses. Do NOT add Proxycurl
wiring until a vendor choice is confirmed (see Risks §).
```

---

### Phase 10 — UI Data Wiring (Agent G)

**Goal:** Expose V2 data without redesigning.

**Files:**
- [src/app/app/intelligence/results/shared/SearchPlanPanel.tsx](src/app/app/intelligence/results/shared/SearchPlanPanel.tsx) — render lanes (not just queries), with source-role chips.
- [src/app/app/intelligence/results/shared/SourcesStrip.tsx](src/app/app/intelligence/results/shared/SourcesStrip.tsx) — badges: `Internal`, `Primary`, `Fresh`, `Counterpoint`; mark "used in answer."
- [src/app/app/intelligence/results/shared/StatusBar.tsx](src/app/app/intelligence/results/shared/StatusBar.tsx) — show source mix (e.g., "12 internal, 8 primary, 5 fresh"), verification status.
- NEW `NewSinceLastTime.tsx` panel (shown only when `priorMemory.hasPriorCoverage`).
- NEW `DisagreementsPanel.tsx` (shown only when `contradictions.length > 0`).
- NEW `WhyThisAnswer.tsx` compact explainer pulling from `planSummary.lanesRun` + cluster labels.
- Share page: render from the same saved evidence pack as private results where possible.

**Acceptance criteria:**
- [ ] Existing visual direction intact; no redesign.
- [ ] Used-source distinction visible and correct.
- [ ] "New since last time" only appears when backed by data.
- [ ] Share page parity: same sections render on the public route.
- [ ] Mobile responsive.

**Agent prompt:**
```
Implement Phase 10 (UI data wiring) of INTELLIGENCE_V2_PLAN.md. Add the
three new panels, the source-role badges, the used/found distinction, and
the lane view in SearchPlanPanel. Do not redesign. Share page must render
the same sections as private results. Component tests required.
```

---

### Phase 11 — Evals, Metrics, Rollout (Agent H)

**Goal:** Prove V2 beats V1 before rollout. Stop regressions.

**Files:**
- NEW `eval/intelligence/` with fixtures per research type.
- NEW `scripts/eval-intelligence.ts` runner.
- GitHub Actions workflow.

**Fixture set (20 total, 5 per research type):**
- meeting_prep: known account with internal history + fresh external news.
- competitive: 3 competitors with overlapping announcements.
- business_case: build/buy/partner with counter-evidence required.
- market_research: emerging market with mixed primary/analyst/internal evidence.

**Metrics tracked per run:**
- Time to first visible section (TTFS)
- Total wall-clock
- Internal evidence hit rate (% evidence items provider:'internal')
- External query count
- Source mix per role
- Claim citation coverage (% material claims with valid citations)
- Verification pass rate (first-pass vs repaired vs degraded)
- Degraded run rate
- Cost per successful brief (token + provider)
- Follow-up chat usage rate
- Share rate
- Copy/export rate

**Runner behavior:**
- Mocks external providers using fixture JSON (deterministic).
- Scores briefs against a checklist + LLM-as-judge (Claude Haiku 4.5) on actionability, citation quality, role relevance.
- Emits a table that's posted as a PR comment.
- Fails CI on regression > 10% on any metric or citation coverage < 95%.

**Rollout order:**
1. Ship Phase 0 (trust repairs). No flags.
2. Ship Phase 1 (run store). No behavior change.
3. Ship Phase 2 (internal provider) behind `INTELLIGENCE_INTERNAL_CORPUS_ENABLED`. Shadow-mode only — runs alongside V1, records evidence pack, does not change output.
4. Ship Phase 3–6 behind their flags. Enable for internal testing accounts. Compare packs V1 vs V2.
5. Enable for 5% user rollout. Watch metrics.
6. Enable 25% → 50% → 100% with gate on regression thresholds.
7. Keep V1 callable until V2 has held quality for one full cycle.

**Acceptance criteria:**
- [ ] `npm run eval:intelligence` runs the full 20-case fixture set in ≤ 10 min with no live provider calls.
- [ ] Baseline committed.
- [ ] CI posts the metric table on PR; fails on regression.
- [ ] Rollout doc lists the flag flip order and rollback steps.

**Agent prompt:**
```
Implement Phase 11 (Evals + Rollout) of INTELLIGENCE_V2_PLAN.md. Build the
20-case fixture set (5 per type), the runner with mocked providers + LLM-
as-judge, and CI wiring. Commit the baseline scores. Document the rollout
and rollback steps.
```

---

## 4. Query Formation Rules by Research Type

Used by Agent C's planner prompt. These are **lane templates**, not hardcoded queries — the LLM fills in entity names.

### Meeting Prep
Required lanes: `internal_memory`, `primary` (company site), `fresh_news`, `people` (attendees), `counter_evidence` (objections/risks tied to what user is selling).

Query patterns:
- Internal: `{company}` + user role + recent signal + account; prior briefs where entity matches `{company}` or attendees.
- Exa company lane: exact company snapshot with `outputSchema`.
- Exa people lane: attendee name + company + role.
- Tavily news lane: `{company} (funding OR layoffs OR launch OR partnership OR lawsuit OR expansion)`.
- Tavily map/crawl lane: company site paths for pricing, customers, security, docs, case studies.

Output must answer: what changed recently; what the account likely cares about; what the user should say or ask; what risks may surface; what the user has already seen before.

### Competitive Analysis
Required lanes: `internal_memory` (competitor story clusters), `primary` (competitor sites), `fresh_news`, `counter_evidence` (against the obvious narrative), `customer_voice` (optional).

Query patterns:
- Internal: competitor names + active signal clusters + last 180 days.
- Exa company: competitor exact pages.
- Exa financial: public competitor financials.
- Tavily news: `{competitor} (product launch OR pricing OR partnership OR customer)`.
- Tavily crawl: competitor product/pricing/case-study pages.
- Reddit (Phase 9): `{product} review` in product-specific subs.

Output: what changed; which move matters most; what is overhyped; where the opening is; what to do next.

### Business Case
Required lanes: `internal_memory` (initiative-linked signals), `primary` / `financial` (filings, data), `market_data`, `counter_evidence`, `customer_voice` (optional).

Query patterns:
- Internal: initiative keywords + role dimensions + prior business-case signals.
- Exa research / financial: studies, filings, market data.
- Tavily general/news/finance: fresh proof points.
- Tavily extract: known reports/articles with tables or embedded content.

Output: is the case strong/weak/mixed; supporting evidence; arguing-against evidence; fragile assumptions; what to test next.

### Market Research
Required lanes: `internal_memory` (living stories per theme), `market_data`, `fresh_news`, `primary` (known players), `counter_evidence`.

Query patterns:
- Internal: market topic + user role + living story clusters.
- Exa research paper: topic + adoption/challenges.
- Exa company: known player snapshots.
- Exa financial report: public-company exposure.
- Tavily news/finance: market funding, regulation, adoption, failures.

Output: what is real now; what is changing; who matters; what is uncertain; what to watch or do next.

---

## 5. Agent Workstreams (for subagent dispatch)

| Agent | Phases | Primary Files |
|-------|--------|--------------|
| **A** | 0, 1, 8 (API side), 10 (wiring) | page.tsx, history, ShareButton, chat route, runs/store.ts, cache/, route.ts |
| **B** | 2 | providers/internal-corpus.ts, normalize.ts, contracts.ts, db.ts |
| **C** | 3 | context/, planner/, retrieval/, orchestrators/* |
| **D** | 4, 8 (orchestrator side) | providers/exa.ts, providers/tavily.ts, openrouter.ts, model-selection.ts, orchestrators/* |
| **E** | 5 | evidence/*, ranker.ts, normalize.ts |
| **F** | 6 | prompts/*, synthesis/*, verifier/*, openrouter.ts (streaming), sse-emitter.ts, hooks/useIntelligenceStream.ts |
| **G** | 7, 10 | memory/*, results/shared/*, chat/route.ts, ResearchConfirmation.tsx |
| **H** | 11 | eval/intelligence/*, scripts, CI |
| **I** | 9 | providers/perplexity.ts, proxycurl.ts, reddit.ts, youtube.ts |

Dispatch order (parallel where possible):
- Sprint 1: A (Phase 0), A (Phase 1 in parallel with B starting Phase 2).
- Sprint 2: C (Phase 3), D (Phase 4) — both depend on Phase 1+2 being merged.
- Sprint 3: E (Phase 5), F (Phase 6) in parallel (F depends on E's pack format).
- Sprint 4: G (Phase 7), D+A (Phase 8).
- Sprint 5: I (Phase 9), G (Phase 10 wiring).
- Sprint 6: H (Phase 11), begin staged rollout.

---

## 6. Testing Plan

**Unit tests:**
- Intent packet builder (one per research type + missing optional fields).
- User lens builder (empty past mentions, populated past mentions).
- Planner V2 lane requirements (per research type).
- Internal corpus provider method mapping (fixture Supabase).
- Exa request sanitization (unsupported category/date combos stripped).
- Tavily request mapping (fast vs advanced; with/without raw markdown; map/crawl gated).
- URL canonicalization edge cases (utm, amp, m., fbclid, trailing slash).
- Content fingerprint stability.
- Evidence clustering (3 syndicated stories → 1 cluster).
- Evidence scoring (multi-role preservation).
- Pack truncation determinism.
- Claim map extraction.
- Citation verifier (hallucinated id, missing id, unsupported claim, stale claim).
- OpenRouter strict schema payload + json_object fallback validation.
- Cache fingerprint stability.
- Prior memory RLS isolation.

**Integration tests (mocked providers):**
- Meeting prep with internal memory + fresh external gap.
- Competitive analysis with same-domain first-party pages preserved.
- Business case with counter-evidence required.
- Market research with story clusters + known players.
- Internal-only run (no external providers reachable).
- Deep tier via Inngest (dry-run).

**UI smoke tests:**
- Generate brief.
- Refresh after brief.
- Open from history (deep-link).
- Copy and open share link.
- Ask follow-up question (existing answer path + fresh-retrieval path).
- "Used in answer" source badge.
- "New since last time" section.
- Depth toggle.

**Live provider tests** (gated by env vars, not in CI):
- `EXA_API_KEY`, `TAVILY_API_KEY`, `OPENROUTER_API_KEY`, `INTELLIGENCE_LIVE_PROVIDER_TESTS=true`. Thin smoke only.

---

## 7. Quality Bar (ship gates)

V2 ships when it meets all of:
- Uses internal memory when available.
- Never claims prior coverage unless backed by saved records.
- Every material claim cites a `sourceId` that exists in the ledger.
- Distinguishes facts, inferences, and recommendations.
- Names what changed since prior coverage.
- Shows what was **used**, not just what was found.
- Explains weak evidence or missing data.
- Stays within product latency and cost targets per tier (§Phase 8).
- Preserves current UI quality.
- Beats V1 on the eval harness: citation coverage +10pp, internal-memory use +0 to start (baseline) then monotonic up, human-rated actionability ≥ V1 + 0.5 (1–5 scale).

---

## 8. Risks & Open Decisions (user to resolve before subagent dispatch)

1. **Adjacent Supabase project.** Confirm whether `pro_articles`, `signal_items`, `pro_signal_event_updates`, `pro_entity_research_index` live in the **same** Supabase project as `intelligence_briefs`. If different, Agent B needs a second server-only Supabase client + credentials.
2. **People-data vendor.** Proxycurl vs Apollo vs Clay vs ScrapIn — pricing, rate limits, and ToS differ. Pick one before Phase 9.
3. **Deep tier execution host.** Recommended: **Inngest** (integrates cleanly with Vercel, step events fit SSE semantics). Alternative: Trigger.dev, self-host. Decision affects Phase 8 implementation.
4. **Embeddings.** Only needed in Phase 5's optional cluster-augmentation. OpenAI `text-embedding-3-small` is cheap and sufficient. Confirm OK to add `OPENAI_API_KEY`.
5. **Cost envelope per brief.**
   - Fast: ~$0.02 (mostly internal + cheap model).
   - Standard: ~$0.08 (adds extract + repair + verifier pass).
   - Deep: ~$0.30–0.50 (Exa Research, Tavily Research/Crawl, YouTube transcript, strongest model).
   Confirm acceptable.
6. **Run-store retention.** How long to keep raw evidence pack blobs? Suggested: 90 days; then truncate to metadata only.
7. **LLM choice for verifier and claim-map.** A small fast model (e.g., `google/gemini-3.1-flash-lite-preview` or `openai/gpt-5.4-mini`) is enough and keeps latency down. Confirm.
8. **Reddit ToS / API credentials.** Unauthenticated `/search.json` is fine for low volume. At scale, move to an authenticated key.
9. **YouTube transcript source.** Supadata (paid API) vs `yt-dlp + whisper` (self-host). Supadata recommended for reliability.
10. **Feature-flag home.** All flags belong in a single `INTELLIGENCE_FLAGS` object loaded from `process.env` server-side, so rollout can be adjusted without deploys if wired to a feature-flag service.

---

## 9. Non-Goals

- No UI redesign. Visual direction stays.
- No replacement of Zod. Repair logic depends on it.
- No heavy framework (LangChain/LlamaIndex). Every new module stays < ~400 lines of TypeScript.
- No direct-billed LLM vendors outside OpenRouter — the existing billing path is preserved.
- No blanket "turn on every Exa/Tavily feature." Capability is used **per lane, per budget**.
- No backfill of the full RSS corpus into embeddings in one shot. If embedding augmentation is adopted in Phase 5, backfill is incremental and resumable.

---

## 10. TL;DR Shipping Plan

| Sprint | Phases merged | What users feel |
|--------|---------------|-----------------|
| 1 | 0, 1 | Nothing obvious, but history/share/chat/refresh all work; every run is inspectable. |
| 2 | 2, 3 | Briefs start pulling from internal memory; planner is lane-based (under flag). |
| 3 | 4, 5 | Provider quality jumps (full Exa/Tavily capability); evidence pack is richer. |
| 4 | 6 | Briefs render progressively; every claim is verified; degraded status is honest. |
| 5 | 7 | "You've seen this before — here's what changed" moment. Follow-ups pull fresh evidence. |
| 6 | 8 | Fast / Standard / Deep toggle. Instant re-runs. Deep tier on Inngest. |
| 7 | 9 | Verified people, Reddit voice, YouTube transcripts (Deep). |
| 8 | 10, 11 | Source badges + used-vs-found clarity; eval harness live; staged rollout. |

Minimum sellable slice: sprints 1–5 (Phases 0, 1, 2, 3, 4, 5, 6, 7). That alone is materially better than GPT / Perplexity on the user's specific work because it combines internal memory, lane-based retrieval, full-capability providers, cited-and-verified synthesis, and prior-coverage deltas — none of which the generic tools can replicate.
