'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart, Eye, Award, TrendingUp, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { useWishlist } from '@/hooks/useWishlist';
import { useRealtimeInventory } from '@/hooks/useRealtimeInventory';
import { useCart } from '@/hooks/useCart';
import {
  GemBadge, PriceDisplay, LowStockBadge, StarRating, VerifiedBadge,
} from '@/components/common/index';
import {
  getProductImageUrl, cn, formatCarat, truncate, getGemstoneColor,
} from '@/lib/utils';
import type { ProductWithImages, Category } from '@/types';

// ============================================================
// CategoryPills
// ============================================================
export function CategoryPills({ categories }: { categories: Category[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeGem = searchParams.get('gemstone_type');

  const handleClick = (gemstoneType: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (activeGem === gemstoneType) {
      params.delete('gemstone_type');
    } else {
      params.set('gemstone_type', gemstoneType);
    }
    router.push(`/marketplace?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => router.push('/marketplace')}
        className={cn(
          'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
          !activeGem
            ? 'bg-gold text-obsidian'
            : 'bg-obsidian-light border border-obsidian-border text-ivory-muted hover:text-ivory hover:border-gold/30'
        )}
      >
        All Gems
      </button>
      {categories.map((cat) => {
        const isActive = activeGem === cat.name;
        return (
          <button
            key={cat.id}
            onClick={() => handleClick(cat.name)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-1.5',
              isActive
                ? 'text-obsidian'
                : 'bg-obsidian-light border border-obsidian-border text-ivory-muted hover:text-ivory hover:border-gold/30'
            )}
            style={isActive ? { backgroundColor: cat.color_hex ?? '#c9a96e' } : {}}
          >
            {cat.icon && <span>{cat.icon}</span>}
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// ProductCard
// ============================================================
export function ProductCard({
  product,
  showSeller = false,
  className,
}: {
  product: ProductWithImages;
  showSeller?: boolean;
  className?: string;
}) {
  const { isWishlisted, toggleWishlist, isMutating } = useWishlist();
  const { addToCart } = useCart();
  const { stockQuantity: realtimeStock } = useRealtimeInventory(product.id);
  const currentStock = realtimeStock ?? product.stock_quantity;

  const primaryImage =
    product.product_images?.find((img) => img.is_primary) ??
    product.product_images?.[0];
  const isOutOfStock = currentStock === 0;
  const isLowStock = currentStock > 0 && currentStock <= product.low_stock_threshold;
  const wishlisted = isWishlisted(product.id);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('product-card card-hover group', className)}
    >
      {/* Image */}
      <Link href={`/marketplace/${product.slug}`} className="block relative overflow-hidden aspect-square">
        <img
          src={getProductImageUrl(primaryImage?.url)}
          alt={primaryImage?.alt_text ?? product.name}
          className="w-full h-full object-cover product-card-image"
        />

        {/* Overlay badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5">
          {product.is_featured && (
            <span className="badge-gold text-[10px] px-2 py-0.5 flex items-center gap-1">
              <TrendingUp className="w-2.5 h-2.5" /> Featured
            </span>
          )}
          {product.is_certified && (
            <span className="badge text-[10px] px-2 py-0.5 bg-green-500/15 text-green-400 border border-green-500/20 flex items-center gap-1">
              <Award className="w-2.5 h-2.5" /> {product.certification_body}
            </span>
          )}
        </div>

        {/* Wishlist button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product.id);
          }}
          disabled={isMutating}
          className="absolute top-2 right-2 p-2 rounded-full bg-obsidian/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-obsidian/80"
        >
          <Heart
            className={cn(
              'w-4 h-4 transition-colors',
              wishlisted ? 'fill-red-400 text-red-400' : 'text-ivory'
            )}
          />
        </button>

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-obsidian/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="badge-red">Sold Out</span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <GemBadge type={product.gemstone_type} size="sm" />
          {isLowStock && <LowStockBadge quantity={currentStock} threshold={product.low_stock_threshold} />}
        </div>

        <Link href={`/marketplace/${product.slug}`}>
          <h3 className="text-sm font-medium text-ivory hover:text-gold transition-colors line-clamp-2 mb-1">
            {product.name}
          </h3>
        </Link>

        <p className="text-xs text-ivory-subtle mb-2">
          {formatCarat(product.carat_weight)} •{' '}
          {product.cut ? `${product.cut} Cut` : ''}{' '}
          {product.origin_country ? `• ${product.origin_country}` : ''}
        </p>

        {product.review_count > 0 && (
          <StarRating rating={product.rating} count={product.review_count} size="sm" />
        )}

        <div className="flex items-center justify-between mt-3">
          <PriceDisplay price={product.price} comparePrice={product.compare_price} size="md" />

          <button
            onClick={() => addToCart(product)}
            disabled={isOutOfStock}
            className="text-xs btn-outline py-1.5 px-3 disabled:opacity-40"
          >
            {isOutOfStock ? 'Sold' : 'Add'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// ProductGrid
// ============================================================
export function ProductGrid({
  products,
  showSeller = false,
}: {
  products: ProductWithImages[];
  showSeller?: boolean;
}) {
  if (!products.length) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">💎</div>
        <h3 className="font-serif text-2xl text-ivory mb-2">No gemstones found</h3>
        <p className="text-ivory-muted text-sm">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} showSeller={showSeller} />
      ))}
    </div>
  );
}

// ============================================================
// ProductSkeleton
// ============================================================
export function ProductSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="aspect-square skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-3 skeleton rounded w-1/3" />
        <div className="h-3 skeleton rounded w-3/4" />
        <div className="h-3 skeleton rounded w-1/2" />
        <div className="flex justify-between">
          <div className="h-5 skeleton rounded w-1/3" />
          <div className="h-7 skeleton rounded w-1/4" />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ProductSort
// ============================================================
export function ProductSort() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get('sort_by') ?? 'newest';

  const options = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'carat_asc', label: 'Carat: Low to High' },
    { value: 'carat_desc', label: 'Carat: High to Low' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort_by', e.target.value);
    router.push(`/marketplace?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="w-4 h-4 text-ivory-subtle" />
      <select
        value={currentSort}
        onChange={handleChange}
        className="bg-obsidian-light border border-obsidian-border rounded-lg px-3 py-2 text-sm text-ivory focus:outline-none focus:border-gold/40"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ============================================================
// LiveViewerCount
// ============================================================
export function LiveViewerCount({ productId }: { productId: string }) {
  const { viewerCount } = useRealtimeInventory(productId);

  if (viewerCount <= 1) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-ivory-muted">
      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      {viewerCount} people viewing this
    </div>
  );
}

// ============================================================
// ProductSearch
// ============================================================
export function ProductSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    const value = e.target.value;
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    params.delete('page');
    router.push(`/marketplace?${params.toString()}`);
  };

  return (
    <input
      type="text"
      defaultValue={searchParams.get('search') ?? ''}
      onChange={handleSearch}
      placeholder="Search by name, type, origin…"
      className="input w-full"
    />
  );
}
