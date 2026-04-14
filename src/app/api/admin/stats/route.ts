import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { AdminStats } from '@/types';

async function checkAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  return p?.role === 'admin' ? user : null;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!await checkAdmin(supabase)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parallel queries for all stats
    const [
      { count: totalUsers },
      { count: totalSellers },
      { count: totalProducts },
      { count: totalOrders },
      { count: pendingVerifications },
      { data: revenueData },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('seller_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'approved'),
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('payment_status', 'paid'),
      supabase.from('seller_profiles').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
      supabase.from('orders').select('total, platform_fee').eq('payment_status', 'paid'),
    ]);

    const totalRevenue = (revenueData ?? []).reduce((s: number, o: any) => s + o.total, 0);
    const totalPlatformFees = (revenueData ?? []).reduce((s: number, o: any) => s + o.platform_fee, 0);
    const totalBuyers = (totalUsers ?? 0) - (totalSellers ?? 0);

    // Monthly stats (last 6 months)
    const now = new Date();
    const monthlyStats = [];

    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const [
        { count: monthOrders },
        { data: monthRevData },
        { count: monthUsers },
        { count: monthSellers },
      ] = await Promise.all([
        supabase.from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('payment_status', 'paid')
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString()),
        supabase.from('orders')
          .select('total, platform_fee')
          .eq('payment_status', 'paid')
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString()),
        supabase.from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString()),
        supabase.from('seller_profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString()),
      ]);

      const monthKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
      const rev = (monthRevData ?? []).reduce((s: number, o: any) => s + o.total, 0);
      const fees = (monthRevData ?? []).reduce((s: number, o: any) => s + o.platform_fee, 0);

      monthlyStats.push({
        month: monthKey,
        orders: monthOrders ?? 0,
        revenue: rev,
        fees,
        new_users: monthUsers ?? 0,
        new_sellers: monthSellers ?? 0,
      });
    }

    const stats: AdminStats = {
      total_users: totalUsers ?? 0,
      total_sellers: totalSellers ?? 0,
      total_buyers: totalBuyers,
      total_products: totalProducts ?? 0,
      total_orders: totalOrders ?? 0,
      total_revenue: totalRevenue,
      total_platform_fees: totalPlatformFees,
      pending_verifications: pendingVerifications ?? 0,
      monthly_stats: monthlyStats,
    };

    return NextResponse.json({ data: stats });
  } catch (err) {
    console.error('GET /api/admin/stats error:', err);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
