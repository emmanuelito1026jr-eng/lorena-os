-- ============================================
-- 002: Automation-Ready Schema Migration
-- CINC 8-stage pipeline + automation tables
-- ============================================

BEGIN;

-- ============================================
-- 1. UPDATE LEADS STATUS PIPELINE
-- Old: new, contacted, qualifying, showing, offer, under_contract, closed, lost
-- New: new_lead, attempted_contact, contacted, appointment_set, appointment_met,
--      active_client, pending_client, past_client, lost
-- ============================================

-- Drop old CHECK constraint (named automatically by Postgres as leads_status_check)
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;

-- Migrate existing data to new pipeline stages
UPDATE leads SET status = 'new_lead' WHERE status = 'new';
UPDATE leads SET status = 'appointment_set' WHERE status IN ('qualifying', 'showing');
UPDATE leads SET status = 'active_client' WHERE status = 'offer';
UPDATE leads SET status = 'pending_client' WHERE status = 'under_contract';
UPDATE leads SET status = 'past_client' WHERE status = 'closed';
-- 'contacted' and 'lost' remain unchanged

-- Set new default
ALTER TABLE leads ALTER COLUMN status SET DEFAULT 'new_lead';

-- Add new CHECK constraint
ALTER TABLE leads ADD CONSTRAINT leads_status_check
  CHECK (status IN ('new_lead', 'attempted_contact', 'contacted', 'appointment_set', 'appointment_met', 'active_client', 'pending_client', 'past_client', 'lost'));

-- ============================================
-- 2. EXPAND LEADS SOURCE
-- ============================================
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_source_check;
ALTER TABLE leads ADD CONSTRAINT leads_source_check
  CHECK (source IN ('website', 'referral', 'zillow', 'cinc', 'social', 'open_house', 'cold_call', 'other', 'apollo', 'instantly', 'import'));

-- ============================================
-- 3. ADD NEW LEADS COLUMNS (automation-ready)
-- ============================================
ALTER TABLE leads ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'unverified'
  CHECK (verification_status IN ('unverified', 'verified', 'bad_info', 'do_not_contact'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS verified_by TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS verification_notes TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_outreach_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS nurture_paused BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS behavioral_score INTEGER NOT NULL DEFAULT 0 CHECK (behavioral_score >= 0);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS engagement_level TEXT NOT NULL DEFAULT 'none'
  CHECK (engagement_level IN ('none', 'low', 'medium', 'high'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS communication_preference TEXT NOT NULL DEFAULT 'any'
  CHECK (communication_preference IN ('any', 'sms', 'email', 'phone'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS best_call_time TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS deal_type TEXT CHECK (deal_type IN ('buyer', 'seller', 'dual'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS move_in_date DATE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pre_approved BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pre_approval_amount NUMERIC;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lender_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS referring_agent TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS import_batch_id UUID;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS imported_at TIMESTAMPTZ;

-- ============================================
-- 4. PIPELINE HISTORY (status transition log)
-- ============================================
CREATE TABLE IF NOT EXISTS pipeline_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  changed_by TEXT NOT NULL DEFAULT 'manual',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 5. DEALS (buyer/seller transactions)
-- ============================================
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  deal_type TEXT NOT NULL CHECK (deal_type IN ('buyer', 'seller', 'dual')),
  stage TEXT NOT NULL DEFAULT 'pre_listing' CHECK (stage IN ('pre_listing', 'active_listing', 'under_contract', 'pending', 'closed', 'fallen_through')),
  property_address TEXT,
  list_price NUMERIC,
  sale_price NUMERIC,
  commission_rate NUMERIC,
  estimated_close_date DATE,
  actual_close_date DATE,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 6. DEAL CHECKLISTS
-- ============================================
CREATE TABLE IF NOT EXISTS deal_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  assigned_to TEXT,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 7. BEHAVIORAL EVENTS (website/app tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS behavioral_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  page_url TEXT,
  metadata JSONB DEFAULT '{}',
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 8. LEAD IMPORTS (batch tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS lead_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  imported_rows INTEGER NOT NULL DEFAULT 0,
  skipped_rows INTEGER NOT NULL DEFAULT 0,
  error_log JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 9. HOMEPULSE REPORTS (homeowner equity)
-- ============================================
CREATE TABLE IF NOT EXISTS homepulse_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  address TEXT NOT NULL,
  estimated_value NUMERIC,
  report_data JSONB NOT NULL DEFAULT '{}',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 10. ALTER EXISTING TABLES
-- ============================================

-- drip_enrollments: add next_sequence_id for chaining
ALTER TABLE drip_enrollments ADD COLUMN IF NOT EXISTS next_sequence_id UUID REFERENCES drip_sequences(id) ON DELETE SET NULL;

-- messages: add AI tracking fields
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_ai BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS automation_source TEXT;

-- ============================================
-- INDEXES (new tables + new columns)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_pipeline_history_lead ON pipeline_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_history_created ON pipeline_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_deals_agent ON deals(agent_id);
CREATE INDEX IF NOT EXISTS idx_deals_lead ON deals(lead_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);

CREATE INDEX IF NOT EXISTS idx_deal_checklists_deal ON deal_checklists(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_checklists_status ON deal_checklists(status);

CREATE INDEX IF NOT EXISTS idx_behavioral_events_lead ON behavioral_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_events_type ON behavioral_events(event_type);
CREATE INDEX IF NOT EXISTS idx_behavioral_events_created ON behavioral_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lead_imports_agent ON lead_imports(agent_id);
CREATE INDEX IF NOT EXISTS idx_lead_imports_status ON lead_imports(status);

CREATE INDEX IF NOT EXISTS idx_homepulse_reports_agent ON homepulse_reports(agent_id);
CREATE INDEX IF NOT EXISTS idx_homepulse_reports_lead ON homepulse_reports(lead_id);

CREATE INDEX IF NOT EXISTS idx_leads_verification ON leads(verification_status);
CREATE INDEX IF NOT EXISTS idx_leads_engagement ON leads(engagement_level);
CREATE INDEX IF NOT EXISTS idx_leads_import_batch ON leads(import_batch_id);

-- ============================================
-- ROW LEVEL SECURITY (new tables)
-- ============================================
ALTER TABLE pipeline_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepulse_reports ENABLE ROW LEVEL SECURITY;

-- Agent full access pattern (matches 001 conventions)
CREATE POLICY "Agent full access to pipeline_history" ON pipeline_history FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent')
);

CREATE POLICY "Agent full access to deals" ON deals FOR ALL USING (agent_id = auth.uid());

CREATE POLICY "Agent full access to deal_checklists" ON deal_checklists FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent')
);

CREATE POLICY "Agent full access to behavioral_events" ON behavioral_events FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent')
);

CREATE POLICY "Agent access to lead_imports" ON lead_imports FOR ALL USING (agent_id = auth.uid());

CREATE POLICY "Agent access to homepulse_reports" ON homepulse_reports FOR ALL USING (agent_id = auth.uid());

-- ============================================
-- REALTIME (new tables that need live updates)
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE pipeline_history;
ALTER PUBLICATION supabase_realtime ADD TABLE deals;

-- ============================================
-- UPDATED_AT TRIGGERS (tables with updated_at)
-- ============================================
CREATE TRIGGER set_updated_at BEFORE UPDATE ON deals FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMIT;
