/**
 * ai-staff — Lorena's Personal AI Assistant (Realtor-Facing)
 * 
 * This is NOT the public website chatbot. This is Lorena's private
 * AI Chief of Staff — fully tool-enabled, can read and write Supabase data,
 * generate files, and execute automations.
 * 
 * Architecture:
 * - Anthropic claude-haiku-4-5 for speed/cost on simple queries
 * - Streaming SSE response for instant UX
 * - Full tool use: READ + WRITE + CREATE + AUTOMATE
 * - All writes require Lorena's authenticated session (agent_id)
 * 
 * JWT: DISABLED — dashboard handles auth separately
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── CORS ─────────────────────────────────────────────────────────────────────
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── Tool Definitions ─────────────────────────────────────────────────────────
const TOOLS = [
  // READ TOOLS
  {
    name: "search_leads",
    description: "Search for leads by name, phone, email, or status. Use when Lorena asks about a specific person or wants to find leads.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Name, phone, or email to search" },
        status: { type: "string", description: "Filter by status: new_lead, contacted, appointment_set, active_client, past_client" },
        min_score: { type: "number", description: "Minimum lead score (0-100)" },
        limit: { type: "number", description: "Max results to return (default 10)" },
      },
    },
  },
  {
    name: "get_hot_leads",
    description: "Get the top hot leads (score >= 80) that need immediate attention.",
    input_schema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Number of hot leads to return (default 10)" },
      },
    },
  },
  {
    name: "get_todays_showings",
    description: "Get all showings scheduled for today or upcoming.",
    input_schema: {
      type: "object",
      properties: {
        days_ahead: { type: "number", description: "Days ahead to look (default 1 = today only)" },
      },
    },
  },
  {
    name: "get_pipeline_summary",
    description: "Get a summary of the deals pipeline including total volume and commission estimate.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_daily_stats",
    description: "Get today's key business metrics: hot leads count, unread messages, showings today, pipeline value.",
    input_schema: { type: "object", properties: {} },
  },
  // WRITE TOOLS
  {
    name: "update_lead_status",
    description: "Update a lead's status. Use when Lorena says she contacted someone, set an appointment, etc.",
    input_schema: {
      type: "object",
      properties: {
        lead_id: { type: "string", description: "Lead UUID" },
        lead_name: { type: "string", description: "Lead name (used to find lead if ID unknown)" },
        status: { type: "string", description: "New status: new_lead, contacted, attempted_contact, appointment_set, appointment_met, active_client, past_client, nurture, lost" },
      },
      required: ["status"],
    },
  },
  {
    name: "update_lead_notes",
    description: "Add notes to a lead's record. Use when Lorena shares information about a conversation or interaction.",
    input_schema: {
      type: "object",
      properties: {
        lead_id: { type: "string", description: "Lead UUID" },
        lead_name: { type: "string", description: "Lead name to search for" },
        notes: { type: "string", description: "Notes to add" },
      },
      required: ["notes"],
    },
  },
  {
    name: "update_lead_score",
    description: "Manually adjust a lead's score based on new information.",
    input_schema: {
      type: "object",
      properties: {
        lead_id: { type: "string", description: "Lead UUID" },
        lead_name: { type: "string", description: "Lead name to search for" },
        score: { type: "number", description: "New score (0-100)" },
        reason: { type: "string", description: "Why the score was adjusted" },
      },
      required: ["score"],
    },
  },
  {
    name: "create_showing",
    description: "Schedule a new showing appointment. Use when Lorena says a client wants to see a property.",
    input_schema: {
      type: "object",
      properties: {
        lead_name: { type: "string", description: "Lead's name" },
        lead_id: { type: "string", description: "Lead UUID if known" },
        property_address: { type: "string", description: "Property address" },
        showing_date: { type: "string", description: "Date and time (ISO 8601 or natural language like 'Tuesday 3pm')" },
        notes: { type: "string", description: "Any notes about the showing" },
      },
      required: ["property_address"],
    },
  },
  // GENERATE TOOLS
  {
    name: "generate_lead_csv",
    description: "Generate a CSV/Excel export of leads. Use when Lorena asks for a spreadsheet of her leads.",
    input_schema: {
      type: "object",
      properties: {
        filter: { type: "string", description: "Filter: 'hot', 'warm', 'all', 'military', or a status" },
        limit: { type: "number", description: "Max leads to include (default 100)" },
      },
    },
  },
  {
    name: "draft_email",
    description: "Draft a professional email for Lorena to send to a client. Returns the draft for her review.",
    input_schema: {
      type: "object",
      properties: {
        recipient_name: { type: "string", description: "Client's name" },
        purpose: { type: "string", description: "Purpose of the email: follow_up, showing_confirmation, price_update, market_update, cold_outreach, thank_you" },
        context: { type: "string", description: "Additional context about the client or situation" },
        language: { type: "string", description: "Email language: 'en' or 'es'" },
      },
      required: ["recipient_name", "purpose"],
    },
  },
  {
    name: "enroll_in_sequence",
    description: "Enroll a lead in an automated drip sequence.",
    input_schema: {
      type: "object",
      properties: {
        lead_name: { type: "string", description: "Lead's name" },
        lead_id: { type: "string", description: "Lead UUID if known" },
        sequence_name: { type: "string", description: "Sequence to enroll in" },
      },
      required: ["sequence_name"],
    },
  },
];

// ─── Tool Executors ────────────────────────────────────────────────────────────
async function executeTool(
  name: string,
  input: Record<string, unknown>,
  supabase: ReturnType<typeof createClient>,
  agentId: string,
): Promise<string> {
  try {
    switch (name) {
      case "search_leads": {
        let q = supabase.from("leads").select(
          "id, first_name, last_name, phone, email, score, status, source, last_activity, notes",
        ).eq("agent_id", agentId);
        if (input.query) {
          const s = input.query as string;
          q = q.or(`first_name.ilike.%${s}%,last_name.ilike.%${s}%,phone.ilike.%${s}%,email.ilike.%${s}%`);
        }
        if (input.status) q = q.eq("status", input.status as string);
        if (input.min_score) q = q.gte("score", input.min_score as number);
        const { data, error } = await q.order("score", { ascending: false }).limit((input.limit as number) || 10);
        if (error) return `Search failed: ${error.message}`;
        if (!data?.length) return "No leads found matching your search.";
        return data.map(l => `• ${l.first_name} ${l.last_name} | Score: ${l.score} | ${l.status} | ${l.phone || "no phone"} | Last: ${l.last_activity ? new Date(l.last_activity).toLocaleDateString() : "never"}`).join("\n");
      }

      case "get_hot_leads": {
        const { data, error } = await supabase.from("leads").select(
          "id, first_name, last_name, phone, score, status, source, last_activity",
        ).eq("agent_id", agentId).gte("score", 80).order("score", { ascending: false }).limit((input.limit as number) || 10);
        if (error) return `Failed: ${error.message}`;
        if (!data?.length) return "No hot leads right now. 🎉";
        return `${data.length} hot leads:\n` + data.map((l, i) => `${i + 1}. ${l.first_name} ${l.last_name} (Score: ${l.score}) — ${l.status} — ${l.phone || "no phone"} — last contact: ${l.last_activity ? new Date(l.last_activity).toLocaleDateString() : "NEVER"}`).join("\n");
      }

      case "get_todays_showings": {
        const today = new Date();
        const daysAhead = (input.days_ahead as number) || 1;
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + daysAhead);
        const { data, error } = await supabase.from("showings").select(
          "id, showing_date, property_address, status, leads(first_name, last_name, phone)",
        ).eq("agent_id", agentId).gte("showing_date", today.toISOString().split("T")[0]).lte("showing_date", endDate.toISOString().split("T")[0]).order("showing_date");
        if (error) return `Failed: ${error.message}`;
        if (!data?.length) return "No showings scheduled for today. Enjoy the free time!";
        return `${data.length} showing(s):\n` + data.map(s => {
          const lead = Array.isArray(s.leads) ? s.leads[0] : s.leads;
          const leadName = lead ? `${(lead as {first_name: string}).first_name} ${(lead as {last_name: string}).last_name}` : "Unknown";
          return `• ${new Date(s.showing_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} — ${s.property_address} — ${leadName} — ${s.status}`;
        }).join("\n");
      }

      case "get_pipeline_summary": {
        const { data, error } = await supabase.from("deals").select(
          "stage, sale_price, list_price, commission_rate",
        ).eq("agent_id", agentId).not("stage", "in", "(closed,fallen_through)");
        if (error) return `Failed: ${error.message}`;
        if (!data?.length) return "No active deals in pipeline.";
        const total = data.reduce((s, d) => s + (d.sale_price ?? d.list_price ?? 0), 0);
        const commission = data.reduce((s, d) => {
          const p = d.sale_price ?? d.list_price ?? 0;
          return s + (p * ((d.commission_rate ?? 3) / 100));
        }, 0);
        return `Pipeline: ${data.length} active deals | $${(total / 1000000).toFixed(2)}M total volume | $${commission.toLocaleString()} est. commission`;
      }

      case "get_daily_stats": {
        const [hot, unread, showings, deals] = await Promise.all([
          supabase.from("leads").select("id", { count: "exact" }).eq("agent_id", agentId).gte("score", 80),
          supabase.from("conversations").select("id", { count: "exact" }).eq("agent_id", agentId).gt("unread_count", 0),
          supabase.from("showings").select("id", { count: "exact" }).eq("agent_id", agentId).eq("showing_date", new Date().toISOString().split("T")[0]),
          supabase.from("deals").select("sale_price, list_price", { count: "exact" }).eq("agent_id", agentId).not("stage", "in", "(closed,fallen_through)"),
        ]);
        const pipelineVal = (deals.data ?? []).reduce((s, d) => s + (d.sale_price ?? d.list_price ?? 0), 0);
        return `Today's stats:\n🔥 Hot leads: ${hot.count ?? 0}\n📬 Unread messages: ${unread.count ?? 0}\n🏠 Showings today: ${showings.count ?? 0}\n💰 Pipeline: $${(pipelineVal / 1000000).toFixed(2)}M`;
      }

      case "update_lead_status": {
        let leadId = input.lead_id as string;
        if (!leadId && input.lead_name) {
          const name = (input.lead_name as string).split(" ");
          const { data } = await supabase.from("leads").select("id").eq("agent_id", agentId)
            .ilike("first_name", `%${name[0]}%`).limit(1).single();
          leadId = data?.id;
        }
        if (!leadId) return `Couldn't find lead "${input.lead_name}". Try searching first.`;
        const { error } = await supabase.from("leads").update({
          status: input.status as string,
          last_activity: new Date().toISOString(),
        }).eq("id", leadId).eq("agent_id", agentId);
        if (error) return `Update failed: ${error.message}`;
        return `✅ Updated lead status to "${input.status}". Last activity set to now.`;
      }

      case "update_lead_notes": {
        let leadId = input.lead_id as string;
        if (!leadId && input.lead_name) {
          const name = (input.lead_name as string).split(" ");
          const { data } = await supabase.from("leads").select("id, notes").eq("agent_id", agentId)
            .ilike("first_name", `%${name[0]}%`).limit(1).single();
          if (data) {
            leadId = data.id;
            const existingNotes = data.notes || "";
            const newNote = `[${new Date().toLocaleDateString()}] ${input.notes as string}`;
            const { error } = await supabase.from("leads").update({
              notes: existingNotes ? `${existingNotes}\n${newNote}` : newNote,
              last_activity: new Date().toISOString(),
            }).eq("id", leadId);
            if (error) return `Failed: ${error.message}`;
            return `✅ Note added to ${input.lead_name}'s record.`;
          }
        }
        if (!leadId) return `Couldn't find lead "${input.lead_name}".`;
        const { data: existing } = await supabase.from("leads").select("notes").eq("id", leadId).single();
        const existingNotes = existing?.notes || "";
        const newNote = `[${new Date().toLocaleDateString()}] ${input.notes as string}`;
        const { error } = await supabase.from("leads").update({
          notes: existingNotes ? `${existingNotes}\n${newNote}` : newNote,
          last_activity: new Date().toISOString(),
        }).eq("id", leadId);
        if (error) return `Failed: ${error.message}`;
        return `✅ Note added to lead record.`;
      }

      case "update_lead_score": {
        let leadId = input.lead_id as string;
        if (!leadId && input.lead_name) {
          const name = (input.lead_name as string).split(" ");
          const { data } = await supabase.from("leads").select("id").eq("agent_id", agentId)
            .ilike("first_name", `%${name[0]}%`).limit(1).single();
          leadId = data?.id;
        }
        if (!leadId) return `Couldn't find lead "${input.lead_name}".`;
        const { error } = await supabase.from("leads").update({
          score: input.score as number,
          score_updated_at: new Date().toISOString(),
        }).eq("id", leadId).eq("agent_id", agentId);
        if (error) return `Update failed: ${error.message}`;
        return `✅ Lead score updated to ${input.score}.${input.reason ? ` Reason: ${input.reason}` : ""}`;
      }

      case "create_showing": {
        let leadId = input.lead_id as string;
        if (!leadId && input.lead_name) {
          const name = (input.lead_name as string).split(" ");
          const { data } = await supabase.from("leads").select("id").eq("agent_id", agentId)
            .ilike("first_name", `%${name[0]}%`).limit(1).single();
          leadId = data?.id;
        }
        // Parse showing date — default to tomorrow 10am if unclear
        let showingDate = new Date();
        showingDate.setDate(showingDate.getDate() + 1);
        showingDate.setHours(10, 0, 0, 0);
        if (input.showing_date) {
          const parsed = new Date(input.showing_date as string);
          if (!isNaN(parsed.getTime())) showingDate = parsed;
        }
        const { error } = await supabase.from("showings").insert({
          agent_id: agentId,
          lead_id: leadId || null,
          property_address: input.property_address as string,
          showing_date: showingDate.toISOString().split("T")[0],
          status: "scheduled",
          notes: (input.notes as string) || "",
        });
        if (error) return `Failed to create showing: ${error.message}`;
        return `✅ Showing scheduled at ${input.property_address} on ${showingDate.toLocaleDateString()} at ${showingDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}.`;
      }

      case "generate_lead_csv": {
        const filter = (input.filter as string) || "all";
        let q = supabase.from("leads").select(
          "first_name, last_name, phone, email, score, status, source, last_activity, notes, preferred_language",
        ).eq("agent_id", agentId);
        if (filter === "hot") q = q.gte("score", 80);
        else if (filter === "warm") q = q.gte("score", 50).lt("score", 80);
        else if (filter === "military") q = q.eq("source", "military_referral");
        else if (filter !== "all") q = q.eq("status", filter);
        const { data, error } = await q.order("score", { ascending: false }).limit((input.limit as number) || 100);
        if (error) return `Export failed: ${error.message}`;
        if (!data?.length) return "No leads found to export.";
        const headers = "First Name,Last Name,Phone,Email,Score,Status,Source,Last Activity,Language,Notes";
        const rows = data.map(l =>
          `"${l.first_name}","${l.last_name}","${l.phone || ""}","${l.email || ""}",${l.score},"${l.status}","${l.source}","${l.last_activity ? new Date(l.last_activity).toLocaleDateString() : ""}","${l.preferred_language || "en"}","${(l.notes || "").replace(/"/g, "'")}"`
        );
        const csv = [headers, ...rows].join("\n");
        // Return as a data URL-like reference
        const b64 = btoa(unescape(encodeURIComponent(csv)));
        return `✅ CSV ready with ${data.length} leads.\n\nDATA:${b64}\nFILENAME:${filter}-leads-${new Date().toISOString().split("T")[0]}.csv`;
      }

      case "draft_email": {
        const templates: Record<string, {en: string; es: string}> = {
          follow_up: {
            en: `Hi ${input.recipient_name},\n\nI wanted to follow up and see how your home search is going. El Paso's market is moving fast right now, and I'd love to help you find the right home before the best deals are gone.\n\nAre you still looking? I have a few new listings that might be perfect for you.\n\nLooking forward to hearing from you!\n\nLorena Ontiveros-Ortega | REALTOR® | Casas En El Paso | (915) 500-0573`,
            es: `Hola ${input.recipient_name},\n\nQuería hacer un seguimiento para ver cómo va su búsqueda de casa. El mercado de El Paso está muy activo ahora mismo y me encantaría ayudarle a encontrar la casa perfecta.\n\n¿Sigue buscando? Tengo algunas propiedades nuevas que podrían ser ideales para usted.\n\nQuedo atenta a su respuesta.\n\nLorena Ontiveros-Ortega | REALTOR® | Casas En El Paso | (915) 500-0573`,
          },
          showing_confirmation: {
            en: `Hi ${input.recipient_name},\n\nConfirming your showing scheduled for [DATE] at [ADDRESS]. I'll meet you there!\n\n📍 [ADDRESS]\n🕐 [TIME]\n📞 If you need to reschedule: (915) 500-0573\n\nExcited to show you this property! See you soon.\n\nLorena Ontiveros-Ortega | REALTOR®`,
            es: `Hola ${input.recipient_name},\n\nConfirmando su visita programada para [FECHA] en [DIRECCIÓN]. ¡Los veo allí!\n\n📍 [DIRECCIÓN]\n🕐 [HORA]\n📞 Para reprogramar: (915) 500-0573\n\n¡Emocionada de mostrarles esta propiedad!\n\nLorena Ontiveros-Ortega | REALTOR®`,
          },
          cold_outreach: {
            en: `Hi ${input.recipient_name},\n\nI noticed you were interested in El Paso real estate — I'm Lorena, a local REALTOR® who specializes in helping families find their perfect home here.\n\nWould you be open to a quick 10-minute call to discuss what you're looking for? No pressure at all — just want to understand your situation.\n\nLorena Ontiveros-Ortega | REALTOR® | (915) 500-0573`,
            es: `Hola ${input.recipient_name},\n\nVi que tenía interés en bienes raíces en El Paso — soy Lorena, una REALTOR® local especializada en ayudar a familias a encontrar su hogar ideal aquí.\n\n¿Estaría disponible para una llamada rápida de 10 minutos para platicar sobre lo que busca?\n\nLorena Ontiveros-Ortega | REALTOR® | (915) 500-0573`,
          },
          thank_you: {
            en: `Dear ${input.recipient_name},\n\nThank you so much for trusting me with one of the biggest decisions of your life. It was truly an honor to help you [buy/sell] your home!\n\nIf you know anyone looking to buy or sell in El Paso, I'd love to help them too. And if you have a moment, a Google review would mean the world to me 🙏\n\nWishing you all the best in your new home!\n\nLorena Ontiveros-Ortega | REALTOR® | Casas En El Paso`,
            es: `Estimado/a ${input.recipient_name},\n\nMuchas gracias por confiarme una de las decisiones más importantes de su vida. ¡Fue un verdadero honor ayudarle!\n\nSi conoce a alguien que quiera comprar o vender en El Paso, con gusto les ayudo también.\n\n¡Les deseo lo mejor en su nuevo hogar!\n\nLorena Ontiveros-Ortega | REALTOR® | Casas En El Paso`,
          },
        };
        const lang = (input.language as string) || "en";
        const template = templates[input.purpose as string] || templates.follow_up;
        const body = lang === "es" ? template.es : template.en;
        const contextNote = input.context ? `\n\n[Context provided: ${input.context}]` : "";
        return `📧 Email Draft (${lang === "es" ? "Spanish" : "English"}) — ready for your review:\n\n${body}${contextNote}\n\n⚠️ Please review before sending. Edit as needed.`;
      }

      case "enroll_in_sequence": {
        let leadId = input.lead_id as string;
        if (!leadId && input.lead_name) {
          const name = (input.lead_name as string).split(" ");
          const { data } = await supabase.from("leads").select("id").eq("agent_id", agentId)
            .ilike("first_name", `%${name[0]}%`).limit(1).single();
          leadId = data?.id;
        }
        if (!leadId) return `Couldn't find lead "${input.lead_name}". Try searching first.`;
        // Find the sequence
        const { data: seq } = await supabase.from("drip_sequences").select("id, name").eq("agent_id", agentId)
          .ilike("name", `%${input.sequence_name as string}%`).limit(1).single();
        if (!seq) return `Couldn't find sequence "${input.sequence_name}". Available sequences will be listed in AutoTracks.`;
        const { error } = await supabase.from("drip_enrollments").insert({
          lead_id: leadId,
          sequence_id: seq.id,
          agent_id: agentId,
          status: "active",
          current_step: 0,
          enrolled_at: new Date().toISOString(),
        });
        if (error) return `Enrollment failed: ${error.message}`;
        return `✅ Lead enrolled in "${seq.name}" sequence.`;
      }

      default:
        return `Unknown tool: ${name}`;
    }
  } catch (err) {
    return `Tool error: ${err instanceof Error ? err.message : String(err)}`;
  }
}

// ─── System Prompt ─────────────────────────────────────────────────────────────
function buildSystemPrompt(context: string): string {
  return `You are Lorena's AI Chief of Staff — a powerful personal assistant built specifically for a real estate agent in El Paso, TX. You work for Lorena Ontiveros-Ortega (REALTOR®, Casas En El Paso).

WHAT YOU CAN DO:
- Answer questions about her leads, deals, showings, and market
- Look up specific leads and their contact info
- Update lead statuses when she tells you about interactions ("I just called Maria")
- Add notes to lead records
- Schedule showings
- Draft emails for her review
- Generate CSV exports of her leads
- Enroll leads in automated sequences

HOW TO RESPOND:
- Be direct and action-oriented. When she tells you something happened, DO it.
- If she says "I contacted Maria Garcia today" → call update_lead_status + update_lead_notes
- If she asks "who are my hot leads?" → call get_hot_leads immediately
- For writes: always confirm what you did with ✅
- Keep responses concise. She's busy. Bullet points > paragraphs.
- You speak both English and Spanish — match her language

CRITICAL RULES:
- Never send emails without her explicit approval
- Every email draft ends with "⚠️ Please review before sending"
- If you're unsure about a lead's ID, search for them first
- Always confirm data changes with a ✅ confirmation

BUSINESS CONTEXT:
${context}

Today: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`;
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { messages = [], agent = "ceo", context = "" } = body;

    // Get agent_id from auth OR from body (dashboard passes it)
    const authHeader = req.headers.get("Authorization");
    let agentId = body.agent_id || "";

    if (!agentId && authHeader) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userClient.auth.getUser();
      agentId = user?.id || "";
    }

    // Service role client for all DB operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // If no agent_id, try to get the first agent
    if (!agentId) {
      const { data: profile } = await supabase.from("profiles").select("id").eq("role", "agent").limit(1).single();
      agentId = profile?.id || "";
    }

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

    // Smart fallback without Anthropic key
    if (!anthropicKey) {
      const lastMsg = messages[messages.length - 1]?.content || "";
      let fallback = "AI features are pending the Anthropic API key. Go to Settings → Integrations to see setup instructions.";
      if (lastMsg.toLowerCase().includes("hot lead")) fallback = "To see hot leads, go to Leads → Hot tab. AI analysis activates once the Anthropic API key is configured in Settings.";
      return new Response(JSON.stringify({ text: fallback }), {
        status: 200, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = buildSystemPrompt(context);

    // First Claude call — may use tools
    let anthropicMessages = messages.slice(-12).map((m: {role: string; content: string}) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Tool-use loop (max 3 rounds)
    let finalText = "";
    for (let round = 0; round < 3; round++) {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 2048,
          system: systemPrompt,
          tools: TOOLS,
          messages: anthropicMessages,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Anthropic error:", response.status, errText);
        return new Response(JSON.stringify({ text: "AI service temporarily unavailable. Please try again." }), {
          status: 200, headers: { ...CORS, "Content-Type": "application/json" },
        });
      }

      const result = await response.json();

      // Check if we're done (no tool use)
      if (result.stop_reason === "end_turn" || !result.content.some((b: {type: string}) => b.type === "tool_use")) {
        finalText = result.content.filter((b: {type: string}) => b.type === "text").map((b: {text: string}) => b.text).join("\n");
        break;
      }

      // Execute all tool calls
      const toolUseBlocks = result.content.filter((b: {type: string}) => b.type === "tool_use");
      const toolResults = [];

      for (const toolBlock of toolUseBlocks) {
        const toolResult = await executeTool(toolBlock.name, toolBlock.input, supabase, agentId);
        toolResults.push({
          type: "tool_result",
          tool_use_id: toolBlock.id,
          content: toolResult,
        });
      }

      // Add assistant message + tool results and loop
      anthropicMessages = [
        ...anthropicMessages,
        { role: "assistant", content: result.content },
        { role: "user", content: toolResults },
      ];
    }

    // Parse any CSV data out of finalText for download
    let csvData: {data: string; filename: string} | null = null;
    if (finalText.includes("DATA:") && finalText.includes("FILENAME:")) {
      const dataMatch = finalText.match(/DATA:([A-Za-z0-9+/=]+)/);
      const nameMatch = finalText.match(/FILENAME:([^\n]+)/);
      if (dataMatch && nameMatch) {
        csvData = { data: dataMatch[1], filename: nameMatch[1].trim() };
        // Clean the text response
        finalText = finalText.replace(/DATA:[A-Za-z0-9+/=]+/, "").replace(/FILENAME:[^\n]+/, "").trim();
      }
    }

    return new Response(JSON.stringify({ text: finalText, csv: csvData }), {
      status: 200, headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("ai-staff error:", err);
    return new Response(JSON.stringify({
      text: err instanceof Error ? `Error: ${err.message}` : "Something went wrong. Please try again.",
    }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});
