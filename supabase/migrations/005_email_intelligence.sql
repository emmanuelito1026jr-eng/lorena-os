-- Migration 005: AI Email Intelligence Engine (LOS-25)
-- Creates market_intel_cache for Perplexity market data caching
-- Creates email_archive for AI-composed email history + analytics

BEGIN;

-- 1. Market Intelligence Cache (Perplexity API results, 24-hour TTL)
CREATE TABLE IF NOT EXISTS market_intel_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area TEXT NOT NULL,
  zip_code TEXT,
  budget_range TEXT,
  perplexity_query TEXT,
  perplexity_response JSONB,
  median_price NUMERIC,
  avg_days_on_market INT,
  active_listings INT,
  mortgage_rate NUMERIC,
  price_trend TEXT,
  notable_listings JSONB,
  neighborhood_highlights TEXT,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX IF NOT EXISTS idx_market_cache_area ON market_intel_cache(area, cached_at);

-- 2. Email Archive (every AI-composed email with full context)
CREATE TABLE IF NOT EXISTS email_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id),
  email_intent TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  tone TEXT,
  personalization_score INT DEFAULT 0,
  market_data_used JSONB,
  lead_context_snapshot JSONB,
  perplexity_query TEXT,
  claude_model TEXT DEFAULT 'claude-sonnet-4-5-20250929',
  quality_gate_passed BOOLEAN DEFAULT true,
  quality_gate_retries INT DEFAULT 0,
  sendgrid_message_id TEXT,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_archive_lead ON email_archive(lead_id, created_at);
CREATE INDEX IF NOT EXISTS idx_email_archive_intent ON email_archive(email_intent);

COMMIT;
