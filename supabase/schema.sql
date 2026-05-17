-- ═══════════════════════════════════════════════════════════
-- GemGram — Complete Supabase Schema
-- Run this SQL in your Supabase SQL Editor to set up the DB
-- ═══════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── PROFILES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  whatsapp_number TEXT,
  instagram_handle TEXT,
  telegram_handle TEXT,
  location TEXT,
  total_posts INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── GEM CATEGORIES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gem_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  display_order INTEGER DEFAULT 0
);

INSERT INTO gem_categories (name, slug, icon, color, display_order) VALUES
  ('All', 'all', '💎', '#C4A25D', 0),
  ('Natural', 'natural', '🌿', '#22C55E', 1),
  ('Ruby', 'ruby', '🔴', '#EF4444', 2),
  ('Sapphire', 'sapphire', '🔵', '#3B82F6', 3),
  ('Emerald', 'emerald', '💚', '#10B981', 4),
  ('Diamond', 'diamond', '🤍', '#E2E8F0', 5),
  ('Amethyst', 'amethyst', '🟣', '#8B5CF6', 6),
  ('Opal', 'opal', '🌈', '#F97316', 7),
  ('Garnet', 'garnet', '🍷', '#DC2626', 8),
  ('Topaz', 'topaz', '🟡', '#EAB308', 9),
  ('Aquamarine', 'aquamarine', '🩵', '#06B6D4', 10),
  ('Tourmaline', 'tourmaline', '🎨', '#A855F7', 11),
  ('Tanzanite', 'tanzanite', '💜', '#7C3AED', 12),
  ('Spinel', 'spinel', '🌸', '#EC4899', 13),
  ('Rough', 'rough', '🪨', '#78716C', 14),
  ('Lab Grown', 'lab-grown', '🔬', '#06B6D4', 15),
  ('Certified', 'certified', '📜', '#C4A25D', 16),
  ('Jewelry', 'jewelry', '📿', '#F59E0B', 17),
  ('Other', 'other', '✨', '#6B7280', 18)
ON CONFLICT (slug) DO NOTHING;

-- ─── GEM POSTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gem_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  gemstone_type TEXT NOT NULL,
  category_slug TEXT NOT NULL DEFAULT 'other',
  carat_weight NUMERIC(10, 3),
  origin_country TEXT,
  treatment TEXT DEFAULT 'None',
  certification TEXT DEFAULT 'None',
  certification_number TEXT,
  price NUMERIC(12, 2),
  currency TEXT DEFAULT 'USD',
  is_price_negotiable BOOLEAN DEFAULT FALSE,
  is_sold BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  dm_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── GEM IMAGES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gem_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES gem_posts(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── LIKES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES gem_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- ─── SAVES / BOOKMARKS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_saves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES gem_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- ─── COMMENTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES gem_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── DM THREADS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dm_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES gem_posts(id) ON DELETE SET NULL,
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  initial_message TEXT,
  status TEXT DEFAULT 'active',
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  buyer_unread INTEGER DEFAULT 0,
  seller_unread INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, buyer_id, seller_id)
);

