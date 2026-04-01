import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase/client';
import { logActivity } from '../lib/scoring/log-activity';
import type { Message, InsertTables, MessageChannel, MessageWithLead, ChatSession, ChatMessage } from '../lib/supabase/database.types';

interface Conversation {
  lead_id: string;
  lead_first_name: string;
  lead_last_name: string;
  last_message: string;
  last_channel: MessageChannel;
  last_message_at: string;
  unread_count: number;
}

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async (): Promise<Conversation[]> => {
      // Get all messages with lead info, grouped by lead
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*, leads!inner(first_name, last_name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!messages?.length) return [];

      // Group by lead_id, take latest message per lead and count all unread inbound
      const grouped = new Map<string, Conversation>();
      for (const msg of messages as unknown as MessageWithLead[]) {
        const lead = msg.leads;
        if (!grouped.has(msg.lead_id)) {
          grouped.set(msg.lead_id, {
            lead_id: msg.lead_id,
            lead_first_name: lead.first_name,
            lead_last_name: lead.last_name,
            last_message: msg.content,
            last_channel: msg.channel,
            last_message_at: msg.created_at,
            unread_count: (!msg.read && msg.direction === 'inbound') ? 1 : 0,
          });
        } else {
          if (!msg.read && msg.direction === 'inbound') {
            const conv = grouped.get(msg.lead_id)!;
            conv.unread_count += 1;
          }
        }
      }

      return Array.from(grouped.values());
    },
  });
}

export function useMessages(leadId: string, channel?: MessageChannel) {
  return useQuery({
    queryKey: ['messages', leadId, channel],
    queryFn: async (): Promise<Message[]> => {
      let query = supabase
        .from('messages')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });

      if (channel) {
        query = query.eq('channel', channel);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!leadId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: InsertTables<'messages'>) => {
      const { data, error } = await supabase
        .from('messages')
        .insert(message)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['messages', data.lead_id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });

      // Only score inbound (client) messages, not agent outbound messages
      if (data.direction === 'inbound') {
        logActivity(supabase, {
          leadId: data.lead_id,
          action: 'message_sent',
        }).catch((err) => console.error('[Scoring] logActivity error:', err));
      }
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['unread-count'],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('read', false)
        .eq('direction', 'inbound');
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useMarkConversationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (leadId: string) => {
      const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('lead_id', leadId)
        .eq('direction', 'inbound')
        .eq('read', false);
      if (error) throw error;
    },
    onSuccess: (_data, leadId) => {
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages', leadId] });
    },
  });
}

// ============================================================
// Chat Session Hooks (for dashboard Messages "Chat" tab)
// ============================================================

export interface ChatSessionWithPreview {
  id: string;
  visitor_id: string;
  status: ChatSession['status'];
  lead_id: string | null;
  lead_score: number;
  visitor_name: string | null;
  visitor_phone: string | null;
  visitor_email: string | null;
  page_url: string | null;
  created_at: string;
  updated_at: string;
  last_message: string;
  last_message_at: string;
  message_count: number;
}

export function useChatSessions() {
  return useQuery({
    queryKey: ['chat-sessions'],
    queryFn: async (): Promise<ChatSessionWithPreview[]> => {
      const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!sessions?.length) return [];

      // Fetch latest message for each session
      const sessionIds = sessions.map((s) => s.id);
      const { data: messages } = await supabase
        .from('chat_messages')
        .select('session_id, content, created_at')
        .in('session_id', sessionIds)
        .order('created_at', { ascending: false });

      // Group messages by session — take first (latest) per session
      const latestBySession = new Map<string, { content: string; created_at: string; count: number }>();
      for (const msg of messages || []) {
        const existing = latestBySession.get(msg.session_id);
        if (!existing) {
          latestBySession.set(msg.session_id, { content: msg.content, created_at: msg.created_at, count: 1 });
        } else {
          existing.count += 1;
        }
      }

      return sessions.map((s) => {
        const latest = latestBySession.get(s.id);
        return {
          ...s,
          last_message: latest?.content || '',
          last_message_at: latest?.created_at || s.created_at,
          message_count: latest?.count || 0,
        };
      });
    },
  });
}

export function useChatMessages(sessionId: string) {
  return useQuery({
    queryKey: ['chat-messages', sessionId],
    queryFn: async (): Promise<ChatMessage[]> => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!sessionId,
  });
}

export function useSendChatMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: InsertTables<'chat_messages'>) => {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert(message)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', data.session_id] });
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['chat-unread-count'] });
    },
  });
}

export function useChatUnreadCount() {
  return useQuery({
    queryKey: ['chat-unread-count'],
    queryFn: async (): Promise<number> => {
      // Count active sessions where the most recent message is from a visitor (unanswered)
      const { data: sessions, error } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('status', 'active')
        .limit(100);

      if (error) throw error;
      if (!sessions?.length) return 0;

      // For each active session, check if the last message was from visitor
      const sessionIds = sessions.map((s) => s.id);
      const { data: messages } = await supabase
        .from('chat_messages')
        .select('session_id, role, created_at')
        .in('session_id', sessionIds)
        .order('created_at', { ascending: false });

      if (!messages?.length) return 0;

      // Find latest message per session — if it's from 'user' (visitor), count as unread
      const lastBySession = new Map<string, string>();
      for (const msg of messages) {
        if (!lastBySession.has(msg.session_id)) {
          lastBySession.set(msg.session_id, msg.role);
        }
      }

      let unread = 0;
      for (const role of lastBySession.values()) {
        if (role === 'user') unread += 1;
      }
      return unread;
    },
  });
}
