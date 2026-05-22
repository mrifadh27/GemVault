-- ═══════════════════════════════════════════════════════════
-- GemGram — All New Features Migration
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- ─── EXTEND gem_posts for color grading, video & lot support ────
ALTER TABLE gem_posts ADD COLUMN IF NOT EXISTS color_hue TEXT;
ALTER TABLE gem_posts ADD COLUMN IF NOT EXISTS color_tone INTEGER CHECK (color_tone BETWEEN 1 AND 9);
ALTER TABLE gem_posts ADD COLUMN IF NOT EXISTS color_saturation INTEGER CHECK (color_saturation BETWEEN 1 AND 6);
ALTER TABLE gem_posts ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE gem_posts ADD COLUMN IF NOT EXISTS is_lot BOOLEAN DEFAULT FALSE;
ALTER TABLE gem_posts ADD COLUMN IF NOT EXISTS lot_stone_count INTEGER;
ALTER TABLE gem_posts ADD COLUMN IF NOT EXISTS is_collection_item BOOLEAN DEFAULT FALSE;
ALTER TABLE gem_posts ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;
ALTER TABLE gem_posts ADD COLUMN IF NOT EXISTS offers_count INTEGER DEFAULT 0;

-- ─── POST COMMENTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES gem_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  parent_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON post_comments(parent_id);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read comments" ON post_comments FOR SELECT USING (TRUE);
CREATE POLICY "Authenticated users can comment" ON post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON post_comments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON post_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can read comment likes" ON comment_likes FOR SELECT USING (TRUE);
CREATE POLICY "Authenticated users can like comments" ON comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON comment_likes FOR DELETE USING (auth.uid() = user_id);

