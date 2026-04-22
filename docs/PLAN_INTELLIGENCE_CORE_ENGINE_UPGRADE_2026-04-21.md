# Intelligence Core Engine Upgrade Plan

Date: 2026-04-21

Owner: Coding agent team

Goal: turn Relevant intelligence into a role-aware relevance engine that starts from the user's business context, uses internal source-platform memory first, searches the open web only for the gaps, and produces cited, decision-ready output that feels effortless.

## Bottom Line

The current intelligence system has a good skeleton, but it behaves like a search-and-summarize pipeline. The next version should behave like a research operator that already understands the user's role, remembers prior coverage, knows which sources matter, fills evidence gaps deliberately, and proves every important claim.

## Current System Map

### 1. User Input

Entry point:

- `src/app/app/intelligence/page.tsx`
- `src/app/app/intelligence/ResearchTypeSelector.tsx`
- `src/app/app/intelligence/forms/*`
- `src/app/app/intelligence/ResearchConfirmation.tsx`

Current flow:

1. User picks one of four research modes:
   - Meeting prep
   - Competitive analysis
   - Business case
   - Market research
2. A form collects structured fields.
3. `ResearchConfirmation` shows a human-readable system brief and a static evidence plan.
4. User can add steering notes.
5. `useIntelligenceStream` sends the final payload to `/api/intelligence`.

Important gap:

- The confirmation screen's evidence plan is not the actual server research plan. It sets user expectations, but the real plan is generated later in `search-planner.ts`.
- Only meeting prep has AI refinement today.
- The form captures useful intent, but the backend does not yet convert it into a durable "research intent packet" with decision, user role, evidence needs, risk tolerance, time horizon, and source preferences.

### 2. API Entry

Entry point:

- `src/app/api/intelligence/route.ts`

Current flow:

1. Authenticates with Supabase bearer token.
2. Rate-limits by user.
3. Sanitizes request input.
4. Loads a small user context packet from `users`.
5. Routes to one of four orchestrators.
6. If streaming is enabled, emits step events over SSE.

Current user context:

- Profile kind
- Raw industry
- Raw role
- Company id
- Manual company name
- Country/context metadata

Important gap:

- This misses the richer context already present in the wider Relevant system: dimensions, prior signals, source history, entity dossiers, user feedback, past briefs, past chats, and living story state.

### 3. Orchestration

Entry points:

- `src/lib/intelligence/orchestrators/meeting-prep.ts`
- `src/lib/intelligence/orchestrators/competitive-analysis.ts`
- `src/lib/intelligence/orchestrators/business-case.ts`
- `src/lib/intelligence/orchestrators/market-research.ts`

Shared stages:

1. Resolve entity or entities.
2. Build search plan.
3. Execute Exa/Tavily searches.
4. Normalize provider results.
5. Rank evidence.
6. Synthesize with OpenRouter.
7. Assemble final brief contract.

Important gap:

- The stages are clean, but they are linear. There is no research loop that asks: "What is missing?", "Which claim needs stronger proof?", "What changed since the user last saw this?", or "Do we have counter-evidence?"

### 4. Search Planning

Entry point:

- `src/lib/intelligence/search-planner.ts`

Current behavior:

- An LLM creates up to 10 search tasks.
- The fallback planner creates deterministic searches.
- Search tasks are flat objects with provider, query, purpose, time range, domains, and metadata.
- Exa and Tavily tasks execute in parallel.

Current strengths:

- Clear provider abstraction.
- Deterministic fallback.
- Search plan is returned to the UI.

Important gaps:

- The planner does not treat internal RSS/source-platform data as a provider.
- The planner does not have retrieval lanes, source budgets, quality targets, or gap-fill passes.
- Query generation is too close to "search query strings" and not close enough to "research questions that need proof."
- The planner does not emit expected source mix, primary-source requirements, or counter-evidence requirements.

### 5. Provider Use

Entry points:

- `src/lib/intelligence/providers/exa.ts`
- `src/lib/intelligence/providers/tavily.ts`

Current Exa use:

- Uses Exa search.
- Uses `type`, `category`, `startPublishedDate`, domain filters, user location.
- Requests highlights, summaries, and image links.
- Uses snapshot/person/company-style searches for some paths.

Current Tavily use:

- Uses Tavily search with advanced depth.
- Uses `chunks_per_source`.
- Uses topic, time range, country, images, favicon.
- Sets `include_answer: advanced`.
- Has a small extract helper for known URLs.

Important gaps:

- Exa's richer modes are underused: `/contents`, deeper search variants, structured `outputSchema`, `additionalQueries`, `systemPrompt`, `/answer`, monitors, and Websets are not part of the current runtime strategy.
- Tavily's richer modes are underused: raw content, advanced extract, map, crawl, research tasks, image descriptions, and answer output are not fully used in the research flow.
- Tavily answer is requested but not carried into normalized evidence.
- Exa request timeout is created but not clearly wired through the SDK call path.
- Snapshot results in competitive, business-case, and market-research flows are sometimes put into the prompt but not converted into citable evidence.

Official capability references:

- Exa Search API: https://exa.ai/docs/reference/search-api-guide-for-coding-agents
- Exa Contents API: https://exa.ai/docs/reference/contents-api-guide
- Exa Answer API: https://exa.ai/docs/reference/answer
- Exa Monitors API: https://exa.ai/docs/reference/monitors-api-guide-for-coding-agents
- Tavily Search API: https://docs.tavily.com/documentation/api-reference/endpoint/search
- Tavily Extract API: https://docs.tavily.com/documentation/api-reference/endpoint/extract
- Tavily Crawl API: https://docs.tavily.com/documentation/api-reference/endpoint/crawl
- Tavily Map API: https://docs.tavily.com/documentation/api-reference/endpoint/map
- Tavily Research API: https://docs.tavily.com/documentation/api-reference/endpoint/research

