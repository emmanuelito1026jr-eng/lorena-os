import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/database.types';
import { ALERT_THRESHOLD, REENGAGE_THRESHOLD } from './constants';

export async function checkScoreTriggers(
  supabase: SupabaseClient<Database>,
  leadId: string,
  newScore: number,
  previousScore: number
): Promise<void> {
  // Get lead name for notification
  const { data: lead } = await supabase
    .from('leads')
    .select('first_name, last_name, agent_id')
    .eq('id', leadId)
    .single();

  if (!lead) return;

  const leadName = `${lead.first_name} ${lead.last_name}`;

  // Crossed ALERT_THRESHOLD (70) upward → notify Lorena
  if (newScore >= ALERT_THRESHOLD && previousScore < ALERT_THRESHOLD) {
    await supabase.from('notifications').insert({
      agent_id: lead.agent_id,
      type: 'hot_lead_alert',
      title: 'Hot Lead Alert',
      message: `${leadName} just crossed score ${ALERT_THRESHOLD} (now ${newScore}). This lead is heating up!`,
      lead_id: leadId,
      metadata: { previousScore, newScore },
    });
  }

  // Dropped below REENGAGE_THRESHOLD (30) → flag for re-engagement
  if (newScore < REENGAGE_THRESHOLD && previousScore >= REENGAGE_THRESHOLD) {
    await supabase.from('notifications').insert({
      agent_id: lead.agent_id,
      type: 're_engagement',
      title: 'Lead Cooling Down',
      message: `${leadName} dropped below score ${REENGAGE_THRESHOLD} (now ${newScore}). Consider re-engagement.`,
      lead_id: leadId,
      metadata: { previousScore, newScore },
    });
  }
}
