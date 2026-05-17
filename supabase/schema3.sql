-- ═══════════════════════════════════════════════════════════
-- GemGram — Fixed Supabase Schema v3
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ═══════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Drop existing triggers/functions first (clean slate) ───
DROP TRIGGER IF EXISTS on_auth_user_created  ON auth.users;
DROP TRIGGER IF EXISTS on_like_change        ON post_likes;
DROP TRIGGER IF EXISTS on_post_change        ON gem_posts;
DROP TRIGGER IF EXISTS on_new_message        ON dm_messages;
DROP FUNCTION IF EXISTS handle_new_user()            CASCADE;
DROP FUNCTION IF EXISTS update_likes_count()         CASCADE;
DROP FUNCTION IF EXISTS update_post_count()          CASCADE;
DROP FUNCTION IF EXISTS update_thread_last_message() CASCADE;

-- ─── PROFILES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id               UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username         TEXT UNIQUE NOT NULL,
  full_name        TEXT,
  avatar_url       TEXT,
  bio              TEXT,
  whatsapp_number  TEXT,
  instagram_handle TEXT,
  telegram_handle  TEXT,
  location         TEXT,
  total_posts      INTEGER DEFAULT 0,
  followers_count  INTEGER DEFAULT 0,
  following_count  INTEGER DEFAULT 0,
  is_verified      BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── GEM CATEGORIES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gem_categories (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT UNIQUE NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  icon          TEXT NOT NULL,
  color         TEXT NOT NULL,
  display_order INTEGER DEFAULT 0
);

INSERT INTO gem_categories (name, slug, icon, color, display_order) VALUES
  ('All',        'all',        '💎', '#C4A25D', 0),
  ('Natural',    'natural',    '🌿', '#22C55E', 1),
  ('Ruby',       'ruby',       '🔴', '#EF4444', 2),
  ('Sapphire',   'sapphire',   '🔵', '#3B82F6', 3),
  ('Emerald',    'emerald',    '💚', '#10B981', 4),
  ('Diamond',    'diamond',    '🤍', '#E2E8F0', 5),
  ('Amethyst',   'amethyst',   '🟣', '#8B5CF6', 6),
  ('Opal',       'opal',       '🌈', '#F97316', 7),
  ('Garnet',     'garnet',     '🍷', '#DC2626', 8),
  ('Topaz',      'topaz',      '🟡', '#EAB308', 9),
  ('Aquamarine', 'aquamarine', '🩵', '#06B6D4', 10),
  ('Tourmaline', 'tourmaline', '🎨', '#A855F7', 11),
  ('Tanzanite',  'tanzanite',  '💜', '#7C3AED', 12),
  ('Spinel',     'spinel',     '🌸', '#EC4899', 13),
  ('Rough',      'rough',      '🪨', '#78716C', 14),
  ('Lab Grown',  'lab-grown',  '🔬', '#06B6D4', 15),
  ('Certified',  'certified',  '📜', '#C4A25D', 16),
  ('Jewelry',    'jewelry',    '📿', '#F59E0B', 17),
  ('Other',      'other',      '✨', '#6B7280', 18)
ON CONFLICT (slug) DO NOTHING;

