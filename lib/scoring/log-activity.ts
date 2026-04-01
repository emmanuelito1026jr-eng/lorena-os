import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '../supabase/database.types';
import type { ActionType } from './constants';
import { calculatePoints } from './calculate';
import { recalculateLeadScore } from './recalculate';
import { checkScoreTriggers } from './triggers';

interface LogActivityParams {
  leadId: string;
  action: ActionType;
  metadata?: Record<string, unknown>;
  source?: string;
}

export async function logActivity(
  supabase: SupabaseClient<Database>,
  params: LogActivityParams
): Promise<{ activityId: string; newScore: number }> {
  const { leadId, action, metadata, source } = params;

  // Calculate points for this action
  const points = calculatePoints(action, metadata);

  // Insert activity record
  const { data: activity, error } = await supabase
    .from('lead_activity')
    .insert({
      lead_id: leadId,
      action,
      points,
      metadata: (metadata ?? null) as Json,
      source: source ?? null,
    })
    .select('id')
    .single();

  if (error) throw error;

  // Recalculate lead score
  const { score, previousScore } = await recalculateLeadScore(supabase, leadId);

  // Check triggers
  await checkScoreTriggers(supabase, leadId, score, previousScore);

  // Update last_activity timestamp
  await supabase
    .from('leads')
    .update({ last_activity: new Date().toISOString() })
    .eq('id', leadId);

  return {
    activityId: activity.id,
    newScore: score,
  };
}
