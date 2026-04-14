import { Suspense } from 'react';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { ProductGrid } from '@/components/marketplace/ProductGrid';
import { ProductSkeleton } from '@/components/marketplace/ProductSkeleton';
import { ProductFilters } from '@/components/marketplace/ProductFilters';
import { ProductSort } from '@/components/marketplace/ProductSort';
import { ProductSearch } from '@/components/marketplace/ProductSearch';
import { CategoryPills } from '@/components/marketplace/CategoryPills';
import type { ProductWithImages, Category } from '@/types';

export const metadata: Metadata = {
  title: 'Marketplace — Browse Gemstones',
  description: 'Browse thousands of certified gemstones from verified sellers worldwide.',
};

interface PageProps {
  searchParams: Promise<Record<string, string>>;
}

async function getProducts(
  filters: Record<string, string>
): Promise<{ products: ProductWithImages[]; total: number }> {
  const supabase = await createClient();

  let query = supabase
    .from('products')
    .select('*, product_images(*)', { count: 'exact' })
    .eq('is_active', true);

  if (filters.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }
  if (filters.gemstone_type) {
    query = query.eq('gemstone_type', filters.gemstone_type);
  }
  if (filters.cut) query = query.eq('cut', filters.cut);
  if (filters.clarity) query = query.eq('clarity', filters.clarity);
  if (filters.certification_body) query = query.eq('certification_body', filters.certification_body);
  if (filters.treatment) query = query.eq('treatment', filters.treatment);
  if (filters.min_price) query = query.gte('price', parseFloat(filters.min_price));
  if (filters.max_price) query = query.lte('price', parseFloat(filters.max_price));
  if (filters.min_carat) query = query.gte('carat_weight', parseFloat(filters.min_carat));
  if (filters.max_carat) query = query.lte('carat_weight', parseFloat(filters.max_carat));
  if (filters.is_certified === 'true') query = query.eq('is_certified', true);
  if (filters.is_featured === 'true') query = query.eq('is_featured', true);
  if (filters.category_id) query = query.eq('category_id', filters.category_id);

  const sortBy = filters.sort_by ?? 'newest';
  switch (sortBy) {
    case 'price_asc': query = query.order('price', { ascending: true }); break;
    case 'price_desc': query = query.order('price', { ascending: false }); break;
    case 'rating': query = query.order('rating', { ascending: false }); break;
    case 'carat_asc': query = query.order('carat_weight', { ascending: true }); break;
    case 'carat_desc': query = query.order('carat_weight', { ascending: false }); break;
    default: query = query.order('created_at', { ascending: false });
  }

  const page = parseInt(filters.page ?? '1', 10);
  const limit = 24;
  const from = (page - 1) * limit;
  query = query.range(from, from + limit - 1);

  const { data, count, error } = await query;
  if (error) throw error;

  return { products: (data as unknown as ProductWithImages[]) ?? [], total: count ?? 0 };
}

async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true });
  return (data as Category[]) ?? [];
}

export default async function MarketplacePage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const [{ products, total }, categories] = await Promise.all([
    getProducts(resolvedParams),
    getCategories(),
  ]);

  const page = parseInt(resolvedParams.page ?? '1', 10);
  const limit = 24;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-20">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-4xl text-ivory font-light mb-2">
          Gemstone Marketplace
        </h1>
        <p className="text-ivory-muted">
          {total.toLocaleString()} gemstones from verified sellers worldwide
        </p>
      </div>

      {/* Category pills */}
      <div className="mb-8">
        <CategoryPills categories={categories} />
      </div>

      <div className="flex gap-8">
        {/* Sidebar Filters */}
        <Suspense fallback={<div className="w-60 h-96 skeleton rounded-xl" />}>
          <ProductFilters />
        </Suspense>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Search + Sort bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1">
              <ProductSearch />
            </div>
            <ProductSort />
          </div>

          {/* Results */}
          <Suspense
            fallback={
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            }
          >
            <ProductGrid products={products} />
          </Suspense>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                const params = new URLSearchParams(resolvedParams);
                params.set('page', String(p));
                return (
                  <a
                    key={p}
                    href={`/marketplace?${params.toString()}`}
                    className={
                      p === page
                        ? 'w-9 h-9 rounded-lg bg-gold text-obsidian text-sm font-semibold flex items-center justify-center'
                        : 'w-9 h-9 rounded-lg border border-obsidian-border text-ivory-muted hover:text-ivory hover:border-gold/40 text-sm flex items-center justify-center transition-colors'
                    }
                  >
                    {p}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
