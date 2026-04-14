'use client';

import { use } from 'react';
import Link from 'next/link';
import { useOrder } from '@/hooks/useOrders';
import { LoadingSpinner, GemBadge } from '@/components/common/index';
import { formatPrice, formatDate, formatDateTime, getProductImageUrl, cn, orderStatusLabels, orderStatusColors } from '@/lib/utils';
import { ArrowLeft, MapPin, Package, Truck } from 'lucide-react';

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: order, isLoading } = useOrder(id);

  if (isLoading) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-ivory-muted">Order not found.</p>
        <Link href="/buyer/orders" className="btn-gold mt-4">Back to Orders</Link>
      </div>
    );
  }

  const addr = order.shipping_address;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/buyer/orders" className="p-2 rounded-lg hover:bg-obsidian-light transition-colors text-ivory-muted hover:text-ivory">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-serif text-3xl text-ivory font-light">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <p className="text-ivory-muted text-sm mt-0.5">{formatDateTime(order.created_at)}</p>
        </div>
        <span className={cn('badge ml-auto text-xs capitalize', orderStatusColors[order.status])}>
          {orderStatusLabels[order.status]}
        </span>
      </div>

      {/* Items */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-obsidian-border">
          <h2 className="font-serif text-xl text-ivory font-light">Items</h2>
        </div>
        <div className="divide-y divide-obsidian-border/50">
          {order.order_items?.map((item: any) => {
            const product = item.products;
            const img = product?.product_images?.[0];
            return (
              <div key={item.id} className="p-5 flex gap-4">
                <img
                  src={getProductImageUrl(img?.url)}
                  alt={product?.name}
                  className="w-16 h-16 rounded-lg object-cover border border-obsidian-border flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link href={`/marketplace/${product?.slug}`} className="text-sm font-medium text-ivory hover:text-gold transition-colors">
                        {product?.name}
                      </Link>
                      {product?.gemstone_type && (
                        <div className="mt-1"><GemBadge type={product.gemstone_type} size="sm" /></div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-gold">{formatPrice(item.subtotal)}</p>
                      <p className="text-xs text-ivory-subtle mt-0.5">×{item.quantity} @ {formatPrice(item.unit_price)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <p className="text-xs text-ivory-subtle">Sold by: {item.seller_profiles?.store_name}</p>
                      {item.tracking_number && (
                        <p className="text-xs text-ivory-muted mt-0.5 flex items-center gap-1">
                          <Truck className="w-3 h-3" />
                          {item.tracking_carrier} · {item.tracking_number}
                        </p>
                      )}
                    </div>
                    <span className={cn('badge text-[10px] capitalize', {
                      'bg-blue-400/10 text-blue-400 border-blue-400/20': item.status === 'confirmed',
                      'bg-cyan-400/10 text-cyan-400 border-cyan-400/20': item.status === 'shipped',
                      'bg-green-400/10 text-green-400 border-green-400/20': item.status === 'delivered',
                    })}>
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shipping + Summary grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Shipping address */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-gold" />
            <h3 className="font-medium text-ivory">Shipping Address</h3>
          </div>
          <div className="text-sm text-ivory-muted space-y-0.5">
            <p className="font-medium text-ivory">{addr.full_name}</p>
            <p>{addr.phone}</p>
            <p>{addr.address_line1}</p>
            {addr.address_line2 && <p>{addr.address_line2}</p>}
            <p>{addr.city}, {addr.state} {addr.postal_code}</p>
            <p>{addr.country}</p>
          </div>
        </div>

        {/* Order summary */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-4 h-4 text-gold" />
            <h3 className="font-medium text-ivory">Order Summary</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ivory-muted">Subtotal</span>
              <span className="text-ivory">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ivory-muted">Shipping</span>
              <span className="text-green-400">Free</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ivory-muted">Tax</span>
              <span className="text-ivory">{formatPrice(order.tax)}</span>
            </div>
            <div className="flex justify-between font-semibold pt-2 border-t border-obsidian-border">
              <span className="text-ivory">Total</span>
              <span className="font-serif text-lg text-gold">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
