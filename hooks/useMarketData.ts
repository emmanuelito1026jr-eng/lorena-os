import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase/client';

interface MarketSnapshot {
  area: string;
  area_type: string;
  snapshot_date: string;
  active_count: number;
  new_count_7d: number;
  pending_count: number;
  sold_count_30d: number;
  median_price: number | null;
  median_sold_price: number | null;
  avg_price: number | null;
  avg_sold_price: number | null;
  avg_dom: number | null;
  median_dom: number | null;
  avg_price_per_sqft: number | null;
  median_price_per_sqft: number | null;
  months_of_inventory: number | null;
  list_to_sold_ratio: number | null;
  absorption_rate: number | null;
  new_listings_30d: number;
  sold_90d: number;
  withdrawn_30d: number;
  expired_30d: number;
  min_list_price: number | null;
  max_list_price: number | null;
  inventory_change_30d_pct: number | null;
}

interface PropertyStats {
  totalActive: number;
  avgPrice: number;
  avgDom: number;
  avgSqft: number;
  priceRanges: { range: string; count: number }[];
  byNeighborhood: { name: string; count: number; avgPrice: number }[];
  byType: { type: string; count: number }[];
}

export function useMarketSnapshots(area?: string) {
  return useQuery({
    queryKey: ['market-snapshots', area],
    queryFn: async (): Promise<MarketSnapshot[]> => {
      let query = supabase
        .from('market_snapshots')
        .select('*')
        .order('snapshot_date', { ascending: false })
        .limit(30);

      if (area) {
        query = query.eq('area', area);
      }

      const { data, error } = await query;
      if (error) {
        // Table might not exist yet — return empty
        console.warn('market_snapshots query failed:', error.message);
        return [];
      }
      return (data ?? []) as MarketSnapshot[];
    },
  });
}

export function usePropertyStats() {
  return useQuery({
    queryKey: ['property-stats'],
    queryFn: async (): Promise<PropertyStats> => {
      const { data, error } = await supabase
        .from('listings')
        .select('list_price, beds, baths, sqft, subdivision, property_type, status, days_on_market');

      if (error) {
        console.warn('listings query failed:', error.message);
        return { totalActive: 0, avgPrice: 0, avgDom: 0, avgSqft: 0, priceRanges: [], byNeighborhood: [], byType: [] };
      }

      const active = (data ?? []).filter(p => p.status === 'active');
      const totalActive = active.length;
      const avgPrice = totalActive > 0
        ? Math.round(active.reduce((s, p) => s + (p.list_price || 0), 0) / totalActive)
        : 0;
      const avgSqft = totalActive > 0
        ? Math.round(active.reduce((s, p) => s + (p.sqft || 0), 0) / totalActive)
        : 0;
      const avgDom = totalActive > 0
        ? Math.round(active.reduce((s, p) => s + (p.days_on_market || 0), 0) / totalActive)
        : 0;

      // Price ranges
      const ranges = [
        { range: 'Under $150K', min: 0, max: 150000 },
        { range: '$150K - $250K', min: 150000, max: 250000 },
        { range: '$250K - $350K', min: 250000, max: 350000 },
        { range: '$350K - $500K', min: 350000, max: 500000 },
        { range: 'Over $500K', min: 500000, max: Infinity },
      ];
      const priceRanges = ranges.map(r => ({
        range: r.range,
        count: active.filter(p => (p.list_price || 0) >= r.min && (p.list_price || 0) < r.max).length,
      }));

      // By neighborhood (subdivision)
      const neighborhoodMap = new Map<string, { count: number; totalPrice: number }>();
      for (const p of active) {
        const n = p.subdivision ?? 'Unknown';
        const existing = neighborhoodMap.get(n) ?? { count: 0, totalPrice: 0 };
        existing.count += 1;
        existing.totalPrice += (p.list_price || 0);
        neighborhoodMap.set(n, existing);
      }
      const byNeighborhood = Array.from(neighborhoodMap.entries())
        .map(([name, stats]) => ({
          name,
          count: stats.count,
          avgPrice: Math.round(stats.totalPrice / stats.count),
        }))
        .sort((a, b) => b.count - a.count);

      // By type
      const typeMap = new Map<string, number>();
      for (const p of active) {
        typeMap.set(p.property_type, (typeMap.get(p.property_type) ?? 0) + 1);
      }
      const byType = Array.from(typeMap.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);

      return {
        totalActive,
        avgPrice,
        avgDom,
        avgSqft,
        priceRanges,
        byNeighborhood,
        byType,
      };
    },
  });
}

export function useHomepulseReports() {
  return useQuery({
    queryKey: ['homepulse-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('homepulse_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });
}
