'use client';

import { useState } from 'react';
import { MapPin, Search, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const GEM_ORIGINS = [
  { country: 'Myanmar (Burma)',  code: 'MM', lat: 21.9, lng: 96.1,  gems: ['Ruby','Sapphire','Spinel','Peridot'],           color: '#ef4444', region: 'Asia' },
  { country: 'Sri Lanka',        code: 'LK', lat: 7.9,  lng: 80.7,  gems: ['Sapphire','Ruby','Alexandrite','Spinel'],        color: '#3b82f6', region: 'Asia' },
  { country: 'Colombia',         code: 'CO', lat: 4.7,  lng: -74.1, gems: ['Emerald'],                                       color: '#22c55e', region: 'Americas' },
  { country: 'Brazil',           code: 'BR', lat: -14.2,lng: -51.9, gems: ['Alexandrite','Tourmaline','Aquamarine','Topaz'], color: '#8b5cf6', region: 'Americas' },
  { country: 'Madagascar',       code: 'MG', lat: -18.8,lng: 46.9,  gems: ['Sapphire','Ruby','Alexandrite'],                 color: '#06b6d4', region: 'Africa' },
  { country: 'Mozambique',       code: 'MZ', lat: -18.7,lng: 35.5,  gems: ['Ruby','Tourmaline'],                             color: '#f97316', region: 'Africa' },
  { country: 'Tanzania',         code: 'TZ', lat: -6.4, lng: 34.9,  gems: ['Tanzanite','Ruby','Spinel','Garnet'],            color: '#6366f1', region: 'Africa' },
  { country: 'Zambia',           code: 'ZM', lat: -13.1,lng: 27.8,  gems: ['Emerald'],                                       color: '#15803d', region: 'Africa' },
  { country: 'Australia',        code: 'AU', lat: -25.3,lng: 133.8, gems: ['Opal','Sapphire'],                               color: '#f59e0b', region: 'Oceania' },
  { country: 'Russia',           code: 'RU', lat: 61.5, lng: 105.3, gems: ['Alexandrite','Demantoid'],                       color: '#64748b', region: 'Asia' },
  { country: 'Kashmir',          code: 'KA', lat: 34.1, lng: 77.6,  gems: ['Sapphire'],                                      color: '#0284c7', region: 'Asia' },
  { country: 'Afghanistan',      code: 'AF', lat: 33.9, lng: 67.7,  gems: ['Emerald','Lapis','Ruby'],                        color: '#16a34a', region: 'Asia' },
  { country: 'Thailand',         code: 'TH', lat: 15.9, lng: 100.9, gems: ['Ruby','Sapphire'],                               color: '#dc2626', region: 'Asia' },
  { country: 'Cambodia',         code: 'KH', lat: 12.6, lng: 104.9, gems: ['Ruby','Sapphire'],                               color: '#c026d3', region: 'Asia' },
  { country: 'Pakistan',         code: 'PK', lat: 30.4, lng: 69.3,  gems: ['Emerald','Ruby','Spinel'],                      color: '#65a30d', region: 'Asia' },
  { country: 'Nigeria',          code: 'NG', lat: 9.1,  lng: 8.7,   gems: ['Sapphire','Tourmaline','Aquamarine'],            color: '#7c3aed', region: 'Africa' },
  { country: 'Bolivia',          code: 'BO', lat: -16.3,lng: -63.6, gems: ['Ametrine','Amethyst'],                           color: '#a855f7', region: 'Americas' },
  { country: 'India',            code: 'IN', lat: 20.6, lng: 78.9,  gems: ['Diamond','Sapphire','Garnet'],                  color: '#f97316', region: 'Asia' },
];

// Simple SVG world map coordinates (normalised 0-100 x,y from lat/lng)
function latlngToXY(lat: number, lng: number): [number, number] {
  const x = ((lng + 180) / 360) * 100;
  const y = ((90 - lat) / 180) * 100;
  return [x, y];
}

interface OriginMapProps { onSelectOrigin?: (country: string) => void; }

export function OriginMap({ onSelectOrigin }: OriginMapProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const { data: trendData } = useQuery({
    queryKey: ['market-trends-overview-map'],
    queryFn: async () => {
      const res = await fetch('/api/market-trends?days=90');
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 10 * 60_000,
  });

  const originCounts: Record<string, number> = {};
  (trendData?.data?.origin_breakdown || []).forEach((o: { country: string; count: number }) => {
    originCounts[o.country] = o.count;
  });

  const regions = ['all', 'Asia', 'Africa', 'Americas', 'Oceania'];

  const filtered = GEM_ORIGINS.filter(o => {
    const matchRegion = regionFilter === 'all' || o.region === regionFilter;
    const matchSearch = !search || o.country.toLowerCase().includes(search.toLowerCase()) || o.gems.some(g => g.toLowerCase().includes(search.toLowerCase()));
    return matchRegion && matchSearch;
  });

  const selectedOrigin = GEM_ORIGINS.find(o => o.country === selected);

  return (
    <div className="space-y-4">
      {/* SVG Map */}
      <div className="card overflow-hidden p-0">
        <div className="relative bg-[#0a0a0a] px-2 py-3">
          <svg viewBox="0 0 100 55" className="w-full" style={{ height: 'clamp(150px, 35vw, 220px)' }}>
            {/* Simplified continent outlines as decorative paths */}
            <rect width="100" height="55" fill="#0a0a0a" />
            {/* Ocean grid lines */}
            {[10,20,30,40,50,60,70,80,90].map(x => (
              <line key={x} x1={x} y1="0" x2={x} y2="55" stroke="#1a1a1a" strokeWidth="0.2" />
            ))}
            {[11,22,33,44].map(y => (
              <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#1a1a1a" strokeWidth="0.2" />
            ))}
            {/* Origin dots */}
            {GEM_ORIGINS.map(origin => {
              const [x, y] = latlngToXY(origin.lat, origin.lng);
              const isSelected = selected === origin.country;
              const count = originCounts[origin.country] || 0;
              const size = count > 0 ? Math.min(2.5, 1 + count * 0.1) : 1;
              return (
                <g key={origin.country} onClick={() => { setSelected(origin.country === selected ? null : origin.country); }}>
                  {isSelected && (
                    <circle cx={x} cy={y} r={size + 1.5} fill={origin.color} opacity="0.2">
                      <animate attributeName="r" values={`${size + 1.5};${size + 3};${size + 1.5}`} dur="1.5s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle
                    cx={x} cy={y} r={size}
                    fill={origin.color}
                    opacity={isSelected ? 1 : 0.7}
                    className="cursor-pointer hover:opacity-100 transition-opacity"
                  />
                  {count > 0 && (
                    <text x={x} y={y - size - 0.5} textAnchor="middle" fill={origin.color} fontSize="1.8" opacity="0.8">
                      {count}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Selected origin detail */}
      {selectedOrigin && (
        <div className="card p-4 border-l-2" style={{ borderLeftColor: selectedOrigin.color }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4" style={{ color: selectedOrigin.color }} />
                <h3 className="font-semibold text-ivory">{selectedOrigin.country}</h3>
                {originCounts[selectedOrigin.country] > 0 && (
                  <span className="text-xs text-ivory-muted">({originCounts[selectedOrigin.country]} listings)</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {selectedOrigin.gems.map(gem => (
                  <span key={gem} className="text-xs px-2 py-0.5 rounded-full border border-[#2a2a2a] text-ivory-muted">{gem}</span>
                ))}
              </div>
            </div>
          </div>
          <Link
            href={`/explore?origin_country=${encodeURIComponent(selectedOrigin.country)}`}
            onClick={() => onSelectOrigin?.(selectedOrigin.country)}
            className="flex items-center gap-1.5 text-xs text-gold hover:text-gold/80 transition-colors font-medium"
          >
            Browse {selectedOrigin.country} gems <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#444]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search country or gem…"
            className="input pl-8 text-sm"
          />
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {regions.map(r => (
          <button
            key={r}
            onClick={() => setRegionFilter(r)}
            className={cn(
              'text-xs px-3 py-1 rounded-full border transition-all capitalize',
              regionFilter === r
                ? 'bg-gold text-obsidian border-gold font-semibold'
                : 'border-[#2a2a2a] text-ivory-muted hover:border-gold/40',
            )}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Origin grid */}
      <div className="grid grid-cols-1 gap-2">
        {filtered.map(origin => {
          const count = originCounts[origin.country] || 0;
          return (
            <button
              key={origin.country}
              onClick={() => setSelected(origin.country === selected ? null : origin.country)}
              className={cn(
                'card p-3 flex items-center gap-3 text-left transition-all',
                selected === origin.country ? 'border-opacity-80' : 'hover:border-[#333]',
              )}
              style={selected === origin.country ? { borderColor: origin.color } : {}}
            >
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: origin.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ivory">{origin.country}</p>
                <p className="text-xs text-ivory-muted truncate">{origin.gems.join(' · ')}</p>
              </div>
              <div className="flex-shrink-0 text-right">
                {count > 0 && <p className="text-xs font-medium text-gold">{count} listings</p>}
                <p className="text-[10px] text-ivory-subtle">{origin.region}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
