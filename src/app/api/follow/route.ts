// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/follows?target_id=xxx  →  { following: boolean }
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get('target_id');

    if (!targetId) {
      return NextResponse.json({ error: 'target_id required' }, { status: 400 });
    }

    let following = false;
    if (user) {
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetId)
        .maybeSingle();
      following = !!data;
    }

    return NextResponse.json({ following });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/follows  →  follow someone
// body: { target_id: string }
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // Verify auth with regular client (respects cookies/session)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { target_id } = await request.json();
    if (!target_id) {
      return NextResponse.json({ error: 'target_id required' }, { status: 400 });
    }
    if (user.id === target_id) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
    }

    // Use service client for DB writes — bypasses RLS so we can update
    // both the follower's following_count AND the target's followers_count.
    const svc = await createServiceClient();

    // Insert the follow record (ignore duplicate follows)
    const { error: insertError } = await svc
      .from('follows')
      .insert({ follower_id: user.id, following_id: target_id });

    if (insertError && insertError.code !== '23505') {
      throw new Error(insertError.message);
    }

    // Only update counters on a fresh follow (not a duplicate)
    if (!insertError) {
      // Fetch current counts
      const [{ data: me }, { data: them }] = await Promise.all([
        svc.from('profiles').select('following_count').eq('id', user.id).single(),
        svc.from('profiles').select('followers_count').eq('id', target_id).single(),
      ]);

      // Update both counters in parallel
      await Promise.all([
        svc.from('profiles')
          .update({ following_count: (me?.following_count ?? 0) + 1 })
          .eq('id', user.id),
        svc.from('profiles')
          .update({ followers_count: (them?.followers_count ?? 0) + 1 })
          .eq('id', target_id),
      ]);
    }

    return NextResponse.json({ following: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/follows?target_id=xxx  →  unfollow someone
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  try {
    // Verify auth with regular client
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get('target_id');
    if (!targetId) {
      return NextResponse.json({ error: 'target_id required' }, { status: 400 });
    }

    // Use service client to bypass RLS for cross-user profile updates
    const svc = await createServiceClient();

    // Remove the follow record
    const { error: deleteError } = await svc
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', targetId);

    if (deleteError) throw new Error(deleteError.message);

    // Decrement counters (never go below 0)
    const [{ data: me }, { data: them }] = await Promise.all([
      svc.from('profiles').select('following_count').eq('id', user.id).single(),
      svc.from('profiles').select('followers_count').eq('id', targetId).single(),
    ]);

    await Promise.all([
      svc.from('profiles')
        .update({ following_count: Math.max(0, (me?.following_count ?? 1) - 1) })
        .eq('id', user.id),
      svc.from('profiles')
        .update({ followers_count: Math.max(0, (them?.followers_count ?? 1) - 1) })
        .eq('id', targetId),
    ]);

    return NextResponse.json({ following: false });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}