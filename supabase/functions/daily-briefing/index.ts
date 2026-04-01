import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// =============================================================================
// CORS — validated origins (no wildcard)
// =============================================================================
const ALLOWED_ORIGINS = [
  Deno.env.get("ALLOWED_ORIGIN") || "https://casasenelpasotx.com",
  "http://localhost:3000",
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function errorResponse(
  message: string,
  status: number,
  cors: Record<string, string>,
): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ...cors, "Content-Type": "application/json" } },
  );
}

// =============================================================================
// Types
// =============================================================================
interface DailyBriefingRequest {
  agent_id: string;
}

interface BriefingSection {
  title: string;
  items: string[];
  priority: "high" | "medium" | "low";
}

interface BriefingData {
  generated_at: string;
  sections: BriefingSection[];
  raw_data: {
    new_leads_count: number;
    hot_leads_count: number;
    score_alerts_count: number;
    todays_showings_count: number;
    unread_messages_count: number;
    pipeline_changes_count: number;
  };
  narrative: string;
}

interface LeadRow {
  id: string;
  first_name: string;
  last_name: string;
  source: string;
  score: number;
  temperature: string;
  phone: string | null;
  email: string | null;
  preferred_language: string;
  created_at: string;
}

interface ShowingRow {
  id: string;
  address: string;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  leads: { first_name: string; last_name: string } | null;
}

interface MessageRow {
  id: string;
  content: string;
  channel: string;
  direction: string;
  created_at: string;
  leads: { first_name: string; last_name: string } | null;
}

interface PipelineHistoryRow {
  id: string;
  from_status: string;
  to_status: string;
  created_at: string;
  leads: { first_name: string; last_name: string } | null;
}

interface LeadActivityRow {
  id: string;
  lead_id: string;
  action: string;
  points: number;
  created_at: string;
  leads: { first_name: string; last_name: string; score: number; temperature: string } | null;
}

