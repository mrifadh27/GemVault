# 💎 GemGram — Instagram for Gem Sellers

> The fastest way to sell gems online. Post your gems like Instagram, buyers DM you to buy.

## ✨ Features

- **Instagram-like feed** — scroll through gem posts with double-tap to like
- **Category filters** — Ruby, Sapphire, Emerald, Natural, Certified, and more
- **Optional pricing** — set a price or leave empty for "DM for price"
- **Need DM** — buyers contact sellers directly (WhatsApp, Instagram, Telegram, or in-app)
- **Real-time messages** — built-in DM system with live updates
- **No payment processing** — pure social-style marketplace
- **Blazing fast** — Next.js 14 + Supabase, optimized for mobile

---

## 🚀 Quick Setup (15 minutes)

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy your **Project URL** and **anon key** from Settings → API

### 2. Run the database schema

1. In Supabase dashboard → **SQL Editor**
2. Open `supabase/schema.sql` from this project
3. Paste the entire contents and click **Run**

### 3. Set up Storage buckets

In Supabase dashboard → **Storage** → New bucket:
- `gem-images` → **Public** bucket
- `avatars` → **Public** bucket

For each bucket, add these policies (Storage → Policies):
```sql
-- Allow public reads
CREATE POLICY "Public read" ON storage.objects FOR SELECT USING (bucket_id IN ('gem-images', 'avatars'));

-- Allow authenticated uploads
CREATE POLICY "Auth upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id IN ('gem-images', 'avatars') AND auth.role() = 'authenticated'
);
```

### 4. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### 5. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 📱 How It Works

### For Sellers
1. Sign up / Sign in
2. Edit your profile — add WhatsApp, Instagram, or Telegram
3. Tap **+ Post** → upload gem photos, add details, optional price
4. Your gem appears in the feed for buyers to see

### For Buyers
1. Browse the feed or explore by category
2. Double-tap a photo to like it
3. Tap **Need DM · Contact Seller** on any listing
4. Send a quick message (or use quick replies)
5. Continue the conversation in Messages

---

## 🗂️ Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main feed (home)
│   ├── auth/page.tsx         # Login / Signup
│   ├── create/page.tsx       # Create a gem post
│   ├── post/[id]/page.tsx    # Post detail page
│   ├── profile/[username]/   # User profile
│   ├── profile/edit/         # Edit own profile
│   ├── messages/page.tsx     # DM inbox + chat
│   ├── explore/page.tsx      # Search & explore
│   └── api/                  # API routes
│       ├── posts/            # CRUD for posts
│       ├── dm/               # DM threads + messages
│       ├── upload/           # Image upload
│       ├── profile/          # Profile read/update
│       └── categories/       # Gem categories
├── components/
│   ├── feed/PostCard.tsx     # Main Instagram-like card
│   ├── feed/Feed.tsx         # Infinite scroll feed
│   ├── feed/CategoryTabs.tsx # Category filter bar
│   ├── dm/DMModal.tsx        # "Need DM" modal
│   ├── layout/Navbar.tsx     # Top navigation
│   └── layout/BottomNav.tsx  # Mobile bottom nav
└── supabase/
    └── schema.sql            # Complete database schema
```

---

## 🔧 Tech Stack

| Technology | Purpose |
|-----------|---------|
| Next.js 14 | React framework (App Router) |
| Supabase | Auth, Database, Storage, Realtime |
| TanStack Query | Data fetching + caching |
| Tailwind CSS | Styling |
| Zustand | (available if needed for state) |
| Framer Motion | (available if needed for animations) |

---

## 🌍 Deploying to Production

### Vercel (Recommended)

```bash
npx vercel
```

Add your `.env.local` variables in Vercel dashboard → Settings → Environment Variables.

Update `NEXT_PUBLIC_APP_URL` to your production URL in Supabase Auth settings:
- Settings → Authentication → URL Configuration
- Add your production URL to Redirect URLs

---

## 💡 Tips

- **Mobile-first**: works perfectly on iPhone/Android browsers
- **No Stripe needed**: everything is DM-based
- **Google OAuth**: works out of the box with Supabase — just enable it in Supabase Auth → Providers
- **Images**: stored in Supabase Storage, CDN-served globally

---

Built with ❤️ for the gem community.
