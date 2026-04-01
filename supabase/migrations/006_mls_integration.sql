-- ============================================
-- MIGRATION 006: MLS Integration
-- Extends properties & saved_searches tables
-- Creates: listing_price_history, listing_status_history,
--          lead_listing_interactions, comparable_sales, market_snapshots
-- ============================================

-- ============================================
-- 1. EXTEND PROPERTIES TABLE WITH MLS COLUMNS
-- ============================================

-- Pricing
ALTER TABLE properties ADD COLUMN IF NOT EXISTS original_list_price NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS sold_price NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS close_date DATE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS price_per_sqft NUMERIC GENERATED ALWAYS AS (
  CASE WHEN sqft > 0 THEN ROUND(price / sqft, 2) ELSE NULL END
) STORED;

-- Dates & market timing
ALTER TABLE properties ADD COLUMN IF NOT EXISTS list_date DATE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS pending_date DATE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS days_on_market INTEGER;

-- Extended details
ALTER TABLE properties ADD COLUMN IF NOT EXISTS subdivision TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS stories INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS garage_spaces INTEGER;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS pool BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS hoa_fee NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS hoa_frequency TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS tax_amount NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS tax_year INTEGER;

-- Schools
ALTER TABLE properties ADD COLUMN IF NOT EXISTS school_district TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS elementary_school TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS middle_school TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS high_school TEXT;

-- Media
ALTER TABLE properties ADD COLUMN IF NOT EXISTS virtual_tour_url TEXT;

-- Listing agent (GEPAR IDX compliance — must display attribution)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS list_agent_name TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS list_agent_phone TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS list_agent_email TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS list_office TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS is_lorenas_listing BOOLEAN DEFAULT false;

-- IDX compliance flags
ALTER TABLE properties ADD COLUMN IF NOT EXISTS internet_display BOOLEAN DEFAULT true;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS internet_address_display BOOLEAN DEFAULT true;

-- Sync metadata
ALTER TABLE properties ADD COLUMN IF NOT EXISTS mls_source TEXT DEFAULT 'manual';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS last_mls_sync TIMESTAMPTZ;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS mls_raw_data JSONB;

-- Indexes for MLS queries
CREATE INDEX IF NOT EXISTS idx_properties_list_date ON properties(list_date DESC);
CREATE INDEX IF NOT EXISTS idx_properties_days_on_market ON properties(days_on_market);
CREATE INDEX IF NOT EXISTS idx_properties_subdivision ON properties(subdivision);
CREATE INDEX IF NOT EXISTS idx_properties_price_status ON properties(price, status);
CREATE INDEX IF NOT EXISTS idx_properties_zip_status ON properties(zip, status);
CREATE INDEX IF NOT EXISTS idx_properties_beds_baths_price ON properties(bedrooms, bathrooms, price);
CREATE INDEX IF NOT EXISTS idx_properties_type_status ON properties(property_type, status);
CREATE INDEX IF NOT EXISTS idx_properties_mls_source ON properties(mls_source);
CREATE INDEX IF NOT EXISTS idx_properties_last_sync ON properties(last_mls_sync);

-- ============================================
-- 2. EXTEND SAVED_SEARCHES TABLE
-- ============================================

-- Explicit filter columns for n8n workflow matching
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS min_price NUMERIC;
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS max_price NUMERIC;
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS min_beds INTEGER;
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS max_beds INTEGER;
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS min_baths NUMERIC;
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS max_baths NUMERIC;
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS min_sqft INTEGER;
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS max_sqft INTEGER;
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS property_types TEXT[] DEFAULT '{}';
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS neighborhoods TEXT[] DEFAULT '{}';
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS zip_codes TEXT[] DEFAULT '{}';
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}';
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS must_have_pool BOOLEAN DEFAULT false;
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS must_have_garage BOOLEAN DEFAULT false;
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS min_year_built INTEGER;
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS max_hoa NUMERIC;

