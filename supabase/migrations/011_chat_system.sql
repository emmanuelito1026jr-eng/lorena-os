-- Migration: 011_chat_system.sql
-- Chat system tables for AI chatbot lead engine

-- ============================================================
-- 1. chat_sessions — one per visitor conversation
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'converted')),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  lead_score INTEGER DEFAULT 0,
  page_url TEXT,
  visitor_name TEXT,
  visitor_phone TEXT,
  visitor_email TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_sessions_visitor ON chat_sessions(visitor_id);
CREATE INDEX idx_chat_sessions_lead ON chat_sessions(lead_id);
CREATE INDEX idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX idx_chat_sessions_updated ON chat_sessions(updated_at DESC);

-- ============================================================
-- 2. chat_messages — individual messages in a session
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('visitor', 'bot', 'agent')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at);

-- ============================================================
-- 3. chat_lead_captures — lead info collected from chat
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_lead_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  visitor_name TEXT,
  phone TEXT,
  email TEXT,
  lead_score INTEGER DEFAULT 0,
  score_reasons TEXT[] DEFAULT '{}',
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  converted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_captures_session ON chat_lead_captures(session_id);

-- ============================================================
-- 4. RLS — permissive for anonymous visitors
-- ============================================================
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_lead_captures ENABLE ROW LEVEL SECURITY;

-- Anonymous visitors can create and read their own sessions
CREATE POLICY "anon_insert_chat_sessions" ON chat_sessions
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_select_chat_sessions" ON chat_sessions
  FOR SELECT TO anon USING (true);
CREATE POLICY "anon_update_chat_sessions" ON chat_sessions
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Anonymous visitors can create and read messages
CREATE POLICY "anon_insert_chat_messages" ON chat_messages
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_select_chat_messages" ON chat_messages
  FOR SELECT TO anon USING (true);

-- Anonymous visitors can create captures
CREATE POLICY "anon_insert_chat_captures" ON chat_lead_captures
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_select_chat_captures" ON chat_lead_captures
  FOR SELECT TO anon USING (true);

-- Authenticated users (agents) have full access
CREATE POLICY "auth_all_chat_sessions" ON chat_sessions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_chat_messages" ON chat_messages
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_chat_captures" ON chat_lead_captures
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- 5. Realtime
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE chat_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- ============================================================
-- 6. Updated_at trigger for chat_sessions
-- ============================================================
CREATE OR REPLACE FUNCTION update_chat_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chat_session_updated
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_session_timestamp();
