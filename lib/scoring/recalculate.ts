import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/database.types';
import { SCORE_MIN, SCORE_MAX, HOT_THRESHOLD, WARM_THRESHOLD, COOL_THRESHOLD } from './constants';

function getTemperature(score: number): string {
  if (score >= HOT_THRESHOLD) return 'hot';
  if (score >= WARM_THRESHOLD) return 'warm';
  if (score >= COOL_THRESHOLD) return 'cool';
  return 'cold';
}

export async function recalculateLeadScore(
  supabase: SupabaseClient<Database>,
  leadId: string
): Promise<{ score: number; previousScore: number; temperatureChanged: boolean }> {
  // Get current score
  const { data: lead } = await supabase
    .from('leads')
    .select('score, temperature')
    .eq('id', leadId)
    .single();

  const previousScore = lead?.score ?? 0;
  const previousTemperature = lead?.temperature ?? 'cold';

  // Fetch all activity records
  const { data: activities } = await supabase
    .from('lead_activity')
    .select('points')
    .eq('lead_id', leadId);

  // Sum all points
  const totalPoints = (activities ?? []).reduce((sum, a) => sum + a.points, 0);

  // Clamp to 0-100
  const score = Math.max(SCORE_MIN, Math.min(SCORE_MAX, totalPoints));
  const newTemperature = getTemperature(score);

  // Update lead score and temperature
  await supabase
    .from('leads')
    .update({
      score,
      temperature: newTemperature,
      score_updated_at: new Date().toISOString(),
    })
    .eq('id', leadId);

  return {
    score,
    previousScore,
    temperatureChanged: previousTemperature !== newTemperature,
  };
}
