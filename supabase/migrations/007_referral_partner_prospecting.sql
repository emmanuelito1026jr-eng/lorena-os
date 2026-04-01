-- ============================================
-- MIGRATION 007: Referral Partner Prospecting
-- Tables for the referral partner outreach engine
-- LOS-32, LOS-33, LOS-34
-- ============================================

-- 1. Referral Partners
CREATE TABLE IF NOT EXISTS referral_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Contact info (from Apollo)
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  linkedin_url TEXT,

  -- Professional info
  title TEXT,
  company TEXT,
  company_website TEXT,
  industry TEXT,  -- mortgage, title, insurance, cpa, property_management, relocation, hr

  -- Enrichment data (from Perplexity + Claude)
  company_summary TEXT,
  personalization_notes TEXT,
  estimated_referral_potential TEXT,  -- high, medium, low
  outreach_angle TEXT,
  ice_breaker TEXT,
  specialties TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',

  -- Outreach status
  outreach_status TEXT DEFAULT 'new',  -- new, sequence_ready, contacted, replied, follow_up_later, meeting_booked, partner_active, partner_inactive, not_interested
  sequence_stage INT DEFAULT 0,
  last_contacted_at TIMESTAMPTZ,
  last_replied_at TIMESTAMPTZ,
  meeting_date TIMESTAMPTZ,

  -- Partnership tracking
  is_active_partner BOOLEAN DEFAULT false,
  referrals_sent INT DEFAULT 0,
  referrals_received INT DEFAULT 0,
  last_referral_date TIMESTAMPTZ,
  partnership_notes TEXT,

  -- Source tracking
  source TEXT DEFAULT 'apollo',  -- apollo, linkedin, manual, referral
  apollo_id TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ref_partners_status ON referral_partners(outreach_status);
CREATE INDEX IF NOT EXISTS idx_ref_partners_industry ON referral_partners(industry);
CREATE INDEX IF NOT EXISTS idx_ref_partners_email ON referral_partners(email);
CREATE INDEX IF NOT EXISTS idx_ref_partners_active ON referral_partners(is_active_partner) WHERE is_active_partner = true;
CREATE INDEX IF NOT EXISTS idx_ref_partners_potential ON referral_partners(estimated_referral_potential);

-- Trigger for updated_at
CREATE TRIGGER set_referral_partners_updated_at BEFORE UPDATE ON referral_partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2. Outreach Messages Log
CREATE TABLE IF NOT EXISTS referral_outreach_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES referral_partners(id) ON DELETE CASCADE,
  sequence_number INT,
  subject TEXT,
  body TEXT,
  channel TEXT DEFAULT 'email',  -- email, linkedin, sms
  status TEXT DEFAULT 'draft',   -- draft, sent, opened, replied, bounced, received
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  reply_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outreach_log_partner ON referral_outreach_log(partner_id, sequence_number);
CREATE INDEX IF NOT EXISTS idx_outreach_log_status ON referral_outreach_log(status);

-- 3. Row Level Security
ALTER TABLE referral_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_outreach_log ENABLE ROW LEVEL SECURITY;

-- Agent (Lorena) has full access
CREATE POLICY "Agent full access to referral_partners" ON referral_partners
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent'));

CREATE POLICY "Agent full access to referral_outreach_log" ON referral_outreach_log
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent'));

-- Service role (n8n workflows) bypasses RLS automatically
