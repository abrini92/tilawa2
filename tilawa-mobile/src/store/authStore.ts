/**
 * Tilawa Auth Store
 *
 * Zustand store for authentication state management with JWT.
 */

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '@/constants/config';
import { apiClient } from '@/services/api';
import type { User, AuthState } from '@/types';

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshToken: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

type AuthStore = AuthState & AuthActions & { refreshTokenValue: string | null };

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  token: null,
  refreshTokenValue: null,
  isAuthenticated: false,
  isLoading: true,

  // Actions
  setLoading: (loading: boolean) => set({ isLoading: loading }),

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', {
        email,
        password,
      });

      const { user, accessToken, refreshToken } = response.data;

      // Store credentials securely
      await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, accessToken);
      await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

      // Update axios default header
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      set({
        user,
        token: accessToken,
        refreshTokenValue: refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: unknown) {
      set({ isLoading: false });
      throw error;
    }
  },

  signup: async (email: string, password: string, name: string) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.post<AuthResponse>('/auth/signup', {
        email,
        password,
        name,
      });

      const { user, accessToken, refreshToken } = response.data;

      await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, accessToken);
      await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

      apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      set({
        user,
        token: accessToken,
        refreshTokenValue: refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);

      delete apiClient.defaults.headers.common['Authorization'];

      set({
        user: null,
        token: null,
        refreshTokenValue: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  refreshToken: async () => {
    const { refreshTokenValue } = get();
    if (!refreshTokenValue) {
      throw new Error('No refresh token');
    }

    try {
      const response = await apiClient.post<AuthResponse>('/auth/refresh', {
        refreshToken: refreshTokenValue,
      });

      const { user, accessToken, refreshToken } = response.data;

      await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, accessToken);
      await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);

      apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      set({
        user,
        token: accessToken,
        refreshTokenValue: refreshToken,
      });
    } catch (error) {
      // Refresh failed - logout
      await get().logout();
      throw error;
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      const userData = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);

      if (token && userData) {
        const user = JSON.parse(userData) as User;

        // Set auth header
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        set({
          user,
          token,
          refreshTokenValue: refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          token: null,
          refreshTokenValue: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      set({
        user: null,
        token: null,
        refreshTokenValue: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));
