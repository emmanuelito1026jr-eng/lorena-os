import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase/client';
import type { Deal, DealStage, InsertTables, UpdateTables } from '../lib/supabase/database.types';

interface DealWithLead extends Deal {
  leads: { first_name: string; last_name: string; phone: string | null; email: string | null } | null;
}

interface DealFilters {
  stage?: DealStage;
  dealType?: 'buyer' | 'seller' | 'dual';
  search?: string;
}

export function useDeals(filters?: DealFilters) {
  return useQuery({
    queryKey: ['deals', filters],
    queryFn: async (): Promise<DealWithLead[]> => {
      let query = supabase
        .from('deals')
        .select('*, leads(first_name, last_name, phone, email)')
        .order('updated_at', { ascending: false });

      if (filters?.stage) {
        query = query.eq('stage', filters.stage);
      }
      if (filters?.dealType) {
        query = query.eq('deal_type', filters.dealType);
      }
      if (filters?.search) {
        query = query.ilike('property_address', `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as DealWithLead[];
    },
  });
}

export function useDealsByStage() {
  return useQuery({
    queryKey: ['deals-by-stage'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select('*, leads(first_name, last_name, phone, email)')
        .order('updated_at', { ascending: false });
      if (error) throw error;

      const stages: DealStage[] = ['pre_listing', 'active_listing', 'under_contract', 'pending', 'closed', 'fallen_through'];
      const grouped: Record<string, DealWithLead[]> = {};
      for (const stage of stages) {
        grouped[stage] = [];
      }
      for (const deal of (data ?? []) as unknown as DealWithLead[]) {
        if (!grouped[deal.stage]) grouped[deal.stage] = [];
        grouped[deal.stage].push(deal);
      }
      return grouped;
    },
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (deal: InsertTables<'deals'>) => {
      const { data, error } = await supabase.from('deals').insert(deal).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deals-by-stage'] });
      queryClient.invalidateQueries({ queryKey: ['deals-summary'] });
    },
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateTables<'deals'> }) => {
      const { data, error } = await supabase.from('deals').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deals-by-stage'] });
      queryClient.invalidateQueries({ queryKey: ['deals-summary'] });
    },
  });
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('deals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deals-by-stage'] });
      queryClient.invalidateQueries({ queryKey: ['deals-summary'] });
    },
  });
}
