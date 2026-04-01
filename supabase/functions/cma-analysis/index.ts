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
interface SubjectProperty {
  address: string;
  beds: number;
  baths: number;
  sqft: number;
  year_built: number;
}

interface Comparable {
  address: string;
  sold_price: number;
  sold_date: string;
  beds: number;
  baths: number;
  sqft: number;
  year_built: number;
  price_per_sqft: number;
}

interface CMAAnalysisRequest {
  subject: SubjectProperty;
  comparables: Comparable[];
  estimated_value: number;
  estimated_range: {
    low: number;
    high: number;
  };
}

interface CMAAnalysisResponse {
  narrative: string;
  confidence_score: number;
  key_differentiators: string[];
  recommended_list_price: number;
  market_position: "below_market" | "at_market" | "above_market";
  price_adjustments: {
    comparable_address: string;
    adjusted_price: number;
    adjustments: {
      reason: string;
      amount: number;
    }[];
  }[];
  summary_stats: {
    avg_price_per_sqft: number;
    median_sold_price: number;
    avg_days_since_sale: number;
    price_range: { low: number; high: number };
  };
}

// =============================================================================
// Validation
// =============================================================================
function validateRequest(body: CMAAnalysisRequest): string | null {
  if (!body.subject) {
    return "subject property is required";
  }
  if (!body.subject.address || typeof body.subject.address !== "string") {
    return "subject.address is required";
  }
  if (typeof body.subject.beds !== "number" || body.subject.beds < 0) {
    return "subject.beds must be a non-negative number";
  }
  if (typeof body.subject.baths !== "number" || body.subject.baths < 0) {
    return "subject.baths must be a non-negative number";
  }
  if (typeof body.subject.sqft !== "number" || body.subject.sqft <= 0) {
    return "subject.sqft must be a positive number";
  }
  if (typeof body.subject.year_built !== "number" || body.subject.year_built < 1800) {
    return "subject.year_built must be a valid year (>= 1800)";
  }

  if (!body.comparables || !Array.isArray(body.comparables)) {
    return "comparables array is required";
  }
  if (body.comparables.length < 3) {
    return "At least 3 comparables are required for a reliable CMA";
  }

  for (let i = 0; i < body.comparables.length; i++) {
    const comp = body.comparables[i];
    if (!comp.address) return `comparables[${i}].address is required`;
    if (typeof comp.sold_price !== "number" || comp.sold_price <= 0) {
      return `comparables[${i}].sold_price must be a positive number`;
    }
    if (!comp.sold_date) return `comparables[${i}].sold_date is required`;
    if (typeof comp.sqft !== "number" || comp.sqft <= 0) {
      return `comparables[${i}].sqft must be a positive number`;
    }
  }

  if (typeof body.estimated_value !== "number" || body.estimated_value <= 0) {
    return "estimated_value must be a positive number";
  }
  if (
    !body.estimated_range ||
    typeof body.estimated_range.low !== "number" ||
    typeof body.estimated_range.high !== "number"
  ) {
    return "estimated_range with low and high values is required";
  }
  if (body.estimated_range.low >= body.estimated_range.high) {
    return "estimated_range.low must be less than estimated_range.high";
  }

  return null;
}

