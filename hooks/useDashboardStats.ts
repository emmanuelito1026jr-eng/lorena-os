import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase/client';
import type { Deal, ShowingWithLead } from '../lib/supabase/database.types';

// Pipeline breakdown by status
interface PipelineStats {
  status: string;
  count: number;
  label: string;
  color: string;
}

export function usePipelineStats() {
  return useQuery({
    queryKey: ['pipeline-stats'],
    queryFn: async (): Promise<PipelineStats[]> => {
      const { data, error } = await supabase
        .from('leads')
        .select('status')
        .range(0, 4999);
      if (error) throw error;

      const statusMap: Record<string, { label: string; color: string }> = {
        new_lead: { label: 'New', color: '#3B82F6' },
        attempted_contact: { label: 'Attempted', color: '#8B5CF6' },
        contacted: { label: 'Contacted', color: '#06B6D4' },
        appointment_set: { label: 'Appt Set', color: '#F59E0B' },
        appointment_met: { label: 'Appt Met', color: '#10B981' },
        active_client: { label: 'Active', color: '#0D9488' },
        pending_client: { label: 'Pending', color: '#EA580C' },
        past_client: { label: 'Past Client', color: '#64748B' },
        lost: { label: 'Lost', color: '#9CA3AF' },
      };

      const counts = new Map<string, number>();
      for (const row of data ?? []) {
        counts.set(row.status, (counts.get(row.status) ?? 0) + 1);
      }

      return Array.from(counts.entries())
        .map(([status, count]) => ({
          status,
          count,
          label: statusMap[status]?.label ?? status,
          color: statusMap[status]?.color ?? '#9CA3AF',
        }))
        .filter(s => s.count > 0)
        .sort((a, b) => b.count - a.count);
    },
  });
}

// Active deals summary
interface DealsSummary {
  totalActive: number;
  totalVolume: number;
  estimatedCommission: number;
  byStage: { stage: string; count: number; label: string }[];
  deals: Deal[];
}

export function useDealsSummary() {
  return useQuery({
    queryKey: ['deals-summary'],
    queryFn: async (): Promise<DealsSummary> => {
      const { data, error } = await supabase
        .from('deals')
        .select('*')
        .not('stage', 'in', '("closed","fallen_through")')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const deals = data ?? [];
      const stageMap: Record<string, string> = {
        pre_listing: 'Pre-Listing',
        active_listing: 'Active Listing',
        under_contract: 'Under Contract',
        pending: 'Pending',
      };

      const stageCounts = new Map<string, number>();
      let totalVolume = 0;
      let estimatedCommission = 0;

      for (const deal of deals) {
        stageCounts.set(deal.stage, (stageCounts.get(deal.stage) ?? 0) + 1);
        totalVolume += deal.sale_price ?? deal.list_price ?? 0;
        const rate = deal.commission_rate ?? 3;
        estimatedCommission += ((deal.sale_price ?? deal.list_price ?? 0) * rate) / 100;
      }

      return {
        totalActive: deals.length,
        totalVolume,
        estimatedCommission,
        byStage: Array.from(stageCounts.entries()).map(([stage, count]) => ({
          stage,
          count,
          label: stageMap[stage] ?? stage,
        })),
        deals,
      };
    },
  });
}

// Priority action queue — items needing Lorena's attention
interface PriorityAction {
  id: string;
  type: 'hot_lead' | 'unread_message' | 'showing_confirm' | 'follow_up' | 'new_lead';
  priority: 'urgent' | 'high' | 'normal';
  title: string;
  subtitle: string;
  leadId?: string;
  timestamp: string;
}

