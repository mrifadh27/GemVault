// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase
      .from('post_likes')
      .insert({ post_id: params.id, user_id: user.id });

    if (error && error.code !== '23505') throw error; // ignore duplicate

    // Increment likes_count — re-count from real data so it never drifts
    if (!error) {
      const { count } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', params.id);

      await supabase
        .from('gem_posts')
        .update({ likes_count: count ?? 0 })
        .eq('id', params.id);
    }

    return NextResponse.json({ liked: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', params.id)
      .eq('user_id', user.id);

    // Re-count from real data
    const { count } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', params.id);

    await supabase
      .from('gem_posts')
      .update({ likes_count: count ?? 0 })
      .eq('id', params.id);

    return NextResponse.json({ liked: false });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
