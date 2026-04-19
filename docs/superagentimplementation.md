# WS8: Super-Agent Personalization — Enrich UserContext, Intent Layer, Feedback Loop

**Status:** Planning — ready to execute
**Priority:** Highest — the brief feels generic because the LLM only sees 3 strings (role/industry/company names). This workstream turns Relevant from a "business-desk briefing with name-tags stapled on" into a genuinely personalized super-agent.
**Scope:** Backend-only (edge functions, shared modules, DB migrations). No frontend changes in Phases 1–4. Frontend only touched in Phase 5 (feedback capture affordances already partially exist).
**Estimated total effort:** 6 phases, ~11 discrete tasks. Each phase ships independently and is reversible via feature flag.

---

## 0. Executive Summary (for the coding agent)

This document is the authoritative execution plan. **You (the coding agent) will work through it phase-by-phase.** Each phase has:

1. **Scope** — one paragraph plain-English goal.
2. **Sub-agent delegation instructions** — when to use `Explore`, `Plan`, `general-purpose`, and how to brief them.
3. **Files to modify / create** — exact paths and line ranges.
4. **Migration SQL** — full SQL bodies where DB changes are needed.
5. **Type changes** — exact TypeScript signatures.
6. **Implementation notes** — pseudocode and critical call-sites.
7. **Acceptance criteria** — testable, binary pass/fail conditions.
8. **Tests** — what to verify and how.
9. **Feature flag + rollback** — how to ship dark, how to undo.

**Rules for you, the coding agent:**

- Do NOT skip the sub-agent delegation step. If a phase says "spawn Explore agent first", do that — do not start editing until you have that report.
- Commit after each phase. Never batch. Use the commit message template at the end of each phase.
- Run the acceptance tests at the end of each phase before moving on.
- If a phase blocks for a reason not documented here, stop and write a note in `docs/implementation/WS8-BLOCKERS.md`, then ask the user.
- All new env vars go in the phase that introduces them AND in the central config listed in §8.
- Do not change behavior for users unless their flag is on. Default all new flags to `false` until Phase 6.

---

## 1. Problem Statement

See [WS8 research summary in PR discussion / session notes] — the founder's critique:

> "We have all this user profile data. Why are we asking them what their company is? When we do the synthesis, I'm not feeling the true power of Relevant. We should move the user — we need intent, because we know them."

Audit findings (verified in codebase):

