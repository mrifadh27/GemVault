'use client';

import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import type { GemCategory } from '@/types';

interface CategoryTabsProps {
  active: string;
  onChange: (slug: string) => void;
}

async function fetchCategories(): Promise<GemCategory[]> {
  const res = await fetch('/api/categories');
  if (!res.ok) return [];
  const { data } = await res.json();
  return data;
}

export function CategoryTabs({ active, onChange }: CategoryTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 10 * 60_000,
  });

  return (
    <div className="sticky top-14 z-30 bg-obsidian/95 backdrop-blur-md border-b border-[#1a1a1a]">
      <div
        ref={scrollRef}
        className="flex gap-2 px-3 py-2.5 overflow-x-auto scrollbar-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map(cat => (
          <button
            key={cat.slug}
            onClick={() => onChange(cat.slug)}
            className={cn('cat-tab flex-shrink-0', active === cat.slug ? 'cat-tab-active' : 'cat-tab-inactive')}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
