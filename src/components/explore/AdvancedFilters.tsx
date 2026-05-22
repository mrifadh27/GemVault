'use client';

import { useState } from 'react';
import { X, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PostFilters } from '@/types';

const GEMSTONE_TYPES = [
  'Ruby','Sapphire','Emerald','Diamond','Alexandrite','Spinel','Tanzanite',
  'Tourmaline','Aquamarine','Amethyst','Opal','Garnet','Topaz','Morganite',
  'Peridot','Citrine','Zircon','Other',
];

const ORIGINS = [
  'Myanmar (Burma)','Sri Lanka','Colombia','Brazil','Madagascar','Mozambique',
  'Tanzania','Thailand','Cambodia','Australia','Russia','Kashmir','Afghanistan',
  'Nigeria','Zambia','USA','Bolivia','Pakistan',
];

const TREATMENTS = ['None','Heated','Oiled','Beryllium','Fracture Filled','Irradiated','Coated'];
const CERTIFICATIONS = ['None','GIA','IGI','AGL','GRS','Gübelin','SSEF','Lotus','GIT'];

const COLOR_HUES = [
  { label: 'Red', color: '#ef4444' },
  { label: 'Orangy Red', color: '#f97316' },
  { label: 'Orange', color: '#fb923c' },
  { label: 'Yellow', color: '#eab308' },
  { label: 'Green', color: '#22c55e' },
  { label: 'Bluish Green', color: '#14b8a6' },
  { label: 'Blue', color: '#3b82f6' },
  { label: 'Violet', color: '#8b5cf6' },
  { label: 'Purple', color: '#a855f7' },
  { label: 'Pink', color: '#ec4899' },
  { label: 'Pinkish Red', color: '#f43f5e' },
  { label: 'Colorless', color: '#e2e8f0' },
];

interface AdvancedFiltersProps {
  filters: PostFilters;
  onChange: (f: PostFilters) => void;
  onClose?: () => void;
  inline?: boolean;
}

