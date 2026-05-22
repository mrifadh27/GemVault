'use client';

import { useState } from 'react';
import { Bell, BellOff, X, Check } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/common/Toast';
import { cn } from '@/lib/utils';
import type { PostFilters, SavedSearch } from '@/types';

interface WatchlistButtonProps {
  currentFilters: PostFilters;
}

export function WatchlistButton({ currentFilters }: WatchlistButtonProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');

  const { data: savedSearches = [] } = useQuery<SavedSearch[]>({
    queryKey: ['watchlist'],
    queryFn: async () => {
      const res = await fetch('/api/watchlist');
      if (!res.ok) return [];
      const { data } = await res.json();
      return data;
    },
    enabled: !!user,
  });

  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || buildDefaultName(currentFilters),
          filters: currentFilters,
          notify_push: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['watchlist'] });
      toast('Search saved! You\'ll be notified of new matches. 🔔', 'success');
      setShowForm(false);
      setName('');
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/watchlist?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['watchlist'] });
      toast('Watchlist alert removed', 'info');
    },
  });

  const hasActiveFilters = Object.keys(currentFilters).some(
    k => !['sort', 'page', 'limit'].includes(k) && (currentFilters as Record<string, unknown>)[k],
  );

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setShowForm(v => !v)}
        className={cn(
          'flex items-center gap-1.5 text-xs px-3 py-2 rounded-full border transition-all',
          showForm
            ? 'bg-gold/20 border-gold/40 text-gold'
            : 'border-[#2a2a2a] text-ivory-muted hover:border-gold/30 hover:text-gold',
        )}
      >
        <Bell className="w-3.5 h-3.5" />
        <span>Watchlist</span>
        {savedSearches.length > 0 && (
          <span className="bg-gold/30 text-gold text-[9px] px-1.5 rounded-full">{savedSearches.length}</span>
        )}
      </button>

      {showForm && (
        <div className="absolute right-0 top-10 z-30 w-72 bg-[#111] border border-[#222] rounded-2xl shadow-2xl overflow-hidden">
          {/* Save current search */}
          {hasActiveFilters && (
            <div className="p-3 border-b border-[#1e1e1e]">
              <p className="text-xs text-ivory-muted mb-2">Save current filters as alert</p>
              <div className="flex gap-2">
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={buildDefaultName(currentFilters)}
                  className="input flex-1 text-xs py-1.5"
                  onKeyDown={e => { if (e.key === 'Enter') save.mutate(); }}
                />
                <button
                  onClick={() => save.mutate()}
                  disabled={save.isPending}
                  className="btn-gold px-3 py-1.5 text-xs rounded-lg"
                >
                  <Bell className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Saved searches list */}
          {savedSearches.length > 0 ? (
            <div className="max-h-48 overflow-y-auto">
              {savedSearches.map(s => (
                <div key={s.id} className="flex items-center justify-between px-3 py-2 hover:bg-[#1a1a1a] transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-ivory truncate">{s.name}</p>
                    <p className="text-[10px] text-ivory-subtle truncate">{buildFilterSummary(s.filters)}</p>
                  </div>
                  <button
                    onClick={() => remove.mutate(s.id)}
                    className="w-6 h-6 flex items-center justify-center text-ivory-subtle hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-3 py-4 text-center">
              <BellOff className="w-5 h-5 text-ivory-subtle mx-auto mb-1" />
              <p className="text-xs text-ivory-subtle">No saved alerts yet.</p>
              {!hasActiveFilters && <p className="text-[10px] text-ivory-subtle mt-1">Set some filters first.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function buildDefaultName(filters: PostFilters): string {
  const parts: string[] = [];
  if (filters.gemstone_type) parts.push(filters.gemstone_type);
  if (filters.origin_country) parts.push(filters.origin_country);
  if (filters.treatment && filters.treatment !== 'None') parts.push(filters.treatment);
  if (filters.min_carat || filters.max_carat) {
    parts.push(`${filters.min_carat ?? '0'}–${filters.max_carat ?? '∞'}ct`);
  }
  if (filters.max_price) parts.push(`under $${filters.max_price.toLocaleString()}`);
  return parts.length ? parts.join(' ') : 'My Search';
}

function buildFilterSummary(filters: PostFilters): string {
  const parts: string[] = [];
  if (filters.gemstone_type) parts.push(filters.gemstone_type);
  if (filters.certification && filters.certification !== 'None') parts.push(filters.certification);
  if (filters.treatment && filters.treatment !== 'None') parts.push(filters.treatment);
  if (filters.max_price) parts.push(`≤$${filters.max_price.toLocaleString()}`);
  return parts.join(' · ') || 'All gems';
}
