-- ============================================
-- MIGRATION 010: Combined MLS Integration (Safe / Idempotent)
-- Fixes conflict with migration 006 (old tables had property_id → properties).
-- Drops empty 006-era tables, then creates fresh with listing_id → listings.
-- Safe to run multiple times. Paste ENTIRE block into Supabase SQL Editor.
-- ============================================

-- =============================================================
-- STEP 0: CLEANUP OLD 006-ERA TABLES
-- These were created by migration 006 with property_id references
-- to the old "properties" table. We need listing_id references to
-- the new "listings" table instead. These tables are empty (no real
-- MLS data yet), so dropping is safe.
-- =============================================================

-- Remove from realtime publication first (if they were added)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE listing_price_history;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE listing_status_history;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime DROP TABLE lead_listing_interactions;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Drop old tables (CASCADE removes their indexes, policies, triggers)
DROP TABLE IF EXISTS listing_price_history CASCADE;
DROP TABLE IF EXISTS listing_status_history CASCADE;
DROP TABLE IF EXISTS lead_listing_interactions CASCADE;
DROP TABLE IF EXISTS comparable_sales CASCADE;
DROP TABLE IF EXISTS listing_alert_queue CASCADE;
DROP TABLE IF EXISTS mls_sync_metadata CASCADE;
DROP TABLE IF EXISTS idx_page_views CASCADE;

-- Also drop market_snapshots — it exists from 006 with different
-- column names (active_listings vs active_count, etc.) and is empty.
DROP TABLE IF EXISTS market_snapshots CASCADE;

-- =============================================================
-- 1. LISTINGS TABLE (the new primary MLS table)
-- =============================================================
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spark_id TEXT UNIQUE,
  mls_id TEXT UNIQUE,

  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'pending', 'sold', 'expired', 'canceled', 'withdrawn')),
  list_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  original_list_price NUMERIC(12,2),
  sold_price NUMERIC(12,2),
  close_price NUMERIC(12,2),
  close_date DATE,
  list_date DATE,
  pending_date DATE,

  address TEXT NOT NULL,
  unit_number TEXT,
  city TEXT NOT NULL DEFAULT 'El Paso',
  state TEXT NOT NULL DEFAULT 'TX',
  zip_code TEXT NOT NULL,
  county TEXT DEFAULT 'El Paso',
  subdivision TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),

  property_type TEXT DEFAULT 'Residential',
  property_subtype TEXT,
  beds INTEGER DEFAULT 0,
  baths INTEGER DEFAULT 0,
  half_baths INTEGER DEFAULT 0,
  sqft INTEGER DEFAULT 0,
  lot_sqft INTEGER,
  lot_acres NUMERIC(8,4),
  year_built INTEGER,
  stories INTEGER,
  garage_spaces INTEGER DEFAULT 0,
  pool BOOLEAN DEFAULT false,

  days_on_market INTEGER DEFAULT 0,
  cumulative_dom INTEGER DEFAULT 0,

  description TEXT,
  public_remarks TEXT,
  features TEXT[],
  interior_features TEXT[],
  exterior_features TEXT[],
  appliances TEXT[],
  heating TEXT,
  cooling TEXT,
  construction TEXT,
  roof TEXT,
  foundation TEXT,
  parking_description TEXT,

  hoa_fee NUMERIC(8,2),
  hoa_frequency TEXT,
  tax_amount NUMERIC(10,2),
  tax_year INTEGER,

  school_district TEXT,
  elementary_school TEXT,
  middle_school TEXT,
  high_school TEXT,

  photos JSONB DEFAULT '[]'::jsonb,
  photo_count INTEGER DEFAULT 0,
  primary_photo_url TEXT,
  virtual_tour_url TEXT,
  video_url TEXT,

  listing_agent_id TEXT,
  listing_agent_name TEXT,
  listing_agent_phone TEXT,
  listing_agent_email TEXT,
  listing_office_name TEXT,
  listing_office_id TEXT,
  co_listing_agent_name TEXT,
  buyer_agent_name TEXT,
  buyer_office_name TEXT,

  is_lorenas_listing BOOLEAN DEFAULT false,

  display_compliance JSONB DEFAULT '{}'::jsonb,
  mls_name TEXT DEFAULT 'GEPAR',

  association_fee NUMERIC,

  raw_spark_data JSONB,
  spark_modification_timestamp TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated column for price_per_sqft
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'price_per_sqft'
  ) THEN
    ALTER TABLE listings ADD COLUMN price_per_sqft NUMERIC
      GENERATED ALWAYS AS (
        CASE WHEN sqft > 0 THEN ROUND(list_price / sqft, 2) ELSE NULL END
      ) STORED;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_city_zip ON listings(city, zip_code);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(list_price);
