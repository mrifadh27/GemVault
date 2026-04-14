'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AdminStats } from '@/types';
import { useAuthStore } from '@/stores/auth.store';
import { useUIStore } from '@/stores/ui.store';

async function fetchAdminStats(): Promise<AdminStats> {
  const response = await fetch('/api/admin/stats');
  if (!response.ok) throw new Error('Failed to fetch admin stats');
  const { data } = await response.json();
  return data;
}

async function fetchAdminUsers(params?: Record<string, string>) {
  const qs = params ? new URLSearchParams(params).toString() : '';
  const response = await fetch(`/api/admin/users?${qs}`);
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
}

async function fetchAdminSellers(params?: Record<string, string>) {
  const qs = params ? new URLSearchParams(params).toString() : '';
  const response = await fetch(`/api/admin/sellers?${qs}`);
  if (!response.ok) throw new Error('Failed to fetch sellers');
  return response.json();
}

async function fetchAdminProducts(params?: Record<string, string>) {
  const qs = params ? new URLSearchParams(params).toString() : '';
  const response = await fetch(`/api/admin/products?${qs}`);
  if (!response.ok) throw new Error('Failed to fetch products');
  return response.json();
}

export function useAdminStats() {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['admin-stats', user?.id],
    queryFn: fetchAdminStats,
    enabled: user?.role === 'admin',
    staleTime: 5 * 60_000,
  });
}

export function useAdminUsers(params?: Record<string, string>) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => fetchAdminUsers(params),
    enabled: user?.role === 'admin',
    staleTime: 30_000,
  });
}

export function useAdminSellers(params?: Record<string, string>) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['admin-sellers', params],
    queryFn: () => fetchAdminSellers(params),
    enabled: user?.role === 'admin',
    staleTime: 30_000,
  });
}

export function useAdminProducts(params?: Record<string, string>) {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['admin-products', params],
    queryFn: () => fetchAdminProducts(params),
    enabled: user?.role === 'admin',
    staleTime: 30_000,
  });
}

export function useVerifySeller() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: async ({
      sellerId,
      status,
    }: {
      sellerId: string;
      status: 'approved' | 'rejected' | 'suspended';
    }) => {
      const response = await fetch(`/api/admin/sellers/${sellerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verification_status: status }),
      });

      if (!response.ok) throw new Error('Failed to update seller status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sellers'] });
      addToast({ title: 'Seller status updated', variant: 'success' });
    },
    onError: () => {
      addToast({ title: 'Failed to update seller', variant: 'error' });
    },
  });
}

export function useModerateProduct() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: async ({
      productId,
      isActive,
      isFeatured,
    }: {
      productId: string;
      isActive?: boolean;
      isFeatured?: boolean;
    }) => {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive, is_featured: isFeatured }),
      });

      if (!response.ok) throw new Error('Failed to update product');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      addToast({ title: 'Product updated', variant: 'success' });
    },
    onError: () => {
      addToast({ title: 'Failed to update product', variant: 'error' });
    },
  });
}
