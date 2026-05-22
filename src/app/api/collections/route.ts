// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');
    const collectionId = searchParams.get('collection_id');

    if (collectionId) {
      // Get items for a specific collection
      const { data: items, error } = await supabase
        .from('collection_items')
        .select('*')
        .eq('collection_id', collectionId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return NextResponse.json({ data: items || [] });
    }

    // Get collections for a user
    const targetId = userId || user?.id;
    if (!targetId) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

    let query = supabase
      .from('gem_collections')
      .select('*')
      .eq('user_id', targetId)
      .order('created_at', { ascending: false });

    // Only return private collections to owner
    if (targetId !== user?.id) {
      query = query.eq('is_public', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ data: data || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { type } = body; // 'collection' | 'item'

    if (type === 'collection') {
      const { name, description, is_public, cover_image_url } = body;
      const { data, error } = await supabase
        .from('gem_collections')
        .insert({ user_id: user.id, name: name?.trim() || 'My Collection', description, is_public: is_public ?? true, cover_image_url })
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ data }, { status: 201 });
    }

    if (type === 'item') {
      const {
        collection_id, title, gemstone_type, carat_weight, origin_country,
        treatment, certification, certification_number, purchase_price,
        purchase_currency, current_value, notes, image_url, acquired_at, post_id,
      } = body;

      // Verify ownership
      const { data: coll } = await supabase
        .from('gem_collections')
        .select('user_id')
        .eq('id', collection_id)
        .single();
      if (!coll || coll.user_id !== user.id) {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
      }

      const { data, error } = await supabase
        .from('collection_items')
        .insert({
          collection_id, title: title?.trim(), gemstone_type,
          carat_weight: carat_weight ? parseFloat(carat_weight) : null,
          origin_country: origin_country?.trim() || null,
          treatment: treatment || 'None', certification: certification || 'None',
          certification_number: certification_number?.trim() || null,
          purchase_price: purchase_price ? parseFloat(purchase_price) : null,
          purchase_currency: purchase_currency || 'USD',
          current_value: current_value ? parseFloat(current_value) : null,
          notes: notes?.trim() || null, image_url, acquired_at: acquired_at || null,
          post_id: post_id || null,
        })
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ data }, { status: 201 });
    }

    return NextResponse.json({ error: 'type must be collection or item' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
