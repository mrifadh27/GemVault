'use client';

import { useAdminStats, useAdminSellers, useVerifySeller } from '@/hooks/useAdminDashboard';
import { LoadingSpinner, VerifiedBadge } from '@/components/common/index';
import { formatPrice, formatNumber, formatDate, cn } from '@/lib/utils';
import { Users, Package, ShoppingBag, DollarSign, TrendingUp, Store, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="card p-5">
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-4', `bg-${color}-400/10`)}>
        <Icon className={cn('w-4 h-4', `text-${color}-400`)} />
      </div>
      <p className="text-xs text-ivory-subtle uppercase tracking-wider mb-1">{label}</p>
      <p className="font-serif text-2xl text-ivory font-semibold">{value}</p>
    </div>
  );
}

export function AdminOverviewPage() {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading) return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
  if (!stats) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-ivory font-light">Platform Overview</h1>
        <p className="text-ivory-muted text-sm mt-1">GemVault administration dashboard</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={formatNumber(stats.total_users)} icon={Users} color="blue" />
        <StatCard label="Active Sellers" value={formatNumber(stats.total_sellers)} icon={Store} color="gold" />
        <StatCard label="Total Products" value={formatNumber(stats.total_products)} icon={Package} color="purple" />
        <StatCard label="Platform Revenue" value={formatPrice(stats.total_platform_fees)} icon={DollarSign} color="green" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Total Orders" value={formatNumber(stats.total_orders)} icon={ShoppingBag} color="cyan" />
        <StatCard label="Pending Verifications" value={formatNumber(stats.pending_verifications)} icon={AlertTriangle} color="yellow" />
      </div>
    </div>
  );
}

export function AdminSellersPage() {
  const { data, isLoading } = useAdminSellers();
  const verifyMutation = useVerifySeller();
  const sellers = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-ivory font-light">Sellers</h1>
        <p className="text-ivory-muted text-sm mt-1">Manage seller verification and accounts</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="card overflow-hidden">
          <table className="table-base">
            <thead>
              <tr>
                <th>Store</th>
                <th>Status</th>
                <th>Rating</th>
                <th>Sales</th>
                <th>Stripe</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sellers.map((seller: any) => (
                <tr key={seller.id}>
                  <td>
                    <div>
                      <p className="text-sm font-medium text-ivory">{seller.store_name}</p>
                      <p className="text-xs text-ivory-subtle">{seller.profiles?.email}</p>
                    </div>
                  </td>
                  <td>
                    <span className={cn('badge text-[10px] capitalize', {
                      'bg-yellow-400/10 text-yellow-400 border-yellow-400/20': seller.verification_status === 'pending',
                      'bg-green-400/10 text-green-400 border-green-400/20': seller.verification_status === 'approved',
                      'bg-red-400/10 text-red-400 border-red-400/20': seller.verification_status === 'rejected',
                      'bg-orange-400/10 text-orange-400 border-orange-400/20': seller.verification_status === 'suspended',
                    })}>
                      {seller.verification_status}
                    </span>
                  </td>
                  <td className="text-sm">{seller.rating?.toFixed(1) ?? '—'} ⭐</td>
                  <td className="text-sm font-medium text-gold">{formatPrice(seller.total_sales)}</td>
                  <td>
                    <span className={cn('badge text-[10px]', seller.stripe_onboarding_complete ? 'bg-green-400/10 text-green-400 border-green-400/20' : 'bg-red-400/10 text-red-400 border-red-400/20')}>
                      {seller.stripe_onboarding_complete ? 'Connected' : 'Pending'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      {seller.verification_status !== 'approved' && (
                        <button
                          onClick={() => verifyMutation.mutate({ sellerId: seller.id, status: 'approved' })}
                          className="p-1.5 rounded text-ivory-subtle hover:text-green-400 hover:bg-green-400/10 transition-colors"
                          title="Approve"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {seller.verification_status !== 'rejected' && (
                        <button
                          onClick={() => verifyMutation.mutate({ sellerId: seller.id, status: 'rejected' })}
                          className="p-1.5 rounded text-ivory-subtle hover:text-red-400 hover:bg-red-400/10 transition-colors"
                          title="Reject"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {seller.verification_status !== 'suspended' && (
                        <button
                          onClick={() => verifyMutation.mutate({ sellerId: seller.id, status: 'suspended' })}
                          className="p-1.5 rounded text-ivory-subtle hover:text-orange-400 hover:bg-orange-400/10 transition-colors"
                          title="Suspend"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminOverviewPage;
