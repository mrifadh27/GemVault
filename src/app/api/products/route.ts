import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { generateProductSlug } from '@/lib/utils';
import type { ProductFilters } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '24', 10), 100);
    const from = (page - 1) * limit;

    let query = supabase
      .from('products')
      .select('*, product_images(*)', { count: 'exact' });

    // Own listings (seller dashboard)
    const own = searchParams.get('own');
    if (own === 'true') {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      query = query.eq('seller_id', user.id);
    } else {
      query = query.eq('is_active', true);
    }

    const exclude = searchParams.get('exclude');
    if (exclude) query = query.neq('id', exclude);

    const sellerId = searchParams.get('seller_id');
    if (sellerId) query = query.eq('seller_id', sellerId);

    const search = searchParams.get('search');
    if (search) query = query.ilike('name', `%${search}%`);

    const gemstoneType = searchParams.get('gemstone_type');
    if (gemstoneType) query = query.eq('gemstone_type', gemstoneType);

    const cut = searchParams.get('cut');
    if (cut) query = query.eq('cut', cut);

    const clarity = searchParams.get('clarity');
    if (clarity) query = query.eq('clarity', clarity);

    const certBody = searchParams.get('certification_body');
    if (certBody) query = query.eq('certification_body', certBody);

    const treatment = searchParams.get('treatment');
    if (treatment) query = query.eq('treatment', treatment);

    const minPrice = searchParams.get('min_price');
    if (minPrice) query = query.gte('price', parseFloat(minPrice));

    const maxPrice = searchParams.get('max_price');
    if (maxPrice) query = query.lte('price', parseFloat(maxPrice));

    const minCarat = searchParams.get('min_carat');
    if (minCarat) query = query.gte('carat_weight', parseFloat(minCarat));

    const maxCarat = searchParams.get('max_carat');
    if (maxCarat) query = query.lte('carat_weight', parseFloat(maxCarat));

    const isCertified = searchParams.get('is_certified');
    if (isCertified === 'true') query = query.eq('is_certified', true);

    const isFeatured = searchParams.get('is_featured');
    if (isFeatured === 'true') query = query.eq('is_featured', true);

    const categoryId = searchParams.get('category_id');
    if (categoryId) query = query.eq('category_id', categoryId);

    const sortBy = searchParams.get('sort_by') ?? 'newest';
    switch (sortBy) {
      case 'price_asc': query = query.order('price', { ascending: true }); break;
      case 'price_desc': query = query.order('price', { ascending: false }); break;
      case 'rating': query = query.order('rating', { ascending: false }); break;
      case 'carat_asc': query = query.order('carat_weight', { ascending: true }); break;
      case 'carat_desc': query = query.order('carat_weight', { ascending: false }); break;
      default: query = query.order('created_at', { ascending: false });
    }

    query = query.range(from, from + limit - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      data: data ?? [],
      total: count ?? 0,
      page,
      limit,
      hasMore: (count ?? 0) > from + limit,
    });
  } catch (err) {
    console.error('GET /api/products error:', err);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check seller profile exists and is approved
    const { data: sellerProfile } = await supabase
      .from('seller_profiles')
      .select('id, verification_status')
      .eq('id', user.id)
      .single();

    if (!sellerProfile) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 403 });
    }
    if (sellerProfile.verification_status !== 'approved') {
      return NextResponse.json(
        { error: 'Your seller account is pending verification' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const productId = crypto.randomUUID();
    const slug = generateProductSlug(body.name, productId);

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        id: productId,
        seller_id: user.id,
        name: body.name,
        slug,
        gemstone_type: body.gemstone_type,
        cut: body.cut,
        clarity: body.clarity,
        color_grade: body.color_grade,
        carat_weight: body.carat_weight,
        origin_country: body.origin_country,
        treatment: body.treatment ?? 'None',
        certification_body: body.certification_body ?? 'None',
        certification_number: body.certification_number,
        price: body.price,
        compare_price: body.compare_price,
        cost_price: body.cost_price,
        stock_quantity: body.stock_quantity,
        low_stock_threshold: body.low_stock_threshold ?? 3,
        description: body.description,
        tags: body.tags
          ? body.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
          : [],
        category_id: body.category_id,
        dimensions_mm: body.dimensions_mm,
        weight_grams: body.weight_grams,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    // Insert images if provided
    if (body.image_urls?.length) {
      await supabase.from('product_images').insert(
        body.image_urls.map((url: string, i: number) => ({
          product_id: productId,
          url,
          display_order: i,
          is_primary: i === 0,
        }))
      );
    }

    return NextResponse.json({ data: product }, { status: 201 });
  } catch (err) {
    console.error('POST /api/products error:', err);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
