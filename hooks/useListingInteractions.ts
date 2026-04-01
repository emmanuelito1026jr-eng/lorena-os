import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase/client';
import { logActivity } from '../lib/scoring/log-activity';
import type { LeadListingInteraction, InsertTables } from '../lib/supabase/database.types';

type InteractionType = 'viewed' | 'favorited' | 'shared' | 'alerted' | 'email_clicked' | 'showing_requested' | 'contacted';

/**
 * Get all interactions for a specific lead.
 */
export function useListingInteractions(leadId: string | undefined) {
  return useQuery<LeadListingInteraction[]>({
    queryKey: ['listing-interactions', leadId],
    queryFn: async () => {
      if (!leadId) return [];
      const { data, error } = await supabase
        .from('lead_listing_interactions')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as LeadListingInteraction[];
    },
    enabled: !!leadId,
  });
}

/**
 * Log a lead-listing interaction event.
 */
export function useLogInteraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      leadId,
      listingId,
      type,
      metadata,
    }: {
      leadId: string;
      listingId: string;
      type: InteractionType;
      metadata?: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase
        .from('lead_listing_interactions')
        .insert({
          lead_id: leadId,
          listing_id: listingId,
          interaction_type: type,
          metadata: metadata || {},
        } as InsertTables<'lead_listing_interactions'>)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['listing-interactions', variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ['recent-matches'] });

      // Fire-and-forget behavioral scoring
      const actionMap: Record<string, 'property_view' | 'property_favorite' | 'showing_request'> = {
        viewed: 'property_view',
        favorited: 'property_favorite',
        showing_requested: 'showing_request',
      };
      const scoringAction = actionMap[variables.type];
      if (scoringAction) {
        logActivity(supabase, {
          leadId: variables.leadId,
          action: scoringAction,
          metadata: { listingId: variables.listingId },
        }).catch((err) => console.error('[Scoring] logActivity error:', err));
      }
    },
  });
}

/**
 * Recent matches: last N interactions across all leads (dashboard widget).
 */
export function useRecentMatches(limit = 5) {
  return useQuery({
    queryKey: ['recent-matches', limit],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('lead_listing_interactions')
          .select(`
            id, interaction_type, created_at, metadata,
            leads!inner(first_name, last_name),
            listings!inner(address, list_price, primary_photo_url)
          `)
          .in('interaction_type', ['alerted', 'email_clicked', 'favorited'])
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;
        return data || [];
      } catch {
        return [];
      }
    },
    staleTime: 1000 * 60 * 2,
  });
}
