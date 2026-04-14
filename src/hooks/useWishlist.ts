'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth.store';
import { useUIStore } from '@/stores/ui.store';
import type { WishlistItem } from '@/types';

export function useWishlist() {
  const supabase = getSupabaseBrowserClient();
  const { user, isAuthenticated } = useAuthStore();
  const { addToast } = useUIStore();
  const queryClient = useQueryClient();

  const { data: wishlistItems = [], isLoading } = useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn: async (): Promise<WishlistItem[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('wishlists')
        .select(`
          *,
          products (
            *,
            product_images (*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as WishlistItem[]) ?? [];
    },
    enabled: isAuthenticated,
  });

  const wishlistIds = new Set(wishlistItems.map((item) => item.product_id));

  const addMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('wishlists')
        .insert({ user_id: user.id, product_id: productId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', user?.id] });
      addToast({ title: 'Added to wishlist', variant: 'success' });
    },
    onError: () => {
      addToast({ title: 'Failed to add to wishlist', variant: 'error' });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', user?.id] });
      addToast({ title: 'Removed from wishlist', variant: 'default' });
    },
    onError: () => {
      addToast({ title: 'Failed to remove from wishlist', variant: 'error' });
    },
  });

  const toggleWishlist = useCallback(
    async (productId: string) => {
      if (!isAuthenticated) {
        addToast({
          title: 'Please sign in',
          description: 'Sign in to save items to your wishlist',
          variant: 'warning',
        });
        return;
      }

      if (wishlistIds.has(productId)) {
        await removeMutation.mutateAsync(productId);
      } else {
        await addMutation.mutateAsync(productId);
      }
    },
    [isAuthenticated, wishlistIds, addMutation, removeMutation]
  );

  const isWishlisted = useCallback(
    (productId: string) => wishlistIds.has(productId),
    [wishlistIds]
  );

  return {
    wishlistItems,
    isLoading,
    toggleWishlist,
    isWishlisted,
    isMutating: addMutation.isPending || removeMutation.isPending,
  };
}
