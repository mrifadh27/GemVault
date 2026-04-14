'use client';

import { useSellerPayouts } from '@/hooks/useSellerDashboard';
import { useAuthStore } from '@/stores/auth.store';
import { PayoutHistory } from '@/components/seller/index';
import { LoadingSpinner } from '@/components/common/index';
import { formatPrice } from '@/lib/utils';
import { DollarSign, ExternalLink } from 'lucide-react';
import { useState } from 'react';

export default function SellerPayoutsPage() {
  const { data: payouts = [], isLoading } = useSellerPayouts();
  const { sellerProfile } = useAuthStore();
  const [isConnecting, setIsConnecting] = useState(false);

  const totalPaid = payouts
    .filter((p: any) => p.status === 'paid')
    .reduce((s: number, p: any) => s + p.amount, 0);

  const pending = payouts
    .filter((p: any) => ['pending', 'processing'].includes(p.status))
    .reduce((s: number, p: any) => s + p.amount, 0);

  const handleStripeConnect = async () => {
    setIsConnecting(true);
    try {
      const res = await fetch('/api/seller/onboard', { method: 'POST' });
      const { url, onboarding_complete } = await res.json();
      if (onboarding_complete) {
        window.location.reload();
      } else if (url) {
        window.location.href = url;
      }
    } catch {
      alert('Failed to connect Stripe. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-ivory font-light">Payouts</h1>
        <p className="text-ivory-muted text-sm mt-1">Your earnings and payment history</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="text-xs text-ivory-subtle uppercase tracking-wider mb-2">Total Paid Out</p>
          <p className="font-serif text-3xl text-gold">{formatPrice(totalPaid)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-ivory-subtle uppercase tracking-wider mb-2">Pending</p>
          <p className="font-serif text-3xl text-ivory">{formatPrice(pending)}</p>
        </div>
      </div>

      {/* Stripe connect status */}
      {!sellerProfile?.stripe_onboarding_complete ? (
        <div className="card p-6 border-gold/20 bg-gold/5">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-gold/10 border border-gold/20">
              <DollarSign className="w-5 h-5 text-gold" />
            </div>
            <div className="flex-1">
              <h3 className="font-serif text-xl text-ivory font-light mb-1">Connect Stripe to Receive Payouts</h3>
              <p className="text-sm text-ivory-muted mb-4">
                Set up your Stripe Express account to receive direct payouts for your sales.
                Takes about 5 minutes to complete.
              </p>
              <button
                onClick={handleStripeConnect}
                disabled={isConnecting}
                className="btn-gold gap-2"
              >
                {isConnecting ? <LoadingSpinner size="sm" /> : <ExternalLink className="w-4 h-4" />}
                {isConnecting ? 'Connecting…' : 'Connect with Stripe'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-4 border-green-400/20 bg-green-400/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-400/15 border border-green-400/25 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-400">Stripe Connected</p>
              <p className="text-xs text-ivory-subtle">Payouts are processed weekly to your bank account</p>
            </div>
          </div>
        </div>
      )}

      {/* Payout history */}
      <div>
        <h2 className="font-serif text-2xl text-ivory font-light mb-4">Payout History</h2>
        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : (
          <PayoutHistory payouts={payouts} />
        )}
      </div>
    </div>
  );
}
