import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase/client';
import { useAuth } from './useAuth';

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

export function useDailyBriefing() {
  const { user } = useAuth();

  const query = useQuery<DailyBriefing | null>({
    queryKey: ['daily-briefing', user?.id],
    queryFn: async (): Promise<DailyBriefing | null> => {
      if (!user) return null;

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) return null;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) return null;

      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/daily-briefing`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
          },
          body: JSON.stringify({ agent_id: user.id }),
        });

        if (!response.ok) return null;

        const data: BriefingResponse = await response.json();
        
        // Validate the response has the expected shape
        if (!data.briefing?.narrative || !data.briefing?.sections || !data.briefing?.raw_data) {
          return null;
        }
        
        return data.briefing;
      } catch {
        return null;
      }
    },
    enabled: !!user,
    staleTime: (query) => {
      // If data is null (briefing failed/not deployed), retry after 30s
      // If data exists, cache for 1 hour
      return query.state.data ? 1000 * 60 * 60 : 1000 * 30;
    },
    gcTime: 1000 * 60 * 60 * 4,
    retry: 2,
    retryDelay: 3000,
  });

  return {
    briefing: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
