/**
 * Reactivation Module — Cold Lead Re-engagement
 * Shows count of cold leads and launches the re-engagement campaign
 */
import { useState } from 'react';
import { Zap, Users, CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import { showToast } from '../shared/Toast';
import { useQuery } from '@tanstack/react-query';

interface ReactivationResult {
  success: boolean;
  total_cold: number;
  already_enrolled: number;
  newly_enrolled: number;
  remaining: number;
  message: string;
}

function useColdLeadCount() {
  return useQuery<number>({
    queryKey: ['cold-lead-count'],
    queryFn: async () => {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 60);
      const { data, error } = await supabase
        .from('leads')
        .select('id, last_activity, status')
        .not('status', 'eq', 'active_client')
        .limit(1000);
      if (error) throw error;
      return (data ?? []).filter(l =>
        !l.last_activity || new Date(l.last_activity).getTime() < cutoff.getTime()
      ).length;
    },
    staleTime: 1000 * 60 * 10,
  });
}

export function ReactivationModule() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ReactivationResult | null>(null);
  const [batchesRun, setBatchesRun] = useState(0);
  const { data: coldCount = 0 } = useColdLeadCount();

  const runBatch = async () => {
    setRunning(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

      const res = await fetch(`${supabaseUrl}/functions/v1/reactivate-cold-leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anonKey,
          'Authorization': `Bearer ${token || anonKey}`,
        },
        body: JSON.stringify({ agent_id: user?.id, batch_size: 50 }),
      });
      const data: ReactivationResult = await res.json();
      setResult(data);
      setBatchesRun(b => b + 1);
      if (data.success) {
        showToast(`✅ ${data.newly_enrolled} leads re-enrolled in campaign`);
      }
    } catch (e) {
      showToast('Failed to run reactivation', 'error');
    } finally {
      setRunning(false);
    }
  };

  if (coldCount === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-amber-200 p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-amber-500" />
          </div>
          <div>
            <h3 className="font-playfair font-bold text-dashboard-black">Cold Lead Reactivation</h3>
            <p className="font-lato text-xs text-dashboard-secondary mt-0.5">
              <span className="font-semibold text-amber-600">{coldCount} leads</span> haven't been contacted in 60+ days
            </p>
          </div>
        </div>
        {result?.success && (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle size={14} />
            <span className="font-lato text-xs font-semibold">{result.newly_enrolled} enrolled</span>
          </div>
        )}
      </div>

      {result && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-dashboard-surface rounded-lg p-3 text-center">
            <p className="font-playfair text-lg font-bold text-dashboard-black">{result.total_cold}</p>
            <p className="font-lato text-[11px] text-dashboard-secondary">Total cold</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="font-playfair text-lg font-bold text-green-700">{result.newly_enrolled}</p>
            <p className="font-lato text-[11px] text-green-600">Just enrolled</p>
          </div>
          <div className="bg-dashboard-surface rounded-lg p-3 text-center">
            <p className="font-playfair text-lg font-bold text-dashboard-black">{result.remaining}</p>
            <p className="font-lato text-[11px] text-dashboard-secondary">Still waiting</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={runBatch}
          disabled={running}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-lato font-medium text-sm transition-colors ${
            running ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 text-white'
          }`}
        >
          {running ? (
            <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Enrolling batch...</>
          ) : (
            <><Zap size={14} /> {batchesRun === 0 ? 'Launch Re-engagement Campaign' : 'Enroll Next 50 Leads'}</>
          )}
        </button>
        {result && result.remaining > 0 && (
          <p className="font-lato text-xs text-dashboard-secondary">
            {result.remaining} leads remaining — run again to continue
          </p>
        )}
        {result && result.remaining === 0 && (
          <p className="font-lato text-xs text-green-600 font-semibold">
            All cold leads enrolled! ✓
          </p>
        )}
      </div>
    </div>
  );
}