-- ─── GEM OFFERS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gem_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES gem_posts(id) ON DELETE CASCADE NOT NULL,
  thread_id UUID REFERENCES dm_threads(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  offer_price NUMERIC(12, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','countered','expired')),
  counter_price NUMERIC(12, 2),
  counter_message TEXT,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '48 hours'),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offers_post_id ON gem_offers(post_id);
CREATE INDEX IF NOT EXISTS idx_offers_buyer_id ON gem_offers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_offers_seller_id ON gem_offers(seller_id);

ALTER TABLE gem_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Offer parties can view" ON gem_offers FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Buyers can create offers" ON gem_offers FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Seller can respond to offers" ON gem_offers FOR UPDATE USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

-- ─── SAVED SEARCHES / WATCHLIST ──────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  notify_email BOOLEAN DEFAULT FALSE,
  notify_push BOOLEAN DEFAULT TRUE,
  last_notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own saved searches" ON saved_searches USING (auth.uid() = user_id);

-- ─── SELLER REVIEWS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS seller_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES gem_posts(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  description_accuracy INTEGER CHECK (description_accuracy BETWEEN 1 AND 5),
  photo_accuracy INTEGER CHECK (photo_accuracy BETWEEN 1 AND 5),
  communication INTEGER CHECK (communication BETWEEN 1 AND 5),
  review_text TEXT CHECK (char_length(review_text) <= 1000),
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reviewer_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_seller_id ON seller_reviews(seller_id);
ALTER TABLE seller_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read reviews" ON seller_reviews FOR SELECT USING (TRUE);
CREATE POLICY "Authenticated users can review" ON seller_reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Reviewers can update own reviews" ON seller_reviews FOR UPDATE USING (auth.uid() = reviewer_id);

-- Add avg_rating to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS seller_level TEXT DEFAULT 'new' CHECK (seller_level IN ('new','bronze','silver','gold','platinum'));

-- ─── GEM STORIES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gem_stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES gem_posts(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT CHECK (char_length(caption) <= 200),
  views_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS story_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID REFERENCES gem_stories(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_stories_user_id ON gem_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires ON gem_stories(expires_at);

ALTER TABLE gem_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can see stories" ON gem_stories FOR SELECT USING (expires_at > NOW());
CREATE POLICY "Authenticated users can create stories" ON gem_stories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own stories" ON gem_stories FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update own stories" ON gem_stories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can read story views" ON story_views FOR SELECT USING (TRUE);
CREATE POLICY "Authenticated can add views" ON story_views FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ─── PERSONAL COLLECTIONS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gem_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Collection',
  description TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  cover_image_url TEXT,
  item_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collection_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID REFERENCES gem_collections(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES gem_posts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  gemstone_type TEXT NOT NULL,
  carat_weight NUMERIC(10,3),
  origin_country TEXT,
  treatment TEXT DEFAULT 'None',
  certification TEXT DEFAULT 'None',
  certification_number TEXT,
  purchase_price NUMERIC(12,2),
  purchase_currency TEXT DEFAULT 'USD',
  current_value NUMERIC(12,2),
  notes TEXT,
  image_url TEXT,
  acquired_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collections_user ON gem_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_coll ON collection_items(collection_id);

ALTER TABLE gem_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public collections visible to all" ON gem_collections FOR SELECT USING (is_public = TRUE OR auth.uid() = user_id);
CREATE POLICY "Users manage own collections" ON gem_collections USING (auth.uid() = user_id);
CREATE POLICY "Collection items visible with collection" ON collection_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM gem_collections gc WHERE gc.id = collection_id AND (gc.is_public OR gc.user_id = auth.uid()))
);
CREATE POLICY "Users manage own collection items" ON collection_items USING (
  EXISTS (SELECT 1 FROM gem_collections gc WHERE gc.id = collection_id AND gc.user_id = auth.uid())
);

-- ─── GEM GROUPS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gem_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  icon TEXT DEFAULT '💎',
  category TEXT DEFAULT 'general',
  is_private BOOLEAN DEFAULT FALSE,
  member_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES gem_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin','moderator','member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS group_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES gem_groups(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES gem_posts(id) ON DELETE CASCADE NOT NULL,
  posted_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, post_id)
);

INSERT INTO gem_groups (name, slug, description, icon, category, created_by) VALUES
  ('Mogok Ruby Society', 'mogok-ruby', 'For lovers of Burmese rubies from the legendary Mogok valley', '🔴', 'ruby', NULL),
  ('Ceylon Sapphire Collectors', 'ceylon-sapphire', 'Dedicated to the finest Sri Lankan sapphires', '🔵', 'sapphire', NULL),
  ('Alexandrite Enthusiasts', 'alexandrite', 'The rarest color-change phenomenon in the gem world', '🪄', 'alexandrite', NULL),
  ('Colombian Emerald Club', 'colombian-emerald', 'Fine Colombian emeralds and muzo treasures', '💚', 'emerald', NULL),
  ('Lab-Grown Debate', 'lab-grown', 'Discussing lab-grown vs natural gems openly', '🔬', 'lab', NULL),
  ('Opal Lovers', 'opal-lovers', 'All things opal — Lightning Ridge, Welo, Crystal', '🌈', 'opal', NULL)
ON CONFLICT (slug) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id);

ALTER TABLE gem_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public groups visible to all" ON gem_groups FOR SELECT USING (is_private = FALSE OR EXISTS (SELECT 1 FROM group_members WHERE group_id = id AND user_id = auth.uid()));
CREATE POLICY "Authenticated can create groups" ON gem_groups FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can update groups" ON gem_groups FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "Anyone can see group members" ON group_members FOR SELECT USING (TRUE);
CREATE POLICY "Users can join groups" ON group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON group_members FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can see group posts" ON group_posts FOR SELECT USING (TRUE);
CREATE POLICY "Members can post to groups" ON group_posts FOR INSERT WITH CHECK (
  auth.uid() = posted_by AND EXISTS (SELECT 1 FROM group_members WHERE group_id = group_posts.group_id AND user_id = auth.uid())
);

-- ─── FUNCTIONS & TRIGGERS ──────────────────────────────────────────

-- Auto-update comments_count
CREATE OR REPLACE FUNCTION update_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE gem_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE gem_posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_comments_count ON post_comments;
CREATE TRIGGER trg_comments_count
AFTER INSERT OR DELETE ON post_comments
FOR EACH ROW EXECUTE FUNCTION update_comments_count();

-- Auto-update group member_count
CREATE OR REPLACE FUNCTION update_group_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE gem_groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE gem_groups SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_group_member_count ON group_members;
CREATE TRIGGER trg_group_member_count
AFTER INSERT OR DELETE ON group_members
FOR EACH ROW EXECUTE FUNCTION update_group_member_count();

-- Auto-update seller avg_rating
CREATE OR REPLACE FUNCTION update_seller_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET
    avg_rating = (SELECT AVG(rating)::NUMERIC(3,2) FROM seller_reviews WHERE seller_id = COALESCE(NEW.seller_id, OLD.seller_id)),
    review_count = (SELECT COUNT(*) FROM seller_reviews WHERE seller_id = COALESCE(NEW.seller_id, OLD.seller_id))
  WHERE id = COALESCE(NEW.seller_id, OLD.seller_id);
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_seller_rating ON seller_reviews;
CREATE TRIGGER trg_seller_rating
AFTER INSERT OR UPDATE OR DELETE ON seller_reviews
FOR EACH ROW EXECUTE FUNCTION update_seller_rating();

-- Auto-update collection item_count
CREATE OR REPLACE FUNCTION update_collection_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE gem_collections SET item_count = item_count + 1 WHERE id = NEW.collection_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE gem_collections SET item_count = GREATEST(0, item_count - 1) WHERE id = OLD.collection_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_collection_count ON collection_items;
CREATE TRIGGER trg_collection_count
AFTER INSERT OR DELETE ON collection_items
FOR EACH ROW EXECUTE FUNCTION update_collection_count();
