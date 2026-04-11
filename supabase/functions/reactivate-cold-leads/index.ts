/**
 * Reactivate Cold Leads — Batch Re-engagement Engine
 * Finds all leads with no activity in 60+ days and enrolls them
 * in the Re-engagement AutoTrack sequence
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const REENGAGEMENT_SEQUENCE_ID = '6bccf229-429f-4f07-abc8-070697050ed1';
const COLD_THRESHOLD_DAYS = 60;

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  last_activity: string | null;
  score: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const body = await req.json().catch(() => ({}));
  const dryRun = body.dry_run === true;
  const batchSize = Math.min(body.batch_size ?? 50, 200);
  const agentId = body.agent_id;

  try {
    // Step 1: Find cold leads
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - COLD_THRESHOLD_DAYS);

    const { data: allLeads, error: leadsErr } = await supabase
      .from('leads')
      .select('id, first_name, last_name, email, phone, status, last_activity, score')
      .not('status', 'eq', 'active_client')
      .limit(1000);

    if (leadsErr) throw leadsErr;

    const coldLeads = (allLeads as Lead[]).filter(l =>
      !l.last_activity || new Date(l.last_activity).getTime() < cutoffDate.getTime()
    );

    // Step 2: Find already enrolled leads
    const coldIds = coldLeads.map(l => l.id);
    const { data: existingEnrollments } = await supabase
      .from('drip_enrollments')
      .select('lead_id')
      .eq('sequence_id', REENGAGEMENT_SEQUENCE_ID)
      .in('lead_id', coldIds.slice(0, 500));

    const alreadyEnrolled = new Set((existingEnrollments ?? []).map(e => e.lead_id));

    // Step 3: Filter to unenrolled leads
    const toEnroll = coldLeads
      .filter(l => !alreadyEnrolled.has(l.id))
      .slice(0, batchSize);

    if (dryRun) {
      return new Response(JSON.stringify({
        mode: 'dry_run',
        total_cold: coldLeads.length,
        already_enrolled: alreadyEnrolled.size,
        would_enroll: toEnroll.length,
        sample: toEnroll.slice(0, 5).map(l => ({
          name: `${l.first_name} ${l.last_name}`,
          last_activity: l.last_activity,
          score: l.score
        }))
      }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
    }

    // Step 4: Batch enroll
    const now = new Date().toISOString();
    const enrollments = toEnroll.map(lead => ({
      lead_id: lead.id,
      sequence_id: REENGAGEMENT_SEQUENCE_ID,
      agent_id: agentId,
      status: 'active',
      enrolled_at: now,
      current_step: 0,
    }));

    const { data: enrolled, error: enrollErr } = await supabase
      .from('drip_enrollments')
      .insert(enrollments)
      .select('id, lead_id');

    if (enrollErr) throw enrollErr;

    // Step 5: Log activity for each enrolled lead
    const activityLogs = toEnroll.map(lead => ({
      lead_id: lead.id,
      action: 'sequence_enrolled',
      points: 5,
      metadata: { sequence_name: 'Re-engagement', triggered_by: 'reactivation_campaign' }
    }));

    await supabase.from('lead_activity').insert(activityLogs);

    // Step 6: Update lead last_activity
    await supabase
      .from('leads')
      .update({ last_activity: now })
      .in('id', toEnroll.map(l => l.id));

    return new Response(JSON.stringify({
      success: true,
      total_cold: coldLeads.length,
      already_enrolled: alreadyEnrolled.size,
      newly_enrolled: enrolled?.length ?? 0,
      remaining: Math.max(0, coldLeads.length - alreadyEnrolled.size - (enrolled?.length ?? 0)),
      message: `Successfully enrolled ${enrolled?.length ?? 0} cold leads in Re-engagement sequence`
    }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
});
