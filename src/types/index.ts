// ============================================================
// GemVault — TypeScript Types & Interfaces
// ============================================================

export type UserRole = 'buyer' | 'seller' | 'admin';
export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type OrderStatus = 'pending_payment' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type OrderItemStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type ChangeType = 'restock' | 'sale' | 'adjustment' | 'return';
export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed';
export type NotificationType = 'order_update' | 'new_sale' | 'low_stock' | 'payout' | 'review' | 'system';
export type BusinessType = 'individual' | 'company';

export type GemstoneType =
  | 'Ruby' | 'Sapphire' | 'Emerald' | 'Amethyst' | 'Opal'
  | 'Diamond' | 'Topaz' | 'Aquamarine' | 'Garnet' | 'Tourmaline'
  | 'Tanzanite' | 'Spinel' | 'Other';

export type CutType =
  | 'Round' | 'Oval' | 'Pear' | 'Cushion' | 'Marquise'
  | 'Princess' | 'Emerald' | 'Radiant' | 'Asscher' | 'Heart';

export type ClarityGrade =
  | 'FL' | 'IF' | 'VVS1' | 'VVS2' | 'VS1' | 'VS2'
  | 'SI1' | 'SI2' | 'I1' | 'I2' | 'I3';

export type TreatmentType = 'None' | 'Heated' | 'Oiled' | 'Filled' | 'Irradiated';

export type CertificationBody = 'GIA' | 'IGI' | 'AGL' | 'GRS' | 'Gübelin' | 'None';

// ============================================================
// DATABASE MODELS
// ============================================================

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  user_id: string;
  label: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
}

export interface SellerProfile {
  id: string;
  store_name: string;
  store_description: string | null;
  store_logo_url: string | null;
  store_banner_url: string | null;
  business_type: BusinessType | null;
  tax_id: string | null;
  verification_status: VerificationStatus;
  verification_docs: Record<string, unknown> | null;
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean;
  platform_fee_rate: number;
  total_sales: number;
  total_orders: number;
  rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  color_hex: string | null;
  description: string | null;
  parent_id: string | null;
  display_order: number;
}

export interface Product {
  id: string;
  seller_id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  gemstone_type: GemstoneType;
  cut: CutType | null;
  clarity: ClarityGrade | null;
  color_grade: string | null;
  carat_weight: number;
  origin_country: string | null;
  treatment: TreatmentType;
  certification_body: CertificationBody;
  certification_number: string | null;
  certificate_url: string | null;
  dimensions_mm: string | null;
  price: number;
  compare_price: number | null;
  cost_price: number | null;
  currency: string;
  stock_quantity: number;
  low_stock_threshold: number;
  weight_grams: number | null;
  is_active: boolean;
  is_featured: boolean;
  is_certified: boolean;
  views_count: number;
  sales_count: number;
  rating: number;
  review_count: number;
  tags: string[] | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  display_order: number;
  is_primary: boolean;
}

export interface ProductWithImages extends Product {
  product_images: ProductImage[];
  seller?: SellerProfile & { profiles?: Profile };
  categories?: Category;
}

export interface InventoryLog {
  id: string;
  product_id: string;
  seller_id: string;
  change_type: ChangeType;
  quantity_before: number;
  quantity_change: number;
  quantity_after: number;
  reference_id: string | null;
  note: string | null;
  created_at: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  products?: ProductWithImages;
}

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  products?: ProductWithImages;
}

export interface ShippingAddress {
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface Order {
  id: string;
  buyer_id: string;
  status: OrderStatus;
  subtotal: number;
  platform_fee: number;
  shipping_cost: number;
  tax: number;
  total: number;
  currency: string;
  shipping_address: ShippingAddress;
  payment_intent_id: string | null;
  payment_status: PaymentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  seller_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  platform_fee: number;
  seller_earnings: number;
  status: OrderItemStatus;
  tracking_number: string | null;
  tracking_carrier: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  products?: ProductWithImages;
  seller_profiles?: SellerProfile;
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
  profiles?: Profile;
}

export interface Review {
  id: string;
  product_id: string;
  order_item_id: string;
  buyer_id: string;
  seller_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  images: string[] | null;
  is_verified_purchase: boolean;
  is_approved: boolean;
  helpful_count: number;
  created_at: string;
  profiles?: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
}

export interface Payout {
  id: string;
  seller_id: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  stripe_transfer_id: string | null;
  period_start: string | null;
  period_end: string | null;
  order_count: number | null;
  created_at: string;
  paid_at: string | null;
}

export interface PlatformSetting {
  id: string;
  key: string;
  value: unknown;
  updated_at: string;
}

// ============================================================
// API REQUEST / RESPONSE TYPES
// ============================================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ProductFilters {
  gemstone_type?: GemstoneType;
  cut?: CutType;
  clarity?: ClarityGrade;
  certification_body?: CertificationBody;
  treatment?: TreatmentType;
  min_price?: number;
  max_price?: number;
  min_carat?: number;
  max_carat?: number;
  origin_country?: string;
  is_certified?: boolean;
  is_featured?: boolean;
  category_id?: string;
  search?: string;
  sort_by?: 'price_asc' | 'price_desc' | 'newest' | 'rating' | 'carat_asc' | 'carat_desc';
  page?: number;
  limit?: number;
}

