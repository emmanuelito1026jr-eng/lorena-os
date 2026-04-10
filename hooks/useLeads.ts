import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase/client';
import type { Lead, InsertTables, UpdateTables, LeadStatus, LeadSource, LeadTemperature } from '../lib/supabase/database.types';
import { HOT_THRESHOLD } from '../lib/scoring/constants';

interface LeadFilters {
  temperature?: LeadTemperature;
  status?: LeadStatus;
  source?: LeadSource;
  search?: string;
  sortBy?: 'score' | 'last_activity' | 'created_at' | 'first_name';
  sortOrder?: 'asc' | 'desc';
}

export function useLeads(filters?: LeadFilters) {
  return useQuery({
    queryKey: ['leads', filters],
    queryFn: async (): Promise<Lead[]> => {
      // Fetch ALL leads in batches — Supabase has a 1000-row default cap
      // so we page through until we have every lead in the pipeline
      const PAGE_SIZE = 1000;
      const fetchBatch = async (from: number): Promise<Lead[]> => {
        let q = supabase.from('leads').select('*').range(from, from + PAGE_SIZE - 1);
        if (filters?.temperature) q = q.eq('temperature', filters.temperature);
        if (filters?.status) q = q.eq('status', filters.status);
        if (filters?.source) q = q.eq('source', filters.source);
        if (filters?.search) {
          q = q.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
        }
        const sortBy = filters?.sortBy || 'score';
        const sortOrder = filters?.sortOrder || 'desc';
        q = q.order(sortBy, { ascending: sortOrder === 'asc' });
        const { data, error } = await q;
        if (error) throw error;
        return data ?? [];
      };

      let allLeads: Lead[] = [];
      let page = 0;
      while (true) {
        const batch = await fetchBatch(page * PAGE_SIZE);
        allLeads = allLeads.concat(batch);
        if (batch.length < PAGE_SIZE) break;
        page++;
      }
      return allLeads;
    },
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: ['lead', id],
    queryFn: async (): Promise<Lead | null> => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useHotLeads(limit = 10) {
  return useQuery({
    queryKey: ['leads', 'hot', limit],
    queryFn: async (): Promise<Lead[]> => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .gte('score', HOT_THRESHOLD)
        .order('score', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (lead: InsertTables<'leads'>) => {
      const { data, error } = await supabase
        .from('leads')
        .insert(lead)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateTables<'leads'> }) => {
      const { data, error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', data.id] });
      queryClient.invalidateQueries({ queryKey: ['overview-stats'] });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['overview-stats'] });
    },
  });
}

export function useLeadActivity(leadId: string, filters?: { actionType?: string }) {
  return useQuery({
    queryKey: ['lead-activity', leadId, filters],
    queryFn: async () => {
      let query = supabase
        .from('lead_activity')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });
      if (filters?.actionType) {
        query = query.eq('action', filters.actionType);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!leadId,
  });
}
