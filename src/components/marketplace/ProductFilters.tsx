'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import { GEMSTONE_TYPES, CUT_TYPES, CLARITY_GRADES, CERTIFICATION_BODIES, TREATMENT_TYPES } from '@/lib/validations';

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-obsidian-border pb-5 mb-5 last:border-0 last:pb-0 last:mb-0">
      <h4 className="text-xs font-semibold text-ivory uppercase tracking-widest mb-3">{title}</h4>
      {children}
    </div>
  );
}

export function ProductFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) { params.set(key, value); } else { params.delete(key); }
    params.delete('page');
    router.push('/marketplace?' + params.toString());
  };

  const activeFilterCount = Array.from(searchParams.keys()).filter(k => !['page','sort_by','search'].includes(k)).length;

  const CheckGroup = ({ paramKey, options }: { paramKey: string; options: readonly string[] }) => {
    const current = searchParams.get(paramKey);
    return (
      <div className="space-y-2">
        {options.map(opt => (
          <label key={opt} className="flex items-center gap-2.5 cursor-pointer group">
            <input type="radio" name={paramKey} checked={current === opt}
              onChange={() => updateFilter(paramKey, current === opt ? null : opt)}
              className="w-3.5 h-3.5 accent-gold" />
            <span className="text-sm text-ivory-muted group-hover:text-ivory transition-colors">{opt}</span>
          </label>
        ))}
      </div>
    );
  };

  return (
    <div className="w-60 flex-shrink-0">
      <div className="card p-5 sticky top-20">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-gold" />
            <h3 className="font-medium text-ivory text-sm">Filters</h3>
            {activeFilterCount > 0 && <span className="badge-gold text-[10px] px-1.5 py-0">{activeFilterCount}</span>}
          </div>
          {activeFilterCount > 0 && (
            <button onClick={() => router.push('/marketplace')} className="text-xs text-ivory-subtle hover:text-red-400 transition-colors flex items-center gap-1">
              <X className="w-3 h-3" /> Clear all
            </button>
          )}
        </div>
        <FilterSection title="Price Range">
          <div className="grid grid-cols-2 gap-2">
            <div><label className="label">Min ($)</label><input type="number" placeholder="0" defaultValue={searchParams.get('min_price') ?? ''} onBlur={e => updateFilter('min_price', e.target.value || null)} className="input text-sm py-1.5" /></div>
            <div><label className="label">Max ($)</label><input type="number" placeholder="Any" defaultValue={searchParams.get('max_price') ?? ''} onBlur={e => updateFilter('max_price', e.target.value || null)} className="input text-sm py-1.5" /></div>
          </div>
        </FilterSection>
        <FilterSection title="Carat Weight">
          <div className="grid grid-cols-2 gap-2">
            <div><label className="label">Min</label><input type="number" step="0.01" placeholder="0" defaultValue={searchParams.get('min_carat') ?? ''} onBlur={e => updateFilter('min_carat', e.target.value || null)} className="input text-sm py-1.5" /></div>
            <div><label className="label">Max</label><input type="number" step="0.01" placeholder="Any" defaultValue={searchParams.get('max_carat') ?? ''} onBlur={e => updateFilter('max_carat', e.target.value || null)} className="input text-sm py-1.5" /></div>
          </div>
        </FilterSection>
        <FilterSection title="Certification"><CheckGroup paramKey="certification_body" options={CERTIFICATION_BODIES} /></FilterSection>
        <FilterSection title="Cut"><CheckGroup paramKey="cut" options={CUT_TYPES} /></FilterSection>
        <FilterSection title="Clarity"><CheckGroup paramKey="clarity" options={CLARITY_GRADES} /></FilterSection>
        <FilterSection title="Treatment"><CheckGroup paramKey="treatment" options={TREATMENT_TYPES} /></FilterSection>
        <FilterSection title="Other">
          <label className="flex items-center gap-2.5 cursor-pointer"><input type="checkbox" checked={searchParams.get('is_certified') === 'true'} onChange={e => updateFilter('is_certified', e.target.checked ? 'true' : null)} className="w-3.5 h-3.5 accent-gold" /><span className="text-sm text-ivory-muted">Certified only</span></label>
          <label className="flex items-center gap-2.5 cursor-pointer mt-2"><input type="checkbox" checked={searchParams.get('is_featured') === 'true'} onChange={e => updateFilter('is_featured', e.target.checked ? 'true' : null)} className="w-3.5 h-3.5 accent-gold" /><span className="text-sm text-ivory-muted">Featured only</span></label>
        </FilterSection>
      </div>
    </div>
  );
}
