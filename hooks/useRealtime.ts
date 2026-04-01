import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase/client';

export function useRealtimeLeads() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('leads-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['leads'] });
          queryClient.invalidateQueries({ queryKey: ['overview-stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

export function useRealtimeDeals() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('deals-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'deals' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['deals'] });
          queryClient.invalidateQueries({ queryKey: ['deals-by-stage'] });
          queryClient.invalidateQueries({ queryKey: ['overview-stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

export function useRealtimeShowings() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('showings-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'showings' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['showings'] });
          queryClient.invalidateQueries({ queryKey: ['overview-stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

export function useRealtimeMessages() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages'] });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          queryClient.invalidateQueries({ queryKey: ['unread-count'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

export function useRealtimeNotifications() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['notification-count'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

export function useRealtimeListings() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('listings-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'listings' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['listings'] });
          queryClient.invalidateQueries({ queryKey: ['featured-listings'] });
          queryClient.invalidateQueries({ queryKey: ['market-snapshot'] });
          queryClient.invalidateQueries({ queryKey: ['market-snapshots'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

export function useRealtimeInteractions() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('interactions-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'lead_listing_interactions' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['recent-matches'] });
          queryClient.invalidateQueries({ queryKey: ['listing-interactions'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

export function useRealtimeChat() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('chat-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
          queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
          queryClient.invalidateQueries({ queryKey: ['chat-unread-count'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
