'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, X, Users, Gem } from 'lucide-react';
import { useInfinitePosts } from '@/hooks/usePosts';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Avatar } from '@/components/common/Avatar';
import { cn, getImageUrl, formatNumber } from '@/lib/utils';
import { ToastContainer } from '@/components/common/Toast';
import Link from 'next/link';
import type { Profile } from '@/types';
import { CheckCircle } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'newest',    label: '🕐 Newest' },
  { value: 'popular',   label: '❤️ Popular' },
  { value: 'price_asc', label: '💰 Low Price' },
  { value: 'price_desc',label: '💎 High Price' },
];

// ── People search ─────────────────────────────────────────────────────────────
function PeopleResults({ query }: { query: string }) {
  const [people, setPeople] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setPeople([]); return; }
    setLoading(true);
    const controller = new AbortController();

    fetch(`/api/profile?search=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then(r => r.json())
      .then(({ data }) => { setPeople(data || []); setLoading(false); })
      .catch(() => setLoading(false));

    return () => controller.abort();
  }, [query]);

  if (loading) return (
    <div className="space-y-3 px-4 py-4">
      {[1,2,3].map(i => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <div className="w-12 h-12 rounded-full skeleton flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 skeleton rounded w-32" />
            <div className="h-2 skeleton rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  );

  if (!query.trim()) return (
    <div className="py-20 text-center px-4">
      <Users className="w-10 h-10 text-[#333] mx-auto mb-3" />
      <p className="text-sm text-ivory-muted">Search for gem sellers and collectors</p>
    </div>
  );

  if (people.length === 0) return (
    <div className="py-20 text-center px-4">
      <div className="text-5xl mb-4">👤</div>
      <p className="text-sm text-ivory-muted">No people found for &quot;{query}&quot;</p>
    </div>
  );

  return (
    <div className="divide-y divide-[#111]">
      {people.map(person => (
        <Link
          key={person.id}
          href={`/profile/${person.username}`}
          className="flex items-center gap-3 px-4 py-3 hover:bg-[#0f0f0f] transition-colors"
        >
          <Avatar src={person.avatar_url} username={person.username} size="md" ring={person.is_verified} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-ivory">@{person.username}</span>
              {person.is_verified && <CheckCircle className="w-3.5 h-3.5 text-gold" fill="currentColor" />}
            </div>
            {person.full_name && (
              <p className="text-xs text-ivory-muted truncate">{person.full_name}</p>
            )}
            <p className="text-[10px] text-ivory-subtle mt-0.5">
              {formatNumber(person.followers_count)} followers · {formatNumber(person.total_posts)} posts
            </p>
          </div>
          {person.location && (
            <span className="text-xs text-ivory-subtle flex-shrink-0">📍 {person.location}</span>
          )}
        </Link>
      ))}
    </div>
  );
}

// ── Gems grid ─────────────────────────────────────────────────────────────────
function GemsResults({ query, sort, setSort }: {
  query: string;
  sort: 'newest' | 'popular' | 'price_asc' | 'price_desc';
  setSort: (s: 'newest' | 'popular' | 'price_asc' | 'price_desc') => void;
}) {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfinitePosts({
    search: query || undefined,
    sort,
  });

  const posts = data?.pages.flatMap(p => p.data) ?? [];

  return (
    <>
      {/* Sort chips */}
      <div className="flex gap-2 px-3 py-2 overflow-x-auto border-b border-[#111]" style={{ scrollbarWidth: 'none' }}>
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setSort(opt.value as typeof sort)}
            className={cn('cat-tab flex-shrink-0', sort === opt.value ? 'cat-tab-active' : 'cat-tab-inactive')}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-0.5 sm:grid-cols-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="skeleton" style={{ aspectRatio: '1/1' }} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="py-20 text-center px-4">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="font-serif text-xl text-ivory mb-2">No gems found</h3>
          <p className="text-sm text-ivory-muted">
            {query ? `No gems found for "${query}"` : 'Start searching for gems'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-0.5 sm:grid-cols-3">
            {posts.map(post => {
              const img = post.gem_images?.find((i: { is_primary: boolean }) => i.is_primary) ?? post.gem_images?.[0];
              return (
                <Link
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="relative overflow-hidden group"
                  style={{ aspectRatio: '1/1' }}
                >
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getImageUrl(img.url)}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center">
                      <span className="text-3xl opacity-30">💎</span>
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white text-xs font-semibold line-clamp-1">{post.title}</p>
                      {post.price && (
                        <p className="text-gold text-xs font-bold">${Math.round(post.price).toLocaleString()}</p>
                      )}
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
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="btn-outline rounded-full px-6 py-2 text-sm"
              >
                {isFetchingNextPage ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

// ── Main ExploreClient ────────────────────────────────────────────────────────
export default function ExploreClient() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [sort, setSort] = useState<'newest' | 'popular' | 'price_asc' | 'price_desc'>('newest');
  const [activeTab, setActiveTab] = useState<'gems' | 'people'>('gems');
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <main className="pt-14 pb-20 sm:pb-8 max-w-2xl mx-auto">
      <ToastContainer />

      {/* Sticky search bar */}
      <div className="sticky top-14 z-30 bg-obsidian/95 backdrop-blur-md px-3 py-3 border-b border-[#1a1a1a]">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-subtle" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={activeTab === 'people' ? 'Search sellers by name or @username...' : 'Search gems, rubies, sapphires...'}
            className="input pl-10 pr-9"
            autoFocus
          />
          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ivory-subtle hover:text-ivory"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Gems / People tab pills */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => setActiveTab('gems')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all',
              activeTab === 'gems'
                ? 'bg-gold text-obsidian border-gold'
                : 'border-[#2a2a2a] text-ivory-muted hover:border-[#444] hover:text-ivory'
            )}
          >
            <Gem className="w-3.5 h-3.5" /> Gems
          </button>
          <button
            onClick={() => setActiveTab('people')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all',
              activeTab === 'people'
                ? 'bg-gold text-obsidian border-gold'
                : 'border-[#2a2a2a] text-ivory-muted hover:border-[#444] hover:text-ivory'
            )}
          >
            <Users className="w-3.5 h-3.5" /> People
          </button>
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'gems' ? (
        <GemsResults query={debouncedQuery} sort={sort} setSort={setSort} />
      ) : (
        <PeopleResults query={debouncedQuery} />
      )}
    </main>
  );
}