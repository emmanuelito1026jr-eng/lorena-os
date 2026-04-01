import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import { useClientLeadRecord } from './useClientProfile';
import type { Deal } from '../../lib/supabase/database.types';

export const DEAL_STAGES = [
  { key: 'pre_listing', label: 'Pre-Approval' },
  { key: 'active_listing', label: 'Active Search' },
  { key: 'under_contract', label: 'Under Contract' },
  { key: 'pending', label: 'Pending' },
  { key: 'closed', label: 'Closed' },
] as const;

export function useClientTransaction() {
  const { data: lead } = useClientLeadRecord();
  return useQuery({
    queryKey: ['client-transaction', lead?.id],
    queryFn: async (): Promise<Deal | null> => {
      if (!lead) return null;
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .eq('lead_id', lead.id)
        .neq('stage', 'fallen_through')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) return null;
      return data;
    },
    enabled: !!lead,
  });
}
