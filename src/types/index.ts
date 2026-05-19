// ─────────────────────────────────────────────────────────────
// GemGram — TypeScript Types
// ─────────────────────────────────────────────────────────────

export type GemstoneType =
  | 'Ruby' | 'Sapphire' | 'Emerald' | 'Diamond' | 'Amethyst'
  | 'Opal' | 'Garnet' | 'Topaz' | 'Aquamarine' | 'Tourmaline'
  | 'Tanzanite' | 'Spinel' | 'Alexandrite' | 'Morganite' | 'Peridot'
  | 'Citrine' | 'Zircon' | 'Other';

export type TreatmentType = 'None' | 'Heated' | 'Oiled' | 'Beryllium' | 'Fracture Filled' | 'Irradiated' | 'Coated';

export type CertificationBody = 'None' | 'GIA' | 'IGI' | 'AGL' | 'GRS' | 'Gübelin' | 'SSEF' | 'Lotus' | 'GIT';

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
  tags: string[];
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
  created_at: string;
  profiles: Pick<Profile, 'id' | 'username' | 'avatar_url' | 'is_verified'>;
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
