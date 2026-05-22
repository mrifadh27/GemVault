'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Heart, MessageCircle, Bookmark, Share2, ArrowLeft, ChevronLeft, ChevronRight,
  CheckCircle, MapPin, Award, MoreHorizontal, Trash2, Tag, Eye, DollarSign,
  Play, Star, Layers, BookOpen, BarChart2
} from 'lucide-react';
import Link from 'next/link';
import { cn, formatPrice, formatRelativeDate, getImageUrl, formatNumber } from '@/lib/utils';
import { Avatar } from '@/components/common/Avatar';
import { GemBadge } from '@/components/common/GemBadge';
import { DMModal } from '@/components/dm/DMModal';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { OfferModal } from '@/components/offers/OfferModal';
import { VideoPlayer } from '@/components/common/VideoPlayer';
import { CommentsSection } from '@/components/comments/CommentsSection';
import { SellerRatingBadge, ReviewsList, ReviewModal } from '@/components/reputation/SellerRating';
import { usePost, useToggleLike, useDeletePost, useMarkSold } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';
import { toast, ToastContainer } from '@/components/common/Toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

const CERT_VERIFY_URLS: Record<string, string> = {
  GIA: 'https://www.gia.edu/report-check?reportno=',
  GRS: 'https://www.gemresearch.ch/report-check/?report=',
  'Gübelin': 'https://report.gubelingemlab.com/?number=',
  AGL: 'https://aglgemlab.com/verify?cert=',
  Lotus: 'https://www.lotusgemology.com/index.php/services/report-check?number=',
};

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { data: post, isLoading, isError } = usePost(params.id as string);

  const [imgIndex, setImgIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [showDM, setShowDM] = useState(false);
  const [showOffer, setShowOffer] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);
  const [likesCount, setLikesCount] = useState<number | null>(null);
  const [saved, setSaved] = useState<boolean | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'comments'>('details');

  const toggleLike = useToggleLike();
  const deletePost = useDeletePost();
  const markSold = useMarkSold();

  if (isLoading) return (
    <div className="min-h-screen bg-obsidian">
      <Navbar />
      <main className="pt-14 max-w-2xl mx-auto">
        <div className="animate-pulse">
          <div className="skeleton w-full" style={{ aspectRatio: '1/1' }} />
          <div className="p-4 space-y-3">
            <div className="h-4 skeleton rounded w-3/4" />
            <div className="h-3 skeleton rounded w-1/2" />
          </div>
        </div>
      </main>
    </div>
  );

  if (isError || !post) return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center">
      <div className="text-center">
        <p className="text-ivory-muted mb-4">Post not found</p>
        <Link href="/" className="btn-outline rounded-full">Go Home</Link>
      </div>
    </div>
  );

  const images = post.gem_images || [];
  const seller = post.profiles;
  const isOwner = user?.id === post.seller_id;
  const isLiked = liked ?? post.is_liked ?? false;
  const likeCount = likesCount ?? post.likes_count ?? 0;
  const isSaved = saved ?? post.is_saved ?? false;
  const certVerifyUrl = post.certification && CERT_VERIFY_URLS[post.certification] && post.certification_number
    ? `${CERT_VERIFY_URLS[post.certification]}${post.certification_number}`
    : null;

  const handleLike = async () => {
    if (!user) { toast('Sign in to like', 'info'); return; }
    setLiked(!isLiked);
    setLikesCount(isLiked ? likeCount - 1 : likeCount + 1);
    try { await toggleLike.mutateAsync({ postId: post.id, liked: isLiked }); }
    catch { setLiked(isLiked); setLikesCount(likeCount); }
  };

  const handleSave = async () => {
    if (!user) { toast('Sign in to save', 'info'); return; }
    setSaved(!isSaved);
    const supabase = getSupabaseBrowserClient();
    if (isSaved) {
      await (supabase.from('post_saves') as any).delete().eq('post_id', post.id).eq('user_id', user.id);
      toast('Removed from saved', 'info');
    } else {
      await (supabase.from('post_saves') as any).insert({ post_id: post.id, user_id: user.id });
      toast('Saved! 🔖', 'success');
    }
  };

  const handleShare = async () => {
    if (navigator.share) await navigator.share({ title: post.title, url: window.location.href });
    else { await navigator.clipboard.writeText(window.location.href); toast('Link copied!', 'success'); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    try { await deletePost.mutateAsync(post.id); toast('Post deleted', 'info'); router.push('/'); }
    catch { toast('Failed to delete', 'error'); }
  };

  const handleMarkSold = async () => {
    try { await markSold.mutateAsync({ postId: post.id, sold: !post.is_sold }); toast(post.is_sold ? 'Marked as available' : 'Marked as sold', 'success'); }
    catch { toast('Failed to update', 'error'); }
  };

  return (
    <div className="min-h-screen bg-obsidian">
      <Navbar />
      <ToastContainer />

      <main className="pt-14 pb-20 sm:pb-8 max-w-2xl mx-auto">
        {/* Back */}
        <div className="px-3 py-2.5">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-ivory-muted hover:text-ivory transition-colors">
            <ArrowLeft className="w-4 h-4" /><span className="text-sm">Back</span>
          </button>
        </div>

        {/* Seller header */}
        <div className="flex items-center justify-between px-3 py-2">
          <Link href={`/profile/${seller.username}`} className="flex items-center gap-2.5">
            <Avatar src={seller.avatar_url} username={seller.username} size="sm" ring />
            <div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold text-ivory">@{seller.username}</span>
                {seller.is_verified && <CheckCircle className="w-3.5 h-3.5 text-gold" fill="currentColor" />}
              </div>
              <div className="flex items-center gap-2">
                {seller.location && (
                  <p className="text-[10px] text-ivory-subtle flex items-center gap-0.5">
                    <MapPin className="w-2.5 h-2.5" />{seller.location}
                  </p>
                )}
                <SellerRatingBadge
                  avg={seller.avg_rating}
                  count={seller.review_count || 0}
                  onClick={() => setShowReviews(v => !v)}
                />
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {post.is_lot && (
              <span className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Layers className="w-2.5 h-2.5" /> LOT {post.lot_stone_count && `(${post.lot_stone_count})`}
              </span>
            )}
            {post.is_sold && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">SOLD</span>}
            {isOwner && (
              <div className="relative">
                <button onClick={() => setShowMenu(!showMenu)} className="btn-icon w-7 h-7">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-8 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-xl z-10 overflow-hidden w-44">
                    <button onClick={handleMarkSold} className="w-full text-left px-4 py-2.5 text-sm text-ivory hover:bg-[#222] transition-colors">
                      {post.is_sold ? '✅ Mark Available' : '🔴 Mark as Sold'}
                    </button>
                    <button onClick={handleDelete} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-[#222] transition-colors flex items-center gap-2">
                      <Trash2 className="w-3.5 h-3.5" /> Delete Post
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Reviews panel */}
        {showReviews && (
          <div className="mx-3 mb-3 card p-4">
            <ReviewsList sellerId={seller.id} />
            {user && !isOwner && (
              <button onClick={() => { setShowReviews(false); setShowReview(true); }} className="btn-ghost text-xs mt-3 w-full">
                Leave a Review
              </button>
            )}
          </div>
        )}

        {/* Media */}
        <div className="relative bg-[#0f0f0f] overflow-hidden" style={{ aspectRatio: '1/1' }}>
          {post.video_url && showVideo ? (
            <VideoPlayer src={post.video_url} className="w-full h-full" autoPlay />
          ) : images.length > 0 ? (
            <img src={getImageUrl(images[imgIndex]?.url)} alt={post.title} className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><span className="text-6xl opacity-20">💎</span></div>
          )}

          {post.video_url && (
            <button
              onClick={() => setShowVideo(v => !v)}
              className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-black/60 text-white backdrop-blur"
            >
              <Play className="w-2.5 h-2.5" />{showVideo ? 'Photos' : 'Video'}
            </button>
          )}

          {!showVideo && images.length > 1 && (
            <>
              <button onClick={() => setImgIndex(i => Math.max(0, i - 1))} className={cn('absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center', imgIndex === 0 && 'opacity-0 pointer-events-none')}>
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              <button onClick={() => setImgIndex(i => Math.min(images.length - 1, i + 1))} className={cn('absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center', imgIndex === images.length - 1 && 'opacity-0 pointer-events-none')}>
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1">
                {images.map((_, i) => <button key={i} onClick={() => setImgIndex(i)} className={cn('w-1.5 h-1.5 rounded-full transition-all', i === imgIndex ? 'bg-white w-3' : 'bg-white/40')} />)}
              </div>
            </>
          )}

          {post.certification && post.certification !== 'None' && (
            <div className="absolute top-3 left-3 flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-gold/90 text-obsidian">
              <Award className="w-3 h-3" />{post.certification}
            </div>
          )}
        </div>

        {/* Actions bar */}
        <div className="px-3 pt-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={handleLike} className="flex items-center gap-1.5">
              <Heart className={cn('w-6 h-6 transition-all', isLiked ? 'text-red-500 scale-110' : 'text-ivory-muted')} fill={isLiked ? 'currentColor' : 'none'} />
              <span className={cn('text-sm font-medium', isLiked ? 'text-red-400' : 'text-ivory-muted')}>{formatNumber(likeCount)}</span>
            </button>
            <button
              onClick={() => { setActiveTab('comments'); document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="flex items-center gap-1.5"
            >
              <MessageCircle className="w-6 h-6 text-ivory-muted hover:text-gold transition-colors" />
              {(post.comments_count ?? 0) > 0 && <span className="text-sm text-ivory-muted">{formatNumber(post.comments_count ?? 0)}</span>}
            </button>
            <button onClick={handleShare}>
              <Share2 className="w-5 h-5 text-ivory-muted hover:text-ivory transition-colors" />
            </button>
            <span className="text-xs text-ivory-subtle flex items-center gap-1 ml-1">
              <Eye className="w-3.5 h-3.5" />{formatNumber(post.views_count)}
            </span>
          </div>
          <button onClick={handleSave}>
            <Bookmark className={cn('w-5 h-5 transition-all', isSaved ? 'text-gold fill-gold' : 'text-ivory-muted hover:text-ivory')} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#1e1e1e] mx-3 mt-3">
          {(['details', 'comments'] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={cn('flex-1 py-2.5 text-xs font-medium capitalize border-b-2 transition-colors', activeTab === t ? 'text-gold border-gold' : 'text-ivory-muted border-transparent')}
            >
              {t}{t === 'comments' && (post.comments_count ?? 0) > 0 ? ` (${post.comments_count})` : ''}
            </button>
          ))}
        </div>

        {/* Details tab */}
        {activeTab === 'details' && (
          <div className="px-3 py-3">
            {/* Price */}
            {post.price ? (
              <div className="mb-3 flex items-center gap-3">
                <span className="font-serif text-2xl text-gold font-light">{formatPrice(post.price, post.currency)}</span>
                {post.is_price_negotiable && <span className="text-sm text-ivory-muted">· Negotiable</span>}
              </div>
            ) : <p className="text-sm text-ivory-muted mb-3">💬 Price on request — DM seller</p>}

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              <GemBadge type={post.gemstone_type} />
              {post.carat_weight && <span className="text-xs px-2.5 py-1 rounded-full bg-[#1a1a1a] text-ivory-muted border border-[#2a2a2a]">⚖️ {post.carat_weight}ct</span>}
              {post.origin_country && <span className="text-xs px-2.5 py-1 rounded-full bg-[#1a1a1a] text-ivory-muted border border-[#2a2a2a]">🌍 {post.origin_country}</span>}
              {post.treatment && post.treatment !== 'None' && <span className="text-xs px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">🔥 {post.treatment}</span>}
              {post.color_hue && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-[#1a1a1a] text-ivory-muted border border-[#2a2a2a]">
                  🎨 {post.color_hue}{post.color_tone ? ` T${post.color_tone}` : ''}{post.color_saturation ? ` S${post.color_saturation}` : ''}
                </span>
              )}
            </div>

            <h1 className="font-semibold text-lg text-ivory mb-2">{post.title}</h1>
            {post.description && <p className="text-sm text-ivory-muted leading-relaxed mb-3">{post.description}</p>}

            {/* Certificate + verify link */}
            {post.certification && post.certification !== 'None' && post.certification_number && (
              <div className="flex items-center gap-2 mb-3">
                <p className="text-xs text-gold/80">📜 {post.certification} #{post.certification_number}</p>
                {certVerifyUrl && (
                  <a href={certVerifyUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-gold border border-gold/30 px-2 py-0.5 rounded-full hover:bg-gold/10 transition-colors">
                    Verify ↗
                  </a>
                )}
              </div>
            )}

            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map(tag => (
                  <Link key={tag} href={`/explore?search=${tag}`} className="text-xs text-gold/70 hover:text-gold transition-colors">
                    <Tag className="w-2.5 h-2.5 inline mr-0.5" />#{tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Action buttons */}
            {!isOwner && !post.is_sold && (
              <div className="flex gap-2 mb-4">
                <button onClick={() => setShowDM(true)} className="dm-btn flex-1 justify-center py-3.5 rounded-2xl text-sm font-bold">
                  <MessageCircle className="w-5 h-5" /> Contact Seller
                </button>
                {post.price && user && (
                  <button
                    onClick={() => setShowOffer(true)}
                    className="flex items-center justify-center gap-1.5 flex-1 text-sm font-bold py-3.5 rounded-2xl border border-gold/40 text-gold hover:bg-gold/10 transition-colors"
                  >
                    <DollarSign className="w-4 h-4" /> Make Offer
                  </button>
                )}
              </div>
            )}

            {/* Seller card */}
            <div className="card p-4 flex items-center gap-3 mt-2">
              <Avatar src={seller.avatar_url} username={seller.username} size="md" ring />
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-sm text-ivory">@{seller.username}</span>
                  {seller.is_verified && <CheckCircle className="w-3.5 h-3.5 text-gold" fill="currentColor" />}
                </div>
                <SellerRatingBadge avg={seller.avg_rating} count={seller.review_count || 0} onClick={() => setShowReviews(v => !v)} />
                {seller.bio && <p className="text-xs text-ivory-muted line-clamp-1 mt-0.5">{seller.bio}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Link href={`/profile/${seller.username}`} className="btn-outline text-xs px-3 py-1.5 rounded-full text-center">Profile</Link>
                {user && !isOwner && (
                  <button onClick={() => setShowReview(true)} className="text-xs text-gold/70 hover:text-gold transition-colors flex items-center gap-1">
                    <Star className="w-3 h-3" /> Review
                  </button>
                )}
              </div>
            </div>

            <p className="text-[10px] text-ivory-subtle mt-3 uppercase tracking-wider">
              Posted {formatRelativeDate(post.created_at)}
            </p>
          </div>
        )}

        {/* Comments tab */}
        {activeTab === 'comments' && (
          <div id="comments" className="mt-3">
            <CommentsSection postId={post.id} commentsCount={post.comments_count ?? 0} />
          </div>
        )}
      </main>

      <BottomNav />
      {showDM && <DMModal post={post} onClose={() => setShowDM(false)} />}
      {showOffer && <OfferModal post={post} onClose={() => setShowOffer(false)} />}
      {showReview && <ReviewModal sellerId={seller.id} postId={post.id} onClose={() => setShowReview(false)} />}
    </div>
  );
}