// =============================================================================
// Compute summary statistics from comparables
// =============================================================================
function computeSummaryStats(
  comparables: Comparable[],
): CMAAnalysisResponse["summary_stats"] {
  const prices = comparables.map((c) => c.sold_price).sort((a, b) => a - b);
  const ppsqfts = comparables.map((c) => c.price_per_sqft);
  const avgPpsqft =
    ppsqfts.reduce((sum, v) => sum + v, 0) / ppsqfts.length;

  const medianPrice =
    prices.length % 2 === 0
      ? (prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2
      : prices[Math.floor(prices.length / 2)];

  const now = Date.now();
  const avgDaysSinceSale =
    comparables.reduce((sum, c) => {
      const soldDate = new Date(c.sold_date).getTime();
      return sum + (now - soldDate) / (1000 * 60 * 60 * 24);
    }, 0) / comparables.length;

  return {
    avg_price_per_sqft: Math.round(avgPpsqft * 100) / 100,
    median_sold_price: medianPrice,
    avg_days_since_sale: Math.round(avgDaysSinceSale),
    price_range: {
      low: prices[0],
      high: prices[prices.length - 1],
    },
  };
}

// =============================================================================
// Compute price adjustments for each comparable
// =============================================================================
function computeAdjustments(
  subject: SubjectProperty,
  comparables: Comparable[],
): CMAAnalysisResponse["price_adjustments"] {
  return comparables.map((comp) => {
    const adjustments: { reason: string; amount: number }[] = [];

    // Size adjustment: $50/sqft difference (El Paso market)
    const sqftDiff = subject.sqft - comp.sqft;
    if (Math.abs(sqftDiff) > 50) {
      const sqftAdj = sqftDiff * 50;
      adjustments.push({
        reason: `Size: subject is ${Math.abs(sqftDiff)} sqft ${sqftDiff > 0 ? "larger" : "smaller"}`,
        amount: sqftAdj,
      });
    }

    // Bedroom adjustment: ~$10,000 per bedroom difference
    const bedDiff = subject.beds - comp.beds;
    if (bedDiff !== 0) {
      const bedAdj = bedDiff * 10000;
      adjustments.push({
        reason: `Bedrooms: subject has ${Math.abs(bedDiff)} ${bedDiff > 0 ? "more" : "fewer"} bedroom${Math.abs(bedDiff) > 1 ? "s" : ""}`,
        amount: bedAdj,
      });
    }

    // Bathroom adjustment: ~$7,500 per bathroom difference
    const bathDiff = subject.baths - comp.baths;
    if (bathDiff !== 0) {
      const bathAdj = bathDiff * 7500;
      adjustments.push({
        reason: `Bathrooms: subject has ${Math.abs(bathDiff)} ${bathDiff > 0 ? "more" : "fewer"} bathroom${Math.abs(bathDiff) > 1 ? "s" : ""}`,
        amount: bathAdj,
      });
    }

    // Age adjustment: ~$1,500 per year difference (newer = more valuable)
    const ageDiff = comp.year_built - subject.year_built;
    if (Math.abs(ageDiff) > 2) {
      const ageAdj = ageDiff * 1500;
      adjustments.push({
        reason: `Age: comp is ${Math.abs(ageDiff)} years ${ageDiff > 0 ? "newer" : "older"}`,
        amount: ageAdj,
      });
    }

    // Time adjustment: ~0.3% per month depreciation for older sales
    const monthsSinceSale = Math.floor(
      (Date.now() - new Date(comp.sold_date).getTime()) /
        (1000 * 60 * 60 * 24 * 30),
    );
    if (monthsSinceSale > 2) {
      const timeAdj = Math.round(comp.sold_price * 0.003 * monthsSinceSale);
      adjustments.push({
        reason: `Time: sold ${monthsSinceSale} months ago (+0.3%/mo market appreciation)`,
        amount: timeAdj,
      });
    }

    const totalAdj = adjustments.reduce((sum, a) => sum + a.amount, 0);

    return {
      comparable_address: comp.address,
      adjusted_price: comp.sold_price + totalAdj,
      adjustments,
    };
  });
}

// =============================================================================
// Determine market position
// =============================================================================
function determineMarketPosition(
  estimatedValue: number,
  medianSoldPrice: number,
): "below_market" | "at_market" | "above_market" {
  const ratio = estimatedValue / medianSoldPrice;
  if (ratio < 0.95) return "below_market";
  if (ratio > 1.05) return "above_market";
  return "at_market";
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

    const body: CMAAnalysisRequest = await req.json();

    // Validate input
    const validationError = validateRequest(body);
    if (validationError) {
      return errorResponse(validationError, 400, CORS_HEADERS);
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

    if (authError || !user) {
      return errorResponse("Unauthorized", 403, CORS_HEADERS);
    }

    // Verify agent role
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: profile } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "agent") {
      return errorResponse("Only agents can generate CMA analyses", 403, CORS_HEADERS);
    }

    // =========================================================================
    // Compute local adjustments and stats
    // =========================================================================
    const summaryStats = computeSummaryStats(body.comparables);
    const priceAdjustments = computeAdjustments(body.subject, body.comparables);
    const marketPosition = determineMarketPosition(
      body.estimated_value,
      summaryStats.median_sold_price,
    );

    // Calculate recommended list price from adjusted comps
    const adjustedPrices = priceAdjustments.map((pa) => pa.adjusted_price);
    const avgAdjustedPrice =
      adjustedPrices.reduce((sum, p) => sum + p, 0) / adjustedPrices.length;
    const recommendedListPrice = Math.round(avgAdjustedPrice / 1000) * 1000;

    // =========================================================================
    // Build the prompt for Claude Sonnet
    // =========================================================================
    const cmaPrompt = `You are a real estate market analyst generating a CMA (Comparative Market Analysis) narrative for a property in El Paso, TX. Write a professional, clear, and actionable analysis.

## Subject Property
- Address: ${body.subject.address}
- Bedrooms: ${body.subject.beds} | Bathrooms: ${body.subject.baths}
- Square Footage: ${body.subject.sqft.toLocaleString()}
- Year Built: ${body.subject.year_built}

## Comparable Sales (${body.comparables.length} properties)
${body.comparables.map((c, i) => `
${i + 1}. ${c.address}
   Sold: $${c.sold_price.toLocaleString()} on ${c.sold_date}
   ${c.beds}bd/${c.baths}ba | ${c.sqft.toLocaleString()} sqft | Built ${c.year_built}
   $${c.price_per_sqft.toFixed(2)}/sqft
`).join("")}

## Our Calculations
- Average Price/SqFt: $${summaryStats.avg_price_per_sqft.toFixed(2)}
- Median Sold Price: $${summaryStats.median_sold_price.toLocaleString()}
- Estimated Value: $${body.estimated_value.toLocaleString()}
- Value Range: $${body.estimated_range.low.toLocaleString()} - $${body.estimated_range.high.toLocaleString()}
- Recommended List Price: $${recommendedListPrice.toLocaleString()}
- Market Position: ${marketPosition.replace("_", " ")}

## Adjusted Comparable Values
${priceAdjustments.map((pa) => `
- ${pa.comparable_address}: Adjusted to $${pa.adjusted_price.toLocaleString()}
  ${pa.adjustments.map((a) => `  * ${a.reason}: ${a.amount >= 0 ? "+" : ""}$${a.amount.toLocaleString()}`).join("\n")}
`).join("")}

Write your response as JSON with this exact structure:
{
  "narrative": "A 2-3 paragraph professional analysis discussing the subject property's value relative to recent sales. Mention specific comparables by address. Include market context for El Paso. Be confident but honest about limitations. This is for Lorena to share with her clients, so keep it professional and easy to understand.",
  "confidence_score": <number 1-10>,
  "key_differentiators": ["Factor 1 that most affects the value", "Factor 2", "Factor 3"],
  "recommended_list_price": ${recommendedListPrice}
}

CONFIDENCE SCORING GUIDE:
- 8-10: Comps are very similar (same neighborhood, similar size/age, sold within 3 months)
- 5-7: Comps are reasonably similar but have some differences requiring adjustment
- 3-4: Comps require significant adjustments or are from different areas
- 1-2: Insufficient or poorly matched comparables`;

    // =========================================================================
    // Call Anthropic Claude Sonnet
    // =========================================================================
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");

    let narrative: string;
    let confidenceScore: number;
    let keyDifferentiators: string[];

    if (!anthropicApiKey) {
      // Graceful degradation: build analysis from computed data without AI
      narrative = buildFallbackNarrative(
        body.subject,
        body.comparables,
        summaryStats,
        recommendedListPrice,
        marketPosition,
      );
      confidenceScore = calculateFallbackConfidence(body.subject, body.comparables);
      keyDifferentiators = buildFallbackDifferentiators(body.subject, body.comparables, summaryStats);
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
              max_tokens: 1500,
              messages: [
                {
                  role: "user",
                  content: cmaPrompt,
                },
              ],
            }),
          },
        );

        if (!anthropicResponse.ok) {
          const errText = await anthropicResponse.text();
          console.error("Anthropic API error:", anthropicResponse.status, errText);
          // Fall back to computed analysis
          narrative = buildFallbackNarrative(
            body.subject,
            body.comparables,
            summaryStats,
            recommendedListPrice,
            marketPosition,
          );
          confidenceScore = calculateFallbackConfidence(body.subject, body.comparables);
          keyDifferentiators = buildFallbackDifferentiators(body.subject, body.comparables, summaryStats);
        } else {
          const anthropicData = await anthropicResponse.json();
          const responseText = anthropicData.content?.[0]?.text || "";

          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            narrative = parsed.narrative || buildFallbackNarrative(
              body.subject,
              body.comparables,
              summaryStats,
              recommendedListPrice,
              marketPosition,
            );
            confidenceScore = typeof parsed.confidence_score === "number"
              ? Math.min(10, Math.max(1, parsed.confidence_score))
              : calculateFallbackConfidence(body.subject, body.comparables);
            keyDifferentiators = Array.isArray(parsed.key_differentiators)
              ? parsed.key_differentiators
              : buildFallbackDifferentiators(body.subject, body.comparables, summaryStats);
          } else {
            // Claude didn't return valid JSON
            narrative = responseText || buildFallbackNarrative(
              body.subject,
              body.comparables,
              summaryStats,
              recommendedListPrice,
              marketPosition,
            );
            confidenceScore = calculateFallbackConfidence(body.subject, body.comparables);
            keyDifferentiators = buildFallbackDifferentiators(body.subject, body.comparables, summaryStats);
          }
        }
      } catch (apiErr) {
        console.error("Anthropic API call failed:", apiErr);
        narrative = buildFallbackNarrative(
          body.subject,
          body.comparables,
          summaryStats,
          recommendedListPrice,
          marketPosition,
        );
        confidenceScore = calculateFallbackConfidence(body.subject, body.comparables);
        keyDifferentiators = buildFallbackDifferentiators(body.subject, body.comparables, summaryStats);
      }
    }

    // =========================================================================
    // Build final response
    // =========================================================================
    const analysis: CMAAnalysisResponse = {
      narrative,
      confidence_score: confidenceScore,
      key_differentiators: keyDifferentiators,
      recommended_list_price: recommendedListPrice,
      market_position: marketPosition,
      price_adjustments: priceAdjustments,
      summary_stats: summaryStats,
    };

    return new Response(
      JSON.stringify({ analysis }),
      {
        status: 200,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("cma-analysis error:", err);
    return errorResponse(
      err instanceof Error ? err.message : "Internal server error",
      500,
      getCorsHeaders(req),
    );
  }
});