-- Alert management
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS alert_frequency TEXT DEFAULT 'daily';
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS notify_sms BOOLEAN DEFAULT false;
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS notify_email BOOLEAN DEFAULT true;
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS last_alert_sent_at TIMESTAMPTZ;
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT false;
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Trigger for updated_at on saved_searches
CREATE TRIGGER set_updated_at BEFORE UPDATE ON saved_searches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes for saved search matching
CREATE INDEX IF NOT EXISTS idx_saved_searches_active ON saved_searches(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_saved_searches_frequency ON saved_searches(alert_frequency) WHERE is_active = true;

-- ============================================
-- 3. LISTING PRICE HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS listing_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  previous_price NUMERIC,
  change_amount NUMERIC GENERATED ALWAYS AS (price - COALESCE(previous_price, price)) STORED,
  change_pct NUMERIC GENERATED ALWAYS AS (
    CASE WHEN COALESCE(previous_price, 0) > 0
    THEN ROUND(((price - previous_price) / previous_price) * 100, 2)
    ELSE 0 END
  ) STORED,
  event_type TEXT NOT NULL DEFAULT 'price_change',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_property ON listing_price_history(property_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_event ON listing_price_history(event_type, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_date ON listing_price_history(recorded_at DESC);

-- ============================================
-- 4. LISTING STATUS HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS listing_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_status_history_property ON listing_status_history(property_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_status_history_to ON listing_status_history(to_status, changed_at DESC);

-- ============================================
-- 5. LEAD-LISTING INTERACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS lead_listing_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL,
  source TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interactions_lead ON lead_listing_interactions(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_property ON lead_listing_interactions(property_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON lead_listing_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_interactions_lead_property ON lead_listing_interactions(lead_id, property_id);

-- ============================================
-- 6. COMPARABLE SALES (for HomePulse CMA)
-- ============================================
CREATE TABLE IF NOT EXISTS comparable_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  subject_address TEXT NOT NULL,
  comp_property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  comp_address TEXT NOT NULL,
  comp_sold_price NUMERIC NOT NULL,
  comp_close_date DATE NOT NULL,
  comp_sqft INTEGER,
  comp_price_per_sqft NUMERIC,
  comp_beds INTEGER,
  comp_baths NUMERIC,
  distance_miles NUMERIC,
  similarity_score NUMERIC,
  cma_report_id UUID REFERENCES cma_reports(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comps_subject ON comparable_sales(subject_property_id);
CREATE INDEX IF NOT EXISTS idx_comps_cma ON comparable_sales(cma_report_id);

-- ============================================
-- 7. MARKET SNAPSHOTS (daily aggregated stats)
-- ============================================
CREATE TABLE IF NOT EXISTS market_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  area TEXT NOT NULL,
  area_type TEXT NOT NULL DEFAULT 'neighborhood',

  -- Inventory
  active_listings INTEGER DEFAULT 0,
  new_listings_7d INTEGER DEFAULT 0,
  pending_listings INTEGER DEFAULT 0,
  sold_7d INTEGER DEFAULT 0,
  sold_30d INTEGER DEFAULT 0,

  -- Pricing
  median_list_price NUMERIC,
  median_sale_price NUMERIC,
  avg_list_price NUMERIC,
  avg_price_per_sqft NUMERIC,

  -- Market health
  avg_days_on_market NUMERIC,
  median_days_on_market NUMERIC,
  list_to_sold_ratio NUMERIC,
  inventory_months NUMERIC,

  -- Trends
  price_trend TEXT,
  price_change_30d_pct NUMERIC,
  inventory_trend TEXT,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(snapshot_date, area, area_type)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_date ON market_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_area ON market_snapshots(area, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_area_type ON market_snapshots(area_type, snapshot_date DESC);

-- ============================================
-- 8. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE listing_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_listing_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comparable_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_snapshots ENABLE ROW LEVEL SECURITY;

-- Price & status history: public read (listing data is public)
CREATE POLICY "Anyone can view price history" ON listing_price_history
  FOR SELECT USING (true);
CREATE POLICY "Agent can manage price history" ON listing_price_history
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent'));

CREATE POLICY "Anyone can view status history" ON listing_status_history
  FOR SELECT USING (true);
CREATE POLICY "Agent can manage status history" ON listing_status_history
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent'));

-- Interactions: agent sees all, clients see own
CREATE POLICY "Agent full access to interactions" ON lead_listing_interactions
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent'));
CREATE POLICY "Clients view own interactions" ON lead_listing_interactions
  FOR SELECT USING (lead_id = auth.uid());

-- Comparable sales: agent only
CREATE POLICY "Agent access to comparable_sales" ON comparable_sales
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent'));

-- Market snapshots: public read (market data is public)
CREATE POLICY "Anyone can view market snapshots" ON market_snapshots
  FOR SELECT USING (true);
CREATE POLICY "Agent can manage market snapshots" ON market_snapshots
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'agent'));

-- ============================================
-- 9. REALTIME SUBSCRIPTIONS
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE listing_price_history;
ALTER PUBLICATION supabase_realtime ADD TABLE listing_status_history;
