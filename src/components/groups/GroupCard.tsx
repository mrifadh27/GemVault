'use client';

import { useState } from 'react';
import { Users, Lock, Globe, Plus, Check, X, Search } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn, formatNumber } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/common/Toast';
import { PostCard } from '@/components/feed/PostCard';
import type { GemGroup, GemPostWithDetails } from '@/types';

// ─── Group Card ───────────────────────────────────────────────

interface GroupCardProps {
  group: GemGroup;
  onSelect: (g: GemGroup) => void;
}

export function GroupCard({ group, onSelect }: GroupCardProps) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const join = useMutation({
    mutationFn: async (action: 'join' | 'leave') => {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, group_id: group.id }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['groups'] });
      toast(data.is_member ? `Joined ${group.name}!` : `Left ${group.name}`, data.is_member ? 'success' : 'info');
    },
    onError: () => toast('Something went wrong', 'error'),
  });

  return (
    <div className="card overflow-hidden">
      {/* Cover */}
      <button onClick={() => onSelect(group)} className="block w-full">
        <div
          className="h-20 flex items-center justify-center text-4xl"
          style={{ background: `linear-gradient(135deg, #1a1a1a, #111)` }}
        >
          {group.icon}
        </div>
      </button>

      <div className="p-3">
        <button onClick={() => onSelect(group)} className="block text-left w-full mb-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className="text-sm font-semibold text-ivory line-clamp-1">{group.name}</h3>
            {group.is_private ? (
              <Lock className="w-3 h-3 text-ivory-subtle flex-shrink-0" />
            ) : (
              <Globe className="w-3 h-3 text-ivory-subtle flex-shrink-0" />
            )}
            {group.member_role === 'admin' && (
              <span className="text-[9px] bg-gold/20 text-gold px-1.5 rounded-full flex-shrink-0">Admin</span>
            )}
          </div>
          <p className="text-xs text-ivory-muted line-clamp-2">{group.description}</p>
        </button>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-ivory-subtle">
            <Users className="w-3 h-3" />
            <span>{formatNumber(group.member_count)}</span>
          </div>

          {user && (
            <button
              onClick={() => join.mutate(group.is_member ? 'leave' : 'join')}
              disabled={join.isPending}
              className={cn(
                'flex items-center gap-1 text-xs px-3 py-1 rounded-full border transition-all',
                group.is_member
                  ? 'border-[#333] text-ivory-muted hover:border-red-400/40 hover:text-red-400'
                  : 'border-gold/40 text-gold hover:bg-gold/10',
              )}
            >
              {group.is_member ? (
                <><Check className="w-3 h-3" /> Joined</>
              ) : (
                <><Plus className="w-3 h-3" /> Join</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Group Detail ─────────────────────────────────────────────

interface GroupDetailProps { slug: string; onBack: () => void; }

export function GroupDetail({ slug, onBack }: GroupDetailProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'posts' | 'members'>('posts');

  const { data, isLoading } = useQuery({
    queryKey: ['group-detail', slug],
    queryFn: async () => {
      const res = await fetch(`/api/groups/${slug}`);
      if (!res.ok) throw new Error('Not found');
      const { data } = await res.json();
      return data;
    },
    staleTime: 30_000,
  });

  const join = useMutation({
    mutationFn: async (action: 'join' | 'leave') => {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, group_id: data.id }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['group-detail', slug] }),
  });

  if (isLoading) return (
    <div className="space-y-4">
      <div className="h-32 skeleton rounded-xl" />
      <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-40 skeleton rounded-xl" />)}</div>
    </div>
  );
  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card overflow-hidden p-0">
        <div className="h-28 flex items-center justify-center text-6xl bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f]">
          {data.icon}
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="font-bold text-ivory text-lg">{data.name}</h1>
              <p className="text-xs text-ivory-muted">{data.description}</p>
            </div>
            {user && (
              <button
                onClick={() => join.mutate(data.is_member ? 'leave' : 'join')}
                disabled={join.isPending}
                className={cn(
                  'flex items-center gap-1.5 text-sm px-4 py-2 rounded-full border transition-all flex-shrink-0 ml-3',
                  data.is_member
                    ? 'border-[#333] text-ivory-muted hover:border-red-400/40 hover:text-red-400'
                    : 'bg-gold text-obsidian border-gold font-semibold',
                )}
              >
                {data.is_member ? <><Check className="w-3.5 h-3.5" /> Joined</> : <><Plus className="w-3.5 h-3.5" /> Join</>}
              </button>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-ivory-muted">
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{formatNumber(data.member_count)} members</span>
            <span>{data.post_count} posts</span>
            {data.is_private ? <span className="flex items-center gap-1"><Lock className="w-3 h-3" />Private</span> : null}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-[#1e1e1e]">
          {(['posts', 'members'] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={cn(
                'flex-1 py-2.5 text-xs font-medium transition-colors capitalize border-b-2',
                activeTab === t ? 'text-gold border-gold' : 'text-ivory-muted border-transparent hover:text-ivory',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Posts tab */}
      {activeTab === 'posts' && (
        <div>
          {(!data.recent_posts || data.recent_posts.length === 0) ? (
            <div className="text-center py-10">
              <p className="text-ivory-muted text-sm">No posts in this group yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(data.recent_posts as GemPostWithDetails[]).map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Members tab */}
      {activeTab === 'members' && (
        <div className="space-y-2">
          {(data.members || []).map((m: { profiles: { id: string; username: string; avatar_url: string | null; is_verified: boolean }; role: string; joined_at: string }) => (
            <div key={m.profiles.id} className="card p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#1a1a1a] overflow-hidden flex-shrink-0">
                {m.profiles.avatar_url ? (
                  <img src={m.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-bold text-ivory">
                    {m.profiles.username?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ivory">@{m.profiles.username}</p>
              </div>
              <span className={cn(
                'text-[10px] px-2 py-0.5 rounded-full border capitalize',
                m.role === 'admin' ? 'text-gold border-gold/40 bg-gold/10' : 'text-ivory-subtle border-[#2a2a2a]',
              )}>
                {m.role}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Groups Page Content ──────────────────────────────────────

export function GroupsContent() {
  const [selected, setSelected] = useState<GemGroup | null>(null);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: groups = [], isLoading } = useQuery<GemGroup[]>({
    queryKey: ['groups', search],
    queryFn: async () => {
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const res = await fetch(`/api/groups${params}`);
      if (!res.ok) return [];
      const { data } = await res.json();
      return data;
    },
    staleTime: 30_000,
  });

  if (selected) {
    return (
      <div>
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-sm text-ivory-muted hover:text-ivory mb-4 transition-colors"
        >
          ← Back to groups
        </button>
        <GroupDetail slug={selected.slug} onBack={() => setSelected(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#444]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search groups…"
            className="input pl-8"
          />
        </div>
        {user && (
          <button onClick={() => setShowCreate(true)} className="btn-gold px-3 py-2 rounded-full text-sm gap-1.5">
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-44 skeleton rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {groups.map(g => <GroupCard key={g.id} group={g} onSelect={setSelected} />)}
        </div>
      )}

      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} onCreated={() => { qc.invalidateQueries({ queryKey: ['groups'] }); setShowCreate(false); }} />}
    </div>
  );
}

function CreateGroupModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', description: '', icon: '💎', category: 'general', is_private: false });
  const [loading, setLoading] = useState(false);
  const icons = ['💎', '🔴', '🔵', '💚', '🟡', '🟣', '⚪', '⬛', '🌈', '⭐', '🔬', '🗺️'];
  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', ...form }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast('Group created! 🎉', 'success');
      onCreated();
    } catch (e: unknown) { toast((e as Error).message, 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0f0f0f] border border-[#222] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-ivory">Create Group</h2>
          <button onClick={onClose} className="btn-icon w-8 h-8"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="label">Icon</label>
            <div className="flex flex-wrap gap-2">
              {icons.map(ic => (
                <button key={ic} type="button" onClick={() => set('icon', ic)}
                  className={cn('w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all', form.icon === ic ? 'bg-gold/20 ring-1 ring-gold' : 'bg-[#111] hover:bg-[#1a1a1a]')}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div><label className="label">Name *</label><input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Mogok Ruby Society" className="input" /></div>
          <div><label className="label">Description</label><textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="For lovers of…" className="input resize-none" /></div>
          <label className="flex items-center justify-between py-2 cursor-pointer">
            <span className="text-sm text-ivory-muted">Private group</span>
            <div onClick={() => set('is_private', !form.is_private)} className={cn('w-10 h-5 rounded-full transition-colors relative', form.is_private ? 'bg-gold' : 'bg-[#2a2a2a]')}>
              <div className={cn('absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all', form.is_private ? 'left-5' : 'left-0.5')} />
            </div>
          </label>
          <button onClick={submit} disabled={!form.name.trim() || loading} className="btn-gold w-full rounded-full py-3">
            {loading ? 'Creating…' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
}
