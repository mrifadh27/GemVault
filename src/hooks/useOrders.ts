'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { OrderWithItems, CreateOrderInput } from '@/types';
import { useAuthStore } from '@/stores/auth.store';
import { useUIStore } from '@/stores/ui.store';

async function fetchOrders(): Promise<OrderWithItems[]> {
  const response = await fetch('/api/orders');
  if (!response.ok) throw new Error('Failed to fetch orders');
  const { data } = await response.json();
  return data ?? [];
}

async function fetchOrder(id: string): Promise<OrderWithItems> {
  const response = await fetch(`/api/orders/${id}`);
  if (!response.ok) throw new Error('Failed to fetch order');
  const { data } = await response.json();
  return data;
}

async function createOrder(input: CreateOrderInput): Promise<OrderWithItems> {
  const response = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const { error } = await response.json();
    throw new Error(error ?? 'Failed to create order');
  }

  const { data } = await response.json();
  return data;
}

export function useOrders() {
  const { isAuthenticated, user } = useAuthStore();

  return useQuery({
    queryKey: ['orders', user?.id],
    queryFn: fetchOrders,
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useOrder(orderId: string) {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrder(orderId),
    enabled: isAuthenticated && !!orderId,
    staleTime: 15_000,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', user?.id] });
    },
    onError: (error: Error) => {
      addToast({
        title: 'Order failed',
        description: error.message,
        variant: 'error',
      });
    },
  });
}

export function useUpdateOrderItemStatus() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: async ({
      orderId,
      itemId,
      status,
      trackingNumber,
      trackingCarrier,
    }: {
      orderId: string;
      itemId: string;
      status: string;
      trackingNumber?: string;
      trackingCarrier?: string;
    }) => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: itemId,
          status,
          tracking_number: trackingNumber,
          tracking_carrier: trackingCarrier,
        }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error ?? 'Failed to update order');
      }

      return response.json();
    },
    onSuccess: (_, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      addToast({ title: 'Order updated', variant: 'success' });
    },
    onError: (error: Error) => {
      addToast({
        title: 'Update failed',
        description: error.message,
        variant: 'error',
      });
    },
  });
}
