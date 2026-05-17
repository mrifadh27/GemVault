// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: threads, error } = await supabase
      .from('dm_threads')
      .select(`
        *,
        gem_posts(id, title, price, currency, gem_images(url, is_primary)),
        buyer:profiles!dm_threads_buyer_id_fkey(id, username, avatar_url, is_verified),
        seller:profiles!dm_threads_seller_id_fkey(id, username, avatar_url, is_verified)
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false });

    if (error) throw error;

    // Get last message for each thread
    const threadIds = (threads || []).map((t) => t.id);
    let threadsWithLastMsg = threads || [];

    if (threadIds.length > 0) {
      const lastMessages = await Promise.all(
        threadIds.map((id) =>
          supabase
            .from('dm_messages')
            .select('id, content, sender_id, created_at, is_read')
            .eq('thread_id', id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
            .then((r) => ({ thread_id: id, message: r.data }))
        )
      );
      const msgMap = Object.fromEntries(lastMessages.map((m) => [m.thread_id, m.message]));
      threadsWithLastMsg = (threads || []).map((t) => ({ ...t, last_message: msgMap[t.id] }));
    }

    return NextResponse.json({ data: threadsWithLastMsg });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { post_id, seller_id, message } = await request.json();

    if (!seller_id) return NextResponse.json({ error: 'Seller ID required' }, { status: 400 });
    if (!message?.trim()) return NextResponse.json({ error: 'Message required' }, { status: 400 });
    if (user.id === seller_id) return NextResponse.json({ error: 'Cannot DM yourself' }, { status: 400 });

    // Check if thread already exists
    let existing = null;
    if (post_id) {
      const { data } = await supabase
        .from('dm_threads')
        .select('id')
        .eq('buyer_id', user.id)
        .eq('seller_id', seller_id)
        .eq('post_id', post_id)
        .maybeSingle();
      existing = data;
    } else {
      const { data } = await supabase
        .from('dm_threads')
        .select('id')
        .eq('buyer_id', user.id)
        .eq('seller_id', seller_id)
        .maybeSingle();
      existing = data;
    }

    let threadId: string;

    if (existing) {
      threadId = existing.id;
    } else {
      const { data: thread, error: threadError } = await supabase
        .from('dm_threads')
        .insert({
          post_id: post_id || null,
          buyer_id: user.id,
          seller_id,
          initial_message: message.trim(),
          seller_unread: 1,
          buyer_unread: 0,
        })
        .select('id')
        .single();

      if (threadError) throw threadError;
      threadId = thread.id;
    }

    const { data: msg, error: msgError } = await supabase
      .from('dm_messages')
      .insert({ thread_id: threadId, sender_id: user.id, content: message.trim() })
      .select()
      .single();

    if (msgError) throw msgError;

    await supabase
      .from('dm_threads')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', threadId);

    return NextResponse.json({ data: { thread_id: threadId, message: msg } }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
