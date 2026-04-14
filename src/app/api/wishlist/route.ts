import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ data: [] });
  const { data } = await supabase.from('wishlists').select('*, products(*, product_images(*))').eq('user_id', user.id);
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { product_id } = await request.json();
  const { data, error } = await supabase.from('wishlists').insert({ user_id: user.id, product_id }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const product_id = searchParams.get('product_id');
  await supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_id', product_id);
  return NextResponse.json({ message: 'Removed from wishlist' });
}
