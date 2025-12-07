-- Supabase Storage Configuration
-- Run this in Supabase SQL Editor AFTER creating the bucket in Dashboard

-- Create storage bucket for recordings (do this in Dashboard first)
-- Go to Storage > New Bucket > Name: "recordings" > Public: true

-- Storage policies for recordings bucket
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own recordings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to read their own recordings
CREATE POLICY "Users can read own recordings"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own recordings
CREATE POLICY "Users can delete own recordings"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'recordings' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access (for sharing)
-- Comment this out if you want recordings to be private
CREATE POLICY "Public read access for recordings"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'recordings');
