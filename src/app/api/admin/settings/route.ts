import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function checkAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  return p?.role === 'admin' ? user : null;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  if (!await checkAdmin(supabase)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { data } = await supabase.from('platform_settings').select('*');
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  if (!await checkAdmin(supabase)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await request.json();
  for (const [key, value] of Object.entries(body)) {
    await supabase.from('platform_settings').upsert({ key, value }, { onConflict: 'key' });
  }
  return NextResponse.json({ message: 'Settings updated' });
}
