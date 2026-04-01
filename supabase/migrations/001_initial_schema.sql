-- ============================================
-- Casas En El Paso TX — Complete Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('agent', 'client')),
  phone TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. LEADS
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  source TEXT NOT NULL DEFAULT 'website' CHECK (source IN ('website', 'referral', 'zillow', 'cinc', 'social', 'open_house', 'cold_call', 'other')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualifying', 'showing', 'offer', 'under_contract', 'closed', 'lost')),
  score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  temperature TEXT GENERATED ALWAYS AS (
    CASE
      WHEN score >= 80 THEN 'hot'
      WHEN score >= 50 THEN 'warm'
      WHEN score >= 20 THEN 'cool'
      ELSE 'cold'
    END
  ) STORED,
  score_updated_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'en',
  budget_min NUMERIC,
  budget_max NUMERIC,
  preferred_areas TEXT[] DEFAULT '{}',
  property_type TEXT,
  timeline TEXT,
  last_activity TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. LEAD ACTIVITY (behavioral tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS lead_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  metadata JSONB,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 4. MESSAGES (all channels unified)
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email', 'ai_sms', 'chatbot', 'phone')),
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content TEXT NOT NULL,
  metadata JSONB,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 5. PROPERTIES (MLS cache)
-- ============================================
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mls_id TEXT UNIQUE,
  address TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'El Paso',
  state TEXT NOT NULL DEFAULT 'TX',
  zip TEXT NOT NULL,
  price NUMERIC NOT NULL,
  bedrooms INTEGER NOT NULL,
  bathrooms NUMERIC NOT NULL,
  sqft INTEGER NOT NULL,
  lot_size NUMERIC,
  year_built INTEGER,
  property_type TEXT NOT NULL DEFAULT 'single_family',
  status TEXT NOT NULL DEFAULT 'active',
  description TEXT,
  features TEXT[] DEFAULT '{}',
  photos TEXT[] DEFAULT '{}',
  neighborhood TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 6. SHOWINGS
-- ============================================
CREATE TABLE IF NOT EXISTS showings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  address TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  feedback JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 7. SAVED SEARCHES
-- ============================================
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  criteria JSONB NOT NULL DEFAULT '{}',
  alert_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 8. FAVORITES
-- ============================================
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(lead_id, property_id)
);

-- ============================================
-- 9. DAILY BRIEFINGS
-- ============================================
CREATE TABLE IF NOT EXISTS daily_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  content JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(agent_id, date)
);

-- ============================================
-- 10. NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  metadata JSONB,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 11. DRIP SEQUENCES
-- ============================================
CREATE TABLE IF NOT EXISTS drip_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger TEXT NOT NULL,
  steps JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 12. DRIP ENROLLMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS drip_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES drip_sequences(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  current_step INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  next_send_at TIMESTAMPTZ,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 13. DRIP MESSAGES SENT
-- ============================================
CREATE TABLE IF NOT EXISTS drip_messages_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES drip_enrollments(id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email')),
  content TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered BOOLEAN DEFAULT FALSE,
  opened BOOLEAN DEFAULT FALSE
);

-- ============================================
-- 14. CHECKLIST TEMPLATES
-- ============================================
CREATE TABLE IF NOT EXISTS checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 15. CHECKLIST INSTANCES
-- ============================================
CREATE TABLE IF NOT EXISTS checklist_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 16. CALENDAR CAMPAIGNS
-- ============================================
CREATE TABLE IF NOT EXISTS calendar_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  day INTEGER CHECK (day >= 1 AND day <= 31),
  template_id UUID,
  channel TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('sms', 'email', 'ai_sms', 'chatbot', 'phone')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 17. EMAIL TEMPLATES
-- ============================================
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 18. CMA REPORTS
-- ============================================
CREATE TABLE IF NOT EXISTS cma_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  address TEXT NOT NULL,
  report_data JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'complete', 'error')),
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES (hot paths)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_temperature ON leads(temperature);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_last_activity ON leads(last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_agent ON leads(agent_id);

CREATE INDEX IF NOT EXISTS idx_lead_activity_lead ON lead_activity(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activity_created ON lead_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_activity_action ON lead_activity(action);

CREATE INDEX IF NOT EXISTS idx_messages_lead ON messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages(channel);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(read) WHERE read = FALSE;

CREATE INDEX IF NOT EXISTS idx_showings_date ON showings(date);
CREATE INDEX IF NOT EXISTS idx_showings_lead ON showings(lead_id);
CREATE INDEX IF NOT EXISTS idx_showings_agent ON showings(agent_id);

CREATE INDEX IF NOT EXISTS idx_notifications_agent ON notifications(agent_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(read) WHERE read = FALSE;

CREATE INDEX IF NOT EXISTS idx_drip_enrollments_active ON drip_enrollments(next_send_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_drip_enrollments_lead ON drip_enrollments(lead_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE showings ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE drip_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE drip_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE drip_messages_sent ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cma_reports ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Agent sees all leads; client doesn't access leads table
CREATE POLICY "Agent full access to leads" ON leads FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent')
);

-- Agent full access to lead_activity
CREATE POLICY "Agent full access to lead_activity" ON lead_activity FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent')
);

-- Agent full access to messages
CREATE POLICY "Agent full access to messages" ON messages FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent')
);

-- Properties are readable by everyone (public listings)
CREATE POLICY "Anyone can view properties" ON properties FOR SELECT USING (true);
CREATE POLICY "Agent can manage properties" ON properties FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent')
);

-- Agent full access to showings
CREATE POLICY "Agent full access to showings" ON showings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent')
);

-- Saved searches: lead can see own
CREATE POLICY "Agent full access to saved_searches" ON saved_searches FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent')
);

-- Favorites: lead can see own
CREATE POLICY "Agent full access to favorites" ON favorites FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent')
);

-- Daily briefings: agent only
CREATE POLICY "Agent access to briefings" ON daily_briefings FOR ALL USING (agent_id = auth.uid());

-- Notifications: agent only
CREATE POLICY "Agent access to notifications" ON notifications FOR ALL USING (agent_id = auth.uid());

-- Drip sequences: agent only
CREATE POLICY "Agent access to drip_sequences" ON drip_sequences FOR ALL USING (agent_id = auth.uid());

-- Drip enrollments: agent access
CREATE POLICY "Agent full access to drip_enrollments" ON drip_enrollments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent')
);

-- Drip messages sent: agent access
CREATE POLICY "Agent full access to drip_messages_sent" ON drip_messages_sent FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent')
);

-- Checklist templates: agent only
CREATE POLICY "Agent access to checklist_templates" ON checklist_templates FOR ALL USING (agent_id = auth.uid());

-- Checklist instances: agent access
CREATE POLICY "Agent full access to checklist_instances" ON checklist_instances FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent')
);

-- Calendar campaigns: agent only
CREATE POLICY "Agent access to calendar_campaigns" ON calendar_campaigns FOR ALL USING (agent_id = auth.uid());

-- Email templates: agent only
CREATE POLICY "Agent access to email_templates" ON email_templates FOR ALL USING (agent_id = auth.uid());

-- CMA reports: agent only
CREATE POLICY "Agent access to cma_reports" ON cma_reports FOR ALL USING (agent_id = auth.uid());

-- ============================================
-- REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
ALTER PUBLICATION supabase_realtime ADD TABLE lead_activity;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON showings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON drip_sequences FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON checklist_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON checklist_instances FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
