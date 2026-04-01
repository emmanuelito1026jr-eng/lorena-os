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
interface ChatCompletionMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatCompletionRequest {
  messages: ChatCompletionMessage[];
  visitor_id: string;
  session_id?: string;
  lead_id?: string;
}

interface FunctionDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

// =============================================================================
// OpenAI function calling tool definitions
// =============================================================================
const FUNCTION_DEFINITIONS: FunctionDefinition[] = [
  {
    name: "schedule_showing",
    description:
      "Schedule a property showing for the visitor. Call this when a visitor expresses interest in seeing a specific property.",
    parameters: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "The property address the visitor wants to see",
        },
        preferred_date: {
          type: "string",
          description: "Preferred date (ISO 8601 format or natural language)",
        },
        preferred_time: {
          type: "string",
          description: "Preferred time of day",
        },
        visitor_name: {
          type: "string",
          description: "The visitor's name",
        },
        visitor_phone: {
          type: "string",
          description: "The visitor's phone number",
        },
      },
      required: ["address"],
    },
  },
  {
    name: "capture_lead_info",
    description:
      "Capture visitor contact information when they share their name, email, or phone number.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Visitor's full name" },
        email: { type: "string", description: "Visitor's email address" },
        phone: { type: "string", description: "Visitor's phone number" },
        interest: {
          type: "string",
          description: "What the visitor is interested in (buying, selling, renting, etc.)",
        },
      },
      required: [],
    },
  },
  {
    name: "get_property_details",
    description:
      "Look up property details by address or MLS number. Use when a visitor asks about a specific property.",
    parameters: {
      type: "object",
      properties: {
        address: { type: "string", description: "Property address to look up" },
        mls_id: { type: "string", description: "MLS listing number" },
      },
      required: [],
    },
  },
  {
    name: "get_neighborhood_info",
    description:
      "Get information about an El Paso neighborhood. Use when a visitor asks about a specific area or neighborhood.",
    parameters: {
      type: "object",
      properties: {
        neighborhood: {
          type: "string",
          description: "Neighborhood name (e.g., Westside, Northeast, Horizon, Upper Valley)",
        },
      },
      required: ["neighborhood"],
    },
  },
  {
    name: "transfer_to_agent",
    description:
      "Transfer the conversation to Lorena (the real estate agent). Use when the visitor explicitly asks to speak with a real person or when the question is too complex.",
    parameters: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          description: "Reason for the transfer",
        },
      },
      required: ["reason"],
    },
  },
];

// =============================================================================
// System prompt — Lorena's bilingual assistant
// =============================================================================
const SYSTEM_PROMPT = `You are Lorena's AI assistant for Casas En El Paso TX, a real estate service in El Paso, Texas.

PERSONALITY:
- Warm, professional, and knowledgeable about El Paso real estate
- Bilingual: respond in the same language the visitor uses (English or Spanish)
- If unsure of language preference, default to English but mention you speak Spanish too
- Keep responses concise (2-3 sentences max unless asked for detail)

ABOUT LORENA:
- Lorena Ontiveros-Ortega is a licensed real estate agent in El Paso, TX
- She specializes in residential real estate: buyers, sellers, military/VA, first-time homebuyers
- She knows every El Paso neighborhood intimately
- She offers free CMAs (Comparative Market Analyses) and home value estimates

EL PASO MARKET KNOWLEDGE:
- Median home price: ~$230K
- Range: $120K (Central) to $600K+ (Upper Valley/Country Club)
- Major areas: Westside (Mesa Hills, Coronado Hills, Kern Place), Northeast (Pebble Hills, Horizon), East (Montwood, Eastlake, Socorro), Central (Sunset Heights, Manhattan Heights), Upper Valley (Canutillo, Country Club)
- Fort Bliss military base drives significant buyer activity (VA loans common)
- El Paso is ~82% Hispanic — bilingual service is essential, not optional

RULES:
- Never make up property prices or specific listings
- If asked about a specific property, use the get_property_details function
- If a visitor shares contact info, use capture_lead_info function
- If a visitor wants to see a property, use schedule_showing function
- If asked about a neighborhood, use get_neighborhood_info function
- If the conversation needs a human, use transfer_to_agent function
- Never mention that you are AI unless directly asked
- Do not discuss competing agents or brokerages negatively
- Always encourage the visitor to reach out to Lorena for personalized help`;

