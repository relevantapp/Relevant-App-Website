-- Intelligence V2 run store, evidence ledger, and request cache.
-- Run this in Supabase after migration_intelligence_briefs.sql.

CREATE TABLE IF NOT EXISTS intelligence_runs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  research_type TEXT NOT NULL,
  depth TEXT NOT NULL,
  intent_packet JSONB NOT NULL,
  user_lens JSONB,
  plan JSONB,
  plan_version TEXT,
  evidence_pack JSONB,
  claim_map JSONB,
  verifier_result JSONB,
  model TEXT,
  provider TEXT,
  prompt_tokens INT,
  completion_tokens INT,
  timings JSONB,
  status TEXT NOT NULL CHECK (status IN ('ok', 'degraded', 'failed')),
  degraded_reasons TEXT[],
  brief_id UUID REFERENCES intelligence_briefs(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intelligence_runs_user_created
  ON intelligence_runs (user_id, created_at DESC);

ALTER TABLE intelligence_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own intelligence runs"
  ON intelligence_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own intelligence runs"
  ON intelligence_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own intelligence runs"
  ON intelligence_runs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS intelligence_retrieval_tasks (
  id UUID PRIMARY KEY,
  run_id UUID REFERENCES intelligence_runs(id) ON DELETE CASCADE,
  lane_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  request JSONB NOT NULL,
  response_summary JSONB,
  result_count INT,
  latency_ms INT,
  error TEXT
);

CREATE TABLE IF NOT EXISTS intelligence_evidence_items (
  id UUID PRIMARY KEY,
  run_id UUID REFERENCES intelligence_runs(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL,
  payload JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS intelligence_evidence_clusters (
  id UUID PRIMARY KEY,
  run_id UUID REFERENCES intelligence_runs(id) ON DELETE CASCADE,
  label TEXT,
  what_changed TEXT,
  evidence_ids TEXT[]
);

CREATE TABLE IF NOT EXISTS intelligence_claims (
  id UUID PRIMARY KEY,
  run_id UUID REFERENCES intelligence_runs(id) ON DELETE CASCADE,
  claim TEXT NOT NULL,
  supported BOOLEAN NOT NULL,
  source_ids TEXT[]
);

CREATE TABLE IF NOT EXISTS intelligence_provider_events (
  id UUID PRIMARY KEY,
  run_id UUID REFERENCES intelligence_runs(id) ON DELETE CASCADE,
  provider TEXT,
  kind TEXT,
  at TIMESTAMPTZ DEFAULT now(),
  details JSONB
);

CREATE TABLE IF NOT EXISTS intelligence_entities (
  id UUID PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('company', 'person')),
  canonical_name TEXT NOT NULL,
  canonical_url TEXT,
  snapshot JSONB NOT NULL,
  sources JSONB,
  refreshed_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE (kind, canonical_name)
);

CREATE TABLE IF NOT EXISTS intelligence_cache (
  fingerprint TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  research_type TEXT NOT NULL,
  depth TEXT NOT NULL,
  brief JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intelligence_cache_user_created
  ON intelligence_cache (user_id, created_at DESC);

ALTER TABLE intelligence_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own intelligence cache"
  ON intelligence_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can write own intelligence cache"
  ON intelligence_cache FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own intelligence cache"
  ON intelligence_cache FOR UPDATE
  USING (auth.uid() = user_id);
