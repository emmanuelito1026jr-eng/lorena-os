-- ============================================
-- MIGRATION 009: Spark MLS Alignment
-- Brings schema into full alignment with Spark API field mapping.
-- Run AFTER migrations 001-008.
-- ============================================

-- =============================================================
-- 1. LISTINGS TABLE — add missing columns from Spark API mapping
-- =============================================================

-- Generated price_per_sqft column
ALTER TABLE listings ADD COLUMN IF NOT EXISTS price_per_sqft NUMERIC
  GENERATED ALWAYS AS (
    CASE WHEN sqft > 0 THEN ROUND(list_price / sqft, 2) ELSE NULL END
  ) STORED;

-- Additional media
ALTER TABLE listings ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Financial fields
ALTER TABLE listings ADD COLUMN IF NOT EXISTS association_fee NUMERIC;

-- Features as JSONB (supplements TEXT[] columns already present)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb;

-- Roof/foundation already TEXT in 008, construction also TEXT.
-- Add construction as TEXT[] for array support (Spark sends arrays)
-- Keep existing `construction TEXT` for backward compat, add new column:
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'construction'
    AND data_type = 'ARRAY'
  ) THEN
    -- If construction exists as TEXT, rename it and create as array
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'listings' AND column_name = 'construction'
    ) THEN
      ALTER TABLE listings RENAME COLUMN construction TO construction_legacy;
      ALTER TABLE listings ADD COLUMN construction TEXT[];
    END IF;
  END IF;
END $$;

-- Update mls_name default to full name
ALTER TABLE listings ALTER COLUMN mls_name SET DEFAULT 'Greater El Paso MLS';

