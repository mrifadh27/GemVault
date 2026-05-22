// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const gemType = searchParams.get('gemstone_type');
    const days = parseInt(searchParams.get('days') || '90');

    const since = new Date();
    since.setDate(since.getDate() - days);

    let query = supabase
      .from('gem_posts')
      .select('gemstone_type, price, carat_weight, currency, created_at, origin_country, treatment')
      .eq('is_active', true)
      .not('price', 'is', null)
      .not('carat_weight', 'is', null)
      .gt('carat_weight', 0)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: true });

    if (gemType) query = query.eq('gemstone_type', gemType);

    const { data: posts, error } = await query;
    if (error) throw error;

    const allPosts = posts || [];

    // Group by gemstone_type → compute avg price/ct
    const typeMap: Record<string, { prices: number[]; count: number }> = {};
    for (const p of allPosts) {
      if (!p.price || !p.carat_weight) continue;
      const ppc = p.price / p.carat_weight;
      if (!typeMap[p.gemstone_type]) typeMap[p.gemstone_type] = { prices: [], count: 0 };
      typeMap[p.gemstone_type].prices.push(ppc);
      typeMap[p.gemstone_type].count++;
    }

    const summary = Object.entries(typeMap).map(([type, { prices, count }]) => ({
      gemstone_type: type,
      avg_price_per_carat: Math.round(prices.reduce((s, p) => s + p, 0) / prices.length),
      listing_count: count,
      min_price_per_carat: Math.round(Math.min(...prices)),
      max_price_per_carat: Math.round(Math.max(...prices)),
    })).sort((a, b) => b.listing_count - a.listing_count);

    // Time-series: weekly buckets per gem type (for chart)
    const timeSeries: Record<string, { week: string; avg_ppc: number; count: number }[]> = {};

    if (gemType) {
      const weekMap: Record<string, number[]> = {};
      for (const p of allPosts) {
        if (!p.price || !p.carat_weight) continue;
        const week = getWeekStr(p.created_at);
        if (!weekMap[week]) weekMap[week] = [];
        weekMap[week].push(p.price / p.carat_weight);
      }
      timeSeries[gemType] = Object.entries(weekMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([week, ppcs]) => ({
          week,
          avg_ppc: Math.round(ppcs.reduce((s, v) => s + v, 0) / ppcs.length),
          count: ppcs.length,
        }));
    }

    // Origin breakdown
    const originMap: Record<string, { count: number; avg_ppc: number }> = {};
    for (const p of allPosts) {
      if (!p.origin_country || !p.price || !p.carat_weight) continue;
      if (!originMap[p.origin_country]) originMap[p.origin_country] = { count: 0, avg_ppc: 0 };
      originMap[p.origin_country].count++;
      originMap[p.origin_country].avg_ppc += p.price / p.carat_weight;
    }
    const originBreakdown = Object.entries(originMap)
      .map(([country, { count, avg_ppc }]) => ({
        country,
        count,
        avg_ppc: Math.round(avg_ppc / count),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json({ data: { summary, time_series: timeSeries, origin_breakdown: originBreakdown } });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function getWeekStr(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString().slice(0, 10);
}
