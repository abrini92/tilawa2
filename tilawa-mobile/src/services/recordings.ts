/**
 * Recordings Service (Supabase)
 *
 * All recording operations using Supabase.
 */

import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import type { Recording } from '@/types';

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
): Promise<Recording> => {
  // 1. Read file as base64
  const base64 = await (FileSystem as unknown as {
    readAsStringAsync: (uri: string, options: { encoding: string }) => Promise<string>;
  }).readAsStringAsync(fileUri, {
    encoding: 'base64',
  });

  // 2. Upload to Supabase Storage
  const filePath = `${userId}/${Date.now()}_${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('recordings')
    .upload(filePath, decode(base64), {
      contentType: 'audio/m4a',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // 3. Get public URL
  const { data: urlData } = supabase.storage
    .from('recordings')
    .getPublicUrl(filePath);

  // 4. Create database entry
  const { data: recording, error: dbError } = await supabase
    .from('recordings')
    .insert({
      user_id: userId,
      status: 'UPLOADED',
      original_url: urlData.publicUrl,
    })
    .select()
    .single();

  if (dbError) {
    throw new Error(`Database error: ${dbError.message}`);
  }

  // 5. Update status to PROCESSING (AI will pick it up)
  await supabase
    .from('recordings')
    .update({ status: 'PROCESSING' })
    .eq('id', recording.id);

  // Convert to app Recording type
  return mapToRecording(recording);
};

/**
 * Get a single recording by ID
 */
export const getRecording = async (recordingId: string): Promise<Recording> => {
  const { data, error } = await supabase
    .from('recordings')
    .select('*')
    .eq('id', recordingId)
    .single();

  if (error) {
    throw new Error(`Get recording error: ${error.message}`);
  }

  return mapToRecording(data);
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

  let query = supabase
    .from('recordings')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`List recordings error: ${error.message}`);
  }

  return {
    recordings: (data || []).map(mapToRecording),
    total: count || 0,
    hasMore: (count || 0) > offset + limit,
  };
};

/**
 * Subscribe to recording status changes (Realtime!)
 */
export const subscribeToRecording = (
  recordingId: string,
  onUpdate: (recording: Recording) => void
) => {
  const channel = supabase
    .channel(`recording:${recordingId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'recordings',
        filter: `id=eq.${recordingId}`,
      },
      (payload) => {
        onUpdate(mapToRecording(payload.new));
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Map Supabase row to app Recording type
 */
const mapToRecording = (row: Record<string, unknown>): Recording => ({
  id: row.id as string,
  userId: row.user_id as string,
  status: row.status as Recording['status'],
  originalUrl: row.original_url as string | null,
  enhancedUrl: row.enhanced_url as string | null,
  isQuran: row.is_quran as boolean | null,
  mainSurah: row.main_surah as number | null,
  ayahStart: row.ayah_start as number | null,
  ayahEnd: row.ayah_end as number | null,
  recitationAccuracy: row.recitation_accuracy as number | null,
  analysis: row.analysis as Recording['analysis'],
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
});
