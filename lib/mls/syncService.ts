/**
 * MLS Sync Service — n8n Code Node Logic
 * ========================================
 * This file contains the complete sync logic for LOS-26 (MLS Sync Engine).
 * Copy relevant functions into n8n Code nodes.
 *
 * Architecture:
 *   Spark API → transformSparkToSupabase() → Supabase upsert
 *   Changes tracked in: listing_price_history, listing_status_history
 *   Sync state tracked in: mls_sync_metadata
 */

import {
  fetchModifiedListings,
  transformSparkToSupabase,
  type ListingUpsert,
} from './sparkApi';

// ─── Types ───────────────────────────────────────────────────

export interface SyncResult {
  syncRecordId: string;
  totalProcessed: number;
  newCount: number;
  updatedCount: number;
  priceChangedCount: number;
  statusChangedCount: number;
  maxModificationTimestamp: string;
  errors: SyncError[];
  /** Listings flagged for webhook alerts */
  alerts: SyncAlert[];
}

export interface SyncError {
  sparkId: string;
  mlsId: string;
  error: string;
}

export interface SyncAlert {
  type: 'new_listing' | 'price_change' | 'status_change';
  listingId: string;
  sparkId: string;
  data: ListingUpsert;
  oldPrice?: number;
  newPrice?: number;
  changePercent?: number;
  oldStatus?: string;
  newStatus?: string;
}

interface ExistingListing {
  id: string;
  list_price: number;
  status: string;
}

/**
 * Supabase client interface — pass your Supabase client instance.
 * This keeps the sync logic framework-agnostic (works in n8n, Edge Functions, etc.)
 */
interface QueryBuilder {
  eq: (col: string, val: string) => QueryBuilder;
  neq: (col: string, val: string) => QueryBuilder;
  order: (col: string, opts: { ascending: boolean }) => QueryBuilder;
  limit: (n: number) => QueryBuilder;
  single: () => Promise<{ data: Record<string, unknown> | null; error: unknown }>;
  maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: unknown }>;
  then: Promise<{ data: Record<string, unknown>[] | null; error: unknown }>['then'];
}