### 6. Normalization and Ranking

Entry points:

- `src/lib/intelligence/normalize.ts`
- `src/lib/intelligence/ranker.ts`

Current behavior:

- Converts Exa/Tavily provider results into `BriefSource` and `NormalizedEvidence`.
- Deduplicates mostly by exact normalized URL.
- Scores evidence by recency, authority, and query-term overlap.
- Keeps only one item per domain.
- Sends only the top 8 evidence items into synthesis.

Important gaps:

- The top-8 cap is too narrow for serious research.
- Domain dedupe is too aggressive. A single domain can have multiple valid primary-source pages, filings, product pages, or timeline updates.
- No story clustering. Ten articles about the same event are treated as ten competing items until ranking drops most of them.
- No distinction between source roles: primary source, regulatory/filing, market data, credible reporting, customer voice, company-owned page, commentary, counter-evidence.
- No durable evidence IDs, claim mapping, or evidence ledger.
- Source list shown in the UI can include sources the LLM never saw.

### 7. LLM Synthesis

Entry points:

- `src/lib/intelligence/openrouter.ts`
- `src/lib/intelligence/prompts/*.ts`

Current behavior:

- Uses OpenRouter chat completions.
- Selects curated structured-output models.
- Uses JSON output mode and Zod validation.
- Attempts one repair call if parsing fails.
- Prompts are strong on "what happened, why it matters, what to do next."

Important gaps:

- Uses `json_object`, not strict `json_schema`.
- Does not set provider `require_parameters` when strict output support is needed.
- Does not run a separate citation/claim verifier.
- Does not produce a claim map tying each material statement to evidence IDs.
- Does not explicitly carry contradictions, unknowns, prior mentions, or "what changed since last time."

Official capability references:

- OpenRouter structured outputs: https://openrouter.ai/docs/features/structured-outputs
- OpenRouter provider routing: https://openrouter.ai/docs/features/provider-routing
- OpenRouter reasoning tokens: https://openrouter.ai/docs/guides/best-practices/reasoning-tokens

### 8. Persistence, History, Share, Chat

Entry points:

- `src/app/api/intelligence/briefs/route.ts`
- `src/lib/intelligence/db.ts`
- `src/app/api/intelligence/chat/route.ts`
- `src/app/app/intelligence/history/page.tsx`
- `src/app/app/intelligence/results/shared/ShareButton.tsx`
- `src/app/app/intelligence/results/shared/FollowUpChat.tsx`

Current behavior:

- Client auto-saves generated briefs after completion.
- Briefs endpoint supports save/list/share.
- Chat endpoint answers follow-up questions against saved brief synthesis and first 10 sources.
- History page links to `/app/intelligence?brief=...`.
- Share button copies `/share/intelligence/...`.

Important gaps:

- Generation does not server-save the brief. If client save fails, the brief is not durable.
- History links do not appear to be handled by `page.tsx`.
- Share URL does not match the actual public route.
- Chat loads oldest messages first when history exceeds the limit.
- Chat does not retrieve fresh or full evidence.
- The database stores the final brief and source list, but not the raw plan, provider requests, evidence items, clusters, claim map, verifier result, or LLM usage.

## Adjacent System Opportunity: Internal Source-Platform Corpus

The Website app already sits next to a richer Relevant backend in `/Users/akshitsama/Desktop/Relevant`.

Important existing capabilities there:

- `pro_sources`, `pro_source_endpoints`, `pro_source_supply_plan`, and `pro_source_poll_events` manage source-platform intake.
- `pro_articles` stores parsed source-platform articles with provenance such as source id, endpoint id, and supply lane.
- `pro_entity_research_index` and `search_entity_dossier_evidence` support entity-level retrieval.
- `signal_items` stores role-aware living stories with source count, update count, delta summary, accumulated sources, and source extracts.
- `pro_signal_event_updates` tracks evolving story updates.
- `pro-entity-dossier` already retrieves internal evidence, falls back to live search when needed, groups timeline evidence, synthesizes dossiers, logs usage, and caches results.

This is the core unfair advantage. Intelligence should not begin by asking Exa/Tavily what happened. It should begin by asking Relevant what it already knows for this user, role, entity, and topic.

## Product Target

The target experience:

1. User asks for meeting prep, competitive analysis, business case, or market research.
2. Relevant builds a role-aware intent packet.
3. Relevant checks internal memory first:
   - Has this user seen this entity/topic before?
   - How many times?
   - What changed since then?
   - Which internal sources already cover it?
   - Which living stories are active?
4. Relevant creates a research plan with lanes:
   - Internal corpus
   - Internal living stories
   - Entity dossier
   - Primary sources
   - Fresh web
   - Deep semantic web
   - Company/people/financial/research source lanes
   - Counter-evidence lane
   - Gap-fill lane
5. Relevant retrieves evidence, clusters it, scores it, and builds an evidence pack.
6. Relevant sends only the best evidence pack to the LLM.
7. Relevant verifies claims and citations.
8. Relevant shows the result as:
   - What happened
   - Why it matters for this user's role
   - What to do next
   - What changed since the last time they saw this
   - Which sources drove the conclusion
   - Confidence and gaps

## Target Architecture

### A. Research Intent Packet

