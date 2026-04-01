-- Migration 004: Lead Generation Channels
-- Creates social_content table for LOS-22 bilingual content engine
-- Adds referral tracking columns to leads table for LOS-23

BEGIN;

-- 1. New table: social_content (LOS-22 Bilingual Content Engine)
CREATE TABLE IF NOT EXISTS social_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,              -- market_intel, education, community
  english_text TEXT,
  spanish_text TEXT,
  combined_post TEXT NOT NULL,
  platform TEXT DEFAULT 'both',            -- facebook, instagram, both
  cta_url TEXT,
  hashtags TEXT[],
  image_prompt TEXT,                        -- for future AI image generation
  scheduled_for TIMESTAMPTZ,
  status TEXT DEFAULT 'draft',             -- draft, approved, posted
  engagement_likes INT DEFAULT 0,
  engagement_comments INT DEFAULT 0,
  engagement_shares INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. New columns on leads table (LOS-23 Referral Engine)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_referral_touch TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS referral_count INT DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES leads(id);

COMMIT;