export interface SupabaseClient {
  from: (table: string) => {
    select: (columns?: string) => QueryBuilder;
    insert: (data: Record<string, unknown> | Record<string, unknown>[]) => {
      select: () => QueryBuilder & Promise<{ data: Record<string, unknown>[] | null; error: unknown }>;
    };
    update: (data: Record<string, unknown>) => {
      eq: (col: string, val: string) => Promise<{ error: unknown }>;
    };
    upsert: (data: Record<string, unknown>, opts?: { onConflict: string }) => Promise<{ error: unknown }>;
  };
  rpc: (fn: string, params: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
}

// ─── Sync Engine ─────────────────────────────────────────────

/**
 * Run an incremental sync — fetches listings modified since last sync.
 *
 * This is the main function called by n8n LOS-26 every 15 minutes.
 *
 * @param supabase - Supabase service-role client
 * @returns SyncResult with counts and alert flags
 */
export async function runIncrementalSync(supabase: SupabaseClient): Promise<SyncResult> {
  const result: SyncResult = {
    syncRecordId: '',
    totalProcessed: 0,
    newCount: 0,
    updatedCount: 0,
    priceChangedCount: 0,
    statusChangedCount: 0,
    maxModificationTimestamp: '',
    errors: [],
    alerts: [],
  };

  // Step 1: Get last sync timestamp
  const { data: lastSync } = await supabase
    .from('mls_sync_metadata')
    .select('last_modification_timestamp')
    .eq('sync_type', 'incremental_sync')
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(1)
    .single();

  const sinceTimestamp = (lastSync?.last_modification_timestamp as string) || '2020-01-01T00:00:00Z';

  // Step 2: Create sync record
  const { data: syncRecords } = await supabase
    .from('mls_sync_metadata')
    .insert({
      sync_type: 'incremental_sync',
      started_at: new Date().toISOString(),
      status: 'running',
    })
    .select();

  const syncRecord = syncRecords?.[0];
  result.syncRecordId = (syncRecord?.id as string) || '';

  try {
    // Step 3: Fetch modified listings from Spark
    const sparkListings = await fetchModifiedListings(sinceTimestamp);
    result.totalProcessed = sparkListings.length;

    if (sparkListings.length === 0) {
      // Nothing to sync — mark complete
      await completeSyncRecord(supabase, result);
      return result;
    }

    // Step 4: Process each listing
    let maxTimestamp = sinceTimestamp;

    for (const sparkListing of sparkListings) {
      try {
        const transformed = transformSparkToSupabase(sparkListing);
        const alert = await upsertListing(supabase, transformed);

        if (alert) {
          result.alerts.push(alert);
          if (alert.type === 'new_listing') result.newCount++;
          if (alert.type === 'price_change') result.priceChangedCount++;
          if (alert.type === 'status_change') result.statusChangedCount++;
          if (alert.type !== 'new_listing') result.updatedCount++;
        } else {
          result.updatedCount++;
        }

        // Track max modification timestamp
        if (transformed.spark_modification_timestamp > maxTimestamp) {
          maxTimestamp = transformed.spark_modification_timestamp;
        }
      } catch (err) {
        result.errors.push({
          sparkId: sparkListing.Id,
          mlsId: sparkListing.StandardFields.ListingId,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    result.maxModificationTimestamp = maxTimestamp;

    // Step 5: Mark sync complete
    await completeSyncRecord(supabase, result);

  } catch (err) {
    // Fatal error — mark sync failed
    await supabase
      .from('mls_sync_metadata')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: err instanceof Error ? err.message : String(err),
      })
      .eq('id', result.syncRecordId);

    throw err;
  }

  return result;
}

/**
 * Upsert a single listing and track changes.
 * Returns an alert object if the listing is new, price changed, or status changed.
 */
async function upsertListing(
  supabase: SupabaseClient,
  listing: ListingUpsert,
): Promise<SyncAlert | null> {
  // Check if listing exists
  const { data: existing } = await supabase
    .from('listings')
    .select('id, list_price, status')
    .eq('spark_id', listing.spark_id)
    .single() as unknown as { data: ExistingListing | null; error: unknown };

  if (!existing) {
    // NEW listing — insert
    const { data: inserted } = await supabase
      .from('listings')
      .insert(listing as unknown as Record<string, unknown>)
      .select();

    const listingId = (inserted?.[0]?.id as string) || '';

    // Log initial price
    await supabase.from('listing_price_history').insert({
      listing_id: listingId,
      spark_id: listing.spark_id,
      mls_id: listing.mls_id,
      old_price: null,
      new_price: listing.list_price,
      change_type: 'initial',
    }).select();

    // Log initial status
    await supabase.from('listing_status_history').insert({
      listing_id: listingId,
      spark_id: listing.spark_id,
      mls_id: listing.mls_id,
      old_status: null,
      new_status: listing.status,
    }).select();

    return {
      type: 'new_listing',
      listingId,
      sparkId: listing.spark_id,
      data: listing,
    };
  }

  // EXISTING listing — check for changes
  const listingId = existing.id;
  const priceChanged = Number(existing.list_price) !== Number(listing.list_price);
  const statusChanged = existing.status !== listing.status;

  // Always update the listing
  await supabase
    .from('listings')
    .update({
      ...listing as unknown as Record<string, unknown>,
      last_synced_at: new Date().toISOString(),
    })
    .eq('spark_id', listing.spark_id);

  // Track price change
  if (priceChanged) {
    const oldPrice = Number(existing.list_price);
    const newPrice = Number(listing.list_price);
    const changeAmount = newPrice - oldPrice;
    const changePercent = oldPrice > 0 ? (changeAmount / oldPrice) * 100 : 0;

    await supabase.from('listing_price_history').insert({
      listing_id: listingId,
      spark_id: listing.spark_id,
      mls_id: listing.mls_id,
      old_price: oldPrice,
      new_price: newPrice,
      change_amount: changeAmount,
      change_percent: Math.round(changePercent * 100) / 100,
      change_type: newPrice > oldPrice ? 'increase' : 'decrease',
    }).select();

    return {
      type: 'price_change',
      listingId,
      sparkId: listing.spark_id,
      data: listing,
      oldPrice,
      newPrice,
      changePercent: Math.round(changePercent * 100) / 100,
    };
  }

  // Track status change
  if (statusChanged) {
    await supabase.from('listing_status_history').insert({
      listing_id: listingId,
      spark_id: listing.spark_id,
      mls_id: listing.mls_id,
      old_status: existing.status,
      new_status: listing.status,
    }).select();

    return {
      type: 'status_change',
      listingId,
      sparkId: listing.spark_id,
      data: listing,
      oldStatus: existing.status,
      newStatus: listing.status,
    };
  }

  return null; // No material changes
}

/**
 * Update the sync metadata record with final counts.
 */
async function completeSyncRecord(
  supabase: SupabaseClient,
  result: SyncResult,
): Promise<void> {
  await supabase
    .from('mls_sync_metadata')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      records_processed: result.totalProcessed,
      records_new: result.newCount,
      records_updated: result.updatedCount,
      records_price_changed: result.priceChangedCount,
      records_status_changed: result.statusChangedCount,
      last_modification_timestamp: result.maxModificationTimestamp || null,
    })
    .eq('id', result.syncRecordId);
}

// ─── Market Snapshot Generator ───────────────────────────────

/**
 * SQL for generating a city-wide market snapshot.
 * Run this in n8n via Supabase SQL query or Code node.
 */
export const CITY_SNAPSHOT_SQL = `
INSERT INTO market_snapshots (area, area_type, snapshot_date,
  active_count, new_count_7d, new_listings_30d, pending_count,
  sold_count_30d, sold_90d, median_price, avg_price, median_sold_price,
  avg_price_per_sqft, avg_dom, median_dom, months_of_inventory)
SELECT
  'El Paso' as area,
  'city' as area_type,
  CURRENT_DATE as snapshot_date,
  COUNT(*) FILTER (WHERE status = 'active') as active_count,
  COUNT(*) FILTER (WHERE status = 'active' AND list_date >= CURRENT_DATE - 7) as new_count_7d,
  COUNT(*) FILTER (WHERE status = 'active' AND list_date >= CURRENT_DATE - 30) as new_listings_30d,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'sold' AND close_date >= CURRENT_DATE - 30) as sold_count_30d,
  COUNT(*) FILTER (WHERE status = 'sold' AND close_date >= CURRENT_DATE - 90) as sold_90d,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY list_price) FILTER (WHERE status = 'active') as median_price,
  AVG(list_price) FILTER (WHERE status = 'active') as avg_price,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY close_price) FILTER (WHERE status = 'sold' AND close_date >= CURRENT_DATE - 90) as median_sold_price,
  AVG(CASE WHEN sqft > 0 AND status = 'active' THEN list_price / sqft END) as avg_price_per_sqft,
  AVG(days_on_market) FILTER (WHERE status = 'active') as avg_dom,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_on_market) FILTER (WHERE status = 'active' AND days_on_market IS NOT NULL) as median_dom,
  CASE
    WHEN COUNT(*) FILTER (WHERE status = 'sold' AND close_date >= CURRENT_DATE - 30) > 0
    THEN ROUND(
      COUNT(*) FILTER (WHERE status = 'active')::NUMERIC /
      COUNT(*) FILTER (WHERE status = 'sold' AND close_date >= CURRENT_DATE - 30), 1
    )
    ELSE NULL
  END as months_of_inventory
FROM listings
ON CONFLICT (area, area_type, snapshot_date) DO UPDATE SET
  active_count = EXCLUDED.active_count,
  new_count_7d = EXCLUDED.new_count_7d,
  new_listings_30d = EXCLUDED.new_listings_30d,
  pending_count = EXCLUDED.pending_count,
  sold_count_30d = EXCLUDED.sold_count_30d,
  sold_90d = EXCLUDED.sold_90d,
  median_price = EXCLUDED.median_price,
  avg_price = EXCLUDED.avg_price,
  median_sold_price = EXCLUDED.median_sold_price,
  avg_price_per_sqft = EXCLUDED.avg_price_per_sqft,
  avg_dom = EXCLUDED.avg_dom,
  median_dom = EXCLUDED.median_dom,
  months_of_inventory = EXCLUDED.months_of_inventory;
`;

/**
 * SQL for generating per-zip market snapshots.
 * Insert results for each unique zip_code.
 */
export const ZIP_SNAPSHOT_SQL = `
INSERT INTO market_snapshots (area, area_type, snapshot_date,
  active_count, new_count_7d, new_listings_30d, pending_count,
  sold_count_30d, sold_90d, median_price, avg_price,
  avg_price_per_sqft, avg_dom, median_dom, months_of_inventory)
SELECT
  zip_code as area,
  'zip' as area_type,
  CURRENT_DATE as snapshot_date,
  COUNT(*) FILTER (WHERE status = 'active'),
  COUNT(*) FILTER (WHERE status = 'active' AND list_date >= CURRENT_DATE - 7),
  COUNT(*) FILTER (WHERE status = 'active' AND list_date >= CURRENT_DATE - 30),
  COUNT(*) FILTER (WHERE status = 'pending'),
  COUNT(*) FILTER (WHERE status = 'sold' AND close_date >= CURRENT_DATE - 30),
  COUNT(*) FILTER (WHERE status = 'sold' AND close_date >= CURRENT_DATE - 90),
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY list_price) FILTER (WHERE status = 'active'),
  AVG(list_price) FILTER (WHERE status = 'active'),
  AVG(CASE WHEN sqft > 0 AND status = 'active' THEN list_price / sqft END),
  AVG(days_on_market) FILTER (WHERE status = 'active'),
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY days_on_market) FILTER (WHERE status = 'active' AND days_on_market IS NOT NULL),
  CASE
    WHEN COUNT(*) FILTER (WHERE status = 'sold' AND close_date >= CURRENT_DATE - 30) > 0
    THEN ROUND(
      COUNT(*) FILTER (WHERE status = 'active')::NUMERIC /
      COUNT(*) FILTER (WHERE status = 'sold' AND close_date >= CURRENT_DATE - 30), 1
    )
    ELSE NULL
  END
FROM listings
WHERE zip_code IS NOT NULL
GROUP BY zip_code
ON CONFLICT (area, area_type, snapshot_date) DO UPDATE SET
  active_count = EXCLUDED.active_count,
  new_count_7d = EXCLUDED.new_count_7d,
  new_listings_30d = EXCLUDED.new_listings_30d,
  pending_count = EXCLUDED.pending_count,
  sold_count_30d = EXCLUDED.sold_count_30d,
  sold_90d = EXCLUDED.sold_90d,
  median_price = EXCLUDED.median_price,
  avg_price = EXCLUDED.avg_price,
  avg_price_per_sqft = EXCLUDED.avg_price_per_sqft,
  avg_dom = EXCLUDED.avg_dom,
  median_dom = EXCLUDED.median_dom,
  months_of_inventory = EXCLUDED.months_of_inventory;
`;

/**
 * SQL to calculate 30-day trends by comparing today's snapshot to 30 days ago.
 */
export const TRENDS_SQL = `
UPDATE market_snapshots ms SET
  price_trend = CASE
    WHEN ms.median_price > prev.median_price THEN 'up'
    WHEN ms.median_price < prev.median_price THEN 'down'
    ELSE 'flat'
  END,
  price_change_30d_pct = ROUND(
    (ms.median_price - prev.median_price) / NULLIF(prev.median_price, 0) * 100, 2
  ),
  inventory_trend = CASE
    WHEN ms.active_count > prev.active_count THEN 'increasing'
    WHEN ms.active_count < prev.active_count THEN 'decreasing'
    ELSE 'stable'
  END,
  inventory_change_30d_pct = ROUND(
    (ms.active_count - prev.active_count)::NUMERIC / NULLIF(prev.active_count, 0) * 100, 2
  )
FROM market_snapshots prev
WHERE ms.snapshot_date = CURRENT_DATE
  AND prev.area = ms.area
  AND prev.area_type = ms.area_type
  AND prev.snapshot_date = CURRENT_DATE - 30;
`;
