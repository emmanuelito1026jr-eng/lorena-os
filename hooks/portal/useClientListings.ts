import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import { useClientLeadRecord } from './useClientProfile';
import { transformListingToDisplay, sanitizeForPublicDisplay } from '../../lib/mls/adapter';
import type { PropertyDisplayData, PropertyFilters } from '../../lib/mls/types';
import type { Json } from '../../lib/supabase/database.types';

export function useClientFavorites() {
  const { data: lead } = useClientLeadRecord();
  return useQuery({
    queryKey: ['client-favorites', lead?.id],
    queryFn: async (): Promise<PropertyDisplayData[]> => {
      if (!lead) return [];
      const { data, error } = await supabase
        .from('favorites')
        .select('property_id, created_at')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false });
      if (error || !data?.length) return [];

      const ids = data.map(f => f.property_id);
      const { data: listings } = await supabase
        .from('listings')
        .select('*')
        .in('id', ids);
      if (!listings) return [];

      return listings.map(row => {
        const sanitized = sanitizeForPublicDisplay(row as unknown as Record<string, unknown>);
        return transformListingToDisplay(sanitized as unknown as import('../../lib/supabase/database.types').ListingRow);
      });
    },
    enabled: !!lead,
  });
}

export function useToggleFavorite() {
  const { data: lead } = useClientLeadRecord();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listingId, isFavorited }: { listingId: string; isFavorited: boolean }) => {
      if (!lead) throw new Error('No lead record found');
      if (isFavorited) {
        await supabase
          .from('favorites')
          .delete()
          .eq('lead_id', lead.id)
          .eq('property_id', listingId);
      } else {
        await supabase
          .from('favorites')
          .insert({ lead_id: lead.id, property_id: listingId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-favorites'] });
    },
  });
}

export function useClientSavedSearches() {
  const { data: lead } = useClientLeadRecord();
  return useQuery({
    queryKey: ['client-saved-searches', lead?.id],
    queryFn: async () => {
      if (!lead) return [];
      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false });
      if (error) return [];
      return data ?? [];
    },
    enabled: !!lead,
  });
}

export function useSaveSearch() {
  const { data: lead } = useClientLeadRecord();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, criteria }: { name: string; criteria: PropertyFilters }) => {
      if (!lead) throw new Error('No lead record found');
      const { error } = await supabase
        .from('saved_searches')
        .insert({ lead_id: lead.id, name, criteria: criteria as unknown as Json, alert_enabled: true });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-saved-searches'] });
    },
  });
}

export function useToggleSearchAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from('saved_searches')
        .update({ alert_enabled: enabled })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-saved-searches'] });
    },
  });
}

export function useDeleteSavedSearch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-saved-searches'] });
    },
  });
}
