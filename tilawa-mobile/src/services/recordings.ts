/**
 * Recordings API Service
 *
 * All API calls related to recordings.
 */

import { apiClient } from './api';
import type { Recording } from '@/types';

export interface UploadResponse extends Recording {
  jobId: string;
  message: string;
}

export interface ListRecordingsResponse {
  recordings: Recording[];
  total: number;
  hasMore: boolean;
}

/**
 * Upload a recording for processing
 */
export const uploadRecording = async (
  userId: string,
  fileUri: string,
  fileName: string
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('userId', userId);
  formData.append('file', {
    uri: fileUri,
    type: 'audio/m4a',
    name: fileName,
  } as unknown as Blob);

  const response = await apiClient.post<UploadResponse>('/recordings', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

/**
 * Get a single recording by ID
 */
export const getRecording = async (recordingId: string): Promise<Recording> => {
  const response = await apiClient.get<Recording>(`/recordings/${recordingId}`);
  return response.data;
};

/**
 * List recordings for a user
 */
export const listRecordings = async (
  userId: string,
  options: {
    status?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<ListRecordingsResponse> => {
  const { status, limit = 20, offset = 0 } = options;

  const params = new URLSearchParams({
    userId,
    limit: limit.toString(),
    offset: offset.toString(),
  });

  if (status) {
    params.append('status', status);
  }

  const response = await apiClient.get<ListRecordingsResponse>(
    `/recordings?${params.toString()}`
  );

  return response.data;
};

/**
 * Get recording analysis
 */
export const getRecordingAnalysis = async (recordingId: string) => {
  const response = await apiClient.get(`/recordings/${recordingId}/analysis`);
  return response.data;
};