export interface CreateProductInput {
  name: string;
  gemstone_type: GemstoneType;
  cut: CutType;
  clarity: ClarityGrade;
  color_grade?: string;
  carat_weight: number;
  origin_country?: string;
  treatment: TreatmentType;
  certification_body: CertificationBody;
  certification_number?: string;
  price: number;
  compare_price?: number;
  cost_price?: number;
  stock_quantity: number;
  low_stock_threshold: number;
  description: string;
  tags?: string;
  category_id?: string;
  dimensions_mm?: string;
  weight_grams?: number;
}

export interface CreateOrderInput {
  items: Array<{
    product_id: string;
    quantity: number;
  }>;
  shipping_address: ShippingAddress;
  notes?: string;
}

export interface SellerAnalytics {
  summary: {
    total_revenue: number;
    total_orders: number;
    total_platform_fees: number;
    net_earnings: number;
    avg_order_value: number;
    conversion_rate: number;
    total_views: number;
  };
  monthly_revenue: Array<{
    month: string;
    revenue: number;
    orders: number;
    fees: number;
    earnings: number;
  }>;
  top_products: Array<{
    id: string;
    name: string;
    sales_count: number;
    revenue: number;
    views: number;
    profit?: number;
  }>;
  sales_by_gemstone: Array<{
    gemstone_type: string;
    count: number;
    revenue: number;
  }>;
  recent_orders: OrderWithItems[];
  pending_payout: number;
}

export interface AdminStats {
  total_users: number;
  total_sellers: number;
  total_buyers: number;
  total_products: number;
  total_orders: number;
  total_revenue: number;
  total_platform_fees: number;
  pending_verifications: number;
  monthly_stats: Array<{
    month: string;
    orders: number;
    revenue: number;
    fees: number;
    new_users: number;
    new_sellers: number;
  }>;
}

// ============================================================
// STORE TYPES
// ============================================================

export interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  isLoading: boolean;
  addItem: (product: ProductWithImages, quantity?: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>;
  toggleCart: () => void;
  get subtotal(): number;
  get itemCount(): number;
}

export interface AuthStore {
  user: Profile | null;
  sellerProfile: SellerProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: Profile | null) => void;
  setSellerProfile: (profile: SellerProfile | null) => void;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

export interface UIStore {
  isSidebarOpen: boolean;
  activeModal: string | null;
  toasts: Toast[];
  toggleSidebar: () => void;
  openModal: (id: string) => void;
  closeModal: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: 'default' | 'success' | 'error' | 'warning';
  duration?: number;
}

// ============================================================
// COMPONENT PROP TYPES
// ============================================================

export interface ProductCardProps {
  product: ProductWithImages;
  showSeller?: boolean;
  className?: string;
}

export interface StarRatingProps {
  rating: number;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export interface PriceDisplayProps {
  price: number;
  comparePrice?: number | null;
  currency?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export interface GemBadgeProps {
  type: GemstoneType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface OrderTrackerProps {
  status: OrderStatus;
  timestamps?: {
    confirmed?: string;
    processing?: string;
    shipped?: string;
    delivered?: string;
  };
}

// ============================================================
// FORM SCHEMAS (used with Zod)
// ============================================================

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
  role: 'buyer' | 'seller';
  store_name?: string;
}

export interface ProductFormData extends CreateProductInput {
  images: File[];
  certificate_file?: File;
}

export interface CheckoutFormData {
  shipping: ShippingAddress;
  save_address: boolean;
}

export interface ReviewFormData {
  rating: number;
  title?: string;
  body?: string;
  images?: File[];
}

export interface SellerOnboardFormData {
  store_name: string;
  store_description: string;
  business_type: BusinessType;
  tax_id?: string;
}
