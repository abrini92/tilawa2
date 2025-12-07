/**
 * Tilawa Configuration Constants
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  TIMEOUT: 30000,
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'tilawa_auth_token',
  REFRESH_TOKEN: 'tilawa_refresh_token',
  USER_DATA: 'tilawa_user_data',
  ONBOARDING_COMPLETE: 'tilawa_onboarding_complete',
} as const;

// Audio Configuration
export const AUDIO_CONFIG = {
  SAMPLE_RATE: 44100,
  CHANNELS: 1,
  BIT_DEPTH: 16,
  MAX_DURATION_SECONDS: 600, // 10 minutes
  FILE_EXTENSION: 'wav',
} as const;

// Animation Configuration
export const ANIMATION_CONFIG = {
  HAPTIC_ENABLED: true,
  REDUCED_MOTION: false,
} as const;