Create a new internal type:

```ts
type ResearchIntentPacket = {
  runId: string;
  researchType: "meeting_prep" | "competitive" | "business_case" | "market";
  user: {
    id: string;
    role: string | null;
    industry: string | null;
    company: string | null;
    country: string | null;
    seniority?: string | null;
    function?: string | null;
  };
  decision: {
    statedGoal: string;
    impliedDecision: string;
    timeHorizon: "today" | "week" | "quarter" | "year" | "strategic";
    audience: string[];
    desiredOutput: string[];
  };
  entities: {
    primary: EntityRef[];
    competitors: EntityRef[];
    people: EntityRef[];
    marketTerms: string[];
  };
  constraints: {
    steering: string | null;
    mustInclude: string[];
    mustAvoid: string[];
    geography: string[];
  };
  qualityTargets: {
    minPrimarySources: number;
    minIndependentSources: number;
    minCounterEvidence: number;
    freshnessRequired: boolean;
    internalMemoryRequired: boolean;
  };
};
```

Why:

- Query formation should start from intent, not provider syntax.
- The same intent packet can drive planning, retrieval, synthesis, persistence, and evaluation.

Acceptance criteria:

- Every intelligence run creates an intent packet before provider calls.
- Intent packet is logged in the run record.
- Unit tests cover all four research types and missing optional fields.
- Steering notes are preserved and visible in the packet.

### B. User Lens Builder

Create a service:

- `src/lib/intelligence/context/user-lens.ts`

Responsibilities:

- Load current user profile.
- Load relevant dimensions/signals if available.
- Load recent intelligence briefs for the same entity/topic.
- Load recent chat questions for the same brief/entity/topic.
- Produce a compact `UserLens`.

Suggested output:

```ts
type UserLens = {
  roleFrame: string;
  likelyConcerns: string[];
  companyContext: string | null;
  industryFrame: string | null;
  pastMentions: Array<{
    topic: string;
    entity: string;
    count: number;
    lastSeenAt: string;
    lastTakeaway: string;
  }>;
  recentRelevantSignals: Array<{
    signalId: string;
    title: string;
    deltaSummary: string | null;
    sourceCount: number;
    updatedAt: string;
  }>;
};
```

Acceptance criteria:

- If prior coverage exists, the final brief can say "You have seen this before" without guessing.
- If no prior coverage exists, the system says nothing about prior coverage.
- User lens is limited to a small, deterministic token budget.

### C. Internal Corpus Provider

Create a first-class provider:

- `src/lib/intelligence/providers/internal-corpus.ts`

It should query:

- `pro_articles`
- `pro_entity_research_index`
- `signal_items`
- `pro_signal_event_updates`
- Existing RPC such as `search_entity_dossier_evidence` if available from the Website Supabase client
- `intelligence_briefs` and `intelligence_chat_messages` for previous user intelligence work

Provider methods:

```ts
type InternalCorpusProvider = {
  searchArticles(query: InternalCorpusQuery): Promise<ProviderResult[]>;
  searchSignals(query: InternalSignalQuery): Promise<ProviderResult[]>;
  searchEntityDossier(query: EntityDossierQuery): Promise<ProviderResult[]>;
  searchPriorBriefs(query: PriorBriefQuery): Promise<PriorMemoryResult[]>;
};
```

What it should return:

- Internal article evidence
- Living story evidence
- Prior mention counts
- Delta summaries
- Source-platform provenance
- Matched user dimension when available

Acceptance criteria:

- Internal provider runs before Exa/Tavily.
- At least one orchestrator integration test proves an internal hit can satisfy a research lane without external search.
- Evidence returned from internal corpus has stable source IDs and source-platform provenance.
- If internal corpus fails, external provider research still works and status marks the degradation.

### D. Research Planner V2

Replace flat planning with lane-based planning.

New files:

- `src/lib/intelligence/planner/research-plan.ts`
- `src/lib/intelligence/planner/planner-v2.ts`
- `src/lib/intelligence/planner/fallbacks.ts`

Suggested plan shape:

```ts
type ResearchPlanV2 = {
  planId: string;
  intentSummary: string;
  lanes: ResearchLane[];
  expectedSourceMix: {
    internal: number;
    primary: number;
    freshWeb: number;
    semanticWeb: number;
    counterEvidence: number;
  };
  stopRules: {
    enoughEvidenceScore: number;
    maxExternalSearches: number;
    maxProviderMs: number;
  };
};

type ResearchLane = {
  id: string;
  purpose: string;
  providerPreference: Array<"internal" | "exa" | "tavily">;
  sourceRole:
    | "internal_memory"
    | "primary"
    | "fresh_news"
    | "financial"
    | "people"
    | "customer_voice"
    | "market_data"
    | "counter_evidence"
    | "gap_fill";
  questions: string[];
  queryTemplates: string[];
  freshnessDays?: number;
  required: boolean;
  budget: {
    maxQueries: number;
    maxResults: number;
    maxContentChars: number;
  };
};
```

Planning rules:

- Always create an internal-memory lane.
- Always create at least one primary-source lane.
- Always create a counter-evidence lane for competitive, business-case, and market research.
- Use Tavily for fresh, time-bounded web coverage and company site crawl/map.
- Use Exa for semantic discovery, company/person/research/financial categories, and deeper source discovery.
- Use external search only for gaps that internal corpus cannot answer.

Acceptance criteria:

- Planner returns lanes, not only provider tasks.
- Fallback planner produces valid lanes without LLM.
- Unit tests verify lane requirements for each research type.
- The UI can still render a readable search plan from the new shape.