-- Missing indexes
CREATE INDEX IF NOT EXISTS idx_listings_mls_id ON listings(mls_id);
CREATE INDEX IF NOT EXISTS idx_listings_location ON listings(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_listings_sqft ON listings(sqft);
CREATE INDEX IF NOT EXISTS idx_listings_modification ON listings(spark_modification_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_listings_active_price ON listings(list_price) WHERE status = 'active';

-- =============================================================
-- 2. LISTING_PRICE_HISTORY — add Spark tracking columns
-- =============================================================

ALTER TABLE listing_price_history ADD COLUMN IF NOT EXISTS spark_id TEXT;
ALTER TABLE listing_price_history ADD COLUMN IF NOT EXISTS mls_id TEXT;
ALTER TABLE listing_price_history ADD COLUMN IF NOT EXISTS change_amount NUMERIC;
ALTER TABLE listing_price_history ADD COLUMN IF NOT EXISTS change_percent NUMERIC;
ALTER TABLE listing_price_history ADD COLUMN IF NOT EXISTS change_type TEXT DEFAULT 'initial';

CREATE INDEX IF NOT EXISTS idx_price_history_date ON listing_price_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_spark ON listing_price_history(spark_id);

-- =============================================================
-- 3. LISTING_STATUS_HISTORY — add Spark tracking columns
-- =============================================================

ALTER TABLE listing_status_history ADD COLUMN IF NOT EXISTS spark_id TEXT;
ALTER TABLE listing_status_history ADD COLUMN IF NOT EXISTS mls_id TEXT;

CREATE INDEX IF NOT EXISTS idx_status_history_date ON listing_status_history(changed_at DESC);

-- =============================================================
-- 4. LEAD_LISTING_INTERACTIONS — expand interaction types + add fields
-- =============================================================

-- Drop old CHECK constraint and add new one with all Spark-era types
DO $$ BEGIN
  -- Drop the old constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'lead_listing_interactions'
      AND constraint_type = 'CHECK'
      AND constraint_name LIKE '%interaction_type%'
  ) THEN
    ALTER TABLE lead_listing_interactions
      DROP CONSTRAINT IF EXISTS lead_listing_interactions_interaction_type_check;
  END IF;
END $$;

-- Add the expanded CHECK constraint
ALTER TABLE lead_listing_interactions DROP CONSTRAINT IF EXISTS lead_listing_interactions_interaction_type_check;
ALTER TABLE lead_listing_interactions ADD CONSTRAINT lead_listing_interactions_interaction_type_check
  CHECK (interaction_type IN (
    'viewed', 'favorited', 'unfavorited', 'shared', 'toured',
    'offer_submitted', 'rejected', 'inquired', 'alerted',
    'email_clicked', 'sms_clicked', 'showing_requested', 'contacted',
    'price_drop_alerted', 'back_on_market_alerted'
  ));

-- Add missing columns
ALTER TABLE lead_listing_interactions ADD COLUMN IF NOT EXISTS spark_id TEXT;
ALTER TABLE lead_listing_interactions ADD COLUMN IF NOT EXISTS mls_id TEXT;
ALTER TABLE lead_listing_interactions ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE lead_listing_interactions ADD COLUMN IF NOT EXISTS notes TEXT;

-- Unique index for favorites (prevent duplicate favorites)
CREATE UNIQUE INDEX IF NOT EXISTS idx_lli_unique_favorite
  ON lead_listing_interactions(lead_id, listing_id, interaction_type)
  WHERE interaction_type IN ('favorited', 'toured', 'offer_submitted');

-- =============================================================
-- 5. LISTING_ALERT_QUEUE — add alert_type and frequency columns
-- =============================================================

ALTER TABLE listing_alert_queue ADD COLUMN IF NOT EXISTS alert_type TEXT DEFAULT 'new_listing';
ALTER TABLE listing_alert_queue ADD COLUMN IF NOT EXISTS frequency TEXT DEFAULT 'instant';
ALTER TABLE listing_alert_queue ADD COLUMN IF NOT EXISTS sent BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_alert_queue_unsent ON listing_alert_queue(sent, frequency) WHERE sent = false;
CREATE INDEX IF NOT EXISTS idx_alert_queue_lead ON listing_alert_queue(lead_id);

-- =============================================================
-- 6. MARKET_SNAPSHOTS — add comprehensive stats columns
-- =============================================================

ALTER TABLE market_snapshots ADD COLUMN IF NOT EXISTS new_listings_30d INTEGER DEFAULT 0;
ALTER TABLE market_snapshots ADD COLUMN IF NOT EXISTS sold_90d INTEGER DEFAULT 0;
ALTER TABLE market_snapshots ADD COLUMN IF NOT EXISTS withdrawn_30d INTEGER DEFAULT 0;
ALTER TABLE market_snapshots ADD COLUMN IF NOT EXISTS expired_30d INTEGER DEFAULT 0;
ALTER TABLE market_snapshots ADD COLUMN IF NOT EXISTS median_sold_price NUMERIC;
ALTER TABLE market_snapshots ADD COLUMN IF NOT EXISTS avg_sold_price NUMERIC;
ALTER TABLE market_snapshots ADD COLUMN IF NOT EXISTS median_price_per_sqft NUMERIC;
ALTER TABLE market_snapshots ADD COLUMN IF NOT EXISTS min_list_price NUMERIC;
ALTER TABLE market_snapshots ADD COLUMN IF NOT EXISTS max_list_price NUMERIC;
ALTER TABLE market_snapshots ADD COLUMN IF NOT EXISTS absorption_rate NUMERIC;
ALTER TABLE market_snapshots ADD COLUMN IF NOT EXISTS inventory_change_30d_pct NUMERIC;

-- =============================================================
-- 7. MLS_SYNC_METADATA — add Spark sync tracking columns
-- =============================================================

ALTER TABLE mls_sync_metadata ADD COLUMN IF NOT EXISTS records_new INTEGER DEFAULT 0;
ALTER TABLE mls_sync_metadata ADD COLUMN IF NOT EXISTS records_price_changed INTEGER DEFAULT 0;
ALTER TABLE mls_sync_metadata ADD COLUMN IF NOT EXISTS records_status_changed INTEGER DEFAULT 0;
ALTER TABLE mls_sync_metadata ADD COLUMN IF NOT EXISTS last_modification_timestamp TIMESTAMPTZ;
ALTER TABLE mls_sync_metadata ADD COLUMN IF NOT EXISTS error_message TEXT;

CREATE INDEX IF NOT EXISTS idx_sync_status ON mls_sync_metadata(status, sync_type);
CREATE INDEX IF NOT EXISTS idx_sync_date ON mls_sync_metadata(started_at DESC);

-- =============================================================
-- 8. COMPARABLE_SALES — add subject/comp detail columns for CMA
-- =============================================================

ALTER TABLE comparable_sales ADD COLUMN IF NOT EXISTS subject_address TEXT;
ALTER TABLE comparable_sales ADD COLUMN IF NOT EXISTS subject_zip TEXT;
ALTER TABLE comparable_sales ADD COLUMN IF NOT EXISTS subject_beds INTEGER;
ALTER TABLE comparable_sales ADD COLUMN IF NOT EXISTS subject_baths NUMERIC;
ALTER TABLE comparable_sales ADD COLUMN IF NOT EXISTS subject_sqft INTEGER;
ALTER TABLE comparable_sales ADD COLUMN IF NOT EXISTS subject_year_built INTEGER;
ALTER TABLE comparable_sales ADD COLUMN IF NOT EXISTS subject_estimated_value NUMERIC;
ALTER TABLE comparable_sales ADD COLUMN IF NOT EXISTS comp_spark_id TEXT;
ALTER TABLE comparable_sales ADD COLUMN IF NOT EXISTS comp_mls_id TEXT;
ALTER TABLE comparable_sales ADD COLUMN IF NOT EXISTS comp_year_built INTEGER;
ALTER TABLE comparable_sales ADD COLUMN IF NOT EXISTS comp_distance_miles NUMERIC;
ALTER TABLE comparable_sales ADD COLUMN IF NOT EXISTS comp_photos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE comparable_sales ADD COLUMN IF NOT EXISTS adjustment_notes TEXT;
ALTER TABLE comparable_sales ADD COLUMN IF NOT EXISTS report_generated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_comps_address ON comparable_sales(subject_address);
CREATE INDEX IF NOT EXISTS idx_comps_zip ON comparable_sales(subject_zip);
CREATE INDEX IF NOT EXISTS idx_comps_date ON comparable_sales(report_generated_at DESC);

-- =============================================================
-- 9. SAVED_SEARCHES — add columns for alert matching engine
-- =============================================================

ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS cities TEXT[] DEFAULT '{El Paso}';
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS max_dom INTEGER;
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS max_year_built INTEGER;
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS last_matched_count INTEGER DEFAULT 0;
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS alert_enabled BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_saved_searches_lead ON saved_searches(lead_id);

-- =============================================================
-- 10. ADD listing_id TO deals TABLE (if exists)
-- =============================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'deals') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'listing_id') THEN
      ALTER TABLE deals ADD COLUMN listing_id UUID REFERENCES listings(id);
      CREATE INDEX idx_deals_listing ON deals(listing_id);
    END IF;
  END IF;