1. The LLM system prompt at [brief-llm.ts:407-419](../../supabase/functions/_shared/brief-llm.ts#L407) injects only `role`, `industry`, `company` **as strings**. No sector, stage, size, location, goals, or history.
2. Goals are gated behind `GOAL_BIAS_ENABLED=false` by default ([pro-brief-generate/index.ts:148](../../supabase/functions/pro-brief-generate/index.ts#L148)).
3. Country/timezone are collected in onboarding but never reach brief synthesis ([article-fetcher.ts:137-145](../../supabase/functions/_shared/article-fetcher.ts#L137)).
4. `companies` table has no sector/stage/size columns ([20260206180000_restore_roles_and_companies.sql:53-62](../../supabase/migrations/20260206180000_restore_roles_and_companies.sql#L53)).
5. No feedback loop — user actions (share, dismiss, deep dive) do not alter dimension weights or synthesis style.
6. Rejection examples in the prompt are universal, not user-contextual ([brief-llm.ts:451-457](../../supabase/functions/_shared/brief-llm.ts#L451)).
7. "Why showing" line is generated **post-hoc** ([brief-llm.ts:290-353](../../supabase/functions/_shared/brief-llm.ts#L290)), not fed into the synthesis prompt.
8. No pre-synthesis intent layer — the LLM receives a bundle of signals with no ordering principle.

Target state: a rich `UserContext` → intent layer → personalized synthesis → feedback loop.

---

## 2. Architecture Before / After

### Before (today)

```
Edge fn → getUserContext() → { userId, role, industry, company, country?, cohortId }
        → buildFreshBrief() → scoring → buildBriefSystemPrompt(role, industry, company)
        → LLM call → save
```

### After (this workstream)

```
Edge fn → getEnrichedUserContext() ──┐
                                     ├─ company metadata (sector/stage/size/description)
                                     ├─ location (country/tz/city)
                                     ├─ active goals (from pro_goals, unconditional)
                                     ├─ role concerns (from role_concerns lookup)
                                     └─ recent feedback weights (from signal_feedback)

        → intentLayer(context, candidates) → top intent + priority ordering
        → buildFreshBrief() → scoring → buildPersonalizedSystemPrompt(enrichedCtx, intent)
        → LLM call → save
        → on user action → writeFeedback() → updateDimensionWeights()
```

---

## 3. Global Conventions (applies to all phases)

### 3.1 File / path conventions

| What | Where |
|------|-------|
| New shared types | `supabase/functions/_shared/brief-types.ts` (extend existing `UserContext`) |
| New enrichment logic | `supabase/functions/_shared/user-context-enrich.ts` (NEW file) |
| Role concerns data + loader | `supabase/functions/_shared/role-concerns.ts` (NEW file) |
| Intent layer | `supabase/functions/_shared/brief-intent.ts` (NEW file) |
| Feedback writer | `supabase/functions/pro-signal-feedback/index.ts` (NEW edge fn) |
| Feedback weight applier | `supabase/functions/_shared/feedback-weights.ts` (NEW file) |
| Prompt builder changes | `supabase/functions/_shared/brief-llm.ts` (MODIFY `buildBriefSystemPrompt`) |
| DB migrations | `supabase/migrations/YYYYMMDDHHMMSS_<phase>_<slug>.sql` |

### 3.2 Feature flags (add to `supabase/functions/_shared/runtime-config.ts`)

```typescript
export const WS8_FLAGS = {
  ENRICHED_USER_CONTEXT: Deno.env.get("WS8_ENRICHED_CTX") === "true",
  ROLE_CONCERNS: Deno.env.get("WS8_ROLE_CONCERNS") === "true",
  INTENT_LAYER: Deno.env.get("WS8_INTENT_LAYER") === "true",
  FEEDBACK_LOOP: Deno.env.get("WS8_FEEDBACK_LOOP") === "true",
  DYNAMIC_REJECTION: Deno.env.get("WS8_DYNAMIC_REJECTION") === "true",
};
```

All flags default to `false` until Phase 6 rollout. Each phase reads its flag and falls back to existing behavior if off.

### 3.3 Logging

Every new code path emits a structured log prefixed with `[WS8:<phase>]` so rollout and A/B comparison is easy in Supabase logs.

Example:
```typescript
console.log(`[WS8:intent] user=${userId} top_intent="${intent.label}" score=${intent.score}`);
```

### 3.4 Commit message template (per phase)

```
WS8-P<n>: <short phase summary>

<bullet list of what changed>

Feature-flag: <flag_name> (default false)
Migration: <migration_filename or "none">
```

---

## 4. Phase 1 — Enrich UserContext

### 4.1 Scope

Expand the `UserContext` object from 7 basic string fields to a rich persona object that includes: company metadata (sector/stage/size), full location block (country/timezone/city), active goals (unconditional), and recent feedback weights.

### 4.2 Sub-agent delegation — DO FIRST

Before writing code, you MUST spawn this Explore agent in parallel with Phase 2's Explore task (independent work — use one message, two tool calls):

**Agent 1 — Explore (thoroughness: very thorough)**

```
Prompt:
Audit the current UserContext loading path. I need a precise map of:

1. Every call site of getUserContext() across the codebase (file:line).
2. Every place `UserContext` fields are READ (not just imported). I need to know
   what breaks if I add new fields vs change existing ones.
3. The exact columns in `users`, `companies`, `user_settings`, and `pro_goals`
   tables — dump every column with type and nullability from the latest migration.
4. Where country/timezone are stored today (users.country vs user_settings.location_country?
   Both? Which is canonical?). Check `pro-signal-build/story-builder.ts:644-646` —
   it does a `||` fallback between them. Why?
5. Find any existing "company enrichment" or "company metadata" code — maybe in
   onboarding flow. We may already have sector/stage fetched somewhere.

Report in under 500 words, with file:line references. This drives a code change
so accuracy matters more than coverage.
```

### 4.3 Database migration

**File:** `supabase/migrations/<timestamp>_ws8_p1_enrich_companies_and_context.sql`

```sql
-- WS8 Phase 1: Enrich companies table + add user_context_cache

-- ============================================================
-- COMPANIES: add enrichment columns
-- ============================================================
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS sector text,
  ADD COLUMN IF NOT EXISTS sub_sector text,
  ADD COLUMN IF NOT EXISTS stage text CHECK (stage IN ('pre_seed','seed','series_a','series_b','series_c_plus','public','bootstrapped','unknown')),
  ADD COLUMN IF NOT EXISTS size_bucket text CHECK (size_bucket IN ('1-10','11-50','51-200','201-1000','1001-5000','5000+','unknown')),
  ADD COLUMN IF NOT EXISTS business_model text,  -- 'b2b_saas', 'b2c_marketplace', 'd2c', 'enterprise_services', etc.
  ADD COLUMN IF NOT EXISTS primary_geography text,  -- country code of HQ or main market
  ADD COLUMN IF NOT EXISTS description text,  -- 1-2 sentences — what the company does
  ADD COLUMN IF NOT EXISTS enrichment_source text,  -- 'manual', 'clearbit', 'llm', etc.
  ADD COLUMN IF NOT EXISTS enrichment_updated_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_companies_sector ON public.companies(sector) WHERE sector IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_companies_stage ON public.companies(stage) WHERE stage IS NOT NULL;

COMMENT ON COLUMN public.companies.sector IS 'Coarse-grained sector (e.g. "Fintech", "Healthtech", "Logistics"). Populated by enrichment job.';
COMMENT ON COLUMN public.companies.business_model IS 'Revenue/market model. Drives which signals are materially relevant.';

-- ============================================================
-- USER_CONTEXT_CACHE: denormalized snapshot for fast brief generation
-- ============================================================
-- Not strictly required, but avoids 5 joins on every brief. Refreshed on profile change.
CREATE TABLE IF NOT EXISTS public.user_context_cache (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  context jsonb NOT NULL,
  version int NOT NULL DEFAULT 1,
  refreshed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_context_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_context_cache_select_own ON public.user_context_cache;
CREATE POLICY user_context_cache_select_own ON public.user_context_cache
  FOR SELECT USING (auth.uid() = user_id);

-- Service role writes only (edge functions use service_role).
```

### 4.4 Type changes

**File:** [supabase/functions/_shared/brief-types.ts:26-38](../../supabase/functions/_shared/brief-types.ts#L26)

Extend the existing `UserContext` type:

```typescript
export type CompanyMeta = {
  companyId: string | null;
  name: string | null;
  sector: string | null;
  subSector: string | null;
  stage: 'pre_seed'|'seed'|'series_a'|'series_b'|'series_c_plus'|'public'|'bootstrapped'|'unknown' | null;
  sizeBucket: '1-10'|'11-50'|'51-200'|'201-1000'|'1001-5000'|'5000+'|'unknown' | null;
  businessModel: string | null;
  primaryGeography: string | null;  // ISO-2 country code
  description: string | null;       // 1-2 sentences
};

export type LocationBlock = {
  country: string | null;    // ISO-2
  countryLabel: string | null; // "Singapore"
  timezone: string | null;   // "Asia/Singapore"
  city: string | null;
  province: string | null;
};

export type ActiveGoal = {
  goalId: string;
  goalType: string;  // matches GoalType union
  goalStatus: string;
  concernKeywords: string[];  // derived from goal type → what signals matter
  startedAt: string;
};

export type FeedbackSummary = {
  totalActions: number;
  preferredDimensions: string[];       // top-5 dimension_slugs by positive signal
  deprioritizedDimensions: string[];   // top-5 dimension_slugs by dismiss rate
  preferredConsequenceTypes: string[]; // e.g. ['financial','regulatory']
  avgDeepDiveRate: number;             // 0..1
};

export type UserContext = {
  // existing (keep backwards-compatible)
  userId: string;
  fullName: string | null;
  email: string | null;
  roleName: string | null;
  industryName: string | null;
  companyName: string | null;
  countryName?: string | null;          // keep — story-builder depends on it
  profilePassage?: string | null;
  cohortId?: string | null;
  writingInstructions?: string | null;

  // WS8: enriched fields (all optional for backwards-compat during rollout)
  company?: CompanyMeta | null;
  location?: LocationBlock | null;
  activeGoals?: ActiveGoal[];
  roleConcerns?: RoleConcerns | null;   // defined in Phase 2
  feedback?: FeedbackSummary | null;    // defined in Phase 5
  enriched?: boolean;                    // true if WS8 enrichment ran
};
```

### 4.5 Implementation

**New file:** `supabase/functions/_shared/user-context-enrich.ts`

```typescript
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type {
  UserContext, CompanyMeta, LocationBlock, ActiveGoal, FeedbackSummary
} from "./brief-types.ts";
import { WS8_FLAGS } from "./runtime-config.ts";

export async function enrichUserContext(
  supabase: SupabaseClient,
  base: UserContext,
): Promise<UserContext> {
  if (!WS8_FLAGS.ENRICHED_USER_CONTEXT) return base;

  const [company, location, goals] = await Promise.all([
    loadCompanyMeta(supabase, base.userId),
    loadLocation(supabase, base.userId),
    loadActiveGoals(supabase, base.userId),
  ]);

  return {
    ...base,
    company,
    location,
    activeGoals: goals,
    enriched: true,
  };
}

async function loadCompanyMeta(supabase: SupabaseClient, userId: string): Promise<CompanyMeta | null> {
  const { data: user } = await supabase
    .from("users")
    .select("company_id, company_name_manual")
    .eq("id", userId)
    .maybeSingle();
  if (!user?.company_id) {
    return user?.company_name_manual
      ? { companyId: null, name: user.company_name_manual, sector: null, subSector: null,
          stage: null, sizeBucket: null, businessModel: null, primaryGeography: null, description: null }
      : null;
  }
  const { data: co } = await supabase
    .from("companies")
    .select("id, name, sector, sub_sector, stage, size_bucket, business_model, primary_geography, description")
    .eq("id", user.company_id).maybeSingle();
  if (!co) return null;
  return {
    companyId: co.id as string,
    name: co.name as string,
    sector: (co.sector as string) ?? null,
    subSector: (co.sub_sector as string) ?? null,
    stage: (co.stage as any) ?? null,
    sizeBucket: (co.size_bucket as any) ?? null,
    businessModel: (co.business_model as string) ?? null,
    primaryGeography: (co.primary_geography as string) ?? null,
    description: (co.description as string) ?? null,
  };
}

async function loadLocation(supabase: SupabaseClient, userId: string): Promise<LocationBlock | null> {
  const [usersRow, settingsRow] = await Promise.all([
    supabase.from("users").select("country, province, city, timezone").eq("id", userId).maybeSingle(),
    supabase.from("user_settings").select("location_country").eq("user_id", userId).maybeSingle(),
  ]);
  const country = settingsRow.data?.location_country || usersRow.data?.country || null;
  if (!country && !usersRow.data?.timezone) return null;
  return {
    country,
    countryLabel: country ? resolveCountryLabel(country) : null, // reuse existing helper from story-builder
    timezone: usersRow.data?.timezone ?? null,
    city: usersRow.data?.city ?? null,
    province: usersRow.data?.province ?? null,
  };
}

async function loadActiveGoals(supabase: SupabaseClient, userId: string): Promise<ActiveGoal[]> {
  const { data } = await supabase
    .from("pro_goals")
    .select("id, goal_type, goal_status, started_at")
    .eq("user_id", userId)
    .eq("archived", false)
    .order("started_at", { ascending: false })
    .limit(3);
  if (!data) return [];
  return data.map((g: any) => ({
    goalId: g.id, goalType: g.goal_type, goalStatus: g.goal_status,
    startedAt: g.started_at, concernKeywords: goalTypeToConcerns(g.goal_type),
  }));
}

function goalTypeToConcerns(goalType: string): string[] {
  // Hard-coded map — small, explicit, reviewed.
  const m: Record<string, string[]> = {
    save_money: ['pricing','cost_reduction','supplier_contracts','automation','tax','interest_rates'],
    learn_skill: ['training','certifications','courses','tooling_changes','best_practices'],
    career_growth: ['hiring','promotions','compensation','role_evolution','industry_moves'],
    grow_business: ['market_demand','competitor_moves','funding','customer_acquisition','expansion'],
    health: ['wellness','clinical_research','regulations','product_recalls'],
  };
  return m[goalType] ?? [];
}
```

**Modify:** [supabase/functions/_shared/article-fetcher.ts:84-146](../../supabase/functions/_shared/article-fetcher.ts#L84)

Add a single line at the end of `getUserContext()`:

```typescript
// existing return { ... }
const base: UserContext = { /* existing fields */ };
return await enrichUserContext(supabase, base);  // no-op if flag off
```

**Modify:** [supabase/functions/pro-brief-generate/index.ts:511-530](../../supabase/functions/pro-brief-generate/index.ts#L511)

No direct change needed — enrichment happens inside `getUserContext`. But add a log line after load:

```typescript
if (userCtx.enriched) {
  console.log(`[WS8:p1] enriched ctx: sector=${userCtx.company?.sector} stage=${userCtx.company?.stage} goals=${userCtx.activeGoals?.length ?? 0}`);
}
```

### 4.6 Sub-agent delegation — company enrichment seed

To populate company metadata for existing rows, spawn a `general-purpose` agent to write a one-shot script:

```
Agent type: general-purpose
Prompt:
Write a TypeScript script at `scripts/ws8/enrich-companies.ts` that:
1. Connects to Supabase via SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY env vars.
2. Fetches all companies where sector IS NULL, in batches of 20.
3. For each company, calls OpenAI (model gpt-4o-mini) with a strict JSON-schema prompt:
   "Given company name=X and domain=Y, output {sector, sub_sector, stage, size_bucket,
    business_model, primary_geography, description}. Unknown → null."
4. Writes back to companies table with enrichment_source='llm', enrichment_updated_at=now().
5. Logs progress, handles rate limits (5s backoff on 429), idempotent.

Do not deploy or run. Just write the script. Include a README section explaining
how to run it manually against staging first. Output files only; under 200 lines.
```

### 4.7 Acceptance criteria (Phase 1)

- [ ] Migration applies cleanly to staging; `companies` table has 8 new columns.
- [ ] `WS8_ENRICHED_CTX=false` → brief output byte-identical to pre-change (regression test).
- [ ] `WS8_ENRICHED_CTX=true` + seeded company → `userCtx.company.sector` populated in edge logs.
- [ ] `WS8_ENRICHED_CTX=true` + user with `pro_goals` row → `userCtx.activeGoals.length > 0`.
- [ ] `UserContext` TypeScript type compiles across all call sites (run `deno check supabase/functions/**/*.ts`).
- [ ] No call site reads a new field without optional chaining (grep verification: `userCtx.company.` should fail; `userCtx.company?.` should exist).

### 4.8 Tests

Since the repo has no test harness yet (verified via `find . -name "*.test.ts"` returned empty), create a test harness in this phase.

**New file:** `supabase/functions/_shared/__tests__/user-context-enrich.test.ts`

```typescript
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { enrichUserContext } from "../user-context-enrich.ts";

Deno.test("enrichUserContext is pass-through when flag off", async () => {
  Deno.env.set("WS8_ENRICHED_CTX", "false");
  const base = { userId: "u1", roleName: "PM", industryName: "Fintech", companyName: "Acme", /* ... */ } as any;
  const mockSupabase = {} as any;  // should never be called
  const result = await enrichUserContext(mockSupabase, base);
  assertEquals(result, base);
});

Deno.test("enrichUserContext loads company meta when flag on", async () => {
  Deno.env.set("WS8_ENRICHED_CTX", "true");
  const base = { userId: "u1", roleName: "PM", industryName: "Fintech", companyName: "Acme" } as any;
  const mockSupabase = mockSupabaseWithCompany({ id: "c1", name: "Acme", sector: "Fintech", stage: "series_a" });
  const result = await enrichUserContext(mockSupabase, base);
  assertEquals(result.company?.sector, "Fintech");
  assertEquals(result.company?.stage, "series_a");
  assertEquals(result.enriched, true);
});

// ... mockSupabaseWithCompany helper
```

Run: `deno test supabase/functions/_shared/__tests__/`

### 4.9 Rollback

- `WS8_ENRICHED_CTX=false` (immediate).
- Migration is additive (only `ADD COLUMN`, no drops) — leaving columns unused is safe. Do not revert the migration.

### 4.10 Commit

```
WS8-P1: Enrich UserContext with company metadata, location, goals

- Add CompanyMeta/LocationBlock/ActiveGoal to brief-types.ts
- New user-context-enrich.ts loader (flag-gated)
- Migration: companies table +8 cols, user_context_cache table
- Dev script scripts/ws8/enrich-companies.ts (not run)

Feature-flag: WS8_ENRICHED_CTX (default false)
Migration: <timestamp>_ws8_p1_enrich_companies_and_context.sql
```

---

## 5. Phase 2 — Role-Concerns Lookup

### 5.1 Scope

Today the LLM is told "Role: Product Manager" as a bare string. It has no map of what a PM cares about vs. a CFO. Add a lookup table that maps role → concern keywords, less-relevant topics, and preferred consequence types. Seed it for the top 10 roles already in the `roles` table.

### 5.2 Sub-agent delegation

**Agent 1 — general-purpose (runs in parallel with Phase 1 Explore)**

```
Agent type: general-purpose
Prompt:
Research role → concerns mapping. For each of these roles, produce a structured
JSON object: { role_slug, key_concerns: string[], less_relevant: string[],
preferred_consequence_types: string[] }.

Roles to cover (matches public.roles seed):
- founder-ceo
- head-of-operations
- operations-manager
- head-of-product
- product-manager
- head-of-sales
- head-of-finance
- general-counsel
- head-of-hr
- head-of-it

key_concerns: 6-10 topics this role lives and dies by (what signals grab attention).
less_relevant: 3-5 topics that often bubble up in news but this role shouldn't be paged for.
preferred_consequence_types: subset of ['financial','competitive','operational','regulatory','talent','reputational','strategic','technical'].

Output as a single TypeScript export: `export const ROLE_CONCERNS_SEED: RoleConcernsRow[] = [...]`.
Write to `supabase/functions/_shared/role-concerns-seed.ts`. Under 200 lines.
Be specific: "cash flow" not "money"; "unit economics" not "profit".
```

### 5.3 Database migration

**File:** `supabase/migrations/<timestamp>_ws8_p2_role_concerns.sql`

```sql
-- WS8 Phase 2: Role concerns lookup
CREATE TABLE IF NOT EXISTS public.role_concerns (
  role_slug text PRIMARY KEY,
  key_concerns text[] NOT NULL DEFAULT '{}',
  less_relevant text[] NOT NULL DEFAULT '{}',
  preferred_consequence_types text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.role_concerns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS role_concerns_select_all ON public.role_concerns;
CREATE POLICY role_concerns_select_all ON public.role_concerns FOR SELECT USING (true);

-- Seed data inserted via separate SQL file generated from role-concerns-seed.ts.
-- Commit the seed as a SQL insert inside the SAME migration file — do not split.
-- (The coding agent: read role-concerns-seed.ts, convert to INSERT ... ON CONFLICT statements,
--  append to this migration file before applying.)
```

### 5.4 Type additions

Add to `brief-types.ts`:

```typescript
export type RoleConcerns = {
  roleSlug: string;
  keyConcerns: string[];
  lessRelevant: string[];
  preferredConsequenceTypes: string[];
};
```

### 5.5 Implementation

**New file:** `supabase/functions/_shared/role-concerns.ts`

```typescript
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { RoleConcerns } from "./brief-types.ts";
import { WS8_FLAGS } from "./runtime-config.ts";

const CACHE = new Map<string, RoleConcerns>();
let CACHE_LOADED_AT = 0;
const TTL_MS = 15 * 60 * 1000;

export async function getRoleConcerns(
  supabase: SupabaseClient,
  roleId: string | null,
): Promise<RoleConcerns | null> {
  if (!WS8_FLAGS.ROLE_CONCERNS || !roleId) return null;
  await ensureCache(supabase);
  // Resolve role_id → role_slug (may require one-time join cache)
  const slug = await resolveRoleSlug(supabase, roleId);
  if (!slug) return null;
  return CACHE.get(slug) ?? null;
}

async function ensureCache(supabase: SupabaseClient) {
  if (Date.now() - CACHE_LOADED_AT < TTL_MS && CACHE.size > 0) return;
  const { data } = await supabase.from("role_concerns").select("*");
  CACHE.clear();
  for (const row of data ?? []) {
    CACHE.set(row.role_slug, {
      roleSlug: row.role_slug,
      keyConcerns: row.key_concerns ?? [],
      lessRelevant: row.less_relevant ?? [],
      preferredConsequenceTypes: row.preferred_consequence_types ?? [],
    });
  }
  CACHE_LOADED_AT = Date.now();
}

// resolveRoleSlug: small helper, query roles table.
```

**Modify:** `user-context-enrich.ts` → also load role concerns:

```typescript
const [company, location, goals, roleConcerns] = await Promise.all([
  loadCompanyMeta(supabase, base.userId),
  loadLocation(supabase, base.userId),
  loadActiveGoals(supabase, base.userId),
  getRoleConcerns(supabase, /* roleId */),
]);
return { ...base, company, location, activeGoals: goals, roleConcerns, enriched: true };
```

### 5.6 Acceptance criteria (Phase 2)

- [ ] Migration applies; `role_concerns` table has ≥10 seed rows.
- [ ] `WS8_ROLE_CONCERNS=true` + user with `role_id` matching a seeded role → `userCtx.roleConcerns.keyConcerns.length > 0`.
- [ ] Seed quality: reviewed by user. Concerns are specific ("unit economics" not "money"). [Gate: human review required before merge.]
- [ ] Cache TTL works: second call within 15min does not re-query DB.
- [ ] `WS8_ROLE_CONCERNS=false` → `userCtx.roleConcerns` is `null`.

### 5.7 Tests

`supabase/functions/_shared/__tests__/role-concerns.test.ts` — mock supabase, assert cache behavior, assert null when flag off, assert correct slug resolution.

### 5.8 Commit

```
WS8-P2: Role-concerns lookup table + seed

- New role_concerns table + RLS
- Seed: 10 roles matching public.roles seed
- role-concerns.ts loader with 15min cache
- enrichUserContext now attaches roleConcerns

Feature-flag: WS8_ROLE_CONCERNS (default false)
Migration: <timestamp>_ws8_p2_role_concerns.sql
```

---

## 6. Phase 3 — Rewrite System Prompt (Rich Persona Block)

### 6.1 Scope

The highest-leverage change. Replace the 3-line profile block in `buildBriefSystemPrompt` with a rich persona block that uses every `UserContext` field. Feed matched dimensions INTO the prompt (not post-hoc). Make rejection examples dynamic.

### 6.2 Sub-agent delegation — Plan agent

Before writing, spawn a Plan agent to pressure-test the prompt design:

```
Agent type: Plan
Prompt:
I'm about to rewrite the brief system prompt at
supabase/functions/_shared/brief-llm.ts:398-490. Current state: 3-line profile
(role/industry/company strings). Target state: rich persona block that includes
company sector/stage/size, location, active goals, role concerns, matched dimensions.

I have two design choices to validate:

A) One monolithic persona block in the system prompt (simpler, more tokens per call).
B) Split the persona into the system prompt, and pass matched dimensions + rejection
   rules via the per-event user message (fewer tokens but prompt-cache invalidates
   more often since user messages change).

Given we call this LLM per-event in parallel (brief-llm.ts line ~500+), which
approach preserves prompt caching better? Anthropic prompt caching requires
identical prefixes. What should live in system prompt vs user message?

Also: the current prompt has "REJECTION EXAMPLES" as a static list (lines 451-457).
These should become user-specific ("City parade traffic → reject UNLESS user is in
logistics/supply chain"). Should these be rules in the system prompt or filtered
client-side before sending to LLM? Trade-offs?

Output: a 300-word recommendation, then a concrete prompt skeleton with
placeholder sections. No code.
```

### 6.3 Implementation

**Modify:** [supabase/functions/_shared/brief-llm.ts:398-491](../../supabase/functions/_shared/brief-llm.ts#L398)

Replace `buildBriefSystemPrompt` with a version that takes the full `UserContext`:

```typescript
function buildBriefSystemPrompt(
  ctx: UserContext,
  matchedDimensions: string[],
  instructionControls: string,
): string {
  // Fall back to legacy prompt if context not enriched (flag off or missing data)
  if (!ctx.enriched || !WS8_FLAGS.ENRICHED_USER_CONTEXT) {
    return buildLegacyBriefSystemPrompt({
      role: ctx.roleName, industry: ctx.industryName,
      company: ctx.companyName, full_name: ctx.fullName,
    }, instructionControls);
  }

  const persona = buildPersonaBlock(ctx);
  const rejectionRules = buildDynamicRejectionRules(ctx);
  const dimensionBlock = matchedDimensions.length
    ? `\nMATCHED DIMENSIONS (why this signal reached you)\n${matchedDimensions.map(d => `- ${d}`).join('\n')}\n`
    : '';

  return `You are a senior business-desk analyst writing for Relevant.

You are given one event with evidence items E1..En that our pipeline flagged as
potentially relevant. Your job is dual:
1. GATE: verify it is materially relevant for THIS specific user.
2. GENERATE: if it passes, produce concise publication-grade analysis that reflects
   this user's exact operating context.

${persona}
${dimensionBlock}
HARD RULES
- Never copy article headlines or source prose.
- Never invent facts, dates, sources, numbers, or entities.
- If evidence is weak/uncertain, reject.
- Use mechanism-first, decision-impact language.
- Calibrate depth/language to the user's seniority (from role concerns above).
- Prefer the user's preferred consequence types when multiple apply.
- what_happened must be 2-4 short bullets (max 22 words each).
- synthesis must be exactly one sentence (max 32 words), grounded AND personalized
  to this user's role/company — not generic business-desk prose.

STEP 1 — RELEVANCE GATE
- Pass only if evidence shows a direct mechanism to THIS user's operating surface.
- Use MATCHED DIMENSIONS as the relevance spine — if none clearly match, reject.
- Evaluate against key_concerns and deprioritize less_relevant (see persona).

${rejectionRules}

STEP 2 — GENERATE (JSON only)
[... same schema as current prompt ...]
`;
}

function buildPersonaBlock(ctx: UserContext): string {
  const r = ctx.roleName || 'professional';
  const i = ctx.industryName || 'not specified';
  const co = ctx.company;
  const loc = ctx.location;
  const goals = ctx.activeGoals ?? [];
  const rc = ctx.roleConcerns;

  const companyLine = co
    ? `${co.name ?? 'a company'}${co.sector ? ` — a ${co.sizeBucket ?? ''} ${co.stage ?? ''} ${co.sector} company`.replace(/\s+/g,' ').trim() : ''}${co.description ? `. ${co.description}` : ''}`
    : 'not specified';

  const locationLine = loc?.country
    ? `${loc.city ? loc.city + ', ' : ''}${loc.countryLabel ?? loc.country}${loc.timezone ? ` (${loc.timezone})` : ''}`
    : 'not specified';

  const goalsBlock = goals.length
    ? goals.map(g => `- ${g.goalType} (since ${g.startedAt.slice(0,10)}): cares about ${g.concernKeywords.join(', ')}`).join('\n')
    : '- None currently active';

  const concernsBlock = rc
    ? `Key concerns: ${rc.keyConcerns.join(', ')}\nLess relevant: ${rc.lessRelevant.join(', ')}\nPreferred consequence types: ${rc.preferredConsequenceTypes.join(', ')}`
    : '';

  return `WHO YOU ARE BRIEFING
- Name: ${ctx.fullName ?? 'user'}
- Role: ${r} in ${i}
- Company: ${companyLine}
- Location: ${locationLine}
- Active goals:
${goalsBlock}
${concernsBlock ? '\n' + concernsBlock : ''}`;
}

function buildDynamicRejectionRules(ctx: UserContext): string {
  if (!WS8_FLAGS.DYNAMIC_REJECTION) {
    // legacy static list
    return LEGACY_REJECTION_RULES;
  }
  const rc = ctx.roleConcerns;
  const lessRelevant = rc?.lessRelevant ?? [];
  const rules = [
    'Reject thematic/keyword adjacency.',
    'Reject if you must speculate to make it relevant.',
    ...lessRelevant.map(topic => `Reject stories primarily about "${topic}" unless evidence shows a direct operating mechanism.`),
  ];
  return `RELEVANCE BAR (personalized)\n${rules.map(r => '- ' + r).join('\n')}`;
}
```

### 6.4 Call-site changes

**Modify:** [brief-llm.ts ~line 510+](../../supabase/functions/_shared/brief-llm.ts) — wherever `buildBriefSystemPrompt` is called, it already has `UserContext`. Just pass the full object and matched dimensions. Extract matched dimensions from the event candidate's scoring metadata.

### 6.5 Acceptance criteria (Phase 3)

- [ ] `WS8_ENRICHED_CTX=false` → prompt byte-identical to pre-change (regression test via snapshot).
- [ ] `WS8_ENRICHED_CTX=true` + enriched user → prompt contains company sector, location, goals, role concerns, matched dimensions.
- [ ] Manual A/B: pick 3 users with different roles (CFO, PM, Head of Ops), same event, same industry — generated synthesis must differ by more than just the role label (pairwise diff ≥30% of tokens).
- [ ] Token count delta: log system prompt token count for 20 briefs; median increase must be <500 tokens per event.
- [ ] Prompt caching: verify cache hits are still ≥80% across a batch of 10 events for the same user (system prompt is identical across the user's events).

### 6.6 Tests

Snapshot test: record the prompt output for a known `UserContext` fixture. Commit as `__tests__/__snapshots__/personalized-prompt.txt`. Re-run pins it.

Behavior test: build two `UserContext` fixtures (CFO vs CMO, same company), assert different `preferred_consequence_types` appear in the respective prompts.

### 6.7 Commit

```
WS8-P3: Rewrite brief system prompt with rich persona block

- New buildPersonaBlock + buildDynamicRejectionRules
- buildBriefSystemPrompt takes UserContext + matchedDimensions
- Legacy prompt preserved as fallback when flag off
- Snapshot tests locked

Feature-flag: WS8_ENRICHED_CTX + WS8_DYNAMIC_REJECTION (both default false)
Migration: none
```

---

## 7. Phase 4 — Pre-Synthesis Intent Layer

### 7.1 Scope

Before the per-event LLM calls, run ONE lightweight LLM call that looks at the user's full context + the top N candidate events, and decides: **"What is the one thing this user should act on this week?"** That top intent is then fed into every per-event synthesis so all items relate to a coherent narrative.

### 7.2 Sub-agent delegation

**Agent type: Plan**

```
Prompt:
I need to design a pre-synthesis "intent layer" for our brief pipeline. Today the
pipeline scores candidate events against dimensions, then synthesizes each event
independently in parallel. Result: the brief feels like a list of disconnected items.

I want to add ONE upstream LLM call that:
- Takes enriched UserContext (role, company sector/stage, location, goals, role concerns)
- Takes top 15 candidate events (headline + 1-line summary + matched dimensions)
- Outputs: { top_intent: { label, rationale, priority_event_keys: [...] } }

This runs BEFORE the parallel per-event calls. The top_intent is then included in
each per-event system prompt so synthesis frames items against the same narrative.

Design questions to answer:
1. Model: gpt-4o-mini or sonnet? (Latency budget: <3s.) Check ai-config.ts for what
   we already use and what's cheapest for short-context classification.
2. What fields of UserContext should we pass? All? Or a condensed summary to save tokens?
3. Output contract: zod/typia schema, or hand-rolled JSON validation? What does
   brief-grounding-validator.ts use?
4. Where to place the file: supabase/functions/_shared/brief-intent.ts.
5. Where to call it: pro-brief-generate/brief-builder.ts just before the per-event
   LLM loop (find the exact function + line).
6. Failure mode: if the intent call fails, fall back to no-intent mode (per-event
   synthesis still works). Do NOT block the brief.
7. Caching: intent is per-user-per-day. Use brief-cache.ts pattern? Check how
   existing caches work.

Output: a step-by-step design in <400 words. Include the exact prompt template
for the intent call. No code.
```

### 7.3 Implementation (after Plan agent reports)

**New file:** `supabase/functions/_shared/brief-intent.ts`

Shape (fill in from Plan agent's design):

```typescript
export type BriefIntent = {
  label: string;           // e.g. "Q2 cost pressure from tariff hike"
  rationale: string;       // 1-2 sentences, mechanism-first
  priorityEventKeys: string[]; // subset of input event keys, ordered by relevance
  confidence: 'high'|'medium'|'low';
};

export async function computeBriefIntent(
  supabase: SupabaseClient,
  ctx: UserContext,
  candidates: Array<{ eventKey: string; headline: string; summary: string; matchedDimensions: string[] }>,
): Promise<BriefIntent | null> {
  if (!WS8_FLAGS.INTENT_LAYER) return null;
  if (candidates.length < 3) return null; // too few to pick an intent

  const cached = await loadCachedIntent(supabase, ctx.userId);
  if (cached) return cached;

  const prompt = buildIntentPrompt(ctx, candidates);
  const result = await callLlmForIntent(prompt);  // use gpt-4o-mini, 1500 max tokens, 10s timeout
  if (!result) return null;

  await persistIntent(supabase, ctx.userId, result);
  return result;
}
```

**Modify:** `pro-brief-generate/brief-builder.ts` — invoke `computeBriefIntent` after candidate scoring, before the per-event LLM loop. Pass the returned `intent` into the per-event prompt builder.

**Modify:** `brief-llm.ts` `buildBriefSystemPrompt` — accept optional `intent: BriefIntent | null` and, if present, add:

```
WEEKLY INTENT (use this as the narrative spine for your synthesis)
- ${intent.label}
- Rationale: ${intent.rationale}

When framing why_it_matters and synthesis, tie back to this intent where evidence supports it.
```

### 7.4 Caching

New table `brief_intent_cache(user_id, intent jsonb, computed_at)`, TTL 24h. Writeable only by service role.

**Migration:** `<timestamp>_ws8_p4_brief_intent_cache.sql`

```sql
CREATE TABLE IF NOT EXISTS public.brief_intent_cache (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  intent jsonb NOT NULL,
  computed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.brief_intent_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS brief_intent_cache_select_own ON public.brief_intent_cache;
CREATE POLICY brief_intent_cache_select_own ON public.brief_intent_cache
  FOR SELECT USING (auth.uid() = user_id);
```

### 7.5 Acceptance criteria (Phase 4)

- [ ] Intent call completes in <3s p95 for candidates.length=15 (log metrics).
- [ ] `WS8_INTENT_LAYER=false` → pipeline works unchanged.
- [ ] `WS8_INTENT_LAYER=true` + user with 5+ candidates → `intent.label` present and referenced in ≥1 of the brief items' synthesis.
- [ ] Intent cache: second brief request within 24h does NOT re-call the intent LLM (verify via AI usage log — `logAiUsage` entries).
- [ ] Failure resilience: simulate LLM timeout (set timeout=1ms) → brief still generates (no intent, but no crash).
- [ ] Token budget: intent prompt stays under 4000 tokens for 15 candidates.

### 7.6 Tests

`__tests__/brief-intent.test.ts`:
- Happy path: mocked LLM response parses cleanly.
- Cache hit path: two calls in a row → second hits cache.
- Failure path: LLM returns malformed JSON → function returns null (not throws).
- Flag off: function returns null without calling LLM.

### 7.7 Commit

```
WS8-P4: Pre-synthesis intent layer

- New brief-intent.ts computes weekly intent from ctx + top candidates
- gpt-4o-mini call, 3s p95, 24h cache via brief_intent_cache table
- Per-event prompt now includes WEEKLY INTENT section
- Graceful fallback on timeout/error

Feature-flag: WS8_INTENT_LAYER (default false)
Migration: <timestamp>_ws8_p4_brief_intent_cache.sql
```

---

## 8. Phase 5 — Feedback Loop

### 8.1 Scope

Capture user actions on signal items (share, dismiss, deep dive, note) and translate them into dimension weight adjustments and a `FeedbackSummary` that Phase 1's `UserContext` already expects. This closes the loop: synthesis quality adapts per user over time.

### 8.2 Sub-agent delegation

**Agent 1 — Explore (very thorough) — BEFORE any code**

```
Prompt:
Audit the existing feedback / action capture surface for signal items. I need:

1. Every frontend action that a user can take on a signal item (share, save, note,
   dismiss, deep dive, "not relevant", etc.). List the React Native component and
   handler per action.
2. Where those actions are persisted today. Check signal_items table columns,
   note_influence_signals table, any *_events table. Some actions may log, some
   may not — tell me which.
3. Whether there's an existing feedback edge function (pro-signal-feedback?
   signal-action? etc.). If yes, what does it accept? If no, which edge function
   currently receives these events (if any)?
4. Any existing dimension-weight adjustment code. Grep for "weight" near
   "dimension" in _shared/. This Phase 5 is going to ADJUST dimension weights
   based on feedback — I need to know if there's already machinery for this
   (influence-compute? matcher?) vs whether I'm building from scratch.
5. What the "deep dive" flow does today (I know it exists per brief-llm.ts line
   refs). Does clicking deep dive already log anywhere?

Report under 400 words with file:line refs.
```

### 8.3 Database migration

**File:** `<timestamp>_ws8_p5_signal_feedback.sql`

```sql
-- WS8 Phase 5: Signal feedback capture + weight adjustments
CREATE TABLE IF NOT EXISTS public.signal_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  signal_item_id uuid NOT NULL REFERENCES public.signal_items(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('share','save','note','dismiss','deep_dive','not_relevant','pin','unpin')),
  matched_dimensions text[] NOT NULL DEFAULT '{}',  -- snapshot from the signal at time of action
  consequence_types text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_signal_feedback_user_created ON public.signal_feedback(user_id, created_at DESC);
CREATE INDEX idx_signal_feedback_action ON public.signal_feedback(action);

ALTER TABLE public.signal_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS signal_feedback_insert_own ON public.signal_feedback;
CREATE POLICY signal_feedback_insert_own ON public.signal_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS signal_feedback_select_own ON public.signal_feedback;
CREATE POLICY signal_feedback_select_own ON public.signal_feedback
  FOR SELECT USING (auth.uid() = user_id);

-- Weight adjustments: per-user multiplier over global dimension weights
CREATE TABLE IF NOT EXISTS public.user_dimension_weights (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  dimension_slug text NOT NULL,
  weight_multiplier numeric NOT NULL DEFAULT 1.0 CHECK (weight_multiplier >= 0.1 AND weight_multiplier <= 3.0),
  action_count int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, dimension_slug)
);

ALTER TABLE public.user_dimension_weights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS udw_select_own ON public.user_dimension_weights;
CREATE POLICY udw_select_own ON public.user_dimension_weights
  FOR SELECT USING (auth.uid() = user_id);
```

### 8.4 Implementation

**New edge function:** `supabase/functions/pro-signal-feedback/index.ts`

```typescript
// POST /pro-signal-feedback
// Body: { signal_item_id, action, matched_dimensions?, consequence_types? }
// Inserts into signal_feedback, triggers async weight update.

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("method", { status: 405 });
  const { userId, supabase } = await authFromRequest(req);
  const body = await req.json();

  const { error } = await supabase.from("signal_feedback").insert({
    user_id: userId,
    signal_item_id: body.signal_item_id,
    action: body.action,
    matched_dimensions: body.matched_dimensions ?? [],
    consequence_types: body.consequence_types ?? [],
  });
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });

  // Fire-and-forget weight adjustment
  if (WS8_FLAGS.FEEDBACK_LOOP) {
    queueMicrotask(() => updateWeightsForAction(supabase, userId, body).catch(console.error));
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
});
```

**New file:** `supabase/functions/_shared/feedback-weights.ts`

```typescript
export async function updateWeightsForAction(
  supabase: SupabaseClient, userId: string,
  action: { action: string; matched_dimensions: string[] }
): Promise<void> {
  const delta = ACTION_WEIGHT_DELTA[action.action];  // e.g. share:+0.1, dismiss:-0.1, deep_dive:+0.05
  if (!delta || action.matched_dimensions.length === 0) return;

  for (const dim of action.matched_dimensions) {
    await supabase.rpc("apply_user_dimension_weight_delta", {
      p_user_id: userId, p_dimension_slug: dim, p_delta: delta,
    });
  }
}

const ACTION_WEIGHT_DELTA: Record<string, number> = {
  share: +0.10,
  save: +0.05,
  pin: +0.15,
  note: +0.08,
  deep_dive: +0.05,
  dismiss: -0.10,
  not_relevant: -0.20,
  unpin: -0.05,
};
```

**Supporting Postgres function** (add to the same migration):

```sql
CREATE OR REPLACE FUNCTION public.apply_user_dimension_weight_delta(
  p_user_id uuid, p_dimension_slug text, p_delta numeric
) RETURNS void AS $$
  INSERT INTO public.user_dimension_weights (user_id, dimension_slug, weight_multiplier, action_count, updated_at)
  VALUES (p_user_id, p_dimension_slug, GREATEST(0.1, LEAST(3.0, 1.0 + p_delta)), 1, now())
  ON CONFLICT (user_id, dimension_slug) DO UPDATE SET
    weight_multiplier = GREATEST(0.1, LEAST(3.0, user_dimension_weights.weight_multiplier + p_delta)),
    action_count = user_dimension_weights.action_count + 1,
    updated_at = now();
$$ LANGUAGE sql SECURITY DEFINER;
```

**Modify:** `user-context-enrich.ts` → add `loadFeedbackSummary`:

```typescript
async function loadFeedbackSummary(supabase: SupabaseClient, userId: string): Promise<FeedbackSummary | null> {
  if (!WS8_FLAGS.FEEDBACK_LOOP) return null;
  // Window: last 60 days.
  const cutoff = new Date(Date.now() - 60*24*3600*1000).toISOString();
  const { data } = await supabase.from("signal_feedback")
    .select("action, matched_dimensions, consequence_types")
    .eq("user_id", userId).gte("created_at", cutoff);
  if (!data || data.length === 0) return null;
  // Aggregate → top preferred dims, top deprioritized, preferred consequence types.
  return aggregateFeedback(data);
}
```

**Modify:** dimension scoring call-site (likely `brief-scorer.ts` or `article-fetcher.ts getUserDimensions`) — read `user_dimension_weights`, multiply into the score. Sub-agent should locate this exactly.

**Frontend:** wire up the existing action buttons to POST to `/pro-signal-feedback`. The Explore agent in §8.2 will identify which components need the call. Add ~1 line per action handler.

### 8.5 Acceptance criteria (Phase 5)

- [ ] Migration applies; tables exist with correct RLS.
- [ ] POST `/pro-signal-feedback` with valid body → row in `signal_feedback`.
- [ ] POST with `action=share` + `matched_dimensions=['cost_pressure']` → `user_dimension_weights.weight_multiplier` rises ~+0.10 for that slug.
- [ ] POST with `action=dismiss` → weight drops ~-0.10 (floored at 0.1).
- [ ] `WS8_FEEDBACK_LOOP=true` + user with ≥5 feedback rows → `userCtx.feedback.preferredDimensions.length > 0`.
- [ ] Brief scorer multiplies `user_dimension_weights.weight_multiplier` into final score (verify with a test user where one dim is boosted to 2.0 → that dim's events should rank higher).
- [ ] Frontend: clicking Share/Save/Dismiss/Deep Dive fires one POST each (verify via network tab).
- [ ] Flag off: no scoring behavior change (regression).

### 8.6 Tests

- Integration test: insert 10 feedback rows → assert aggregation produces expected top-5 dims.
- RPC test: call `apply_user_dimension_weight_delta` twice with +0.1 → assert final multiplier is 1.2 ±0.01.
- Clamp test: call with +5.0 → multiplier caps at 3.0. Call with -5.0 → floors at 0.1.

### 8.7 Commit

```
WS8-P5: Feedback loop — capture actions, adjust dimension weights

- New pro-signal-feedback edge function
- signal_feedback + user_dimension_weights tables + RLS
- apply_user_dimension_weight_delta RPC (clamped 0.1..3.0)
- feedback-weights.ts + loadFeedbackSummary integration
- Frontend: wire share/save/dismiss/deep_dive to feedback endpoint
- Brief scorer multiplies user weights into score

Feature-flag: WS8_FEEDBACK_LOOP (default false)
Migration: <timestamp>_ws8_p5_signal_feedback.sql
```

---

## 9. Phase 6 — Integration, Rollout, Observability

### 9.1 Scope

Turn on flags for internal users, A/B against control, measure quality delta, then 100% rollout. This phase has almost no new code — it's testing and verification.

### 9.2 Sub-agent delegation

**Agent — general-purpose** (write the A/B harness)

```
Prompt:
Write a read-only A/B comparison script `scripts/ws8/compare-briefs.ts` that:
1. Accepts a list of user IDs.
2. For each user, generates TWO briefs: one with all WS8 flags OFF (control), one
   with all ON (treatment). Both using the same candidate articles (use the same
   brief timestamp window).
3. Outputs a side-by-side diff: headlines, synthesis, what_happened, per item.
4. Computes token-level diff percentage per item and logs aggregates.
5. Writes results to `/tmp/ws8-ab-<timestamp>.json`.

Do NOT mutate DB. Use a throwaway supabase client. Script must be idempotent and
runnable against staging. Under 250 lines. Output files only.
```

### 9.3 Rollout plan

| Step | Flags on | Users | Monitor |
|------|----------|-------|---------|
| 1 | WS8_ENRICHED_CTX | internal (founder, team) only | prompt token count, AI cost per brief |
| 2 | + WS8_ROLE_CONCERNS | internal | prompt output sample review |
| 3 | + WS8_DYNAMIC_REJECTION | internal | rejection rate vs control |
| 4 | + WS8_INTENT_LAYER | internal | intent labels sampled daily |
| 5 | + WS8_FEEDBACK_LOOP | internal | feedback row insert rate, weight distribution |
| 6 | all on | 10% cohort | compare p95 latency, CSAT proxy (share rate) |
| 7 | all on | 100% | remove legacy prompt path after 2 weeks stable |

### 9.4 Observability — dashboards

- Supabase logs: grep `[WS8:` → per-phase counts.
- AI usage: `logAiUsage` already writes to `ai_usage` table. Add `brief_variant='personalized'` tag to enriched-path calls so A/B analysis is trivial.
- Quality proxy: track share_rate, save_rate, deep_dive_rate pre/post rollout per user.

### 9.5 Acceptance criteria (Phase 6)

- [ ] All 5 flags documented in `docs/operations/feature-flags.md` (if that file exists; else create).
- [ ] A/B script produces readable output for 10 real users.
- [ ] Share rate on internal cohort ≥ control after 7 days (quality proxy).
- [ ] P95 brief latency increase <25% (hard cap — if higher, throttle intent layer or reduce persona block).
- [ ] AI cost per brief increase <30% (hard cap).
- [ ] Rollback drill: flip all flags off → verify behavior matches pre-WS8 (snapshot diff against a known commit).

### 9.6 Commit

```
WS8-P6: Rollout harness + observability

- scripts/ws8/compare-briefs.ts A/B harness
- Feature-flag docs
- ai_usage tagged with brief_variant
- Rollout checklist added to README

Migration: none
```

---

## 10. Out of Scope (Explicitly)

- **No frontend UI redesign.** We are not touching how signals are rendered in Phases 1–5. Phase 5 adds one POST per existing action button — no new buttons.
- **No changes to RSS / article ingestion.** This workstream is downstream of candidate collection.
- **No changes to cohort/dimension generation** (`pro-influence-compute`). Those weights stay global; per-user `user_dimension_weights` multiplies on top.
- **No new taxonomy tables** beyond `role_concerns`. Industry/role/company taxonomies unchanged.
- **No payment/subscription gating.** All users get the improvement when flags flip.

---

## 11. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Prompt token bloat → higher AI cost | Medium | Medium | §6.5 token cap; monitor via `ai_usage` |
| Prompt cache misses from varying persona block | Medium | Medium | System prompt stays stable per user; user message is what varies |
| Intent layer adds latency | Medium | Medium | 3s p95 cap; fallback on timeout |
| Feedback weights create runaway loops | Low | High | Clamp 0.1..3.0 in SQL; action_count cap if needed |
| Company enrichment hallucinations | High | Medium | Flag `enrichment_source='llm'`; show "unverified" in UI if needed; human spot-check 10% |
| RLS misconfiguration exposes feedback cross-user | Low | High | RLS policy tests in migration (assert anon user cannot SELECT another user's row) |
| Snapshot drift breaks prompt tests | Medium | Low | Commit snapshots; regenerate intentionally per phase |

---

## 12. Sub-Agent Usage Playbook (for you, the coding agent)

This workstream requires disciplined sub-agent use. Quick reference:

**Use `Explore` (very thorough) when:**
- Mapping current-state behavior before a change (Phases 1, 5).
- Verifying call sites of a function you're about to change.

**Use `Plan` when:**
- Designing a prompt (Phase 3) or multi-step LLM flow (Phase 4).
- You need a second opinion on a trade-off (caching strategy, token budget).

**Use `general-purpose` when:**
- Writing one-off scripts (enrichment seed, A/B harness).
- The task is well-scoped but tedious.

**Parallel rule:** Phase 1 Explore and Phase 2 general-purpose seed generation are independent — launch in ONE message with two tool calls. Same for Phase 5 Explore (can run while Phase 4 is in progress).

**Do not:**
- Use a sub-agent to "implement this phase." You, the main agent, should write the edits. Sub-agents produce reports and one-off scripts, not core edge-function code.
- Delegate interpretation. If a sub-agent returns "I found 3 patterns," you decide which one applies — don't send a follow-up that says "pick one."

**Brief well:** every sub-agent prompt in this doc is pre-written. Copy it verbatim. Don't paraphrase — the instructions are tuned.

---

## 13. Final Checklist

Before declaring WS8 complete:

- [ ] All 6 phases committed with proper flag + migration notes.
- [ ] All 5 flags flipped to `true` in production for ≥2 weeks.
- [ ] A/B metrics show share_rate ≥ control.
- [ ] Legacy prompt code removed (after 2-week stability window).
- [ ] `docs/done/WS8-super-agent-personalization.md` moved from `implementation/`.
- [ ] Retrospective: one paragraph on what worked and what to revisit.

---

## 14. Appendix — File-by-File Change Summary

| File | Phase | Change |
|------|-------|--------|
| `supabase/functions/_shared/brief-types.ts` | 1, 2, 5 | Extend `UserContext`; new types `CompanyMeta`, `LocationBlock`, `ActiveGoal`, `RoleConcerns`, `FeedbackSummary` |
| `supabase/functions/_shared/user-context-enrich.ts` | 1, 2, 5 | NEW — enrichment orchestrator |
| `supabase/functions/_shared/role-concerns.ts` | 2 | NEW — cached lookup |
| `supabase/functions/_shared/role-concerns-seed.ts` | 2 | NEW — seed data source |
| `supabase/functions/_shared/brief-intent.ts` | 4 | NEW — pre-synthesis intent call |
| `supabase/functions/_shared/feedback-weights.ts` | 5 | NEW — weight delta logic |
| `supabase/functions/_shared/runtime-config.ts` | all | Add `WS8_FLAGS` export |
| `supabase/functions/_shared/brief-llm.ts` | 3, 4 | Rewrite `buildBriefSystemPrompt`, accept enriched ctx + intent |
| `supabase/functions/_shared/article-fetcher.ts` | 1 | Call `enrichUserContext` at end of `getUserContext` |
| `supabase/functions/pro-brief-generate/brief-builder.ts` | 4 | Call `computeBriefIntent` before per-event loop; pass intent into prompt |
| `supabase/functions/pro-brief-generate/index.ts` | 1, 4 | Logging only |
| `supabase/functions/pro-signal-feedback/index.ts` | 5 | NEW edge function |
| `scripts/ws8/enrich-companies.ts` | 1 | NEW — one-shot enrichment |
| `scripts/ws8/compare-briefs.ts` | 6 | NEW — A/B harness |
| `supabase/migrations/<ts>_ws8_p1_*.sql` | 1 | companies cols + user_context_cache |
| `supabase/migrations/<ts>_ws8_p2_*.sql` | 2 | role_concerns + seed |
| `supabase/migrations/<ts>_ws8_p4_*.sql` | 4 | brief_intent_cache |
| `supabase/migrations/<ts>_ws8_p5_*.sql` | 5 | signal_feedback + user_dimension_weights + RPC |
| `supabase/functions/_shared/__tests__/*.test.ts` | each | Unit tests per phase |

— End of plan —