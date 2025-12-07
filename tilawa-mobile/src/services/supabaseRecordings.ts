/**
 * Supabase Recordings Service
 *
 * All recording operations using Supabase.
 */

import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

export interface Recording {
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
}

/**
 * Upload a recording file and create database entry
 */
export const uploadRecording = async (
  userId: string,
  fileUri: string,
  fileName: string
): Promise<Recording> => {
  // 1. Read file as base64
  const base64 = await (FileSystem as unknown as { 
    readAsStringAsync: (uri: string, options: { encoding: string }) => Promise<string> 
  }).readAsStringAsync(fileUri, {
    encoding: 'base64',
  });

  // 2. Upload to Supabase Storage
  const filePath = `${userId}/${Date.now()}_${fileName}`;
  
  const { data: uploadData, error: uploadError } = await supabase.storage
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

  // 5. Trigger processing (call Edge Function or external API)
  // This will be done via Supabase Edge Function or webhook
  await triggerProcessing(recording.id);

  return recording;
};

/**
 * Trigger AI processing for a recording
 */
const triggerProcessing = async (recordingId: string): Promise<void> => {
  // Option 1: Call Supabase Edge Function
  // const { error } = await supabase.functions.invoke('process-recording', {
  //   body: { recordingId },
  // });

  // Option 2: Call external API (tilawa-core-ai)
  // For now, we'll update status to PROCESSING
  await supabase
    .from('recordings')
    .update({ status: 'PROCESSING' })
    .eq('id', recordingId);
};

/**
 * Get a single recording by ID
 */
export const getRecording = async (recordingId: string): Promise<Recording | null> => {
  const { data, error } = await supabase
    .from('recordings')
    .select('*')
    .eq('id', recordingId)
    .single();

  if (error) {
    console.error('Get recording error:', error);
    return null;
  }

  return data;
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
): Promise<{ recordings: Recording[]; total: number }> => {
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
    recordings: data || [],
    total: count || 0,
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
        onUpdate(payload.new as Recording);
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Delete a recording
 */
export const deleteRecording = async (recordingId: string): Promise<void> => {
  // Get recording to find file path
  const recording = await getRecording(recordingId);
  
  if (recording?.original_url) {
    // Extract file path from URL
    const url = new URL(recording.original_url);
    const filePath = url.pathname.split('/').slice(-2).join('/');
    
    // Delete from storage
    await supabase.storage.from('recordings').remove([filePath]);
  }

  if (recording?.enhanced_url) {
    const url = new URL(recording.enhanced_url);
    const filePath = url.pathname.split('/').slice(-2).join('/');
    await supabase.storage.from('recordings').remove([filePath]);
  }

  // Delete from database
  const { error } = await supabase
    .from('recordings')
    .delete()
    .eq('id', recordingId);

  if (error) {
    throw new Error(`Delete error: ${error.message}`);
  }
};