export function AdvancedFilters({ filters, onChange, onClose, inline }: AdvancedFiltersProps) {
  const [local, setLocal] = useState<PostFilters>(filters);

  const update = (key: keyof PostFilters, value: unknown) => {
    setLocal(prev => ({ ...prev, [key]: value || undefined }));
  };

  const apply = () => {
    onChange(local);
    onClose?.();
  };

  const reset = () => {
    const cleared: PostFilters = { sort: local.sort };
    setLocal(cleared);
    onChange(cleared);
    onClose?.();
  };

  const activeCount = Object.keys(local).filter(k => k !== 'sort' && k !== 'page' && k !== 'limit' && (local as Record<string, unknown>)[k]).length;

  const content = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e1e]">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-gold" />
          <h2 className="font-semibold text-ivory">Filters</h2>
          {activeCount > 0 && (
            <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full">{activeCount}</span>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={reset} className="btn-ghost text-xs gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          {onClose && (
            <button onClick={onClose} className="btn-icon w-8 h-8"><X className="w-4 h-4" /></button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

        {/* Gemstone Type */}
        <div>
          <label className="label">Gemstone Type</label>
          <div className="flex flex-wrap gap-1.5">
            {GEMSTONE_TYPES.map(t => (
              <button
                key={t}
                onClick={() => update('gemstone_type', local.gemstone_type === t ? '' : t)}
                className={cn(
                  'text-xs px-3 py-1 rounded-full border transition-all',
                  local.gemstone_type === t
                    ? 'bg-gold text-obsidian border-gold font-semibold'
                    : 'border-[#2a2a2a] text-ivory-muted hover:border-gold/40',
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <label className="label">Price Range (USD)</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              value={local.min_price ?? ''}
              onChange={e => update('min_price', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Min"
              min="0"
              className="input text-sm"
            />
            <span className="text-ivory-subtle text-sm">–</span>
            <input
              type="number"
              value={local.max_price ?? ''}
              onChange={e => update('max_price', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Max"
              min="0"
              className="input text-sm"
            />
          </div>
        </div>

        {/* Carat Range */}
        <div>
          <label className="label">Carat Weight</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              value={local.min_carat ?? ''}
              onChange={e => update('min_carat', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Min ct"
              min="0"
              step="0.1"
              className="input text-sm"
            />
            <span className="text-ivory-subtle text-sm">–</span>
            <input
              type="number"
              value={local.max_carat ?? ''}
              onChange={e => update('max_carat', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="Max ct"
              min="0"
              step="0.1"
              className="input text-sm"
            />
          </div>
        </div>

        {/* Color Hue */}
        <div>
          <label className="label">Color Hue</label>
          <div className="flex flex-wrap gap-2">
            {COLOR_HUES.map(({ label, color }) => (
              <button
                key={label}
                onClick={() => update('color_hue', local.color_hue === label ? '' : label)}
                title={label}
                className={cn(
                  'w-7 h-7 rounded-full border-2 transition-transform',
                  local.color_hue === label ? 'border-white scale-110' : 'border-transparent hover:scale-105',
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          {local.color_hue && (
            <p className="text-xs text-ivory-muted mt-1">{local.color_hue}</p>
          )}
        </div>

        {/* Origin */}
        <div>
          <label className="label">Origin Country</label>
          <select
            value={local.origin_country ?? ''}
            onChange={e => update('origin_country', e.target.value)}
            className="input"
          >
            <option value="">Any origin</option>
            {ORIGINS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        {/* Treatment */}
        <div>
          <label className="label">Treatment</label>
          <div className="flex flex-wrap gap-1.5">
            {TREATMENTS.map(t => (
              <button
                key={t}
                onClick={() => update('treatment', local.treatment === t ? '' : t)}
                className={cn(
                  'text-xs px-3 py-1 rounded-full border transition-all',
                  local.treatment === t
                    ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                    : 'border-[#2a2a2a] text-ivory-muted hover:border-orange-500/30',
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Certification */}
        <div>
          <label className="label">Certification</label>
          <div className="flex flex-wrap gap-1.5">
            {CERTIFICATIONS.map(c => (
              <button
                key={c}
                onClick={() => update('certification', local.certification === c ? '' : c)}
                className={cn(
                  'text-xs px-3 py-1 rounded-full border transition-all',
                  local.certification === c
                    ? 'bg-gold/20 text-gold border-gold/40'
                    : 'border-[#2a2a2a] text-ivory-muted hover:border-gold/30',
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-2">
          <label className="label">Special</label>
          <label className="flex items-center justify-between py-2 cursor-pointer">
            <span className="text-sm text-ivory-muted">Has video</span>
            <div
              onClick={() => update('has_video', local.has_video ? undefined : true)}
              className={cn('w-10 h-5 rounded-full transition-colors relative', local.has_video ? 'bg-gold' : 'bg-[#2a2a2a]')}
            >
              <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all', local.has_video ? 'left-5' : 'left-0.5')} />
            </div>
          </label>
          <label className="flex items-center justify-between py-2 cursor-pointer">
            <span className="text-sm text-ivory-muted">Lot listings only</span>
            <div
              onClick={() => update('is_lot', local.is_lot ? undefined : true)}
              className={cn('w-10 h-5 rounded-full transition-colors relative', local.is_lot ? 'bg-gold' : 'bg-[#2a2a2a]')}
            >
              <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all', local.is_lot ? 'left-5' : 'left-0.5')} />
            </div>
          </label>
        </div>
      </div>

      {/* Apply button */}
      <div className="px-5 py-4 border-t border-[#1e1e1e]">
        <button onClick={apply} className="btn-gold w-full rounded-full py-3">
          Apply Filters{activeCount > 0 && ` (${activeCount})`}
        </button>
      </div>
    </div>
  );

  if (inline) return <div className="h-full">{content}</div>;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#0f0f0f] border-l border-[#222] w-full max-w-sm h-full flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {content}
      </div>
    </div>
  );
}
