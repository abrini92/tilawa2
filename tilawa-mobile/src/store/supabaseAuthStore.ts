/**
 * Supabase Auth Store
 *
 * Zustand store using Supabase authentication.
 */

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  initialize: () => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  setSession: (session: Session | null) => void;
}

type AuthStore = AuthState & AuthActions;

export const useSupabaseAuth = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,

  // Initialize - check for existing session
  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      set({
        user: session?.user ?? null,
        session,
        isAuthenticated: !!session,
        isLoading: false,
      });

      // Listen for auth changes
      supabase.auth.onAuthStateChange((_event, session) => {
        set({
          user: session?.user ?? null,
          session,
          isAuthenticated: !!session,
        });
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ isLoading: false });
    }
  },

  // Sign up with email/password
  signUp: async (email: string, password: string, name?: string) => {
    set({ isLoading: true });
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) {
      set({ isLoading: false });
      throw error;
    }

    // Create user profile in public.users table
    if (data.user) {
      await supabase.from('users').insert({
        id: data.user.id,
        email: data.user.email!,
        name,
      });
    }

    set({
      user: data.user,
      session: data.session,
      isAuthenticated: !!data.session,
      isLoading: false,
    });
  },

  // Sign in with email/password
  signIn: async (email: string, password: string) => {
    set({ isLoading: true });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      set({ isLoading: false });
      throw error;
    }

    set({
      user: data.user,
      session: data.session,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  // Sign in with Google
  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });

    if (error) throw error;
  },

  // Sign in with Apple
  signInWithApple: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
    });

    if (error) throw error;
  },

  // Sign out
  signOut: async () => {
    set({ isLoading: true });

    const { error } = await supabase.auth.signOut();

    if (error) {
      set({ isLoading: false });
      throw error;
    }

    set({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  // Set session (for auth state changes)
  setSession: (session: Session | null) => {
    set({
      user: session?.user ?? null,
      session,
      isAuthenticated: !!session,
    });
  },
}));
