'use client';

import { useState } from 'react';
import { Eye, Heart, MessageCircle, TrendingUp, Package, Star, Bookmark, DollarSign } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn, formatNumber, formatRelativeDate } from '@/lib/utils';
import Link from 'next/link';

interface MiniChartProps { data: { date: string; views: number }[]; }

function MiniChart({ data }: MiniChartProps) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.views), 1);
  const last7 = data.slice(-7);

  return (
    <div className="flex items-end gap-0.5 h-12">
      {last7.map((d, i) => (
        <div
          key={i}
          title={`${d.date}: ${d.views} views`}
          className="flex-1 rounded-t-sm bg-gold/40 hover:bg-gold/70 transition-colors cursor-default"
          style={{ height: `${Math.max(4, (d.views / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

interface SellerAnalyticsDashboardProps { sellerId: string; }

export function SellerAnalyticsDashboard({ sellerId }: SellerAnalyticsDashboardProps) {
  const [period, setPeriod] = useState<'7d' | '30d' | 'all'>('30d');

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', sellerId],
    queryFn: async () => {
      const res = await fetch(`/api/analytics?seller_id=${sellerId}`);
      if (!res.ok) throw new Error('Failed');
      const { data } = await res.json();
      return data;
    },
    staleTime: 5 * 60_000,
  });

  if (isLoading) return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-20 skeleton rounded-xl" />)}
    </div>
  );

  if (!data) return null;

  const stats = [
    { label: 'Total Views', value: data.total_views, icon: Eye, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Total Likes', value: data.total_likes, icon: Heart, color: 'text-red-400', bg: 'bg-red-400/10' },
    { label: 'DMs Received', value: data.total_dms, icon: MessageCircle, color: 'text-gold', bg: 'bg-gold/10' },
    { label: 'Offers', value: data.total_offers, icon: DollarSign, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: 'Active Listings', value: data.active_listings, icon: Package, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'Gems Sold', value: data.sold_listings, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Times Saved', value: data.saved_count, icon: Bookmark, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'Engagement', value: `${data.engagement_rate}%`, icon: Star, color: 'text-gold', bg: 'bg-gold/10' },
  ];

  return (
    <div className="space-y-5">
      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', bg)}>
                <Icon className={cn('w-3.5 h-3.5', color)} />
              </div>
              <span className="text-[10px] text-ivory-subtle uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-xl font-semibold text-ivory">
              {typeof value === 'number' ? formatNumber(value) : value}
            </p>
          </div>
        ))}
      </div>

      {/* Views chart */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-ivory">Views (last 7 days)</p>
          <Eye className="w-4 h-4 text-ivory-muted" />
        </div>
        <MiniChart data={data.views_by_day} />
        <div className="flex justify-between text-[9px] text-ivory-subtle mt-1">
          <span>{data.views_by_day?.[data.views_by_day.length - 7]?.date?.slice(5)}</span>
          <span>Today</span>
        </div>
      </div>

      {/* Top posts */}
      {data.top_posts?.length > 0 && (
        <div className="card p-4">
          <p className="text-sm font-medium text-ivory mb-3">Top Performing Listings</p>
          <div className="space-y-2">
            {data.top_posts.map((p: { id: string; title: string; views: number; likes: number }, i: number) => (
              <Link
                key={p.id}
                href={`/post/${p.id}`}
                className="flex items-center gap-3 hover:bg-[#1a1a1a] rounded-lg p-2 -mx-2 transition-colors"
              >
                <span className="text-xs font-bold text-ivory-subtle w-4">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ivory truncate">{p.title}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="flex items-center gap-1 text-[10px] text-ivory-subtle">
                    <Eye className="w-3 h-3" />{formatNumber(p.views)}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-ivory-subtle">
                    <Heart className="w-3 h-3" />{formatNumber(p.likes)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Reviews summary */}
      {data.reviews?.length > 0 && (
        <div className="card p-4">
          <p className="text-sm font-medium text-ivory mb-2">Recent Reviews</p>
          <div className="space-y-2">
            {data.reviews.slice(0, 3).map((r: { rating: number; review_text: string; created_at: string }, i: number) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={cn('w-3 h-3', s <= r.rating ? 'text-gold fill-gold' : 'text-[#333]')} />
                  ))}
                </div>
                {r.review_text && <p className="text-xs text-ivory-muted line-clamp-1 flex-1">{r.review_text}</p>}
                <span className="text-[10px] text-ivory-subtle flex-shrink-0">{formatRelativeDate(r.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