### E. Retrieval Controller

Create:

- `src/lib/intelligence/retrieval/controller.ts`

Responsibilities:

1. Execute internal lanes first.
2. Score internal coverage.
3. Decide which external lanes are still needed.
4. Execute Exa/Tavily in parallel with per-lane budgets.
5. Run gap-fill searches only when evidence coverage is weak.
6. Return a complete retrieval report.

Suggested coverage scoring:

```ts
type CoverageScore = {
  enoughToSynthesize: boolean;
  score: number;
  missingQuestions: string[];
  weakSourceRoles: string[];
  needsFreshness: boolean;
  needsCounterEvidence: boolean;
};
```

Acceptance criteria:

- If internal evidence already covers a question strongly, external search budget is reduced.
- If primary sources are missing, the controller attempts a primary-source lane before synthesis.
- Retrieval report includes provider timings, failures, query count, result count, and cost/usage where available.
- All provider calls respect the run timeout.

### F. Provider Adapter Upgrades

#### Exa

Current use is partial. Upgrade Exa use by lane:

- Company snapshot: `category: "company"` with no unsupported date/exclude filters.
- People lane: `category: "people"` and LinkedIn-aware include-domain rules when needed.
- Research/market lane: `category: "research paper"` for studies and technical/market shifts.
- Financial lane: `category: "financial report"` for public-company financials.
- Fresh news lane: `category: "news"` with `startPublishedDate`.
- Deep semantic lane: use `type: "deep-lite"` or `type: "deep"` only for complex multi-hop questions.
- Content extraction: use `/contents` or `contents.text` for the top few pages where highlights are insufficient.
- Structured extraction: use `outputSchema` selectively for entity facts, not for every search.
- Additional queries: use `additionalQueries` for deep variants where a lane has known alternate phrasing.

Do not use every Exa feature on every request. Use capability by lane and budget.

Acceptance criteria:

- Exa adapter supports lane-specific options.
- Tests assert unsupported category/filter combinations are removed before calling Exa.
- Exa timeout is actually enforced.
- Snapshot results are always normalized into citable evidence when they influence synthesis.

#### Tavily

Current use is partial. Upgrade Tavily use by lane:

- Fresh web lane: `search_depth: "advanced"`, `topic: "news"` or `topic: "finance"` where appropriate, `time_range` or explicit date range.
- Fast checks: `search_depth: "fast"` for low-risk supporting lookups.
- Deep content: `include_raw_content: "markdown"` only for selected high-value results.
- Answer capture: carry Tavily's generated answer into the evidence ledger as provider synthesis, clearly labeled.
- Extract lane: use advanced extract for important known URLs, PDFs, tables, and embedded content.
- Map lane: map company domains to find pricing, docs, case studies, investors, security, customers, careers, and press pages.
- Crawl lane: crawl selected first-party domains when the user asks for company/product/account research.
- Research API: reserve for long-running, complex, multi-angle research where latency can be tolerated.
- Images: use image descriptions only when the output benefits from visuals.

Acceptance criteria:

- Tavily adapter exposes search, extract, map, crawl, and optional research wrappers.
- Tests assert `include_answer`, raw content, extract depth, map, and crawl request shapes.
- Tavily answer is normalized but not treated as a primary source.
- Crawl/map are gated by budget and never run by default for every brief.

#### OpenRouter

Current use is strong but not strict enough.

Upgrade:

- Use `response_format: { type: "json_schema", json_schema: ... }` for models that support it.
- Set provider `require_parameters: true` when strict schema support is required.
- Keep model fallback, but fall back intentionally:
  - strict schema model
  - JSON-object model
  - repair model
- Log model id, provider id if returned, prompt/completion tokens, latency, and fallback reason.
- Keep reasoning enabled but excluded from returned content where supported.

Acceptance criteria:

- Unit tests cover strict schema payload shape.
- Fallback test proves the system can degrade from strict schema to JSON-object mode and still validate with Zod.
- Provider/model metadata is saved with the run.

### G. Evidence Graph

Create:

- `src/lib/intelligence/evidence/canonicalize.ts`
- `src/lib/intelligence/evidence/cluster.ts`
- `src/lib/intelligence/evidence/score.ts`
- `src/lib/intelligence/evidence/pack.ts`
- `src/lib/intelligence/evidence/validate.ts`

Evidence item shape:

```ts
type EvidenceItem = {
  id: string;
  sourceId: string;
  provider: "internal" | "exa" | "tavily";
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
  quality: {
    authority: number;
    freshness: number;
    relevance: number;
    independence: number;
    primarySource: boolean;
  };
  clusterId?: string;
};
```

Key changes:

- Canonicalize URLs by removing tracking params and normalizing host/path.
- Deduplicate by canonical URL and content fingerprint.
- Cluster related items into story/event groups.
- Allow multiple sources from the same domain when they serve different source roles.
- Preserve source diversity without throwing away primary evidence.
- Rank clusters first, then evidence inside clusters.
- Build an evidence pack with 20-40 evidence items when needed, not a hard top 8.

Acceptance criteria:

- Ranker no longer drops all but one item per domain.
- Cluster tests cover duplicate syndication, same story across sources, and multiple useful pages from one company domain.
- Evidence pack always includes evidence IDs, source IDs, lane IDs, and source roles.
- The LLM receives only sources present in the evidence pack.

### H. Evidence Pack Sent to LLM

The LLM should receive an evidence pack, not a loose source dump.

Suggested shape:

