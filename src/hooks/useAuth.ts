'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
}

let cachedState: AuthState = { user: null, profile: null, isLoading: true };
const listeners = new Set<(state: AuthState) => void>();

function notify(state: AuthState) {
  cachedState = state;
  listeners.forEach(fn => fn(state));
}

// Initialize auth once at module level
let initialized = false;
function initAuth() {
  if (initialized) return;
  initialized = true;
  const supabase = getSupabaseBrowserClient();

  async function loadProfile(user: User | null) {
    if (!user) { notify({ user: null, profile: null, isLoading: false }); return; }
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      notify({ user, profile: data as Profile | null, isLoading: false });
    } catch {
      notify({ user, profile: null, isLoading: false });
    }
  }

  supabase.auth.getSession().then(({ data: { session } }) => {
    loadProfile(session?.user ?? null);
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    loadProfile(session?.user ?? null);
  });
}

export function useAuth() {
  const [state, setState] = useState<AuthState>(cachedState);

  useEffect(() => {
    initAuth();
    listeners.add(setState);
    setState(cachedState); // sync immediately
    return () => { listeners.delete(setState); };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!cachedState.user) return;
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.from('profiles').select('*').eq('id', cachedState.user.id).single();
    notify({ ...cachedState, profile: data as Profile | null });
  }, []);

  return { ...state, signOut, refreshProfile };
}
