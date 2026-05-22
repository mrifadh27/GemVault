'use client';

import { useState, useRef } from 'react';
import { Plus, X, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn, getImageUrl } from '@/lib/utils';
import { Avatar } from '@/components/common/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/common/Toast';
import type { GemStory } from '@/types';

interface StoryGroup {
  profile: { id: string; username: string; avatar_url: string | null; is_verified: boolean };
  stories: GemStory[];
}

export function StoriesBar() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [activeGroup, setActiveGroup] = useState<StoryGroup | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: storiesData } = useQuery({
    queryKey: ['stories-feed'],
    queryFn: async () => {
      const res = await fetch('/api/stories');
      if (!res.ok) return { grouped: [] };
      return res.json();
    },
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });

  const groups: StoryGroup[] = storiesData?.grouped || [];

  const markViewed = useMutation({
    mutationFn: async (storyId: string) => {
      await fetch('/api/stories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story_id: storyId }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['stories-feed'] }),
  });

  const deleteStory = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/stories?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stories-feed'] });
      setActiveGroup(null);
      toast('Story deleted', 'info');
    },
  });

  const openGroup = (group: StoryGroup) => {
    setActiveGroup(group);
    setActiveIdx(0);
    // Mark first story as viewed
    if (!group.stories[0].is_viewed) {
      markViewed.mutate(group.stories[0].id);
    }
  };

  const nextStory = () => {
    if (!activeGroup) return;
    if (activeIdx < activeGroup.stories.length - 1) {
      const next = activeIdx + 1;
      setActiveIdx(next);
      if (!activeGroup.stories[next].is_viewed) markViewed.mutate(activeGroup.stories[next].id);
    } else {
      // Move to next group
      const gIdx = groups.findIndex(g => g.profile.id === activeGroup.profile.id);
      if (gIdx < groups.length - 1) {
        openGroup(groups[gIdx + 1]);
      } else {
        setActiveGroup(null);
      }
    }
  };

  const prevStory = () => {
    if (!activeGroup) return;
    if (activeIdx > 0) setActiveIdx(i => i - 1);
    else {
      const gIdx = groups.findIndex(g => g.profile.id === activeGroup.profile.id);
      if (gIdx > 0) openGroup(groups[gIdx - 1]);
    }
  };

  if (!groups.length && !user) return null;

  return (
    <>
      {/* Stories row */}
      <div className="flex gap-3 px-3 py-3 overflow-x-auto no-scrollbar border-b border-[#111]">

        {/* Add story (own user) */}
        {user && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0"
          >
            <div className="w-14 h-14 rounded-full bg-[#141414] border-2 border-dashed border-[#2a2a2a] flex items-center justify-center hover:border-gold/50 transition-colors">
              <Plus className="w-5 h-5 text-ivory-muted" />
            </div>
            <span className="text-[10px] text-ivory-subtle">Your Story</span>
          </button>
        )}

        {/* Story circles */}
        {groups.map(group => {
          const allViewed = group.stories.every(s => s.is_viewed);
          return (
            <button
              key={group.profile.id}
              onClick={() => openGroup(group)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0"
            >
              <div className={cn(
                'w-14 h-14 rounded-full p-[2px]',
                allViewed
                  ? 'bg-[#2a2a2a]'
                  : 'bg-gradient-to-tr from-gold via-amber-400 to-yellow-300',
              )}>
                <div className="w-full h-full rounded-full overflow-hidden bg-[#0f0f0f] border-2 border-[#0f0f0f]">
                  <Avatar src={group.profile.avatar_url} username={group.profile.username} size="sm" />
                </div>
              </div>
              <span className="text-[10px] text-ivory-subtle max-w-[56px] truncate">
                {group.profile.username}
              </span>
            </button>
          );
        })}
      </div>

      {/* Story viewer */}
      {activeGroup && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={() => setActiveGroup(null)}>
          <div
            className="relative w-full max-w-sm h-full max-h-[90vh] sm:max-h-[700px] sm:rounded-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Progress bars */}
            <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
              {activeGroup.stories.map((_, i) => (
                <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full bg-white rounded-full transition-none', i < activeIdx && 'w-full', i === activeIdx && 'w-full', i > activeIdx && 'w-0')}
                  />
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="absolute top-7 left-3 right-3 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <Avatar src={activeGroup.profile.avatar_url} username={activeGroup.profile.username} size="xs" />
                <span className="text-sm font-medium text-white">@{activeGroup.profile.username}</span>
              </div>
              <div className="flex items-center gap-2">
                {user?.id === activeGroup.profile.id && (
                  <button
                    onClick={() => deleteStory.mutate(activeGroup.stories[activeIdx].id)}
                    className="text-white/70 hover:text-red-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => setActiveGroup(null)} className="text-white/70 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Image */}
            <img
              src={getImageUrl(activeGroup.stories[activeIdx].image_url)}
              alt="story"
              className="w-full h-full object-cover"
            />

            {/* Caption */}
            {activeGroup.stories[activeIdx].caption && (
              <div className="absolute bottom-8 left-3 right-3 text-center">
                <p className="text-white text-sm font-medium bg-black/40 backdrop-blur px-3 py-2 rounded-xl">
                  {activeGroup.stories[activeIdx].caption}
                </p>
              </div>
            )}

            {/* Views count (own stories) */}
            {user?.id === activeGroup.profile.id && (
              <div className="absolute bottom-2 left-3 flex items-center gap-1 text-white/60 text-xs">
                <Eye className="w-3.5 h-3.5" />
                {activeGroup.stories[activeIdx].views_count}
              </div>
            )}

            {/* Nav */}
            <button onClick={prevStory} className="absolute left-0 top-0 w-1/3 h-full z-5 opacity-0" aria-label="Previous" />
            <button onClick={nextStory} className="absolute right-0 top-0 w-2/3 h-full z-5 opacity-0" aria-label="Next" />
          </div>
        </div>
      )}

      {/* Create story modal */}
      {showCreate && (
        <CreateStoryModal onClose={() => setShowCreate(false)} onCreated={() => { qc.invalidateQueries({ queryKey: ['stories-feed'] }); setShowCreate(false); }} />
      )}
    </>
  );
}

function CreateStoryModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!imageUrl) return;
    setLoading(true);
    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: imageUrl, caption }),
      });
      if (!res.ok) throw new Error('Failed');
      toast('Story posted! Expires in 24h 🌟', 'success');
      onCreated();
    } catch { toast('Failed to post story', 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0f0f0f] border border-[#222] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-ivory">Add Story</h2>
          <button onClick={onClose} className="btn-icon w-8 h-8"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="label">Image URL</label>
            <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://…" className="input" />
          </div>
          <div>
            <label className="label">Caption (optional)</label>
            <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Just arrived…" maxLength={200} className="input" />
          </div>
          <p className="text-xs text-ivory-subtle">Stories expire automatically after 24 hours.</p>
          <button onClick={submit} disabled={!imageUrl || loading} className="btn-gold w-full rounded-full py-3">
            {loading ? 'Posting…' : 'Post Story'}
          </button>
        </div>
      </div>
    </div>
  );
}
