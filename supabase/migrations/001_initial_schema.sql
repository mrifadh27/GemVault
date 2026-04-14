-- ============================================================
-- GemVault Marketplace — Initial Schema
-- ============================================================

-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  phone text,
  role text check (role in ('buyer', 'seller', 'admin')) default 'buyer',
  is_verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- ADDRESSES
-- ============================================================
create table if not exists addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  label text default 'Home',
  full_name text,
  phone text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text,
  is_default boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- SELLER PROFILES
-- ============================================================
create table if not exists seller_profiles (
  id uuid primary key references profiles(id) on delete cascade,
  store_name text unique not null,
  store_description text,
  store_logo_url text,
  store_banner_url text,
  business_type text check (business_type in ('individual', 'company')),
  tax_id text,
  verification_status text check (verification_status in ('pending', 'approved', 'rejected', 'suspended')) default 'pending',
  verification_docs jsonb,
  stripe_account_id text,
  stripe_onboarding_complete boolean default false,
  platform_fee_rate numeric(4,2) default 8.00,
  total_sales numeric(12,2) default 0,
  total_orders integer default 0,
  rating numeric(3,2) default 0,
  review_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- CATEGORIES
-- ============================================================
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null,
  icon text,
  color_hex text,
  description text,
  parent_id uuid references categories(id),
  display_order integer default 0
);

-- ============================================================
-- PRODUCTS (Gemstone Listings)
-- ============================================================
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references seller_profiles(id) on delete cascade,
  category_id uuid references categories(id),
  name text not null,
  slug text unique not null,
  description text,
  gemstone_type text not null,
  cut text check (cut in ('Round','Oval','Pear','Cushion','Marquise','Princess','Emerald','Radiant','Asscher','Heart')),
  clarity text check (clarity in ('FL','IF','VVS1','VVS2','VS1','VS2','SI1','SI2','I1','I2','I3')),
  color_grade text,
  carat_weight numeric(8,3) not null,
  origin_country text,
  treatment text check (treatment in ('None','Heated','Oiled','Filled','Irradiated')) default 'None',
  certification_body text check (certification_body in ('GIA','IGI','AGL','GRS','Gübelin','None')) default 'None',
  certification_number text,
  certificate_url text,
  dimensions_mm text,
  price numeric(12,2) not null,
  compare_price numeric(12,2),
  cost_price numeric(12,2),
  currency text default 'USD',
  stock_quantity integer not null default 1,
  low_stock_threshold integer default 3,
  weight_grams numeric(8,2),
  is_active boolean default true,
  is_featured boolean default false,
  is_certified boolean generated always as (certification_body != 'None') stored,
  views_count integer default 0,
  sales_count integer default 0,
  rating numeric(3,2) default 0,
  review_count integer default 0,
  tags text[],
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- PRODUCT IMAGES
-- ============================================================
create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  url text not null,
  alt_text text,
  display_order integer default 0,
  is_primary boolean default false
);

-- ============================================================
-- INVENTORY LOGS
-- ============================================================
create table if not exists inventory_logs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id),
  seller_id uuid references seller_profiles(id),
  change_type text check (change_type in ('restock','sale','adjustment','return')),
  quantity_before integer,
  quantity_change integer,
  quantity_after integer,
  reference_id uuid,
  note text,
  created_at timestamptz default now()
);

-- ============================================================
-- WISHLISTS
-- ============================================================
create table if not exists wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

-- ============================================================
-- CART ITEMS
-- ============================================================
create table if not exists cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  product_id uuid references products(id) on delete cascade,
  quantity integer not null default 1,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

-- ============================================================
-- ORDERS
-- ============================================================
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references profiles(id),
  status text check (status in ('pending_payment','confirmed','processing','shipped','delivered','cancelled','refunded')) default 'pending_payment',
  subtotal numeric(12,2) not null,
  platform_fee numeric(12,2) not null,
  shipping_cost numeric(12,2) default 0,
  tax numeric(12,2) default 0,
  total numeric(12,2) not null,
  currency text default 'USD',
  shipping_address jsonb not null,
  payment_intent_id text,
  payment_status text check (payment_status in ('pending','paid','failed','refunded')) default 'pending',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  seller_id uuid references seller_profiles(id),
  quantity integer not null,
  unit_price numeric(12,2) not null,
  subtotal numeric(12,2) not null,
  platform_fee numeric(12,2) not null,
  seller_earnings numeric(12,2) not null,
  status text check (status in ('pending','confirmed','shipped','delivered','cancelled')) default 'pending',
  tracking_number text,
  tracking_carrier text,
  shipped_at timestamptz,
  delivered_at timestamptz
);