```ts
type EvidencePack = {
  run: {
    runId: string;
    researchType: string;
    generatedAt: string;
  };
  intent: ResearchIntentPacket;
  userLens: UserLens;
  priorMemory: PriorMemorySummary;
  planSummary: {
    lanesRun: string[];
    lanesSkipped: string[];
    knownGaps: string[];
  };
  sourceLedger: Array<{
    sourceId: string;
    role: SourceRole;
    title: string;
    domain: string | null;
    url: string | null;
    provider: string;
    qualityLabel: "primary" | "strong" | "useful" | "weak";
  }>;
  evidence: EvidenceItem[];
  clusters: Array<{
    clusterId: string;
    label: string;
    whatChanged: string;
    evidenceIds: string[];
  }>;
  contradictions: Array<{
    issue: string;
    evidenceIds: string[];
  }>;
  unknowns: Array<{
    question: string;
    reasonMissing: string;
  }>;
};
```

Prompt rule:

- The model may only cite `sourceId`s in `sourceLedger`.
- Every material claim must cite at least one source ID.
- Every recommendation must trace back to at least one claim.
- If evidence is weak, say so plainly.
- If the user has prior coverage, explicitly separate "already known" from "new since then."

Acceptance criteria:

- Snapshot tests verify prompt payload includes user lens, prior memory, evidence IDs, contradictions, and unknowns.
- Prompt payload has a hard token budget and deterministic truncation.
- No provider raw dump is sent directly to synthesis.

### I. Claim Verifier

Create:

- `src/lib/intelligence/verifier/claim-map.ts`
- `src/lib/intelligence/verifier/citation-check.ts`
- `src/lib/intelligence/verifier/repair.ts`

Verifier responsibilities:

1. Parse final brief.
2. Extract material claims.
3. Confirm every cited source ID exists.
4. Confirm source IDs were in the evidence pack.
5. Flag unsupported numeric/date claims.
6. Flag source IDs that are shown but unused.
7. Trigger one repair pass when claims fail.
8. Mark brief `degraded` if verification still fails.

Acceptance criteria:

- No final brief can cite a missing source ID.
- Tests cover hallucinated source ID, unsupported date claim, unsupported metric claim, and stale source claim.
- Status includes verifier result.
- UI can show "verified", "partial", or "degraded" without redesign.

### J. Prior Memory: "We Spoke About This Before"

Create:

- `src/lib/intelligence/memory/prior-mentions.ts`

Sources:

- `signal_items`
- `pro_signal_event_updates`
- `intelligence_briefs`
- `intelligence_chat_messages`
- Internal article clusters by entity/topic

Output:

```ts
type PriorMemorySummary = {
  hasPriorCoverage: boolean;
  totalMentions: number;
  lastMentionedAt: string | null;
  lastKnownTakeaway: string | null;
  changedSinceThen: string[];
  recurringThemes: string[];
  staleAssumptions: string[];
};
```

Result behavior:

- Meeting prep: "You have seen this account/topic 5 times. The new change is..."
- Competitive: "This competitor has appeared in 3 prior signals. The pattern is..."
- Business case: "This risk has come up before; the new evidence strengthens/weakens it."
- Market research: "This market theme is recurring; here is what changed since the last signal."

Acceptance criteria:

- Memory statements appear only when backed by stored prior records.
- Prior mention count is exact for the queried user scope.
- `changedSinceThen` uses dated evidence newer than `lastMentionedAt`.
- Tests cover no prior memory, one prior item, and multiple prior story updates.

### K. Results Packaging

Keep the existing UI direction. Improve the data shown inside it.

Minimal UI upgrades:

- Source badges:
  - Internal
  - Primary
  - Fresh
  - Counterpoint
  - Used in answer
- Add a compact "Why this answer" panel from the evidence ledger.
- Add "New since last time" when prior memory exists.
- Show "sources found" vs "sources used."
- Show retrieval lanes in `SearchPlanPanel`, not only queries.
- Make chat available from the saved server-side run, not dependent on fragile client auto-save.

Acceptance criteria:

- Existing results pages still render for all four research types.
- UI does not require a redesign.
- Share pages use the correct route and can render saved briefs.
- History items open the saved brief.
- Sources shown as "used" were actually present in the evidence pack.

## Implementation Phases

### Phase 0: Fix Current Trust Breaks

Purpose: remove avoidable broken loops before deeper work.

Tasks:

1. Fix history route loading:
   - `history/page.tsx` links to `/app/intelligence?brief=...`.
   - `page.tsx` must read the `brief` query param and load/render that saved brief.
2. Fix share URL:
   - `ShareButton` should copy the actual route used by the app.
3. Fix chat history:
   - Load latest messages, then render them oldest-to-newest.
4. Make generation durable:
   - Server should save the generated brief or return a durable run ID that the client can resume.
5. Fix provider timing labels:
   - Record real Exa, Tavily, internal, planner, synth, verifier timings.
6. Normalize snapshot evidence:
   - Any snapshot that influences synthesis must become citable evidence.

Acceptance criteria:

- A generated brief remains available after refresh.
- History item opens the correct saved brief.
- Share link opens a public page.
- Chat is available after generation without relying on a silent client-only save.
- Timings are not mislabeled by provider.

### Phase 1: Run Store and Observability

Purpose: make every run inspectable and debuggable.

Add migration:

- `intelligence_runs`
- `intelligence_retrieval_tasks`
- `intelligence_evidence_items`
- `intelligence_evidence_clusters`
- `intelligence_claims`
- `intelligence_provider_events`

Minimum fields:

