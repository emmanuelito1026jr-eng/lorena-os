import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase/client';
import { LISTING_PUBLIC_FIELDS, transformListings, transformListingToDisplay, sanitizeForPublicDisplay } from '../lib/mls/adapter';
import type { ListingRow } from '../lib/supabase/database.types';
import type { PropertyDisplayData } from '../lib/mls/types';

export interface ListingFilters {
  zip_code?: string;
  subdivision?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  baths?: number;
  minSqft?: number;
  maxSqft?: number;
  propertyType?: string;
  pool?: boolean;
  garage?: boolean;
  maxDom?: number;
  minYearBuilt?: number;
  keyword?: string;
  status?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'sqft_desc' | 'dom_asc';
}

interface ListingsResult {
  data: PropertyDisplayData[];
  totalCount: number;
}

const SORT_MAP: Record<string, { column: string; ascending: boolean }> = {
  newest: { column: 'list_date', ascending: false },
  price_asc: { column: 'list_price', ascending: true },
  price_desc: { column: 'list_price', ascending: false },
  sqft_desc: { column: 'sqft', ascending: false },
  dom_asc: { column: 'days_on_market', ascending: true },
};

async function fetchListings(
  filters: ListingFilters,
  page: number,
  pageSize: number
): Promise<ListingsResult> {
  const offset = (page - 1) * pageSize;
  const sort = SORT_MAP[filters.sort || 'newest'] || SORT_MAP.newest;

  let query = supabase
    .from('listings')
    .select(LISTING_PUBLIC_FIELDS, { count: 'exact' })
    .eq('status', filters.status || 'active');

  if (filters.zip_code) query = query.eq('zip_code', filters.zip_code);
  if (filters.subdivision) query = query.eq('subdivision', filters.subdivision);
  if (filters.minPrice) query = query.gte('list_price', filters.minPrice);
  if (filters.maxPrice) query = query.lte('list_price', filters.maxPrice);
  if (filters.beds) query = query.gte('beds', filters.beds);
  if (filters.baths) query = query.gte('baths', filters.baths);
  if (filters.minSqft) query = query.gte('sqft', filters.minSqft);
  if (filters.maxSqft) query = query.lte('sqft', filters.maxSqft);
  if (filters.propertyType) query = query.eq('property_type', filters.propertyType);
  if (filters.pool) query = query.eq('pool', true);
  if (filters.garage) query = query.gt('garage_spaces', 0);
  if (filters.maxDom) query = query.lte('days_on_market', filters.maxDom);
  if (filters.minYearBuilt) query = query.gte('year_built', filters.minYearBuilt);
  if (filters.keyword) {
    query = query.or(`public_remarks.ilike.%${filters.keyword}%,address.ilike.%${filters.keyword}%,description.ilike.%${filters.keyword}%,subdivision.ilike.%${filters.keyword}%`);
  }

  query = query
    .order(sort.column, { ascending: sort.ascending })
    .range(offset, offset + pageSize - 1);

  const { data, count, error } = await query;

  if (error) throw error;

  return {
    data: transformListings((data || []) as unknown as ListingRow[]),
    totalCount: count || 0,
  };
}

/**
 * Paginated listing search with filters. Returns real Supabase data only.
 * Empty results render EmptyState in the UI; errors are handled by TanStack Query.
 */
export function useListings(filters: ListingFilters = {}, page = 1, pageSize = 24) {
  return useQuery<ListingsResult>({
    queryKey: ['listings', filters, page, pageSize],
    queryFn: () => fetchListings(filters, page, pageSize),
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Single listing detail by ID (UUID) or MLS number.
 * Also returns similar listings (same zip, ±20% price, limit 3).
 * Returns null if listing not found or blocked by GEPAR rules.
 */
export function useListingDetail(id: string) {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      // Try UUID first, then MLS number
      let { data } = await supabase
        .from('listings')
        .select(LISTING_PUBLIC_FIELDS)
        .eq('id', id)
        .maybeSingle();

      if (!data) {
        const result = await supabase
          .from('listings')
          .select(LISTING_PUBLIC_FIELDS)
          .eq('mls_id', id)
          .maybeSingle();
        data = result.data;
      }

      if (!data) return null;

      // GEPAR Rule 18.3.12: Block sold/expired/withdrawn from public display
      const rowData = data as unknown as Record<string, unknown>;
      const rowStatus = rowData.status as string;
      if (rowStatus && !['active', 'pending'].includes(rowStatus)) return null;

      const row = sanitizeForPublicDisplay(rowData) as unknown as ListingRow;
      const listing = transformListingToDisplay(row);

      // Fetch similar listings
      const minPrice = listing.price * 0.8;
      const maxPrice = listing.price * 1.2;
      const { data: similarRows } = await supabase
        .from('listings')
        .select(LISTING_PUBLIC_FIELDS)
        .eq('status', 'active')
        .eq('zip_code', listing.zip)
        .gte('list_price', minPrice)
        .lte('list_price', maxPrice)
        .neq('id', row.id)
        .limit(3);

      const similar = transformListings((similarRows || []) as unknown as ListingRow[]);
      return { listing, similar };
    },
    enabled: !!id,
  });
}

/**
 * Featured listings for homepage. Prioritizes Lorena's listings with 5+ photos.
 */
export function useFeaturedListings(limit = 6) {
  return useQuery<PropertyDisplayData[]>({
    queryKey: ['featured-listings', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select(LISTING_PUBLIC_FIELDS)
        .eq('status', 'active')
        .gte('photo_count', 5)
        .order('is_lorenas_listing', { ascending: false })
        .order('list_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return transformListings((data || []) as unknown as ListingRow[]);
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Distinct neighborhoods (subdivisions) from active listings.
 */
export function useNeighborhoods() {
  return useQuery<string[]>({
    queryKey: ['listing-neighborhoods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('subdivision')
        .eq('status', 'active')
        .not('subdivision', 'is', null);

      if (error) throw error;

      const unique = [...new Set(
        (data as Array<{ subdivision: string | null }>)
          .map((r) => r.subdivision)
          .filter(Boolean)
      )] as string[];
      return unique.sort();
    },
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Check if MLS data is stale (>12h since last sync). GEPAR Rule 18.2.5.
 */
export function useMLSSyncStatus() {
  return useQuery({
    queryKey: ['mls-sync-status'],
    queryFn: async () => {
      try {
        const { data } = await supabase
          .from('mls_sync_metadata')
          .select('completed_at')
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const completedAt = (data as { completed_at: string | null } | null)?.completed_at;
        if (!completedAt) {
          return { lastSyncAt: null, hoursOld: 999, isStale: true };
        }

        const lastSyncAt = new Date(completedAt);
        const hoursOld = (Date.now() - lastSyncAt.getTime()) / (1000 * 60 * 60);
        return { lastSyncAt: completedAt, hoursOld, isStale: hoursOld > 12 };
      } catch {
        return { lastSyncAt: null, hoursOld: 0, isStale: false };
      }
    },
    staleTime: 1000 * 60 * 5,
  });
}