CREATE INDEX IF NOT EXISTS idx_listings_beds_baths ON listings(beds, baths);
CREATE INDEX IF NOT EXISTS idx_listings_lorena ON listings(is_lorenas_listing) WHERE is_lorenas_listing = true;
CREATE INDEX IF NOT EXISTS idx_listings_list_date ON listings(list_date DESC);
CREATE INDEX IF NOT EXISTS idx_listings_spark_id ON listings(spark_id);
CREATE INDEX IF NOT EXISTS idx_listings_subdivision ON listings(subdivision);
CREATE INDEX IF NOT EXISTS idx_listings_mls_id ON listings(mls_id);
CREATE INDEX IF NOT EXISTS idx_listings_location ON listings(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_listings_sqft ON listings(sqft);
CREATE INDEX IF NOT EXISTS idx_listings_modification ON listings(spark_modification_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_listings_active_price ON listings(list_price) WHERE status = 'active';

-- RLS
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'listings' AND policyname = 'Public can view active listings'
  ) THEN
    CREATE POLICY "Public can view active listings" ON listings FOR SELECT
      USING (status IN ('active', 'pending'));
  END IF;
END $$;

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'listings_updated_at') THEN
    CREATE TRIGGER listings_updated_at
      BEFORE UPDATE ON listings
      FOR EACH ROW
      EXECUTE FUNCTION update_listings_updated_at();
  END IF;
END $$;

-- =============================================================
-- 2. LISTING_PRICE_HISTORY (fresh — old one dropped above)
-- =============================================================
CREATE TABLE listing_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  old_price NUMERIC(12,2),
  new_price NUMERIC(12,2) NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  spark_id TEXT,
  mls_id TEXT,
  change_amount NUMERIC,
  change_percent NUMERIC,
  change_type TEXT DEFAULT 'initial'
);

CREATE INDEX idx_price_history_listing ON listing_price_history(listing_id, changed_at DESC);
CREATE INDEX idx_price_history_date ON listing_price_history(changed_at DESC);

-- =============================================================
-- 3. LISTING_STATUS_HISTORY (fresh — old one dropped above)
-- =============================================================
CREATE TABLE listing_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  spark_id TEXT,
  mls_id TEXT
);

CREATE INDEX idx_status_history_listing ON listing_status_history(listing_id, changed_at DESC);
CREATE INDEX idx_status_history_date ON listing_status_history(changed_at DESC);

-- =============================================================
-- 4. LEAD_LISTING_INTERACTIONS (fresh — old one dropped above)
-- =============================================================
CREATE TABLE lead_listing_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL
    CHECK (interaction_type IN (
      'viewed', 'favorited', 'unfavorited', 'shared', 'toured',
      'offer_submitted', 'rejected', 'inquired', 'alerted',
      'email_clicked', 'sms_clicked', 'showing_requested', 'contacted',
      'price_drop_alerted', 'back_on_market_alerted'
    )),
  metadata JSONB DEFAULT '{}'::jsonb,
  spark_id TEXT,
  mls_id TEXT,
  source TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interactions_lead ON lead_listing_interactions(lead_id, created_at DESC);
CREATE INDEX idx_interactions_listing ON lead_listing_interactions(listing_id);

ALTER TABLE lead_listing_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agent can view all interactions" ON lead_listing_interactions FOR SELECT USING (true);

-- =============================================================
-- 5. LISTING_ALERT_QUEUE (fresh)
-- =============================================================
CREATE TABLE listing_alert_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_search_id UUID REFERENCES saved_searches(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  alert_type TEXT DEFAULT 'new_listing',
  frequency TEXT DEFAULT 'instant',
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alert_queue_pending ON listing_alert_queue(status, created_at) WHERE status = 'pending';
CREATE INDEX idx_alert_queue_lead ON listing_alert_queue(lead_id);

ALTER TABLE listing_alert_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agent can view alert queue" ON listing_alert_queue FOR SELECT USING (true);

-- =============================================================
-- 6. MARKET_SNAPSHOTS (fresh — old one dropped above)
-- =============================================================
CREATE TABLE market_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area TEXT NOT NULL,
  area_type TEXT NOT NULL DEFAULT 'city'
    CHECK (area_type IN ('city', 'zip', 'subdivision')),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,

  active_count INTEGER DEFAULT 0,
  pending_count INTEGER DEFAULT 0,
  sold_count_30d INTEGER DEFAULT 0,
  new_count_7d INTEGER DEFAULT 0,
  median_price NUMERIC(12,2),
  avg_price NUMERIC(12,2),
  avg_price_per_sqft NUMERIC(8,2),
  avg_dom INTEGER,
  median_dom INTEGER,
  months_of_inventory NUMERIC(4,2),
  list_to_sold_ratio NUMERIC(5,4),

  new_listings_30d INTEGER DEFAULT 0,
  sold_90d INTEGER DEFAULT 0,
  withdrawn_30d INTEGER DEFAULT 0,
  expired_30d INTEGER DEFAULT 0,
  median_sold_price NUMERIC,
  avg_sold_price NUMERIC,
  median_price_per_sqft NUMERIC,
  min_list_price NUMERIC,
  max_list_price NUMERIC,
  absorption_rate NUMERIC,
  inventory_change_30d_pct NUMERIC,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(area, area_type, snapshot_date)
);

