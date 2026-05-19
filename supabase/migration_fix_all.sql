-- ══════════════════════════════════════════════════════════════════════════════
-- GEMGRAM — FULL FIX MIGRATION
-- Run this ONCE in Supabase SQL Editor → replaces migration_media_dm.sql
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. DM MEDIA SUPPORT ───────────────────────────────────────────────────────

ALTER TABLE dm_messages
  ADD COLUMN IF NOT EXISTS media_url  TEXT    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS media_type TEXT    DEFAULT NULL
    CHECK (media_type IN ('image', 'video'));

-- Make content optional (media-only messages are allowed)
ALTER TABLE dm_messages
  ALTER COLUMN content SET DEFAULT '';

-- dm-media storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dm-media', 'dm-media', true, 52428800,
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/heic',
        'video/mp4','video/quicktime','video/webm','video/x-msvideo']
)
ON CONFLICT (id) DO NOTHING;

-- dm-media storage policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload dm media'
  ) THEN
    CREATE POLICY "Authenticated users can upload dm media"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'dm-media');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can view dm media'
  ) THEN
    CREATE POLICY "Anyone can view dm media"
      ON storage.objects FOR SELECT TO public
      USING (bucket_id = 'dm-media');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete own dm media'
  ) THEN
    CREATE POLICY "Users can delete own dm media"
      ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'dm-media' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;
END $$;


-- ── 2. FOLLOWER COUNT RPC FUNCTIONS (SECURITY DEFINER = bypass RLS) ───────────

CREATE OR REPLACE FUNCTION increment_followers(target_id UUID, follower_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
    SET followers_count = GREATEST(0, followers_count + 1)
    WHERE id = target_id;

  UPDATE profiles
    SET following_count = GREATEST(0, following_count + 1)
    WHERE id = follower_id;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_followers(target_id UUID, follower_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
    SET followers_count = GREATEST(0, followers_count - 1)
    WHERE id = target_id;

  UPDATE profiles
    SET following_count = GREATEST(0, following_count - 1)
    WHERE id = follower_id;
END;
$$;


-- ── 3. SYNC EXISTING COUNTS (repairs any drifted counters) ────────────────────

-- Fix followers_count for all profiles
UPDATE profiles p
SET followers_count = (
  SELECT COUNT(*) FROM follows f WHERE f.following_id = p.id
);

-- Fix following_count for all profiles
UPDATE profiles p
SET following_count = (
  SELECT COUNT(*) FROM follows f WHERE f.follower_id = p.id
);

-- Fix total_posts for all profiles
UPDATE profiles p
SET total_posts = (
  SELECT COUNT(*) FROM gem_posts g
  WHERE g.seller_id = p.id AND g.is_active = true
);

-- Fix likes_count for all posts
UPDATE gem_posts g
SET likes_count = (
  SELECT COUNT(*) FROM post_likes l WHERE l.post_id = g.id
);


-- ── 4. RLS POLICIES FOR follows TABLE (ensure users can manage their follows) ──

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follows' AND policyname = 'Users can see all follows') THEN
    CREATE POLICY "Users can see all follows"
      ON follows FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follows' AND policyname = 'Users can follow others') THEN
    CREATE POLICY "Users can follow others"
      ON follows FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = follower_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follows' AND policyname = 'Users can unfollow') THEN
    CREATE POLICY "Users can unfollow"
      ON follows FOR DELETE TO authenticated
      USING (auth.uid() = follower_id);
  END IF;
END $$;


-- ── 5. RLS POLICIES FOR profiles (allow reading, users update own row) ────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Profiles are viewable by everyone') THEN
    CREATE POLICY "Profiles are viewable by everyone"
      ON profiles FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile"
      ON profiles FOR UPDATE TO authenticated
      USING (auth.uid() = id);
  END IF;
END $$;

-- ══════════════════════════════════════════════════════════════════════════════
-- END OF MIGRATION
-- ══════════════════════════════════════════════════════════════════════════════
