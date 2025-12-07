/**
 * Tilawa Auth Store
 *
 * Zustand store using Supabase authentication.
 */

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

// App user type (from our users table)
interface AppUser {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
}

interface AuthState {
  user: AppUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,

  // Login with email/password
  login: async (email: string, password: string) => {
    set({ isLoading: true });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      set({ isLoading: false });
      throw new Error(error.message);
    }

    // Fetch user profile from our users table
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    set({
      user: profile,
      session: data.session,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  // Signup with email/password
  signup: async (email: string, password: string, name: string) => {
    set({ isLoading: true });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) {
      set({ isLoading: false });
      throw new Error(error.message);
    }

    // Profile is auto-created by trigger, fetch it
    if (data.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      set({
        user: profile,
        session: data.session,
        isAuthenticated: !!data.session,
        isLoading: false,
      });
    } else {
      set({ isLoading: false });
    }
  },

  // Logout
  logout: async () => {
    set({ isLoading: true });

    const { error } = await supabase.auth.signOut();

    if (error) {
      set({ isLoading: false });
      throw new Error(error.message);
    }

    set({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  // Check existing session
  checkAuth: async () => {
    set({ isLoading: true });

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // Fetch user profile
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        set({
          user: profile,
          session,
          isAuthenticated: true,
          isLoading: false,
        });

        // Listen for auth changes
        supabase.auth.onAuthStateChange(async (event, newSession) => {
          if (event === 'SIGNED_OUT') {
            set({
              user: null,
              session: null,
              isAuthenticated: false,
            });
          } else if (newSession?.user) {
            const { data: newProfile } = await supabase
              .from('users')
              .select('*')
              .eq('id', newSession.user.id)
              .single();

            set({
              user: newProfile,
              session: newSession,
              isAuthenticated: true,
            });
          }
        });
      } else {
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      set({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));
