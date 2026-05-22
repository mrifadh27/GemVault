// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: group, error } = await supabase
      .from('gem_groups')
      .select('*')
      .eq('slug', params.id)
      .single();

    if (error || !group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

    // Membership
    let is_member = false;
    let member_role = null;
    if (user) {
      const { data: m } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .single();
      is_member = !!m;
      member_role = m?.role || null;
    }

    // Recent posts
    const { data: groupPosts } = await supabase
      .from('group_posts')
      .select(`
        *,
        gem_posts(
          id, title, price, currency, gemstone_type, carat_weight, origin_country,
          likes_count, views_count, created_at,
          gem_images(url, is_primary),
          profiles(id, username, avatar_url, is_verified)
        )
      `)
      .eq('group_id', group.id)
      .order('created_at', { ascending: false })
      .limit(20);

    // Top members
    const { data: members } = await supabase
      .from('group_members')
      .select('role, joined_at, profiles(id, username, avatar_url, is_verified)')
      .eq('group_id', group.id)
      .order('joined_at', { ascending: true })
      .limit(12);

    return NextResponse.json({
      data: {
        ...group,
        is_member,
        member_role,
        recent_posts: groupPosts?.map(gp => gp.gem_posts).filter(Boolean) || [],
        members: members || [],
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
