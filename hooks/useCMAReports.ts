import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase/client';
import type { CmaReport } from '../lib/supabase/database.types';
import type { Json } from '../lib/supabase/database.types';

interface CreateCMAParams {
  address: string;
  lead_id?: string;
  report_data?: Record<string, Json | undefined>;
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
    mutationFn: async (params: CreateCMAParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('cma_reports')
        .insert({
          agent_id: user.id,
          address: params.address,
          lead_id: params.lead_id,
          status: params.report_data ? 'complete' as const : 'generating' as const,
          report_data: params.report_data || { address: params.address, generated_at: new Date().toISOString() },
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cma-reports'] });
    },
  });
}
