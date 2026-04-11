/**
 * Real-time Lead Behavior Tracking
 * When a lead views a property on the public site → instant toast notification
 * This is CINC's #1 differentiator — InnoClose now has it
 */
import { useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase/client';
import { showToast } from '../components/shared/Toast';

interface LeadActivity {
  id: string;
  lead_id: string;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface LeadInfo {
  first_name: string;
  last_name: string;
  score: number;
}

export function useRealtimeLeadActivity(enabled = true) {
  const handleActivity = useCallback(async (payload: { new: LeadActivity }) => {
    const activity = payload.new;
    if (!activity?.lead_id) return;

    const { data: lead } = await supabase
      .from('leads')
      .select('first_name, last_name, score')
      .eq('id', activity.lead_id)
      .single() as { data: LeadInfo | null };

    if (!lead) return;

    const name = `${lead.first_name} ${lead.last_name}`;
    const isHot = lead.score >= 80;

    switch (activity.action) {
      case 'property_view': {
        const addr = (activity.metadata?.address as string) || 'a property';
        showToast(
          isHot ? `🔥 HOT LEAD: ${name} just viewed ${addr}` : `${name} viewed ${addr}`,
          isHot ? 'success' : 'success'
        );
        break;
      }
      case 'property_favorite': {
        const addr = (activity.metadata?.address as string) || 'a property';
        showToast(`❤️ ${name} saved ${addr} to favorites!`, 'success');
        break;
      }
      case 'message_sent':
        showToast(`💬 New message from ${name} — reply now`, 'success');
        break;
      case 'form_submit':
        showToast(`📋 ${name} submitted a contact form!`, 'success');
        break;
      default:
        break;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel('realtime-lead-activity')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'lead_activity' },
        handleActivity
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [enabled, handleActivity]);
}
