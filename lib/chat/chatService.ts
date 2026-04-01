import type { ChatMessage } from '../supabase/database.types';

interface ChatResponse {
  reply: string;
  shouldCapture: boolean;
}

interface PatternRule {
  patterns: RegExp[];
  response: string | ((match: RegExpMatchArray) => string);
  shouldCapture?: boolean;
}

const NEIGHBORHOOD_FACTS: Record<string, string> = {
  westside: 'mountain views, top-rated schools, and luxury living',
  'upper valley': 'lush landscapes, river proximity, and spacious estates',
  northeast: 'established neighborhoods near Fort Bliss with great value',
  horizon: 'a rapidly growing community perfect for new families',
  eastlake: 'family-friendly master-planned living with modern amenities',
  central: 'historic charm meets urban living in the heart of El Paso',
  'mesa hills': 'a desirable Westside community with mountain views',
  'kern place': 'charming historic homes with unique character',
  'pebble hills': 'newer homes in a great Northeast location',
  'sunset heights': 'beautiful historic district with stunning views',
};

const CAPTURE_KEYWORDS = [
  'call me', 'my number', 'reach me', 'contact me', 'phone number',
  'schedule', 'showing', 'tour', 'appointment', 'meet with',
];

const RULES: PatternRule[] = [
  // Greetings
  {
    patterns: [/^(hi|hello|hey|hola|buenos dias|buenas tardes|good morning|good afternoon)\b/i],
    response: "Hi! I'm Lorena's assistant. Are you looking to buy, sell, or just have questions about El Paso real estate?",
  },
  // Buying intent
  {
    patterns: [/\b(buy|purchase|looking for|interested in|want a home|house hunting|find a home|new home|searching for)\b/i],
    response: "That's exciting! What area of El Paso interests you? Popular neighborhoods include Westside, Northeast, Horizon City, and Eastlake.",
  },
  // Selling intent
  {
    patterns: [/\b(sell|listing|what.s my home worth|market value|home value|sell my)\b/i],
    response: "I can help with that! Lorena offers free Comparative Market Analyses (CMAs). Would you like a home value estimate? Just share the address and she'll get one to you.",
    shouldCapture: true,
  },
  // Military / VA
  {
    patterns: [/\b(military|va loan|fort bliss|pcs|army|veteran|active duty)\b/i],
    response: "Lorena is experienced with military relocations and VA loans. She works closely with Fort Bliss families and understands the PCS timeline. Would you like to connect with her?",
    shouldCapture: true,
  },
  // Budget / price
  {
    patterns: [/\b(\$\s*[\d,]+|price range|budget|afford|pre.?approved|mortgage|down payment|financing)\b/i],
    response: "Got it! There are great options in that range in El Paso. Would you like Lorena to send you some listings that match your budget?",
    shouldCapture: true,
  },
  // Timeline urgency
  {
    patterns: [/\b(asap|soon|this month|next month|relocating|urgent|quickly|right away|immediately)\b/i],
    response: "It sounds like timing is important! Lorena can prioritize your search. Let me connect you with her so she can start right away.",
    shouldCapture: true,
  },
  // Property details
  {
    patterns: [/\b(\d+\s*(bed|br|bedroom|bath|ba|bathroom)|garage|pool|sqft|square feet|acre)\b/i],
    response: "Great details! That helps narrow down the perfect property. Lorena can set up a custom search for you. Would you like her to reach out?",
    shouldCapture: true,
  },
  // Contact readiness
  {
    patterns: CAPTURE_KEYWORDS.map((kw) => new RegExp(`\\b${kw.replace(/\s+/g, '\\s+')}\\b`, 'i')),
    response: "Lorena would love to help! Let me get your contact info so she can reach out to you directly.",
    shouldCapture: true,
  },
  // Home estimate
  {
    patterns: [/\b(home estimate|home valuation|what.s my house worth|cma|comps)\b/i],
    response: "Lorena provides free home valuations for El Paso properties. She'll put together a detailed CMA with recent comparable sales. Would you like to share your address?",
    shouldCapture: true,
  },
  // Neighborhood mentions (dynamic)
  {
    patterns: Object.keys(NEIGHBORHOOD_FACTS).map((n) => new RegExp(`\\b${n}\\b`, 'i')),
    response: (match: RegExpMatchArray) => {
      const neighborhood = match[0].toLowerCase();
      const fact = Object.entries(NEIGHBORHOOD_FACTS).find(
        ([key]) => neighborhood.includes(key),
      )?.[1] || 'a wonderful El Paso community';
      return `Great choice! That area is known for ${fact}. What's your price range? Lorena can find homes that match your criteria.`;
    },
  },
  // Spanish greetings
  {
    patterns: [/\b(necesito|busco|quiero|casa|comprar|vender|ayuda)\b/i],
    response: "Lorena habla espanol y le encantaria ayudarle. Are you looking to buy or sell? / Busca comprar o vender?",
  },
];

const FALLBACK_RESPONSE = "I want to make sure I get you the best answer. Let me connect you with Lorena directly — she typically responds within 30 minutes.";

/**
 * Generate a bot response based on keyword matching.
 * Returns the reply text and whether to trigger the lead capture form.
 */
export function generateResponse(
  message: string,
  history: Pick<ChatMessage, 'role' | 'content'>[],
  currentScore: number = 0,
  hasCapturedInfo: boolean = false,
): ChatResponse {
  const visitorMessageCount = history.filter((m) => m.role === 'visitor').length;

  // Check each rule in order
  for (const rule of RULES) {
    for (const pattern of rule.patterns) {
      const match = message.match(pattern);
      if (match) {
        const reply = typeof rule.response === 'function' ? rule.response(match) : rule.response;
        const shouldCapture = !hasCapturedInfo && (rule.shouldCapture || false);
        return { reply, shouldCapture };
      }
    }
  }

  // After 5+ visitor messages without capture, suggest connecting
  if (visitorMessageCount >= 5 && !hasCapturedInfo) {
    return {
      reply: "You've got great questions! Lorena would be the best person to help with the details. Want me to have her reach out to you?",
      shouldCapture: true,
    };
  }

  // Score-based capture trigger
  if (currentScore >= 40 && !hasCapturedInfo) {
    return {
      reply: "Based on what you're looking for, I think Lorena could really help. She knows the El Paso market inside and out. Can I share your info with her?",
      shouldCapture: true,
    };
  }

  // Fallback
  return {
    reply: FALLBACK_RESPONSE,
    shouldCapture: !hasCapturedInfo,
  };
}

export const WELCOME_MESSAGE = "Hi! I'm here to help with your El Paso real estate questions. Are you looking to buy, sell, or just exploring? What can I help you with today?";
