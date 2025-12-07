/**
 * Tilawa Type Definitions
 */

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// Auth types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  name: string;
}

// Recording types
export interface Recording {
  id: string;
  userId: string;
  status: RecordingStatus;
  originalUrl: string | null;
  enhancedUrl: string | null;
  isQuran: boolean | null;
  mainSurah: number | null;
  ayahStart: number | null;
  ayahEnd: number | null;
  recitationAccuracy: number | null;
  analysis: RecordingAnalysis | null;
  createdAt: string;
  updatedAt: string;
}

export type RecordingStatus =
  | 'UPLOADED'
  | 'PROCESSING'
  | 'DONE'
  | 'ERROR';

export interface RecordingAnalysis {
  align?: {
    verses: Array<{
      surah: number;
      ayah: number;
      confidence: number;
    }>;
    integrity_score: number;
    flags: string[];
  };
  isQuran?: {
    is_quran: boolean;
    quran_confidence: number;
    label: string;
  };
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type MainTabParamList = {
  Studio: undefined;
  Library: undefined;
  Profile: undefined;
};

export type StudioStackParamList = {
  StudioHome: undefined;
  Recording: undefined;
  Processing: { recordingId: string };
  Result: { recordingId: string };
};

export type LibraryStackParamList = {
  LibraryHome: undefined;
  RecordingDetail: { recordingId: string };
};