CREATE INDEX idx_snapshots_area_date ON market_snapshots(area, area_type, snapshot_date DESC);

ALTER TABLE market_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view market snapshots" ON market_snapshots FOR SELECT USING (true);

-- =============================================================
-- 7. COMPARABLE_SALES (fresh — old one dropped above)
-- =============================================================
CREATE TABLE comparable_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cma_report_id UUID REFERENCES cma_reports(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  address TEXT NOT NULL,
  sold_price NUMERIC(12,2),
  close_date DATE,
  beds INTEGER,
  baths INTEGER,
  sqft INTEGER,
  price_per_sqft NUMERIC(8,2),
  days_on_market INTEGER,
  similarity_score NUMERIC(5,4),
  included_in_calc BOOLEAN DEFAULT true,
  subject_address TEXT,
  subject_zip TEXT,
  subject_beds INTEGER,
  subject_baths NUMERIC,
  subject_sqft INTEGER,
  subject_year_built INTEGER,
  subject_estimated_value NUMERIC,
  comp_spark_id TEXT,
  comp_mls_id TEXT,
  comp_year_built INTEGER,
  comp_distance_miles NUMERIC,
  comp_photos JSONB DEFAULT '[]'::jsonb,
  adjustment_notes TEXT,
  report_generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comps_report ON comparable_sales(cma_report_id);
CREATE INDEX idx_comps_address ON comparable_sales(subject_address);
CREATE INDEX idx_comps_zip ON comparable_sales(subject_zip);

ALTER TABLE comparable_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agent can view comparable sales" ON comparable_sales FOR SELECT USING (true);

-- =============================================================
-- 8. MLS_SYNC_METADATA (fresh)
-- =============================================================
CREATE TABLE mls_sync_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL DEFAULT 'full'
    CHECK (sync_type IN ('full', 'incremental', 'photos', 'market_snapshot')),
  status TEXT NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'completed', 'failed')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  records_new INTEGER DEFAULT 0,
  records_price_changed INTEGER DEFAULT 0,
  records_status_changed INTEGER DEFAULT 0,
  last_modification_timestamp TIMESTAMPTZ,
  error_message TEXT,
  error_log JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_sync_meta_latest ON mls_sync_metadata(sync_type, completed_at DESC);
CREATE INDEX idx_sync_status ON mls_sync_metadata(status, sync_type);
CREATE INDEX idx_sync_date ON mls_sync_metadata(started_at DESC);

ALTER TABLE mls_sync_metadata ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agent can view sync metadata" ON mls_sync_metadata FOR SELECT USING (true);

-- =============================================================
-- 9. IDX_PAGE_VIEWS (GEPAR Audit Trail)
-- =============================================================
CREATE TABLE idx_page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  mls_id TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  referrer TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_page_views_date ON idx_page_views(viewed_at DESC);
CREATE INDEX idx_page_views_listing ON idx_page_views(listing_id);

ALTER TABLE idx_page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agent can view page views" ON idx_page_views FOR SELECT USING (true);
CREATE POLICY "Anyone can insert page views" ON idx_page_views FOR INSERT WITH CHECK (true);

-- =============================================================
-- 10. EXTEND saved_searches (table already exists)
-- =============================================================
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS filter_json JSONB DEFAULT '{}'::jsonb;
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS last_alerted_at TIMESTAMPTZ;
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS match_count INTEGER DEFAULT 0;
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS cities TEXT[] DEFAULT '{El Paso}';
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS max_dom INTEGER;
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS max_year_built INTEGER;
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS last_matched_count INTEGER DEFAULT 0;
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS alert_enabled BOOLEAN DEFAULT true;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_searches' AND column_name = 'alert_frequency'
  ) THEN
    ALTER TABLE saved_searches ADD COLUMN alert_frequency TEXT DEFAULT 'instant';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_saved_searches_lead ON saved_searches(lead_id);

-- =============================================================
-- 11. EXTEND deals TABLE (add listing_id FK)
-- =============================================================
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'deals') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'listing_id') THEN
      ALTER TABLE deals ADD COLUMN listing_id UUID REFERENCES listings(id);
      CREATE INDEX idx_deals_listing ON deals(listing_id);
    END IF;
  END IF;
END $$;

-- =============================================================
-- 12. ENABLE REALTIME
-- =============================================================
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE listings;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE lead_listing_interactions;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;
