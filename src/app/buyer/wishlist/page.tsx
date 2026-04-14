'use client';

import { useWishlist } from '@/hooks/useWishlist';
import { ProductGrid } from '@/components/marketplace/ProductGrid';
import { LoadingSpinner, EmptyState } from '@/components/common/index';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import type { ProductWithImages } from '@/types';

export default function WishlistPage() {
  const { wishlistItems, isLoading } = useWishlist();

  const products = wishlistItems
    .map(item => item.products)
    .filter(Boolean) as ProductWithImages[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-ivory font-light">Wishlist</h1>
        <p className="text-ivory-muted text-sm mt-1">{products.length} saved items</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Heart className="w-8 h-8" />}
          title="Your wishlist is empty"
          description="Save gems you love and come back to them later."
          action={<Link href="/marketplace" className="btn-gold mt-2">Browse Gems</Link>}
        />
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
