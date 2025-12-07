/**
 * Tilawa API Client
 *
 * Axios instance with interceptors for JWT injection and error handling.
 */

import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG, STORAGE_KEYS } from '@/constants/config';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - inject JWT token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error reading auth token:', error);
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear stored token on 401
      try {
        await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
      } catch (e) {
        console.error('Error clearing auth data:', e);
      }
      // The auth store will handle navigation to login
    }
    return Promise.reject(error);
  }
);

export { apiClient };

// API endpoints
export const api = {
  // Auth
  auth: {
    login: (email: string, password: string) =>
      apiClient.post('/auth/login', { email, password }),
    signup: (email: string, password: string, name: string) =>
      apiClient.post('/users', { email, password, name }),
    me: () => apiClient.get('/auth/me'),
  },

  // Users
  users: {
    create: (data: { email: string; name: string }) =>
      apiClient.post('/users', data),
    get: (id: string) => apiClient.get(`/users/${id}`),
  },

  // Recordings
  recordings: {
    upload: (formData: FormData) =>
      apiClient.post('/recordings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    get: (id: string) => apiClient.get(`/recordings/${id}`),
    getAnalysis: (id: string) => apiClient.get(`/recordings/${id}/analysis`),
    list: (userId: string) => apiClient.get(`/recordings?userId=${userId}`),
  },

  // Calibration
  calibration: {
    create: (formData: FormData) =>
      apiClient.post('/calibration', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
  },
};
