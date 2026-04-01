import { SCORING_TABLE } from './constants';
import type { ActionType } from './constants';

export function calculatePoints(
  action: ActionType,
  metadata?: Record<string, unknown>
): number {
  const basePoints = SCORING_TABLE[action];

  // Special case: property_view 3x same property = +5 instead of +2
  if (action === 'property_view' && metadata?.repeatCount && Number(metadata.repeatCount) >= 3) {
    return 5;
  }

  return basePoints;
}
