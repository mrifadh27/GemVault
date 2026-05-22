// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const mine = searchParams.get('mine') === 'true';

    let query = supabase
      .from('gem_groups')
      .select('*')
      .order('member_count', { ascending: false });

    if (search) query = query.ilike('name', `%${search}%`);

    const { data: groups, error } = await query;
    if (error) throw error;

    let enriched = groups || [];

    if (user && groups?.length) {
      const groupIds = groups.map(g => g.id);
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id, role')
        .eq('user_id', user.id)
        .in('group_id', groupIds);

      const memberMap = new Map(memberships?.map(m => [m.group_id, m.role]));
      enriched = groups.map(g => ({
        ...g,
        is_member: memberMap.has(g.id),
        member_role: memberMap.get(g.id) || null,
      }));
    }

    if (mine && user) {
      enriched = enriched.filter(g => g.is_member);
    }

    return NextResponse.json({ data: enriched });
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
    const { action } = body;

    if (action === 'join') {
      const { group_id } = body;
      const { error } = await supabase
        .from('group_members')
        .insert({ group_id, user_id: user.id, role: 'member' });
      if (error && error.code !== '23505') throw error;
      return NextResponse.json({ success: true, is_member: true });
    }

    if (action === 'leave') {
      const { group_id } = body;
      await supabase.from('group_members').delete().eq('group_id', group_id).eq('user_id', user.id);
      return NextResponse.json({ success: true, is_member: false });
    }

    if (action === 'create') {
      const { name, description, icon, category, is_private, cover_image_url } = body;
      if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 });

      const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const { data, error } = await supabase
        .from('gem_groups')
        .insert({ name: name.trim(), slug, description, icon: icon || '💎', category: category || 'general', is_private: is_private || false, cover_image_url, created_by: user.id })
        .select()
        .single();
      if (error) throw error;

      // Creator becomes admin
      await supabase.from('group_members').insert({ group_id: data.id, user_id: user.id, role: 'admin' });
      return NextResponse.json({ data: { ...data, is_member: true, member_role: 'admin' } }, { status: 201 });
    }

    if (action === 'add_post') {
      const { group_id, post_id } = body;
      const { data: membership } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', group_id)
        .eq('user_id', user.id)
        .single();
      if (!membership) return NextResponse.json({ error: 'Join the group first' }, { status: 403 });

      const { error } = await supabase
        .from('group_posts')
        .insert({ group_id, post_id, posted_by: user.id });
      if (error && error.code !== '23505') throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
