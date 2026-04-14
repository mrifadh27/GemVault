import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight, Shield, Award, Gem, Globe } from 'lucide-react';
import { HeroBanner } from '@/components/marketplace/HeroBanner';
import { CategoryPills } from '@/components/marketplace/CategoryPills';
import { ProductGrid } from '@/components/marketplace/ProductGrid';
import { ProductSkeleton } from '@/components/marketplace/ProductSkeleton';
import { createClient } from '@/lib/supabase/server';
import type { ProductWithImages, Category } from '@/types';

async function getFeaturedProducts(): Promise<ProductWithImages[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('products')
    .select('*, product_images(*), seller_profiles(store_name, rating, is_verified)')
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(8);
  return (data as unknown as ProductWithImages[]) ?? [];
}

async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true });
  return (data as Category[]) ?? [];
}

const TRUST_FEATURES = [
  {
    icon: Shield,
    title: 'Fully Verified Sellers',
    description: 'Every seller is ID-verified and background-checked before listing.',
  },
  {
    icon: Award,
    title: 'GIA / IGI Certified',
    description: 'Hundreds of stones with internationally recognized certifications.',
  },
  {
    icon: Gem,
    title: 'Authentic Gemstones',
    description: 'Laboratory-tested authenticity guarantees on every purchase.',
  },
  {
    icon: Globe,
    title: 'Global Sourcing',
    description: 'Gems from Colombia, Burma, Sri Lanka, and 40+ origins worldwide.',
  },
];

export default async function HomePage() {
  const [featuredProducts, categories] = await Promise.all([
    getFeaturedProducts(),
    getCategories(),
  ]);

  return (
    <>
      {/* Hero */}
      <HeroBanner />

      {/* Category Pills */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <CategoryPills categories={categories} />
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs text-gold uppercase tracking-widest mb-2">Curated Selection</p>
            <h2 className="font-serif text-4xl text-ivory font-light">Featured Gemstones</h2>
          </div>
          <Link
            href="/marketplace?is_featured=true"
            className="flex items-center gap-2 text-sm text-gold hover:text-gold-light transition-colors"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <Suspense
          fallback={
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          }
        >
          <ProductGrid products={featuredProducts} />
        </Suspense>
      </section>

      {/* Trust section */}
      <section className="bg-obsidian-mid border-y border-obsidian-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-14">
            <p className="text-xs text-gold uppercase tracking-widest mb-3">Why GemVault</p>
            <h2 className="font-serif text-4xl text-ivory font-light">
              The Standard for Gemstone Commerce
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {TRUST_FEATURES.map((feature, i) => (
              <div
                key={feature.title}
                className="text-center animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-5">
                  <feature.icon className="w-5 h-5 text-gold" />
                </div>
                <h3 className="font-serif text-xl text-ivory mb-2">{feature.title}</h3>
                <p className="text-sm text-ivory-muted leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sell CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-24">
        <div className="relative rounded-2xl overflow-hidden hero-mesh border border-gold/15 p-12 text-center">
          <div className="relative z-10">
            <p className="text-xs text-gold uppercase tracking-[0.3em] mb-4">For Sellers</p>
            <h2 className="font-serif text-5xl text-ivory font-light mb-5">
              Reach Global Collectors
            </h2>
            <p className="text-ivory-muted max-w-xl mx-auto mb-8 text-lg">
              List your gemstones to thousands of qualified buyers. Transparent fees,
              instant payouts, and professional support.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/register?role=seller" className="btn-gold">
                Start Selling Today
              </Link>
              <Link href="/seller" className="btn-outline">
                Learn More
              </Link>
            </div>
            <p className="text-xs text-ivory-subtle mt-6">
              Only 8% platform fee · Stripe Connect payouts · Free to list
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