// =============================================================================
// Main handler
// =============================================================================
Deno.serve(async (req) => {
  const CORS_HEADERS = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405, CORS_HEADERS);
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return errorResponse("Missing authorization", 401, CORS_HEADERS);
    }

    const body: DailyBriefingRequest = await req.json();

    if (!body.agent_id || typeof body.agent_id !== "string") {
      return errorResponse("agent_id is required", 400, CORS_HEADERS);
    }

    // Verify the JWT belongs to an agent
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await anonClient.auth.getUser();

    if (authError || !user || user.id !== body.agent_id) {
      return errorResponse("Unauthorized: token does not match agent_id", 403, CORS_HEADERS);
    }

    // Use service role for data queries (bypasses RLS)
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify agent role
    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", body.agent_id)
      .single();

    if (!profile || profile.role !== "agent") {
      return errorResponse("Only agents can request daily briefings", 403, CORS_HEADERS);
    }

    // =========================================================================
    // Fetch overnight data (last 24 hours)
    // =========================================================================
    const twentyFourHoursAgo = new Date(
      Date.now() - 24 * 60 * 60 * 1000,
    ).toISOString();
    const todayStr = new Date().toISOString().split("T")[0];

    // Run all queries in parallel for performance
    const [
      newLeadsResult,
      hotLeadsResult,
      todaysShowingsResult,
      unreadMessagesResult,
      pipelineChangesResult,
      scoreChangesResult,
    ] = await Promise.all([
      // 1. New leads in last 24h
      adminClient
        .from("leads")
        .select("id, first_name, last_name, source, score, temperature, phone, email, preferred_language, created_at")
        .eq("agent_id", body.agent_id)
        .gte("created_at", twentyFourHoursAgo)
        .order("created_at", { ascending: false }) as Promise<{ data: LeadRow[] | null; error: unknown }>,

      // 2. Hot leads (score >= 80)
      adminClient
        .from("leads")
        .select("id, first_name, last_name, source, score, temperature, phone, email, preferred_language, created_at")
        .eq("agent_id", body.agent_id)
        .gte("score", 80)
        .order("score", { ascending: false }) as Promise<{ data: LeadRow[] | null; error: unknown }>,

      // 3. Today's showings
      adminClient
        .from("showings")
        .select("id, address, date, start_time, end_time, status, leads(first_name, last_name)")
        .eq("agent_id", body.agent_id)
        .eq("date", todayStr)
        .order("start_time", { ascending: true }) as Promise<{ data: ShowingRow[] | null; error: unknown }>,

      // 4. Unread messages
      adminClient
        .from("messages")
        .select("id, content, channel, direction, created_at, leads(first_name, last_name)")
        .eq("agent_id", body.agent_id)
        .eq("read", false)
        .eq("direction", "inbound")
        .order("created_at", { ascending: false })
        .limit(20) as Promise<{ data: MessageRow[] | null; error: unknown }>,

      // 5. Pipeline changes in last 24h
      adminClient
        .from("pipeline_history")
        .select("id, from_status, to_status, created_at, leads:lead_id(first_name, last_name)")
        .eq("agent_id", body.agent_id)
        .gte("created_at", twentyFourHoursAgo)
        .order("created_at", { ascending: false }) as Promise<{ data: PipelineHistoryRow[] | null; error: unknown }>,

      // 6. Score changes (significant activity in last 24h)
      adminClient
        .from("lead_activity")
        .select("id, lead_id, action, points, created_at, leads:lead_id(first_name, last_name, score, temperature)")
        .gte("created_at", twentyFourHoursAgo)
        .gte("points", 10)
        .order("points", { ascending: false })
        .limit(20) as Promise<{ data: LeadActivityRow[] | null; error: unknown }>,
    ]);

    const newLeads = newLeadsResult.data || [];
    const hotLeads = hotLeadsResult.data || [];
    const todaysShowings = todaysShowingsResult.data || [];
    const unreadMessages = unreadMessagesResult.data || [];
    const pipelineChanges = pipelineChangesResult.data || [];
    const scoreChanges = scoreChangesResult.data || [];

    // =========================================================================
    // Build the briefing prompt for Claude Sonnet
    // =========================================================================
    const briefingPrompt = `You are generating a daily briefing for Lorena Ontiveros-Ortega, a real estate agent in El Paso, TX. Today is ${todayStr}.

Write a warm, concise, and actionable daily briefing. Lorena checks this on her phone at 7 AM, so keep it scannable. Use bullet points. Be specific with names and actions.

If data is available, mention specific lead names and what action to take. If there's nothing notable in a section, skip it entirely — don't add filler.

Here is the overnight data:

## New Leads (Last 24 Hours): ${newLeads.length}
${newLeads.length > 0
  ? newLeads.map((l) =>
    `- ${l.first_name} ${l.last_name} (Source: ${l.source}, Score: ${l.score}, Lang: ${l.preferred_language}, Phone: ${l.phone || "N/A"})`
  ).join("\n")
  : "No new leads overnight."
}

## Hot Leads (Score >= 80): ${hotLeads.length}
${hotLeads.length > 0
  ? hotLeads.map((l) =>
    `- ${l.first_name} ${l.last_name} (Score: ${l.score}, Source: ${l.source})`
  ).join("\n")
  : "No hot leads right now."
}

## Score Alerts (Significant Activity): ${scoreChanges.length}
${scoreChanges.length > 0
  ? scoreChanges.map((a) =>
    `- ${a.leads?.first_name || "Unknown"} ${a.leads?.last_name || ""}: ${a.action} (+${a.points} pts, now ${a.leads?.temperature || "N/A"})`
  ).join("\n")
  : "No significant score changes."
}

## Today's Showings: ${todaysShowings.length}
${todaysShowings.length > 0
  ? todaysShowings.map((s) =>
    `- ${s.start_time}-${s.end_time} at ${s.address} with ${s.leads?.first_name || "TBD"} ${s.leads?.last_name || ""} (${s.status})`
  ).join("\n")
  : "No showings scheduled today."
}

## Unread Messages: ${unreadMessages.length}
${unreadMessages.length > 0
  ? unreadMessages.slice(0, 5).map((m) =>
    `- ${m.leads?.first_name || "Unknown"} ${m.leads?.last_name || ""} via ${m.channel}: "${m.content.slice(0, 80)}${m.content.length > 80 ? "..." : ""}"`
  ).join("\n")
  : "All caught up on messages!"
}

## Pipeline Changes: ${pipelineChanges.length}
${pipelineChanges.length > 0
  ? pipelineChanges.map((p) =>
    `- ${p.leads?.first_name || "Unknown"} ${p.leads?.last_name || ""}: ${p.from_status} -> ${p.to_status}`
  ).join("\n")
  : "No pipeline changes overnight."
}

FORMAT YOUR RESPONSE AS JSON with this structure:
{
  "greeting": "A warm one-line greeting for Lorena (e.g., 'Good morning, Lorena! Here's your Tuesday update.')",
  "priority_actions": ["Action 1 — be specific with lead names", "Action 2"],
  "summary": "2-3 sentence overview of the day ahead",
  "sections": {
    "new_leads": "Brief paragraph or null if none",
    "score_alerts": "Brief paragraph or null if none",
    "todays_schedule": "Brief paragraph or null if no showings",
    "pipeline_update": "Brief paragraph or null if no changes",
    "messages_summary": "Brief paragraph or null if all read"
  }
}`;

    // =========================================================================
    // Call Anthropic Claude Sonnet
    // =========================================================================
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");

    let briefingContent: BriefingData;

    if (!anthropicApiKey) {
      // Graceful degradation: build a basic briefing from raw data without AI
      briefingContent = buildFallbackBriefing(
        newLeads,
        hotLeads,
        todaysShowings,
        unreadMessages,
        pipelineChanges,
        scoreChanges,
        todayStr,
      );
    } else {
      try {
        const anthropicResponse = await fetch(
          "https://api.anthropic.com/v1/messages",
          {
            method: "POST",
            headers: {
              "x-api-key": anthropicApiKey,
              "anthropic-version": "2023-06-01",
              "content-type": "application/json",
            },
            body: JSON.stringify({
              model: "claude-sonnet-4-20250514",
              max_tokens: 1024,
              messages: [
                {
                  role: "user",
                  content: briefingPrompt,
                },
              ],
            }),
          },
        );

        if (!anthropicResponse.ok) {
          const errText = await anthropicResponse.text();
          console.error("Anthropic API error:", anthropicResponse.status, errText);
          // Fall back to data-only briefing
          briefingContent = buildFallbackBriefing(
            newLeads,
            hotLeads,
            todaysShowings,
            unreadMessages,
            pipelineChanges,
            scoreChanges,
            todayStr,
          );
        } else {
          const anthropicData = await anthropicResponse.json();
          const responseText = anthropicData.content?.[0]?.text || "";

          // Extract JSON from Claude's response (it may be wrapped in markdown code blocks)
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);

            // Map Claude's structured response into our BriefingData format
            const sections: BriefingSection[] = [];

            if (parsed.priority_actions && parsed.priority_actions.length > 0) {
              sections.push({
                title: "Priority Actions",
                items: parsed.priority_actions,
                priority: "high",
              });
            }

            if (parsed.sections?.new_leads) {
              sections.push({
                title: "New Leads",
                items: [parsed.sections.new_leads],
                priority: newLeads.length > 0 ? "high" : "low",
              });
            }

            if (parsed.sections?.score_alerts) {
              sections.push({
                title: "Score Alerts",
                items: [parsed.sections.score_alerts],
                priority: "high",
              });
            }

            if (parsed.sections?.todays_schedule) {
              sections.push({
                title: "Today's Schedule",
                items: [parsed.sections.todays_schedule],
                priority: todaysShowings.length > 0 ? "high" : "low",
              });
            }

            if (parsed.sections?.pipeline_update) {
              sections.push({
                title: "Pipeline Update",
                items: [parsed.sections.pipeline_update],
                priority: "medium",
              });
            }

            if (parsed.sections?.messages_summary) {
              sections.push({
                title: "Messages",
                items: [parsed.sections.messages_summary],
                priority: unreadMessages.length > 3 ? "high" : "medium",
              });
            }

            briefingContent = {
              generated_at: new Date().toISOString(),
              sections,
              raw_data: {
                new_leads_count: newLeads.length,
                hot_leads_count: hotLeads.length,
                score_alerts_count: scoreChanges.length,
                todays_showings_count: todaysShowings.length,
                unread_messages_count: unreadMessages.length,
                pipeline_changes_count: pipelineChanges.length,
              },
              narrative: `${parsed.greeting || ""}\n\n${parsed.summary || ""}`,
            };
          } else {
            // Claude didn't return valid JSON; use fallback
            briefingContent = buildFallbackBriefing(
              newLeads,
              hotLeads,
              todaysShowings,
              unreadMessages,
              pipelineChanges,
              scoreChanges,
              todayStr,
            );
            briefingContent.narrative = responseText;
          }
        }
      } catch (apiErr) {
        console.error("Anthropic API call failed:", apiErr);
        briefingContent = buildFallbackBriefing(
          newLeads,
          hotLeads,
          todaysShowings,
          unreadMessages,
          pipelineChanges,
          scoreChanges,
          todayStr,
        );
      }
    }

    // =========================================================================
    // Save briefing to daily_briefings table for caching
    // =========================================================================
    const { error: insertError } = await adminClient
      .from("daily_briefings")
      .upsert(
        {
          agent_id: body.agent_id,
          date: todayStr,
          content: briefingContent as unknown as Record<string, unknown>,
        },
        { onConflict: "agent_id,date" },
      );

    if (insertError) {
      console.error("Failed to save briefing:", insertError);
      // Non-fatal: still return the briefing even if caching fails
    }

    return new Response(
      JSON.stringify({
        briefing: briefingContent,
        cached: !insertError,
        date: todayStr,
      }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("daily-briefing error:", err);
    return errorResponse(
      err instanceof Error ? err.message : "Internal server error",
      500,
      getCorsHeaders(req),
    );
  }
});

