'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck, CreditCard, MapPin, ChevronRight, Loader2 } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuthStore } from '@/stores/auth.store';
import { addressSchema } from '@/lib/validations';
import { formatPrice, getProductImageUrl, cn } from '@/lib/utils';
import type { ShippingAddress } from '@/types';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#e8e0d5',
      fontFamily: '"DM Sans", system-ui, sans-serif',
      fontSize: '14px',
      '::placeholder': { color: '#646478' },
      backgroundColor: 'transparent',
    },
    invalid: { color: '#dc3c3c' },
  },
};

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuthStore();
  const [step, setStep] = useState<'shipping' | 'payment'>('shipping');
  const [shippingData, setShippingData] = useState<ShippingAddress | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<ShippingAddress>({
    resolver: zodResolver(addressSchema),
    defaultValues: { country: 'United States' },
  });

  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const handleShippingSubmit = (data: ShippingAddress) => {
    setShippingData(data);
    setStep('payment');
  };

  const handlePaymentSubmit = async () => {
    if (!stripe || !elements || !shippingData) return;
    setIsProcessing(true);
    setPaymentError('');

    try {
      // Create order and get client secret
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
          shipping_address: shippingData,
        }),
      });

      if (!orderRes.ok) {
        const { error } = await orderRes.json();
        throw new Error(error ?? 'Failed to create order');
      }

      const { data: { client_secret, order } } = await orderRes.json();

      // Confirm payment
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(client_secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: shippingData.full_name,
            email: user?.email,
          },
        },
      });

      if (paymentError) throw new Error(paymentError.message);

      await clearCart();
      router.push(`/checkout/success?order_id=${order.id}`);
    } catch (err: any) {
      setPaymentError(err.message ?? 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-16">
      <h1 className="font-serif text-4xl text-ivory font-light mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: Forms */}
        <div className="lg:col-span-3 space-y-6">
          {/* Step indicators */}
          <div className="flex items-center gap-2">
            {[
              { id: 'shipping', label: 'Shipping', icon: MapPin },
              { id: 'payment', label: 'Payment', icon: CreditCard },
            ].map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <button
                  onClick={() => s.id === 'shipping' && setStep('shipping')}
                  className={cn(
                    'flex items-center gap-2 text-sm font-medium transition-colors',
                    step === s.id ? 'text-gold' : 'text-ivory-muted'
                  )}
                >
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center border',
                    step === s.id
                      ? 'bg-gold border-gold text-obsidian'
                      : 'border-obsidian-border text-ivory-subtle'
                  )}>
                    {i + 1}
                  </div>
                  {s.label}
                </button>
                {i === 0 && <ChevronRight className="w-4 h-4 text-ivory-subtle" />}
              </div>
            ))}
          </div>

          {/* Shipping form */}
          {step === 'shipping' && (
            <form onSubmit={handleSubmit(handleShippingSubmit)} className="card p-6 space-y-4">
              <h2 className="font-serif text-2xl text-ivory font-light mb-2">Shipping Address</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name *</label>
                  <input {...register('full_name')} className="input" placeholder="Jane Doe" />
                  {errors.full_name && <p className="error-text">{errors.full_name.message}</p>}
                </div>
                <div>
                  <label className="label">Phone *</label>
                  <input {...register('phone')} className="input" placeholder="+1 555 000 0000" />
                  {errors.phone && <p className="error-text">{errors.phone.message}</p>}
                </div>
              </div>

              <div>
                <label className="label">Address Line 1 *</label>
                <input {...register('address_line1')} className="input" placeholder="123 Main Street" />
                {errors.address_line1 && <p className="error-text">{errors.address_line1.message}</p>}
              </div>

              <div>
                <label className="label">Address Line 2</label>
                <input {...register('address_line2')} className="input" placeholder="Apt, suite, unit (optional)" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">City *</label>
                  <input {...register('city')} className="input" placeholder="New York" />
                  {errors.city && <p className="error-text">{errors.city.message}</p>}
                </div>
                <div>
                  <label className="label">State / Province *</label>
                  <input {...register('state')} className="input" placeholder="NY" />
                  {errors.state && <p className="error-text">{errors.state.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Postal Code *</label>
                  <input {...register('postal_code')} className="input" placeholder="10001" />
                  {errors.postal_code && <p className="error-text">{errors.postal_code.message}</p>}
                </div>
                <div>
                  <label className="label">Country *</label>
                  <input {...register('country')} className="input" placeholder="United States" />
                  {errors.country && <p className="error-text">{errors.country.message}</p>}
                </div>
              </div>

              <button type="submit" className="btn-gold w-full justify-center">
                Continue to Payment <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Payment form */}
          {step === 'payment' && shippingData && (
            <div className="card p-6 space-y-5">
              <h2 className="font-serif text-2xl text-ivory font-light mb-2">Payment</h2>

              {/* Shipping summary */}
              <div className="p-3 rounded-lg bg-obsidian-light border border-obsidian-border text-sm">
                <p className="text-ivory-subtle mb-0.5">Shipping to:</p>
                <p className="text-ivory">
                  {shippingData.full_name} — {shippingData.address_line1}, {shippingData.city}, {shippingData.state} {shippingData.postal_code}
                </p>
                <button onClick={() => setStep('shipping')} className="text-xs text-gold mt-1 hover:text-gold-light">
                  Change address
                </button>
              </div>

              {/* Card element */}
              <div>
                <label className="label">Card Details</label>
                <div className="input p-3">
                  <CardElement options={CARD_ELEMENT_OPTIONS} />
                </div>
              </div>

              {paymentError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                  {paymentError}
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-ivory-subtle">
                <ShieldCheck className="w-4 h-4 text-green-400" />
                Secured by Stripe. Your payment information is encrypted.
              </div>

              <button
                onClick={handlePaymentSubmit}
                disabled={isProcessing || !stripe}
                className="btn-gold w-full justify-center text-base py-3.5"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing Payment…
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Pay {formatPrice(total)}
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-2">
          <div className="card p-5 sticky top-20">
            <h3 className="font-serif text-xl text-ivory font-light mb-4">Order Summary</h3>
            <div className="space-y-3 mb-5 max-h-60 overflow-y-auto">
              {items.map((item) => {
                const product = item.products;
                if (!product) return null;
                const img = product.product_images?.find(i => i.is_primary) ?? product.product_images?.[0];
                return (
                  <div key={item.id} className="flex gap-3">
                    <div className="relative flex-shrink-0">
                      <img
                        src={getProductImageUrl(img?.url)}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover border border-obsidian-border"
                      />
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-gold text-obsidian text-[10px] font-bold rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-ivory line-clamp-1">{product.name}</p>
                      <p className="text-xs text-ivory-subtle">{product.carat_weight}ct</p>
                    </div>
                    <p className="text-sm font-semibold text-ivory flex-shrink-0">
                      {formatPrice(product.price * item.quantity)}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="space-y-2 border-t border-obsidian-border pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-ivory-muted">Subtotal</span>
                <span className="text-ivory">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ivory-muted">Shipping</span>
                <span className="text-green-400">Free</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ivory-muted">Tax (8%)</span>
                <span className="text-ivory">{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t border-obsidian-border">
                <span className="text-ivory">Total</span>
                <span className="font-serif text-xl text-gold">{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
