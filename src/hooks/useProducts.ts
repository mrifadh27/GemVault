'use client';

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import type { ProductWithImages, ProductFilters } from '@/types';
import { buildQueryString } from '@/lib/utils';

async function fetchProducts(
  filters: ProductFilters
): Promise<{ data: ProductWithImages[]; total: number }> {
  const qs = buildQueryString(filters as Record<string, unknown>);
  const response = await fetch(`/api/products?${qs}`);

  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  return response.json();
}

async function fetchProduct(slug: string): Promise<ProductWithImages> {
  const response = await fetch(`/api/products/${slug}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Product not found');
    }
    throw new Error('Failed to fetch product');
  }

  const { data } = await response.json();
  return data;
}

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => fetchProducts(filters),
    staleTime: 30_000, // 30 seconds
    placeholderData: (prev) => prev,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => fetchProduct(slug),
    enabled: !!slug,
    staleTime: 60_000, // 1 minute
  });
}

export function useInfiniteProducts(filters: Omit<ProductFilters, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: ['products-infinite', filters],
    queryFn: ({ pageParam = 1 }) =>
      fetchProducts({ ...filters, page: pageParam as number, limit: 12 }),
    getNextPageParam: (lastPage, allPages) => {
      const currentPage = allPages.length;
      const totalPages = Math.ceil(lastPage.total / 12);
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 30_000,
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ['products-featured'],
    queryFn: () => fetchProducts({ is_featured: true, limit: 8 }),
    staleTime: 5 * 60_000, // 5 minutes
  });
}

export function useSellerProducts(sellerId: string) {
  return useQuery({
    queryKey: ['products-seller', sellerId],
    queryFn: async (): Promise<ProductWithImages[]> => {
      const response = await fetch(`/api/products?seller_id=${sellerId}`);
      if (!response.ok) throw new Error('Failed to fetch seller products');
      const { data } = await response.json();
      return data;
    },
    enabled: !!sellerId,
  });
}

export function useRelatedProducts(
  productId: string,
  gemstoneType: string,
  categoryId?: string
) {
  return useQuery({
    queryKey: ['products-related', productId, gemstoneType],
    queryFn: async (): Promise<ProductWithImages[]> => {
      const params = new URLSearchParams({
        gemstone_type: gemstoneType,
        limit: '4',
        exclude: productId,
      });
      if (categoryId) params.set('category_id', categoryId);

      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) throw new Error('Failed to fetch related products');
      const { data } = await response.json();
      return data;
    },
    enabled: !!productId && !!gemstoneType,
  });
}
