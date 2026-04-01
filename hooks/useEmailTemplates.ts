import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase/client';
import type { EmailTemplate, InsertTables, UpdateTables } from '../lib/supabase/database.types';

export function useEmailTemplates() {
  return useQuery({
    queryKey: ['email-templates'],
    queryFn: async (): Promise<EmailTemplate[]> => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateEmailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (template: InsertTables<'email_templates'>) => {
      const { data, error } = await supabase
        .from('email_templates')
        .insert(template)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
    },
  });
}

export function useUpdateEmailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateTables<'email_templates'> }) => {
      const { data, error } = await supabase.from('email_templates').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['email-templates'] }); },
  });
}

export function useDeleteEmailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
    },
  });
}
