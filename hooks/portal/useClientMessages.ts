import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../../lib/supabase/client';
import { useClientLeadRecord } from './useClientProfile';
import type { Message } from '../../lib/supabase/database.types';

export function useClientMessages() {
  const { data: lead } = useClientLeadRecord();
  const queryClient = useQueryClient();

  // Realtime subscription
  useEffect(() => {
    if (!lead) return;
    const channel = supabase
      .channel('client-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `lead_id=eq.${lead.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['client-messages'] });
          queryClient.invalidateQueries({ queryKey: ['client-unread'] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [lead, queryClient]);

  return useQuery({
    queryKey: ['client-messages', lead?.id],
    queryFn: async (): Promise<Message[]> => {
      if (!lead) return [];
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: true });
      if (error) return [];
      return data ?? [];
    },
    enabled: !!lead,
  });
}

export function useClientUnreadCount() {
  const { data: lead } = useClientLeadRecord();
  return useQuery({
    queryKey: ['client-unread', lead?.id],
    queryFn: async (): Promise<number> => {
      if (!lead) return 0;
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('lead_id', lead.id)
        .eq('direction', 'outbound') // outbound from agent = inbound for client
        .eq('read', false);
      if (error) return 0;
      return count ?? 0;
    },
    enabled: !!lead,
  });
}

export function useSendClientMessage() {
  const { data: lead } = useClientLeadRecord();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      if (!lead) throw new Error('No lead record found');
      const { error } = await supabase
        .from('messages')
        .insert({
          lead_id: lead.id,
          agent_id: lead.agent_id,
          channel: 'email',
          direction: 'inbound',
          content,
          read: false,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-messages'] });
    },
  });
}

export function useMarkMessagesRead() {
  const { data: lead } = useClientLeadRecord();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!lead) return;
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('lead_id', lead.id)
        .eq('direction', 'outbound')
        .eq('read', false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-unread'] });
    },
  });
}
