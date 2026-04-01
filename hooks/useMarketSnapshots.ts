import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase/client';
import type { MarketSnapshot } from '../lib/supabase/database.types';

/**
 * Latest market snapshot for a given area. Also fetches 30-day-old snapshot for trends.
 */
export function useMarketSnapshot(area = 'El Paso', areaType = 'city') {
  return useQuery({
    queryKey: ['market-snapshot', area, areaType],
    queryFn: async () => {
      try {
        // Latest snapshot
        const { data: latest } = await supabase
          .from('market_snapshots')
          .select('*')
          .eq('area', area)
          .eq('area_type', areaType)
          .order('snapshot_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!latest) return { current: null, previous: null, hasTrend: false };

        // 30-day-old snapshot for comparison
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const { data: previous } = await supabase
          .from('market_snapshots')
          .select('*')
          .eq('area', area)
          .eq('area_type', areaType)
          .lte('snapshot_date', thirtyDaysAgo.toISOString().slice(0, 10))
          .order('snapshot_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          current: latest as MarketSnapshot,
          previous: (previous as MarketSnapshot) || null,
          hasTrend: !!previous,
        };
      } catch {
        return { current: null, previous: null, hasTrend: false };
      }
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Market trend data for charts (last N days of snapshots).
 */
export function useMarketTrend(area = 'El Paso', days = 90) {
  return useQuery<MarketSnapshot[]>({
    queryKey: ['market-trend', area, days],
    queryFn: async () => {
      try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data, error } = await supabase
          .from('market_snapshots')
          .select('*')
          .eq('area', area)
          .eq('area_type', 'city')
          .gte('snapshot_date', startDate.toISOString().slice(0, 10))
          .order('snapshot_date', { ascending: true });

        if (error) throw error;
        return (data || []) as MarketSnapshot[];
      } catch {
        return [];
      }
    },
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * All zip-level snapshots for latest date (HomePulse area breakdown).
 */
export function useZipBreakdown() {
  return useQuery<MarketSnapshot[]>({
    queryKey: ['market-zip-breakdown'],
    queryFn: async () => {
      try {
        // Get latest snapshot date for zip-level
        const { data: latest } = await supabase
          .from('market_snapshots')
          .select('snapshot_date')
          .eq('area_type', 'zip')
          .order('snapshot_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!latest) return [];

        const latestRow = latest as { snapshot_date: string };
        const { data, error } = await supabase
          .from('market_snapshots')
          .select('*')
          .eq('area_type', 'zip')
          .eq('snapshot_date', latestRow.snapshot_date)
          .order('active_count', { ascending: false });

        if (error) throw error;
        return (data || []) as MarketSnapshot[];
      } catch {
        return [];
      }
    },
    staleTime: 1000 * 60 * 10,
  });
}
