import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase/client';

interface CommissionData {
  projected_total: number;
  actual_ytd: number;
  active_deals: number;
  totalDeals: number;
  closing_this_month: number;
  avg_commission_rate: number;
  pipeline_value: number;
  projectedRevenue: number;      // alias for projected_total
  rawPipelineVolume: number;     // alias for pipeline_value
  byStage: { stage: string; label: string; count: number; value: number; commission: number; probability?: number; weightedCommission?: number; rawVolume?: number }[];
}

const STAGE_LABELS: Record<string, string> = {
  pre_listing: 'Pre-Listing',
  active_listing: 'Active Listing',
  under_contract: 'Under Contract',
  pending: 'Pending',
  closed: 'Closed',
};

export function useCommissionForecast() {
  return useQuery<CommissionData>({
    queryKey: ['commission-forecast'],
    queryFn: async (): Promise<CommissionData> => {
      const now = new Date();
      const yearStart = `${now.getFullYear()}-01-01`;

      const [activePipeline, closedYTD] = await Promise.all([
        supabase
          .from('deals')
          .select('sale_price, list_price, commission_rate, stage')
          .not('stage', 'in', '("closed","fallen_through")'),
        supabase
          .from('deals')
          .select('sale_price, list_price, commission_rate')
          .eq('stage', 'closed')
          .gte('actual_close_date', yearStart),
      ]);

      const active = activePipeline.data ?? [];
      const closed = closedYTD.data ?? [];

      const pipelineValue = active.reduce((s, d) => s + (d.sale_price ?? d.list_price ?? 0), 0);
      const avgRate = active.length
        ? active.reduce((s, d) => s + (d.commission_rate ?? 3), 0) / active.length
        : 3;
      const projected = Math.round(pipelineValue * (avgRate / 100));

      const actualYTD = closed.reduce((s, d) => {
        const p = d.sale_price ?? d.list_price ?? 0;
        const r = d.commission_rate ?? 3;
        return s + Math.round(p * (r / 100));
      }, 0);

      // Group by stage
      const stageMap = new Map<string, { count: number; value: number }>();
      for (const d of active) {
        const existing = stageMap.get(d.stage) ?? { count: 0, value: 0 };
        existing.count += 1;
        existing.value += d.sale_price ?? d.list_price ?? 0;
        stageMap.set(d.stage, existing);
      }

      const byStage = Array.from(stageMap.entries()).map(([stage, { count, value }]) => ({
        stage,
        label: STAGE_LABELS[stage] ?? stage,
        count,
        value,
        commission: Math.round(value * (avgRate / 100)),
      }));

      // Add probability and weighted values to byStage
      const stageProbability: Record<string,number> = {
        pre_listing: 0.3, active_listing: 0.5, under_contract: 0.8, pending: 0.9, closed: 1.0,
      };
      const byStageEnriched = byStage.map(s => ({
        ...s,
        probability: stageProbability[s.stage] ?? 0.5,
        weightedCommission: Math.round(s.commission * (stageProbability[s.stage] ?? 0.5)),
        rawVolume: s.value,
      }));

      return {
        projected_total: projected,
        actual_ytd: actualYTD,
        active_deals: active.length,
        totalDeals: active.length,
        closing_this_month: active.filter(d => d.stage === 'pending' || d.stage === 'under_contract').length,
        avg_commission_rate: Math.round(avgRate * 10) / 10,
        pipeline_value: pipelineValue,
        projectedRevenue: projected,
        rawPipelineVolume: pipelineValue,
        byStage: byStageEnriched,
      };
    },
    staleTime: 1000 * 60 * 15,
  });
}
