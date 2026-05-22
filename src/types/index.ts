// ─────────────────────────────────────────────────────────────
// GemGram — TypeScript Types (All Features)
// ─────────────────────────────────────────────────────────────

export type GemstoneType =
  | 'Ruby' | 'Sapphire' | 'Emerald' | 'Diamond' | 'Amethyst'
  | 'Opal' | 'Garnet' | 'Topaz' | 'Aquamarine' | 'Tourmaline'
  | 'Tanzanite' | 'Spinel' | 'Alexandrite' | 'Morganite' | 'Peridot'
  | 'Citrine' | 'Zircon' | 'Other';

export type TreatmentType = 'None' | 'Heated' | 'Oiled' | 'Beryllium' | 'Fracture Filled' | 'Irradiated' | 'Coated';
export type CertificationBody = 'None' | 'GIA' | 'IGI' | 'AGL' | 'GRS' | 'Gübelin' | 'SSEF' | 'Lotus' | 'GIT';
export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'countered' | 'expired';
export type SellerLevel = 'new' | 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  whatsapp_number: string | null;
  instagram_handle: string | null;
  telegram_handle: string | null;
  location: string | null;
  total_posts: number;
  followers_count: number;
  following_count: number;
  is_verified: boolean;
  avg_rating: number | null;
  review_count: number;
  seller_level: SellerLevel;
  created_at: string;
  updated_at: string;
}

export interface GemCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  display_order: number;
}

export interface GemImage {
  id: string;
  post_id: string;
  url: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

export interface GemPost {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  gemstone_type: GemstoneType;
  category_slug: string;
  carat_weight: number | null;
  origin_country: string | null;
  treatment: TreatmentType;
  certification: CertificationBody;
  certification_number: string | null;
  price: number | null;
  currency: string;
  is_price_negotiable: boolean;
  is_sold: boolean;
  is_active: boolean;
  views_count: number;
  likes_count: number;
  dm_count: number;
  comments_count: number;
  offers_count: number;
  tags: string[];
  color_hue: string | null;
  color_tone: number | null;
  color_saturation: number | null;
  video_url: string | null;
  is_lot: boolean;
  lot_stone_count: number | null;
  is_collection_item: boolean;
  created_at: string;
  updated_at: string;
}

export interface GemPostWithDetails extends GemPost {
  gem_images: GemImage[];
  profiles: Profile;
  is_liked?: boolean;
  is_saved?: boolean;
}

export interface DmThread {
  id: string;
  post_id: string | null;
  buyer_id: string;
  seller_id: string;
  initial_message: string | null;
  status: string;
  last_message_at: string;
  buyer_unread: number;
  seller_unread: number;
  created_at: string;
  gem_posts?: GemPost & { gem_images: GemImage[] };
  buyer?: Profile;
  seller?: Profile;
  last_message?: DmMessage;
}

export interface DmMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  media_url: string | null;
  media_type: 'image' | 'video' | null;
  is_read: boolean;
  created_at: string;
  profiles?: Pick<Profile, 'id' | 'username' | 'avatar_url'>;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  likes_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  profiles: Pick<Profile, 'id' | 'username' | 'avatar_url' | 'is_verified'>;
  is_liked?: boolean;
  replies?: PostComment[];
}

export interface GemOffer {
  id: string;
  post_id: string;
  thread_id: string | null;
  buyer_id: string;
  seller_id: string;
  offer_price: number;
  currency: string;
  message: string | null;
  status: OfferStatus;
  counter_price: number | null;
  counter_message: string | null;
  expires_at: string;
  responded_at: string | null;
  created_at: string;
  buyer?: Pick<Profile, 'id' | 'username' | 'avatar_url'>;
  seller?: Pick<Profile, 'id' | 'username' | 'avatar_url'>;
  gem_posts?: Pick<GemPost, 'id' | 'title' | 'price' | 'currency'>;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  filters: PostFilters;
  notify_email: boolean;
  notify_push: boolean;
  last_notified_at: string | null;
  created_at: string;
}

export interface SellerReview {
  id: string;
  reviewer_id: string;
  seller_id: string;
  post_id: string | null;
  rating: number;
  description_accuracy: number | null;
  photo_accuracy: number | null;
  communication: number | null;
  review_text: string | null;
  is_verified_purchase: boolean;
  created_at: string;
  reviewer?: Pick<Profile, 'id' | 'username' | 'avatar_url' | 'is_verified'>;
}

export interface GemStory {
  id: string;
  user_id: string;
  post_id: string | null;
  image_url: string;
  caption: string | null;
  views_count: number;
  expires_at: string;
  created_at: string;
  profiles?: Pick<Profile, 'id' | 'username' | 'avatar_url' | 'is_verified'>;
  is_viewed?: boolean;
}

export interface GemCollection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  cover_image_url: string | null;
  item_count: number;
  created_at: string;
  updated_at: string;
}

export interface CollectionItem {
  id: string;
  collection_id: string;
  post_id: string | null;
  title: string;
  gemstone_type: string;
  carat_weight: number | null;
  origin_country: string | null;
  treatment: string;
  certification: string;
  certification_number: string | null;
  purchase_price: number | null;
  purchase_currency: string;
  current_value: number | null;
  notes: string | null;
  image_url: string | null;
  acquired_at: string | null;
  created_at: string;
}

export interface GemGroup {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_image_url: string | null;
  icon: string;
  category: string;
  is_private: boolean;
  member_count: number;
  post_count: number;
  created_by: string | null;
  created_at: string;
  is_member?: boolean;
  member_role?: string | null;
}

export interface CreatePostInput {
  title: string;
  description?: string;
  gemstone_type: GemstoneType;
  category_slug: string;
  carat_weight?: number;
  origin_country?: string;
  treatment: TreatmentType;
  certification: CertificationBody;
  certification_number?: string;
  price?: number;
  currency?: string;
  is_price_negotiable?: boolean;
  tags?: string[];
  images: File[];
  color_hue?: string;
  color_tone?: number;
  color_saturation?: number;
  video_url?: string;
  is_lot?: boolean;
  lot_stone_count?: number;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PostFilters {
  category?: string;
  gemstone_type?: string;
  min_price?: number;
  max_price?: number;
  min_carat?: number;
  max_carat?: number;
  origin_country?: string;
  treatment?: string;
  certification?: string;
  color_hue?: string;
  has_video?: boolean;
  is_lot?: boolean;
  seller_id?: string;
  search?: string;
  sort?: 'newest' | 'popular' | 'price_asc' | 'price_desc';
  page?: number;
  limit?: number;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface SellerAnalytics {
  total_views: number;
  total_likes: number;
  total_dms: number;
  total_offers: number;
  active_listings: number;
  sold_listings: number;
  saved_count: number;
  views_by_day: { date: string; views: number }[];
  top_posts: { id: string; title: string; views: number; likes: number }[];
  engagement_rate: number;
}

export interface MarketTrend {
  gemstone_type: string;
  avg_price_per_carat: number;
  listing_count: number;
  date: string;
}
