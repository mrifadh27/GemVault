'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, X, Users, Gem, SlidersHorizontal, Bell, Play, Layers } from 'lucide-react';
import { useInfinitePosts } from '@/hooks/usePosts';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Avatar } from '@/components/common/Avatar';
import { AdvancedFilters } from '@/components/explore/AdvancedFilters';
import { WatchlistButton } from '@/components/watchlist/WatchlistButton';
import { cn, getImageUrl, formatNumber } from '@/lib/utils';
import { ToastContainer } from '@/components/common/Toast';
import Link from 'next/link';
import type { Profile, PostFilters } from '@/types';
import { CheckCircle } from 'lucide-react';

const SORT_OPTIONS = [
  { value: 'newest',    label: '🕐 Newest' },
  { value: 'popular',   label: '❤️ Popular' },
  { value: 'price_asc', label: '💰 Low Price' },
  { value: 'price_desc',label: '💎 High Price' },
];

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
          <div className="flex-1 space-y-2"><div className="h-3 skeleton rounded w-32" /><div className="h-2 skeleton rounded w-20" /></div>
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
        <Link key={person.id} href={`/profile/${person.username}`} className="flex items-center gap-3 px-4 py-3 hover:bg-[#0f0f0f] transition-colors">
          <Avatar src={person.avatar_url} username={person.username} size="md" ring={person.is_verified} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-ivory">@{person.username}</span>
              {person.is_verified && <CheckCircle className="w-3.5 h-3.5 text-gold" fill="currentColor" />}
            </div>
            {person.full_name && <p className="text-xs text-ivory-muted truncate">{person.full_name}</p>}
            <p className="text-[10px] text-ivory-subtle mt-0.5">
              {formatNumber(person.followers_count)} followers · {formatNumber(person.total_posts)} posts
            </p>
          </div>
          {person.location && <span className="text-xs text-ivory-subtle flex-shrink-0">📍 {person.location}</span>}
        </Link>
      ))}
    </div>
  );
}

