'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ChevronLeft, ChevronRight, Award, ShoppingBag, Heart, Star, Send, ShieldCheck, Store } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuthStore } from '@/stores/auth.store';
import { reviewSchema, type ReviewFormData } from '@/lib/validations';
import { getProductImageUrl, formatDate, getAvatarUrl, cn } from '@/lib/utils';
import { StarRating, VerifiedBadge } from '@/components/common/index';
import type { ProductWithImages, ProductImage, Review } from '@/types';

// ============================================================
// ProductGallery
// ============================================================
export function ProductGallery({
  images,
  productName,
}: {
  images: ProductImage[];
  productName: string;
}) {
  const sorted = [...images].sort((a, b) => {
    if (a.is_primary) return -1;
    if (b.is_primary) return 1;
    return a.display_order - b.display_order;
  });
  const [activeIdx, setActiveIdx] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const activeImage = sorted[activeIdx];

  const prev = () => setActiveIdx((i) => (i === 0 ? sorted.length - 1 : i - 1));
  const next = () => setActiveIdx((i) => (i === sorted.length - 1 ? 0 : i + 1));

  return (
    <div className="flex flex-col gap-4">
      {/* Main image */}
      <div className="relative aspect-square rounded-xl overflow-hidden bg-obsidian-light border border-obsidian-border group">
        <AnimatePresence mode="wait">
          <motion.img
            key={activeIdx}
            src={getProductImageUrl(activeImage?.url)}
            alt={activeImage?.alt_text ?? productName}
            className="w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        </AnimatePresence>

        {/* Navigation arrows */}
        {sorted.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-obsidian/70 backdrop-blur-sm text-ivory opacity-0 group-hover:opacity-100 transition-opacity hover:bg-obsidian"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-obsidian/70 backdrop-blur-sm text-ivory opacity-0 group-hover:opacity-100 transition-opacity hover:bg-obsidian"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Zoom button */}
        <button
          onClick={() => setIsZoomed(true)}
          className="absolute top-3 right-3 p-2 rounded-full bg-obsidian/70 backdrop-blur-sm text-ivory opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Image counter */}
        {sorted.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {sorted.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={cn(
                  'w-1.5 h-1.5 rounded-full transition-all',
                  i === activeIdx ? 'bg-gold w-4' : 'bg-ivory/30'
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sorted.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiveIdx(i)}
              className={cn(
                'flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all',
                i === activeIdx
                  ? 'border-gold'
                  : 'border-obsidian-border hover:border-gold/40'
              )}
            >
              <img
                src={getProductImageUrl(img.url)}
                alt={img.alt_text ?? `Image ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Zoom modal */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsZoomed(false)}
            className="fixed inset-0 z-50 bg-obsidian/95 backdrop-blur-md flex items-center justify-center p-4"
          >
            <img
              src={getProductImageUrl(activeImage?.url)}
              alt={productName}
              className="max-w-full max-h-full object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// ProductSpecsTable
// ============================================================
export function ProductSpecsTable({ product }: { product: ProductWithImages }) {
  const specs = [
    { label: 'Gemstone Type', value: product.gemstone_type },
    { label: 'Carat Weight', value: `${product.carat_weight} ct` },
    { label: 'Cut', value: product.cut ?? '—' },
    { label: 'Clarity', value: product.clarity ?? '—' },
    { label: 'Color Grade', value: product.color_grade ?? '—' },
    { label: 'Origin', value: product.origin_country ?? '—' },
    { label: 'Treatment', value: product.treatment },
    { label: 'Certification', value: product.certification_body },
    { label: 'Cert. Number', value: product.certification_number ?? '—' },
    { label: 'Dimensions', value: product.dimensions_mm ?? '—' },
    { label: 'Weight (grams)', value: product.weight_grams ? `${product.weight_grams}g` : '—' },
    { label: 'Currency', value: product.currency },
    { label: 'Stock', value: `${product.stock_quantity} available` },
  ];

  return (
    <div className="card overflow-hidden">
      <table className="w-full">
        <tbody>
          {specs.map((spec, i) => (
            <tr
              key={spec.label}
              className={cn(
                'border-b border-obsidian-border/50 last:border-0',
                i % 2 === 0 ? 'bg-obsidian-mid' : 'bg-obsidian-light/20'
              )}
            >
              <td className="py-3 px-5 text-xs font-medium text-ivory-subtle uppercase tracking-wider w-40">
                {spec.label}
              </td>
              <td className="py-3 px-5 text-sm text-ivory font-medium">{spec.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// CertificationBadge
// ============================================================
const CERT_COLORS: Record<string, string> = {
  GIA: 'text-green-400 bg-green-400/10 border-green-400/25 cert-gia',
  IGI: 'text-blue-400 bg-blue-400/10 border-blue-400/25 cert-igi',
  AGL: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/25 cert-agl',
  GRS: 'text-purple-400 bg-purple-400/10 border-purple-400/25',
  'Gübelin': 'text-red-400 bg-red-400/10 border-red-400/25',
};

export function CertificationBadge({
  body,
  number,
}: {
  body: string;
  number?: string;
}) {
  if (body === 'None') return null;
  const colorClass = CERT_COLORS[body] ?? 'text-ivory bg-obsidian-light border-obsidian-border';

  return (
    <span className={cn('badge border font-semibold', colorClass)}>
      <Award className="w-3 h-3" />
      {body} Certified
      {number && <span className="opacity-70 font-normal">#{number}</span>}
    </span>
  );
}

// ============================================================
// SellerCard
// ============================================================
export function SellerCard({ seller }: { seller: any }) {
  return (
    <div className="card p-5">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-obsidian-light border border-obsidian-border flex items-center justify-center flex-shrink-0 overflow-hidden">
          {seller.store_logo_url ? (
            <img src={seller.store_logo_url} alt={seller.store_name} className="w-full h-full object-cover" />
          ) : (
            <Store className="w-5 h-5 text-ivory-subtle" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <Link href={`/marketplace?seller_id=${seller.id}`} className="font-medium text-ivory hover:text-gold transition-colors">
              {seller.store_name}
            </Link>
            {seller.verification_status === 'approved' && <VerifiedBadge size="sm" />}
          </div>
          {seller.rating > 0 && (
            <StarRating rating={seller.rating} count={seller.review_count} size="sm" />
          )}
          {seller.store_description && (
            <p className="text-xs text-ivory-muted mt-2 line-clamp-2">{seller.store_description}</p>
          )}
          <p className="text-xs text-ivory-subtle mt-1">{seller.total_orders} orders completed</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// AddToCartButton
// ============================================================
export function AddToCartButton({
  product,
  className,
}: {
  product: ProductWithImages;
  className?: string;
}) {
  const { addToCart, isLoading } = useCart();
  const isOutOfStock = product.stock_quantity === 0;

  return (
    <button
      onClick={() => addToCart(product)}
      disabled={isOutOfStock || isLoading}
      className={cn('btn-gold gap-2 justify-center', className)}
    >
      <ShoppingBag className="w-4 h-4" />
      {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
    </button>
  );
}

// ============================================================
// WishlistButton
// ============================================================
export function WishlistButton({ productId }: { productId: string }) {
  const { isWishlisted, toggleWishlist, isMutating } = useWishlist();
  const wishlisted = isWishlisted(productId);

  return (
    <button
      onClick={() => toggleWishlist(productId)}
      disabled={isMutating}
      className={cn(
        'p-3 rounded-lg border transition-all duration-200',
        wishlisted
          ? 'border-red-400/40 bg-red-400/10 text-red-400'
          : 'border-obsidian-border text-ivory-muted hover:border-gold/40 hover:text-gold'
      )}
      aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart className={cn('w-5 h-5', wishlisted && 'fill-current')} />
    </button>
  );
}

// ============================================================
// ReviewsList + ReviewForm
// ============================================================
export function ReviewsList({ productId }: { productId: string }) {
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const res = await fetch(`/api/reviews?product_id=${productId}`);
      if (!res.ok) throw new Error('Failed to load reviews');
      const { data } = await res.json();
      return data ?? [];
    },
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } =
    useForm<ReviewFormData>({ resolver: zodResolver(reviewSchema) });

  const selectedRating = watch('rating');

  const submitMutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, product_id: productId }),
      });
      if (!res.ok) throw new Error('Failed to submit review');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      reset();
    },
  });

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="font-serif text-3xl text-ivory font-light">Customer Reviews</h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-3 mt-2">
              <span className="font-serif text-5xl text-gold">{avgRating.toFixed(1)}</span>
              <div>
                <StarRating rating={avgRating} size="md" />
                <p className="text-sm text-ivory-muted mt-0.5">{reviews.length} reviews</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Write review form */}
      {isAuthenticated && (
        <div className="card p-6 mb-8">
          <h3 className="font-serif text-xl text-ivory mb-4">Write a Review</h3>
          <form onSubmit={handleSubmit((d) => submitMutation.mutate(d))} className="space-y-4">
            <div>
              <label className="label">Rating *</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setValue('rating', star)}
                    className="p-1"
                  >
                    <Star
                      className={cn(
                        'w-6 h-6 transition-colors',
                        star <= (selectedRating ?? 0)
                          ? 'fill-gold text-gold'
                          : 'fill-transparent text-obsidian-border hover:text-gold/50'
                      )}
                    />
                  </button>
                ))}
              </div>
              {errors.rating && <p className="error-text">{errors.rating.message}</p>}
            </div>

            <div>
              <label className="label">Title</label>
              <input {...register('title')} className="input" placeholder="Summarize your experience" />
            </div>

            <div>
              <label className="label">Review</label>
              <textarea
                {...register('body')}
                rows={4}
                className="input resize-none"
                placeholder="Share your detailed experience with this gem…"
              />
              {errors.body && <p className="error-text">{errors.body.message}</p>}
            </div>

            <button
              type="submit"
              disabled={submitMutation.isPending}
              className="btn-gold gap-2"
            >
              <Send className="w-4 h-4" />
              {submitMutation.isPending ? 'Submitting…' : 'Submit Review'}
            </button>
          </form>
        </div>
      )}

      {/* Reviews list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-5 space-y-3 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full skeleton" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 skeleton rounded w-1/4" />
                  <div className="h-3 skeleton rounded w-1/3" />
                </div>
              </div>
              <div className="h-3 skeleton rounded w-3/4" />
              <div className="h-3 skeleton rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 text-ivory-muted">
          <Star className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p>No reviews yet. Be the first to review this gem!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="card p-5">
              <div className="flex items-start gap-3 mb-3">
                <img
                  src={getAvatarUrl(review.profiles?.avatar_url, review.profiles?.full_name ?? undefined)}
                  alt={review.profiles?.full_name ?? 'Reviewer'}
                  className="w-9 h-9 rounded-full object-cover border border-obsidian-border"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-ivory">
                      {review.profiles?.full_name ?? 'Anonymous'}
                    </p>
                    {review.is_verified_purchase && (
                      <span className="badge text-[10px] bg-green-400/10 text-green-400 border border-green-400/20">
                        <ShieldCheck className="w-2.5 h-2.5" /> Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StarRating rating={review.rating} size="sm" />
                    <span className="text-xs text-ivory-subtle">{formatDate(review.created_at)}</span>
                  </div>
                </div>
              </div>
              {review.title && (
                <p className="text-sm font-semibold text-ivory mb-1">{review.title}</p>
              )}
              {review.body && (
                <p className="text-sm text-ivory-muted leading-relaxed">{review.body}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