-- ============================================================
-- REVIEWS
-- ============================================================
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  order_item_id uuid references order_items(id),
  buyer_id uuid references profiles(id),
  seller_id uuid references seller_profiles(id),
  rating integer check (rating between 1 and 5) not null,
  title text,
  body text,
  images text[],
  is_verified_purchase boolean default true,
  is_approved boolean default false,
  helpful_count integer default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  type text check (type in ('order_update','new_sale','low_stock','payout','review','system')),
  title text not null,
  message text not null,
  data jsonb,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- PAYOUTS
-- ============================================================
create table if not exists payouts (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references seller_profiles(id),
  amount numeric(12,2) not null,
  currency text default 'USD',
  status text check (status in ('pending','processing','paid','failed')) default 'pending',
  stripe_transfer_id text,
  period_start date,
  period_end date,
  order_count integer,
  created_at timestamptz default now(),
  paid_at timestamptz
);

-- ============================================================
-- PLATFORM SETTINGS
-- ============================================================
create table if not exists platform_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- products indexes
create index if not exists idx_products_seller_id on products(seller_id);
create index if not exists idx_products_category_id on products(category_id);
create index if not exists idx_products_gemstone_type on products(gemstone_type);
create index if not exists idx_products_is_active on products(is_active);
create index if not exists idx_products_is_featured on products(is_featured);
create index if not exists idx_products_price on products(price);
create index if not exists idx_products_created_at on products(created_at desc);
create index if not exists idx_products_slug on products(slug);
create index if not exists idx_products_name_trgm on products using gin(name gin_trgm_ops);

