/**
 * useIntegrations — fetch + update integration connection statuses
 * Manages Gmail, Twilio, SendGrid, Calendly, Apollo, Instantly
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase/client';

export type ServiceKey = 'gmail' | 'twilio' | 'sendgrid' | 'calendly' | 'apollo' | 'instantly';
export type IntegrationStatus = 'connected' | 'not_connected' | 'error' | 'pending';

export interface Integration {
  id: string;
  agent_id: string;
  service: ServiceKey;
  status: IntegrationStatus;
  display_name: string | null;
  connected_at: string | null;
  last_verified: string | null;
  config: Record<string, unknown>;
  error_message: string | null;
}

export function useIntegrations(agentId?: string) {
  return useQuery({
    queryKey: ['integrations', agentId],
    queryFn: async (): Promise<Integration[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('integrations')
        .select('*')
        .order('service');
      if (error) throw error;
      return (data || []) as Integration[];
    },
    enabled: !!agentId,
    staleTime: 30_000,
  });
}

export function useUpdateIntegration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      service,
      status,
      displayName,
      config,
      errorMessage,
    }: {
      service: ServiceKey;
      status: IntegrationStatus;
      displayName?: string;
      config?: Record<string, unknown>;
      errorMessage?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('integrations')
        .upsert({
          agent_id: user.id,
          service,
          status,
          display_name: displayName || null,
          config: config || {},
          error_message: errorMessage || null,
          connected_at: status === 'connected' ? new Date().toISOString() : undefined,
          last_verified: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'agent_id,service' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['integrations'] }),
  });
}

export function useRealtorProfile() {
  return useQuery({
    queryKey: ['realtor_profile'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('realtor_profile')
        .select('*')
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });
}

export function useUpdateRealtorProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('realtor_profile')
        .upsert({ agent_id: user.id, ...updates, updated_at: new Date().toISOString() }, { onConflict: 'agent_id' });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['realtor_profile'] }),
  });
}
