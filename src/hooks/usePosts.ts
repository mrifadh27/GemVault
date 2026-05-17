'use client';

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buildQueryString } from '@/lib/utils';
import type { GemPostWithDetails, PostFilters } from '@/types';

async function fetchPosts(filters: PostFilters): Promise<{ data: GemPostWithDetails[]; total: number; hasMore: boolean }> {
  const qs = buildQueryString(filters as Record<string, unknown>);
  const res = await fetch(`/api/posts?${qs}`);
  if (!res.ok) throw new Error('Failed to fetch posts');
  return res.json();
}

async function fetchPost(id: string): Promise<GemPostWithDetails> {
  const res = await fetch(`/api/posts/${id}`);
  if (!res.ok) throw new Error('Failed to fetch post');
  const { data } = await res.json();
  return data;
}

export function usePosts(filters: PostFilters = {}) {
  return useQuery({
    queryKey: ['posts', filters],
    queryFn: () => fetchPosts(filters),
    staleTime: 30_000,
    placeholderData: prev => prev,
  });
}

export function useInfinitePosts(filters: Omit<PostFilters, 'page'> = {}) {
  return useInfiniteQuery({
    queryKey: ['posts-infinite', filters],
    queryFn: ({ pageParam = 1 }) => fetchPosts({ ...filters, page: pageParam as number, limit: 10 }),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 30_000,
  });
}

export function usePost(id: string) {
  return useQuery({
    queryKey: ['post', id],
    queryFn: () => fetchPost(id),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, liked }: { postId: string; liked: boolean }) => {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: liked ? 'DELETE' : 'POST',
      });
      if (!res.ok) throw new Error('Failed to toggle like');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts-infinite'] });
      qc.invalidateQueries({ queryKey: ['posts'] });
      qc.invalidateQueries({ queryKey: ['post'] });
    },
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete post');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts-infinite'] });
      qc.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useMarkSold() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, sold }: { postId: string; sold: boolean }) => {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_sold: sold }),
      });
      if (!res.ok) throw new Error('Failed to update post');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['posts-infinite'] });
      qc.invalidateQueries({ queryKey: ['post'] });
    },
  });
}
