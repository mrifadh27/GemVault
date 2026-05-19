// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: thread } = await supabase
      .from('dm_threads')
      .select(`
        *,
        gem_posts(id, title, price, currency, gemstone_type, carat_weight, gem_images(url, is_primary)),
        buyer:profiles!dm_threads_buyer_id_fkey(id, username, avatar_url, is_verified),
        seller:profiles!dm_threads_seller_id_fkey(id, username, avatar_url, is_verified, whatsapp_number, instagram_handle, telegram_handle)
      `)
      .eq('id', params.id)
      .single();

    if (!thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    if (thread.buyer_id !== user.id && thread.seller_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const unreadField = user.id === thread.buyer_id ? 'buyer_unread' : 'seller_unread';
    await supabase.from('dm_threads').update({ [unreadField]: 0 }).eq('id', params.id);
    await supabase.from('dm_messages').update({ is_read: true }).eq('thread_id', params.id).neq('sender_id', user.id);

    const { data: messages, error } = await supabase
      .from('dm_messages')
      .select('*')
      .eq('thread_id', params.id)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ data: { thread, messages: messages || [] } });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { content, media_url, media_type } = body;

    // Must have either text or media
    if (!content?.trim() && !media_url) {
      return NextResponse.json({ error: 'Content or media required' }, { status: 400 });
    }

    const { data: thread } = await supabase
      .from('dm_threads')
      .select('buyer_id, seller_id, seller_unread, buyer_unread')
      .eq('id', params.id)
      .single();

    if (!thread || (thread.buyer_id !== user.id && thread.seller_id !== user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: message, error } = await supabase
      .from('dm_messages')
      .insert({
        thread_id: params.id,
        sender_id: user.id,
        content: content?.trim() || '',
        media_url: media_url || null,
        media_type: media_type || null,
      })
      .select()
      .single();

    if (error) throw error;

    const isBuyer = user.id === thread.buyer_id;
    await supabase.from('dm_threads').update({
      last_message_at: new Date().toISOString(),
      seller_unread: isBuyer ? (thread.seller_unread || 0) + 1 : thread.seller_unread,
      buyer_unread: !isBuyer ? (thread.buyer_unread || 0) + 1 : thread.buyer_unread,
    }).eq('id', params.id);

    return NextResponse.json({ data: message }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
