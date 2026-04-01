import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../supabase/database.types';
import { ACTION_CATEGORIES } from './constants';
import type { ActionType, ScoreCategory } from './constants';

interface BreakdownItem {
  action: string;
  points: number;
  timestamp: string;
  metadata: Record<string, unknown> | null;
}

interface CategoryBreakdown {
  category: ScoreCategory;
  items: BreakdownItem[];
  subtotal: number;
}

export interface ScoreBreakdown {
  categories: CategoryBreakdown[];
  total: number;
}

export async function getScoreBreakdown(
  supabase: SupabaseClient<Database>,
  leadId: string
): Promise<ScoreBreakdown> {
  const { data: activities } = await supabase
    .from('lead_activity')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  const categoryMap = new Map<ScoreCategory, BreakdownItem[]>();

  for (const activity of activities ?? []) {
    const category = ACTION_CATEGORIES[activity.action as ActionType] ?? 'Engagement';
    const items = categoryMap.get(category) ?? [];
    items.push({
      action: activity.action,
      points: activity.points,
      timestamp: activity.created_at,
      metadata: activity.metadata as Record<string, unknown> | null,
    });
    categoryMap.set(category, items);
  }

  const categories: CategoryBreakdown[] = [];
  let total = 0;

  for (const [category, items] of categoryMap) {
    const subtotal = items.reduce((sum, item) => sum + item.points, 0);
    total += subtotal;
    categories.push({ category, items, subtotal });
  }

  // Sort: Engagement, Interest, Intent, Decay, Risk
  const order: ScoreCategory[] = ['Engagement', 'Interest', 'Intent', 'Decay', 'Risk'];
  categories.sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));

  return { categories, total };
}