END $$;

-- =============================================================
-- 11. AUTO-UPDATE triggers for updated_at
-- =============================================================

CREATE OR REPLACE FUNCTION update_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create triggers if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'listings_updated_at'
  ) THEN
    CREATE TRIGGER listings_updated_at
      BEFORE UPDATE ON listings
      FOR EACH ROW
      EXECUTE FUNCTION update_listings_updated_at();
  END IF;
END $$;

-- =============================================================
-- 12. IDX PAGE VIEWS AUDIT TRAIL (GEPAR Rule 18.3.15)
-- =============================================================
-- MLS can request this data. Auto-delete after 180 days via cron.

CREATE TABLE IF NOT EXISTS idx_page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  mls_id TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  referrer TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_views_date ON idx_page_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_listing ON idx_page_views(listing_id);

ALTER TABLE idx_page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agent can view page views" ON idx_page_views
  FOR SELECT USING (true);
CREATE POLICY "Anyone can insert page views" ON idx_page_views
  FOR INSERT WITH CHECK (true);

-- =============================================================
-- 13. SERVICE ROLE policies for n8n sync (INSERT/UPDATE)
-- =============================================================
-- The anon/public policies from 008 handle reads.
-- Service role (used by n8n) bypasses RLS automatically.
-- No additional policies needed — service_role key has full access.
