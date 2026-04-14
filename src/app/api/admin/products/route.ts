import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function checkAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  return profile?.role === 'admin' ? user : null;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  if (!await checkAdmin(supabase)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') ?? '1');
  const limit = parseInt(searchParams.get('limit') ?? '50');
  const from = (page - 1) * limit;
  const { data, count } = await supabase
    .from('products')
    .select('*, product_images(url, is_primary)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);
  return NextResponse.json({ data: data ?? [], total: count ?? 0 });
}
