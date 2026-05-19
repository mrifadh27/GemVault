// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { target_id } = await request.json();
    if (!target_id) return NextResponse.json({ error: 'target_id required' }, { status: 400 });
    if (user.id === target_id) return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });

    // Insert follow record (user-level client — user can write their own follows)
    const { error: insertError } = await supabase
      .from('follows')
      .insert({ follower_id: user.id, following_id: target_id });

    // 23505 = unique violation (already following) — treat as success
    if (insertError && insertError.code !== '23505') {
      throw new Error(insertError.message);
    }

    // Update cached counters best-effort via RPC (SECURITY DEFINER bypasses RLS)
    // Falls back gracefully — profile API always recomputes real counts anyway
    if (!insertError) {
      await Promise.allSettled([
        supabase.rpc('increment_followers', { target_id, follower_id: user.id }),
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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get('target_id');
    if (!targetId) return NextResponse.json({ error: 'target_id required' }, { status: 400 });

    // Delete follow record
    const { error: deleteError } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', targetId);

    if (deleteError) throw new Error(deleteError.message);

    // Update cached counters best-effort via RPC
    await Promise.allSettled([
      supabase.rpc('decrement_followers', { target_id: targetId, follower_id: user.id }),
    ]);

    return NextResponse.json({ following: false });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
