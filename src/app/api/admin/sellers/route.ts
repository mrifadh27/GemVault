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

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = parseInt(searchParams.get('limit') ?? '50', 10);
  const from = (page - 1) * limit;

  let query = supabase
    .from('seller_profiles')
    .select('*, profiles(email, full_name, avatar_url)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (status) query = query.eq('verification_status', status);

  const { data, count, error } = await query.range(from, from + limit - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: data ?? [], total: count ?? 0 });
}
