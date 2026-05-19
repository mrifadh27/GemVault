'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Grid3X3, CheckCircle, MapPin, Settings, MessageCircle, LogOut, UserPlus, UserMinus, Send, X, Loader2,
} from 'lucide-react';
import { cn, formatNumber, getImageUrl } from '@/lib/utils';
import { Avatar } from '@/components/common/Avatar';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import type { Profile, GemPostWithDetails } from '@/types';
import { toast, ToastContainer } from '@/components/common/Toast';

// ── Data fetchers ─────────────────────────────────────────────────────────────

async function fetchProfile(username: string): Promise<Profile> {
  const res = await fetch(`/api/profile?username=${encodeURIComponent(username)}`);
  if (!res.ok) throw new Error('Profile not found');
  const { data } = await res.json();
  return data;
}

async function fetchUserPosts(sellerId: string): Promise<GemPostWithDetails[]> {
  const res = await fetch(`/api/posts?seller_id=${sellerId}&limit=50`);
  if (!res.ok) return [];
  const { data } = await res.json();
  return data || [];
}

// ── Profile DM Modal ──────────────────────────────────────────────────────────

interface ProfileDMModalProps {
  target: Profile;
  onClose: () => void;
}

const QUICK_MESSAGES = [
  'Hi! I am interested in your gems.',
  'Do you have any new listings?',
  'Can we discuss pricing?',
  'I am looking for a specific gemstone.',
];

