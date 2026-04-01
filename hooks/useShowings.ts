import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase/client';
import { logActivity } from '../lib/scoring/log-activity';
import type { Showing, InsertTables, UpdateTables } from '../lib/supabase/database.types';

interface DateRange {
  start: string;
  end: string;
}

export function useShowings(dateRange?: DateRange) {
  return useQuery({
    queryKey: ['showings', dateRange],
    queryFn: async (): Promise<Showing[]> => {
      let query = supabase
        .from('showings')
        .select('*, leads(first_name, last_name)')
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (dateRange) {
        query = query.gte('date', dateRange.start).lte('date', dateRange.end);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Showing[];
    },
  });
}

export function useLeadShowings(leadId: string) {
  return useQuery({
    queryKey: ['showings', 'lead', leadId],
    queryFn: async (): Promise<Showing[]> => {
      const { data, error } = await supabase
        .from('showings')
        .select('*')
        .eq('lead_id', leadId)
        .order('date', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!leadId,
  });
}

export function useCreateShowing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (showing: InsertTables<'showings'>) => {
      const { data, error } = await supabase
        .from('showings')
        .insert(showing)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['showings'] });
      queryClient.invalidateQueries({ queryKey: ['showings', 'lead'] });
      queryClient.invalidateQueries({ queryKey: ['overview-stats'] });

      // Fire-and-forget behavioral scoring
      if (data?.lead_id) {
        logActivity(supabase, {
          leadId: data.lead_id,
          action: 'showing_request',
        }).catch((err) => console.error('[Scoring] logActivity error:', err));
      }
    },
  });
}

export function useDeleteShowing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('showings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['showings'] });
      queryClient.invalidateQueries({ queryKey: ['showings', 'lead'] });
      queryClient.invalidateQueries({ queryKey: ['overview-stats'] });
    },
  });
}

export function useUpdateShowing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateTables<'showings'> }) => {
      const { data, error } = await supabase
        .from('showings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['showings'] });
      queryClient.invalidateQueries({ queryKey: ['showings', 'lead'] });
      queryClient.invalidateQueries({ queryKey: ['overview-stats'] });
    },
  });
}
