'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LoadingSpinner } from '@/components/common/index';
import { formatPrice, formatDate, cn, orderStatusColors, orderStatusLabels } from '@/lib/utils';

export default function AdminOrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const res = await fetch('/api/orders?role=admin&limit=50');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });
  const orders = data?.data ?? [];
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-ivory font-light">Orders</h1>
      {isLoading ? <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div> : (
        <div className="card overflow-hidden">
          <table className="table-base">
            <thead><tr><th>Order ID</th><th>Date</th><th>Buyer</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {orders.map((o: any) => (
                <tr key={o.id}>
                  <td className="font-mono text-xs text-gold">#{o.id.slice(0,8).toUpperCase()}</td>
                  <td className="text-xs">{formatDate(o.created_at)}</td>
                  <td className="text-sm">{o.profiles?.full_name ?? o.profiles?.email ?? '—'}</td>
                  <td className="font-medium text-ivory">{formatPrice(o.total)}</td>
                  <td><span className={cn('badge text-[10px] capitalize', orderStatusColors[o.status])}>{orderStatusLabels[o.status]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