function ProfileDMModal({ target, onClose }: ProfileDMModalProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const router = useRouter();

  const sendDM = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      const res = await fetch('/api/dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seller_id: target.id, message: message.trim() }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || 'Failed to send');
      }
      const { data } = await res.json();
      setThreadId(data.thread_id);
      setSent(true);
    } catch (err: unknown) {
      toast((err as Error).message || 'Failed to send', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full sm:max-w-md bg-[#111] border border-[#222] rounded-t-3xl sm:rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e1e]">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-gold" />
            <span className="font-medium text-sm text-ivory">Message @{target.username}</span>
          </div>
          <button onClick={onClose} className="btn-icon w-7 h-7"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-4">
          {/* Target profile preview */}
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-[#0f0f0f] border border-[#1e1e1e]">
            <Avatar src={target.avatar_url} username={target.username} size="md" />
            <div>
              <p className="font-semibold text-sm text-ivory">@{target.username}</p>
              {target.location && <p className="text-xs text-ivory-muted">📍 {target.location}</p>}
            </div>
          </div>

          {sent ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">✅</div>
              <p className="font-semibold text-ivory mb-1">Message Sent!</p>
              <p className="text-sm text-ivory-muted mb-4">@{target.username} will reply shortly.</p>
              {threadId && (
                <button
                  onClick={() => { onClose(); router.push(`/messages?thread=${threadId}`); }}
                  className="btn-gold px-6 py-2.5 rounded-full"
                >
                  Open Conversation
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Quick messages */}
              <div className="flex flex-wrap gap-2 mb-3">
                {QUICK_MESSAGES.map(q => (
                  <button key={q} onClick={() => setMessage(q)}
                    className={cn(
                      'text-xs px-3 py-1.5 rounded-full border transition-all',
                      message === q
                        ? 'border-gold bg-gold/10 text-gold'
                        : 'border-[#2a2a2a] text-ivory-muted hover:border-[#444] hover:text-ivory'
                    )}>
                    {q}
                  </button>
                ))}
              </div>

              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Write your message..."
                rows={3}
                className="input resize-none mb-3"
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendDM(); } }}
                autoFocus
              />

              <button
                onClick={sendDM}
                disabled={!message.trim() || sending}
                className="btn-gold w-full justify-center rounded-xl py-3"
              >
                {sending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                  : <><Send className="w-4 h-4" /> Send Message</>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = decodeURIComponent(params.username as string);
  const { user, signOut } = useAuth();

  const [tab, setTab] = useState<'posts' | 'sold'>('posts');
  const [signingOut, setSigningOut] = useState(false);
  const [showDM, setShowDM] = useState(false);

  // Follow state
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState<number | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => fetchProfile(username),
    enabled: !!username,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['user-posts', profile?.id],
    queryFn: () => fetchUserPosts(profile!.id),
    enabled: !!profile?.id,
  });

  const isOwn = user?.id === profile?.id;
  const qc = useQueryClient();
  const activePosts = posts.filter(p => !p.is_sold);
  const soldPosts = posts.filter(p => p.is_sold);
  const displayPosts = tab === 'posts' ? activePosts : soldPosts;

  // Sync follower count from fetched profile
  useEffect(() => {
    if (profile) setFollowerCount(profile.followers_count);
  }, [profile]);

  // Check follow status
  useEffect(() => {
    if (!user || !profile || isOwn) return;
    fetch(`/api/follows?target_id=${profile.id}`)
      .then(r => r.json())
      .then(d => setIsFollowing(d.following ?? false))
      .catch(() => setIsFollowing(false)); // always enable the button on error
  }, [user, profile?.id, isOwn]);

  // Sign out
  const handleSignOut = async () => {
    setSigningOut(true);
    try { await signOut(); router.push('/auth'); }
    catch { setSigningOut(false); }
  };

  // Follow / Unfollow toggle
  const handleFollow = useCallback(async () => {
    if (!user) { router.push('/auth'); return; }
    if (!profile) return;
    setFollowLoading(true);
    const wasFollowing = isFollowing;
    try {
      if (wasFollowing) {
        setIsFollowing(false);
        setFollowerCount(c => Math.max(0, (c ?? 1) - 1));
        const delRes = await fetch(`/api/follows?target_id=${profile.id}`, { method: 'DELETE' });
        if (!delRes.ok) { const { error } = await delRes.json(); throw new Error(error || 'Failed to unfollow'); }
        // Refresh profile from server to get accurate counts
        qc.invalidateQueries({ queryKey: ['profile', username] });
        toast('Unfollowed', 'info');
      } else {
        setIsFollowing(true);
        setFollowerCount(c => (c ?? 0) + 1);
        const postRes = await fetch('/api/follows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target_id: profile.id }),
        });
        if (!postRes.ok) { const { error } = await postRes.json(); throw new Error(error || 'Failed to follow'); }
        // Refresh profile from server to get accurate counts
        qc.invalidateQueries({ queryKey: ['profile', username] });
        toast(`Following @${profile.username} 💎`, 'success');
      }
    } catch {
      // Rollback on error
      setIsFollowing(wasFollowing);
      setFollowerCount(profile.followers_count);
      toast('Failed to update follow', 'error');
    } finally {
      setFollowLoading(false);
    }
  }, [user, profile, isFollowing, router, qc, username]);

  // ── Loading skeleton ──────────────────────────────────────
  if (isLoading) return (
    <div className="min-h-screen bg-obsidian">
      <Navbar />
      <main className="pt-14 max-w-2xl mx-auto px-4 py-6 animate-pulse">
        <div className="flex gap-4 items-center mb-6">
          <div className="w-20 h-20 rounded-full skeleton" />
          <div className="flex-1 space-y-2">
            <div className="h-4 skeleton rounded w-32" />
            <div className="h-3 skeleton rounded w-24" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-0.5">
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ aspectRatio:'1/1' }} />)}
        </div>
      </main>
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center">
      <p className="text-ivory-muted">Profile not found</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-obsidian">
      <Navbar />
      <ToastContainer />

      <main className="pt-14 pb-20 sm:pb-8 max-w-2xl mx-auto">
        {/* Profile header */}
        <div className="px-4 pt-5 pb-4">
          <div className="flex items-start gap-4">
            <Avatar src={profile.avatar_url} username={profile.username} size="xl" ring />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-semibold text-lg text-ivory">@{profile.username}</h1>
                {profile.is_verified && <CheckCircle className="w-4 h-4 text-gold" fill="currentColor" />}
              </div>
              {profile.full_name && <p className="text-sm text-ivory-muted">{profile.full_name}</p>}
              {profile.location && (
                <p className="text-xs text-ivory-subtle flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />{profile.location}
                </p>
              )}

              {/* Stats */}
              <div className="flex gap-4 mt-3">
                <div className="text-center">
                  <p className="font-bold text-sm text-ivory">{formatNumber(profile.total_posts)}</p>
                  <p className="text-[10px] text-ivory-muted">Posts</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-sm text-ivory">{formatNumber(followerCount ?? profile.followers_count)}</p>
                  <p className="text-[10px] text-ivory-muted">Followers</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-sm text-ivory">{formatNumber(profile.following_count)}</p>
                  <p className="text-[10px] text-ivory-muted">Following</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-ivory-muted mt-3 leading-relaxed">{profile.bio}</p>
          )}

          {/* Contact links */}
          {(profile.whatsapp_number || profile.instagram_handle || profile.telegram_handle) && (
            <div className="flex flex-wrap gap-2 mt-3">
              {profile.whatsapp_number && (
                <a href={`https://wa.me/${profile.whatsapp_number.replace(/\D/g, '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/20 transition-colors">
                  📱 WhatsApp
                </a>
              )}
              {profile.instagram_handle && (
                <a href={`https://instagram.com/${profile.instagram_handle.replace('@', '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-[#E1306C]/10 text-[#E1306C] border border-[#E1306C]/30 hover:bg-[#E1306C]/20 transition-colors">
                  📸 @{profile.instagram_handle.replace('@', '')}
                </a>
              )}
              {profile.telegram_handle && (
                <a href={`https://t.me/${profile.telegram_handle.replace('@', '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-[#0088CC]/10 text-[#0088CC] border border-[#0088CC]/30 hover:bg-[#0088CC]/20 transition-colors">
                  ✈️ Telegram
                </a>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 mt-4">
            {isOwn ? (
              // ── Own profile: Edit | Post | Sign Out ──────────
              <>
                <Link href="/profile/edit" className="btn-outline flex-1 justify-center text-sm rounded-xl py-2">
                  <Settings className="w-4 h-4" /> Edit Profile
                </Link>
                <Link href="/create" className="btn-gold flex-1 justify-center text-sm rounded-xl py-2">
                  💎 Post Gem
                </Link>
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  title="Sign Out"
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              // ── Other profile: Follow | DM ────────────────────
              <>
                <button
                  onClick={handleFollow}
                  disabled={followLoading || isFollowing === null}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 text-sm rounded-xl py-2 font-semibold transition-all',
                    isFollowing
                      ? 'border border-[#333] text-ivory-muted hover:border-red-500/50 hover:text-red-400'
                      : 'btn-gold'
                  )}
                >
                  {followLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isFollowing ? (
                    <><UserMinus className="w-4 h-4" /> Unfollow</>
                  ) : (
                    <><UserPlus className="w-4 h-4" /> Follow</>
                  )}
                </button>

                <button
                  onClick={() => user ? setShowDM(true) : router.push('/auth')}
                  className="btn-outline flex items-center justify-center gap-2 px-4 rounded-xl py-2 text-sm"
                >
                  <MessageCircle className="w-4 h-4" /> DM
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-t border-[#1e1e1e] flex">
          {[
            { key: 'posts', label: `Available (${activePosts.length})`, icon: Grid3X3 },
            { key: 'sold', label: `Sold (${soldPosts.length})`, icon: CheckCircle },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key as 'posts' | 'sold')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold border-t-2 transition-colors',
                tab === key ? 'border-gold text-gold' : 'border-transparent text-ivory-subtle hover:text-ivory'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Posts grid */}
        {displayPosts.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-4xl mb-3">💎</div>
            <p className="text-ivory-muted text-sm">
              {tab === 'posts' ? 'No active listings' : 'No sold items yet'}
            </p>
            {isOwn && tab === 'posts' && (
              <Link href="/create" className="btn-gold mt-4 inline-flex rounded-full px-5 py-2">
                Post Your First Gem
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5">
            {displayPosts.map(post => {
              const img = post.gem_images?.find(i => i.is_primary) ?? post.gem_images?.[0];
              return (
                <Link key={post.id} href={`/post/${post.id}`} className="relative overflow-hidden" style={{ aspectRatio: '1/1' }}>
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={getImageUrl(img.url)} alt={post.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center">
                      <span className="text-2xl opacity-30">💎</span>
                    </div>
                  )}
                  {post.is_sold && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-xs font-bold text-red-400 bg-black/80 px-2 py-1 rounded-full">SOLD</span>
                    </div>
                  )}
                  {post.price && (
                    <div className="absolute bottom-1 right-1 text-[9px] font-bold bg-black/70 text-white px-1.5 py-0.5 rounded-full">
                      ${Math.round(post.price / 1000)}K
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />

      {/* Profile DM Modal */}
      {showDM && <ProfileDMModal target={profile} onClose={() => setShowDM(false)} />}
    </div>
  );
}