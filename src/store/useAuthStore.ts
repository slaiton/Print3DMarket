// src/store/useAuthStore.ts
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { authService } from '../services/index';
import type { Profile } from '../types';

interface AuthState {
  profile: Profile | null;
  loading: boolean;
  initialized: boolean;
  // Actions
  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  loading: false,
  initialized: false,

  init: async () => {
    set({ loading: true });
    const profile = await authService.getProfile();
    set({ profile, loading: false, initialized: true });

    // Escuchar cambios de sesión
    supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        const p = await authService.getProfile();
        set({ profile: p });
      } else if (event === 'SIGNED_OUT') {
        set({ profile: null });
      }
    });
  },

  signIn: async (email, password) => {
    set({ loading: true });
    try {
      await authService.signIn(email, password);
      const profile = await authService.getProfile();
      set({ profile, loading: false });
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  signOut: async () => {
    await authService.signOut();
    set({ profile: null });
  },
}));