-- ─── GEM POSTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gem_posts (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id            UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title                TEXT NOT NULL,
  description          TEXT,
  gemstone_type        TEXT NOT NULL,
  category_slug        TEXT NOT NULL DEFAULT 'other',
  carat_weight         NUMERIC(10, 3),
  origin_country       TEXT,
  treatment            TEXT DEFAULT 'None',
  certification        TEXT DEFAULT 'None',
  certification_number TEXT,
  price                NUMERIC(12, 2),
  currency             TEXT DEFAULT 'USD',
  is_price_negotiable  BOOLEAN DEFAULT FALSE,
  is_sold              BOOLEAN DEFAULT FALSE,
  is_active            BOOLEAN DEFAULT TRUE,
  views_count          INTEGER DEFAULT 0,
  likes_count          INTEGER DEFAULT 0,
  dm_count             INTEGER DEFAULT 0,
  tags                 TEXT[] DEFAULT '{}',
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ─── GEM IMAGES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gem_images (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id       UUID REFERENCES gem_posts(id) ON DELETE CASCADE NOT NULL,
  url           TEXT NOT NULL,
  is_primary    BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── LIKES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_likes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id    UUID REFERENCES gem_posts(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES profiles(id)  ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- ─── SAVES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_saves (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id    UUID REFERENCES gem_posts(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES profiles(id)  ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- ─── COMMENTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_comments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id    UUID REFERENCES gem_posts(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES profiles(id)  ON DELETE CASCADE NOT NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── DM THREADS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dm_threads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id         UUID REFERENCES gem_posts(id) ON DELETE SET NULL,
  buyer_id        UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  seller_id       UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  initial_message TEXT,
  status          TEXT DEFAULT 'active',
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  buyer_unread    INTEGER DEFAULT 0,
  seller_unread   INTEGER DEFAULT 1,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── DM MESSAGES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dm_messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id  UUID REFERENCES dm_threads(id) ON DELETE CASCADE NOT NULL,
  sender_id  UUID REFERENCES profiles(id)   ON DELETE CASCADE NOT NULL,
  content    TEXT NOT NULL,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── FOLLOWS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS follows (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id  UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- ═══════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_gem_posts_seller   ON gem_posts(seller_id);
CREATE INDEX IF NOT EXISTS idx_gem_posts_category ON gem_posts(category_slug);
CREATE INDEX IF NOT EXISTS idx_gem_posts_created  ON gem_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gem_posts_active   ON gem_posts(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gem_images_post    ON gem_images(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post    ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user    ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_saves_user    ON post_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_dm_threads_buyer   ON dm_threads(buyer_id);
CREATE INDEX IF NOT EXISTS idx_dm_threads_seller  ON dm_threads(seller_id);
CREATE INDEX IF NOT EXISTS idx_dm_messages_thread ON dm_messages(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_follows_follower   ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following  ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_comments_post      ON post_comments(post_id);

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Gem Posts
ALTER TABLE gem_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "posts_select_active" ON gem_posts;
DROP POLICY IF EXISTS "posts_insert_own"    ON gem_posts;
DROP POLICY IF EXISTS "posts_update_own"    ON gem_posts;
DROP POLICY IF EXISTS "posts_delete_own"    ON gem_posts;
CREATE POLICY "posts_select_active" ON gem_posts FOR SELECT USING (is_active = true);
CREATE POLICY "posts_insert_own"    ON gem_posts FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "posts_update_own"    ON gem_posts FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "posts_delete_own"    ON gem_posts FOR DELETE USING (auth.uid() = seller_id);

-- Gem Images
ALTER TABLE gem_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "images_select_all"  ON gem_images;
DROP POLICY IF EXISTS "images_insert_auth" ON gem_images;
DROP POLICY IF EXISTS "images_delete_own"  ON gem_images;
CREATE POLICY "images_select_all"  ON gem_images FOR SELECT USING (true);
CREATE POLICY "images_insert_auth" ON gem_images FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM gem_posts WHERE gem_posts.id = post_id AND gem_posts.seller_id = auth.uid())
);
CREATE POLICY "images_delete_own"  ON gem_images FOR DELETE USING (
  EXISTS (SELECT 1 FROM gem_posts WHERE gem_posts.id = post_id AND gem_posts.seller_id = auth.uid())
);

-- Likes
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "likes_select_all" ON post_likes;
DROP POLICY IF EXISTS "likes_insert_own" ON post_likes;
DROP POLICY IF EXISTS "likes_delete_own" ON post_likes;
CREATE POLICY "likes_select_all" ON post_likes FOR SELECT USING (true);
CREATE POLICY "likes_insert_own" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete_own" ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- Saves
ALTER TABLE post_saves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "saves_select_own" ON post_saves;
DROP POLICY IF EXISTS "saves_insert_own" ON post_saves;
DROP POLICY IF EXISTS "saves_delete_own" ON post_saves;
CREATE POLICY "saves_select_own" ON post_saves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "saves_insert_own" ON post_saves FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saves_delete_own" ON post_saves FOR DELETE USING (auth.uid() = user_id);

-- Comments
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comments_select_all"  ON post_comments;
DROP POLICY IF EXISTS "comments_insert_auth" ON post_comments;
DROP POLICY IF EXISTS "comments_delete_own"  ON post_comments;
CREATE POLICY "comments_select_all"  ON post_comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_auth" ON post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete_own"  ON post_comments FOR DELETE USING (auth.uid() = user_id);

-- DM Threads
ALTER TABLE dm_threads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "threads_select_participant" ON dm_threads;
DROP POLICY IF EXISTS "threads_insert_buyer"       ON dm_threads;
DROP POLICY IF EXISTS "threads_update_participant" ON dm_threads;
CREATE POLICY "threads_select_participant" ON dm_threads FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "threads_insert_buyer" ON dm_threads FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "threads_update_participant" ON dm_threads FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- DM Messages
ALTER TABLE dm_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "messages_select_participant" ON dm_messages;
DROP POLICY IF EXISTS "messages_insert_participant" ON dm_messages;
CREATE POLICY "messages_select_participant" ON dm_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM dm_threads
    WHERE dm_threads.id = thread_id
      AND (dm_threads.buyer_id = auth.uid() OR dm_threads.seller_id = auth.uid())
  )
);
CREATE POLICY "messages_insert_participant" ON dm_messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM dm_threads
    WHERE dm_threads.id = thread_id
      AND (dm_threads.buyer_id = auth.uid() OR dm_threads.seller_id = auth.uid())
  )
);

-- Follows
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "follows_select_all" ON follows;
DROP POLICY IF EXISTS "follows_insert_own" ON follows;
DROP POLICY IF EXISTS "follows_delete_own" ON follows;
CREATE POLICY "follows_select_all" ON follows FOR SELECT USING (true);
CREATE POLICY "follows_insert_own" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete_own" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- Gem Categories
ALTER TABLE gem_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories_select_all" ON gem_categories;
CREATE POLICY "categories_select_all" ON gem_categories FOR SELECT USING (true);

-- ═══════════════════════════════════════════════════════════
-- FUNCTIONS & TRIGGERS
-- ═══════════════════════════════════════════════════════════

-- ── Auto-create profile on signup ──────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username   TEXT;
  v_full_name  TEXT;
  v_avatar_url TEXT;
  v_base       TEXT;
  v_counter    INT := 0;
BEGIN
  -- Safely extract full_name (Google sends 'name', email sends nothing)
  v_full_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    SPLIT_PART(NEW.email, '@', 1)
  );

  -- Safely extract avatar
  v_avatar_url := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'avatar_url'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'picture'), '')
  );

  -- Build clean base username
  v_base := COALESCE(
    NULLIF(REGEXP_REPLACE(LOWER(TRIM(COALESCE(NEW.raw_user_meta_data->>'username', ''))), '[^a-z0-9_]', '', 'g'), ''),
    REGEXP_REPLACE(LOWER(SPLIT_PART(NEW.email, '@', 1)), '[^a-z0-9_]', '', 'g')
  );

  IF LENGTH(v_base) < 3 THEN
    v_base := 'gem_' || v_base;
  END IF;

  v_base     := LEFT(v_base, 15);
  v_username := v_base;

  -- Retry loop to guarantee a unique username
  LOOP
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username);
    v_counter  := v_counter + 1;
    v_username := v_base || '_' || FLOOR(RANDOM() * 9000 + 1000)::TEXT;
    IF v_counter > 20 THEN
      v_username := 'user_' || LOWER(SUBSTRING(NEW.id::TEXT, 1, 8));
      EXIT;
    END IF;
  END LOOP;

  INSERT INTO public.profiles (id, username, full_name, avatar_url, created_at, updated_at)
  VALUES (NEW.id, v_username, v_full_name, v_avatar_url, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block auth signup due to profile creation failure
  RAISE WARNING 'handle_new_user: could not create profile for % — %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- ── Likes count ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.gem_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.gem_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_like_change
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE PROCEDURE update_likes_count();

-- ── Post count ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_post_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET total_posts = total_posts + 1 WHERE id = NEW.seller_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET total_posts = GREATEST(0, total_posts - 1) WHERE id = OLD.seller_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_post_change
  AFTER INSERT OR DELETE ON gem_posts
  FOR EACH ROW EXECUTE PROCEDURE update_post_count();

-- ── DM last message timestamp ──────────────────────────────
CREATE OR REPLACE FUNCTION update_thread_last_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.dm_threads SET last_message_at = NEW.created_at WHERE id = NEW.thread_id;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_new_message
  AFTER INSERT ON dm_messages
  FOR EACH ROW EXECUTE PROCEDURE update_thread_last_message();

-- ═══════════════════════════════════════════════════════════
-- STORAGE BUCKETS (safe — skips if already exists)
-- ═══════════════════════════════════════════════════════════
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gem-images', 'gem-images', true, 10485760,
  ARRAY['image/jpeg','image/png','image/webp','image/heic','image/gif']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 'avatars', true, 5242880,
  ARRAY['image/jpeg','image/png','image/webp','image/heic']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "gem_images_select" ON storage.objects;
DROP POLICY IF EXISTS "gem_images_insert" ON storage.objects;
DROP POLICY IF EXISTS "gem_images_update" ON storage.objects;
DROP POLICY IF EXISTS "gem_images_delete" ON storage.objects;
DROP POLICY IF EXISTS "avatars_select"    ON storage.objects;
DROP POLICY IF EXISTS "avatars_insert"    ON storage.objects;
DROP POLICY IF EXISTS "avatars_update"    ON storage.objects;
DROP POLICY IF EXISTS "avatars_delete"    ON storage.objects;

CREATE POLICY "gem_images_select" ON storage.objects FOR SELECT  USING (bucket_id = 'gem-images');
CREATE POLICY "gem_images_insert" ON storage.objects FOR INSERT  WITH CHECK (bucket_id = 'gem-images' AND auth.role() = 'authenticated');
CREATE POLICY "gem_images_update" ON storage.objects FOR UPDATE  USING (bucket_id = 'gem-images' AND (storage.foldername(name))[1] = auth.uid()::TEXT);
CREATE POLICY "gem_images_delete" ON storage.objects FOR DELETE  USING (bucket_id = 'gem-images' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

CREATE POLICY "avatars_select"    ON storage.objects FOR SELECT  USING (bucket_id = 'avatars');
CREATE POLICY "avatars_insert"    ON storage.objects FOR INSERT  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "avatars_update"    ON storage.objects FOR UPDATE  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::TEXT);
CREATE POLICY "avatars_delete"    ON storage.objects FOR DELETE  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

-- ═══════════════════════════════════════════════════════════
-- REALTIME  — safely add tables only if not already a member
-- ═══════════════════════════════════════════════════════════
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'dm_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE dm_messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'dm_threads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE dm_threads;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'post_likes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE post_likes;
  END IF;
END;
$$;

-- ═══════════════════════════════════════════════════════════
SELECT 'GemGram schema v3 installed successfully 💎' AS status;
-- ═══════════════════════════════════════════════════════════

