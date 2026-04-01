import type { LeadTemperature } from '../supabase/database.types';

interface ScoreResult {
  newScore: number;
  reasons: string[];
}

interface ScoringRule {
  category: string;
  keywords: string[];
  points: number;
}

const SCORING_RULES: ScoringRule[] = [
  {
    category: 'buying_intent',
    keywords: ['buy', 'purchase', 'looking for', 'interested in', 'want a home', 'house hunting', 'searching for', 'find a home', 'new home'],
    points: 20,
  },
  {
    category: 'selling_intent',
    keywords: ['sell', 'listing', "what's my home worth", 'market value', 'home value', 'sell my house', 'sell my home', 'list my home'],
    points: 15,
  },
  {
    category: 'budget_signal',
    keywords: ['$', 'price range', 'budget', 'afford', 'pre-approved', 'pre approved', 'mortgage', 'down payment', 'loan', 'financing'],
    points: 15,
  },
  {
    category: 'timeline_urgency',
    keywords: ['asap', 'soon', 'this month', 'next month', 'relocating', 'pcs', 'military move', 'urgent', 'quickly', 'right away', 'immediately'],
    points: 15,
  },
  {
    category: 'location_specific',
    keywords: [
      'westside', 'upper valley', 'northeast', 'horizon', 'eastlake', 'central',
      'mesa hills', 'coronado', 'kern place', 'pebble hills', 'montwood', 'socorro',
      'sunset heights', 'manhattan heights', 'canutillo', 'country club', 'fort bliss',
      '79912', '79922', '79932', '79902', '79924', '79936', '79928', '79938',
    ],
    points: 10,
  },
  {
    category: 'property_details',
    keywords: ['beds', 'bedrooms', 'bedroom', 'bathrooms', 'bathroom', 'bath', 'garage', 'pool', 'sqft', 'square feet', 'acres', 'lot size', 'yard'],
    points: 10,
  },
  {
    category: 'contact_readiness',
    keywords: ['call me', 'my number', 'reach me', 'schedule', 'showing', 'tour', 'visit', 'appointment', 'meet', 'contact me', 'phone number'],
    points: 20,
  },
];

const MAX_SCORE = 100;
const HOT_THRESHOLD = 80;

/**
 * Score a chat message based on keyword matching.
 * Each category can only contribute points once per conversation.
 */
export function scoreMessage(
  message: string,
  currentScore: number,
  matchedCategories: Set<string> = new Set(),
  messageCount: number = 0,
): ScoreResult {
  const lower = message.toLowerCase();
  const reasons: string[] = [];
  let addedPoints = 0;

  for (const rule of SCORING_RULES) {
    if (matchedCategories.has(rule.category)) continue;

    const matched = rule.keywords.some((kw) => lower.includes(kw));
    if (matched) {
      addedPoints += rule.points;
      reasons.push(rule.category);
      matchedCategories.add(rule.category);
    }
  }

  // Engagement bonus after 3rd message
  if (messageCount >= 3 && !matchedCategories.has('engagement')) {
    addedPoints += 5;
    reasons.push('engagement');
    matchedCategories.add('engagement');
  }

  const newScore = Math.min(currentScore + addedPoints, MAX_SCORE);

  return { newScore, reasons };
}

export function getTemperature(score: number): LeadTemperature {
  if (score >= 80) return 'hot';
  if (score >= 50) return 'warm';
  if (score >= 20) return 'cool';
  return 'cold';
}

export function isHotLead(score: number): boolean {
  return score >= 80;
}

export { HOT_THRESHOLD, MAX_SCORE };
