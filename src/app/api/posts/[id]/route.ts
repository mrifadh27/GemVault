// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: post, error } = await supabase
      .from('gem_posts')
      .select(`
        *,
        gem_images(*),
        profiles(id, username, full_name, avatar_url, is_verified, location, bio, whatsapp_number, instagram_handle, telegram_handle, total_posts, followers_count)
      `)
      .eq('id', params.id)
      .single();

    if (error || !post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    // Increment view count
    await supabase.from('gem_posts').update({ views_count: (post.views_count || 0) + 1 }).eq('id', params.id);

    let enriched = { ...post, is_liked: false, is_saved: false };
    if (user) {
      const [{ data: like }, { data: save }] = await Promise.all([
        supabase.from('post_likes').select('id').eq('post_id', params.id).eq('user_id', user.id).single(),
        supabase.from('post_saves').select('id').eq('post_id', params.id).eq('user_id', user.id).single(),
      ]);
      enriched.is_liked = !!like;
      enriched.is_saved = !!save;
    }

    return NextResponse.json({ data: enriched });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    const { data, error } = await supabase
      .from('gem_posts')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .eq('seller_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase
      .from('gem_posts')
      .delete()
      .eq('id', params.id)
      .eq('seller_id', user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
