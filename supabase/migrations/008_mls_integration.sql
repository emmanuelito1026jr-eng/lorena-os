-- 008_mls_integration.sql
-- Spark MLS Integration Tables
-- Run in Supabase SQL Editor (reference only — n8n upserts data from Spark API)

-- =============================================================
-- 1. listings — primary MLS listings table (~3-5K rows)
-- =============================================================
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spark_id TEXT UNIQUE,
  mls_id TEXT UNIQUE,

  -- Status & Pricing
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'pending', 'sold', 'expired', 'canceled', 'withdrawn')),
  list_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  original_list_price NUMERIC(12,2),
  sold_price NUMERIC(12,2),
  close_price NUMERIC(12,2),
  close_date DATE,
  list_date DATE,
  pending_date DATE,

  -- Address
  address TEXT NOT NULL,
  unit_number TEXT,
  city TEXT NOT NULL DEFAULT 'El Paso',
  state TEXT NOT NULL DEFAULT 'TX',
  zip_code TEXT NOT NULL,
  county TEXT DEFAULT 'El Paso',
  subdivision TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),

  -- Property Details
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

  -- Days on Market
  days_on_market INTEGER DEFAULT 0,
  cumulative_dom INTEGER DEFAULT 0,

  -- Descriptions
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

  -- Financials
  hoa_fee NUMERIC(8,2),
  hoa_frequency TEXT,
  tax_amount NUMERIC(10,2),
  tax_year INTEGER,

  -- Schools
  school_district TEXT,
  elementary_school TEXT,
  middle_school TEXT,
  high_school TEXT,

  -- Media
  photos JSONB DEFAULT '[]'::jsonb,
  photo_count INTEGER DEFAULT 0,
  primary_photo_url TEXT,
  virtual_tour_url TEXT,

  -- Agent / Office
  listing_agent_id TEXT,
  listing_agent_name TEXT,
  listing_agent_phone TEXT,
  listing_agent_email TEXT,
  listing_office_name TEXT,
  listing_office_id TEXT,
  co_listing_agent_name TEXT,
  buyer_agent_name TEXT,
  buyer_office_name TEXT,

  -- Lorena Flag
  is_lorenas_listing BOOLEAN DEFAULT false,

  -- Compliance
  display_compliance JSONB DEFAULT '{}'::jsonb,
  mls_name TEXT DEFAULT 'GEPAR',

  -- Sync Metadata
  raw_spark_data JSONB,
  spark_modification_timestamp TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for hot query paths
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_city_zip ON listings(city, zip_code);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(list_price);
CREATE INDEX IF NOT EXISTS idx_listings_beds_baths ON listings(beds, baths);
CREATE INDEX IF NOT EXISTS idx_listings_lorena ON listings(is_lorenas_listing) WHERE is_lorenas_listing = true;
CREATE INDEX IF NOT EXISTS idx_listings_list_date ON listings(list_date DESC);
CREATE INDEX IF NOT EXISTS idx_listings_spark_id ON listings(spark_id);
CREATE INDEX IF NOT EXISTS idx_listings_subdivision ON listings(subdivision);

-- =============================================================
-- 2. listing_price_history — price changes over time
-- =============================================================
CREATE TABLE IF NOT EXISTS listing_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  old_price NUMERIC(12,2),
  new_price NUMERIC(12,2) NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_listing ON listing_price_history(listing_id, changed_at DESC);

-- =============================================================
-- 3. listing_status_history — status transitions
-- =============================================================
CREATE TABLE IF NOT EXISTS listing_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_status_history_listing ON listing_status_history(listing_id, changed_at DESC);

-- =============================================================
-- 4. lead_listing_interactions — track lead ↔ listing events
-- =============================================================
CREATE TABLE IF NOT EXISTS lead_listing_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL
    CHECK (interaction_type IN ('viewed', 'favorited', 'shared', 'alerted', 'email_clicked', 'showing_requested', 'contacted')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interactions_lead ON lead_listing_interactions(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_listing ON lead_listing_interactions(listing_id);

-- =============================================================
-- 5. listing_alert_queue — pending property alerts
-- =============================================================
CREATE TABLE IF NOT EXISTS listing_alert_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_search_id UUID NOT NULL REFERENCES saved_searches(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'skipped')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_queue_pending ON listing_alert_queue(status, created_at) WHERE status = 'pending';

-- =============================================================
-- 6. market_snapshots — daily/weekly market aggregations
-- =============================================================
CREATE TABLE IF NOT EXISTS market_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area TEXT NOT NULL,
  area_type TEXT NOT NULL DEFAULT 'city'
    CHECK (area_type IN ('city', 'zip', 'subdivision')),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Stats
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

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(area, area_type, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_area_date ON market_snapshots(area, area_type, snapshot_date DESC);

-- =============================================================
-- 7. comparable_sales — CMA comparable property records
-- =============================================================
CREATE TABLE IF NOT EXISTS comparable_sales (
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comps_report ON comparable_sales(cma_report_id);

-- =============================================================
-- 8. mls_sync_metadata — n8n sync tracking
-- =============================================================
CREATE TABLE IF NOT EXISTS mls_sync_metadata (
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
  error_log JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_sync_meta_latest ON mls_sync_metadata(sync_type, completed_at DESC);

-- =============================================================
-- 9. Extend saved_searches with alert columns
-- =============================================================
ALTER TABLE saved_searches
  ADD COLUMN IF NOT EXISTS filter_json JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS alert_frequency TEXT DEFAULT 'instant'
    CHECK (alert_frequency IN ('instant', 'daily', 'weekly', 'never')),
  ADD COLUMN IF NOT EXISTS last_alerted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS match_count INTEGER DEFAULT 0;

-- =============================================================
-- RLS Policies
-- =============================================================

-- listings: public read, no public write
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active listings"
  ON listings FOR SELECT
  USING (status IN ('active', 'pending'));

-- market_snapshots: public read
ALTER TABLE market_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view market snapshots"
  ON market_snapshots FOR SELECT
  USING (true);

-- lead_listing_interactions: agent sees all, leads see own
ALTER TABLE lead_listing_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agent can view all interactions"
  ON lead_listing_interactions FOR SELECT
  USING (true);

-- comparable_sales: agent only
ALTER TABLE comparable_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agent can view comparable sales"
  ON comparable_sales FOR SELECT
  USING (true);

-- listing_alert_queue: agent only
ALTER TABLE listing_alert_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agent can view alert queue"
  ON listing_alert_queue FOR SELECT
  USING (true);

-- mls_sync_metadata: agent only
ALTER TABLE mls_sync_metadata ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agent can view sync metadata"
  ON mls_sync_metadata FOR SELECT
  USING (true);

-- Enable Realtime on listings
ALTER PUBLICATION supabase_realtime ADD TABLE listings;
ALTER PUBLICATION supabase_realtime ADD TABLE lead_listing_interactions;
