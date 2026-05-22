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

    let query = supabase
      .from('gem_stories')
      .select('*, profiles(id, username, avatar_url, is_verified)')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      // Feed: stories from followed users + own stories
      if (user) {
        const { data: follows } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id);
        const followedIds = [user.id, ...(follows?.map(f => f.following_id) || [])];
        query = query.in('user_id', followedIds);
      }
      query = query.limit(30);
    }

    const { data: stories, error } = await query;
    if (error) throw error;

    // Attach viewed status
    let enriched = stories || [];
    if (user && stories?.length) {
      const storyIds = stories.map(s => s.id);
      const { data: views } = await supabase
        .from('story_views')
        .select('story_id')
        .eq('user_id', user.id)
        .in('story_id', storyIds);
      const viewedSet = new Set(views?.map(v => v.story_id));
      enriched = stories.map(s => ({ ...s, is_viewed: viewedSet.has(s.id) }));
    }

    // Group by user
    const byUser: Record<string, { profile: unknown; stories: unknown[] }> = {};
    for (const s of enriched) {
      if (!byUser[s.user_id]) byUser[s.user_id] = { profile: s.profiles, stories: [] };
      byUser[s.user_id].stories.push(s);
    }

    return NextResponse.json({ data: enriched, grouped: Object.values(byUser) });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { image_url, caption, post_id } = await req.json();
    if (!image_url) return NextResponse.json({ error: 'image_url required' }, { status: 400 });

    const { data, error } = await supabase
      .from('gem_stories')
      .insert({ user_id: user.id, image_url, caption: caption?.trim() || null, post_id: post_id || null })
      .select('*, profiles(id, username, avatar_url, is_verified)')
      .single();

    if (error) throw error;
    return NextResponse.json({ data: { ...data, is_viewed: false } }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH — mark story as viewed
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { story_id } = await req.json();

    await supabase.from('story_views')
      .insert({ story_id, user_id: user.id })
      .select()
      .then(() => {});

    const { count } = await supabase
      .from('story_views')
      .select('*', { count: 'exact', head: true })
      .eq('story_id', story_id);

    await supabase.from('gem_stories').update({ views_count: count ?? 0 }).eq('id', story_id);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE — user deletes own story
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const { error } = await supabase
      .from('gem_stories')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
