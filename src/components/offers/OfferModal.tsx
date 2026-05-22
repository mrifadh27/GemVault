'use client';

import { useState } from 'react';
import { X, DollarSign, MessageSquare, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cn, formatPrice } from '@/lib/utils';
import { toast } from '@/components/common/Toast';
import { useAuth } from '@/hooks/useAuth';
import type { GemPostWithDetails, GemOffer } from '@/types';

interface OfferModalProps {
  post: GemPostWithDetails;
  onClose: () => void;
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'THB', 'HKD', 'SGD', 'INR', 'JPY'];

export function OfferModal({ post, onClose }: OfferModalProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isOwner = user?.id === post.seller_id;
  const [offerPrice, setOfferPrice] = useState('');
  const [currency, setCurrency] = useState(post.currency || 'USD');
  const [message, setMessage] = useState('');
  const [step, setStep] = useState<'form' | 'success'>('form');

  // Fetch existing offers (seller sees all offers on this post; buyer sees their own)
  const { data: offers = [] } = useQuery<GemOffer[]>({
    queryKey: ['offers', post.id],
    queryFn: async () => {
      const params = isOwner ? `post_id=${post.id}` : `post_id=${post.id}&role=buyer`;
      const res = await fetch(`/api/offers?${params}`);
      if (!res.ok) return [];
      const { data } = await res.json();
      return data;
    },
    enabled: !!user,
  });

  const createOffer = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: post.id, offer_price: parseFloat(offerPrice), currency, message }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to submit offer');
      return json.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['offers', post.id] });
      setStep('success');
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const respondOffer = useMutation({
    mutationFn: async ({ id, action, counter_price, counter_message }: { id: string; action: string; counter_price?: number; counter_message?: string }) => {
      const res = await fetch(`/api/offers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, counter_price, counter_message }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      return json.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['offers', post.id] });
      toast('Response sent!', 'success');
    },
    onError: (err: Error) => toast(err.message, 'error'),
  });

  const statusColors: Record<string, string> = {
    pending: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    accepted: 'text-green-400 bg-green-400/10 border-green-400/20',
    declined: 'text-red-400 bg-red-400/10 border-red-400/20',
    countered: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    expired: 'text-[#555] bg-[#1a1a1a] border-[#222]',
  };

  const pct = post.price
    ? Math.round(((parseFloat(offerPrice || '0') - post.price) / post.price) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#0f0f0f] border border-[#222] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#1e1e1e]">
          <div>
            <h2 className="font-semibold text-ivory">Make an Offer</h2>
            <p className="text-xs text-ivory-muted mt-0.5 line-clamp-1">{post.title}</p>
          </div>
          <button onClick={onClose} className="btn-icon w-8 h-8"><X className="w-4 h-4" /></button>
        </div>

        {/* Asking price */}
        {post.price && (
          <div className="px-5 py-3 bg-gold/5 border-b border-[#1e1e1e]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-ivory-muted">Asking price</span>
              <span className="font-serif text-gold text-lg">{formatPrice(post.price, post.currency)}</span>
            </div>
          </div>
        )}

        <div className="px-5 py-4">
          {/* Existing offers section */}
          {offers.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-medium text-ivory-muted uppercase tracking-wider mb-2">
                {isOwner ? 'Incoming Offers' : 'Your Offers'}
              </h3>
              <div className="space-y-2">
                {offers.map(offer => (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    isOwner={isOwner}
                    statusColors={statusColors}
                    onRespond={respondOffer.mutate}
                    currency={post.currency}
                  />
                ))}
              </div>
              <div className="divider" />
            </div>
          )}

          {/* New offer form — hide if buyer has pending offer */}
          {!isOwner && step === 'form' && !offers.some(o => o.status === 'pending') && (
            <div className="space-y-4">
              <h3 className="text-xs font-medium text-ivory-muted uppercase tracking-wider">Submit New Offer</h3>

              {/* Price input */}
              <div>
                <label className="label">Your Offer Price</label>
                <div className="flex gap-2">
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="input w-24 flex-shrink-0"
                  >
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444]" />
                    <input
                      type="number"
                      value={offerPrice}
                      onChange={e => setOfferPrice(e.target.value)}
                      placeholder="0"
                      min="1"
                      className="input pl-8"
                    />
                  </div>
                </div>
                {offerPrice && post.price && (
                  <p className={cn('text-xs mt-1', pct < 0 ? 'text-green-400' : 'text-red-400')}>
                    {pct < 0 ? `${Math.abs(pct)}% below` : `${pct}% above`} asking price
                  </p>
                )}
              </div>

              {/* Message */}
              <div>
                <label className="label">Message (optional)</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Hi, I'm interested. Would you accept…"
                  rows={3}
                  maxLength={500}
                  className="input resize-none"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs text-ivory-subtle bg-[#111] rounded-lg p-3">
                <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                Offer expires in 48 hours. Seller can accept, decline, or counter.
              </div>

              <button
                onClick={() => createOffer.mutate()}
                disabled={!offerPrice || parseFloat(offerPrice) <= 0 || createOffer.isPending}
                className="btn-gold w-full rounded-full py-3"
              >
                {createOffer.isPending ? 'Submitting…' : 'Submit Offer'}
              </button>
            </div>
          )}

          {/* Success state */}
          {step === 'success' && (
            <div className="text-center py-6">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <h3 className="font-semibold text-ivory mb-1">Offer Sent!</h3>
              <p className="text-sm text-ivory-muted">The seller will respond within 48 hours.</p>
              <button onClick={onClose} className="btn-outline mt-4 rounded-full px-6">Done</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OfferCard({
  offer, isOwner, statusColors, onRespond, currency,
}: {
  offer: GemOffer;
  isOwner: boolean;
  statusColors: Record<string, string>;
  onRespond: (params: { id: string; action: string; counter_price?: number; counter_message?: string }) => void;
  currency: string;
}) {
  const [counterPrice, setCounterPrice] = useState('');
  const [showCounter, setShowCounter] = useState(false);

  return (
    <div className="bg-[#111] border border-[#1e1e1e] rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <div>
          {isOwner && offer.buyer && (
            <p className="text-xs text-ivory-muted">from @{offer.buyer.username}</p>
          )}
          <p className="font-semibold text-ivory">{formatPrice(offer.offer_price, offer.currency)}</p>
        </div>
        <span className={cn('text-[10px] font-medium px-2 py-1 rounded-full border capitalize', statusColors[offer.status])}>
          {offer.status}
        </span>
      </div>

      {offer.message && (
        <p className="text-xs text-ivory-muted mb-2 italic">"{offer.message}"</p>
      )}

      {offer.counter_price && (
        <div className="bg-blue-400/5 border border-blue-400/20 rounded-lg p-2 mb-2">
          <p className="text-xs text-blue-400">Counter offer: {formatPrice(offer.counter_price, offer.currency)}</p>
          {offer.counter_message && <p className="text-xs text-ivory-muted mt-0.5">"{offer.counter_message}"</p>}
        </div>
      )}

      {/* Seller actions for pending offers */}
      {isOwner && offer.status === 'pending' && (
        <div className="space-y-2">
          {showCounter ? (
            <div className="flex gap-2">
              <input
                type="number"
                value={counterPrice}
                onChange={e => setCounterPrice(e.target.value)}
                placeholder="Counter price"
                className="input flex-1 text-sm py-1.5"
              />
              <button
                onClick={() => onRespond({ id: offer.id, action: 'counter', counter_price: parseFloat(counterPrice) })}
                disabled={!counterPrice}
                className="btn-gold px-3 py-1.5 text-xs rounded-lg"
              >
                Send
              </button>
              <button onClick={() => setShowCounter(false)} className="btn-icon w-7 h-7">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => onRespond({ id: offer.id, action: 'accept' })}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Accept
              </button>
              <button
                onClick={() => setShowCounter(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Counter
              </button>
              <button
                onClick={() => onRespond({ id: offer.id, action: 'decline' })}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" /> Decline
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
