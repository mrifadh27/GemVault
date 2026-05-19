// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/dm
// Returns all DM threads for the currently authenticated user,
// with buyer/seller profiles, gem post preview, and last message.
// ─────────────────────────────────────────────────────────────────────────────
export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch all threads where this user is buyer OR seller
    const { data: threads, error: threadErr } = await supabase
      .from('dm_threads')
      .select(
        `
        *,
        gem_posts(id, title, price, currency, gem_images(url, is_primary)),
        buyer:profiles!dm_threads_buyer_id_fkey(
          id, username, full_name, avatar_url, is_verified
        ),
        seller:profiles!dm_threads_seller_id_fkey(
          id, username, full_name, avatar_url, is_verified,
          whatsapp_number, instagram_handle, telegram_handle
        )
      `
      )
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false });

    if (threadErr) throw threadErr;

    const list = threads || [];

    // Attach the most recent message per thread (single extra query)
    let enriched = list;
    if (list.length > 0) {
      const threadIds = list.map((t) => t.id);
      const { data: recentMsgs } = await supabase
        .from('dm_messages')
        .select('*')
        .in('thread_id', threadIds)
        .order('created_at', { ascending: false });

      // Keep only the first (newest) message for each thread
      const lastByThread = new Map();
      for (const msg of recentMsgs || []) {
        if (!lastByThread.has(msg.thread_id)) {
          lastByThread.set(msg.thread_id, msg);
        }
      }

      enriched = list.map((t) => ({
        ...t,
        last_message: lastByThread.get(t.id) ?? null,
      }));
    }

    return NextResponse.json({ data: enriched });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/dm
// Create (or reuse) a DM thread and send the first message.
// Body: { seller_id: string; message: string; post_id?: string }
//
// Called from:
//   • DMModal        → { post_id, seller_id, message }
//   • ProfileDMModal → { seller_id, message }   (no post_id)
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { seller_id, message, post_id } = body;

    // ── Validation ───────────────────────────────────────────
    if (!seller_id?.trim()) {
      return NextResponse.json({ error: 'seller_id required' }, { status: 400 });
    }
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message content required' }, { status: 400 });
    }
    if (user.id === seller_id) {
      return NextResponse.json({ error: 'Cannot DM yourself' }, { status: 400 });
    }

    // ── Find or create thread ────────────────────────────────
    let threadId;

    // Build query to check for an existing thread
    let existingQuery = supabase
      .from('dm_threads')
      .select('id, seller_unread')
      .eq('buyer_id', user.id)
      .eq('seller_id', seller_id);

    if (post_id) {
      existingQuery = existingQuery.eq('post_id', post_id);
    } else {
      existingQuery = existingQuery.is('post_id', null);
    }

    const { data: existing } = await existingQuery.maybeSingle();

    if (existing) {
      // Reuse the existing thread
      threadId = existing.id;

      // Increment seller unread + update last_message_at
      await supabase
        .from('dm_threads')
        .update({
          last_message_at: new Date().toISOString(),
          seller_unread: (existing.seller_unread ?? 0) + 1,
        })
        .eq('id', threadId);
    } else {
      // Create a brand-new thread
      const { data: newThread, error: threadErr } = await supabase
        .from('dm_threads')
        .insert({
          buyer_id: user.id,
          seller_id,
          post_id: post_id ?? null,
          initial_message: message.trim(),
          seller_unread: 1,
          buyer_unread: 0,
          last_message_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (threadErr) throw threadErr;
      threadId = newThread.id;

      // Increment dm_count on the post (best-effort — ignore errors)
      if (post_id) {
        const { data: postRow } = await supabase
          .from('gem_posts')
          .select('dm_count')
          .eq('id', post_id)
          .single();

        await supabase
          .from('gem_posts')
          .update({ dm_count: (postRow?.dm_count ?? 0) + 1 })
          .eq('id', post_id);
      }
    }

    // ── Insert the message into dm_messages ──────────────────
    const { data: msg, error: msgErr } = await supabase
      .from('dm_messages')
      .insert({
        thread_id: threadId,
        sender_id: user.id,
        content: message.trim(),
        is_read: false,
      })
      .select()
      .single();

    if (msgErr) throw msgErr;

    return NextResponse.json(
      { data: { thread_id: threadId, id: threadId, message: msg } },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}