import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const ANTHROPIC_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString();

    const [hotLeads, newLeads, unread, deals, showings] = await Promise.all([
      supabase.from("leads").select("first_name,last_name,score,last_outreach_at,phone").gte("score", 80).order("score", { ascending: false }).limit(5),
      supabase.from("leads").select("first_name,last_name,source,score").gte("created_at", yesterday).order("created_at", { ascending: false }).limit(5),
      supabase.from("messages").select("*", { count: "exact", head: true }).eq("read", false).eq("direction", "inbound"),
      supabase.from("deals").select("address,stage,sale_price,list_price,actual_close_date").not("stage", "in", '("closed","fallen_through")').order("actual_close_date", { ascending: true }).limit(4),
      supabase.from("showings").select("address,start_time,leads(first_name,last_name)").eq("date", today).order("start_time", { ascending: true }),
    ]);

    const hotCount = hotLeads.data?.length ?? 0;
    const newCount = newLeads.data?.length ?? 0;
    const unreadCount = unread.count ?? 0;
    const dealCount = deals.data?.length ?? 0;
    const showingCount = showings.data?.length ?? 0;

    const context = `TODAY: ${today} | El Paso, TX | Mountain Time
HOT LEADS (${hotCount}): ${(hotLeads.data||[]).map((l: {first_name:string,last_name:string,score:number,last_outreach_at:string|null})=>`${l.first_name} ${l.last_name} (score:${l.score}, last contact:${l.last_outreach_at?new Date(l.last_outreach_at).toLocaleDateString():"NEVER"})`).join(", ")}
NEW LEADS (last 24h): ${newCount} from sources: ${[...new Set((newLeads.data||[]).map((l:{source:string})=>l.source))].join(", ")||"none"}
UNREAD MESSAGES: ${unreadCount}
ACTIVE DEALS (${dealCount}): ${(deals.data||[]).map((d:{address:string,stage:string,sale_price?:number,list_price?:number,actual_close_date?:string})=>`${d.address} (${d.stage}, $${((d.sale_price||d.list_price||0)/1000).toFixed(0)}K, closes:${d.actual_close_date||"TBD"})`).join("; ")}
SHOWINGS TODAY (${showingCount}): ${(showings.data||[]).map((s:{address:string,start_time:string})=>`${s.address} at ${s.start_time}`).join(", ")||"none"}`;

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "anthropic-version": "2023-06-01", "x-api-key": ANTHROPIC_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 400,
        messages: [{ role: "user", content: `You are Lorena's AI Chief of Staff. Write her morning briefing in 2-3 warm, specific sentences. Start with "¡Buenos días, Lorena!" Lead with the most urgent item. End with her single most important action right now. Be specific — use actual names and numbers.\n\n${context}` }]
      })
    });
    const claudeData = await claudeRes.json();
    const narrative = claudeData.content?.[0]?.text ?? "¡Buenos días, Lorena! Your AI team is ready to help you close more deals today.";

    const priorityItems: string[] = [];
    if (hotCount > 0) {
      const top = hotLeads.data![0] as {first_name:string,last_name:string,score:number,last_outreach_at:string|null};
      const daysSince = top.last_outreach_at ? Math.floor((Date.now() - new Date(top.last_outreach_at).getTime()) / 86400000) : null;
      priorityItems.push(`Call ${top.first_name} ${top.last_name} now — Score ${top.score}${daysSince ? `, not contacted in ${daysSince} days` : " — NEVER contacted"}`);
    }
    if (unreadCount > 0) priorityItems.push(`Reply to ${unreadCount} unread message${unreadCount>1?"s":""} — leads waiting for your response`);
    if (showingCount > 0) priorityItems.push(`Showing today: ${(showings.data![0] as {address:string,start_time:string}).address} at ${(showings.data![0] as {address:string,start_time:string}).start_time}`);
    if (newCount > 0) priorityItems.push(`${newCount} new lead${newCount>1?"s":""} overnight — enroll in AutoTrack sequence`);
    if (priorityItems.length === 0) priorityItems.push("Pipeline clear — great day to prospect and follow up cold leads");

    const briefing = {
      generated_at: new Date().toISOString(),
      narrative,
      sections: [
        { title: "Priority Actions", items: priorityItems, priority: "high" as const },
        {
          title: "Pipeline",
          items: dealCount > 0
            ? (deals.data||[]).map((d:{address:string,stage:string,sale_price?:number,list_price?:number,actual_close_date?:string}) => `${d.address} — ${d.stage.replace(/_/g," ")} — $${((d.sale_price||d.list_price||0)/1000).toFixed(0)}K${d.actual_close_date ? ` closes ${d.actual_close_date}` : ""}`)
            : ["No active deals — time to create some! Target your hot leads."],
          priority: "medium" as const
        },
        {
          title: "Today's Schedule",
          items: showingCount > 0
            ? (showings.data||[]).map((s:{address:string,start_time:string}) => `${s.address} at ${s.start_time}`)
            : ["No showings today — consider calling your top 3 hot leads"],
          priority: "low" as const
        },
      ],
      raw_data: {
        new_leads_count: newCount,
        hot_leads_count: hotCount,
        score_alerts_count: hotCount,
        todays_showings_count: showingCount,
        unread_messages_count: unreadCount,
        pipeline_changes_count: dealCount,
      }
    };

    return new Response(JSON.stringify({ briefing, cached: false, date: today }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err), briefing: null }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
