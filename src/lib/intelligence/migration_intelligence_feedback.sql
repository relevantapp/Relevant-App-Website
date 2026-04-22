-- Intelligence claim feedback capture
-- Run this migration in your Supabase SQL editor or via CLI

CREATE TABLE intelligence_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID NOT NULL REFERENCES intelligence_briefs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  research_type TEXT NOT NULL CHECK (research_type IN (
    'meeting_prep', 'business_case', 'competitive_analysis', 'market_research'
  )),
  claim_key TEXT NOT NULL,
  claim_text TEXT NOT NULL,
  sentiment TEXT NOT NULL CHECK (sentiment IN ('up', 'down')),
  flags TEXT[] NOT NULL DEFAULT '{}',
  source_ids TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, brief_id, claim_key)
);

CREATE INDEX idx_intelligence_feedback_brief_created
  ON intelligence_feedback (brief_id, created_at DESC);

CREATE INDEX idx_intelligence_feedback_user_created
  ON intelligence_feedback (user_id, created_at DESC);

ALTER TABLE intelligence_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own intelligence feedback"
  ON intelligence_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own intelligence feedback"
  ON intelligence_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own intelligence feedback"
  ON intelligence_feedback FOR UPDATE
  USING (auth.uid() = user_id);
