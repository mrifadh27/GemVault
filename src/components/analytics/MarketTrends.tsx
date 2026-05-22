'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart2, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn, formatPrice } from '@/lib/utils';

const GEM_TYPES = ['Ruby','Sapphire','Emerald','Diamond','Alexandrite','Spinel','Tanzanite','Opal','Tourmaline','Aquamarine'];

interface BarChartProps {
  data: { label: string; value: number; color?: string }[];
  maxValue?: number;
  unit?: string;
}

function HorizontalBarChart({ data, maxValue, unit = '' }: BarChartProps) {
  const max = maxValue ?? Math.max(...data.map(d => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map(({ label, value, color }) => (
        <div key={label} className="flex items-center gap-2">
          <span className="text-[10px] text-ivory-subtle w-28 truncate flex-shrink-0">{label}</span>
          <div className="flex-1 h-4 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.max(2, (value / max) * 100)}%`,
                background: color ?? 'linear-gradient(90deg, #B8960C, #D4AF37)',
              }}
            />
          </div>
          <span className="text-[10px] text-ivory w-20 text-right flex-shrink-0">
            {unit}{value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

interface LineChartProps { data: { week: string; avg_ppc: number }[]; color?: string; }

function LineChart({ data, color = '#D4AF37' }: LineChartProps) {
  if (!data || data.length < 2) return <p className="text-xs text-ivory-subtle text-center py-6">Not enough data yet</p>;

  const values = data.map(d => d.avg_ppc);
  const min = Math.min(...values);
  const max = Math.max(...values, min + 1);
  const range = max - min || 1;

  const W = 280, H = 80;
  const pad = 4;
  const points = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = H - pad - ((d.avg_ppc - min) / range) * (H - pad * 2);
    return `${x},${y}`;
  });

  const polyline = points.join(' ');
  const areaPath = `M${points[0]} L${points.join(' L')} L${W - pad},${H} L${pad},${H} Z`;

  const trend = values[values.length - 1] - values[0];

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-ivory-subtle">Weekly avg $/ct</span>
        <span className={cn('flex items-center gap-1 text-[10px] font-medium', trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-ivory-subtle')}>
          {trend > 0 ? <TrendingUp className="w-3 h-3" /> : trend < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {trend > 0 ? '+' : ''}{Math.round(trend)}/ct
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#grad-${color.replace('#','')})`} />
        <polyline points={polyline} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Latest dot */}
        {data.length > 0 && (
          <circle
            cx={W - pad}
            cy={H - pad - ((values[values.length - 1] - min) / range) * (H - pad * 2)}
            r="3"
            fill={color}
          />
        )}
      </svg>
      <div className="flex justify-between text-[9px] text-ivory-subtle mt-0.5">
        <span>{data[0]?.week?.slice(5)}</span>
        <span>{data[data.length - 1]?.week?.slice(5)}</span>
      </div>
    </div>
  );
}

export function MarketTrends() {
  const [selectedGem, setSelectedGem] = useState<string | null>(null);

  const { data: overview, isLoading } = useQuery({
    queryKey: ['market-trends-overview'],
    queryFn: async () => {
      const res = await fetch('/api/market-trends?days=90');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    staleTime: 10 * 60_000,
  });

  const { data: gemDetail } = useQuery({
    queryKey: ['market-trends-gem', selectedGem],
    queryFn: async () => {
      const res = await fetch(`/api/market-trends?gemstone_type=${encodeURIComponent(selectedGem!)}&days=90`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!selectedGem,
    staleTime: 5 * 60_000,
  });

  const summary = overview?.data?.summary || [];
  const origins = overview?.data?.origin_breakdown || [];
  const timeSeries = gemDetail?.data?.time_series?.[selectedGem!] || [];

  const GEM_COLORS: Record<string, string> = {
    Ruby: '#ef4444', Sapphire: '#3b82f6', Emerald: '#22c55e', Diamond: '#e2e8f0',
    Alexandrite: '#8b5cf6', Spinel: '#f97316', Tanzanite: '#6366f1', Opal: '#06b6d4',
    Tourmaline: '#ec4899', Aquamarine: '#0ea5e9',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <BarChart2 className="w-4 h-4 text-gold" />
        <h2 className="font-semibold text-ivory">Market Price Trends</h2>
      </div>

      {/* Gem type selector */}
      <div>
        <p className="text-xs text-ivory-muted mb-2 uppercase tracking-wider font-medium">Select Gem for Detail</p>
        <div className="flex flex-wrap gap-1.5">
          {GEM_TYPES.map(t => (
            <button
              key={t}
              onClick={() => setSelectedGem(prev => prev === t ? null : t)}
              className={cn(
                'text-xs px-3 py-1 rounded-full border transition-all',
                selectedGem === t
                  ? 'text-obsidian font-semibold'
                  : 'border-[#2a2a2a] text-ivory-muted hover:border-white/20',
              )}
              style={selectedGem === t ? { background: GEM_COLORS[t] || '#D4AF37', borderColor: GEM_COLORS[t] || '#D4AF37' } : {}}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Selected gem time-series chart */}
      {selectedGem && (
        <div className="card p-4">
          <p className="text-sm font-medium text-ivory mb-3">
            {selectedGem} — Price/Carat Trend (90 days)
          </p>
          <LineChart data={timeSeries} color={GEM_COLORS[selectedGem] || '#D4AF37'} />
        </div>
      )}

      {/* Overview bar chart */}
      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="h-8 skeleton rounded" />)}
        </div>
      ) : summary.length === 0 ? (
        <div className="card p-6 text-center">
          <BarChart2 className="w-8 h-8 text-ivory-subtle mx-auto mb-2" />
          <p className="text-sm text-ivory-muted">Not enough listings yet to show trends.</p>
          <p className="text-xs text-ivory-subtle mt-1">Post more gems with prices to build market data.</p>
        </div>
      ) : (
        <div className="card p-4">
          <p className="text-sm font-medium text-ivory mb-3">Average Price / Carat by Type</p>
          <HorizontalBarChart
            data={summary.slice(0, 10).map((s: { gemstone_type: string; avg_price_per_carat: number }) => ({
              label: s.gemstone_type,
              value: s.avg_price_per_carat,
              color: GEM_COLORS[s.gemstone_type],
            }))}
            unit="$"
          />
        </div>
      )}

      {/* Listing volume */}
      {summary.length > 0 && (
        <div className="card p-4">
          <p className="text-sm font-medium text-ivory mb-3">Listing Volume by Type</p>
          <HorizontalBarChart
            data={summary.slice(0, 10).map((s: { gemstone_type: string; listing_count: number }) => ({
              label: s.gemstone_type,
              value: s.listing_count,
              color: '#4a4a4a',
            }))}
          />
        </div>
      )}

      {/* Origin breakdown */}
      {origins.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-gold" />
            <p className="text-sm font-medium text-ivory">Top Origins by Listing Count</p>
          </div>
          <HorizontalBarChart
            data={origins.map((o: { country: string; count: number; avg_ppc: number }) => ({
              label: o.country,
              value: o.count,
              color: '#1e4d6b',
            }))}
          />
        </div>
      )}
    </div>
  );
}