// =============================================================================
// Function call handlers
// =============================================================================
async function handleFunctionCall(
  functionName: string,
  args: Record<string, unknown>,
  supabaseClient: ReturnType<typeof createClient>,
  sessionId: string | undefined,
): Promise<string> {
  switch (functionName) {
    case "schedule_showing": {
      // Log the showing request — Lorena gets notified via realtime/n8n
      if (sessionId) {
        await supabaseClient.from("chat_messages").insert({
          session_id: sessionId,
          role: "bot" as const,
          content: `[FUNCTION] schedule_showing: ${JSON.stringify(args)}`,
          metadata: { function_call: functionName, args },
        });
      }

      // Update session with contact info if provided
      if (sessionId && (args.visitor_name || args.visitor_phone)) {
        const updateData: Record<string, unknown> = {};
        if (args.visitor_name) updateData.visitor_name = args.visitor_name;
        if (args.visitor_phone) updateData.visitor_phone = args.visitor_phone;
        await supabaseClient
          .from("chat_sessions")
          .update(updateData)
          .eq("id", sessionId);
      }

      return `Showing request logged for ${args.address || "the property"}. Lorena will confirm the appointment shortly. She typically responds within 15 minutes during business hours (8 AM - 9 PM CST).`;
    }

    case "capture_lead_info": {
      // Update the chat session and lead capture record
      if (sessionId) {
        const updateData: Record<string, unknown> = {};
        if (args.name) updateData.visitor_name = args.name;
        if (args.phone) updateData.visitor_phone = args.phone;
        if (args.email) updateData.visitor_email = args.email;

        await supabaseClient
          .from("chat_sessions")
          .update(updateData)
          .eq("id", sessionId);

        await supabaseClient.from("chat_lead_captures").upsert(
          {
            session_id: sessionId,
            visitor_name: (args.name as string) || null,
            phone: (args.phone as string) || null,
            email: (args.email as string) || null,
            score_reasons: ["contact_info_shared"],
          },
          { onConflict: "session_id" },
        );
      }

      return "Contact information saved. Lorena will reach out to you personally!";
    }

    case "get_property_details": {
      // Query the listings table
      let query = supabaseClient.from("listings").select(
        "address, city, list_price, beds, baths, sqft, year_built, property_type, status, description, primary_photo_url",
      );

      if (args.address) {
        query = query.ilike("address", `%${args.address}%`);
      }
      if (args.mls_id) {
        query = query.eq("mls_id", args.mls_id);
      }

      const { data, error } = await query.limit(3);

      if (error || !data || data.length === 0) {
        return "I couldn't find that specific property in our listings. Would you like me to have Lorena look into it for you? She has access to the full MLS.";
      }

      const listing = data[0];
      return `Found: ${listing.address}, ${listing.city} - $${listing.list_price?.toLocaleString()} | ${listing.beds} bed / ${listing.baths} bath | ${listing.sqft?.toLocaleString()} sqft | Built ${listing.year_built || "N/A"} | Status: ${listing.status}`;
    }

    case "get_neighborhood_info": {
      const neighborhood = (args.neighborhood as string || "").toLowerCase();

      // Query market snapshots for real data
      const { data: snapshot } = await supabaseClient
        .from("market_snapshots")
        .select("median_price, active_count, avg_dom, avg_price_per_sqft")
        .ilike("area", `%${neighborhood}%`)
        .order("snapshot_date", { ascending: false })
        .limit(1);

      if (snapshot && snapshot.length > 0) {
        const s = snapshot[0];
        return `${args.neighborhood}: Median price $${s.median_price?.toLocaleString() || "N/A"}, ${s.active_count || 0} active listings, avg ${s.avg_dom || "N/A"} days on market, $${s.avg_price_per_sqft?.toFixed(0) || "N/A"}/sqft. Want me to set up a property search in this area?`;
      }

      return `I have general knowledge of ${args.neighborhood} but no recent market data loaded yet. Would you like Lorena to prepare a detailed market report for that area?`;
    }

    case "transfer_to_agent": {
      if (sessionId) {
        await supabaseClient
          .from("chat_sessions")
          .update({ status: "closed" as const, metadata: { transfer_reason: args.reason } })
          .eq("id", sessionId);

        // Create a notification for Lorena
        // We use the first agent profile available
        const { data: agent } = await supabaseClient
          .from("profiles")
          .select("id")
          .eq("role", "agent")
          .limit(1)
          .single();

        if (agent) {
          await supabaseClient.from("notifications").insert({
            agent_id: agent.id,
            type: "chat_transfer",
            title: "Chat Transfer Requested",
            message: `A visitor requested to speak with you. Reason: ${args.reason}`,
            metadata: { session_id: sessionId },
          });
        }
      }

      return "I'm connecting you with Lorena now. She'll reach out to you shortly. If you'd like a faster response, you can call or text her directly at (915) 996-9203.";
    }

    default:
      return "I'm not sure how to handle that request. Let me connect you with Lorena.";
  }
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
    // Parse and validate request body
    const body: ChatCompletionRequest = await req.json();

    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return errorResponse("messages array is required and must not be empty", 400, CORS_HEADERS);
    }

    if (!body.visitor_id || typeof body.visitor_id !== "string") {
      return errorResponse("visitor_id is required", 400, CORS_HEADERS);
    }

    // Validate each message has required fields
    for (const msg of body.messages) {
      if (!msg.role || !msg.content) {
        return errorResponse(
          "Each message must have a role and content",
          400,
          CORS_HEADERS,
        );
      }
      if (!["user", "assistant", "system"].includes(msg.role)) {
        return errorResponse(
          `Invalid message role: ${msg.role}. Must be user, assistant, or system`,
          400,
          CORS_HEADERS,
        );
      }
    }

    // Initialize Supabase client (service role for writing to tables)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Ensure/create a chat session
    let sessionId = body.session_id;

    if (!sessionId) {
      const { data: session, error: sessionError } = await supabaseClient
        .from("chat_sessions")
        .insert({
          visitor_id: body.visitor_id,
          status: "active" as const,
          lead_id: body.lead_id || null,
        })
        .select("id")
        .single();

      if (sessionError || !session) {
        console.error("Failed to create chat session:", sessionError);
        return errorResponse("Failed to create chat session", 500, CORS_HEADERS);
      }

      sessionId = session.id;
    }

    // Log the user's message to chat_messages
    const latestUserMsg = body.messages[body.messages.length - 1];
    if (latestUserMsg.role === "user") {
      await supabaseClient.from("chat_messages").insert({
        session_id: sessionId,
        role: "visitor" as const,
        content: latestUserMsg.content,
        metadata: { visitor_id: body.visitor_id },
      });
    }

    // Build the OpenAI request
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      // Graceful degradation: return a fallback response when API key is missing
      const fallbackReply =
        "Thanks for reaching out! I'm having a brief technical issue. Please contact Lorena directly at (915) 996-9203 or leave your name and number and she'll get back to you right away.";

      await supabaseClient.from("chat_messages").insert({
        session_id: sessionId,
        role: "bot" as const,
        content: fallbackReply,
        metadata: { fallback: true, reason: "missing_api_key" },
      });

      return new Response(
        JSON.stringify({
          session_id: sessionId,
          reply: fallbackReply,
          function_call: null,
        }),
        {
          status: 200,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        },
      );
    }

    // Build OpenAI messages array with system prompt
    const openaiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...body.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // Build OpenAI tools array
    const tools = FUNCTION_DEFINITIONS.map((fn) => ({
      type: "function" as const,
      function: {
        name: fn.name,
        description: fn.description,
        parameters: fn.parameters,
      },
    }));

    // ==========================================================================
    // Stream from OpenAI GPT-4o
    // ==========================================================================
    const openaiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: openaiMessages,
          tools,
          tool_choice: "auto",
          stream: true,
          max_tokens: 512,
          temperature: 0.7,
        }),
      },
    );

    if (!openaiResponse.ok) {
      const errBody = await openaiResponse.text();
      console.error("OpenAI API error:", openaiResponse.status, errBody);

      // Graceful degradation on OpenAI failure
      const fallbackReply =
        "I apologize, I'm experiencing a momentary issue. Lorena is available at (915) 996-9203, or share your number and she'll call you back!";

      await supabaseClient.from("chat_messages").insert({
        session_id: sessionId,
        role: "bot" as const,
        content: fallbackReply,
        metadata: { fallback: true, reason: "openai_error", status: openaiResponse.status },
      });

      return new Response(
        JSON.stringify({
          session_id: sessionId,
          reply: fallbackReply,
          function_call: null,
        }),
        {
          status: 200,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        },
      );
    }

    // Stream the response using ReadableStream
    const reader = openaiResponse.body?.getReader();
    if (!reader) {
      return errorResponse("Failed to read OpenAI stream", 500, CORS_HEADERS);
    }

    let fullContent = "";
    let functionCallName = "";
    let functionCallArgs = "";
    let hasFunctionCall = false;

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE lines
            const lines = buffer.split("\n");
            // Keep the last potentially incomplete line in the buffer
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed === "data: [DONE]") {
                if (trimmed === "data: [DONE]") {
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                }
                continue;
              }

              if (!trimmed.startsWith("data: ")) continue;

              const jsonStr = trimmed.slice(6);
              try {
                const chunk = JSON.parse(jsonStr);
                const delta = chunk.choices?.[0]?.delta;

                if (!delta) continue;

                // Handle function calls
                if (delta.tool_calls) {
                  hasFunctionCall = true;
                  for (const toolCall of delta.tool_calls) {
                    if (toolCall.function?.name) {
                      functionCallName = toolCall.function.name;
                    }
                    if (toolCall.function?.arguments) {
                      functionCallArgs += toolCall.function.arguments;
                    }
                  }
                  // Don't stream function call deltas to client
                  continue;
                }

                // Handle regular content
                if (delta.content) {
                  fullContent += delta.content;
                  // Forward the SSE chunk to client
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ content: delta.content, session_id: sessionId })}\n\n`),
                  );
                }
              } catch {
                // Skip malformed JSON chunks
                continue;
              }
            }
          }

          // If we got a function call, execute it and send the result
          if (hasFunctionCall && functionCallName) {
            let parsedArgs: Record<string, unknown> = {};
            try {
              parsedArgs = JSON.parse(functionCallArgs);
            } catch {
              parsedArgs = {};
            }

            const functionResult = await handleFunctionCall(
              functionCallName,
              parsedArgs,
              supabaseClient,
              sessionId,
            );

            // Send function result as a special event
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  function_call: {
                    name: functionCallName,
                    result: functionResult,
                  },
                  session_id: sessionId,
                })}\n\n`,
              ),
            );

            // Log function result as bot message
            await supabaseClient.from("chat_messages").insert({
              session_id: sessionId,
              role: "bot" as const,
              content: functionResult,
              metadata: {
                function_call: functionCallName,
                function_args: parsedArgs,
              },
            });

            fullContent = functionResult;
          }

          // Log the full assistant message if it was regular content (not a function call)
          if (!hasFunctionCall && fullContent) {
            await supabaseClient.from("chat_messages").insert({
              session_id: sessionId,
              role: "bot" as const,
              content: fullContent,
              metadata: { model: "gpt-4o" },
            });
          }

          // Send final completion event
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ done: true, session_id: sessionId })}\n\n`,
            ),
          );

          controller.close();
        } catch (streamError) {
          console.error("Stream processing error:", streamError);
          const fallback =
            "I apologize for the interruption. Please contact Lorena at (915) 996-9203.";
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ content: fallback, session_id: sessionId, error: true })}\n\n`,
            ),
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err) {
    console.error("chat-completion error:", err);
    return errorResponse(
      err instanceof Error ? err.message : "Internal server error",
      500,
      getCorsHeaders(req),
    );
  }
});
