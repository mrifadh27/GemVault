'use client';

import { useSellerAnalytics } from '@/hooks/useSellerDashboard';
import { DashboardKPIs } from '@/components/seller/DashboardKPIs';
import { ProfitChart } from '@/components/seller/ProfitChart';
import { CategoryPieChart } from '@/components/seller/CategoryPieChart';
import { ProductPerformanceTable } from '@/components/seller/ProductPerformanceTable';
import { SellerOrdersTable } from '@/components/seller/SellerOrdersTable';
import { LoadingSpinner } from '@/components/common/index';
import { formatDate } from '@/lib/utils';

export default function SellerDashboardPage() {
  const { data: analytics, isLoading, error } = useSellerAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-3">
          <LoadingSpinner size="lg" className="mx-auto" />
          <p className="text-ivory-muted text-sm">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400">Failed to load analytics. Please refresh.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-ivory font-light">Seller Dashboard</h1>
          <p className="text-ivory-muted text-sm mt-1">
            Last updated {formatDate(new Date().toISOString())}
          </p>
        </div>
        {(analytics?.pending_payout ?? 0) > 0 && (
          <div className="card px-4 py-3 text-center">
            <p className="text-xs text-ivory-subtle">Pending Payout</p>
            <p className="text-lg font-serif font-semibold text-gold">
              ${analytics!.pending_payout.toFixed(2)}
            </p>
          </div>
        )}
      </div>

      {/* KPIs */}
      {analytics && <DashboardKPIs summary={analytics.summary} />}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {analytics && <ProfitChart monthlyData={analytics.monthly_revenue} />}
        </div>
        <div>
          {analytics && <CategoryPieChart data={analytics.sales_by_gemstone} />}
        </div>
      </div>

      {/* Top Products */}
      {analytics && <ProductPerformanceTable products={analytics.top_products} />}

      {/* Recent Orders */}
      {analytics && <SellerOrdersTable orders={analytics.recent_orders} />}
    </div>
  );
}