-- ─── DM MESSAGES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dm_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID REFERENCES dm_threads(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── FOLLOWS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- ═══════════════════════════════════════════════════════════
-- INDEXES for performance
-- ═══════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_gem_posts_seller ON gem_posts(seller_id);
CREATE INDEX IF NOT EXISTS idx_gem_posts_category ON gem_posts(category_slug);
CREATE INDEX IF NOT EXISTS idx_gem_posts_created ON gem_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gem_posts_active ON gem_posts(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gem_images_post ON gem_images(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_saves_user ON post_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_dm_threads_buyer ON dm_threads(buyer_id);
CREATE INDEX IF NOT EXISTS idx_dm_threads_seller ON dm_threads(seller_id);
CREATE INDEX IF NOT EXISTS idx_dm_messages_thread ON dm_messages(thread_id, created_at);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);

-- ═══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Gem Posts
ALTER TABLE gem_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active posts are viewable by everyone" ON gem_posts FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Sellers can manage own posts" ON gem_posts FOR ALL USING (auth.uid() = seller_id);

-- Gem Images
ALTER TABLE gem_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Images are viewable by everyone" ON gem_images FOR SELECT USING (TRUE);
CREATE POLICY "Sellers can manage own images" ON gem_images FOR ALL USING (
  EXISTS (SELECT 1 FROM gem_posts WHERE gem_posts.id = post_id AND gem_posts.seller_id = auth.uid())
);

-- Likes
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes are viewable by everyone" ON post_likes FOR SELECT USING (TRUE);
CREATE POLICY "Users can manage own likes" ON post_likes FOR ALL USING (auth.uid() = user_id);

-- Saves
ALTER TABLE post_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own saves" ON post_saves FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own saves" ON post_saves FOR ALL USING (auth.uid() = user_id);

-- Comments
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments are viewable by everyone" ON post_comments FOR SELECT USING (TRUE);
CREATE POLICY "Authenticated users can comment" ON post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON post_comments FOR DELETE USING (auth.uid() = user_id);

-- DM Threads
ALTER TABLE dm_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own threads" ON dm_threads FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Buyers can create threads" ON dm_threads FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Participants can update threads" ON dm_threads FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- DM Messages
ALTER TABLE dm_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Thread participants can view messages" ON dm_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM dm_threads WHERE dm_threads.id = thread_id AND (dm_threads.buyer_id = auth.uid() OR dm_threads.seller_id = auth.uid()))
);
CREATE POLICY "Thread participants can send messages" ON dm_messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (SELECT 1 FROM dm_threads WHERE dm_threads.id = thread_id AND (dm_threads.buyer_id = auth.uid() OR dm_threads.seller_id = auth.uid()))
);

-- Follows
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Follows are viewable by everyone" ON follows FOR SELECT USING (TRUE);
CREATE POLICY "Users can manage own follows" ON follows FOR ALL USING (auth.uid() = follower_id);

-- Gem Categories
ALTER TABLE gem_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are viewable by everyone" ON gem_categories FOR SELECT USING (TRUE);

-- ═══════════════════════════════════════════════════════════
-- FUNCTIONS & TRIGGERS
-- ═══════════════════════════════════════════════════════════

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      'user_' || SUBSTRING(NEW.id::TEXT, 1, 8)
    ),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Update post likes count
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE gem_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE gem_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_like_change ON post_likes;
CREATE TRIGGER on_like_change
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE PROCEDURE update_likes_count();

-- Update total posts count on profile
CREATE OR REPLACE FUNCTION update_post_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET total_posts = total_posts + 1 WHERE id = NEW.seller_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET total_posts = GREATEST(0, total_posts - 1) WHERE id = OLD.seller_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_post_change ON gem_posts;
CREATE TRIGGER on_post_change
  AFTER INSERT OR DELETE ON gem_posts
  FOR EACH ROW EXECUTE PROCEDURE update_post_count();

-- Update DM thread last_message_at
CREATE OR REPLACE FUNCTION update_thread_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE dm_threads 
  SET last_message_at = NEW.created_at
  WHERE id = NEW.thread_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_message ON dm_messages;
CREATE TRIGGER on_new_message
  AFTER INSERT ON dm_messages
  FOR EACH ROW EXECUTE PROCEDURE update_thread_last_message();

-- ═══════════════════════════════════════════════════════════
-- STORAGE BUCKETS
-- (Run these in Supabase Dashboard → Storage)
-- ═══════════════════════════════════════════════════════════
-- INSERT INTO storage.buckets (id, name, public) VALUES ('gem-images', 'gem-images', TRUE);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', TRUE);
--
-- Storage Policies:
-- CREATE POLICY "Public gem images" ON storage.objects FOR SELECT USING (bucket_id = 'gem-images');
-- CREATE POLICY "Authenticated users can upload gem images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'gem-images' AND auth.role() = 'authenticated');
-- CREATE POLICY "Users can update own images" ON storage.objects FOR UPDATE USING (bucket_id = 'gem-images' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Public avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
-- CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Enable realtime for DM messages
ALTER PUBLICATION supabase_realtime ADD TABLE dm_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE dm_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE post_likes;