-- orders indexes
create index if not exists idx_orders_buyer_id on orders(buyer_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_created_at on orders(created_at desc);
create index if not exists idx_orders_payment_intent_id on orders(payment_intent_id);

-- order_items indexes
create index if not exists idx_order_items_order_id on order_items(order_id);
create index if not exists idx_order_items_seller_id on order_items(seller_id);
create index if not exists idx_order_items_product_id on order_items(product_id);

-- reviews indexes
create index if not exists idx_reviews_product_id on reviews(product_id);
create index if not exists idx_reviews_seller_id on reviews(seller_id);
create index if not exists idx_reviews_is_approved on reviews(is_approved);

-- notifications indexes
create index if not exists idx_notifications_user_id on notifications(user_id);
create index if not exists idx_notifications_is_read on notifications(is_read);
create index if not exists idx_notifications_created_at on notifications(created_at desc);

-- wishlist indexes
create index if not exists idx_wishlists_user_id on wishlists(user_id);

-- cart indexes
create index if not exists idx_cart_items_user_id on cart_items(user_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- update_updated_at trigger function
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at to profiles
create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- Apply updated_at to seller_profiles
create trigger trg_seller_profiles_updated_at
  before update on seller_profiles
  for each row execute function update_updated_at();

-- Apply updated_at to products
create trigger trg_products_updated_at
  before update on products
  for each row execute function update_updated_at();

-- Apply updated_at to orders
create trigger trg_orders_updated_at
  before update on orders
  for each row execute function update_updated_at();

-- Apply updated_at to platform_settings
create trigger trg_platform_settings_updated_at
  before update on platform_settings
  for each row execute function update_updated_at();

-- generate_slug: auto-generate slug from name + short uuid
create or replace function generate_product_slug(product_name text, product_id uuid)
returns text as $$
begin
  return lower(regexp_replace(product_name, '[^a-zA-Z0-9]+', '-', 'g'))
    || '-' || substring(product_id::text from 1 for 8);
end;
$$ language plpgsql;

-- update_product_rating: recalculate after review insert/update/delete
create or replace function update_product_rating()
returns trigger as $$
declare
  v_product_id uuid;
  v_avg_rating numeric(3,2);
  v_review_count integer;
begin
  if tg_op = 'DELETE' then
    v_product_id := old.product_id;
  else
    v_product_id := new.product_id;
  end if;

  select
    coalesce(avg(rating)::numeric(3,2), 0),
    count(*)
  into v_avg_rating, v_review_count
  from reviews
  where product_id = v_product_id and is_approved = true;

  update products
  set rating = v_avg_rating, review_count = v_review_count
  where id = v_product_id;

  return coalesce(new, old);
end;
$$ language plpgsql;

create trigger trg_update_product_rating
  after insert or update or delete on reviews
  for each row execute function update_product_rating();

-- update_seller_rating: recalculate after review changes
create or replace function update_seller_rating()
returns trigger as $$
declare
  v_seller_id uuid;
  v_avg_rating numeric(3,2);
  v_review_count integer;
begin
  if tg_op = 'DELETE' then
    v_seller_id := old.seller_id;
  else
    v_seller_id := new.seller_id;
  end if;

  select
    coalesce(avg(rating)::numeric(3,2), 0),
    count(*)
  into v_avg_rating, v_review_count
  from reviews
  where seller_id = v_seller_id and is_approved = true;

  update seller_profiles
  set rating = v_avg_rating, review_count = v_review_count
  where id = v_seller_id;

  return coalesce(new, old);
end;
$$ language plpgsql;

create trigger trg_update_seller_rating
  after insert or update or delete on reviews
  for each row execute function update_seller_rating();

-- log_inventory_change: auto-log any stock change
create or replace function log_inventory_change()
returns trigger as $$
begin
  if old.stock_quantity is distinct from new.stock_quantity then
    insert into inventory_logs (
      product_id, seller_id, change_type,
      quantity_before, quantity_change, quantity_after, note
    ) values (
      new.id, new.seller_id,
      case
        when new.stock_quantity > old.stock_quantity then 'restock'
        else 'adjustment'
      end,
      old.stock_quantity,
      new.stock_quantity - old.stock_quantity,
      new.stock_quantity,
      'Automatic stock change'
    );
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_log_inventory_change
  after update on products
  for each row execute function log_inventory_change();

-- update_inventory_on_order: decrement stock when order confirmed
create or replace function update_inventory_on_order()
returns trigger as $$
begin
  if new.payment_status = 'paid' and old.payment_status != 'paid' then
    update products p
    set stock_quantity = p.stock_quantity - oi.quantity
    from order_items oi
    where oi.order_id = new.id and oi.product_id = p.id;

    -- log as sale
    insert into inventory_logs (
      product_id, seller_id, change_type,
      quantity_before, quantity_change, quantity_after, reference_id, note
    )
    select
      oi.product_id, oi.seller_id, 'sale',
      p.stock_quantity + oi.quantity,
      -oi.quantity,
      p.stock_quantity,
      new.id,
      'Order ' || new.id::text
    from order_items oi
    join products p on p.id = oi.product_id
    where oi.order_id = new.id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_update_inventory_on_order
  after update on orders
  for each row execute function update_inventory_on_order();

-- update_seller_totals: update stats when order delivered
create or replace function update_seller_totals()
returns trigger as $$
begin
  if new.status = 'delivered' and old.status != 'delivered' then
    update seller_profiles sp
    set
      total_sales = sp.total_sales + oi.seller_earnings,
      total_orders = sp.total_orders + 1
    from order_items oi
    where oi.order_id = new.id and oi.seller_id = sp.id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_update_seller_totals
  after update on orders
  for each row execute function update_seller_totals();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table addresses enable row level security;
alter table seller_profiles enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table inventory_logs enable row level security;
alter table wishlists enable row level security;
alter table cart_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table reviews enable row level security;
alter table notifications enable row level security;
alter table payouts enable row level security;
alter table platform_settings enable row level security;

-- Helper function to check admin role
create or replace function is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- profiles policies
create policy "Public profiles are viewable by everyone" on profiles
  for select using (true);
create policy "Users can update their own profile" on profiles
  for update using (auth.uid() = id);
create policy "Admins have full access to profiles" on profiles
  for all using (is_admin());

-- addresses policies
create policy "Users can manage their own addresses" on addresses
  for all using (auth.uid() = user_id);
create policy "Admins have full access to addresses" on addresses
  for all using (is_admin());

-- seller_profiles policies
create policy "Seller profiles are publicly viewable" on seller_profiles
  for select using (true);
create policy "Sellers can update their own profile" on seller_profiles
  for update using (auth.uid() = id);
create policy "Sellers can insert their own profile" on seller_profiles
  for insert with check (auth.uid() = id);
create policy "Admins have full access to seller_profiles" on seller_profiles
  for all using (is_admin());

-- categories policies (public read)
create policy "Categories are publicly viewable" on categories
  for select using (true);
create policy "Only admins can manage categories" on categories
  for all using (is_admin());

-- products policies
create policy "Active products are publicly viewable" on products
  for select using (is_active = true);
create policy "Sellers can view their own inactive products" on products
  for select using (auth.uid() = seller_id);
create policy "Sellers can create products" on products
  for insert with check (auth.uid() = seller_id);
create policy "Sellers can update their own products" on products
  for update using (auth.uid() = seller_id);
create policy "Sellers can delete their own products" on products
  for delete using (auth.uid() = seller_id);
create policy "Admins have full access to products" on products
  for all using (is_admin());

-- product_images policies
create policy "Product images are publicly viewable" on product_images
  for select using (true);
create policy "Sellers can manage their product images" on product_images
  for all using (
    auth.uid() = (select seller_id from products where id = product_id)
  );
create policy "Admins have full access to product_images" on product_images
  for all using (is_admin());

-- inventory_logs policies
create policy "Sellers can view their own inventory logs" on inventory_logs
  for select using (auth.uid() = seller_id);
create policy "Admins have full access to inventory_logs" on inventory_logs
  for all using (is_admin());

-- wishlists policies
create policy "Users can manage their own wishlist" on wishlists
  for all using (auth.uid() = user_id);

-- cart_items policies
create policy "Users can manage their own cart" on cart_items
  for all using (auth.uid() = user_id);

-- orders policies
create policy "Buyers can view their own orders" on orders
  for select using (auth.uid() = buyer_id);
create policy "Buyers can create orders" on orders
  for insert with check (auth.uid() = buyer_id);
create policy "Buyers can update pending orders" on orders
  for update using (auth.uid() = buyer_id and status = 'pending_payment');
create policy "Admins have full access to orders" on orders
  for all using (is_admin());

-- order_items policies
create policy "Buyers can view their order items" on order_items
  for select using (
    auth.uid() = (select buyer_id from orders where id = order_id)
  );
create policy "Sellers can view their own order items" on order_items
  for select using (auth.uid() = seller_id);
create policy "Sellers can update their own order items" on order_items
  for update using (auth.uid() = seller_id);
create policy "Admins have full access to order_items" on order_items
  for all using (is_admin());

-- reviews policies
create policy "Approved reviews are publicly viewable" on reviews
  for select using (is_approved = true);
create policy "Buyers can view their own reviews" on reviews
  for select using (auth.uid() = buyer_id);
create policy "Buyers can create reviews" on reviews
  for insert with check (auth.uid() = buyer_id);
create policy "Buyers can update their own reviews" on reviews
  for update using (auth.uid() = buyer_id);
create policy "Admins have full access to reviews" on reviews
  for all using (is_admin());

-- notifications policies
create policy "Users can view their own notifications" on notifications
  for select using (auth.uid() = user_id);
create policy "Users can update their own notifications" on notifications
  for update using (auth.uid() = user_id);
create policy "Admins have full access to notifications" on notifications
  for all using (is_admin());
create policy "System can insert notifications" on notifications
  for insert with check (true);

-- payouts policies
create policy "Sellers can view their own payouts" on payouts
  for select using (auth.uid() = seller_id);
create policy "Admins have full access to payouts" on payouts
  for all using (is_admin());

-- platform_settings policies
create policy "Settings are publicly viewable" on platform_settings
  for select using (true);
create policy "Only admins can manage settings" on platform_settings
  for all using (is_admin());

-- ============================================================
-- SEED DEFAULT CATEGORIES
-- ============================================================
insert into categories (name, slug, icon, color_hex, description, display_order) values
  ('Ruby', 'ruby', '💎', '#E53E3E', 'Precious red corundum gemstones', 1),
  ('Sapphire', 'sapphire', '💙', '#3182CE', 'Blue and fancy sapphires', 2),
  ('Emerald', 'emerald', '💚', '#38A169', 'Colombian and other fine emeralds', 3),
  ('Diamond', 'diamond', '✨', '#F7FAFC', 'White and fancy colored diamonds', 4),
  ('Amethyst', 'amethyst', '💜', '#805AD5', 'Purple quartz gemstones', 5),
  ('Opal', 'opal', '🌈', '#ED8936', 'Play-of-color opals', 6),
  ('Topaz', 'topaz', '💛', '#ECC94B', 'Blue, imperial, and other topazes', 7),
  ('Aquamarine', 'aquamarine', '🩵', '#76E4F7', 'Blue-green beryl', 8),
  ('Garnet', 'garnet', '🔴', '#C53030', 'Red and fancy garnets', 9),
  ('Tourmaline', 'tourmaline', '🪩', '#2D3748', 'Multi-color tourmalines', 10),
  ('Tanzanite', 'tanzanite', '🫐', '#553C9A', 'Trichroic blue-violet zoisite', 11),
  ('Spinel', 'spinel', '🌸', '#D53F8C', 'Rare red and fancy spinels', 12)
on conflict (slug) do nothing;

-- ============================================================
-- SEED DEFAULT PLATFORM SETTINGS
-- ============================================================
insert into platform_settings (key, value) values
  ('platform_fee_rate', '8.0'),
  ('min_payout_amount', '50.0'),
  ('payout_schedule', '"weekly"'),
  ('featured_gem_limit', '12'),
  ('max_images_per_product', '8')
on conflict (key) do nothing;
