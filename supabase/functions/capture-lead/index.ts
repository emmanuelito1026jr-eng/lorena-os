/**
 * Public Lead Capture — handles /valor form submissions
 * Uses service role to bypass RLS for unauthenticated public forms
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const AGENT_ID = '373896de-b814-4a83-9ce1-a2af5a1b5ed2'; // Lorena's UID

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'content-type, apikey, authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const body = await req.json();

    // Validate required fields
    if (!body.first_name || !body.phone) {
      return new Response(JSON.stringify({ error: 'Name and phone are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data, error } = await supabase.from('leads').insert({
      first_name: body.first_name,
      last_name: body.last_name || '(seller)',
      phone: body.phone,
      email: body.email || null,
      agent_id: AGENT_ID,
      source: body.source ?? 'facebook_ad',
      status: 'new_lead',
      score: 80,
      tags: body.tags ?? ['Seller Lead', 'Home Valuation', 'Facebook Ad'],
      notes: body.notes || null,
      custom_fields: body.custom_fields ?? {},
    }).select('id').single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, lead_id: data.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