- run id
- user id
- research type
- intent packet
- planner version
- plan JSON
- provider request metadata
- provider timing
- normalized evidence
- evidence pack
- claim map
- verifier result
- model/provider/token usage
- final brief id
- degraded reasons

Acceptance criteria:

- Every run has a durable record.
- Failed runs preserve enough metadata to debug the failure.
- Sensitive raw content is either omitted or size-limited according to project policy.
- Existing brief save/list behavior continues to work.

### Phase 2: Internal Corpus Provider

Purpose: use Relevant's owned source-platform intelligence before external APIs.

Tasks:

1. Add `internal-corpus.ts` provider.
2. Add adapters for internal articles, entity dossier evidence, living stories, and prior briefs.
3. Normalize internal results into the same evidence shape as Exa/Tavily.
4. Add internal lanes to all four research types.
5. Add fallback behavior when internal tables/RPCs are unavailable.

Acceptance criteria:

- Internal source-platform evidence can appear in final sources.
- Internal living-story deltas can drive "what changed since last time."
- External search is skipped or reduced when internal evidence is strong.
- Integration tests mock internal evidence and prove it reaches synthesis.

### Phase 3: Planner V2

Purpose: move from flat search tasks to research lanes.

Tasks:

1. Add intent packet builder.
2. Add user lens builder.
3. Add lane-based planner.
4. Add deterministic fallback lanes.
5. Update orchestrators to use planner V2 behind a feature flag.

Acceptance criteria:

- All four modes produce a valid `ResearchPlanV2`.
- Required lanes exist per mode.
- Planner output is stored in `intelligence_runs`.
- Old planner remains available behind rollback flag until V2 passes evals.

### Phase 4: Provider Capability Upgrade

Purpose: use Exa/Tavily/OpenRouter more deliberately.

Tasks:

1. Upgrade Exa adapter with lane-specific options.
2. Upgrade Tavily adapter with search/extract/map/crawl wrappers.
3. Capture Tavily answers as provider synthesis evidence.
4. Add strict OpenRouter schema path.
5. Add provider-specific unit tests.

Acceptance criteria:

- Exa and Tavily calls match lane purpose.
- Crawl/map/deep search are budget-gated.
- OpenRouter strict schema is used when supported.
- Provider failures degrade the run instead of breaking the entire brief when enough evidence remains.

### Phase 5: Evidence Graph and Pack

Purpose: stop losing important evidence before synthesis.

Tasks:

1. Add canonical URL dedupe.
2. Add content fingerprint dedupe.
3. Add clustering.
4. Add source role scoring.
5. Replace hard top-8 evidence with evidence-pack budgeting.
6. Add contradiction and unknown extraction.

Acceptance criteria:

- Evidence pack supports 20-40 evidence items within token budget.
- Multiple useful pages from one domain can survive ranking.
- Duplicate syndicated stories collapse into one cluster.
- Evidence pack includes contradictions and unknowns.

### Phase 6: Synthesis and Verification

Purpose: make output more reliable, cited, and decision-ready.

Tasks:

1. Update prompts to consume `EvidencePack`.
2. Add strict JSON schema output.
3. Add claim map.
4. Add citation verifier.
5. Add repair pass.
6. Add degraded status if verification fails.

Acceptance criteria:

- Every material claim has a valid citation.
- Every source shown as "used" was in the evidence pack.
- Unsupported claims are removed or marked as uncertain.
- Final brief still follows the Relevant standard: what happened, why it matters, what to do next.

### Phase 7: Memory and Follow-Up Chat

Purpose: make Relevant feel like it remembers the user's world.

Tasks:

1. Add prior memory service.
2. Add "new since last time" summary.
3. Upgrade chat to retrieve from saved evidence pack and optionally run follow-up retrieval.
4. Store chat evidence and cited source IDs.
5. Add suggested follow-ups from unknowns and weak evidence.

Acceptance criteria:

- Follow-up answers cite sources.
- Chat can answer questions about evidence not included in the first 10 displayed sources.
- Prior memory claims are backed by saved records.
- If the user asks for a fresh update, chat can run a small retrieval pass.

### Phase 8: Light UI/Data Wiring

Purpose: show better intelligence without redesigning the product.

Tasks:

1. Update `SearchPlanPanel` for lanes.
2. Update `SourcesStrip` for source role and "used in answer."
3. Add "New since last time" section when available.
4. Add source mix and verification status to `StatusBar`.
5. Make shared brief page use the same structured data as private results where possible.

Acceptance criteria:

- Existing visual direction remains intact.
- No page describes Relevant as a generic news feed.
- UI remains responsive on mobile.
- All four result types show source roles and used-source distinction.

### Phase 9: Evals, Rollout, and Metrics

Purpose: prove the engine got better before full rollout.

Add eval fixtures:

- Meeting prep: known account with internal history and fresh external news.
- Competitive: 3 competitors with overlapping announcements.
- Business case: build/buy/partner decision with counter-evidence.
- Market research: new market with mixed primary, analyst, and internal evidence.

Metrics:

- Time to first event
- Total run time
- Internal evidence hit rate
- External query count
- Source mix
- Claim citation coverage
- Verification pass rate
- Degraded run rate
- Follow-up chat usage
- Share rate
- User copy/export rate

Acceptance criteria:

- V2 beats V1 on citation coverage, internal-memory use, and human-rated actionability.
- P95 generation time stays within product target.
- Provider cost per successful brief is measured.
- Feature flag supports staged rollout and rollback.

## Query Formation Rules by Research Type

### Meeting Prep

Intent:

