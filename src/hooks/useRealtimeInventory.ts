'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

interface InventoryUpdate {
  productId: string;
  stockQuantity: number;
  updatedAt: string;
}

export function useRealtimeInventory(productId: string) {
  const supabase = getSupabaseBrowserClient();
  const [stockQuantity, setStockQuantity] = useState<number | null>(null);
  const [viewerCount, setViewerCount] = useState(1);

  useEffect(() => {
    if (!productId) return;

    // Listen for stock changes via Realtime
    const inventoryChannel = supabase
      .channel(`inventory:${productId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: `id=eq.${productId}`,
        },
        (payload) => {
          const updated = payload.new as { stock_quantity: number; updated_at: string };
          setStockQuantity(updated.stock_quantity);
        }
      )
      .subscribe();

    // Presence channel for viewer count
    const presenceChannel = supabase.channel(`presence:product:${productId}`, {
      config: { presence: { key: crypto.randomUUID() } },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        setViewerCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ product_id: productId, joined_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(inventoryChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [productId]);

  return { stockQuantity, viewerCount };
}

export function useRealtimeMultipleInventory(productIds: string[]) {
  const supabase = getSupabaseBrowserClient();
  const [inventory, setInventory] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!productIds.length) return;

    const channel = supabase
      .channel('inventory-bulk')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
        },
        (payload) => {
          const updated = payload.new as { id: string; stock_quantity: number };
          if (productIds.includes(updated.id)) {
            setInventory((prev) => ({
              ...prev,
              [updated.id]: updated.stock_quantity,
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [productIds.join(',')]);

  return inventory;
}
