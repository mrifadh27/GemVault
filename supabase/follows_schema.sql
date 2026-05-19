-- ─────────────────────────────────────────────────────────────────────────────
-- GemGram: follows table + supporting indexes
-- Run this once in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Create the follows table (if it doesn't already exist)
CREATE TABLE IF NOT EXISTS public.follows (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id)         -- prevent duplicate follows
);

-- 2. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_follows_follower   ON public.follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following  ON public.follows (following_id);

-- 3. Row Level Security
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Drop first so re-running this script is always safe
DROP POLICY IF EXISTS "follows_select" ON public.follows;
DROP POLICY IF EXISTS "follows_insert" ON public.follows;
DROP POLICY IF EXISTS "follows_delete" ON public.follows;

CREATE POLICY "follows_select" ON public.follows
  FOR SELECT USING (true);

CREATE POLICY "follows_insert" ON public.follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "follows_delete" ON public.follows
  FOR DELETE USING (auth.uid() = follower_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- profiles table: add follower/following count columns if missing
-- (safe to re-run — ALTER COLUMN only runs if column doesn't exist yet)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'followers_count'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN followers_count integer NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'following_count'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN following_count integer NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'total_posts'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN total_posts integer NOT NULL DEFAULT 0;
  END IF;
END $$;