import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase/client';
import type { DripSequence, DripEnrollment, ChecklistTemplate, CalendarCampaign, InsertTables, UpdateTables, Json } from '../lib/supabase/database.types';

interface ChecklistInstanceWithTemplate {
  id: string;
  template_id: string;
  lead_id: string;
  items: Json;
  status: string;
  created_at: string;
  updated_at: string;
  checklist_templates: { name: string; description: string } | null;
}

export function useSequences() {
  return useQuery({
    queryKey: ['sequences'],
    queryFn: async (): Promise<DripSequence[]> => {
      const { data, error } = await supabase
        .from('drip_sequences')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSequence(id: string) {
  return useQuery({
    queryKey: ['sequence', id],
    queryFn: async (): Promise<DripSequence | null> => {
      const { data, error } = await supabase
        .from('drip_sequences')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useEnrollments(leadId: string) {
  return useQuery({
    queryKey: ['enrollments', leadId],
    queryFn: async (): Promise<DripEnrollment[]> => {
      const { data, error } = await supabase
        .from('drip_enrollments')
        .select('*, drip_sequences(name)')
        .eq('lead_id', leadId)
        .order('enrolled_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as DripEnrollment[];
    },
    enabled: !!leadId,
  });
}

export function useCalendarCampaigns() {
  return useQuery({
    queryKey: ['calendar-campaigns'],
    queryFn: async (): Promise<CalendarCampaign[]> => {
      const { data, error } = await supabase
        .from('calendar_campaigns')
        .select('*')
        .order('month', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useChecklists(leadId?: string) {
  return useQuery<ChecklistInstanceWithTemplate[] | ChecklistTemplate[]>({
    queryKey: ['checklists', leadId],
    queryFn: async () => {
      if (leadId) {
        const { data, error } = await supabase
          .from('checklist_instances')
          .select('*, checklist_templates(name, description)')
          .eq('lead_id', leadId);
        if (error) throw error;
        return (data ?? []) as unknown as ChecklistInstanceWithTemplate[];
      }
      const { data, error } = await supabase
        .from('checklist_templates')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

// --- Mutations ---

export function useCreateSequence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (seq: InsertTables<'drip_sequences'>) => {
      const { data, error } = await supabase.from('drip_sequences').insert(seq).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sequences'] }); },
  });
}

export function useUpdateSequence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateTables<'drip_sequences'> }) => {
      const { data, error } = await supabase.from('drip_sequences').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sequences'] }); },
  });
}

export function useDeleteSequence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('drip_sequences').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['sequences'] }); },
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (campaign: InsertTables<'calendar_campaigns'>) => {
      const { data, error } = await supabase.from('calendar_campaigns').insert(campaign).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['calendar-campaigns'] }); },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateTables<'calendar_campaigns'> }) => {
      const { data, error } = await supabase.from('calendar_campaigns').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['calendar-campaigns'] }); },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('calendar_campaigns').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['calendar-campaigns'] }); },
  });
}

export function useCreateChecklist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (checklist: InsertTables<'checklist_templates'>) => {
      const { data, error } = await supabase.from('checklist_templates').insert(checklist).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['checklists'] }); },
  });
}

export function useUpdateChecklist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateTables<'checklist_templates'> }) => {
      const { data, error } = await supabase.from('checklist_templates').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['checklists'] }); },
  });
}

export function useDeleteChecklist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('checklist_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['checklists'] }); },
  });
}

// Enrollment counts per sequence — for execution dashboard
interface SequenceEnrollmentStats {
  sequence_id: string;
  active: number;
  completed: number;
  paused: number;
  total: number;
}

export function useSequenceEnrollmentCounts() {
  return useQuery({
    queryKey: ['sequence-enrollment-counts'],
    queryFn: async (): Promise<Map<string, SequenceEnrollmentStats>> => {
      const { data, error } = await supabase
        .from('drip_enrollments')
        .select('sequence_id, status');
      if (error) throw error;

      const map = new Map<string, SequenceEnrollmentStats>();
      for (const row of data ?? []) {
        if (!map.has(row.sequence_id)) {
          map.set(row.sequence_id, { sequence_id: row.sequence_id, active: 0, completed: 0, paused: 0, total: 0 });
        }
        const stats = map.get(row.sequence_id)!;
        stats.total += 1;
        if (row.status === 'active') stats.active += 1;
        else if (row.status === 'completed') stats.completed += 1;
        else if (row.status === 'paused') stats.paused += 1;
      }
      return map;
    },
  });
}

export function useEnrollLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (enrollment: InsertTables<'drip_enrollments'>) => {
      const { data, error } = await supabase.from('drip_enrollments').insert(enrollment).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: { lead_id: string }) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', data.lead_id] });
      queryClient.invalidateQueries({ queryKey: ['automation-stats'] });
    },
  });
}

export function useUnenrollLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, leadId }: { id: string; leadId: string }) => {
      const { error } = await supabase.from('drip_enrollments')
        .update({ status: 'cancelled', completed_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      return { leadId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['enrollments', data.leadId] });
      queryClient.invalidateQueries({ queryKey: ['automation-stats'] });
    },
  });
}

export function useAssignChecklist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ templateId, leadId, items }: { templateId: string; leadId: string; items: Json }) => {
      const { data, error } = await supabase.from('checklist_instances')
        .insert({ template_id: templateId, lead_id: leadId, items })
        .select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['checklists', vars.leadId] });
    },
  });
}
