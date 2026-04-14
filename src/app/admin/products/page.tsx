'use client';
import { useAdminProducts, useModerateProduct } from '@/hooks/useAdminDashboard';
import { LoadingSpinner, GemBadge } from '@/components/common/index';
import { formatPrice, getProductImageUrl } from '@/lib/utils';
import { ToggleRight, Star } from 'lucide-react';

export default function AdminProductsPage() {
  const { data, isLoading } = useAdminProducts();
  const moderateMutation = useModerateProduct();
  const products = data?.data ?? [];
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-ivory font-light">Products</h1>
      {isLoading ? <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div> : (
        <div className="card overflow-hidden">
          <table className="table-base">
            <thead><tr><th>Product</th><th>Type</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {products.map((p: any) => {
                const img = p.product_images?.[0];
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <img src={getProductImageUrl(img?.url)} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-obsidian-border" />
                        <p className="text-sm font-medium text-ivory line-clamp-1">{p.name}</p>
                      </div>
                    </td>
                    <td><GemBadge type={p.gemstone_type} size="sm" /></td>
                    <td className="text-gold font-medium">{formatPrice(p.price)}</td>
                    <td><span className={p.is_active ? 'badge bg-green-400/10 text-green-400 border-green-400/20 text-[10px]' : 'badge bg-red-400/10 text-red-400 border-red-400/20 text-[10px]'}>{p.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => moderateMutation.mutate({ productId: p.id, isActive: !p.is_active })} className="p-1.5 rounded text-ivory-subtle hover:text-blue-400 hover:bg-blue-400/10 transition-colors" title="Toggle active"><ToggleRight className="w-3.5 h-3.5" /></button>
                        <button onClick={() => moderateMutation.mutate({ productId: p.id, isFeatured: !p.is_featured })} className="p-1.5 rounded text-ivory-subtle hover:text-gold hover:bg-gold/10 transition-colors" title="Toggle featured"><Star className="w-3.5 h-3.5" /></button>
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