- Prepare user for a specific account, person, or meeting.
- Optimize for practical conversation leverage.

Required lanes:

- Internal prior coverage for account/person/topic.
- Entity dossier/company snapshot.
- Fresh company changes.
- People/attendee lane when attendees are supplied.
- First-party company/product lane.
- Risks/objections lane tied to what the user is selling.

Example query patterns:

- Internal: `{company} + user role + recent signal + account`
- Internal: prior briefs where entity matches `{company}` or attendees.
- Exa company: exact company snapshot.
- Exa people: attendee name + company + role.
- Tavily news: `{company} latest funding layoffs launch partnership lawsuit expansion`
- Tavily map/crawl: company site paths for pricing, customers, security, docs, case studies.

Output must answer:

- What changed recently?
- What does this account likely care about?
- What should the user say or ask?
- What risks or objections may surface?
- What has the user already seen before?

### Competitive Analysis

Intent:

- Help the user understand how competitors are moving and what to do.

Required lanes:

- Internal competitor story clusters.
- Company snapshots.
- Fresh news.
- Product/pricing/positioning first-party pages.
- Customer voice if available.
- Counter-evidence against the obvious narrative.

Example query patterns:

- Internal: competitor names + active signal clusters + last 180 days.
- Exa company: competitor exact pages.
- Exa financial report: public competitor financials.
- Tavily news: `{competitor} product launch pricing partnership customer`
- Tavily crawl: competitor product/pricing/case-study pages.

Output must answer:

- What changed?
- Which competitor move matters most?
- What is overhyped?
- Where is the opening?
- What should the user do next?

### Business Case

Intent:

- Help user make or justify a decision.

Required lanes:

- Internal signals connected to the initiative.
- Primary/source-of-truth lane.
- Market/customer evidence.
- Cost/risk evidence.
- Counter-evidence.
- Comparable examples.

Example query patterns:

- Internal: initiative keywords + role dimensions + prior business-case signals.
- Exa research/financial: studies, filings, market data.
- Tavily general/news/finance: fresh proof points.
- Tavily extract: known reports/articles with tables or embedded content.

Output must answer:

- Is the case strong, weak, or mixed?
- What evidence supports it?
- What evidence argues against it?
- Which assumptions are fragile?
- What should be tested next?

### Market Research

Intent:

- Map a market, its players, timing, and role-specific implications.

Required lanes:

- Internal living stories by market theme.
- Fresh market news.
- Research/analyst/primary evidence.
- Known player snapshots.
- Customer/problem evidence.
- Countertrend lane.

Example query patterns:

- Internal: market topic + user role + living story clusters.
- Exa research paper: topic + adoption/challenges.
- Exa company: known player snapshots.
- Exa financial report: public company exposure.
- Tavily news/finance: market funding, regulation, adoption, failures.

Output must answer:

- What is real now?
- What is changing?
- Who matters?
- What is uncertain?
- What should the user watch or do next?

## Coding Agent Workstreams

Use these as subagent assignments. Each agent should work on its owned area, avoid broad refactors, and leave unrelated UI/style untouched.

### Agent A: Current Flow Repairs

Owns:

- History load
- Share URL
- Chat history ordering
- Server-side run durability
- Provider timing labels

Likely files:

- `src/app/app/intelligence/page.tsx`
- `src/app/app/intelligence/history/page.tsx`
- `src/app/app/intelligence/results/shared/ShareButton.tsx`
- `src/app/api/intelligence/chat/route.ts`
- `src/app/api/intelligence/briefs/route.ts`
- `src/lib/intelligence/db.ts`

Acceptance criteria:

- Refresh-safe generated brief.
- Working history open.
- Working share link.
- Latest chat history loaded correctly.
- Accurate timing labels.

### Agent B: Internal Corpus Provider

Owns:

- Internal provider implementation
- Supabase queries/RPC calls
- Internal evidence normalization
- Prior memory raw retrieval

Likely files:

- `src/lib/intelligence/providers/internal-corpus.ts`
- `src/lib/intelligence/normalize.ts`
- `src/lib/intelligence/contracts.ts`
- `src/lib/intelligence/db.ts`

Acceptance criteria:

- Internal results normalize into evidence.
- Internal provider failure degrades cleanly.
- Tests prove internal evidence reaches a generated brief.

### Agent C: Planner V2

Owns:

- Intent packet
- User lens
- Lane-based planner
- Fallback planner

Likely files:

- `src/lib/intelligence/planner/*`
- `src/lib/intelligence/search-planner.ts`
- `src/lib/intelligence/orchestrators/*`
- `src/lib/intelligence/contracts.ts`

Acceptance criteria:

- Valid lane plan for all four modes.
- Required internal, primary, and counter-evidence lanes where applicable.
- Planner output persisted.

### Agent D: Provider Adapters

Owns:

- Exa capability upgrade
- Tavily capability upgrade
- OpenRouter strict schema route
- Provider request tests

Likely files:

- `src/lib/intelligence/providers/exa.ts`
- `src/lib/intelligence/providers/tavily.ts`
- `src/lib/intelligence/openrouter.ts`
- `src/lib/intelligence/model-selection.ts`

Acceptance criteria:

- Lane-specific provider request shapes.
- Budget-gated map/crawl/deep calls.
- Strict schema output path with fallback.
- Provider tests pass without live API keys.

### Agent E: Evidence Graph

Owns:

- URL canonicalization
- Dedupe
- Clustering
- Scoring
- Evidence pack construction

Likely files:

