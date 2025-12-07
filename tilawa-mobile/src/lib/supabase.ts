/**
 * Supabase Client Configuration
 *
 * Single source of truth for Supabase connection.
 */

import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Supabase configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

// Custom storage adapter for React Native using SecureStore
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

// Create Supabase client with React Native storage
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types (will be generated from Supabase)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
        };
      };
      recordings: {
        Row: {
          id: string;
          user_id: string;
          status: 'UPLOADED' | 'PROCESSING' | 'DONE' | 'ERROR';
          original_url: string | null;
          enhanced_url: string | null;
          is_quran: boolean | null;
          main_surah: number | null;
          ayah_start: number | null;
          ayah_end: number | null;
          recitation_accuracy: number | null;
          analysis: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: 'UPLOADED' | 'PROCESSING' | 'DONE' | 'ERROR';
          original_url?: string | null;
          enhanced_url?: string | null;
        };
        Update: {
          status?: 'UPLOADED' | 'PROCESSING' | 'DONE' | 'ERROR';
          original_url?: string | null;
          enhanced_url?: string | null;
          is_quran?: boolean | null;
          main_surah?: number | null;
          ayah_start?: number | null;
          ayah_end?: number | null;
          recitation_accuracy?: number | null;
          analysis?: Record<string, unknown> | null;
        };
      };
    };
  };
}
