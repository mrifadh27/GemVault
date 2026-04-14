import Link from 'next/link';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
  searchParams: Promise<{ order_id?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: PageProps) {
  const { order_id } = await searchParams;
  let order = null;

  if (order_id) {
    const supabase = await createClient();
    const { data } = await supabase
      .from('orders')
      .select('id, total, status, created_at, order_items(id)')
      .eq('id', order_id)
      .single();
    order = data;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16 hero-mesh">
      <div className="text-center max-w-lg">
        {/* Animated checkmark */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full bg-green-400/10 border border-green-400/20 animate-pulse" />
          <div className="absolute inset-2 rounded-full bg-green-400/15 border border-green-400/25 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
        </div>

        <h1 className="font-serif text-5xl text-ivory font-light mb-3">
          Order Confirmed!
        </h1>
        <p className="text-ivory-muted text-lg mb-2">
          Thank you for your purchase.
        </p>
        {order && (
          <p className="text-sm text-ivory-subtle mb-8">
            Order #{String(order.id).slice(0, 8).toUpperCase()} —
            ${Number(order.total).toFixed(2)}
          </p>
        )}

        <div className="card p-6 mb-8 text-left space-y-3">
          <div className="flex items-start gap-3">
            <Package className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-ivory">What happens next?</p>
              <p className="text-sm text-ivory-muted mt-1">
                Your seller has been notified and will prepare your gemstone for shipment.
                You'll receive a tracking number once shipped.
              </p>
            </div>
          </div>
          <p className="text-xs text-ivory-subtle pl-8">
            A confirmation email has been sent to your inbox.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {order_id && (
            <Link href={`/buyer/orders/${order_id}`} className="btn-gold gap-2">
              Track Order
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          <Link href="/marketplace" className="btn-outline">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
