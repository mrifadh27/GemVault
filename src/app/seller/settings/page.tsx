'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useUIStore } from '@/stores/ui.store';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { LoadingSpinner } from '@/components/common/index';
import { Store, CreditCard, ExternalLink, Save, Loader2, CheckCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function SellerSettingsPage() {
  const { user, sellerProfile, fetchProfile } = useAuthStore();
  const { addToast } = useUIStore();
  const supabase = getSupabaseBrowserClient();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [formData, setFormData] = useState({
    store_name: sellerProfile?.store_name ?? '',
    store_description: sellerProfile?.store_description ?? '',
    business_type: sellerProfile?.business_type ?? 'individual',
  });

  useEffect(() => {
    const stripeStatus = searchParams.get('stripe');
    if (stripeStatus === 'success') {
      addToast({ title: 'Stripe account connected!', variant: 'success' });
      fetchProfile();
    } else if (stripeStatus === 'refresh') {
      addToast({ title: 'Please complete Stripe onboarding', variant: 'warning' });
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('seller_profiles')
        .update({
          store_name: formData.store_name,
          store_description: formData.store_description,
          business_type: formData.business_type,
        })
        .eq('id', user.id);

      if (error) throw error;
      await fetchProfile();
      addToast({ title: 'Store settings saved', variant: 'success' });
    } catch (err: any) {
      addToast({ title: err.message ?? 'Failed to save', variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStripeConnect = async () => {
    setIsConnecting(true);
    try {
      const res = await fetch('/api/seller/onboard', { method: 'POST' });
      const data = await res.json();
      if (data.onboarding_complete) {
        addToast({ title: 'Stripe already connected!', variant: 'success' });
        fetchProfile();
      } else if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('Failed to get onboarding URL');
      }
    } catch {
      addToast({ title: 'Failed to connect Stripe', variant: 'error' });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-serif text-3xl text-ivory font-light">Store Settings</h1>
        <p className="text-ivory-muted text-sm mt-1">Manage your seller account and preferences</p>
      </div>

      {/* Verification status banner */}
      {sellerProfile?.verification_status !== 'approved' && (
        <div className="card p-4 border-yellow-400/20 bg-yellow-400/5">
          <p className="text-sm text-yellow-400">
            ⚠️ Your seller account is <strong>{sellerProfile?.verification_status}</strong>.
            {sellerProfile?.verification_status === 'pending' && ' We\'ll review your application and notify you within 24 hours.'}
          </p>
        </div>
      )}

      {/* Store info */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Store className="w-4 h-4 text-gold" />
          <h2 className="font-serif text-xl text-ivory font-light">Store Information</h2>
        </div>

        <form onSubmit={handleStoreSubmit} className="space-y-4">
          <div>
            <label className="label">Store Name</label>
            <input
              name="store_name"
              value={formData.store_name}
              onChange={handleChange}
              className="input"
              placeholder="Your store name"
              required
            />
          </div>
          <div>
            <label className="label">Store Description</label>
            <textarea
              name="store_description"
              value={formData.store_description}
              onChange={handleChange}
              rows={4}
              className="input resize-none"
              placeholder="Tell buyers about your store, specialties, and sourcing practices…"
            />
          </div>
          <div>
            <label className="label">Business Type</label>
            <select
              name="business_type"
              value={formData.business_type}
              onChange={handleChange}
              className="select"
            >
              <option value="individual">Individual</option>
              <option value="company">Company</option>
            </select>
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-gold gap-2">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSubmitting ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Stripe Connect */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <CreditCard className="w-4 h-4 text-gold" />
          <h2 className="font-serif text-xl text-ivory font-light">Payment Settings</h2>
        </div>

        {sellerProfile?.stripe_onboarding_complete ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-green-400/5 border border-green-400/20">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-400">Stripe Express Connected</p>
                <p className="text-xs text-ivory-muted mt-0.5">
                  You'll receive payouts automatically based on the platform schedule.
                </p>
              </div>
            </div>
            <div className="text-sm text-ivory-muted space-y-1">
              <p>Platform fee rate: <span className="text-ivory">{sellerProfile?.platform_fee_rate ?? 8}%</span></p>
              <p>Payout schedule: <span className="text-ivory">Weekly</span></p>
              <p>Minimum payout: <span className="text-ivory">$50.00</span></p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-ivory-muted">
              Connect your Stripe account to receive payments directly to your bank.
              Setup takes about 5 minutes and requires identity verification.
            </p>
            <div className="grid grid-cols-3 gap-3 text-center text-xs text-ivory-subtle">
              {['Identity Verified', 'Bank Connected', 'Instant Payouts'].map(f => (
                <div key={f} className="card p-3">
                  <div className="text-lg mb-1">✓</div>
                  {f}
                </div>
              ))}
            </div>
            <button
              onClick={handleStripeConnect}
              disabled={isConnecting}
              className="btn-gold gap-2"
            >
              {isConnecting ? <LoadingSpinner size="sm" /> : <ExternalLink className="w-4 h-4" />}
              {isConnecting ? 'Connecting…' : 'Connect with Stripe'}
            </button>
          </div>
        )}
      </div>

      {/* Account info */}
      <div className="card p-6">
        <h2 className="font-serif text-xl text-ivory font-light mb-4">Account Info</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-ivory-muted">Email</span>
            <span className="text-ivory">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ivory-muted">Account Status</span>
            <span className="capitalize text-ivory">{sellerProfile?.verification_status ?? 'pending'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ivory-muted">Total Sales</span>
            <span className="text-gold font-medium">${sellerProfile?.total_sales?.toFixed(2) ?? '0.00'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ivory-muted">Total Orders</span>
            <span className="text-ivory">{sellerProfile?.total_orders ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
