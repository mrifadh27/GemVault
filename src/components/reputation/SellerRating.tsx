'use client';

import { useState } from 'react';
import { Star, X, CheckCircle } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar } from '@/components/common/Avatar';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/common/Toast';
import { cn, formatRelativeDate } from '@/lib/utils';
import type { SellerReview } from '@/types';

// ─── Star display ─────────────────────────────────────────────

interface StarsProps { rating: number; size?: 'sm' | 'md'; interactive?: boolean; onChange?: (v: number) => void; }

export function Stars({ rating, size = 'sm', interactive, onChange }: StarsProps) {
  const [hover, setHover] = useState(0);
  const display = hover || rating;
  const sz = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={cn(sz, 'transition-colors', interactive && 'cursor-pointer', i <= display ? 'text-gold fill-gold' : 'text-[#333]')}
          onClick={() => interactive && onChange?.(i)}
          onMouseEnter={() => interactive && setHover(i)}
          onMouseLeave={() => interactive && setHover(0)}
        />
      ))}
    </div>
  );
}

// ─── Inline seller rating badge ───────────────────────────────

interface SellerRatingBadgeProps { avg: number | null; count: number; onClick?: () => void; }

export function SellerRatingBadge({ avg, count, onClick }: SellerRatingBadgeProps) {
  if (!avg || count === 0) return null;
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 text-xs text-ivory-muted hover:text-ivory transition-colors"
    >
      <Star className="w-3 h-3 text-gold fill-gold" />
      <span className="text-gold font-medium">{avg.toFixed(1)}</span>
      <span className="text-ivory-subtle">({count})</span>
    </button>
  );
}

// ─── Reviews list ─────────────────────────────────────────────

interface ReviewsListProps { sellerId: string; }

export function ReviewsList({ sellerId }: ReviewsListProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['reviews', sellerId],
    queryFn: async () => {
      const res = await fetch(`/api/reviews?seller_id=${sellerId}`);
      if (!res.ok) return { data: [], stats: null };
      return res.json();
    },
    staleTime: 60_000,
  });

  const reviews: SellerReview[] = data?.data || [];
  const stats = data?.stats;

  if (isLoading) return <div className="h-24 skeleton rounded-xl" />;
  if (!reviews.length) return (
    <div className="text-center py-6">
      <Star className="w-8 h-8 text-[#333] mx-auto mb-2" />
      <p className="text-xs text-ivory-subtle">No reviews yet</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Summary */}
      {stats && (
        <div className="bg-[#111] rounded-xl p-4 flex items-center gap-4">
          <div className="text-center">
            <p className="font-serif text-3xl text-gold">{stats.avg_rating?.toFixed(1)}</p>
            <Stars rating={Math.round(stats.avg_rating || 0)} />
            <p className="text-[10px] text-ivory-subtle mt-0.5">{stats.total} reviews</p>
          </div>
          <div className="flex-1 space-y-1">
            {stats.breakdown.map(({ star, count }: { star: number; count: number }) => (
              <div key={star} className="flex items-center gap-2">
                <span className="text-[10px] text-ivory-subtle w-4">{star}★</span>
                <div className="flex-1 h-1.5 bg-[#1e1e1e] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gold rounded-full"
                    style={{ width: `${stats.total ? (count / stats.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-[10px] text-ivory-subtle w-4">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Individual reviews */}
      {reviews.map(r => (
        <div key={r.id} className="flex gap-3">
          <Avatar src={r.reviewer?.avatar_url} username={r.reviewer?.username} size="xs" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-ivory">@{r.reviewer?.username}</span>
              {r.reviewer?.is_verified && <CheckCircle className="w-3 h-3 text-gold" fill="currentColor" />}
              <Stars rating={r.rating} />
              {r.is_verified_purchase && (
                <span className="text-[9px] text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded-full">Verified Deal</span>
              )}
            </div>
            {r.review_text && <p className="text-xs text-ivory-muted leading-relaxed">{r.review_text}</p>}
            {(r.description_accuracy || r.photo_accuracy || r.communication) && (
              <div className="flex gap-3 mt-1.5">
                {r.description_accuracy && (
                  <div className="text-[10px] text-ivory-subtle">
                    Desc. <span className="text-gold">{r.description_accuracy}/5</span>
                  </div>
                )}
                {r.photo_accuracy && (
                  <div className="text-[10px] text-ivory-subtle">
                    Photos <span className="text-gold">{r.photo_accuracy}/5</span>
                  </div>
                )}
                {r.communication && (
                  <div className="text-[10px] text-ivory-subtle">
                    Comms <span className="text-gold">{r.communication}/5</span>
                  </div>
                )}
              </div>
            )}
            <p className="text-[10px] text-ivory-subtle mt-1">{formatRelativeDate(r.created_at)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Leave a review modal ─────────────────────────────────────

interface ReviewModalProps {
  sellerId: string;
  postId?: string;
  onClose: () => void;
}

export function ReviewModal({ sellerId, postId, onClose }: ReviewModalProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [rating, setRating] = useState(0);
  const [descAcc, setDescAcc] = useState(0);
  const [photoAcc, setPhotoAcc] = useState(0);
  const [comm, setComm] = useState(0);
  const [text, setText] = useState('');

  const submit = useMutation({
    mutationFn: async () => {
      if (rating === 0) throw new Error('Please select a rating');
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seller_id: sellerId, post_id: postId, rating,
          description_accuracy: descAcc || null,
          photo_accuracy: photoAcc || null,
          communication: comm || null,
          review_text: text.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to submit');
      return json.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews', sellerId] });
      toast('Review submitted! Thank you 🙏', 'success');
      onClose();
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0f0f0f] border border-[#222] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#1e1e1e]">
          <h2 className="font-semibold text-ivory">Leave a Review</h2>
          <button onClick={onClose} className="btn-icon w-8 h-8"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-5 py-4 space-y-5">
          {/* Overall rating */}
          <div>
            <label className="label">Overall Rating *</label>
            <Stars rating={rating} size="md" interactive onChange={setRating} />
          </div>

          {/* Sub-ratings */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Description', val: descAcc, set: setDescAcc },
              { label: 'Photos', val: photoAcc, set: setPhotoAcc },
              { label: 'Communication', val: comm, set: setComm },
            ].map(({ label, val, set }) => (
              <div key={label} className="text-center">
                <p className="text-[10px] text-ivory-subtle mb-1">{label}</p>
                <Stars rating={val} size="sm" interactive onChange={set} />
              </div>
            ))}
          </div>

          {/* Text */}
          <div>
            <label className="label">Your Review</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Share your experience with this seller…"
              rows={4}
              maxLength={1000}
              className="input resize-none"
            />
            <p className="text-[10px] text-ivory-subtle mt-1 text-right">{text.length}/1000</p>
          </div>

          <button
            onClick={() => submit.mutate()}
            disabled={rating === 0 || submit.isPending}
            className="btn-gold w-full rounded-full py-3"
          >
            {submit.isPending ? 'Submitting…' : 'Submit Review'}
          </button>
        </div>
      </div>
    </div>
  );
}
