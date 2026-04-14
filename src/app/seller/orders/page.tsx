'use client';

import { useState } from 'react';
import { useSellerOrders } from '@/hooks/useSellerDashboard';
import { useUpdateOrderItemStatus } from '@/hooks/useOrders';
import { LoadingSpinner, EmptyState } from '@/components/common/index';
import { formatPrice, formatDate, getProductImageUrl, cn } from '@/lib/utils';
import { ShoppingBag, Truck, Package, CheckCircle } from 'lucide-react';
import type { OrderWithItems, OrderItem } from '@/types';

function OrderItemRow({ item, orderId }: { item: OrderItem; orderId: string }) {
  const [tracking, setTracking] = useState({ number: '', carrier: '' });
  const [showTrack, setShowTrack] = useState(false);
  const updateMutation = useUpdateOrderItemStatus();
  const product = (item as any).products;
  const img = product?.product_images?.[0];

  const canShip = item.status === 'confirmed';
  const canDeliver = item.status === 'shipped';

  return (
    <div className="flex items-start gap-4 p-4 border border-obsidian-border rounded-xl">
      <img
        src={getProductImageUrl(img?.url)}
        alt={product?.name}
        className="w-14 h-14 rounded-lg object-cover border border-obsidian-border flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ivory">{product?.name ?? 'Product'}</p>
        <p className="text-xs text-ivory-subtle">{product?.carat_weight}ct {product?.gemstone_type}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-semibold text-gold">{formatPrice(item.seller_earnings)}</span>
          <span className="text-xs text-ivory-subtle">your earnings</span>
        </div>
        {item.tracking_number && (
          <p className="text-xs text-ivory-subtle mt-1">
            🚚 {item.tracking_carrier} — {item.tracking_number}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2 items-end">
        <span className={cn('badge text-[10px] capitalize', {
          'bg-blue-400/10 text-blue-400 border-blue-400/20': item.status === 'confirmed',
          'bg-cyan-400/10 text-cyan-400 border-cyan-400/20': item.status === 'shipped',
          'bg-green-400/10 text-green-400 border-green-400/20': item.status === 'delivered',
          'bg-yellow-400/10 text-yellow-400 border-yellow-400/20': item.status === 'pending',
        })}>
          {item.status}
        </span>
        {canShip && (
          <div className="text-right">
            {showTrack ? (
              <div className="flex flex-col gap-1.5">
                <input
                  type="text"
                  placeholder="Tracking number"
                  value={tracking.number}
                  onChange={e => setTracking(p => ({ ...p, number: e.target.value }))}
                  className="input text-xs py-1.5 w-40"
                />
                <input
                  type="text"
                  placeholder="Carrier (e.g. FedEx)"
                  value={tracking.carrier}
                  onChange={e => setTracking(p => ({ ...p, carrier: e.target.value }))}
                  className="input text-xs py-1.5 w-40"
                />
                <button
                  onClick={() => updateMutation.mutate({
                    orderId, itemId: item.id, status: 'shipped',
                    trackingNumber: tracking.number, trackingCarrier: tracking.carrier,
                  })}
                  disabled={!tracking.number || updateMutation.isPending}
                  className="btn-gold text-xs py-1.5 gap-1"
                >
                  <Truck className="w-3 h-3" />
                  Mark Shipped
                </button>
              </div>
            ) : (
              <button onClick={() => setShowTrack(true)} className="btn-outline text-xs py-1.5 gap-1">
                <Package className="w-3 h-3" />
                Add Tracking
              </button>
            )}
          </div>
        )}
        {canDeliver && (
          <button
            onClick={() => updateMutation.mutate({ orderId, itemId: item.id, status: 'delivered' })}
            disabled={updateMutation.isPending}
            className="btn-outline text-xs py-1.5 gap-1 border-green-400/40 text-green-400 hover:bg-green-400/10"
          >
            <CheckCircle className="w-3 h-3" />
            Mark Delivered
          </button>
        )}
      </div>
    </div>
  );
}

export default function SellerOrdersPage() {
  const { data: orders = [], isLoading } = useSellerOrders();
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = orders.filter(o => statusFilter === 'all' || o.status === statusFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-ivory font-light">Orders</h1>
        <p className="text-ivory-muted text-sm mt-1">{orders.length} total orders</p>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {['all', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-all capitalize',
              statusFilter === s
                ? 'bg-gold text-obsidian'
                : 'border border-obsidian-border text-ivory-muted hover:text-ivory hover:border-gold/30'
            )}
          >
            {s === 'all' ? 'All Orders' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-8 h-8" />}
          title="No orders yet"
          description="When buyers purchase your gems, orders will appear here."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => {
            const sellerItems = order.order_items?.filter((i: any) => i.seller_id) ?? [];
            const buyer = (order as any).profiles;
            return (
              <div key={order.id} className="card p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-ivory-subtle font-mono">
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-ivory-subtle mt-0.5">{formatDate(order.created_at)}</p>
                    {buyer && <p className="text-xs text-ivory-muted mt-0.5">Buyer: {buyer.full_name ?? buyer.email}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-ivory-subtle">Your earnings</p>
                    <p className="text-lg font-serif font-semibold text-gold">
                      {formatPrice(sellerItems.reduce((s: number, i: any) => s + i.seller_earnings, 0))}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {sellerItems.map((item: any) => (
                    <OrderItemRow key={item.id} item={item} orderId={order.id} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
