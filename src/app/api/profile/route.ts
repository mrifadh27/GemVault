// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const id = searchParams.get('id');

    if (!username && !id) return NextResponse.json({ error: 'username or id required' }, { status: 400 });

    let query = supabase.from('profiles').select('*');
    if (username) query = query.eq('username', username);
    else query = query.eq('id', id!);

    const { data, error } = await query.single();
    if (error || !data) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    return NextResponse.json({ data });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const allowed = ['username', 'full_name', 'bio', 'avatar_url', 'whatsapp_number', 'instagram_handle', 'telegram_handle', 'location'];
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    // Check username uniqueness
    if (updates.username) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', updates.username)
        .neq('id', user.id)
        .single();
      if (existing) return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