function GemsResults({ query, filters, setFilters }: {
  query: string;
  filters: PostFilters;
  setFilters: (f: PostFilters) => void;
}) {
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfinitePosts({
    search: query || undefined,
    ...filters,
  });

  const posts = data?.pages.flatMap(p => p.data) ?? [];
  const activeFiltersCount = Object.keys(filters).filter(k => !['sort','page','limit'].includes(k) && (filters as Record<string,unknown>)[k]).length;

  return (
    <>
      {/* Sort + filter bar */}
      <div className="flex items-center gap-2 px-3 py-2 overflow-x-auto border-b border-[#111]" style={{ scrollbarWidth: 'none' }}>
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilters({ ...filters, sort: opt.value as PostFilters['sort'] })}
            className={cn('cat-tab flex-shrink-0', filters.sort === opt.value ? 'cat-tab-active' : 'cat-tab-inactive')}
          >
            {opt.label}
          </button>
        ))}
        <div className="flex-shrink-0 ml-auto flex items-center gap-2">
          <WatchlistButton currentFilters={filters} />
          <button
            onClick={() => setShowFilters(true)}
            className={cn(
              'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all flex-shrink-0',
              activeFiltersCount > 0
                ? 'bg-gold/20 border-gold/40 text-gold'
                : 'border-[#2a2a2a] text-ivory-muted hover:border-gold/30',
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters{activeFiltersCount > 0 && ` (${activeFiltersCount})`}
          </button>
        </div>
      </div>

      {/* Active filter chips */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-1.5 px-3 py-2 border-b border-[#111]">
          {Object.entries(filters).map(([key, val]) => {
            if (!val || ['sort','page','limit'].includes(key)) return null;
            const label = key === 'gemstone_type' ? val : key === 'max_price' ? `≤$${Number(val).toLocaleString()}` : key === 'min_carat' ? `≥${val}ct` : key === 'max_carat' ? `≤${val}ct` : key === 'has_video' ? '📹 Video' : key === 'is_lot' ? '🪨 Lot' : String(val);
            return (
              <button
                key={key}
                onClick={() => { const f = { ...filters }; delete (f as Record<string,unknown>)[key]; setFilters(f); }}
                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] text-ivory-muted hover:border-red-400/30 hover:text-red-400 transition-colors"
              >
                {label} <X className="w-2.5 h-2.5" />
              </button>
            );
          })}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-0.5 sm:grid-cols-3">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ aspectRatio: '1/1' }} />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="py-20 text-center px-4">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="font-serif text-xl text-ivory mb-2">No gems found</h3>
          <p className="text-sm text-ivory-muted">{query ? `No gems found for "${query}"` : 'Try adjusting your filters'}</p>
          {activeFiltersCount > 0 && (
            <button onClick={() => setFilters({ sort: filters.sort })} className="btn-outline mt-3 rounded-full px-4 py-2 text-xs">
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-0.5 sm:grid-cols-3">
            {posts.map(post => {
              const img = post.gem_images?.find((i: { is_primary: boolean }) => i.is_primary) ?? post.gem_images?.[0];
              return (
                <Link key={post.id} href={`/post/${post.id}`} className="relative overflow-hidden group" style={{ aspectRatio: '1/1' }}>
                  {img ? (
                    <img src={getImageUrl(img.url)} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center"><span className="text-3xl opacity-30">💎</span></div>
                  )}
                  {/* Indicators */}
                  <div className="absolute top-1.5 left-1.5 flex gap-1">
                    {post.is_sold && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/90 text-white">SOLD</span>}
                    {post.video_url && <span className="text-[9px] font-bold px-1 py-0.5 rounded-full bg-black/70 text-white"><Play className="w-2.5 h-2.5 inline" /></span>}
                    {post.is_lot && <span className="text-[9px] font-bold px-1 py-0.5 rounded-full bg-blue-500/80 text-white"><Layers className="w-2.5 h-2.5 inline" /></span>}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white text-xs font-semibold line-clamp-1">{post.title}</p>
                      {post.price && <p className="text-gold text-xs font-bold">${Math.round(post.price).toLocaleString()}</p>}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          {hasNextPage && (
            <div className="flex justify-center py-6">
              <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} className="btn-outline rounded-full px-6 py-2 text-sm">
                {isFetchingNextPage ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}

      {showFilters && <AdvancedFilters filters={filters} onChange={setFilters} onClose={() => setShowFilters(false)} />}
    </>
  );
}

export default function ExploreClient() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || searchParams.get('search') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [activeTab, setActiveTab] = useState<'gems' | 'people'>('gems');
  const [filters, setFilters] = useState<PostFilters>(() => {
    const initial: PostFilters = { sort: 'newest' };
    const origin = searchParams.get('origin_country');
    const gemType = searchParams.get('gemstone_type');
    if (origin) initial.origin_country = origin;
    if (gemType) initial.gemstone_type = gemType;
    return initial;
  });
  const inputRef = useRef<HTMLInputElement>(null);

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
            placeholder={activeTab === 'people' ? 'Search sellers…' : 'Search gems, rubies, sapphires…'}
            className="input pl-10 pr-9"
            autoFocus
          />
          {query && (
            <button onClick={() => { setQuery(''); inputRef.current?.focus(); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-ivory-subtle hover:text-ivory">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2 mt-2">
          <button
            onClick={() => setActiveTab('gems')}
            className={cn('flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all', activeTab === 'gems' ? 'bg-gold text-obsidian border-gold' : 'border-[#2a2a2a] text-ivory-muted hover:border-[#444]')}
          >
            <Gem className="w-3.5 h-3.5" /> Gems
          </button>
          <button
            onClick={() => setActiveTab('people')}
            className={cn('flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all', activeTab === 'people' ? 'bg-gold text-obsidian border-gold' : 'border-[#2a2a2a] text-ivory-muted hover:border-[#444]')}
          >
            <Users className="w-3.5 h-3.5" /> People
          </button>
        </div>
      </div>

      {activeTab === 'gems' ? (
        <GemsResults query={debouncedQuery} filters={filters} setFilters={setFilters} />
      ) : (
        <PeopleResults query={debouncedQuery} />
      )}
    </main>
  );
}
