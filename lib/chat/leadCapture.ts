import { supabase } from '../supabase/client';
import { getTemperature } from './leadScoring';
import { triggerLeadCaptured } from './webhookTriggers';

interface CaptureParams {
  sessionId: string;
  name: string;
  phone?: string;
  email?: string;
  score: number;
  scoreReasons: string[];
  pageUrl: string;
  messagesSummary: string;
}

/**
 * Capture a lead from a chat session.
 * 1. Look up the real agent profile from Supabase
 * 2. Insert into leads table (source: 'website', tags: ['chat-capture'])
 * 3. Insert into chat_lead_captures
 * 4. Update chat_sessions with lead_id and status = 'converted'
 * 5. Fire webhook to n8n
 */
export async function captureLeadFromChat({
  sessionId,
  name,
  phone,
  email,
  score,
  scoreReasons,
  pageUrl,
  messagesSummary,
}: CaptureParams): Promise<{ leadId: string | null; error: string | null }> {
  try {
    // Parse first/last name
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || 'Chat';
    const lastName = nameParts.slice(1).join(' ') || 'Visitor';
    const temperature = getTemperature(score);

    // 1. Look up the agent profile (single-agent system)
    const { data: agent, error: agentError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'agent')
      .limit(1)
      .single();

    if (agentError || !agent) {
      throw new Error('No agent profile found — cannot create lead');
    }

    // 2. Insert lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: email || null,
        phone: phone || null,
        source: 'website' as const,
        tags: ['chat-capture'],
        score,
        temperature,
        preferred_language: 'en',
        notes: `Captured via website chat. Page: ${pageUrl}`,
        agent_id: agent.id,
      })
      .select('id')
      .single();

    if (leadError) {
      console.error('[Chat] Lead insert error:', leadError.message);
      return { leadId: null, error: leadError.message };
    }

    const leadId = lead.id;

    // 3. Insert capture record
    await supabase.from('chat_lead_captures').insert({
      session_id: sessionId,
      visitor_name: name,
      phone: phone || null,
      email: email || null,
      lead_score: score,
      score_reasons: scoreReasons,
      lead_id: leadId,
      converted: true,
    });

    // 4. Update chat session
    await supabase
      .from('chat_sessions')
      .update({
        lead_id: leadId,
        status: 'converted' as const,
        visitor_name: name,
        visitor_phone: phone || null,
        visitor_email: email || null,
      })
      .eq('id', sessionId);

    // 5. Fire webhook (fire-and-forget)
    triggerLeadCaptured({
      session_id: sessionId,
      visitor_name: name,
      phone,
      email,
      score,
      page_url: pageUrl,
      messages_summary: messagesSummary,
    });

    return { leadId, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Chat] Lead capture failed:', message);
    return { leadId: null, error: message };
  }
}
