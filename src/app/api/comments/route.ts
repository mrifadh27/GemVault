// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/comments?post_id=xxx
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('post_id');

    if (!postId) return NextResponse.json({ error: 'post_id required' }, { status: 400 });

    const { data: { user } } = await supabase.auth.getUser();

    // Fetch top-level comments with profiles
    const { data: comments, error } = await supabase
      .from('post_comments')
      .select(`
        *,
        profiles(id, username, avatar_url, is_verified)
      `)
      .eq('post_id', postId)
      .is('parent_id', null)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Fetch replies
    const commentIds = (comments || []).map(c => c.id);
    let replies = [];
    if (commentIds.length > 0) {
      const { data: repliesData } = await supabase
        .from('post_comments')
        .select(`*, profiles(id, username, avatar_url, is_verified)`)
        .in('parent_id', commentIds)
        .order('created_at', { ascending: true });
      replies = repliesData || [];
    }

    // Attach like status and replies
    let enriched = comments || [];
    if (user && comments?.length) {
      const allIds = [...commentIds, ...replies.map(r => r.id)];
      const { data: likedData } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .eq('user_id', user.id)
        .in('comment_id', allIds);
      const likedSet = new Set(likedData?.map(l => l.comment_id));

      const enrichedReplies = replies.map(r => ({ ...r, is_liked: likedSet.has(r.id) }));
      enriched = comments.map(c => ({
        ...c,
        is_liked: likedSet.has(c.id),
        replies: enrichedReplies.filter(r => r.parent_id === c.id),
      }));
    } else {
      enriched = comments.map(c => ({
        ...c,
        replies: replies.filter(r => r.parent_id === c.id),
      }));
    }

    return NextResponse.json({ data: enriched });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/comments
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { post_id, content, parent_id } = await request.json();
    if (!post_id || !content?.trim()) {
      return NextResponse.json({ error: 'post_id and content required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('post_comments')
      .insert({ post_id, user_id: user.id, content: content.trim(), parent_id: parent_id || null })
      .select(`*, profiles(id, username, avatar_url, is_verified)`)
      .single();

    if (error) throw error;
    return NextResponse.json({ data: { ...data, is_liked: false, replies: [] } }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/comments?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const { error } = await supabase
      .from('post_comments')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/comments — toggle like on a comment
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { comment_id, liked } = await request.json();

    if (liked) {
      await supabase.from('comment_likes').delete().eq('comment_id', comment_id).eq('user_id', user.id);
    } else {
      await supabase.from('comment_likes').insert({ comment_id, user_id: user.id }).select();
    }

    const { count } = await supabase
      .from('comment_likes')
      .select('*', { count: 'exact', head: true })
      .eq('comment_id', comment_id);

    await supabase.from('post_comments').update({ likes_count: count ?? 0 }).eq('id', comment_id);

    return NextResponse.json({ liked: !liked, likes_count: count ?? 0 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
