'use client';

import { useQuery } from '@tanstack/react-query';
import type { SellerAnalytics, OrderWithItems, ProductWithImages } from '@/types';
import { useAuthStore } from '@/stores/auth.store';

async function fetchSellerAnalytics(): Promise<SellerAnalytics> {
  const response = await fetch('/api/seller/analytics');
  if (!response.ok) throw new Error('Failed to fetch analytics');
  const { data } = await response.json();
  return data;
}

async function fetchSellerOrders(): Promise<OrderWithItems[]> {
  const response = await fetch('/api/orders?role=seller');
  if (!response.ok) throw new Error('Failed to fetch seller orders');
  const { data } = await response.json();
  return data ?? [];
}

async function fetchSellerListings(): Promise<ProductWithImages[]> {
  const response = await fetch('/api/products?own=true');
  if (!response.ok) throw new Error('Failed to fetch listings');
  const { data } = await response.json();
  return data ?? [];
}

async function fetchSellerPayouts() {
  const response = await fetch('/api/seller/payouts');
  if (!response.ok) throw new Error('Failed to fetch payouts');
  const { data } = await response.json();
  return data ?? [];
}

export function useSellerAnalytics() {
  const { user, sellerProfile } = useAuthStore();

  return useQuery({
    queryKey: ['seller-analytics', user?.id],
    queryFn: fetchSellerAnalytics,
    enabled: !!sellerProfile,
    staleTime: 5 * 60_000, // 5 minutes
  });
}

export function useSellerOrders() {
  const { user, sellerProfile } = useAuthStore();

  return useQuery({
    queryKey: ['seller-orders', user?.id],
    queryFn: fetchSellerOrders,
    enabled: !!sellerProfile,
    staleTime: 30_000,
  });
}

export function useSellerListings() {
  const { user, sellerProfile } = useAuthStore();

  return useQuery({
    queryKey: ['seller-listings', user?.id],
    queryFn: fetchSellerListings,
    enabled: !!sellerProfile,
    staleTime: 30_000,
  });
}

export function useSellerPayouts() {
  const { user, sellerProfile } = useAuthStore();

  return useQuery({
    queryKey: ['seller-payouts', user?.id],
    queryFn: fetchSellerPayouts,
    enabled: !!sellerProfile,
    staleTime: 5 * 60_000,
  });
}
