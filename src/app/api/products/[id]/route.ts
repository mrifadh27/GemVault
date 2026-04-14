import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Try by slug first, then by ID
    const isUUID = /^[0-9a-f-]{36}$/.test(id);
    const query = supabase
      .from('products')
      .select(`
        *,
        product_images (*),
        seller_profiles (
          id, store_name, store_description, store_logo_url,
          rating, review_count, total_orders, verification_status,
          profiles (full_name, avatar_url)
        )
      `);

    const { data, error } = await (isUUID
      ? query.eq('id', id).single()
      : query.eq('slug', id).single());

    if (error || !data) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    // Check ownership (or admin)
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const { data: product } = await supabase.from('products').select('seller_id').eq('id', id).single();

    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    if (product.seller_id !== user.id && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allowedFields = [
      'name', 'description', 'price', 'compare_price', 'cost_price',
      'stock_quantity', 'low_stock_threshold', 'is_active', 'is_featured',
      'gemstone_type', 'cut', 'clarity', 'color_grade', 'carat_weight',
      'origin_country', 'treatment', 'certification_body', 'certification_number',
      'certificate_url', 'dimensions_mm', 'weight_grams', 'tags', 'category_id',
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) updates[field] = body[field];
    }

    const { data: updated, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Handle image updates
    if (body.image_urls) {
      await supabase.from('product_images').delete().eq('product_id', id);
      if (body.image_urls.length > 0) {
        await supabase.from('product_images').insert(
          body.image_urls.map((url: string, i: number) => ({
            product_id: id,
            url,
            display_order: i,
            is_primary: i === 0,
          }))
        );
      }
    }

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error('PATCH /api/products/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const { data: product } = await supabase.from('products').select('seller_id').eq('id', id).single();

    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    if (product.seller_id !== user.id && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete by deactivating
    const { error } = await supabase.from('products').update({ is_active: false }).eq('id', id);
    if (error) throw error;

    return NextResponse.json({ message: 'Product deactivated' });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
