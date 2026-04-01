import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase/client';
import { logActivity } from '../lib/scoring/log-activity';
import type { Json } from '../lib/supabase/database.types';

interface SavedSearch {
  id: string;
  lead_id: string;
  name: string;
  criteria: Json;
  alert_enabled: boolean;
  created_at: string;
}

export function useSavedSearches(leadId: string | undefined) {
  return useQuery<SavedSearch[]>({
    queryKey: ['saved-searches', leadId],
    queryFn: async () => {
      if (!leadId) return [];
      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as SavedSearch[];
    },
    enabled: !!leadId,
  });
}

export function useCreateSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      leadId,
      name,
      criteria,
      alertEnabled = true,
    }: {
      leadId: string;
      name: string;
      criteria: Record<string, unknown>;
      alertEnabled?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('saved_searches')
        .insert({
          lead_id: leadId,
          name,
          criteria: criteria as Json,
          alert_enabled: alertEnabled,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches', variables.leadId] });

      // Fire-and-forget behavioral scoring
      logActivity(supabase, {
        leadId: variables.leadId,
        action: 'search_save',
      }).catch((err) => console.error('[Scoring] logActivity error:', err));
    },
  });
}

export function useDeleteSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, leadId }: { id: string; leadId: string }) => {
      const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, leadId };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches', variables.leadId] });
    },
  });
}
