// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const sellerId = searchParams.get('seller_id');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const { data: { user } } = await supabase.auth.getUser();

    let query = supabase
      .from('gem_posts')
      .select(`
        *,
        gem_images(*),
        profiles(id, username, full_name, avatar_url, is_verified, location, whatsapp_number, instagram_handle, telegram_handle)
      `)
      .eq('is_active', true);

    if (category && category !== 'all') query = query.eq('category_slug', category);
    if (sellerId) query = query.eq('seller_id', sellerId);
    if (search) query = query.ilike('title', `%${search}%`);

    if (sort === 'newest') query = query.order('created_at', { ascending: false });
    else if (sort === 'popular') query = query.order('likes_count', { ascending: false });
    else if (sort === 'price_asc') query = query.order('price', { ascending: true, nullsFirst: false });
    else if (sort === 'price_desc') query = query.order('price', { ascending: false, nullsFirst: false });

    const { data: posts, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Attach like/save status if user is logged in
    let enriched = posts || [];
    if (user && posts?.length) {
      const postIds = posts.map(p => p.id);

      const [{ data: likes }, { data: saves }] = await Promise.all([
        supabase.from('post_likes').select('post_id').eq('user_id', user.id).in('post_id', postIds),
        supabase.from('post_saves').select('post_id').eq('user_id', user.id).in('post_id', postIds),
      ]);

      const likedSet = new Set(likes?.map(l => l.post_id));
      const savedSet = new Set(saves?.map(s => s.post_id));

      enriched = posts.map(p => ({
        ...p,
        is_liked: likedSet.has(p.id),
        is_saved: savedSet.has(p.id),
      }));
    }

    const total = count ?? posts?.length ?? 0;
    return NextResponse.json({
      data: enriched,
      total,
      hasMore: offset + limit < total,
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // ─── FIX: Ensure a profiles row exists before inserting the post ───────────
    // The on_auth_user_created trigger can silently fail (e.g. username conflict,
    // Google OAuth race). Without a matching profiles row, gem_posts.seller_id
    // violates the foreign key constraint "gem_posts_seller_id_fkey".
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!existingProfile) {
      const emailBase = (user.email ?? '').split('@')[0];
      const cleanBase = emailBase.replace(/[^a-z0-9_]/gi, '').toLowerCase().slice(0, 15) || 'gem';
      const username = `${cleanBase}_${user.id.substring(0, 8)}`;

      const { error: profileError } = await supabase.from('profiles').insert({
        id: user.id,
        username,
        full_name:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          emailBase ||
          'GemGram User',
        avatar_url:
          user.user_metadata?.avatar_url ||
          user.user_metadata?.picture ||
          null,
      });

      if (profileError) {
        // If it's a unique-username conflict, try once more with full UUID suffix
        if (profileError.code !== '23505') {
          return NextResponse.json(
            { error: 'Could not create user profile: ' + profileError.message },
            { status: 500 }
          );
        }
        // 23505 = duplicate key — profile was created by a concurrent request; continue
      }
    }
    // ──────────────────────────────────────────────────────────────────────────

    const body = await request.json();
    const {
      title, description, gemstone_type, category_slug, carat_weight,
      origin_country, treatment, certification, certification_number,
      price, currency, is_price_negotiable, tags, image_urls,
    } = body;

    if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    if (!gemstone_type) return NextResponse.json({ error: 'Gemstone type is required' }, { status: 400 });

    // Insert post
    const { data: post, error: postError } = await supabase
      .from('gem_posts')
      .insert({
        seller_id: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        gemstone_type,
        category_slug: category_slug || 'other',
        carat_weight: carat_weight ? parseFloat(carat_weight) : null,
        origin_country: origin_country?.trim() || null,
        treatment: treatment || 'None',
        certification: certification || 'None',
        certification_number: certification_number?.trim() || null,
        price: price ? parseFloat(price) : null,
        currency: currency || 'USD',
        is_price_negotiable: is_price_negotiable ?? false,
        tags: tags || [],
      })
      .select()
      .single();

    if (postError) throw postError;

    // Insert images
    if (image_urls && image_urls.length > 0) {
      const imageRecords = image_urls.map((url: string, i: number) => ({
        post_id: post.id,
        url,
        is_primary: i === 0,
        display_order: i,
      }));
      const { error: imgError } = await supabase.from('gem_images').insert(imageRecords);
      if (imgError) console.error('Image insert error:', imgError);
    }

    // Update total_posts count on the seller's profile (re-count from real data)
    const { count: postCount } = await supabase
      .from('gem_posts')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', user.id)
      .eq('is_active', true);

    await supabase
      .from('profiles')
      .update({ total_posts: postCount ?? 1 })
      .eq('id', user.id);

    return NextResponse.json({ data: post }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}