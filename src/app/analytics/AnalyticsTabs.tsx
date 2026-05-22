'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { SellerAnalyticsDashboard } from '@/components/analytics/SellerAnalytics';
import { MarketTrends } from '@/components/analytics/MarketTrends';

export default function AnalyticsTabs({ sellerId }: { sellerId: string }) {
  const [tab, setTab] = useState<'mine' | 'market'>('mine');

  return (
    <div>
      <div className="flex bg-[#111] rounded-xl p-1 mb-5">
        {([['mine', 'My Listings'], ['market', 'Market Trends']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex-1 text-sm py-2 rounded-lg transition-all font-medium',
              tab === key ? 'bg-[#1e1e1e] text-ivory' : 'text-ivory-muted hover:text-ivory',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'mine' && <SellerAnalyticsDashboard sellerId={sellerId} />}
      {tab === 'market' && <MarketTrends />}
    </div>
  );
}
