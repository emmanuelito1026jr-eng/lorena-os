import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabase/client';
import type { UpdateTables } from '../lib/supabase/database.types';

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateTables<'profiles'> }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  });
}
