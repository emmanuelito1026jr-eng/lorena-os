import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase/client';
import { useAuth } from './useAuth';

// ---------------------------------------------------------------------------
// Types — matches the Edge Function response shape
// ---------------------------------------------------------------------------

interface BriefingSection {
  title: string;
  items: string[];
  priority: 'high' | 'medium' | 'low';
}

interface BriefingRawData {
  new_leads_count: number;
  hot_leads_count: number;
  score_alerts_count: number;
  todays_showings_count: number;
  unread_messages_count: number;
  pipeline_changes_count: number;
}

export interface DailyBriefing {
  generated_at: string;
  sections: BriefingSection[];
  raw_data: BriefingRawData;
  narrative: string;
}

interface BriefingResponse {
  briefing: DailyBriefing;
  cached: boolean;
  date: string;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDailyBriefing() {
  const { user } = useAuth();

  const query = useQuery<DailyBriefing>({
    queryKey: ['daily-briefing', user?.id],
    queryFn: async (): Promise<DailyBriefing> => {
      if (!user) throw new Error('Not authenticated');

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) throw new Error('No session token');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) return null as unknown as DailyBriefing;

      let response: Response;
      try {
        response = await fetch(
          `${supabaseUrl}/functions/v1/daily-briefing`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
              apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
            },
            body: JSON.stringify({ agent_id: user.id }),
          },
        );
      } catch {
        // Edge function not deployed or network error — return null silently
        return null as unknown as DailyBriefing;
      }

      if (!response.ok) {
        // Edge function returned an error — return null silently
        return null as unknown as DailyBriefing;
      }

      const data: BriefingResponse = await response.json();
      return data.briefing;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 60, // 1 hour — briefing is valid for the day
    gcTime: 1000 * 60 * 60 * 4, // keep in cache for 4 hours
    retry: 1, // only retry once — Edge Function may not be deployed
    retryDelay: 2000,
  });

  return {
    briefing: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
