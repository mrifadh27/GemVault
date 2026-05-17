'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useInfinitePosts } from '@/hooks/usePosts';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { cn, getImageUrl } from '@/lib/utils';
import { ToastContainer } from '@/components/common/Toast';
import Link from 'next/link';

const SORT_OPTIONS = [
  { value: 'newest', label: '🕐 Newest' },
  { value: 'popular', label: '❤️ Popular' },
  { value: 'price_asc', label: '💰 Price: Low' },
  { value: 'price_desc', label: '💎 Price: High' },
];

export default function ExploreClient() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [sort, setSort] = useState<'newest' | 'popular' | 'price_asc' | 'price_desc'>('newest');
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfinitePosts({
    search: debouncedQuery || undefined,
    sort,
  });

  const posts = data?.pages.flatMap(p => p.data) ?? [];

  return (
    <main className="pt-14 pb-20 sm:pb-8 max-w-2xl mx-auto">
      <ToastContainer />
      <div className="sticky top-14 z-30 bg-obsidian/95 backdrop-blur-md px-3 py-3 border-b border-[#1a1a1a]">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-subtle" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search gems, rubies, sapphires..." className="input pl-10 pr-9" autoFocus />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ivory-subtle hover:text-ivory">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2 mt-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {SORT_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => setSort(opt.value as typeof sort)}
              className={cn('cat-tab flex-shrink-0', sort === opt.value ? 'cat-tab-active' : 'cat-tab-inactive')}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-0.5 sm:grid-cols-3 mt-0">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ aspectRatio: '1/1' }} />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="py-20 text-center px-4">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="font-serif text-xl text-ivory mb-2">No results</h3>
          <p className="text-sm text-ivory-muted">
            {debouncedQuery ? `No gems found for "${debouncedQuery}"` : 'Start searching for gems'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-0.5 sm:grid-cols-3">
            {posts.map(post => {
              const img = post.gem_images?.find((i: { is_primary: boolean }) => i.is_primary) ?? post.gem_images?.[0];
              return (
                <Link key={post.id} href={`/post/${post.id}`} className="relative overflow-hidden group" style={{ aspectRatio: '1/1' }}>
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={getImageUrl(img.url)} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center">
                      <span className="text-3xl opacity-30">💎</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white text-xs font-semibold line-clamp-1">{post.title}</p>
                      {post.price && <p className="text-gold text-xs font-bold">${Math.round(post.price).toLocaleString()}</p>}
                    </div>
                  </div>
                  {post.is_sold && (
                    <div className="absolute top-1.5 left-1.5">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/90 text-white">SOLD</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
          {hasNextPage && (
            <div className="flex justify-center py-6">
              <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}
                className="btn-outline rounded-full px-6 py-2 text-sm">
                {isFetchingNextPage ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
