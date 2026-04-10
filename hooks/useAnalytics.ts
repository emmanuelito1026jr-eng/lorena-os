import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase/client';

interface OverviewStats {
  newLeadsToday: number;
  hotLeads: number;
  unreadMessages: number;
  showingsToday: number;
}

interface LeadSourceStat {
  source: string;
  count: number;
  hotCount: number;
}

export function useOverviewStats() {
  return useQuery({
    queryKey: ['overview-stats'],
    queryFn: async (): Promise<OverviewStats> => {
      const today = new Date().toISOString().split('T')[0];

      const [newLeads, hotLeads, unread, showings] = await Promise.all([
        supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', `${today}T00:00:00`),
        supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .gte('score', 80),
        supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('read', false)
          .eq('direction', 'inbound'),
        supabase
          .from('showings')
          .select('*', { count: 'exact', head: true })
          .eq('date', today),
      ]);

      return {
        newLeadsToday: newLeads.count ?? 0,
        hotLeads: hotLeads.count ?? 0,
        unreadMessages: unread.count ?? 0,
        showingsToday: showings.count ?? 0,
      };
    },
  });
}

export function useLeadSourceStats(dateRange?: { start: string; end: string } | null) {
  return useQuery({
    queryKey: ['lead-source-stats', dateRange],
    queryFn: async (): Promise<LeadSourceStat[]> => {
      let query = supabase
        .from('leads')
        .select('source, score').range(0, 9999);
      if (dateRange) {
        query = query.gte('created_at', `${dateRange.start}T00:00:00`).lte('created_at', `${dateRange.end}T23:59:59`);
      }
      const { data, error } = await query;
      if (error) throw error;
      if (!data?.length) return [];

      const grouped = new Map<string, { count: number; hotCount: number }>();
      for (const lead of data) {
        const existing = grouped.get(lead.source) ?? { count: 0, hotCount: 0 };
        existing.count += 1;
        if (lead.score >= 80) existing.hotCount += 1;
        grouped.set(lead.source, existing);
      }

      return Array.from(grouped.entries()).map(([source, stats]) => ({
        source,
        ...stats,
      }));
    },
  });
}

export function useAutomationStats() {
  return useQuery({
    queryKey: ['automation-stats'],
    queryFn: async () => {
      const [sequences, activeEnrollments] = await Promise.all([
        supabase.from('drip_sequences').select('*', { count: 'exact', head: true }),
        supabase.from('drip_enrollments').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      ]);

      return {
        totalSequences: sequences.count ?? 0,
        activeEnrollments: activeEnrollments.count ?? 0,
      };
    },
  });
}
