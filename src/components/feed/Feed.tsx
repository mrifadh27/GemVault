'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { useInfinitePosts } from '@/hooks/usePosts';
import { PostCard } from './PostCard';
import { CategoryTabs } from './CategoryTabs';
import type { PostFilters } from '@/types';

export function Feed() {
  const [filters, setFilters] = useState<Omit<PostFilters, 'page'>>({ sort: 'newest' });
  const [category, setCategory] = useState('all');
  const loaderRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfinitePosts(filters);

  const posts = data?.pages.flatMap(p => p.data) ?? [];

  // Intersection observer for infinite scroll
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage(); },
      { threshold: 0.1, rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleCategoryChange = (slug: string) => {
    setCategory(slug);
    setFilters(f => ({
      ...f,
      category: slug === 'all' ? undefined : slug,
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <CategoryTabs active={category} onChange={handleCategoryChange} />

      {/* Feed */}
      <div>
        {isLoading ? (
          /* Skeleton */
          <div className="divide-y divide-[#1a1a1a]">
            {[1, 2, 3].map(i => (
              <div key={i} className="pb-4 animate-pulse">
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <div className="w-8 h-8 rounded-full skeleton" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 skeleton rounded w-24" />
                    <div className="h-2 skeleton rounded w-16" />
                  </div>
                </div>
                <div className="skeleton" style={{ aspectRatio: '1/1' }} />
                <div className="px-3 py-3 space-y-2">
                  <div className="h-3 skeleton rounded w-2/3" />
                  <div className="h-2 skeleton rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <p className="text-ivory-muted mb-4">Something went wrong.</p>
            <button onClick={() => refetch()} className="btn-outline gap-2 rounded-full">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="text-5xl mb-4">💎</div>
            <h3 className="font-serif text-xl text-ivory mb-2">No gems yet</h3>
            <p className="text-sm text-ivory-muted">
              {category !== 'all' ? 'No posts in this category.' : 'Be the first to post a gem!'}
            </p>
          </div>
        ) : (
          <>
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}

            {/* Infinite scroll loader */}
            <div ref={loaderRef} className="flex justify-center py-8">
              {isFetchingNextPage && <Loader2 className="w-5 h-5 text-gold animate-spin" />}
              {!hasNextPage && posts.length > 0 && (
                <p className="text-xs text-ivory-subtle">You've seen all the gems ✨</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
