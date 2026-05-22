// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const sellerId = searchParams.get('seller_id');
    if (!sellerId) return NextResponse.json({ error: 'seller_id required' }, { status: 400 });

    const { data, error } = await supabase
      .from('seller_reviews')
      .select('*, reviewer:profiles!seller_reviews_reviewer_id_fkey(id, username, avatar_url, is_verified)')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Aggregate stats
    const reviews = data || [];
    const avg = reviews.length
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : null;
    const breakdown = [5, 4, 3, 2, 1].map(star => ({
      star,
      count: reviews.filter(r => r.rating === star).length,
    }));

    return NextResponse.json({ data: reviews, stats: { avg_rating: avg ? Math.round(avg * 10) / 10 : null, total: reviews.length, breakdown } });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { seller_id, post_id, rating, description_accuracy, photo_accuracy, communication, review_text } = await req.json();
    if (!seller_id || !rating) return NextResponse.json({ error: 'seller_id and rating required' }, { status: 400 });
    if (seller_id === user.id) return NextResponse.json({ error: 'Cannot review yourself' }, { status: 400 });

    const { data, error } = await supabase
      .from('seller_reviews')
      .insert({
        reviewer_id: user.id,
        seller_id,
        post_id: post_id || null,
        rating: Math.min(5, Math.max(1, parseInt(rating))),
        description_accuracy: description_accuracy ? Math.min(5, Math.max(1, parseInt(description_accuracy))) : null,
        photo_accuracy: photo_accuracy ? Math.min(5, Math.max(1, parseInt(photo_accuracy))) : null,
        communication: communication ? Math.min(5, Math.max(1, parseInt(communication))) : null,
        review_text: review_text?.trim() || null,
        is_verified_purchase: !!post_id,
      })
      .select('*, reviewer:profiles!seller_reviews_reviewer_id_fkey(id, username, avatar_url, is_verified)')
      .single();

    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'You have already reviewed this seller for this listing' }, { status: 409 });
      throw error;
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
