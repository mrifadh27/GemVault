'use client';

import { useEffect } from 'react';
import { useCartStore } from '@/stores/cart.store';
import { useAuthStore } from '@/stores/auth.store';
import { useUIStore } from '@/stores/ui.store';
import type { ProductWithImages } from '@/types';

export function useCart() {
  const cartStore = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const { addToast } = useUIStore();

  useEffect(() => {
    if (isAuthenticated) {
      cartStore.fetchCart();
    }
  }, [isAuthenticated]);

  const addToCart = async (product: ProductWithImages, quantity = 1) => {
    if (product.stock_quantity < quantity) {
      addToast({
        title: 'Insufficient stock',
        description: `Only ${product.stock_quantity} available`,
        variant: 'error',
      });
      return;
    }

    try {
      await cartStore.addItem(product, quantity);
      cartStore.openCart();
      addToast({
        title: 'Added to cart',
        description: `${product.name} has been added to your cart`,
        variant: 'success',
      });
    } catch (err) {
      addToast({
        title: 'Failed to add to cart',
        description: 'Please try again',
        variant: 'error',
      });
    }
  };

  const removeFromCart = async (productId: string) => {
    try {
      await cartStore.removeItem(productId);
      addToast({
        title: 'Removed from cart',
        variant: 'default',
      });
    } catch (err) {
      addToast({
        title: 'Failed to remove item',
        variant: 'error',
      });
    }
  };

  return {
    items: cartStore.items,
    subtotal: cartStore.subtotal,
    itemCount: cartStore.itemCount,
    isOpen: cartStore.isOpen,
    isLoading: cartStore.isLoading,
    addToCart,
    removeFromCart,
    updateQuantity: cartStore.updateQuantity,
    clearCart: cartStore.clearCart,
    toggleCart: cartStore.toggleCart,
    openCart: cartStore.openCart,
    closeCart: cartStore.closeCart,
  };
}
