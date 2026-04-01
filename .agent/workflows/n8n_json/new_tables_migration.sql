-- Migration: Create new tables for LOS-18, LOS-15, LOS-22 workflows
-- Run this via Supabase SQL Editor or CLI

-- ═══════════════════════════════════════════════
-- LOS-18: Showing Coordinator
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS showings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES profiles(id),
  property_address text NOT NULL,
  showing_date date NOT NULL,
  showing_time text NOT NULL,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  feedback text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ═══════════════════════════════════════════════
-- LOS-22: Social Media Content Engine
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS social_content (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id uuid REFERENCES profiles(id),
  content_type text NOT NULL,
  caption text,
  alt_text text,
  platform text DEFAULT 'instagram,facebook',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'posted', 'rejected')),
  scheduled_for text,
  posted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ═══════════════════════════════════════════════
-- LOS-15: Smart Email Drip Orchestrator
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS drip_enrollments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES profiles(id),
  sequence_name text DEFAULT 'standard_nurture',
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  current_step int DEFAULT 0,
  enrolled_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS drip_messages_sent (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id uuid REFERENCES drip_enrollments(id) ON DELETE CASCADE,
  step_number int NOT NULL,
  channel text DEFAULT 'email',
  content text,
  sent_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE showings ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE drip_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE drip_messages_sent ENABLE ROW LEVEL SECURITY;

-- Service role policies
CREATE POLICY "Service role full access on showings"
  ON showings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on social_content"
  ON social_content FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on drip_enrollments"
  ON drip_enrollments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access on drip_messages_sent"
  ON drip_messages_sent FOR ALL USING (true) WITH CHECK (true);
