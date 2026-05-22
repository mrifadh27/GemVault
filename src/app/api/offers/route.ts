// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/offers?post_id=xxx  or  GET /api/offers?role=buyer|seller
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('post_id');
    const role = searchParams.get('role'); // 'buyer' | 'seller'

    let query = supabase
      .from('gem_offers')
      .select(`
        *,
        buyer:profiles!gem_offers_buyer_id_fkey(id, username, avatar_url),
        seller:profiles!gem_offers_seller_id_fkey(id, username, avatar_url),
        gem_posts(id, title, price, currency)
      `)
      .order('created_at', { ascending: false });

    if (postId) {
      query = query.eq('post_id', postId).eq('seller_id', user.id);
    } else if (role === 'buyer') {
      query = query.eq('buyer_id', user.id);
    } else {
      query = query.eq('seller_id', user.id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ data: data || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/offers — create an offer
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { post_id, offer_price, currency, message } = await request.json();

    if (!post_id || !offer_price || offer_price <= 0) {
      return NextResponse.json({ error: 'post_id and a valid offer_price are required' }, { status: 400 });
    }

    // Get seller_id from post
    const { data: post, error: postErr } = await supabase
      .from('gem_posts')
      .select('seller_id, is_sold, price, currency')
      .eq('id', post_id)
      .single();

    if (postErr || !post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    if (post.is_sold) return NextResponse.json({ error: 'Post is already sold' }, { status: 400 });
    if (post.seller_id === user.id) return NextResponse.json({ error: 'Cannot offer on your own listing' }, { status: 400 });

    // Check for existing pending offer
    const { data: existing } = await supabase
      .from('gem_offers')
      .select('id, status')
      .eq('post_id', post_id)
      .eq('buyer_id', user.id)
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'You already have a pending offer on this listing' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('gem_offers')
      .insert({
        post_id,
        buyer_id: user.id,
        seller_id: post.seller_id,
        offer_price: parseFloat(offer_price),
        currency: currency || post.currency || 'USD',
        message: message?.trim() || null,
      })
      .select(`*, buyer:profiles!gem_offers_buyer_id_fkey(id, username, avatar_url)`)
      .single();

    if (error) throw error;

    // Update offers_count on post
    await supabase.rpc('increment_offers_count', { p_post_id: post_id }).catch(() => {
      supabase.from('gem_posts').update({ offers_count: (post.offers_count || 0) + 1 }).eq('id', post_id);
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
