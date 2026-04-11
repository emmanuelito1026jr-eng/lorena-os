/**
 * Speed-to-Lead Timer — Real-time response tracking
 * Studies show: <5 min response = 21x more conversions
 * Shows on every new lead card — creates urgency
 */
import { useState, useEffect } from 'react';
import { Zap, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase/client';

interface NewLead {
  id: string;
  first_name: string;
  last_name: string;
  source: string;
  score: number;
  created_at: string;
  last_activity: string | null;
}

function TimerBadge({ createdAt }: { createdAt: string }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
      setElapsed(diff);
    };
    update();
    const interval = setInterval(update, 30000); // update every 30s
    return () => clearInterval(interval);
  }, [createdAt]);

  const minutes = Math.floor(elapsed / 60);
  const hours = Math.floor(minutes / 60);

  const isUrgent = minutes < 5;
  const isWarning = minutes >= 5 && minutes < 30;
  const isCold = minutes >= 30;

  const label = hours > 0
    ? `${hours}h ${minutes % 60}m`
    : `${minutes}m`;

  if (isCold) return null; // Only show for leads under 30 mins

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
      isUrgent ? 'bg-red-100 text-red-700 animate-pulse' :
      isWarning ? 'bg-amber-100 text-amber-700' :
      'bg-gray-100 text-gray-600'
    }`}>
      {isUrgent ? <Zap size={10} /> : <Clock size={10} />}
      {label}
    </span>
  );
}

export function SpeedToLeadModule() {
  const { data: newLeads = [] } = useQuery<NewLead[]>({
    queryKey: ['speed-to-lead-new'],
    queryFn: async () => {
      const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // last 30 min
      const { data, error } = await supabase
        .from('leads')
        .select('id, first_name, last_name, source, score, created_at, last_activity')
        .gte('created_at', cutoff)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 60000, // check every minute
    staleTime: 30000,
  });

  if (!newLeads.length) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 bg-red-100 rounded-lg flex items-center justify-center">
          <Zap size={14} className="text-red-600" />
        </div>
        <div>
          <p className="font-semibold text-sm text-red-800">Speed-to-Lead Alert</p>
          <p className="text-[11px] text-red-600">Sub-5 min response = 21× more conversions</p>
        </div>
      </div>
      <div className="space-y-2">
        {newLeads.slice(0, 3).map(lead => (
          <div key={lead.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-red-100">
            <div>
              <p className="font-medium text-sm text-gray-900">{lead.first_name} {lead.last_name}</p>
              <p className="text-[11px] text-gray-500">via {lead.source} · score {lead.score}</p>
            </div>
            <div className="flex items-center gap-2">
              <TimerBadge createdAt={lead.created_at} />
              <a href={`/dashboard/leads/${lead.id}`} className="text-[11px] px-2 py-1 bg-red-600 text-white rounded-md font-medium hover:bg-red-700">
                Call Now
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