- `src/lib/intelligence/evidence/*`
- `src/lib/intelligence/ranker.ts`
- `src/lib/intelligence/normalize.ts`
- `src/lib/intelligence/contracts.ts`

Acceptance criteria:

- No hard one-source-per-domain loss.
- Story clusters work.
- Evidence pack is deterministic and token-budgeted.

### Agent F: Synthesis and Verification

Owns:

- Evidence-pack prompts
- Claim map
- Citation verifier
- Repair pass
- Degraded status handling

Likely files:

- `src/lib/intelligence/prompts/*`
- `src/lib/intelligence/openrouter.ts`
- `src/lib/intelligence/verifier/*`
- `src/lib/intelligence/orchestrators/*`

Acceptance criteria:

- Missing citations cannot ship silently.
- Unsupported claims are repaired or degraded.
- Brief output remains compatible with existing result components.

### Agent G: Results, Chat, and Memory UX

Owns:

- New since last time data display
- Source role display
- Used-source distinction
- Chat retrieval from evidence pack
- Shared brief parity

Likely files:

- `src/app/app/intelligence/results/*`
- `src/app/app/intelligence/results/shared/*`
- `src/app/api/intelligence/chat/route.ts`
- `src/app/intelligence/share/*` or current share route files

Acceptance criteria:

- Existing UI remains visually stable.
- Users can see why an answer was produced.
- Chat cites saved or freshly retrieved evidence.
- Shared page does not lose the important sections.

### Agent H: Evals and QA

Owns:

- Test fixtures
- Mock provider tests
- Orchestrator integration tests
- Browser smoke tests
- Rollout checklist

Likely files:

- `src/lib/intelligence/__tests__/*`
- new test fixtures under `src/lib/intelligence/__fixtures__/*`
- Playwright or app-level smoke tests if the repo already has them

Acceptance criteria:

- `npm run lint`
- `npm run typecheck`
- `npm test`
- Four mocked end-to-end intelligence fixtures pass.
- Manual QA checklist covers all four modes, history, share, and chat.

## Testing Plan

### Unit Tests

Add tests for:

- Intent packet builder
- User lens builder
- Planner V2 lane requirements
- Internal corpus provider mapping
- Exa request option sanitization
- Tavily request option mapping
- URL canonicalization
- Evidence clustering
- Evidence scoring
- Evidence pack truncation
- Citation verifier
- OpenRouter strict schema payload

### Integration Tests

Add mocked provider tests for:

- Meeting prep with internal memory and one fresh external gap.
- Competitive analysis with same-domain first-party pages preserved.
- Business case with counter-evidence required.
- Market research with story clusters and known players.

### UI/Flow Tests

Add browser or component smoke tests for:

- Generate brief.
- Refresh generated brief.
- Open from history.
- Copy/open share link.
- Ask follow-up chat question.
- Display used-source badge.
- Display prior-memory section when available.

### Live Provider Tests

Keep gated by environment variables:

- `EXA_API_KEY`
- `TAVILY_API_KEY`
- `OPENROUTER_API_KEY`
- `INTELLIGENCE_LIVE_PROVIDER_TESTS=true`

Live tests should verify only thin smoke paths. Do not make normal CI depend on external APIs.

## Rollout Strategy

Feature flags:

- `INTELLIGENCE_ENGINE_V2_ENABLED`
- `INTELLIGENCE_INTERNAL_CORPUS_ENABLED`
- `INTELLIGENCE_PLANNER_V2_ENABLED`
- `INTELLIGENCE_EVIDENCE_PACK_ENABLED`
- `INTELLIGENCE_VERIFIER_ENABLED`
- `INTELLIGENCE_PROVIDER_DEEP_SEARCH_ENABLED`
- `INTELLIGENCE_TAVILY_CRAWL_ENABLED`

Rollout order:

1. Ship Phase 0 repairs.
2. Add run store with no behavior change.
3. Add internal provider in shadow mode.
4. Add planner V2 in shadow mode.
5. Compare V1 vs V2 evidence packs.
6. Enable V2 for internal/testing accounts.
7. Enable V2 for a small user percentage.
8. Roll out once quality, latency, and cost are stable.

Rollback:

- V1 planner and synthesis path should remain callable until V2 has passed evals and production telemetry for at least one full cycle.

## Quality Bar

The upgraded engine is acceptable only if:

- It uses internal memory when available.
- It avoids claiming prior coverage unless backed by data.
- It cites every material claim.
- It distinguishes facts, inferences, and recommendations.
- It names what changed since prior coverage.
- It shows what evidence was used, not just what was found.
- It can explain weak evidence or missing data.
- It stays within product latency and cost targets.
- It preserves the current UI quality while making the answer smarter.

## First Coding-Agent Prompt

Use this prompt to start implementation:

```text
You are working in /Users/akshitsama/Desktop/Website. Read docs/PLAN_INTELLIGENCE_CORE_ENGINE_UPGRADE_2026-04-21.md first.

Start with Phase 0 only. Fix the current trust breaks before building the V2 engine:
1. Generated briefs must be durable after refresh.
2. History must open saved briefs.
3. Share links must use the actual public share route.
4. Chat must load the latest messages correctly.
5. Provider timing labels must reflect actual provider timings.
6. Any snapshot evidence that influences synthesis must be normalized into citable evidence.

Keep changes tightly scoped. Do not redesign the UI. Do not modify unrelated files. Add focused tests. Run npm run lint, npm run typecheck, and npm test before finishing. Report changed files, behavior changed, and any remaining risks.
```

After Phase 0 is complete, start a new coding-agent run for Phase 1. Do not mix all phases in one giant change.
