'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Grid3X3, CheckCircle, MapPin, Settings, MessageCircle, ExternalLink
} from 'lucide-react';
import { cn, formatNumber, getImageUrl } from '@/lib/utils';
import { Avatar } from '@/components/common/Avatar';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import type { Profile, GemPostWithDetails } from '@/types';
import { ToastContainer } from '@/components/common/Toast';

async function fetchProfile(username: string): Promise<Profile> {
  const res = await fetch(`/api/profile?username=${encodeURIComponent(username)}`);
  if (!res.ok) throw new Error('Profile not found');
  const { data } = await res.json();
  return data;
}

async function fetchUserPosts(sellerId: string): Promise<GemPostWithDetails[]> {
  const res = await fetch(`/api/posts?seller_id=${sellerId}&limit=30`);
  if (!res.ok) return [];
  const { data } = await res.json();
  return data;
}

export default function ProfilePage() {
  const params = useParams();
  const username = decodeURIComponent(params.username as string);
  const { user, profile: myProfile } = useAuth();
  const [tab, setTab] = useState<'posts' | 'sold'>('posts');

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
  const activePosts = posts.filter(p => !p.is_sold);
  const soldPosts = posts.filter(p => p.is_sold);
  const displayPosts = tab === 'posts' ? activePosts : soldPosts;

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
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{aspectRatio:'1/1'}} />)}
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
                {[
                  { label: 'Posts', value: profile.total_posts },
                  { label: 'Followers', value: profile.followers_count },
                  { label: 'Following', value: profile.following_count },
                ].map(stat => (
                  <div key={stat.label} className="text-center">
                    <p className="font-bold text-sm text-ivory">{formatNumber(stat.value)}</p>
                    <p className="text-[10px] text-ivory-muted">{stat.label}</p>
                  </div>
                ))}
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
                <a href={`https://wa.me/${profile.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/20 transition-colors">
                  📱 WhatsApp
                </a>
              )}
              {profile.instagram_handle && (
                <a href={`https://instagram.com/${profile.instagram_handle.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-[#E1306C]/10 text-[#E1306C] border border-[#E1306C]/30 hover:bg-[#E1306C]/20 transition-colors">
                  📸 @{profile.instagram_handle.replace('@', '')}
                </a>
              )}
              {profile.telegram_handle && (
                <a href={`https://t.me/${profile.telegram_handle.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-[#0088CC]/10 text-[#0088CC] border border-[#0088CC]/30 hover:bg-[#0088CC]/20 transition-colors">
                  ✈️ Telegram
                </a>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 mt-4">
            {isOwn ? (
              <>
                <Link href="/profile/edit" className="btn-outline flex-1 justify-center text-sm rounded-xl py-2">
                  <Settings className="w-4 h-4" /> Edit Profile
                </Link>
                <Link href="/create" className="btn-gold flex-1 justify-center text-sm rounded-xl py-2">
                  💎 Post Gem
                </Link>
              </>
            ) : (
              <>
                <button className="btn-gold flex-1 justify-center text-sm rounded-xl py-2">
                  Follow
                </button>
                <Link href={`/messages?seller=${profile.id}`} className="btn-outline px-4 rounded-xl py-2">
                  <MessageCircle className="w-4 h-4" />
                </Link>
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
    </div>
  );
}