// =============================================================================
// Fallback functions (no AI)
// =============================================================================
function buildFallbackNarrative(
  subject: SubjectProperty,
  comparables: Comparable[],
  stats: CMAAnalysisResponse["summary_stats"],
  recommendedPrice: number,
  position: string,
): string {
  const positionText = position === "at_market"
    ? "in line with"
    : position === "above_market"
      ? "above"
      : "below";

  return `Based on ${comparables.length} comparable sales near ${subject.address}, the estimated market value is $${recommendedPrice.toLocaleString()}. The subject property at ${subject.sqft.toLocaleString()} sqft with ${subject.beds} bedrooms and ${subject.baths} bathrooms (built ${subject.year_built}) is ${positionText} current market conditions.\n\nComparable properties sold between $${stats.price_range.low.toLocaleString()} and $${stats.price_range.high.toLocaleString()}, with a median of $${stats.median_sold_price.toLocaleString()} and an average price per square foot of $${stats.avg_price_per_sqft.toFixed(2)}. After adjusting for differences in size, bedrooms, bathrooms, age, and sale date, the recommended list price is $${recommendedPrice.toLocaleString()}.`;
}

function calculateFallbackConfidence(
  subject: SubjectProperty,
  comparables: Comparable[],
): number {
  let score = 7; // Base confidence

  // Penalize for few comparables
  if (comparables.length < 4) score -= 1;
  if (comparables.length >= 6) score += 1;

  // Penalize for large size differences
  const avgSqft = comparables.reduce((s, c) => s + c.sqft, 0) / comparables.length;
  const sizeDiffPct = Math.abs(subject.sqft - avgSqft) / avgSqft;
  if (sizeDiffPct > 0.3) score -= 2;
  else if (sizeDiffPct > 0.15) score -= 1;

  // Penalize for old sales
  const now = Date.now();
  const avgDays =
    comparables.reduce(
      (s, c) => s + (now - new Date(c.sold_date).getTime()) / (1000 * 60 * 60 * 24),
      0,
    ) / comparables.length;
  if (avgDays > 180) score -= 1;
  if (avgDays > 365) score -= 1;

  // Penalize for large age differences
  const avgAge = comparables.reduce((s, c) => s + c.year_built, 0) / comparables.length;
  if (Math.abs(subject.year_built - avgAge) > 20) score -= 1;

  return Math.min(10, Math.max(1, score));
}

