import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SellerAnalytics } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!['seller', 'admin'].includes(profile?.role ?? '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch order items for this seller (paid orders only)
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(`
        *,
        orders (id, created_at, status, payment_status, buyer_id),
        products (id, name, slug, gemstone_type, carat_weight, cost_price, views_count)
      `)
      .eq('seller_id', user.id)
      .eq('orders.payment_status', 'paid');

    if (itemsError) throw itemsError;
    const items = (orderItems ?? []).filter((i: any) => i.orders?.payment_status === 'paid');

    // Summary
    const totalRevenue = items.reduce((s: number, i: any) => s + i.subtotal, 0);
    const totalOrders = new Set(items.map((i: any) => i.order_id)).size;
    const totalPlatformFees = items.reduce((s: number, i: any) => s + i.platform_fee, 0);
    const netEarnings = items.reduce((s: number, i: any) => s + i.seller_earnings, 0);

    // Views count from products
    const { data: products } = await supabase
      .from('products')
      .select('id, name, views_count, sales_count, price, cost_price, gemstone_type')
      .eq('seller_id', user.id)
      .eq('is_active', true);

    const totalViews = (products ?? []).reduce((s, p: any) => s + p.views_count, 0);
    const conversionRate = totalViews > 0 ? (totalOrders / totalViews) * 100 : 0;

    // Monthly revenue (last 6 months)
    const monthlyMap: Record<string, { revenue: number; orders: Set<string>; fees: number; earnings: number }> = {};
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap[key] = { revenue: 0, orders: new Set(), fees: 0, earnings: 0 };
    }

    for (const item of items) {
      const date = new Date((item as any).orders.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap[key]) {
        monthlyMap[key].revenue += item.subtotal;
        monthlyMap[key].orders.add(item.order_id);
        monthlyMap[key].fees += item.platform_fee;
        monthlyMap[key].earnings += item.seller_earnings;
      }
    }

    const monthlyRevenue = Object.entries(monthlyMap).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      orders: data.orders.size,
      fees: data.fees,
      earnings: data.earnings,
    }));

    // Top products by revenue
    const productRevMap: Record<string, { id: string; name: string; revenue: number; count: number }> = {};
    for (const item of items) {
      const pid = item.product_id;
      const prod = (item as any).products;
      if (!productRevMap[pid]) {
        productRevMap[pid] = { id: pid, name: prod?.name ?? 'Unknown', revenue: 0, count: 0 };
      }
      productRevMap[pid].revenue += item.subtotal;
      productRevMap[pid].count += item.quantity;
    }

    const topProducts = Object.values(productRevMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((p) => {
        const product = products?.find((pr: any) => pr.id === p.id);
        return {
          id: p.id,
          name: p.name,
          sales_count: p.count,
          revenue: p.revenue,
          views: product?.views_count ?? 0,
          profit: product?.cost_price
            ? p.revenue - product.cost_price * p.count
            : undefined,
        };
      });

    // Sales by gemstone type
    const gemMap: Record<string, { count: number; revenue: number }> = {};
    for (const item of items) {
      const gemType = (item as any).products?.gemstone_type ?? 'Unknown';
      if (!gemMap[gemType]) gemMap[gemType] = { count: 0, revenue: 0 };
      gemMap[gemType].count += item.quantity;
      gemMap[gemType].revenue += item.subtotal;
    }

    const salesByGemstone = Object.entries(gemMap)
      .map(([gemstone_type, data]) => ({ gemstone_type, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    // Pending payout
    const { data: payouts } = await supabase
      .from('payouts')
      .select('amount, status')
      .eq('seller_id', user.id)
      .in('status', ['pending', 'processing']);
    const pendingPayout = (payouts ?? []).reduce((s, p: any) => s + p.amount, 0);

    // Recent orders
    const recentOrderIds = [...new Set(items.slice(0, 20).map((i: any) => i.order_id))];
    const { data: recentOrders } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*, products (id, name, carat_weight, gemstone_type)),
        profiles (full_name, email, avatar_url)
      `)
      .in('id', recentOrderIds)
      .order('created_at', { ascending: false })
      .limit(10);

    const analytics: SellerAnalytics = {
      summary: {
        total_revenue: totalRevenue,
        total_orders: totalOrders,
        total_platform_fees: totalPlatformFees,
        net_earnings: netEarnings,
        avg_order_value: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        conversion_rate: conversionRate,
        total_views: totalViews,
      },
      monthly_revenue: monthlyRevenue,
      top_products: topProducts,
      sales_by_gemstone: salesByGemstone,
      recent_orders: (recentOrders ?? []) as any,
      pending_payout: pendingPayout,
    };

    return NextResponse.json({ data: analytics });
  } catch (err) {
    console.error('GET /api/seller/analytics error:', err);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
