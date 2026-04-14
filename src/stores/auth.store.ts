'use client';

import { create } from 'zustand';
import type { Profile, SellerProfile } from '@/types';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

interface AuthStore {
  user: Profile | null;
  sellerProfile: SellerProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: Profile | null) => void;
  setSellerProfile: (profile: SellerProfile | null) => void;
  fetchProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  sellerProfile: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) =>
    set({ user, isAuthenticated: !!user, isLoading: false }),

  setSellerProfile: (sellerProfile) => set({ sellerProfile }),

  fetchProfile: async () => {
    const supabase = getSupabaseBrowserClient();
    set({ isLoading: true });

    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        set({ user: null, sellerProfile: null, isAuthenticated: false, isLoading: false });
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error || !profile) {
        set({ user: null, sellerProfile: null, isAuthenticated: false, isLoading: false });
        return;
      }

      set({
        user: profile as Profile,
        isAuthenticated: true,
        isLoading: false,
      });

      // Fetch seller profile if user is a seller
      if (profile.role === 'seller' || profile.role === 'admin') {
        const { data: sellerProfile } = await supabase
          .from('seller_profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (sellerProfile) {
          set({ sellerProfile: sellerProfile as SellerProfile });
        }
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      set({ user: null, sellerProfile: null, isAuthenticated: false, isLoading: false });
    }
  },

  signOut: async () => {
    const supabase = getSupabaseBrowserClient();

    try {
      await supabase.auth.signOut();
    } finally {
      set({
        user: null,
        sellerProfile: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));
