import { createContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase/client';
import type { Profile } from '../../lib/supabase/database.types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAgent: boolean;
  isClient: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: AuthError | null; needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

async function createProfileViaEdge(userId: string, email: string, fullName: string, accessToken: string): Promise<{ error: AuthError | null }> {
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-profile`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        user_id: userId,
        email,
        full_name: fullName,
      }),
    }
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Profile creation failed' }));
    return { error: { message: body.error || 'Profile creation failed', status: res.status } as unknown as AuthError };
  }
  return { error: null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (currentUser: User) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();

    if (error && error.code === 'PGRST116') {
      // Profile not found — first login after email confirmation.
      // Auto-create via edge function using metadata stored during signup.
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (accessToken) {
        const fullName = (currentUser.user_metadata?.full_name as string) || '';
        const email = currentUser.email || '';
        const { error: createErr } = await createProfileViaEdge(currentUser.id, email, fullName, accessToken);
        if (createErr) {
          console.error('[AuthProvider] auto-create profile failed:', createErr);
          setProfile(null);
          return;
        }
        // Re-fetch after creation
        const { data: retryData, error: retryErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        if (retryErr) console.error('[AuthProvider] re-fetch profile failed:', retryErr);
        setProfile(retryData);
      } else {
        setProfile(null);
      }
      return;
    }

    if (error) console.error('[AuthProvider] fetchProfile failed:', error);
    setProfile(data);
  }, []);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user);
        } else {
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    if (error) return { error, needsEmailConfirmation: false };

    // Supabase returns a fake user (no session) when email is already registered
    if (data.user && !data.session && data.user.identities?.length === 0) {
      return {
        error: { message: 'An account with this email already exists. Please sign in instead.', status: 400 } as unknown as AuthError,
        needsEmailConfirmation: false,
      };
    }

    // Email confirmation required — user exists but no session yet
    if (data.user && !data.session) {
      return { error: null, needsEmailConfirmation: true };
    }

    // Immediate session — create profile now
    if (data.user) {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (accessToken) {
        const { error: profileErr } = await createProfileViaEdge(data.user.id, email, fullName, accessToken);
        if (profileErr) return { error: profileErr, needsEmailConfirmation: false };
      }
    }

    return { error: null, needsEmailConfirmation: false };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error };
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user);
  }, [user, fetchProfile]);

  const value: AuthContextType = {
    user,
    profile,
    isLoading,
    isAgent: profile?.role === 'agent',
    isClient: profile?.role === 'client',
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
