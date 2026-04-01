import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase/client';

interface NewestUncontactedLead {
  id: string;
  first_name: string;
  last_name: string;
  source: string;
  created_at: string;
  elapsed_seconds: number;
}

export function useSpeedToLead() {
  return useQuery({
    queryKey: ['speed-to-lead'],
    queryFn: async (): Promise<NewestUncontactedLead | null> => {
      const { data, error } = await supabase
        .from('leads')
        .select('id, first_name, last_name, source, created_at')
        .eq('status', 'new_lead')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const elapsed = Math.floor(
        (Date.now() - new Date(data.created_at).getTime()) / 1000
      );

      return {
        ...data,
        elapsed_seconds: elapsed,
      };
    },
    refetchInterval: 30_000, // Refresh every 30s to keep timer live
  });
}

export type { NewestUncontactedLead };
