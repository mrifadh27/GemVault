// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const sellerId = searchParams.get('seller_id') || user.id;

    // Only allow viewing own analytics or public profiles
    if (sellerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const [
      { data: posts },
      { data: reviews },
      { data: offers },
    ] = await Promise.all([
      supabase
        .from('gem_posts')
        .select('id, title, views_count, likes_count, dm_count, is_sold, is_active, created_at, price, currency')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false }),
      supabase
        .from('seller_reviews')
        .select('rating, description_accuracy, photo_accuracy, communication, created_at')
        .eq('seller_id', sellerId),
      supabase
        .from('gem_offers')
        .select('id, status, offer_price, created_at')
        .eq('seller_id', sellerId),
    ]);

    const allPosts = posts || [];
    const activePosts = allPosts.filter(p => p.is_active && !p.is_sold);
    const soldPosts = allPosts.filter(p => p.is_sold);

    // Get saves count
    const postIds = allPosts.map(p => p.id);
    const { count: savedCount } = await supabase
      .from('post_saves')
      .select('*', { count: 'exact', head: true })
      .in('post_id', postIds);

    const totalViews = allPosts.reduce((s, p) => s + (p.views_count || 0), 0);
    const totalLikes = allPosts.reduce((s, p) => s + (p.likes_count || 0), 0);
    const totalDMs = allPosts.reduce((s, p) => s + (p.dm_count || 0), 0);

    // Compute views by day (last 30 days) — approximate from created_at distribution
    // In a full implementation you'd have a view_events table; here we distribute evenly
    const viewsByDay: { date: string; views: number }[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      // Count posts created on this day and sum their views
      const dayPosts = allPosts.filter(p => p.created_at?.slice(0, 10) === dateStr);
      viewsByDay.push({ date: dateStr, views: dayPosts.reduce((s, p) => s + (p.views_count || 0), 0) });
    }

    const topPosts = [...allPosts]
      .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
      .slice(0, 5)
      .map(p => ({ id: p.id, title: p.title, views: p.views_count || 0, likes: p.likes_count || 0 }));

    const engagementRate = totalViews > 0
      ? Math.round(((totalLikes + totalDMs) / totalViews) * 100 * 10) / 10
      : 0;

    return NextResponse.json({
      data: {
        total_views: totalViews,
        total_likes: totalLikes,
        total_dms: totalDMs,
        total_offers: offers?.length || 0,
        active_listings: activePosts.length,
        sold_listings: soldPosts.length,
        saved_count: savedCount || 0,
        views_by_day: viewsByDay,
        top_posts: topPosts,
        engagement_rate: engagementRate,
        reviews: reviews || [],
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
