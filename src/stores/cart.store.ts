'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, ProductWithImages } from '@/types';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  isLoading: boolean;
  addItem: (product: ProductWithImages, quantity?: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  get subtotal(): number;
  get itemCount(): number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      isLoading: false,

      get subtotal() {
        return get().items.reduce((total, item) => {
          const price = item.products?.price ?? 0;
          return total + price * item.quantity;
        }, 0);
      },

      get itemCount() {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      fetchCart: async () => {
        const supabase = getSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          set({ items: [] });
          return;
        }

        set({ isLoading: true });

        try {
          const { data, error } = await supabase
            .from('cart_items')
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
          set({ items: (data as CartItem[]) ?? [] });
        } catch (err) {
          console.error('Failed to fetch cart:', err);
        } finally {
          set({ isLoading: false });
        }
      },

      addItem: async (product: ProductWithImages, quantity = 1) => {
        const supabase = getSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          // Store in local state for guest users
          set((state) => {
            const existing = state.items.find(
              (item) => item.product_id === product.id
            );
            if (existing) {
              return {
                items: state.items.map((item) =>
                  item.product_id === product.id
                    ? { ...item, quantity: item.quantity + quantity }
                    : item
                ),
              };
            }
            const newItem: CartItem = {
              id: crypto.randomUUID(),
              user_id: 'guest',
              product_id: product.id,
              quantity,
              created_at: new Date().toISOString(),
              products: product,
            };
            return { items: [...state.items, newItem] };
          });
          return;
        }

        set({ isLoading: true });

        try {
          // Upsert cart item
          const { error } = await supabase
            .from('cart_items')
            .upsert(
              {
                user_id: user.id,
                product_id: product.id,
                quantity,
              },
              {
                onConflict: 'user_id,product_id',
                ignoreDuplicates: false,
              }
            );

          if (error) throw error;

          // Update local state optimistically
          set((state) => {
            const existing = state.items.find(
              (item) => item.product_id === product.id
            );
            if (existing) {
              return {
                items: state.items.map((item) =>
                  item.product_id === product.id
                    ? { ...item, quantity: item.quantity + quantity }
                    : item
                ),
              };
            }
            const newItem: CartItem = {
              id: crypto.randomUUID(),
              user_id: user.id,
              product_id: product.id,
              quantity,
              created_at: new Date().toISOString(),
              products: product,
            };
            return { items: [...state.items, newItem] };
          });
        } catch (err) {
          console.error('Failed to add to cart:', err);
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      removeItem: async (productId: string) => {
        const supabase = getSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Optimistic update
        set((state) => ({
          items: state.items.filter((item) => item.product_id !== productId),
        }));

        if (!user) return;

        try {
          const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', user.id)
            .eq('product_id', productId);

          if (error) throw error;
        } catch (err) {
          console.error('Failed to remove from cart:', err);
          // Revert on error
          await get().fetchCart();
        }
      },

      updateQuantity: async (productId: string, quantity: number) => {
        const supabase = getSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (quantity <= 0) {
          await get().removeItem(productId);
          return;
        }

        // Optimistic update
        set((state) => ({
          items: state.items.map((item) =>
            item.product_id === productId ? { ...item, quantity } : item
          ),
        }));

        if (!user) return;

        try {
          const { error } = await supabase
            .from('cart_items')
            .update({ quantity })
            .eq('user_id', user.id)
            .eq('product_id', productId);

          if (error) throw error;
        } catch (err) {
          console.error('Failed to update quantity:', err);
          await get().fetchCart();
        }
      },

      clearCart: async () => {
        const supabase = getSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();

        set({ items: [] });

        if (!user) return;

        try {
          const { error } = await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', user.id);

          if (error) throw error;
        } catch (err) {
          console.error('Failed to clear cart:', err);
        }
      },
    }),
    {
      name: 'gemvault-cart',
      // Only persist guest cart items (authenticated cart is in DB)
      partialize: (state) => ({
        items: state.items.filter((item) => item.user_id === 'guest'),
      }),
    }
  )
);
