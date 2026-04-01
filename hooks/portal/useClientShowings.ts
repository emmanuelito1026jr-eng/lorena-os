import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import { useClientLeadRecord } from './useClientProfile';
import type { Showing } from '../../lib/supabase/database.types';

export function useClientShowings() {
  const { data: lead } = useClientLeadRecord();
  return useQuery({
    queryKey: ['client-showings', lead?.id],
    queryFn: async (): Promise<Showing[]> => {
      if (!lead) return [];
      const { data, error } = await supabase
        .from('showings')
        .select('*')
        .eq('lead_id', lead.id)
        .order('date', { ascending: true });
      if (error) return [];
      return data ?? [];
    },
    enabled: !!lead,
  });
}

export function useRequestShowing() {
  const { data: lead } = useClientLeadRecord();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ address, date, startTime, endTime, notes }: {
      address: string;
      date: string;
      startTime: string;
      endTime: string;
      notes?: string;
    }) => {
      if (!lead) throw new Error('No lead record found');
      const { error } = await supabase
        .from('showings')
        .insert({
          lead_id: lead.id,
          agent_id: lead.agent_id,
          address,
          date,
          start_time: startTime,
          end_time: endTime,
          status: 'scheduled',
          notes: notes || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-showings'] });
    },
  });
}

export function useCancelShowing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (showingId: string) => {
      const { error } = await supabase
        .from('showings')
        .update({ status: 'cancelled' })
        .eq('id', showingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-showings'] });
    },
  });
}
