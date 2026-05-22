'use client';

import { useState } from 'react';
import { Plus, Gem, Lock, Globe, Pencil, Trash2, X, ChevronRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn, formatPrice } from '@/lib/utils';
import { toast } from '@/components/common/Toast';
import { getImageUrl } from '@/lib/utils';
import type { GemCollection, CollectionItem } from '@/types';

const GEM_TYPES = ['Ruby','Sapphire','Emerald','Diamond','Alexandrite','Spinel','Tanzanite','Tourmaline','Aquamarine','Amethyst','Opal','Garnet','Topaz','Morganite','Other'];
const TREATMENTS = ['None','Heated','Oiled','Beryllium','Fracture Filled','Irradiated','Coated'];
const CERTIFICATIONS = ['None','GIA','IGI','AGL','GRS','Gübelin','SSEF','Lotus','GIT'];
const CURRENCIES = ['USD','EUR','GBP','AED','THB','HKD'];

interface CollectionManagerProps { userId: string; isOwner?: boolean; }

export function CollectionManager({ userId, isOwner }: CollectionManagerProps) {
  const qc = useQueryClient();
  const [activeCollection, setActiveCollection] = useState<GemCollection | null>(null);
  const [showNewColl, setShowNewColl] = useState(false);
  const [showNewItem, setShowNewItem] = useState(false);

  const { data: collections = [], isLoading } = useQuery<GemCollection[]>({
    queryKey: ['collections', userId],
    queryFn: async () => {
      const res = await fetch(`/api/collections?user_id=${userId}`);
      if (!res.ok) return [];
      const { data } = await res.json();
      return data;
    },
    staleTime: 30_000,
  });

  const { data: items = [] } = useQuery<CollectionItem[]>({
    queryKey: ['collection-items', activeCollection?.id],
    queryFn: async () => {
      const res = await fetch(`/api/collections?collection_id=${activeCollection!.id}`);
      if (!res.ok) return [];
      const { data } = await res.json();
      return data;
    },
    enabled: !!activeCollection,
  });

  const deleteCollection = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/collections/${id}?entity=collection`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['collections', userId] });
      setActiveCollection(null);
      toast('Collection deleted', 'info');
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/collections/${id}?entity=item`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['collection-items', activeCollection?.id] }),
  });

  if (isLoading) return <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-20 skeleton rounded-xl" />)}</div>;

  if (activeCollection) {
    return (
      <div className="space-y-4">
        {/* Back + header */}
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveCollection(null)} className="btn-icon w-8 h-8">
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
          <div className="flex-1">
            <h2 className="font-semibold text-ivory">{activeCollection.name}</h2>
            <p className="text-xs text-ivory-muted">{activeCollection.item_count} stones</p>
          </div>
          {isOwner && (
            <button onClick={() => setShowNewItem(true)} className="btn-gold px-3 py-1.5 text-xs rounded-full gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add Stone
            </button>
          )}
        </div>

        {/* Portfolio value */}
        {items.some(i => i.current_value) && (
          <div className="card p-3 bg-gold/5 border-gold/20">
            <p className="text-xs text-ivory-muted">Estimated Portfolio Value</p>
            <p className="font-serif text-xl text-gold">
              {formatPrice(items.reduce((s, i) => s + (i.current_value || i.purchase_price || 0), 0), items[0]?.purchase_currency || 'USD')}
            </p>
          </div>
        )}

        {/* Items grid */}
        {items.length === 0 ? (
          <div className="text-center py-10">
            <Gem className="w-8 h-8 text-ivory-subtle mx-auto mb-2" />
            <p className="text-sm text-ivory-muted">No stones yet</p>
            {isOwner && <button onClick={() => setShowNewItem(true)} className="btn-gold mt-3 px-4 py-2 text-sm rounded-full">Add First Stone</button>}
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="card p-3 flex gap-3">
                {item.image_url ? (
                  <img src={getImageUrl(item.image_url)} alt={item.title} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
                    <Gem className="w-5 h-5 text-ivory-subtle" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ivory truncate">{item.title}</p>
                  <p className="text-xs text-ivory-muted">{item.gemstone_type}{item.carat_weight ? ` · ${item.carat_weight}ct` : ''}</p>
                  {item.origin_country && <p className="text-xs text-ivory-subtle">{item.origin_country}{item.treatment !== 'None' ? ` · ${item.treatment}` : ''}</p>}
                  {(item.current_value || item.purchase_price) && (
                    <p className="text-xs text-gold font-medium mt-0.5">
                      {formatPrice(item.current_value || item.purchase_price || 0, item.purchase_currency)}
                    </p>
                  )}
                  {item.certification !== 'None' && item.certification_number && (
                    <p className="text-[10px] text-ivory-subtle">{item.certification} #{item.certification_number}</p>
                  )}
                </div>
                {isOwner && (
                  <button onClick={() => deleteItem.mutate(item.id)} className="btn-icon w-7 h-7 flex-shrink-0 self-start">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add item modal */}
        {showNewItem && (
          <AddItemModal
            collectionId={activeCollection.id}
            onClose={() => setShowNewItem(false)}
            onCreated={() => { qc.invalidateQueries({ queryKey: ['collection-items', activeCollection.id] }); setShowNewItem(false); }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-ivory-muted uppercase tracking-wider">Collections</h2>
        {isOwner && (
          <button onClick={() => setShowNewColl(true)} className="btn-ghost text-xs gap-1.5">
            <Plus className="w-3.5 h-3.5" /> New
          </button>
        )}
      </div>

      {collections.length === 0 ? (
        <div className="text-center py-10">
          <Gem className="w-8 h-8 text-ivory-subtle mx-auto mb-2" />
          <p className="text-sm text-ivory-muted">{isOwner ? 'Create your first collection' : 'No public collections'}</p>
          {isOwner && (
            <button onClick={() => setShowNewColl(true)} className="btn-gold mt-3 px-4 py-2 text-sm rounded-full">Create Collection</button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {collections.map(coll => (
            <button
              key={coll.id}
              onClick={() => setActiveCollection(coll)}
              className="card p-3 text-left hover:border-gold/30 transition-colors group"
            >
              {coll.cover_image_url ? (
                <img src={getImageUrl(coll.cover_image_url)} alt={coll.name} className="w-full h-20 object-cover rounded-lg mb-2" />
              ) : (
                <div className="w-full h-20 bg-gradient-to-br from-[#1a1a1a] to-[#111] rounded-lg mb-2 flex items-center justify-center">
                  <Gem className="w-6 h-6 text-gold/40 group-hover:text-gold/60 transition-colors" />
                </div>
              )}
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-ivory truncate">{coll.name}</p>
                  <p className="text-xs text-ivory-muted">{coll.item_count} stones</p>
                </div>
                {coll.is_public ? (
                  <Globe className="w-3 h-3 text-ivory-subtle flex-shrink-0 mt-0.5" />
                ) : (
                  <Lock className="w-3 h-3 text-ivory-subtle flex-shrink-0 mt-0.5" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* New collection modal */}
      {showNewColl && (
        <NewCollectionModal
          userId={userId}
          onClose={() => setShowNewColl(false)}
          onCreated={() => { qc.invalidateQueries({ queryKey: ['collections', userId] }); setShowNewColl(false); }}
        />
      )}
    </div>
  );
}

function NewCollectionModal({ userId, onClose, onCreated }: { userId: string; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'collection', name, description: desc, is_public: isPublic }),
      });
      if (!res.ok) throw new Error('Failed');
      toast('Collection created! 💎', 'success');
      onCreated();
    } catch { toast('Failed to create collection', 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0f0f0f] border border-[#222] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-ivory">New Collection</h2>
          <button onClick={onClose} className="btn-icon w-8 h-8"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div><label className="label">Name *</label><input value={name} onChange={e => setName(e.target.value)} placeholder="My Ruby Collection" className="input" /></div>
          <div><label className="label">Description</label><textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} className="input resize-none" /></div>
          <label className="flex items-center justify-between py-2 cursor-pointer">
            <span className="text-sm text-ivory-muted">Public collection</span>
            <div onClick={() => setIsPublic(v => !v)} className={cn('w-10 h-5 rounded-full transition-colors relative', isPublic ? 'bg-gold' : 'bg-[#2a2a2a]')}>
              <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all', isPublic ? 'left-5' : 'left-0.5')} />
            </div>
          </label>
          <button onClick={submit} disabled={!name.trim() || loading} className="btn-gold w-full rounded-full py-3">
            {loading ? 'Creating…' : 'Create Collection'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AddItemModal({ collectionId, onClose, onCreated }: { collectionId: string; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ title: '', gemstone_type: 'Ruby', carat_weight: '', origin_country: '', treatment: 'None', certification: 'None', certification_number: '', purchase_price: '', purchase_currency: 'USD', current_value: '', notes: '', image_url: '', acquired_at: '' });
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.title.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'item', collection_id: collectionId, ...form }),
      });
      if (!res.ok) throw new Error('Failed');
      toast('Stone added to collection ✨', 'success');
      onCreated();
    } catch { toast('Failed to add stone', 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0f0f0f] border border-[#222] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#1e1e1e] sticky top-0 bg-[#0f0f0f]">
          <h2 className="font-semibold text-ivory">Add Stone</h2>
          <button onClick={onClose} className="btn-icon w-8 h-8"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div><label className="label">Title *</label><input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Unheated Burma Ruby" className="input" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Gem Type</label>
              <select value={form.gemstone_type} onChange={e => set('gemstone_type', e.target.value)} className="input">
                {GEM_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="label">Carat Weight</label><input type="number" value={form.carat_weight} onChange={e => set('carat_weight', e.target.value)} placeholder="2.35" step="0.01" className="input" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Origin</label><input value={form.origin_country} onChange={e => set('origin_country', e.target.value)} placeholder="Myanmar" className="input" /></div>
            <div>
              <label className="label">Treatment</label>
              <select value={form.treatment} onChange={e => set('treatment', e.target.value)} className="input">
                {TREATMENTS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Certification</label>
              <select value={form.certification} onChange={e => set('certification', e.target.value)} className="input">
                {CERTIFICATIONS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="label">Cert Number</label><input value={form.certification_number} onChange={e => set('certification_number', e.target.value)} placeholder="1234567890" className="input" /></div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2"><label className="label">Purchase Price</label><input type="number" value={form.purchase_price} onChange={e => set('purchase_price', e.target.value)} placeholder="0" className="input" /></div>
            <div><label className="label">Currency</label><select value={form.purchase_currency} onChange={e => set('purchase_currency', e.target.value)} className="input">{CURRENCIES.map(c => <option key={c}>{c}</option>)}</select></div>
          </div>
          <div><label className="label">Est. Current Value</label><input type="number" value={form.current_value} onChange={e => set('current_value', e.target.value)} placeholder="Market value today" className="input" /></div>
          <div><label className="label">Acquired Date</label><input type="date" value={form.acquired_at} onChange={e => set('acquired_at', e.target.value)} className="input" /></div>
          <div><label className="label">Notes</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Provenance, notable features…" className="input resize-none" /></div>
          <div><label className="label">Image URL</label><input value={form.image_url} onChange={e => set('image_url', e.target.value)} placeholder="https://…" className="input" /></div>
          <button onClick={submit} disabled={!form.title.trim() || loading} className="btn-gold w-full rounded-full py-3">
            {loading ? 'Adding…' : 'Add to Collection'}
          </button>
        </div>
      </div>
    </div>
  );
}
