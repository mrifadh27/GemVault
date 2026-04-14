import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ data: [] });
  const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
  return NextResponse.json({ data: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, all } = await request.json();
  if (all) { await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id); }
  else if (id) { await supabase.from('notifications').update({ is_read: true }).eq('id', id).eq('user_id', user.id); }
  return NextResponse.json({ message: 'Updated' });
}
