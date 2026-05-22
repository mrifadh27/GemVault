'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Heart, MessageCircle, Bookmark, Share2, ChevronLeft, ChevronRight,
  MoreHorizontal, CheckCircle, MapPin, Award, Tag, DollarSign, Play,
  Star, Layers
} from 'lucide-react';
import { cn, formatPrice, formatRelativeDate, getImageUrl, formatNumber } from '@/lib/utils';
import { Avatar } from '@/components/common/Avatar';
import { GemBadge } from '@/components/common/GemBadge';
import { DMModal } from '@/components/dm/DMModal';
import { OfferModal } from '@/components/offers/OfferModal';
import { VideoPlayer } from '@/components/common/VideoPlayer';
import { useToggleLike } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';
import type { GemPostWithDetails } from '@/types';
import { toast } from '@/components/common/Toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

interface PostCardProps {
  post: GemPostWithDetails;
  compact?: boolean;
}

export function PostCard({ post, compact }: PostCardProps) {
  const { user } = useAuth();
  const [imgIndex, setImgIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [liked, setLiked] = useState(post.is_liked ?? false);
  const [likesCount, setLikesCount] = useState(post.likes_count ?? 0);
  const [saved, setSaved] = useState(post.is_saved ?? false);
  const [showDM, setShowDM] = useState(false);
  const [showOffer, setShowOffer] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);
  const lastTap = useRef(0);
  const toggleLike = useToggleLike();

  const images = post.gem_images || [];
  const currentImg = images[imgIndex];
  const seller = post.profiles;
  const isOwnPost = user?.id === post.seller_id;

  const handleLike = useCallback(async () => {
    if (!user) { toast('Sign in to like posts', 'info'); return; }
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikesCount(c => wasLiked ? c - 1 : c + 1);
    try {
      await toggleLike.mutateAsync({ postId: post.id, liked: wasLiked });
    } catch {
      setLiked(wasLiked);
      setLikesCount(c => wasLiked ? c + 1 : c - 1);
    }
  }, [liked, user, post.id, toggleLike]);

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!liked) {
        handleLike();
        setHeartAnim(true);
        setTimeout(() => setHeartAnim(false), 800);
      }
    }
    lastTap.current = now;
  }, [liked, handleLike]);

  const handleSave = async () => {
    if (!user) { toast('Sign in to save posts', 'info'); return; }
    const wasSaved = saved;
    setSaved(!wasSaved);
    try {
      const supabase = getSupabaseBrowserClient();
      if (wasSaved) {
        await (supabase.from('post_saves') as any).delete().eq('post_id', post.id).eq('user_id', user.id);
        toast('Removed from saved', 'info');
      } else {
        await (supabase.from('post_saves') as any).insert({ post_id: post.id, user_id: user.id });
        toast('Saved! 🔖', 'success');
      }
    } catch { setSaved(wasSaved); }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      await navigator.share({ title: post.title, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      toast('Link copied! 🔗', 'success');
    }
  };

  return (
    <>
      <article className="post-card bg-obsidian animate-fade-in">
        {/* ── Header ─────────────────────────────── */}
        <div className="flex items-center justify-between px-3 py-2.5">
          <Link href={`/profile/${seller.username}`} className="flex items-center gap-2.5">
            <Avatar src={seller.avatar_url} username={seller.username} size="sm" ring />
            <div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold text-ivory hover:text-gold transition-colors">
                  @{seller.username}
                </span>
                {seller.is_verified && (
                  <CheckCircle className="w-3.5 h-3.5 text-gold" fill="currentColor" />
                )}
                {/* Seller level badge */}
                {seller.seller_level && seller.seller_level !== 'new' && (
                  <span className={cn(
                    'text-[9px] px-1.5 py-0.5 rounded-full font-medium',
                    seller.seller_level === 'platinum' ? 'bg-slate-400/20 text-slate-300' :
                    seller.seller_level === 'gold' ? 'bg-gold/20 text-gold' :
                    seller.seller_level === 'silver' ? 'bg-gray-400/20 text-gray-400' :
                    'bg-amber-800/20 text-amber-700'
                  )}>
                    {seller.seller_level}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {seller.location && (
                  <div className="flex items-center gap-0.5 text-[10px] text-ivory-subtle">
                    <MapPin className="w-2.5 h-2.5" />
                    {seller.location}
                  </div>
                )}
                {/* Seller rating */}
                {seller.avg_rating && seller.review_count > 0 && (
                  <div className="flex items-center gap-0.5 text-[10px] text-ivory-subtle">
                    <Star className="w-2.5 h-2.5 text-gold fill-gold" />
                    <span className="text-gold">{seller.avg_rating.toFixed(1)}</span>
                    <span>({seller.review_count})</span>
                  </div>
                )}
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            {post.is_lot && (
              <span className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Layers className="w-2.5 h-2.5" /> LOT
              </span>
            )}
            {post.is_sold && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                SOLD
              </span>
            )}
            <button className="btn-icon w-7 h-7" onClick={() => setShowMore(!showMore)}>
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Media ──────────────────────────────── */}
        <div
          className="relative bg-[#0f0f0f] overflow-hidden"
          style={{ aspectRatio: compact ? '4/3' : '1/1' }}
          onClick={handleDoubleTap}
        >
          {/* Video toggle */}
          {post.video_url && showVideo ? (
            <VideoPlayer src={post.video_url} className="w-full h-full" autoPlay />
          ) : images.length > 0 ? (
            <img
              src={getImageUrl(currentImg?.url)}
              alt={post.title}
              className="w-full h-full object-cover select-none"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#0f0f0f]">
              <span className="text-6xl opacity-30">💎</span>
            </div>
          )}

          {/* Double-tap heart burst */}
          {heartAnim && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Heart className="w-24 h-24 text-red-500 heart-burst" fill="currentColor" />
            </div>
          )}

          {/* Video switch button */}
          {post.video_url && (
            <button
              onClick={e => { e.stopPropagation(); setShowVideo(v => !v); }}
              className="absolute top-2.5 right-2.5 flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-black/60 text-white backdrop-blur"
            >
              <Play className="w-2.5 h-2.5" />
              {showVideo ? 'Photo' : 'Video'}
            </button>
          )}

          {/* Image nav */}
          {!showVideo && images.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); setImgIndex(i => Math.max(0, i - 1)); }}
                className={cn(
                  'absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center transition-opacity',
                  imgIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'
                )}
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); setImgIndex(i => Math.min(images.length - 1, i + 1)); }}
                className={cn(
                  'absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center transition-opacity',
                  imgIndex === images.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'
                )}
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
              <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={e => { e.stopPropagation(); setImgIndex(i); }}
                    className={cn('w-1.5 h-1.5 rounded-full transition-all', i === imgIndex ? 'bg-white w-3' : 'bg-white/40')}
                  />
                ))}
              </div>
            </>
          )}

          {/* Cert badge */}
          {post.certification && post.certification !== 'None' && (
            <div className="absolute top-2.5 left-2.5">
              <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-gold/90 text-obsidian">
                <Award className="w-2.5 h-2.5" />
                {post.certification}
              </div>
            </div>
          )}

          {/* Price overlay */}
          {post.price && (
            <div className="absolute bottom-2.5 right-2.5">
              <div className="bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {formatPrice(post.price, post.currency)}
                {post.is_price_negotiable && <span className="ml-1 opacity-70">~</span>}
              </div>
            </div>
          )}
        </div>

        {/* ── Actions ────────────────────────────── */}
        <div className="px-3 pt-2.5 pb-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={handleLike} className="flex items-center gap-1.5 group">
                <Heart
                  className={cn(
                    'w-6 h-6 transition-all duration-200',
                    liked ? 'text-red-500 scale-110 group-hover:scale-100' : 'text-ivory-muted group-hover:text-ivory'
                  )}
                  fill={liked ? 'currentColor' : 'none'}
                />
                <span className={cn('text-xs font-medium', liked ? 'text-red-400' : 'text-ivory-muted')}>
                  {formatNumber(likesCount)}
                </span>
              </button>

              {/* Comments */}
              <Link href={`/post/${post.id}#comments`} className="flex items-center gap-1.5 group">
                <MessageCircle className="w-5 h-5 text-ivory-muted group-hover:text-ivory transition-colors" />
                {(post.comments_count ?? 0) > 0 && (
                  <span className="text-xs text-ivory-muted">{formatNumber(post.comments_count ?? 0)}</span>
                )}
              </Link>

              {/* Make an offer (non-owner, not sold, price exists) */}
              {!isOwnPost && post.price && !post.is_sold && user && (
                <button
                  onClick={() => setShowOffer(true)}
                  className="flex items-center gap-1 text-xs text-ivory-muted hover:text-gold transition-colors group"
                >
                  <DollarSign className="w-4 h-4 group-hover:text-gold" />
                  Offer
                </button>
              )}

              <button onClick={handleShare} className="group">
                <Share2 className="w-5 h-5 text-ivory-muted group-hover:text-ivory transition-colors" />
              </button>
            </div>

            <button onClick={handleSave}>
              <Bookmark
                className={cn('w-5 h-5 transition-all', saved ? 'text-gold fill-gold' : 'text-ivory-muted hover:text-ivory')}
              />
            </button>
          </div>
        </div>

        {/* ── Info ───────────────────────────────── */}
        <div className="px-3 pb-3">
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <GemBadge type={post.gemstone_type} size="sm" />
            {post.carat_weight && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1a1a1a] text-ivory-muted border border-[#2a2a2a]">
                ⚖️ {post.carat_weight}ct
              </span>
            )}
            {post.origin_country && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1a1a1a] text-ivory-muted border border-[#2a2a2a]">
                🌍 {post.origin_country}
              </span>
            )}
            {post.treatment && post.treatment !== 'None' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                🔥 {post.treatment}
              </span>
            )}
            {/* Color grading badge */}
            {post.color_hue && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1a1a1a] text-ivory-muted border border-[#2a2a2a]">
                🎨 {post.color_hue}
              </span>
            )}
            {/* Lot count */}
            {post.is_lot && post.lot_stone_count && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                🪨 {post.lot_stone_count} stones
              </span>
            )}
          </div>

          <div className="mb-1">
            <span className="text-sm font-semibold text-ivory">{post.title}</span>
          </div>

          {post.description && (
            <div>
              <p className={cn('text-xs text-ivory-muted leading-relaxed', !showMore && 'line-clamp-2')}>
                {post.description}
              </p>
              {post.description.length > 80 && (
                <button onClick={() => setShowMore(!showMore)} className="text-xs text-ivory-subtle hover:text-ivory mt-0.5">
                  {showMore ? 'less' : 'more'}
                </button>
              )}
            </div>
          )}

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {post.tags.map(tag => (
                <Link key={tag} href={`/explore?search=${tag}`} className="text-[10px] text-gold/70 hover:text-gold transition-colors">
                  <Tag className="w-2.5 h-2.5 inline mr-0.5" />#{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Action buttons */}
          {!post.is_sold && !isOwnPost && (
            <div className="flex gap-2 mt-3">
              <button onClick={() => setShowDM(true)} className="dm-btn flex-1 justify-center">
                <MessageCircle className="w-4 h-4" />
                Contact Seller
              </button>
              {post.price && user && (
                <button
                  onClick={() => setShowOffer(true)}
                  className="flex items-center justify-center gap-1.5 flex-1 text-xs font-medium py-2 rounded-full border border-gold/40 text-gold hover:bg-gold/10 transition-colors"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  Make Offer
                </button>
              )}
            </div>
          )}

          <p className="text-[10px] text-ivory-subtle mt-2 uppercase tracking-wider">
            {formatRelativeDate(post.created_at)}
          </p>
        </div>
      </article>

      {showDM && <DMModal post={post} onClose={() => setShowDM(false)} />}
      {showOffer && <OfferModal post={post} onClose={() => setShowOffer(false)} />}
    </>
  );
}
