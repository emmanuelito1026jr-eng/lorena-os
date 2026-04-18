-- Migration 018: Integrations + Realtor Profile
-- ALREADY EXECUTED IN SUPABASE -- skip if re-running
CREATE TABLE IF NOT EXISTS public.integrations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  service text NOT NULL,
  status text DEFAULT 'not_connected',
  display_name text,
  connected_at timestamptz,
  last_verified timestamptz,
  config jsonb DEFAULT '{}',
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, service)
);
