-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRATION: Add media support to DM messages + create dm-media storage bucket
-- Run this in your Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add media columns to dm_messages
ALTER TABLE dm_messages
  ADD COLUMN IF NOT EXISTS media_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT NULL
    CHECK (media_type IN ('image', 'video'));

-- 2. Make content optional (media-only messages have no text)
ALTER TABLE dm_messages
  ALTER COLUMN content SET DEFAULT '';

-- 3. Create the dm-media storage bucket (public read, auth write)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dm-media',
  'dm-media',
  true,
  52428800,  -- 50 MB
  ARRAY[
    'image/jpeg','image/png','image/webp','image/gif','image/heic',
    'video/mp4','video/quicktime','video/webm','video/x-msvideo'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage RLS policies for dm-media bucket
CREATE POLICY "Authenticated users can upload dm media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'dm-media');

CREATE POLICY "Anyone can view dm media"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'dm-media');

CREATE POLICY "Users can delete own dm media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'dm-media' AND auth.uid()::text = (storage.foldername(name))[1]);
