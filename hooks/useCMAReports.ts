import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase/client';
import type { CmaReport } from '../lib/supabase/database.types';

interface CreateCMAParams {
  address: string;
  beds?: number;
  baths?: number;
  sqft?: number;
  year_built?: number;
  property_type?: string;
  lead_id?: string;
}

export interface CMAResult {
  success: boolean;
  report_id?: string;
  valuation: {
    estimated: number;
    low: number;
    high: number;
    price_per_sqft: number;
  };
  market: {
    avg_days_on_market: number;
  };
  comparable_sales: Array<{
    address: string;
    sale_price: number;
    sqft: number;
    beds: number;
    baths: number;
    days_on_market: number;
    sold_date: string;
  }>;
  narrative: string;
}

export function useCMAReports() {
  return useQuery({
    queryKey: ['cma-reports'],
    queryFn: async (): Promise<CmaReport[]> => {
      const { data, error } = await supabase
        .from('cma_reports')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateCMAReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateCMAParams): Promise<CMAResult> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

      // Call the AI-powered cma-analysis edge function
      const response = await fetch(`${supabaseUrl}/functions/v1/cma-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anonKey,
          'Authorization': `Bearer ${token || anonKey}`,
        },
        body: JSON.stringify({
          address: params.address,
          beds: params.beds ?? 3,
          baths: params.baths ?? 2,
          sqft: params.sqft ?? 1800,
          year_built: params.year_built ?? 2000,
          property_type: params.property_type ?? 'Single Family',
          agent_id: user.id,
          lead_id: params.lead_id,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? 'CMA generation failed');
      }

      const result: CMAResult = await response.json();
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cma-reports'] });
    },
  });
}