export function usePriorityActions() {
  return useQuery({
    queryKey: ['priority-actions'],
    queryFn: async (): Promise<PriorityAction[]> => {
      const today = new Date().toISOString().split('T')[0];
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

      const [hotLeads, unreadMessages, pendingShowings, newLeads] = await Promise.all([
        // Hot leads with no recent outreach
        supabase
          .from('leads')
          .select('id, first_name, last_name, score, last_outreach_at, last_activity')
          .gte('score', 80)
          .or(`last_outreach_at.is.null,last_outreach_at.lt.${threeDaysAgo}`)
          .order('score', { ascending: false })
          .limit(5),
        // Unread inbound messages
        supabase
          .from('messages')
          .select('id, lead_id, content, created_at, leads(first_name, last_name)')
          .eq('direction', 'inbound')
          .eq('read', false)
          .order('created_at', { ascending: false })
          .limit(5),
        // Showings needing confirmation
        supabase
          .from('showings')
          .select('id, lead_id, address, date, start_time, leads(first_name, last_name)')
          .eq('status', 'scheduled')
          .gte('date', today)
          .order('date', { ascending: true })
          .limit(3),
        // New leads from today
        supabase
          .from('leads')
          .select('id, first_name, last_name, source, created_at')
          .gte('created_at', `${today}T00:00:00`)
          .order('created_at', { ascending: false })
          .limit(3),
      ]);

      const actions: PriorityAction[] = [];

      // Hot leads needing outreach
      for (const lead of hotLeads.data ?? []) {
        actions.push({
          id: `hot-${lead.id}`,
          type: 'hot_lead',
          priority: 'urgent',
          title: `${lead.first_name} ${lead.last_name} (Score: ${lead.score})`,
          subtitle: lead.last_outreach_at
            ? 'Last contacted 3+ days ago'
            : 'Never contacted — reach out now',
          leadId: lead.id,
          timestamp: lead.last_activity ?? lead.last_outreach_at ?? new Date().toISOString(),
        });
      }

      // Unread messages
      for (const msg of unreadMessages.data ?? []) {
        const lead = (msg as unknown as { leads: { first_name: string; last_name: string } | null }).leads;
        actions.push({
          id: `msg-${msg.id}`,
          type: 'unread_message',
          priority: 'high',
          title: `Message from ${lead?.first_name ?? 'Unknown'} ${lead?.last_name ?? ''}`,
          subtitle: msg.content.length > 60 ? msg.content.slice(0, 60) + '...' : msg.content,
          leadId: msg.lead_id,
          timestamp: msg.created_at,
        });
      }

      // Pending showings
      for (const showing of pendingShowings.data ?? []) {
        const lead = (showing as unknown as { leads: { first_name: string; last_name: string } | null }).leads;
        actions.push({
          id: `show-${showing.id}`,
          type: 'showing_confirm',
          priority: 'normal',
          title: `Confirm showing at ${showing.address}`,
          subtitle: `${lead?.first_name ?? ''} ${lead?.last_name ?? ''} — ${showing.date} ${showing.start_time.slice(0, 5)}`,
          leadId: showing.lead_id,
          timestamp: showing.date,
        });
      }

      // New leads
      for (const lead of newLeads.data ?? []) {
        actions.push({
          id: `new-${lead.id}`,
          type: 'new_lead',
          priority: 'high',
          title: `New lead: ${lead.first_name} ${lead.last_name}`,
          subtitle: `Source: ${lead.source.replace(/_/g, ' ')}`,
          leadId: lead.id,
          timestamp: lead.created_at,
        });
      }

      // Sort: urgent first, then high, then normal
      const priorityOrder = { urgent: 0, high: 1, normal: 2 };
      return actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    },
  });
}

// Today's showings with lead info
export function useTodayShowings() {
  return useQuery({
    queryKey: ['today-showings'],
    queryFn: async (): Promise<ShowingWithLead[]> => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('showings')
        .select('*, leads(first_name, last_name)')
        .eq('date', today)
        .neq('status', 'cancelled')
        .order('start_time', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as ShowingWithLead[];
    },
  });
}

// Recent activity feed with lead names
interface ActivityItem {
  id: string;
  leadId: string;
  leadName: string;
  action: string;
  points: number;
  metadata: Record<string, unknown>;
  timestamp: string;
}

export function useRecentActivity(limit = 10) {
  return useQuery({
    queryKey: ['recent-activity', limit],
    queryFn: async (): Promise<ActivityItem[]> => {
      const { data, error } = await supabase
        .from('lead_activity')
        .select('*, leads(first_name, last_name)')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;

      return (data ?? []).map((item) => {
        const lead = (item as Record<string, unknown>).leads as { first_name: string; last_name: string } | null;
        return {
          id: item.id,
          leadId: item.lead_id,
          leadName: lead ? `${lead.first_name} ${lead.last_name}` : 'Unknown',
          action: item.action,
          points: item.points,
          metadata: (item.metadata ?? {}) as Record<string, unknown>,
          timestamp: item.created_at,
        };
      });
    },
  });
}

// Performance metrics
interface PerformanceMetrics {
  totalLeads: number;
  hotLeadsPct: number;
  avgScore: number;
  closedThisMonth: number;
  closedVolume: number;
  activeSequences: number;
  responseRate: number;
}

export function usePerformanceMetrics() {
  return useQuery({
    queryKey: ['performance-metrics'],
    queryFn: async (): Promise<PerformanceMetrics> => {
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

      const [leads, closedDeals, enrollments, outboundMsgs] = await Promise.all([
        supabase.from('leads').select('score').range(0, 4999),
        supabase
          .from('deals')
          .select('sale_price, list_price')
          .eq('stage', 'closed')
          .gte('actual_close_date', monthStart),
        supabase
          .from('drip_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active'),
        supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('direction', 'outbound'),
      ]);

      const allLeads = leads.data ?? [];
      const totalLeads = allLeads.length;
      const hotCount = allLeads.filter(l => l.score >= 80).length;
      const avgScore = totalLeads > 0
        ? Math.round(allLeads.reduce((sum, l) => sum + l.score, 0) / totalLeads)
        : 0;

      const closed = closedDeals.data ?? [];
      const closedVolume = closed.reduce((sum, d) => sum + (d.sale_price ?? d.list_price ?? 0), 0);

      return {
        totalLeads,
        hotLeadsPct: totalLeads > 0 ? Math.round((hotCount / totalLeads) * 100) : 0,
        avgScore,
        closedThisMonth: closed.length,
        closedVolume,
        activeSequences: enrollments.count ?? 0,
        responseRate: outboundMsgs.count ?? 0,
      };
    },
  });
}
