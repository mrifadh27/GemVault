// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { entity } = body; // 'collection' | 'item'

    if (entity === 'collection') {
      const { name, description, is_public, cover_image_url } = body;
      const { data, error } = await supabase
        .from('gem_collections')
        .update({ name, description, is_public, cover_image_url, updated_at: new Date().toISOString() })
        .eq('id', params.id)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ data });
    }

    if (entity === 'item') {
      const allowed = ['title', 'gemstone_type', 'carat_weight', 'origin_country', 'treatment',
        'certification', 'certification_number', 'purchase_price', 'current_value', 'notes', 'image_url', 'acquired_at'];
      const updates: Record<string, unknown> = {};
      for (const key of allowed) {
        if (key in body) updates[key] = body[key];
      }
      const { data, error } = await supabase
        .from('collection_items')
        .update(updates)
        .eq('id', params.id)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ data });
    }

    return NextResponse.json({ error: 'entity required' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const entity = searchParams.get('entity') || 'collection';

    if (entity === 'collection') {
      const { error } = await supabase
        .from('gem_collections')
        .delete()
        .eq('id', params.id)
        .eq('user_id', user.id);
      if (error) throw error;
    } else {
      // item — verify via collection ownership
      const { data: item } = await supabase
        .from('collection_items')
        .select('collection_id')
        .eq('id', params.id)
        .single();
      if (item) {
        const { data: coll } = await supabase
          .from('gem_collections')
          .select('user_id')
          .eq('id', item.collection_id)
          .single();
        if (!coll || coll.user_id !== user.id) {
          return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }
        await supabase.from('collection_items').delete().eq('id', params.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
