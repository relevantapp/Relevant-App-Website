-- Intelligence Briefs + Follow-up Chat tables
-- Run this migration in your Supabase SQL editor or via CLI

CREATE TABLE intelligence_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  research_type TEXT NOT NULL CHECK (research_type IN (
    'meeting_prep', 'business_case', 'competitive_analysis', 'market_research'
  )),
  request_payload JSONB NOT NULL,
  synthesis JSONB NOT NULL,
  sources JSONB NOT NULL,
  evidence_count INT NOT NULL DEFAULT 0,
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  is_degraded BOOLEAN NOT NULL DEFAULT FALSE,
  degraded_reasons TEXT[],
  search_ms INT,
  synthesis_ms INT,
  total_ms INT,
  synthesis_model TEXT,
  is_shared BOOLEAN NOT NULL DEFAULT FALSE,
  shared_at TIMESTAMPTZ,
  share_slug TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_intelligence_briefs_user_created 
  ON intelligence_briefs (user_id, created_at DESC);

CREATE INDEX idx_intelligence_briefs_share_slug 
  ON intelligence_briefs (share_slug) WHERE share_slug IS NOT NULL;

ALTER TABLE intelligence_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own briefs"
  ON intelligence_briefs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own briefs"
  ON intelligence_briefs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own briefs"
  ON intelligence_briefs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Public can read shared briefs"
  ON intelligence_briefs FOR SELECT
  USING (is_shared = true AND share_slug IS NOT NULL);

CREATE TABLE intelligence_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id UUID NOT NULL REFERENCES intelligence_briefs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  source_ids TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_intelligence_chat_brief 
  ON intelligence_chat_messages (brief_id, created_at ASC);

ALTER TABLE intelligence_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own chat messages"
  ON intelligence_chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
  ON intelligence_chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);
