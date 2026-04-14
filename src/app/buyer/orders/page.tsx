'use client';

import Link from 'next/link';
import { useOrders } from '@/hooks/useOrders';
import { LoadingSpinner, EmptyState, GemBadge } from '@/components/common/index';
import { formatPrice, formatDate, getProductImageUrl, cn, orderStatusLabels, orderStatusColors } from '@/lib/utils';
import { Package, ChevronRight, CheckCircle, Truck, Box, CreditCard } from 'lucide-react';
import type { OrderWithItems } from '@/types';

function OrderTracker({ status }: { status: string }) {
  const steps = [
    { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
    { key: 'processing', label: 'Processing', icon: Box },
    { key: 'shipped', label: 'Shipped', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: Package },
  ];

  const statusOrder = ['pending_payment', 'confirmed', 'processing', 'shipped', 'delivered'];
  const currentIdx = statusOrder.indexOf(status);

  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const stepIdx = statusOrder.indexOf(step.key);
        const isDone = stepIdx <= currentIdx;
        const isCurrent = stepIdx === currentIdx;

        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all',
                isDone
                  ? 'bg-gold border-gold text-obsidian'
                  : 'bg-obsidian border-obsidian-border text-ivory-subtle'
              )}>
                <step.icon className="w-3.5 h-3.5" />
              </div>
              <span className={cn(
                'text-[10px] mt-1 text-center whitespace-nowrap',
                isDone ? 'text-gold' : 'text-ivory-subtle'
              )}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                'h-0.5 w-12 mx-1 mb-4',
                stepIdx < currentIdx ? 'bg-gold' : 'bg-obsidian-border'
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({ order }: { order: OrderWithItems }) {
  return (
    <div className="card overflow-hidden">
      {/* Order header */}
      <div className="px-5 py-4 border-b border-obsidian-border flex items-center justify-between">
        <div>
          <p className="text-xs text-ivory-subtle font-mono">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </p>
          <p className="text-xs text-ivory-subtle mt-0.5">{formatDate(order.created_at)}</p>
        </div>
        <div className="text-right">
          <span className={cn('badge text-[10px] capitalize', orderStatusColors[order.status])}>
            {orderStatusLabels[order.status]}
          </span>
          <p className="font-serif text-lg text-gold mt-1">{formatPrice(order.total)}</p>
        </div>
      </div>

      {/* Tracker */}
      {!['pending_payment', 'cancelled', 'refunded'].includes(order.status) && (
        <div className="px-5 py-4 border-b border-obsidian-border overflow-x-auto">
          <OrderTracker status={order.status} />
        </div>
      )}

      {/* Items */}
      <div className="px-5 py-4 space-y-3">
        {order.order_items?.slice(0, 3).map((item: any) => {
          const product = item.products;
          const img = product?.product_images?.[0];
          return (
            <div key={item.id} className="flex gap-3 items-center">
              <img
                src={getProductImageUrl(img?.url)}
                alt={product?.name}
                className="w-12 h-12 rounded-lg object-cover border border-obsidian-border flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ivory truncate">{product?.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {product?.gemstone_type && <GemBadge type={product.gemstone_type} size="sm" />}
                  <span className="text-xs text-ivory-subtle">×{item.quantity}</span>
                </div>
              </div>
              <p className="text-sm font-semibold text-ivory flex-shrink-0">
                {formatPrice(item.unit_price * item.quantity)}
              </p>
            </div>
          );
        })}
        {(order.order_items?.length ?? 0) > 3 && (
          <p className="text-xs text-ivory-subtle">
            +{(order.order_items?.length ?? 0) - 3} more items
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-obsidian-border flex items-center justify-between">
        <p className="text-xs text-ivory-subtle">
          {order.order_items?.length} {order.order_items?.length === 1 ? 'item' : 'items'} ·
          Paid {formatDate(order.created_at)}
        </p>
        <Link href={`/buyer/orders/${order.id}`} className="flex items-center gap-1 text-xs text-gold hover:text-gold-light transition-colors">
          View Details <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

export default function BuyerOrdersPage() {
  const { data: orders = [], isLoading } = useOrders();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-ivory font-light">My Orders</h1>
        <p className="text-ivory-muted text-sm mt-1">{orders.length} orders placed</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<Package className="w-8 h-8" />}
          title="No orders yet"
          description="Browse our marketplace and discover exceptional gemstones."
          action={<Link href="/marketplace" className="btn-gold mt-2">Browse Marketplace</Link>}
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => <OrderCard key={order.id} order={order} />)}
        </div>
      )}
    </div>
  );
}
