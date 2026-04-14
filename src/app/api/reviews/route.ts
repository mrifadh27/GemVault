import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');
    const sellerId = searchParams.get('seller_id');

    let query = supabase
      .from('reviews')
      .select(`
        *,
        profiles (id, full_name, avatar_url)
      `)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (productId) query = query.eq('product_id', productId);
    if (sellerId) query = query.eq('seller_id', sellerId);

    const { data, error } = await query.limit(50);
    if (error) throw error;

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { product_id, rating, title, body: reviewBody } = body;

    if (!product_id || !rating) {
      return NextResponse.json({ error: 'product_id and rating are required' }, { status: 400 });
    }

    // Verify buyer has purchased the product
    const { data: orderItem } = await supabase
      .from('order_items')
      .select('id, seller_id')
      .eq('product_id', product_id)
      .eq('status', 'delivered')
      .eq('orders.buyer_id', user.id)
      .maybeSingle();

    // Get product's seller
    const { data: product } = await supabase
      .from('products')
      .select('seller_id')
      .eq('id', product_id)
      .single();

    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    // Check for existing review
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('product_id', product_id)
      .eq('buyer_id', user.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 400 });
    }

    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        product_id,
        buyer_id: user.id,
        seller_id: product.seller_id,
        order_item_id: orderItem?.id ?? null,
        rating,
        title: title ?? null,
        body: reviewBody ?? null,
        is_verified_purchase: !!orderItem,
        is_approved: true, // Auto-approve; set false to require moderation
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data: review }, { status: 201 });
  } catch (err) {
    console.error('POST /api/reviews error:', err);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
