import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase/client';
import { LISTING_PUBLIC_FIELDS, transformListings } from '../lib/mls/adapter';
import type { ListingRow, InsertTables } from '../lib/supabase/database.types';
import type { PropertyDisplayData } from '../lib/mls/types';

interface CompCriteria {
  subjectZip: string;
  subjectBeds: number;
  subjectSqft: number;
  subjectYearBuilt?: number;
}

/**
 * Find comparable sold listings for CMA.
 * Same zip, ±1 bed, ±20% sqft (min 300), ±15 years built, sold within 6 months.
 */
export function useComparableSales(criteria: CompCriteria | null) {
  return useQuery<PropertyDisplayData[]>({
    queryKey: ['comparable-sales', criteria?.subjectZip, criteria?.subjectBeds, criteria?.subjectSqft],
    queryFn: async () => {
      if (!criteria) return [];
      try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const sqftMin = Math.max(criteria.subjectSqft * 0.8, criteria.subjectSqft - 300);
        const sqftMax = criteria.subjectSqft * 1.2;
        const bedsMin = Math.max(criteria.subjectBeds - 1, 1);
        const bedsMax = criteria.subjectBeds + 1;

        let query = supabase
          .from('listings')
          .select(LISTING_PUBLIC_FIELDS)
          .eq('status', 'sold')
          .eq('zip_code', criteria.subjectZip)
          .gte('beds', bedsMin)
          .lte('beds', bedsMax)
          .gte('sqft', sqftMin)
          .lte('sqft', sqftMax)
          .not('sold_price', 'is', null)
          .gte('close_date', sixMonthsAgo.toISOString().slice(0, 10))
          .order('close_date', { ascending: false })
          .limit(10);

        if (criteria.subjectYearBuilt) {
          query = query
            .gte('year_built', criteria.subjectYearBuilt - 15)
            .lte('year_built', criteria.subjectYearBuilt + 15);
        }

        const { data, error } = await query;
        if (error) throw error;
        return transformListings((data || []) as unknown as ListingRow[]);
      } catch {
        return [];
      }
    },
    enabled: !!criteria,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Save comparable sales to the comparable_sales table (linked to a CMA report).
 */
export function useSaveComparableSales() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cmaReportId,
      comps,
    }: {
      cmaReportId: string;
      comps: Array<{
        listingId?: string;
        address: string;
        soldPrice: number;
        closeDate: string;
        beds: number;
        baths: number;
        sqft: number;
        pricePerSqft: number;
        dom: number;
        similarityScore?: number;
        included: boolean;
      }>;
    }) => {
      const rows = comps.map((c) => ({
        cma_report_id: cmaReportId,
        listing_id: c.listingId || null,
        address: c.address,
        sold_price: c.soldPrice,
        close_date: c.closeDate,
        beds: c.beds,
        baths: c.baths,
        sqft: c.sqft,
        price_per_sqft: c.pricePerSqft,
        days_on_market: c.dom,
        similarity_score: c.similarityScore || null,
        included_in_calc: c.included,
      }));

      const { data, error } = await supabase
        .from('comparable_sales')
        .insert(rows as InsertTables<'comparable_sales'>[])
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comparable-sales'] });
      queryClient.invalidateQueries({ queryKey: ['cma-reports'] });
    },
  });
}
