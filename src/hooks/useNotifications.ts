'use client';

import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth.store';
import { useUIStore } from '@/stores/ui.store';
import type { Notification } from '@/types';

export function useNotifications() {
  const supabase = getSupabaseBrowserClient();
  const { user, isAuthenticated } = useAuthStore();
  const { addToast } = useUIStore();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async (): Promise<Notification[]> => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data as Notification[]) ?? [];
    },
    enabled: isAuthenticated,
  });

  // Supabase Realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          queryClient.setQueryData<Notification[]>(
            ['notifications', user.id],
            (old) => [newNotification, ...(old ?? [])]
          );
          addToast({
            title: newNotification.title,
            description: newNotification.message,
            variant: 'default',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: (_, id) => {
      queryClient.setQueryData<Notification[]>(
        ['notifications', user?.id],
        (old) =>
          old?.map((n) => (n.id === id ? { ...n, is_read: true } : n)) ?? []
      );
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user!.id)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.setQueryData<Notification[]>(
        ['notifications', user?.id],
        (old) => old?.map((n) => ({ ...n, is_read: true })) ?? []
      );
    },
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    isLoading,
    unreadCount,
    markAsRead: markAsReadMutation.mutate,
    markAllRead: markAllReadMutation.mutate,
  };
}
