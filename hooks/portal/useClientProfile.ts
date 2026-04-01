import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';
import { useAuth } from '../useAuth';
import type { Profile } from '../../lib/supabase/database.types';

export function useClientProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['client-profile', user?.id],
    queryFn: async (): Promise<Profile | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useUpdateClientProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { full_name?: string; email?: string; phone?: string | null; preferences?: Record<string, unknown> }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('profiles')
        .update(updates as import('../../lib/supabase/database.types').UpdateTables<'profiles'>)
        .eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-profile'] });
    },
  });
}

/** Get the lead record that links this client to their agent. */
export function useClientLeadRecord() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['client-lead-record', user?.id],
    queryFn: async () => {
      if (!user) return null;
      // Match by email from profiles → leads
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();
      if (!profile?.email) return null;

      const { data: lead } = await supabase
        .from('leads')
        .select('*')
        .eq('email', profile.email)
        .limit(1)
        .maybeSingle();
      return lead;
    },
    enabled: !!user,
  });
}
