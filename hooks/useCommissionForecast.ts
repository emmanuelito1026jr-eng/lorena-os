import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase/client';
import type { DealStage } from '../lib/supabase/database.types';

// Close probability by stage — weighted pipeline projection
const STAGE_PROBABILITY: Record<string, number> = {
  pre_listing: 0.10,
  active_listing: 0.25,
  under_contract: 0.60,
  pending: 0.85,
  closed: 1.00,
};

interface StageForecast {
  stage: DealStage;
  label: string;
  count: number;
  rawVolume: number;
  weightedVolume: number;
  weightedCommission: number;
  probability: number;
}

interface CommissionForecast {
  projectedRevenue: number;
  rawPipelineVolume: number;
  totalDeals: number;
  byStage: StageForecast[];
}

const STAGE_LABELS: Record<string, string> = {
  pre_listing: 'Pre-Listing',
  active_listing: 'Active',
  under_contract: 'Under Contract',
  pending: 'Pending',
  closed: 'Closed',
};

export function useCommissionForecast() {
  return useQuery({
    queryKey: ['commission-forecast'],
    queryFn: async (): Promise<CommissionForecast> => {
      const { data, error } = await supabase
        .from('deals')
        .select('stage, list_price, sale_price, commission_rate')
        .not('stage', 'eq', 'fallen_through');

      if (error) throw error;

      const stageMap = new Map<string, StageForecast>();
      const stages: DealStage[] = ['pre_listing', 'active_listing', 'under_contract', 'pending', 'closed'];

      for (const stage of stages) {
        stageMap.set(stage, {
          stage,
          label: STAGE_LABELS[stage] ?? stage,
          count: 0,
          rawVolume: 0,
          weightedVolume: 0,
          weightedCommission: 0,
          probability: STAGE_PROBABILITY[stage] ?? 0,
        });
      }

      for (const deal of data ?? []) {
        const entry = stageMap.get(deal.stage);
        if (!entry) continue;

        const price = deal.sale_price ?? deal.list_price ?? 0;
        const rate = (deal.commission_rate ?? 3) / 100;
        const prob = STAGE_PROBABILITY[deal.stage] ?? 0;

        entry.count += 1;
        entry.rawVolume += price;
        entry.weightedVolume += price * prob;
        entry.weightedCommission += price * rate * prob;
      }

      const byStage = stages
        .map((s) => stageMap.get(s)!)
        .filter((s) => s.count > 0);

      const projectedRevenue = byStage.reduce((sum, s) => sum + s.weightedCommission, 0);
      const rawPipelineVolume = byStage.reduce((sum, s) => sum + s.rawVolume, 0);
      const totalDeals = byStage.reduce((sum, s) => sum + s.count, 0);

      return {
        projectedRevenue,
        rawPipelineVolume,
        totalDeals,
        byStage,
      };
    },
  });
}

export type { CommissionForecast, StageForecast };
