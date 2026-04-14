import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPaymentIntent } from '@/lib/stripe';
import type { CreateOrderInput } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const role = searchParams.get('role');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const limit = parseInt(searchParams.get('limit') ?? '20', 10);
    const from = (page - 1) * limit;
    const statusFilter = searchParams.get('status');

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (id, name, slug, carat_weight, gemstone_type, product_images (url, is_primary)),
          seller_profiles (id, store_name)
        ),
        profiles (id, full_name, email, avatar_url)
      `, { count: 'exact' });

    // Sellers see their own order items' orders
    if (role === 'seller' || (profile?.role === 'seller' && role !== 'admin')) {
      query = supabase
        .from('orders')
        .select(`
          *,
          order_items!inner (
            *,
            products (id, name, slug, carat_weight, gemstone_type, product_images (url, is_primary))
          ),
          profiles (id, full_name, email, avatar_url)
        `, { count: 'exact' })
        .eq('order_items.seller_id', user.id);
    } else if (profile?.role !== 'admin') {
      query = query.eq('buyer_id', user.id);
    }

    if (statusFilter) query = query.eq('status', statusFilter);

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) throw error;
    return NextResponse.json({ data: data ?? [], total: count ?? 0 });
  } catch (err) {
    console.error('GET /api/orders error:', err);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body: CreateOrderInput = await request.json();
    const { items, shipping_address, notes } = body;

    if (!items?.length) {
      return NextResponse.json({ error: 'No items in order' }, { status: 400 });
    }

    // Fetch products and validate stock
    const productIds = items.map((i) => i.product_id);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, price, stock_quantity, seller_id, name, certification_body')
      .in('id', productIds)
      .eq('is_active', true);

    if (productsError) throw productsError;
    if (!products || products.length !== productIds.length) {
      return NextResponse.json({ error: 'One or more products not found or inactive' }, { status: 400 });
    }

    // Check stock
    for (const item of items) {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) continue;
      if (product.stock_quantity < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}` },
          { status: 400 }
        );
      }
    }

    // Fetch platform fee rates per seller
    const sellerIds = [...new Set(products.map((p) => p.seller_id))];
    const { data: sellers } = await supabase
      .from('seller_profiles')
      .select('id, platform_fee_rate, stripe_account_id, stripe_onboarding_complete')
      .in('id', sellerIds);

    const sellerMap = new Map(sellers?.map((s) => [s.id, s]) ?? []);

    // Calculate totals
    let subtotal = 0;
    let totalPlatformFee = 0;

    const orderItemsData = items.map((item) => {
      const product = products.find((p) => p.id === item.product_id)!;
      const seller = sellerMap.get(product.seller_id);
      const feeRate = (seller?.platform_fee_rate ?? 8) / 100;
      const itemSubtotal = product.price * item.quantity;
      const itemFee = Math.round(itemSubtotal * feeRate * 100) / 100;
      const sellerEarnings = itemSubtotal - itemFee;

      subtotal += itemSubtotal;
      totalPlatformFee += itemFee;

      return {
        product_id: item.product_id,
        seller_id: product.seller_id,
        quantity: item.quantity,
        unit_price: product.price,
        subtotal: itemSubtotal,
        platform_fee: itemFee,
        seller_earnings: sellerEarnings,
        status: 'pending',
      };
    });

    const shippingCost = 0; // Free shipping or calculate separately
    const tax = Math.round(subtotal * 0.08 * 100) / 100; // 8% tax example
    const total = subtotal + shippingCost + tax;

    const orderId = crypto.randomUUID();

    // Create PaymentIntent
    const paymentIntent = await createPaymentIntent({
      amount: total,
      currency: 'usd',
      orderId,
      buyerId: user.id,
    });

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        id: orderId,
        buyer_id: user.id,
        status: 'pending_payment',
        subtotal,
        platform_fee: totalPlatformFee,
        shipping_cost: shippingCost,
        tax,
        total,
        currency: 'USD',
        shipping_address,
        payment_intent_id: paymentIntent.id,
        payment_status: 'pending',
        notes,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const { error: itemsError } = await supabase.from('order_items').insert(
      orderItemsData.map((item) => ({ ...item, order_id: orderId }))
    );
    if (itemsError) throw itemsError;

    // Clear cart
    await supabase.from('cart_items').delete().eq('user_id', user.id);

    return NextResponse.json({
      data: {
        order,
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
      },
    }, { status: 201 });
  } catch (err) {
    console.error('POST /api/orders error:', err);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
