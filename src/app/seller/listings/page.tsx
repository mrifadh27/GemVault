'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Plus, Edit2, ToggleLeft, ToggleRight, Trash2, Package } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GemBadge, LowStockBadge, LoadingSpinner, EmptyState } from '@/components/common/index';
import { PriceDisplay } from '@/components/common/index';
import { getProductImageUrl, formatDate, cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui.store';
import type { ProductWithImages } from '@/types';

export default function SellerListingsPage() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const { data: products = [], isLoading } = useQuery<ProductWithImages[]>({
    queryKey: ['seller-listings'],
    queryFn: async () => {
      const res = await fetch('/api/products?own=true&limit=100');
      if (!res.ok) throw new Error('Failed to fetch');
      const { data } = await res.json();
      return data ?? [];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active }),
      });
      if (!res.ok) throw new Error('Failed to update');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-listings'] });
      addToast({ title: 'Listing updated', variant: 'success' });
    },
    onError: () => addToast({ title: 'Failed to update', variant: 'error' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-listings'] });
      addToast({ title: 'Listing removed', variant: 'success' });
    },
    onError: () => addToast({ title: 'Failed to remove', variant: 'error' }),
  });

  const filtered = products.filter(p => {
    if (filter === 'active') return p.is_active;
    if (filter === 'inactive') return !p.is_active;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-ivory font-light">My Listings</h1>
          <p className="text-ivory-muted text-sm mt-1">{products.length} total gemstones</p>
        </div>
        <Link href="/seller/listings/new" className="btn-gold gap-2">
          <Plus className="w-4 h-4" />
          New Listing
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-obsidian-light rounded-lg p-1 w-fit">
        {(['all', 'active', 'inactive'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize',
              filter === f ? 'bg-obsidian-mid text-ivory shadow-sm' : 'text-ivory-muted hover:text-ivory'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Listings */}
      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Package className="w-8 h-8" />}
          title="No listings yet"
          description="Start selling by creating your first gemstone listing."
          action={
            <Link href="/seller/listings/new" className="btn-gold mt-2">
              Create First Listing
            </Link>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="table-base">
            <thead>
              <tr>
                <th>Product</th>
                <th>Type</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Views</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const primaryImg = product.product_images?.find(i => i.is_primary) ?? product.product_images?.[0];
                return (
                  <tr key={product.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <img
                          src={getProductImageUrl(primaryImg?.url)}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover border border-obsidian-border flex-shrink-0"
                        />
                        <div>
                          <p className="text-sm font-medium text-ivory line-clamp-1">{product.name}</p>
                          <p className="text-xs text-ivory-subtle">{product.carat_weight}ct</p>
                        </div>
                      </div>
                    </td>
                    <td><GemBadge type={product.gemstone_type} size="sm" /></td>
                    <td>
                      <PriceDisplay price={product.price} comparePrice={product.compare_price} size="sm" />
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-ivory">{product.stock_quantity}</span>
                        <LowStockBadge quantity={product.stock_quantity} threshold={product.low_stock_threshold} />
                      </div>
                    </td>
                    <td className="text-sm">{product.views_count.toLocaleString()}</td>
                    <td>
                      <span className={cn(
                        'badge text-[10px]',
                        product.is_active
                          ? 'bg-green-400/10 text-green-400 border-green-400/20'
                          : 'bg-red-400/10 text-red-400 border-red-400/20'
                      )}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/seller/listings/${product.id}/edit`}
                          className="p-1.5 rounded text-ivory-subtle hover:text-gold hover:bg-gold/10 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => toggleMutation.mutate({ id: product.id, is_active: !product.is_active })}
                          className="p-1.5 rounded text-ivory-subtle hover:text-blue-400 hover:bg-blue-400/10 transition-colors"
                          title={product.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {product.is_active
                            ? <ToggleRight className="w-3.5 h-3.5" />
                            : <ToggleLeft className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Remove this listing?')) deleteMutation.mutate(product.id);
                          }}
                          className="p-1.5 rounded text-ivory-subtle hover:text-red-400 hover:bg-red-400/10 transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