function buildFallbackDifferentiators(
  subject: SubjectProperty,
  comparables: Comparable[],
  stats: CMAAnalysisResponse["summary_stats"],
): string[] {
  const diffs: string[] = [];

  const avgSqft = comparables.reduce((s, c) => s + c.sqft, 0) / comparables.length;
  if (subject.sqft > avgSqft * 1.1) {
    diffs.push(`Larger than comparable average (${subject.sqft.toLocaleString()} vs ${Math.round(avgSqft).toLocaleString()} sqft)`);
  } else if (subject.sqft < avgSqft * 0.9) {
    diffs.push(`Smaller than comparable average (${subject.sqft.toLocaleString()} vs ${Math.round(avgSqft).toLocaleString()} sqft)`);
  }

  const avgYear = Math.round(comparables.reduce((s, c) => s + c.year_built, 0) / comparables.length);
  if (subject.year_built > avgYear + 5) {
    diffs.push(`Newer construction (${subject.year_built} vs avg ${avgYear})`);
  } else if (subject.year_built < avgYear - 5) {
    diffs.push(`Older construction (${subject.year_built} vs avg ${avgYear})`);
  }

  diffs.push(
    `Area avg price/sqft: $${stats.avg_price_per_sqft.toFixed(2)}`,
  );

  return diffs;
}