// =============================================================================
// Fallback briefing builder (no AI — just structured data)
// =============================================================================
function buildFallbackBriefing(
  newLeads: LeadRow[],
  hotLeads: LeadRow[],
  todaysShowings: ShowingRow[],
  unreadMessages: MessageRow[],
  pipelineChanges: PipelineHistoryRow[],
  scoreChanges: LeadActivityRow[],
  todayStr: string,
): BriefingData {
  const sections: BriefingSection[] = [];

  // Priority actions
  const priorityActions: string[] = [];
  if (hotLeads.length > 0) {
    priorityActions.push(
      `Follow up with ${hotLeads.length} hot lead${hotLeads.length > 1 ? "s" : ""}: ${hotLeads.slice(0, 3).map((l) => `${l.first_name} ${l.last_name} (${l.score})`).join(", ")}`,
    );
  }
  if (unreadMessages.length > 0) {
    priorityActions.push(`Reply to ${unreadMessages.length} unread message${unreadMessages.length > 1 ? "s" : ""}`);
  }
  if (todaysShowings.length > 0) {
    priorityActions.push(`${todaysShowings.length} showing${todaysShowings.length > 1 ? "s" : ""} today`);
  }
  if (newLeads.length > 0) {
    priorityActions.push(
      `Reach out to ${newLeads.length} new lead${newLeads.length > 1 ? "s" : ""}`,
    );
  }

  if (priorityActions.length > 0) {
    sections.push({
      title: "Priority Actions",
      items: priorityActions,
      priority: "high",
    });
  }

  if (newLeads.length > 0) {
    sections.push({
      title: "New Leads",
      items: newLeads.map(
        (l) =>
          `${l.first_name} ${l.last_name} from ${l.source} (Score: ${l.score})`,
      ),
      priority: "high",
    });
  }

  if (scoreChanges.length > 0) {
    sections.push({
      title: "Score Alerts",
      items: scoreChanges.map(
        (a) =>
          `${a.leads?.first_name || "Unknown"} ${a.leads?.last_name || ""}: ${a.action} (+${a.points} pts)`,
      ),
      priority: "high",
    });
  }

  if (todaysShowings.length > 0) {
    sections.push({
      title: "Today's Schedule",
      items: todaysShowings.map(
        (s) =>
          `${s.start_time}-${s.end_time} at ${s.address} with ${s.leads?.first_name || "TBD"} ${s.leads?.last_name || ""}`,
      ),
      priority: "high",
    });
  }

  if (pipelineChanges.length > 0) {
    sections.push({
      title: "Pipeline Update",
      items: pipelineChanges.map(
        (p) =>
          `${p.leads?.first_name || "Unknown"} ${p.leads?.last_name || ""}: ${p.from_status} -> ${p.to_status}`,
      ),
      priority: "medium",
    });
  }

  if (unreadMessages.length > 0) {
    sections.push({
      title: "Unread Messages",
      items: unreadMessages.slice(0, 5).map(
        (m) =>
          `${m.leads?.first_name || "Unknown"} ${m.leads?.last_name || ""} via ${m.channel}`,
      ),
      priority: unreadMessages.length > 3 ? "high" : "medium",
    });
  }

  const narrative = `Good morning, Lorena! Here's your ${todayStr} briefing. You have ${newLeads.length} new lead${newLeads.length !== 1 ? "s" : ""}, ${todaysShowings.length} showing${todaysShowings.length !== 1 ? "s" : ""}, and ${unreadMessages.length} unread message${unreadMessages.length !== 1 ? "s" : ""}.`;

  return {
    generated_at: new Date().toISOString(),
    sections,
    raw_data: {
      new_leads_count: newLeads.length,
      hot_leads_count: hotLeads.length,
      score_alerts_count: scoreChanges.length,
      todays_showings_count: todaysShowings.length,
      unread_messages_count: unreadMessages.length,
      pipeline_changes_count: pipelineChanges.length,
    },
    narrative,
  };
}
