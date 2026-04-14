# ✦ GemVault — Premium Gemstone Marketplace

A full-stack, production-ready multi-vendor gemstone e-commerce platform built with Next.js 14, Supabase, Stripe Connect, and Resend.

---

## 🏗️ Architecture

```
Frontend:  Next.js 14 (App Router) + TypeScript
Styling:   Tailwind CSS with custom design tokens
Animation: Framer Motion
State:     Zustand (global) + TanStack Query (server state)
Forms:     React Hook Form + Zod validation
Charts:    Recharts

Backend:   Next.js API Routes
Database:  Supabase (PostgreSQL + RLS)
Auth:      Supabase Auth (Email + Google OAuth)
Storage:   Supabase Storage (images, certificates)
Payments:  Stripe Connect (split payments, seller payouts)
Email:     Resend (transactional emails)
Realtime:  Supabase Realtime (inventory, notifications)
```

---

## 🚀 Quick Start

### 1. Clone and install

```bash
git clone <your-repo>
cd gemvault
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `supabase/migrations/001_initial_schema.sql`
3. In **Storage**, create these public buckets:
   - `product-images`
   - `certificates`
   - `avatars`
4. Copy your API keys from **Settings → API**

### 3. Set up Stripe

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Enable **Connect** in your Stripe dashboard
3. Copy your publishable and secret keys
4. For webhooks, run: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

### 4. Set up Resend

1. Create an account at [resend.com](https://resend.com)
2. Add and verify your sending domain
3. Copy your API key

### 5. Configure environment

```bash
cp .env.local.example .env.local
# Fill in all values in .env.local
```

### 6. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
gemvault/
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql     # Complete DB schema + RLS + triggers
│
├── src/
│   ├── types/index.ts                 # All TypeScript interfaces
│   ├── lib/
│   │   ├── supabase/                  # Browser + server Supabase clients
│   │   ├── stripe.ts                  # Stripe helpers
│   │   ├── resend.ts                  # Email templates
│   │   ├── validations.ts             # Zod schemas
│   │   └── utils.ts                   # Utility functions
│   │
│   ├── stores/                        # Zustand global state
│   │   ├── cart.store.ts
│   │   ├── auth.store.ts
│   │   └── ui.store.ts
│   │
│   ├── hooks/                         # TanStack Query + Supabase Realtime
│   │   ├── useCart.ts
│   │   ├── useWishlist.ts
│   │   ├── useProducts.ts
│   │   ├── useOrders.ts
│   │   ├── useSellerDashboard.ts
│   │   ├── useAdminDashboard.ts
│   │   ├── useNotifications.ts        # Realtime notifications
│   │   └── useRealtimeInventory.ts    # Realtime stock + viewer count
│   │
│   ├── app/
│   │   ├── page.tsx                   # Homepage with hero + featured gems
│   │   ├── marketplace/               # Browse + product detail
│   │   ├── (auth)/                    # Login, register, verify, forgot-pw
│   │   ├── cart/                      # Cart page
│   │   ├── checkout/                  # Stripe Elements checkout + success
│   │   ├── buyer/                     # Buyer dashboard (orders, wishlist, profile)
│   │   ├── seller/                    # Seller dashboard (listings, orders, payouts)
│   │   ├── admin/                     # Admin panel (users, sellers, products)
│   │   └── api/                       # API routes
│   │
│   └── components/
│       ├── layout/                    # Navbar, Footer, CartDrawer, Notifications
│       ├── marketplace/               # HeroBanner, ProductGrid, ProductCard, Filters
│       ├── product/                   # Gallery, Specs, Reviews, CertBadge
│       ├── seller/                    # Dashboard KPIs, Charts, ListingForm, Uploader
│       ├── buyer/                     # OrderTracker, OrderCard, ProfileForm
│       ├── admin/                     # Platform stats, user/seller moderation
│       └── common/                    # GemBadge, StarRating, PriceDisplay, Toast
│
├── middleware.ts                      # Auth route protection
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 🎨 Design System

The app uses a luxury dark theme with:

- **Colors**: Obsidian dark palette + gold accents + ivory text
- **Fonts**: Cormorant Garamond (headings) + DM Sans (body)
- **Animations**: Framer Motion page transitions, Tailwind CSS animations
- **Components**: Custom design tokens via CSS variables + Tailwind classes

---

## 💳 Payment Flow

1. Buyer adds items to cart → proceeds to checkout
2. Shipping address form → Stripe Elements card form
3. `POST /api/orders` creates order + Stripe PaymentIntent
4. `stripe.confirmCardPayment()` runs client-side
5. Stripe webhook `payment_intent.succeeded` fires:
   - Order status → `confirmed`
   - Stock decremented via DB trigger
   - Stripe Transfer → seller account (minus platform fee)
   - Confirmation emails sent via Resend
   - Notifications created for buyer + seller

---

## 🏪 Seller Onboarding

1. Register as seller → `seller_profiles` row created (status: `pending`)
2. Admin reviews and approves the seller
3. Seller connects Stripe Express via `/api/seller/onboard`
4. Seller creates listings → goes live after creation
5. Sales auto-transfer earnings via Stripe Connect

---

## 🔐 Row Level Security

All Supabase tables have RLS policies:
- **Buyers**: own orders, cart, wishlist, profile
- **Sellers**: own products, seller_profile, order_items
- **Admins**: full access to all tables
- **Public**: active products, approved reviews, categories

---

## 📧 Email Templates

All emails use a luxury dark HTML template and are sent via Resend:
- Welcome email (buyer + seller)
- Order confirmation (buyer)
- New sale notification (seller)
- Shipment tracking (buyer)
- Password reset
- Low stock alert (seller)
- Payout confirmation (seller)

---

## ⚡ Realtime Features

- **Inventory**: Live stock updates via Supabase Realtime when stock changes
- **Viewer Count**: Presence channels show "X people viewing this"
- **Notifications**: Real-time push notifications via postgres_changes subscription

---

## 🔧 Database Triggers

- `update_product_rating()` — recalculates after every review change
- `update_seller_rating()` — same for seller aggregate rating
- `update_inventory_on_order()` — decrements stock when payment succeeds
- `log_inventory_change()` — audit log for all stock changes
- `update_seller_totals()` — updates total_sales/total_orders on delivery
- `update_updated_at()` — auto-timestamps on all relevant tables
- `generate_product_slug()` — URL-safe slug from product name + UUID suffix

---

## 🌍 Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Your app's public URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Stripe secret key (server-only) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM_EMAIL` | Sender email address |

---

## 📦 Deployment

### Vercel

```bash
vercel deploy
```

Set all environment variables in the Vercel dashboard. Configure your Stripe webhook endpoint to `https://your-domain.com/api/webhooks/stripe`.

### Supabase Storage CORS

In Supabase Dashboard → Storage → Policies, ensure your domain is allowed for CORS on all buckets.

---

## 🛠️ Scripts

```bash
npm run dev           # Start development server
npm run build         # Production build
npm run lint          # ESLint
npm run db:push       # Push migrations to Supabase
npm run stripe:listen # Forward Stripe webhooks to localhost
```

---

## 📊 Platform Fee Structure

- Default platform fee: **8%** (configurable per seller in admin)
- Stripe Connect: seller receives `(sale_price - platform_fee)` automatically
- Payouts: weekly, minimum $50 threshold
- Admin can override fee rate per seller from the admin panel

---

## 🔑 Admin Setup

To create the first admin user, after registration run this in Supabase SQL Editor:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

---

Built with ❤️ for the gemstone community.
