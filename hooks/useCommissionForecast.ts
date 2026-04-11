/**
 * Commission Tracker — Projected vs Actual
 * Shows Lorena her earnings pipeline in real-time
 * P2 feature from Evolution Engine backlog
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase/client';

interface CommissionData {
  projected_total: number;
  actual_ytd: number;
  active_deals: number;
  closing_this_month: number;
  avg_commission_rate: number;
  pipeline_value: number;
}

export function useCommissionForecast() {
  return useQuery<CommissionData>({
    queryKey: ['commission-forecast'],
    queryFn: async (): Promise<CommissionData> => {
      const now = new Date();
      const yearStart = `${now.getFullYear()}-01-01`;
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

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

      const activeDeals = activePipeline.data || [];
      const closedDeals = closedYTD.data || [];

      const pipelineValue = activeDeals.reduce((sum, d) => sum + (d.sale_price || d.list_price || 0), 0);
      const avgRate = activeDeals.length
        ? activeDeals.reduce((sum, d) => sum + (d.commission_rate || 3), 0) / activeDeals.length
        : 3;
      const projected = Math.round(pipelineValue * (avgRate / 100));

      const actualYTD = closedDeals.reduce((sum, d) => {
        const price = d.sale_price || d.list_price || 0;
        const rate = d.commission_rate || 3;
        return sum + Math.round(price * (rate / 100));
      }, 0);

      const closingThisMonth = activeDeals.filter(d =>
        d.stage === 'pending' || d.stage === 'under_contract'
      ).length;

      return {
        projected_total: projected,
        actual_ytd: actualYTD,
        active_deals: activeDeals.length,
        closing_this_month: closingThisMonth,
        avg_commission_rate: Math.round(avgRate * 10) / 10,
        pipeline_value: pipelineValue,
      };
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}
