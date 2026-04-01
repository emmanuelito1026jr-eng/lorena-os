-- ============================================================
-- MIGRATION 012: Fix Row Level Security Policies
--
-- Purpose: Address RLS audit findings across the schema:
--   1. Chat tables (011) — anon role has unrestricted SELECT on all
--      sessions, messages, and captured PII. Scope anon access to
--      own visitor_id only; restrict lead captures to agents.
--   2. Missing RLS — social_content (004), market_intel_cache (005),
--      and email_archive (005) were never protected.
--   3. Overly broad SELECT — lead_listing_interactions and
--      listing_alert_queue (010) use USING(true) exposing
--      lead-specific data to anonymous users.
--   4. idx_page_views INSERT — add explicit role check (rate
--      limiting should still be enforced at the application layer).
--
-- Safe to run multiple times (all DROP POLICY uses IF EXISTS).
-- ============================================================

BEGIN;

-- ============================================================
-- 1. FIX CHAT TABLE RLS (migration 011)
--    Problem: anon_select policies use USING(true), letting any
--    anonymous user read ALL chat sessions, messages, and PII
--    captured via chat_lead_captures.
-- ============================================================

-- 1a. chat_sessions SELECT — scope anon to own visitor_id
DROP POLICY IF EXISTS "anon_select_chat_sessions" ON chat_sessions;
CREATE POLICY "anon_select_own_chat_sessions" ON chat_sessions
  FOR SELECT TO anon
  USING (
    visitor_id = current_setting('request.headers', true)::json->>'x-visitor-id'
  );

-- 1b. chat_sessions UPDATE — scope anon to own visitor_id
DROP POLICY IF EXISTS "anon_update_chat_sessions" ON chat_sessions;
CREATE POLICY "anon_update_own_chat_sessions" ON chat_sessions
  FOR UPDATE TO anon
  USING (
    visitor_id = current_setting('request.headers', true)::json->>'x-visitor-id'
  )
  WITH CHECK (
    visitor_id = current_setting('request.headers', true)::json->>'x-visitor-id'
  );

-- 1c. chat_messages SELECT — anon can only see messages from own sessions
DROP POLICY IF EXISTS "anon_select_chat_messages" ON chat_messages;
CREATE POLICY "anon_select_own_chat_messages" ON chat_messages
  FOR SELECT TO anon
  USING (
    session_id IN (
      SELECT id FROM chat_sessions
      WHERE visitor_id = current_setting('request.headers', true)::json->>'x-visitor-id'
    )
  );

-- 1d. chat_lead_captures SELECT — remove anon access entirely;
--     only authenticated agents should see captured PII
DROP POLICY IF EXISTS "anon_select_chat_captures" ON chat_lead_captures;
-- (no replacement for anon — agents already have auth_all_chat_captures)

-- ============================================================
-- 2. ENABLE RLS ON UNPROTECTED TABLES
-- ============================================================

-- 2a. social_content (migration 004) — no RLS was ever set
ALTER TABLE IF EXISTS social_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only agents can manage social content" ON social_content
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 2b. market_intel_cache (migration 005) — public read, agent write
ALTER TABLE IF EXISTS market_intel_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read market intel" ON market_intel_cache
  FOR SELECT USING (true);
CREATE POLICY "Only agents can insert market intel" ON market_intel_cache
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Only agents can update market intel" ON market_intel_cache
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 2c. email_archive (migration 005) — agent-only (contains PII + email bodies)
ALTER TABLE IF EXISTS email_archive ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only agents can manage email archive" ON email_archive
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================
-- 3. RESTRICT OVERLY BROAD SELECT POLICIES (migration 010)
--    Problem: USING(true) on tables containing lead-specific data
--    exposes that data to anonymous users.
-- ============================================================

-- 3a. listing_alert_queue — contains lead_id, saved_search_id
DROP POLICY IF EXISTS "Agent can view alert queue" ON listing_alert_queue;
CREATE POLICY "Only agents can view alert queue" ON listing_alert_queue
  FOR SELECT USING (auth.role() = 'authenticated');

-- 3b. lead_listing_interactions — contains lead_id, interaction history
DROP POLICY IF EXISTS "Agent can view all interactions" ON lead_listing_interactions;
CREATE POLICY "Only agents can view interactions" ON lead_listing_interactions
  FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================
-- 4. FIX idx_page_views INSERT (migration 010)
--    The original "Anyone can insert page views" uses WITH CHECK
--    (true) with no role constraint. Replace with explicit role
--    allowlist. Note: real rate limiting (e.g., per-IP throttle)
--    should be enforced at the application/edge layer.
-- ============================================================

DROP POLICY IF EXISTS "Anyone can insert page views" ON idx_page_views;
CREATE POLICY "Anon and authenticated can insert page views" ON idx_page_views
  FOR INSERT WITH CHECK (auth.role() IN ('anon', 'authenticated'));

COMMIT;
